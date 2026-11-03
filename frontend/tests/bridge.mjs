import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const [url, output] = process.argv.slice(2)
assert(url && output && process.env.M0_01_CHROME)
const fixture = JSON.parse(await readFile(new URL('../../evidence/FE-INTEGRATE/bridge-fixture.json', import.meta.url)))
const record = { url, steps: [], errors: [], console: [], responses: [], messages: [], lifecycle: [], rejections: [] }
const save = () => writeFile(output, JSON.stringify(record, null, 2) + '\n')
const browser = await chromium.launch({ executablePath: process.env.M0_01_CHROME,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const origin = new URL(url).origin
const ids = ['compressor', 'combustor', 'turbine', 'bearing_front', 'exhaust']
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce', timezoneId: 'Asia/Shanghai' })
  page.setDefaultTimeout(120000)
  await page.addInitScript({ path: new URL('./observe-bridge.js', import.meta.url).pathname })
  await page.addInitScript(() => localStorage.setItem('turbine-quality', 'balanced'))
  page.on('pageerror', error => record.errors.push(String(error)))
  page.on('console', message => record.console.push({ type: message.type(), text: message.text() }))
  page.on('response', response => record.responses.push({ url: response.url(), status: response.status() }))
  const step = async name => { record.steps.push(name); await save() }
  const getFrame = async () => {
    await page.getByText('模型已就绪', { exact: true }).waitFor()
    const frame = await (await page.locator('iframe[title="燃气轮机教学模型"]').elementHandle()).contentFrame()
    await frame.waitForFunction(() => document.querySelector('#bridge-context')?.dataset.revision !== undefined)
    await frame.waitForFunction(() => window.__feiObserve.draws > 100)
    return frame
  }
  const parentState = () => page.evaluate(() => ({ device: document.querySelector('[data-testid="device"]').textContent,
    run: document.querySelector('[data-testid="run"]').textContent, revision: document.querySelector('[data-testid="revision"]').textContent,
    selected: document.querySelector('[data-testid="selected-component"]').textContent,
    count: document.querySelector('[data-testid="selection-count"]').textContent,
    quality: document.querySelector('[data-testid="quality"]').textContent }))
  const childState = frame => frame.evaluate(() => ({ context: document.querySelector('#bridge-context').textContent,
    selected: document.querySelector('#bridge-selection').textContent, values: document.querySelector('#bridge-values').textContent }))
  async function toChild(frame, message) {
    const before = await frame.evaluate(() => window.__feiObserve.messages.length)
    await page.evaluate(({ message, origin }) => document.querySelector('iframe[title="燃气轮机教学模型"]').contentWindow.postMessage(message, origin), { message, origin })
    await frame.waitForFunction(before => window.__feiObserve.messages.length > before, before)
  }
  async function toParent(frame, message) {
    const before = await page.evaluate(() => window.__feiObserve.messages.length)
    await frame.evaluate(({ message, origin }) => parent.postMessage(message, origin), { message, origin })
    await page.waitForFunction(before => window.__feiObserve.messages.length > before, before)
  }
  await page.goto(url)
  const baselineListeners = await page.evaluate(() => window.__feiObserve.messageListeners)
  await page.getByRole('button', { name: '模型联动', exact: true }).click()
  let frame = await getFrame()
  assert.equal(new URL(frame.url()).origin, origin)
  assert.equal(new URL(frame.url()).pathname, '/viewer/')
  assert.equal(await frame.locator('#scene').count(), 1)
  const instance = new URL(frame.url()).searchParams.get('viewer_instance_id')
  const initialMessages = await page.evaluate(() => window.__feiObserve.messages)
  const initialChildMessages = await frame.evaluate(() => window.__feiObserve.messages)
  const ready = initialMessages.find(item => item.data.type === 'viewer-ready')
  assert.equal(ready.data.context_revision, null)
  assert.equal(Object.hasOwn(ready.data, 'run_id'), false)
  assert.equal(Object.hasOwn(ready.data, 'device_id'), false)
  assert.equal(ready.source, 'viewer')
  assert.equal(ready.origin, origin)
  assert.equal(ready.trusted, true)
  assert.equal(initialChildMessages[0].data.type, 'update-component-state')
  assert.deepEqual(initialChildMessages[0].data.payload, fixture.snapshot_b)
  await step('A01/A03：真实同源完整viewer、null ready与首条完整无数据快照')

  await page.getByRole('button', { name: '装载状态夹具 A', exact: true }).click()
  await frame.waitForFunction(() => document.querySelector('#bridge-values [data-component="exhaust"]').dataset.status === 'alarm')
  const colors = Object.values(fixture.expected.status_colors).map(hex => {
    const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    return rgb.map(value => (value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4) * .45)
  })
  record.gpuBeforeCheck = await frame.evaluate(() => ({ draws: window.__feiObserve.draws, emissiveDraws: window.__feiObserve.emissiveDraws }))
  record.expectedColors = colors
  await save()
  await frame.waitForFunction(colors => colors.every(expected => Object.keys(window.__feiObserve.emissiveDraws).some(key =>
    key.split(',').every((value, index) => Math.abs(Number(value) - expected[index]) <= 1e-6))), colors, { timeout: 120000 })
  record.gpuFixture = await frame.evaluate(() => ({ draws: window.__feiObserve.draws, emissiveDraws: window.__feiObserve.emissiveDraws }))
  assert.match(await frame.locator('#bridge-values').innerText(), /560 °C/)
  assert.match(await frame.locator('#bridge-values').innerText(), /2026-11-03T00:00:00.000Z/)
  for (const id of [...ids, 'aux_pump']) {
    record.phase = `parent-selection-${id}`
    await save()
    const count = Number((await parentState()).count)
    await page.locator(`.component-list [data-component="${id}"]`).click()
    await frame.waitForFunction(id => document.querySelector('#bridge-selection').dataset.component === id, id)
    await page.waitForFunction(count => Number(document.querySelector('[data-testid="selection-count"]').textContent) === count + 1, count)
    assert.equal((await parentState()).selected, id)
    if (id === 'aux_pump') assert.match(await frame.locator('#bridge-selection').innerText(), /该部件暂不可定位 aux_pump/)
  }
  for (const id of ids) {
    record.phase = `viewer-selection-${id}`
    await save()
    const count = Number((await parentState()).count)
    await frame.locator(`.bridge-status button[data-component="${id}"]`).click()
    await page.waitForFunction(id => document.querySelector('[data-testid="selected-component"]').textContent === id, id)
    assert.equal(Number((await parentState()).count), count + 1)
  }
  assert.equal((await parentState()).revision, '上下文版本 0')
  await page.locator('.component-list [data-component="exhaust"]').click()
  await frame.waitForFunction(() => document.querySelector('#bridge-selection').dataset.component === 'exhaust')
  await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const canvasBounds = await frame.locator('#scene').boundingBox()
  const beforeCanvasCount = Number((await parentState()).count)
  record.canvasInputs = []
  for (const [x, y] of [[.5, .45], [.56, .45], [.44, .45], [.5, .53], [.56, .53], [.44, .53], [.5, .37], [.56, .37], [.44, .37]]) {
    await frame.locator('#scene').click({ position: { x: canvasBounds.width * x, y: canvasBounds.height * y } })
    await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)))
    const state = await parentState()
    record.canvasInputs.push({ x, y, state })
    if (Number(state.count) > beforeCanvasCount) break
  }
  const afterCanvas = await parentState()
  assert.equal(Number(afterCanvas.count), beforeCanvasCount + 1, '真实canvas拾取产生一次业务选择')
  assert(ids.includes(afterCanvas.selected))
  await step('A05：五个真实几何双向选件、canvas拾取、未知编号、夹具测量和实际GPU材质上传及绘制')

  const requests = await frame.evaluate(() => window.__feiObserve.messages.filter(item => item.data.type === 'select-component').map(item => item.data))
  const ackMessages = await page.evaluate(() => window.__feiObserve.messages.filter(item => item.data.type === 'component-selected').map(item => item.data))
  const countBeforeDuplicate = (await parentState()).count
  const messageCountBefore = ackMessages.length
  for (let repeat = 0; repeat < 3; repeat++) await toChild(frame, requests[0])
  for (let repeat = 0; repeat < 3; repeat++) await toParent(frame, ackMessages[0])
  assert.equal((await parentState()).count, countBeforeDuplicate)
  assert.equal((await page.evaluate(() => window.__feiObserve.messages.filter(item => item.data.type === 'component-selected'))).length, messageCountBefore + 3)
  const totalBefore = await page.evaluate(() => window.__feiObserve.messages.length)
  await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  assert.equal(await page.evaluate(() => window.__feiObserve.messages.length), totalBefore)
  await step('A05：重复请求只定位一次，重复及迟到回执无重复业务动作，消息排空后稳定')

  const base = { schema_version: '1', type: 'select-component', viewer_instance_id: instance, ...fixture.context_a,
    payload: { component_id: 'compressor', request_id: 'rejection-case' } }
  const badMessages = [
    ['错误实例', { ...base, viewer_instance_id: 'old-instance' }],
    ['未知类型', { ...base, type: 'fifth-message' }],
    ['非法部件', { ...base, payload: { component_id: '../turbine', request_id: 'bad-component' } }],
    ['错误设备', { ...base, device_id: 'another-device' }],
    ['错误批次', { ...base, run_id: 'another-run' }],
    ['错误revision类型', { ...base, context_revision: '0' }],
    ['字段缺失', { ...base, payload: { component_id: 'turbine' } }],
    ['额外字段', { ...base, extra: true }],
    ['错误schema', { ...base, schema_version: 2 }],
    ['错误状态快照', { ...base, type: 'update-component-state', payload: { ...fixture.snapshot_a, measurement_quality: 'no_data' } }],
  ]
  for (const [name, message] of badMessages) {
    const beforeParent = await parentState(), beforeChild = await childState(frame)
    await toChild(frame, message)
    await toParent(frame, message.type === 'select-component' ? { ...message, type: 'component-selected', payload: { ...message.payload, trigger: 'user', result: 'selected' } } : message)
    assert.deepEqual(await parentState(), beforeParent, name)
    assert.deepEqual(await childState(frame), beforeChild, name)
    record.rejections.push({ name, beforeParent, beforeChild, result: 'PASS' })
  }
  await page.evaluate(() => { const probe = document.createElement('iframe'); probe.name = 'wrong-source'; probe.src = 'about:blank'; document.body.append(probe) })
  const probe = page.frame({ name: 'wrong-source' })
  const beforeSource = await parentState(), childBeforeSource = await childState(frame)
  const userMessage = { ...base, type: 'component-selected', payload: { component_id: 'compressor', request_id: 'wrong-source', trigger: 'user', result: 'selected' } }
  const observedBeforeSource = await page.evaluate(() => window.__feiObserve.messages.length)
  await probe.evaluate(({ userMessage, base, origin }) => {
    parent.postMessage(userMessage, origin)
    parent.document.querySelector('iframe[title="燃气轮机教学模型"]').contentWindow.postMessage(base, origin)
  }, { userMessage, base, origin })
  await page.waitForFunction(count => window.__feiObserve.messages.length > count, observedBeforeSource)
  assert.deepEqual(await parentState(), beforeSource)
  assert.deepEqual(await childState(frame), childBeforeSource)
  const other = new URL(url)
  other.hostname = other.hostname === 'localhost' ? '127.0.0.1' : 'localhost'
  const popupEvent = page.waitForEvent('popup')
  await page.evaluate(target => window.open(target, 'wrong-origin'), other.href)
  const popup = await popupEvent
  await popup.waitForLoadState('domcontentloaded')
  const originBefore = await page.evaluate(() => window.__feiObserve.messages.length)
  await popup.evaluate(({ message, origin }) => window.opener.postMessage(message, origin), { message: userMessage, origin })
  await page.waitForFunction(count => window.__feiObserve.messages.length > count, originBefore)
  const wrongOrigin = await page.evaluate(() => window.__feiObserve.messages.at(-1))
  assert.equal(wrongOrigin.origin, other.origin)
  assert.notEqual(wrongOrigin.origin, origin)
  assert.deepEqual(await parentState(), beforeSource)
  await popup.close()
  await page.evaluate(() => document.querySelector('iframe[name="wrong-source"]').remove())
  record.wrongOrigin = wrongOrigin
  await step('A02/A04：真实Window拒绝错误source/origin、实例、协议、部件、范围和载荷')

  const hrefBeforeSwitch = frame.url()
  await page.getByLabel('夹具设备', { exact: true }).selectOption('fixture-device-b')
  await frame.waitForFunction(() => document.querySelector('#bridge-context').dataset.revision === '1')
  assert.equal(frame.url(), hrefBeforeSwitch)
  assert.equal((await parentState()).device, 'fixture-device-b')
  assert.equal((await parentState()).selected, '无')
  assert(!/560/.test((await childState(frame)).values))
  await page.getByLabel('夹具批次', { exact: true }).selectOption('fixture-run-b')
  await frame.waitForFunction(() => document.querySelector('#bridge-context').dataset.revision === '2')
  assert.equal(frame.url(), hrefBeforeSwitch)
  const newState = await childState(frame), parentNewState = await parentState()
  await frame.evaluate(() => { window.__feiObserve.emissiveDraws = {} })
  for (const context of [fixture.context_a, { run_id: 'wrong-run', device_id: 'fixture-device-b', context_revision: 2 },
    { run_id: 'fixture-run-b', device_id: 'wrong-device', context_revision: 2 }]) {
    await toChild(frame, { schema_version: '1', type: 'update-component-state', viewer_instance_id: instance, ...context, payload: fixture.snapshot_a })
    assert.deepEqual(await childState(frame), newState)
  }
  await toParent(frame, { schema_version: '1', type: 'viewer-ready', viewer_instance_id: 'old-instance', context_revision: null, payload: {} })
  await toParent(frame, ready.data)
  await toParent(frame, { ...userMessage, viewer_instance_id: instance, ...fixture.context_a })
  assert.deepEqual(await parentState(), parentNewState)
  await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const afterSwitch = await frame.evaluate(() => window.__feiObserve.emissiveDraws)
  const alarm = colors[2]
  assert(!Object.keys(afterSwitch).some(key => key.split(',').every((value, index) => Math.abs(Number(value) - alarm[index]) <= 1e-6)))
  record.gpuAfterSwitch = afterSwitch
  await step('A04/A06：同一iframe切换设备和批次递增revision，清除旧值与颜色，拒绝旧快照/旧ready/相等revision的其他范围')

  const resourcesBefore = await frame.evaluate(() => window.__feiObserve.deletedResources)
  await page.evaluate(() => { document.querySelector('iframe[title="燃气轮机教学模型"]').src = 'about:blank' })
  await page.waitForFunction(old => {
    const src = document.querySelector('iframe[title="燃气轮机教学模型"]')?.src
    return src && src !== old && src.includes('/viewer/')
  }, hrefBeforeSwitch)
  frame = await getFrame()
  assert.notEqual(new URL(frame.url()).searchParams.get('viewer_instance_id'), instance)
  const previous = await page.evaluate(old => window.__feiDocuments.find(item => item.href === old), hrefBeforeSwitch)
  assert(previous.deletedResources > resourcesBefore, '旧帧离开时需要新增实际GPU资源释放')
  assert.equal(previous.messageListeners, 0)
  await step('A03/A06：已有frame再次load建立新实例，旧实例清理桥接及实际GPU资源')

  for (let cycle = 0; cycle < 5; cycle++) {
    const oldHref = frame.url()
    const oldStats = await frame.evaluate(() => ({ frames: window.__feiObserve.frames, deleted: window.__feiObserve.deletedResources }))
    await page.getByRole('button', { name: '服务连接', exact: true }).click()
    assert.equal(await page.locator('iframe[title="燃气轮机教学模型"]').count(), 0)
    assert.equal(await page.evaluate(() => window.__feiObserve.messageListeners), baselineListeners)
    await page.getByRole('button', { name: '模型联动', exact: true }).click()
    frame = await getFrame()
    assert.notEqual(frame.url(), oldHref)
    assert.equal(await frame.locator('#scene').count(), 1)
    assert.equal(await page.evaluate(() => window.__feiObserve.messageListeners), baselineListeners + 1)
    const detached = await page.evaluate(old => window.__feiDocuments.find(item => item.href === old), oldHref)
    const stoppedFrames = detached.frames
    await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    assert.equal(await page.evaluate(old => window.__feiDocuments.find(item => item.href === old).frames, oldHref), stoppedFrames)
    record.lifecycle.push({ cycle: cycle + 1, oldHref, newHref: frame.url(), oldStats, detached })
    await save()
  }
  await step('A06：连续五次实际卸载/挂载，父监听器恢复原数目，旧frame回调停止，无重复iframe或主画布')

  await page.setViewportSize({ width: 390, height: 844 })
  await frame.waitForFunction(() => Math.abs(document.querySelector('#scene').getBoundingClientRect().width - innerWidth) < 1)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  const bounds = await frame.locator('#scene').boundingBox()
  assert(bounds.width > 0 && bounds.height > 0)
  record.smallViewport = bounds
  await step('A01：iframe窄屏尺寸变化与可用主画布，无父页面横向溢出')
  record.messages = await page.evaluate(() => window.__feiObserve.messages)
  record.childMessages = await frame.evaluate(() => window.__feiObserve.messages)
  assert.deepEqual(record.errors, [])
  assert(!record.responses.some(response => response.status >= 400 && !response.url.includes('/api/')))
  record.state = 'FUNCTIONAL_PASS'
} catch (error) {
  record.state = 'FAIL'
  record.failure = { name: error.name, message: error.message }
  throw error
} finally {
  await save()
  await browser.close()
  record.browserClosed = true
  if (record.state === 'FUNCTIONAL_PASS') record.state = 'PASS'
  await save()
}
