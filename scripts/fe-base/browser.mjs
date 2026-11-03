import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

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
  page.on('console', message => { report.console.push({type: message.type(), text: message.text()}); save(); });
  page.on('pageerror', error => { report.errors.push({type: 'pageerror', message: error.message}); save(); });
  page.on('requestfailed', request => { report.errors.push({type: 'requestfailed', url: request.url(), failure: request.failure()}); save(); });
  page.on('response', response => {
    report.network.push({url: response.url(), status: response.status(), type: response.request().resourceType()});
    save();
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
  const mainMatrix = async () => {
    const value = await observe('#scene');
    assert(value.main.length > 0, '必须取得主场景透视镜头 GPU viewMatrix');
    return value.main[0].matrix;
  };
  const rotationDelta = (a, b) => Math.max(...[0, 1, 2, 4, 5, 6, 8, 9, 10].map(index => Math.abs(a[index] - b[index])));
  const distance = matrix => Math.hypot(...matrix.slice(12, 15));
  const response = await page.goto(baseUrl + '/?lang=en&quality=balanced&experience=console&speed=0');
  assert.equal(response.status(), 200);
  await rendered('#scene');
  report.environment.webgl = await page.evaluate(() => {
    const canvas = document.querySelector('#scene');
    const gl = canvas.getContext('webgl2');
    assertWebGL(gl);
    function assertWebGL(value) { if (!value) throw new Error('真实 WebGL2 不可用'); }
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    return {version: gl.getParameter(gl.VERSION), renderer: gl.getParameter(extension.UNMASKED_RENDERER_WEBGL),
      vendor: gl.getParameter(extension.UNMASKED_VENDOR_WEBGL), width: canvas.width, height: canvas.height, contextLost: gl.isContextLost()};
  });
  assert.equal(report.environment.webgl.contextLost, false);
  assert(report.environment.webgl.renderer.includes('SwiftShader'));
  record('initial-render', {webgl: report.environment.webgl, observation: await observe('#scene')});
  const stillBefore = await mainMatrix();
  const stillDraws = (await observe('#scene')).draws;
  await rendered('#scene', stillDraws);
  const stillAfter = await mainMatrix();
  assert(rotationDelta(stillBefore, stillAfter) <= 1e-5, '无输入时镜头应保持静止');
  record('stationary-control', {before: stillBefore, after: stillAfter, delta: rotationDelta(stillBefore, stillAfter)});
  const canvasBox = await page.locator('#scene').boundingBox();
  const x = canvasBox.x + canvasBox.width * .55;
  const y = canvasBox.y + canvasBox.height * .52;
  const hit = await page.evaluate(({x, y}) => document.elementFromPoint(x, y)?.id, {x, y});
  assert.equal(hit, 'scene', '拖动起点必须为实际画布');
  const beforeRotate = await mainMatrix();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 160, y + 80, {steps: 12});
  await page.mouse.up();
  await page.waitForFunction(before => {
    const m = window.__feBaseObserve('#scene')?.main[0]?.matrix;
    return m && [0, 1, 2, 4, 5, 6, 8, 9, 10].some(i => Math.abs(m[i] - before[i]) > 1e-5);
  }, beforeRotate);
  const afterRotate = await mainMatrix();
  record('rotate', {input: {x, y, dx: 160, dy: 80}, before: beforeRotate, after: afterRotate, delta: rotationDelta(beforeRotate, afterRotate)});
  await page.mouse.move(x, y);
  const beforeZoom = await mainMatrix();
  await page.mouse.wheel(0, -600);
  await page.waitForFunction(before => {
    const m = window.__feBaseObserve('#scene')?.main[0]?.matrix;
    return m && Math.hypot(...m.slice(12, 15)) < before - .01;
  }, distance(beforeZoom));
  const zoomed = await mainMatrix();
  await page.mouse.wheel(0, 600);
  await page.waitForFunction(before => {
    const m = window.__feBaseObserve('#scene')?.main[0]?.matrix;
    return m && Math.hypot(...m.slice(12, 15)) > before + .01;
  }, distance(zoomed));
  record('zoom', {input: [-600, 600], before: beforeZoom, zoomed, restored: await mainMatrix()});
  for (const housing of ['enclosed', 'cutaway']) {
    const before = await observe('#scene');
    await page.locator(`[data-housing="${housing}"]`).click();
    await page.waitForFunction(housing => document.querySelector('#app').dataset.housing === housing, housing);
    assert.equal(await page.locator(`[data-housing="${housing}"]`).getAttribute('aria-pressed'), 'true');
    assert.equal(new URL(page.url()).searchParams.get('housing'), housing);
    const after = await rendered('#scene', before.draws);
    record('housing-' + housing, {before, after, url: page.url()});
  }
  // 几何可见性改变后每帧实际 GPU draw 数量必须改变。
  const housingOps = report.operations.filter(item => item.name.startsWith('housing-'));
  const enclosedCounts = housingOps[0].after.frameDraws;
  const cutawayCounts = housingOps[1].after.frameDraws;
  assert(enclosedCounts.some(value => !cutawayCounts.includes(value)) || cutawayCounts.some(value => !enclosedCounts.includes(value)), '外壳模式必须改变实际绘制对象数量');
  await page.locator('.parts-launch').click();
  await page.waitForFunction(() => document.querySelector('.parts-lab').open);
  await rendered('.parts-lab canvas');
  await page.locator('.lab-library-toggle').click();
  await page.locator('.lab-secondary > summary').click();
  const expected = {
    'turbine-1': 'First-stage turbine rotor', 'single-blade': 'First-stage turbine blade',
    'compressor-1': 'First-stage compressor rotor', 'combustor': 'Combustor assembly',
    'lower-case': 'Lower casing', 'upper-case': 'Upper compressor casing', 'exhaust': 'Exhaust diffuser',
    'turbine-rotor-2': 'Stage 2 turbine rotor', 'turbine-rotor-3': 'Stage 3 turbine rotor', 'turbine-rotor-4': 'Stage 4 turbine rotor',
  };
  assert.equal(await page.locator('[data-part]').count(), 10);
  for (const [id, title] of Object.entries(expected)) {
    const previous = (await observe('.parts-lab canvas')).draws;
    await page.locator(`[data-part="${id}"]`).click();
    assert.equal(await page.locator(`[data-part="${id}"]`).getAttribute('aria-pressed'), 'true');
    const actual = (await page.locator('.lab-details h2').textContent()).trim();
    assert.equal(actual, title);
    record('part-' + id, {expectedTitle: title, actualTitle: actual, observation: await rendered('.parts-lab canvas', previous)});
  }
  await page.locator('[data-part="exhaust"]').click();
  const pull = page.locator('.lab-pull');
  const originalPosition = await pull.evaluate(el => ({left: parseFloat(el.style.left), top: parseFloat(el.style.top)}));
  await page.locator('[data-command="extract"]').click();
  assert.equal(await page.locator('#part-extraction').inputValue(), '100');
  await page.waitForFunction(before => {
    const el = document.querySelector('.lab-pull');
    return Math.hypot(parseFloat(el.style.left) - before.left, parseFloat(el.style.top) - before.top) > 1;
  }, originalPosition);
  const extractedPosition = await pull.evaluate(el => ({left: parseFloat(el.style.left), top: parseFloat(el.style.top)}));
  await page.locator('[data-command="restore"]').click();
  assert.equal(await page.locator('#part-extraction').inputValue(), '0');
  await page.waitForFunction(before => {
    const el = document.querySelector('.lab-pull');
    return Math.hypot(parseFloat(el.style.left) - before.left, parseFloat(el.style.top) - before.top) < 1;
  }, originalPosition);
  record('extraction', {originalPosition, extractedPosition, restoredPosition: await pull.evaluate(el => ({left: el.style.left, top: el.style.top}))});
  await page.locator('.lab-library-toggle').click();
  const inspectionBox = await page.locator('.parts-lab canvas').boundingBox();
  const inspectionInput = {x: inspectionBox.x + inspectionBox.width * .45, y: inspectionBox.y + inspectionBox.height * .55};
  const inspectionBefore = (await observe('.parts-lab canvas')).main[0].matrix;
  await page.mouse.move(inspectionInput.x, inspectionInput.y);
  await page.mouse.down();
  await page.mouse.move(inspectionInput.x + 160, inspectionInput.y + 80, {steps: 12});
  await page.mouse.up();
  await page.waitForFunction(before => {
    const m = window.__feBaseObserve('.parts-lab canvas')?.main[0]?.matrix;
    return m && [0, 1, 2, 4, 5, 6, 8, 9, 10].some(i => Math.abs(m[i] - before[i]) > 1e-5);
  }, inspectionBefore);
  const inspectionRotated = (await observe('.parts-lab canvas')).main[0].matrix;
  await page.mouse.wheel(0, -600);
  await page.waitForFunction(before => {
    const m = window.__feBaseObserve('.parts-lab canvas')?.main[0]?.matrix;
    return m && Math.hypot(...m.slice(12, 15)) < before - .01;
  }, distance(inspectionRotated));
  const inspectionZoomed = (await observe('.parts-lab canvas')).main[0].matrix;
  record('inspection-rotate-and-zoom', {input: inspectionInput, before: inspectionBefore, rotated: inspectionRotated, zoomed: inspectionZoomed});
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
  assert(!report.network.some(item => item.status >= 400));
  assert(!report.network.some(item => new URL(item.url).pathname.toLowerCase().endsWith('.glb')));
  assert.equal(report.errors.length, 0);
  assert.equal(report.console.filter(item => item.type === 'error').length, 0);
  assert(!report.console.some(item => /failed to load|context lost|shader error/i.test(item.text)));
  report.state = 'PASS';
  report.finishedAt = new Date().toISOString();
  save();
  console.log(JSON.stringify({state: report.state, browser: report.environment.version, operations: report.operations.length, network: report.network.length, output}));
} finally {
  save();
  await browser.close();
}
