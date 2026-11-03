import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { cameraChangedAfterInput } from './camera-observation.mjs';

const [baseUrl, output] = process.argv.slice(2);
assert(baseUrl && output, '需要 URL 和输出路径');
const report = {baseUrl, startedAt: new Date().toISOString(), operations: [], network: [], console: [], errors: []};
const save = () => writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
const record = (name, data) => { report.operations.push({name, at: new Date().toISOString(), ...data}); save(); };
const executablePath = process.env.FE_BASE_CHROME;
assert(executablePath, '必须明确 FE_BASE_CHROME');
const args = ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({executablePath, headless: true, args});
try {
  report.environment = {version: browser.version(), executablePath, args, viewport: {width: 1920, height: 1080}, deviceScaleFactor: 1};
  assert.equal(browser.version(), '156.0.8078.80');
  const context = await browser.newContext({viewport: report.environment.viewport, deviceScaleFactor: 1,
    locale: 'en-US', timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce'});
  await context.addInitScript({path: new URL('./observe-webgl.js', import.meta.url).pathname});
  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(120000);
  let rejectFailure;
  const failure = new Promise((resolve, reject) => { rejectFailure = reject; });
  // 提前附加处理，导航期间的异步错误由统一流程立即终止并回收浏览器。
  failure.catch(() => {});
  const fail = data => { report.errors.push(data); save(); rejectFailure(new Error(JSON.stringify(data))); };
  page.on('console', message => {
    const data = {type: message.type(), text: message.text()};
    report.console.push(data); save();
    if (data.type === 'error' || /failed to load|context lost|shader error/i.test(data.text)) fail(data);
  });
  page.on('pageerror', error => fail({type: 'pageerror', message: error.message}));
  page.on('requestfailed', request => fail({type: 'requestfailed', url: request.url(), failure: request.failure()}));
  page.on('response', response => {
    const data = {url: response.url(), status: response.status(), type: response.request().resourceType()};
    report.network.push(data); save();
    if (data.status >= 400) fail({type: 'http-error', ...data});
  });
  const observe = selector => page.evaluate(selector => window.__feBaseObserve(selector), selector);
  const rendered = async (selector, previous = 0) => {
    await page.waitForFunction(({selector, previous}) => {
      const value = window.__feBaseObserve(selector);
      return value && value.draws > previous && value.frameDraws.length >= 3
        && value.frameDraws.slice(-3).every(count => count === value.frameDraws.at(-1));
    }, {selector, previous});
    return observe(selector);
  };
  const distance = value => Math.hypot(...value.slice(12, 15));
  const rotationDelta = (a, b) => Math.max(...[0, 1, 2, 4, 5, 6, 8, 9, 10].map(index => Math.abs(a[index] - b[index])));
  async function interact(selector) {
    const operation = {name: 'camera-' + selector, selector, state: 'RUNNING', checkpoints: []};
    report.operations.push(operation); save();
    const checkpoint = async phase => {
      operation.phase = phase;
      const observation = await observe(selector);
      operation.checkpoints.push({phase, at: new Date().toISOString(), observation});
      save();
      assert(observation?.main.length > 0, '必须取得实际透视镜头 GPU viewMatrix');
      return observation;
    };
    try {
      const initial = await checkpoint('before');
      const before = operation.before = initial.main[0].matrix;
      await rendered(selector, initial.draws);
      const stationary = await checkpoint('stationary');
      const still = operation.still = stationary.main[0].matrix;
      operation.stationaryDelta = rotationDelta(before, still); save();
      assert(operation.stationaryDelta <= 1e-5, '无输入时镜头应保持静止');
      const box = await page.locator(selector).boundingBox();
      const input = operation.input = {x: box.x + box.width * .55, y: box.y + box.height * .52, dx: 160, dy: 80};
      operation.phase = 'drag-dispatch'; save();
      assert(await page.locator(selector).evaluate((canvas, point) => document.elementFromPoint(point.x, point.y) === canvas, input));
      await page.mouse.move(input.x, input.y);
      await page.mouse.down();
      await page.mouse.move(input.x + input.dx, input.y + input.dy, {steps: 12});
      await page.mouse.up();
      operation.phase = 'rotation-observe'; save();
      await page.waitForFunction(cameraChangedAfterInput,
        {selector, reference: before, operation: 'rotate', afterInput: stationary.inputSequence});
      const rotated = operation.rotated = (await checkpoint('rotated')).main[0].matrix;
      operation.rotationDelta = rotationDelta(before, rotated); save();
      await page.mouse.move(input.x, input.y);
      assert(await page.locator(selector).evaluate((canvas, point) => document.elementFromPoint(point.x, point.y) === canvas, input));
      const inward = await checkpoint('zoom-in-before');
      operation.phase = 'zoom-in-dispatch'; save();
      await page.mouse.wheel(0, -600);
      operation.phase = 'zoom-in-observe'; save();
      await page.waitForFunction(cameraChangedAfterInput,
        {selector, reference: inward.main[0].matrix, operation: 'zoom-in', afterInput: inward.inputSequence});
      const zoomed = operation.zoomed = (await checkpoint('zoomed')).main[0].matrix;
      operation.zoomInDelta = distance(inward.main[0].matrix) - distance(zoomed); save();
      assert(operation.zoomInDelta > .01);
      assert(await page.locator(selector).evaluate((canvas, point) => document.elementFromPoint(point.x, point.y) === canvas, input));
      const outward = await checkpoint('zoom-out-before');
      operation.phase = 'zoom-out-dispatch'; save();
      await page.mouse.wheel(0, 600);
      operation.phase = 'zoom-out-observe'; save();
      await page.waitForFunction(cameraChangedAfterInput,
        {selector, reference: outward.main[0].matrix, operation: 'zoom-out', afterInput: outward.inputSequence});
      operation.restored = (await checkpoint('restored')).main[0].matrix;
      operation.zoomOutDelta = distance(operation.restored) - distance(outward.main[0].matrix);
      assert(operation.zoomOutDelta > .01);
      operation.state = 'PASS'; save();
    } catch (error) {
      operation.state = 'FAIL';
      operation.failure = {phase: operation.phase, name: error.name, message: error.message}; save();
      operation.failureObservation = await observe(selector); save();
      throw error;
    }
  }
  async function verify() {
    const response = await page.goto(baseUrl + '/?lang=en&quality=balanced&experience=console&speed=0');
    assert.equal(response.status(), 200);
    await rendered('#scene');
    report.environment.webgl = await page.evaluate(() => {
      const canvas = document.querySelector('#scene');
      const gl = canvas.getContext('webgl2');
      if (!gl) throw new Error('真实 WebGL2 不可用');
      const extension = gl.getExtension('WEBGL_debug_renderer_info');
      return {version: gl.getParameter(gl.VERSION), renderer: gl.getParameter(extension.UNMASKED_RENDERER_WEBGL),
        vendor: gl.getParameter(extension.UNMASKED_VENDOR_WEBGL), width: canvas.width, height: canvas.height, contextLost: gl.isContextLost()};
    });
    assert.equal(report.environment.webgl.contextLost, false);
    assert(report.environment.webgl.renderer.includes('SwiftShader'));
    record('initial-render', {webgl: report.environment.webgl, observation: await observe('#scene')});
    await interact('#scene');
    const housingCounts = {};
    for (const housing of ['enclosed', 'cutaway']) {
      const before = await observe('#scene');
      await page.evaluate(() => window.__feBaseResetFrames('#scene'));
      await page.locator(`button[data-housing="${housing}"]`).click();
      await page.waitForFunction(housing => document.querySelector('#app').dataset.housing === housing, housing);
      assert.equal(await page.locator(`button[data-housing="${housing}"]`).getAttribute('aria-pressed'), 'true');
      assert.equal(new URL(page.url()).searchParams.get('housing'), housing);
      const after = await rendered('#scene', before.draws);
      housingCounts[housing] = after.frameDraws.at(-1);
      record('housing-' + housing, {before, after, url: page.url()});
    }
    assert.notEqual(housingCounts.enclosed, housingCounts.cutaway, '外壳模式必须改变每帧实际绘制对象数量');
    await page.locator('.parts-launch').click();
    await page.waitForFunction(() => document.querySelector('.parts-lab').open);
    await rendered('.parts-lab canvas');
    assert(await page.locator('.lab-library').isVisible(), '桌面组件目录应直接可见');
    await page.locator('.lab-secondary > summary').click();
    const expected = {
      'turbine-1': 'First-stage turbine rotor', 'single-blade': 'First-stage turbine blade',
      'compressor-1': 'First-stage compressor rotor', 'combustor': 'Combustor assembly',
      'lower-case': 'Lower casing', 'upper-case': 'Upper compressor casing', 'exhaust': 'Exhaust diffuser',
      'turbine-rotor-2': 'Stage 2 turbine rotor', 'turbine-rotor-3': 'Stage 3 turbine rotor', 'turbine-rotor-4': 'Stage 4 turbine rotor',
    };
    assert.equal(await page.locator('[data-part]').count(), 10);
    const position = () => page.locator('.lab-pull').evaluate(el => ({left: parseFloat(el.style.left), top: parseFloat(el.style.top)}));
    for (const [id, title] of Object.entries(expected)) {
      const previous = (await observe('.parts-lab canvas')).draws;
      await page.locator(`[data-part="${id}"]`).click();
      assert.equal(await page.locator(`[data-part="${id}"]`).getAttribute('aria-pressed'), 'true');
      await page.waitForFunction(title => document.querySelector('.lab-details h2').textContent.trim() === title, title);
      assert.equal((await page.locator('.lab-breadcrumb b').textContent()).trim(), title);
      record('part-' + id, {expectedTitle: title, actualTitle: (await page.locator('.lab-details h2').textContent()).trim(),
        breadcrumb: (await page.locator('.lab-breadcrumb b').textContent()).trim(), observation: await rendered('.parts-lab canvas', previous)});
      if (await page.locator('.lab-assembly-tools').evaluate(el => el.hidden)) await page.locator('[data-command="assembly"]').click();
      await rendered('.parts-lab canvas', (await observe('.parts-lab canvas')).draws);
      const originalPosition = await position();
      await page.locator('[data-command="extract"]').click();
      assert.equal(await page.locator('#part-extraction').inputValue(), '100');
      assert.equal((await page.locator('.lab-assembly-tools output').textContent()).trim(), '100%');
      assert.match((await page.locator('.parts-lab .lab-quality output').textContent()).trim(), /^\d+ × \d+ px$/);
      await page.waitForFunction(before => {
        const el = document.querySelector('.lab-pull');
        return Math.hypot(parseFloat(el.style.left) - before.left, parseFloat(el.style.top) - before.top) > 1;
      }, originalPosition);
      const extractedPosition = await position();
      await page.locator('[data-command="restore"]').click();
      assert.equal(await page.locator('#part-extraction').inputValue(), '0');
      assert.equal((await page.locator('.lab-assembly-tools output').textContent()).trim(), '0%');
      await page.waitForFunction(before => {
        const el = document.querySelector('.lab-pull');
        return Math.hypot(parseFloat(el.style.left) - before.left, parseFloat(el.style.top) - before.top) < 1;
      }, originalPosition);
      record('extraction-' + id, {originalPosition, extractedPosition, restoredPosition: await position()});
    }
    const range = page.locator('#part-extraction');
    await range.focus();
    await range.press('End');
    assert.equal(await range.inputValue(), '100');
    assert.equal((await page.locator('.lab-assembly-tools output').textContent()).trim(), '100%');
    await range.press('Home');
    assert.equal(await range.inputValue(), '0');
    assert.equal((await page.locator('.lab-assembly-tools output').textContent()).trim(), '0%');
    await page.locator('.lab-pull').focus();
    await page.locator('.lab-pull').press('ArrowUp');
    assert.equal(await range.inputValue(), '10');
    assert.equal((await page.locator('.lab-assembly-tools output').textContent()).trim(), '10%');
    await page.locator('.lab-pull').press('ArrowDown');
    assert.equal(await range.inputValue(), '0');
    assert.equal((await page.locator('.lab-assembly-tools output').textContent()).trim(), '0%');
    assert.match((await page.locator('.parts-lab .lab-quality output').textContent()).trim(), /^\d+ × \d+ px$/);
    record('extraction-range-and-handle', {nativeRange: [100, 0], handleKeyboard: [10, 0]});
    await interact('.parts-lab canvas');
    await page.locator('[data-command="blade"]').click();
    assert(await page.locator('.parts-lab').evaluate(el => el.classList.contains('blade-hero')));
    for (const view of ['cooling', 'surface', 'layers']) {
      const previous = (await observe('.parts-lab canvas')).draws;
      await page.locator(`[data-blade-view="${view}"]`).click();
      assert.equal(await page.locator(`[data-blade-view="${view}"]`).getAttribute('aria-pressed'), 'true');
      record('blade-' + view, {observation: await rendered('.parts-lab canvas', previous)});
    }
    await page.locator('.lab-flow-toggle').click();
    assert.equal(await page.locator('.lab-flow-toggle').getAttribute('aria-pressed'), 'false');
    await page.locator('.lab-flow-toggle').click();
    assert.equal(await page.locator('.lab-flow-toggle').getAttribute('aria-pressed'), 'true');
    const ysz = page.locator('.lab-blade-summary [data-layer="3"]');
    await ysz.click();
    assert.equal(await ysz.getAttribute('aria-pressed'), 'true');
    await ysz.click();
    assert.equal(await ysz.getAttribute('aria-pressed'), 'false');
    record('blade-flow-and-layer', {flow: 'true', selectedThenCleared: 'YSZ'});
    await page.locator('.lab-close').click();
    assert.equal(await page.locator('.parts-lab').evaluate(el => el.open), false);
    for (const env of ['studio', 'contrast']) {
      await page.goto(baseUrl + '/?lang=en&quality=balanced&experience=console&speed=0&env=' + env);
      await page.waitForFunction(() => document.querySelector('#app').dataset.environment === 'studio-hdr');
      await rendered('#scene');
      record('hdr-' + env, {environment: await page.locator('#app').getAttribute('data-environment')});
    }
    assert(report.network.some(item => item.url.includes('poly_haven_studio_1k.hdr') && item.status === 200));
    assert(report.network.some(item => item.url.includes('studio_kontrast_02_1k.hdr') && item.status === 200));
    assert(!report.network.some(item => new URL(item.url).pathname.toLowerCase().endsWith('.glb')));
    assert.equal(report.errors.length, 0);
    report.state = 'PASS'; report.finishedAt = new Date().toISOString(); save();
    console.log(JSON.stringify({state: report.state, browser: report.environment.version, operations: report.operations.length, network: report.network.length, output}));
  }
  await Promise.race([verify(), failure]);
} catch (error) {
  report.state = 'FAIL';
  report.failure = {name: error.name, message: error.message, stack: error.stack};
  throw error;
} finally {
  save();
  await browser.close();
}
