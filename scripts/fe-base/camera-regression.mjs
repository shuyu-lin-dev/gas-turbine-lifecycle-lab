import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {cameraChangedAfterInput} from './camera-observation.mjs';

const [baseUrl, output] = process.argv.slice(2);
assert(baseUrl && output && process.env.FE_BASE_CHROME);
const report = {baseUrl, startedAt: new Date().toISOString(), steps: [], errors: [], console: [], network: []};
const save = () => writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch({executablePath: process.env.FE_BASE_CHROME, headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
let page;
try {
  assert.equal(browser.version(), '156.0.8078.80');
  report.environment = {version: browser.version(), viewport: {width: 1920, height: 1080}, deviceScaleFactor: 1};
  const context = await browser.newContext({viewport: report.environment.viewport,
    deviceScaleFactor: report.environment.deviceScaleFactor,
    locale: 'en-US', timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce'});
  await context.addInitScript({path: new URL('./observe-webgl.js', import.meta.url).pathname});
  await context.addInitScript(() => {
    window.__cameraRegressionEvents = [];
    document.addEventListener('wheel', event => window.__cameraRegressionEvents.push({
      at: performance.now(), target: event.target.id || event.target.tagName,
      trusted: event.isTrusted, deltaY: event.deltaY, x: event.clientX, y: event.clientY}), {capture: true, passive: true});
  });
  page = await context.newPage();
  page.setDefaultTimeout(120000);
  let rejectFailure;
  const failure = new Promise((resolve, reject) => { rejectFailure = reject; });
  failure.catch(() => {});
  const fail = data => { report.errors.push(data); save(); rejectFailure(new Error(JSON.stringify(data))); };
  page.on('pageerror', error => fail({type: 'pageerror', message: error.message}));
  page.on('requestfailed', request => fail({type: 'requestfailed', url: request.url(), failure: request.failure()}));
  page.on('response', response => {
    const data = {url: response.url(), status: response.status()};
    report.network.push(data); save();
    if (data.status >= 400) fail({type: 'http-error', ...data});
  });
  page.on('console', message => {
    const data = {type: message.type(), text: message.text()};
    report.console.push(data); save();
    if (data.type === 'error' || /failed to load|context lost|shader error/i.test(data.text)) fail(data);
  });
  const snapshot = async name => {
    const value = await page.evaluate(() => ({observation: window.__feBaseObserve('#scene'),
      events: window.__cameraRegressionEvents.slice()}));
    report.steps.push({name, at: new Date().toISOString(), ...value});
    save();
    return value.observation;
  };
  async function verify() {
    await page.goto(baseUrl + '/?lang=en&quality=balanced&experience=console&speed=0');
    await page.waitForFunction(() => {
      const value = window.__feBaseObserve('#scene');
      return value?.main.length > 0 && value.frameDraws.length >= 3
        && value.frameDraws.slice(-3).every(count => count === value.frameDraws.at(-1));
    });
    const box = await page.locator('#scene').boundingBox();
    const input = {x: box.x + box.width * .55, y: box.y + box.height * .52};
    report.input = {...input, dx: 160, dy: 80, dragSteps: 1}; save();
    assert(await page.locator('#scene').evaluate((canvas, point) => document.elementFromPoint(point.x, point.y) === canvas, input));
    await page.mouse.move(input.x, input.y);
    await page.mouse.down();
    await page.mouse.move(input.x + 160, input.y + 80);
    await page.mouse.up();
    const afterDrag = await snapshot('after-drag');
    const reference = afterDrag.main[0].matrix;
    // 保留真实余下运动跨越距离条件的负对照，实际滚轮发生后才允许判定缩放。
    await page.waitForFunction(reference => {
      const matrix = window.__feBaseObserve('#scene')?.main[0]?.matrix;
      return matrix && Math.hypot(...matrix.slice(12, 15)) < Math.hypot(...reference.slice(12, 15)) - .01;
    }, reference);
    const withoutWheel = await snapshot('distance-changed-without-wheel');
    assert.equal((await page.evaluate(() => window.__cameraRegressionEvents)).length, 0);
    const afterInput = afterDrag.inputSequence;
    assert.equal(await page.evaluate(cameraChangedAfterInput,
      {selector: '#scene', reference, operation: 'zoom-in', afterInput}), false,
      '尚未收到真实wheel，余下运动不得被判定为缩放成功');
    const beforeZoom = withoutWheel.main[0].matrix;
    await page.mouse.move(input.x, input.y);
    await page.mouse.wheel(0, -600);
    await page.waitForFunction(cameraChangedAfterInput,
      {selector: '#scene', reference: beforeZoom, operation: 'zoom-in', afterInput});
    const zoomed = await snapshot('wheel-minus-600');
    assert(Math.hypot(...zoomed.main[0].matrix.slice(12, 15)) < Math.hypot(...beforeZoom.slice(12, 15)) - .01);
    const afterNegative = zoomed.inputSequence;
    await page.mouse.wheel(0, 600);
    await page.waitForFunction(cameraChangedAfterInput,
      {selector: '#scene', reference: zoomed.main[0].matrix, operation: 'zoom-out', afterInput: afterNegative});
    const restored = await snapshot('wheel-plus-600');
    assert(Math.hypot(...restored.main[0].matrix.slice(12, 15)) > Math.hypot(...zoomed.main[0].matrix.slice(12, 15)) + .01);
    const events = await page.evaluate(() => window.__cameraRegressionEvents);
    assert.deepEqual(events.map(event => event.deltaY), [-600, 600]);
    assert(events.every(event => event.trusted && event.target === 'scene'));
    assert.equal(report.errors.length, 0);
    report.state = 'PASS'; save();
  }
  await Promise.race([verify(), failure]);
} catch (error) {
  report.state = 'FAIL';
  report.failure = {name: error.name, message: error.message, stack: error.stack}; save();
  if (page && !page.isClosed()) {
    report.failureObservation = await page.evaluate(() => ({observation: window.__feBaseObserve('#scene'),
      events: window.__cameraRegressionEvents.slice()}));
    save();
  }
  throw error;
} finally {
  report.finishedAt = new Date().toISOString();
  save();
  await browser.close();
}
