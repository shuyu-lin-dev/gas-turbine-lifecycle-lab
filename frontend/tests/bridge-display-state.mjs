import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { pageFailureGuard } from './page-failure-guard.mjs'

const [url, output] = process.argv.slice(2)
assert(url && output && process.env.M0_01_CHROME)
const fixture = JSON.parse(await readFile(new URL('../../evidence/FE-INTEGRATE/bridge-fixture.json', import.meta.url)))
const record = { url, steps: [], errors: [], observations: [] }
const guard = pageFailureGuard(record)
const save = () => writeFile(output, JSON.stringify(record, null, 2) + '\n')
const browser = await chromium.launch({ executablePath: process.env.M0_01_CHROME,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
async function verify() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' })
  page.setDefaultTimeout(120000)
  guard.watch(page)
  page.context().on('page', created => guard.watch(created))
  await page.addInitScript({ path: new URL('./observe-bridge.js', import.meta.url).pathname })
  await page.addInitScript(() => localStorage.setItem('turbine-quality', 'balanced'))
  await page.goto(url)
  await page.getByRole('button', { name: '模型联动', exact: true }).click()
  await page.getByText('模型已就绪', { exact: true }).waitFor()
  const frame = await (await page.locator('iframe').elementHandle()).contentFrame()
  const motion = frame.locator('[data-motion-study]')
  const linear = hex => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map(value => (value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4) * .45)
  const normal = linear(fixture.expected.status_colors.normal)
  const context = () => page.evaluate(() => ({ device: document.querySelector('[data-testid="device"]').textContent,
    run: document.querySelector('[data-testid="run"]').textContent, revision: document.querySelector('[data-testid="revision"]').textContent }))
  async function observe(name, expectNormal) {
    await frame.evaluate(() => { window.__feiObserve.emissiveDraws = {} })
    await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const gpu = await frame.evaluate(() => ({ draws: window.__feiObserve.draws, emissiveDraws: window.__feiObserve.emissiveDraws }))
    const text = await frame.locator('#bridge-values').innerText()
    const hasNormal = Object.keys(gpu.emissiveDraws).some(key => key.split(',').every((value, index) => Math.abs(Number(value) - normal[index]) <= 1e-6))
    record.observations.push({ name, expectNormal, hasNormal, text, gpu })
    await save()
    assert.equal(hasNormal, expectNormal, `${name}：实际材质绘制匹配当前上下文`)
    if (!expectNormal) assert(!/560/.test(text))
  }
  await page.getByRole('button', { name: '装载状态夹具 A', exact: true }).click()
  await frame.waitForFunction(() => document.querySelector('#bridge-values [data-component="turbine"]').dataset.status === 'normal')
  const beforeDisplay = await context()
  await motion.click()
  assert.equal(await motion.getAttribute('aria-pressed'), 'true')
  assert.deepEqual(await context(), beforeDisplay)
  await page.getByLabel('夹具设备', { exact: true }).selectOption('fixture-device-b')
  await frame.waitForFunction(() => document.querySelector('#bridge-context').dataset.revision === '1')
  await observe('分组启用后切换设备', false)
  record.steps.push('A05/A06：分组启用时新上下文清除原状态颜色与测量')
  await motion.click()
  await page.getByRole('button', { name: '装载状态夹具 A', exact: true }).click()
  await frame.waitForFunction(() => document.querySelector('#bridge-values [data-component="turbine"]').dataset.status === 'normal')
  const beforeRestore = await context()
  await motion.click()
  assert.deepEqual(await context(), beforeRestore)
  await observe('恢复已存在分组的状态材质', true)
  record.steps.push('A05：切换显示模式后恢复当前状态，不改变设备、批次或revision')
  await motion.click()
  await page.getByLabel('夹具批次', { exact: true }).selectOption('fixture-run-b')
  await frame.waitForFunction(() => document.querySelector('#bridge-context').dataset.revision === '2')
  await motion.click()
  await observe('新批次恢复分组后的未知状态', false)
  record.steps.push('A06：普通模式切换批次后再启用已有分组，旧状态颜色仍被清除')
  assert.deepEqual(record.errors, [])
  record.state = 'FUNCTIONAL_PASS'
}
try {
  await guard.run(verify)
} catch (error) {
  record.state = 'FAIL'
  record.failure = { name: error.name, message: error.message }
  throw error
} finally {
  await save()
  await browser.close()
  record.browserClosed = !browser.isConnected()
  assert.equal(record.browserClosed, true)
  if (record.state === 'FUNCTIONAL_PASS') record.state = 'PASS'
  await save()
}
