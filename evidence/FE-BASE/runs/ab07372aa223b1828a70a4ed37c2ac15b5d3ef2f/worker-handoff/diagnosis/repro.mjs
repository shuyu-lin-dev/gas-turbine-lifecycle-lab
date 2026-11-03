import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {chromium} from '../../scripts/fe-base/node_modules/playwright/index.mjs';

const [output, rounds = '3', dragSteps = '12'] = process.argv.slice(2);
assert(output);
const report = {candidate: 'e77466c3390b6c8b05f52d5b5a4bd00fc77b291c', rounds: [], startedAt: new Date().toISOString()};
const save = () => writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch({executablePath: process.env.FE_BASE_CHROME, headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
try {
  for (let round = 0; round < Number(rounds); round++) {
    const context = await browser.newContext({viewport: {width: 1920, height: 1080}, deviceScaleFactor: 1,
      locale: 'en-US', timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce'});
    await context.addInitScript({path: new URL('../../scripts/fe-base/observe-webgl.js', import.meta.url).pathname});
    await context.addInitScript(() => {
      window.__zoomTrace = {events: [], samples: []};
      for (const type of ['wheel', 'pointerdown', 'pointerup']) document.addEventListener(type, event => {
        const data = {type, at: performance.now(), trusted: event.isTrusted, target: event.target.id || event.target.className,
          x: event.clientX, y: event.clientY, deltaY: event.deltaY, deltaMode: event.deltaMode, defaultPrevented: event.defaultPrevented};
        window.__zoomTrace.events.push(data);
        queueMicrotask(() => { data.preventedAfter = event.defaultPrevented; });
      }, {capture: true, passive: true});
      function sample(at) {
        const data = window.__feBaseObserve('#scene');
        if (data?.main.length) {
          window.__zoomTrace.samples.push({at, draws: data.draws,
            main: data.main.slice(0, 3), distance: Math.hypot(...data.main[0].matrix.slice(12, 15))});
          if (window.__zoomTrace.samples.length > 120) window.__zoomTrace.samples.shift();
        }
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    const result = {round, steps: [], errors: []};
    report.rounds.push(result);
    page.on('pageerror', error => { result.errors.push(error.message); save(); });
    const observe = () => page.evaluate(() => ({...window.__feBaseObserve('#scene'), events: window.__zoomTrace.events.slice()}));
    const matrix = async name => {
      const value = await observe();
      assert(value.main.length > 0);
      const matrix = value.main[0].matrix;
      result.steps.push({name, at: new Date().toISOString(), draws: value.draws, matrix,
        program: value.main[0].id, events: value.events, distance: Math.hypot(...matrix.slice(12, 15))});
      save();
      return matrix;
    };
    try {
      await page.goto('http://127.0.0.1:4173/?lang=en&quality=balanced&experience=console&speed=0');
      await page.waitForFunction(() => {
        const value = window.__feBaseObserve('#scene');
        return value?.draws > 0 && value.frameDraws.length >= 3
          && value.frameDraws.slice(-3).every(count => count === value.frameDraws.at(-1));
      });
      const before = await matrix('before');
      await page.waitForFunction(previous => {
        const value = window.__feBaseObserve('#scene');
        return value.draws > previous && value.frameDraws.length >= 3
          && value.frameDraws.slice(-3).every(count => count === value.frameDraws.at(-1));
      }, (await observe()).draws);
      await matrix('still');
      const box = await page.locator('#scene').boundingBox();
      const input = {x: box.x + box.width * .55, y: box.y + box.height * .52, dx: 160, dy: 80};
      result.input = input;
      assert(await page.locator('#scene').evaluate((canvas, point) => document.elementFromPoint(point.x, point.y) === canvas, input));
      await page.mouse.move(input.x, input.y);
      await page.mouse.down();
      await page.mouse.move(input.x + input.dx, input.y + input.dy, {steps: Number(dragSteps)});
      await page.mouse.up();
      await page.waitForFunction(before => {
        const m = window.__feBaseObserve('#scene')?.main[0]?.matrix;
        return m && [0, 1, 2, 4, 5, 6, 8, 9, 10].some(i => Math.abs(m[i] - before[i]) > 1e-5);
      }, before);
      const rotated = await matrix('rotated');
      await page.mouse.move(input.x, input.y);
      await page.mouse.wheel(0, -600);
      await page.waitForFunction(previous => {
        const m = window.__feBaseObserve('#scene')?.main[0]?.matrix;
        return m && Math.hypot(...m.slice(12, 15)) < previous - .01;
      }, Math.hypot(...rotated.slice(12, 15)));
      const zoomed = await matrix('zoomed');
      await page.mouse.wheel(0, 600);
      await page.waitForFunction(previous => {
        const m = window.__feBaseObserve('#scene')?.main[0]?.matrix;
        return m && Math.hypot(...m.slice(12, 15)) > previous + .01;
      }, Math.hypot(...zoomed.slice(12, 15)));
      await matrix('restored');
      result.state = 'PASS';
    } catch (error) {
      result.state = 'FAIL';
      result.failure = {name: error.name, message: error.message};
      throw error;
    } finally {
      result.trace = await page.evaluate(() => window.__zoomTrace);
      result.finishedAt = new Date().toISOString();
      save();
      await context.close();
    }
  }
  report.state = 'PASS';
} finally {
  report.finishedAt = new Date().toISOString();
  save();
  await browser.close();
}
