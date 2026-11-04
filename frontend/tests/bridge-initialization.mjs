import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { pageFailureGuard } from './page-failure-guard.mjs'

const [url, output] = process.argv.slice(2)
assert(url && output && process.env.M0_01_CHROME)
const origin = new URL(url).origin
const fixture = JSON.parse(await readFile(new URL('../../evidence/FE-INTEGRATE/bridge-fixture.json', import.meta.url)))
const record = { steps: [], errors: [] }
const guard = pageFailureGuard(record)
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
  record.beforeReady = await page.evaluate(async () => {
    const buttons = Array.from(document.querySelectorAll('.workspace-nav button'))
    buttons.find(button => button.textContent === '模型联动').click()
    await Promise.resolve()
    const ready = document.querySelector('[data-testid="viewer-ready"]').textContent
    for (const [label, value] of [['夹具设备', 'fixture-device-b'], ['夹具批次', 'fixture-run-b']]) {
      const select = document.querySelector(`select[aria-label="${label}"]`)
      select.value = value
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }
    Array.from(document.querySelectorAll('button')).find(button => button.textContent === '装载状态夹具 A').click()
    document.querySelector('.component-list [data-component="exhaust"]').click()
    return { ready, sent: window.__feiObserve.sends.length }
  })
  assert.equal(record.beforeReady.ready, '正在加载模型')
  assert.equal(record.beforeReady.sent, 0)
  await page.getByText('模型已就绪', { exact: true }).waitFor()
  let frame = await (await page.locator('iframe[title="燃气轮机教学模型"]').elementHandle()).contentFrame()
  await frame.waitForFunction(() => document.querySelector('#bridge-context')?.dataset.revision === '2')
  assert.equal(await frame.locator('#bridge-selection').getAttribute('data-component'), 'exhaust')
  const messages = await frame.evaluate(() => window.__feiObserve.messages)
  assert.equal(messages[0].data.type, 'update-component-state')
  assert.equal(messages[0].data.device_id, 'fixture-device-b')
  assert.equal(messages[0].data.run_id, 'fixture-run-b')
  assert.equal(messages[0].data.payload.selected_component_id, 'exhaust')
  assert(!messages.some(item => item.data.type === 'select-component'))
  record.firstSnapshot = messages[0]
  record.steps.push('A03/A06：ready前真实DOM操作保存最新上下文和选择，仅在ready后同步最新快照')
  const beforeReload = frame.url()
  await page.getByRole('button', { name: '重新加载模型', exact: true }).click()
  await page.waitForFunction(old => document.querySelector('iframe').src !== old, beforeReload)
  await page.getByText('模型已就绪', { exact: true }).waitFor()
  frame = await (await page.locator('iframe').elementHandle()).contentFrame()
  await frame.waitForFunction(() => document.querySelector('#bridge-context')?.dataset.revision === '2')
  assert.equal(await frame.locator('#bridge-selection').getAttribute('data-component'), 'exhaust')
  assert.notEqual(new URL(frame.url()).searchParams.get('viewer_instance_id'), new URL(beforeReload).searchParams.get('viewer_instance_id'))
  record.steps.push('A03：应用控制重载创建新实例，恢复完整最新快照')
  await page.getByRole('button', { name: '服务连接', exact: true }).click()
  await page.evaluate(() => {
    const iframe = document.createElement('iframe')
    iframe.name = 'unbound-viewer'
    iframe.style.cssText = 'width:1280px;height:800px;display:block'
    iframe.src = '/viewer/?embedded=1&viewer_instance_id=unbound-probe&lang=zh&experience=console&presentation=console&speed=0'
    document.body.append(iframe)
  })
  await page.waitForFunction(() => window.__feiObserve.messages.some(item => item.data.type === 'viewer-ready' && item.data.viewer_instance_id === 'unbound-probe'))
  const unbound = page.frame({ name: 'unbound-viewer' })
  await unbound.locator('.bridge-status button[data-component="compressor"]').click()
  assert.equal(await unbound.locator('#bridge-selection').getAttribute('data-component'), 'compressor')
  let observed = await page.evaluate(() => window.__feiObserve.messages.filter(item => item.data.viewer_instance_id === 'unbound-probe'))
  assert(!observed.some(item => item.data.type === 'component-selected'))
  const update = (context, payload) => ({ schema_version: '1', type: 'update-component-state', viewer_instance_id: 'unbound-probe', ...context, payload })
  const send = message => page.evaluate(({ message, origin }) => document.querySelector('iframe[name="unbound-viewer"]').contentWindow.postMessage(message, origin), { message, origin })
  await send(update(fixture.context_a, fixture.snapshot_a))
  await unbound.waitForFunction(() => document.querySelector('#bridge-context').dataset.revision === '0')
  await unbound.locator('.bridge-status button[data-component="turbine"]').click()
  await page.waitForFunction(() => window.__feiObserve.messages.some(item => item.data.type === 'component-selected' && item.data.viewer_instance_id === 'unbound-probe'))
  observed = await page.evaluate(() => window.__feiObserve.messages.filter(item => item.data.viewer_instance_id === 'unbound-probe'))
  const selected = observed.find(item => item.data.type === 'component-selected').data
  assert.equal(selected.payload.component_id, 'turbine')
  assert.equal(selected.run_id, fixture.context_a.run_id)
  assert.equal(selected.device_id, fixture.context_a.device_id)
  await send(update(fixture.context_b, fixture.snapshot_b))
  await unbound.waitForFunction(() => document.querySelector('#bridge-context').dataset.revision === '1')
  assert.equal(await unbound.locator('#bridge-selection').getAttribute('data-component'), '')
  assert(!/560/.test(await unbound.locator('#bridge-values').innerText()))
  record.steps.push('A03/A06：真实未绑定子窗口仅本地选件，完整快照绑定后才发送业务选择，较高revision清除旧状态')
  record.probeMessages = observed
  record.messages = await page.evaluate(() => window.__feiObserve.messages)
  assert(record.messages.every(item => item.trusted && item.origin === origin))
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
  await writeFile(output, JSON.stringify(record, null, 2) + '\n')
  await browser.close()
  record.browserClosed = !browser.isConnected()
  assert.equal(record.browserClosed, true)
  if (record.state === 'FUNCTIONAL_PASS') record.state = 'PASS'
  await writeFile(output, JSON.stringify(record, null, 2) + '\n')
}
