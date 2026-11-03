import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { pageFailureGuard } from './page-failure-guard.mjs'
import { invalidProtocolCases } from './invalid-protocol-cases.mjs'
import { cameraChangedAfterInput } from '../../scripts/fe-base/camera-observation.mjs'

const [url, output] = process.argv.slice(2)
assert(url && output && process.env.M0_01_CHROME)
const fixture = JSON.parse(await readFile(new URL('../../evidence/FE-INTEGRATE/bridge-fixture.json', import.meta.url)))
const started = performance.now()
const record = { url, started_at: new Date().toISOString(), steps: [], errors: [], console: [], responses: [], messages: [], lifecycle: [], rejections: [], timeline: [], windows: [] }
const guard = pageFailureGuard(record)
const save = () => writeFile(output, JSON.stringify(record, null, 2) + '\n')
const browser = await chromium.launch({ executablePath: process.env.M0_01_CHROME,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const origin = new URL(url).origin
const ids = ['compressor', 'combustor', 'turbine', 'bearing_front', 'exhaust']
const pageIds = new WeakMap(), frameIds = new WeakMap()
let pageSequence = 0, frameSequence = 0
const timeline = (event, details = {}) => record.timeline.push({ event, observed_elapsed_ms: performance.now() - started, ...details })
const redactText = text => text.replace(/([?&](?:token|password|authorization|secret|signature|credential|api_key)=)[^&\s"'`]+/gi, '$1[REDACTED]')
function safeUrl(value) {
  if (!value) return value
  const parsed = new URL(value)
  for (const key of [...parsed.searchParams.keys()]) {
    if (/token|password|authorization|secret|signature|credential|api_key/i.test(key)) parsed.searchParams.set(key, '[REDACTED]')
  }
  return parsed.href
}
function pageDetails(page) {
  return { page_id: pageIds.get(page), page_url: safeUrl(page.url()), page_closed: page.isClosed() }
}
function frameDetails(frame) {
  if (!frameIds.has(frame)) frameIds.set(frame, `frame-${++frameSequence}`)
  const parent = frame.parentFrame()
  return { frame_id: frameIds.get(frame), frame_name: frame.name(), frame_url: safeUrl(frame.url()),
    parent_frame_id: parent ? frameDetails(parent).frame_id : null, is_main_frame: frame === frame.page().mainFrame() }
}
function observePage(page, role) {
  if (pageIds.has(page)) return
  pageIds.set(page, `${role}-${++pageSequence}`)
  guard.watch(page)
  record.windows.push({ role, ...pageDetails(page) })
  timeline('page-observed', { role, ...pageDetails(page) })
  page.on('framenavigated', frame => timeline('frame-navigated', { ...pageDetails(page), ...frameDetails(frame) }))
  page.on('frameattached', frame => timeline('frame-attached', { ...pageDetails(page), ...frameDetails(frame) }))
  page.on('framedetached', frame => timeline('frame-detached', { ...pageDetails(page), ...frameDetails(frame) }))
  page.on('domcontentloaded', () => timeline('domcontentloaded', pageDetails(page)))
  page.on('load', () => timeline('load', pageDetails(page)))
  page.on('close', () => timeline('page-close', pageDetails(page)))
  page.on('crash', () => timeline('page-crash', pageDetails(page)))
  page.on('requestfailed', request => timeline('request-failed', { ...pageDetails(page), request_url: safeUrl(request.url()),
    navigation_request: request.isNavigationRequest(), error: request.failure()?.errorText ?? null }))
  page.on('console', message => timeline('page-console', { ...pageDetails(page), type: message.type(), text: redactText(message.text()) }))
}
browser.on('disconnected', () => timeline('browser-disconnected'))
async function verify() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce', timezoneId: 'Asia/Shanghai' })
  observePage(page, 'business-page')
  page.context().on('page', created => observePage(created, 'popup'))
  page.setDefaultTimeout(120000)
  await page.addInitScript({ path: new URL('./observe-bridge.js', import.meta.url).pathname })
  await page.addInitScript({ path: new URL('../../scripts/fe-base/observe-webgl.js', import.meta.url).pathname })
  await page.addInitScript(() => localStorage.setItem('turbine-quality', 'balanced'))
  page.on('console', message => record.console.push({ type: message.type(), text: redactText(message.text()) }))
  page.on('response', response => record.responses.push({ url: safeUrl(response.url()), status: response.status() }))
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
    const before = await frame.evaluate(() => window.__feiObserve.messageEvents)
    await page.evaluate(({ message, origin }) => document.querySelector('iframe[title="燃气轮机教学模型"]').contentWindow.postMessage(message, origin), { message, origin })
    await frame.waitForFunction(before => window.__feiObserve.messageEvents > before, before)
  }
  async function toParent(frame, message) {
    const before = await page.evaluate(() => window.__feiObserve.messageEvents)
    await frame.evaluate(({ message, origin }) => parent.postMessage(message, origin), { message, origin })
    await page.waitForFunction(before => window.__feiObserve.messageEvents > before, before)
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
  const badUnit = structuredClone(fixture.snapshot_a)
  badUnit.components[4].measurements[0].unit = 'u\u0085'
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
    ['单位包含C1控制字符', { ...base, type: 'update-component-state', payload: badUnit }],
  ]
  for (const [name, message] of badMessages) {
    const beforeParent = await parentState(), beforeChild = await childState(frame)
    await toChild(frame, message)
    await toParent(frame, message.type === 'select-component' ? { ...message, type: 'component-selected', payload: { ...message.payload, trigger: 'user', result: 'selected' } } : message)
    assert.deepEqual(await parentState(), beforeParent, name)
    assert.deepEqual(await childState(frame), beforeChild, name)
    record.rejections.push({ name, beforeParent, beforeChild, result: 'PASS' })
  }
  const matrixMessages = [
    { schema_version: '1', type: 'viewer-ready', viewer_instance_id: instance, context_revision: null, payload: {} },
    base,
    { ...base, type: 'component-selected', payload: { ...base.payload, trigger: 'request', result: 'selected' } },
    { ...base, type: 'update-component-state', payload: fixture.snapshot_a },
  ]
  record.protocolMatrix = []
  for (const message of matrixMessages) {
    const cases = invalidProtocolCases(message)
    for (const invalid of cases) {
      const beforeParent = await parentState(), beforeChild = await childState(frame)
      if (['viewer-ready', 'component-selected'].includes(message.type)) await toParent(frame, invalid.message)
      else await toChild(frame, invalid.message)
      assert.deepEqual(await parentState(), beforeParent, invalid.name)
      assert.deepEqual(await childState(frame), beforeChild, invalid.name)
      record.protocolMatrix.push({ type: message.type, name: invalid.name, beforeParent, beforeChild, result: 'PASS' })
    }
  }
  await step('A02：四消息必填缺失、额外字段与各类非法输入经真实Window拒绝，父子业务保持')
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
  timeline('window-open-start', { ...pageDetails(page), target_url: safeUrl(other.href) })
  const popupEvent = page.waitForEvent('popup')
  await page.evaluate(target => window.open(target, 'wrong-origin'), other.href)
  const popup = await popupEvent
  observePage(popup, 'popup')
  timeline('popup-acquired', pageDetails(popup))
  timeline('popup-target-wait-start', { ...pageDetails(popup), expected_url: safeUrl(other.href) })
  await popup.waitForURL(other.href, { waitUntil: 'domcontentloaded', timeout: 120000 })
  timeline('popup-target-wait-complete', pageDetails(popup))
  const originBefore = await page.evaluate(() => window.__feiObserve.messages.length)
  timeline('popup-evaluate-start', pageDetails(popup))
  await save()
  const popupDocument = await popup.evaluate(({ message, origin }) => {
    const identity = { url: location.href, origin: location.origin, document_time_origin_ms: performance.timeOrigin,
      document_elapsed_ms: performance.now(), ready_state: document.readyState, opener_present: window.opener !== null }
    window.opener.postMessage(message, origin)
    return identity
  }, { message: userMessage, origin })
  timeline('popup-evaluate-complete', { ...pageDetails(popup), document: { ...popupDocument, url: safeUrl(popupDocument.url) } })
  assert.equal(popupDocument.url, other.href)
  assert.equal(popupDocument.origin, other.origin)
  assert.equal(popupDocument.opener_present, true)
  await page.waitForFunction(count => window.__feiObserve.messages.length > count, originBefore)
  const wrongOrigin = await page.evaluate(() => window.__feiObserve.messages.at(-1))
  assert.equal(wrongOrigin.origin, other.origin)
  assert.notEqual(wrongOrigin.origin, origin)
  assert.deepEqual(await parentState(), beforeSource)
  const beforeWrongTarget = await childState(frame), parentBeforeWrongTarget = await parentState()
  const childMessageCount = await frame.evaluate(() => window.__feiObserve.messages.length)
  const wrongTargetSelect = { ...base, payload: { component_id: 'compressor', request_id: 'wrong-target-to-child' } }
  await page.evaluate(({ message, target }) => document.querySelector('iframe[title="燃气轮机教学模型"]').contentWindow.postMessage(message, target),
    { message: wrongTargetSelect, target: other.origin })
  await toChild(frame, { schema_version: '1', type: 'viewer-ready', viewer_instance_id: instance, context_revision: null, payload: {} })
  assert.equal(await frame.evaluate(() => window.__feiObserve.messages.length), childMessageCount + 1)
  assert.deepEqual(await childState(frame), beforeWrongTarget)
  const parentMessageCount = await page.evaluate(() => window.__feiObserve.messages.length)
  await frame.evaluate(({ message, target }) => parent.postMessage(message, target),
    { message: { ...userMessage, payload: { ...userMessage.payload, request_id: 'wrong-target-to-parent' } }, target: other.origin })
  await toParent(frame, ready.data)
  assert.equal(await page.evaluate(() => window.__feiObserve.messages.length), parentMessageCount + 1)
  assert.deepEqual(await parentState(), parentBeforeWrongTarget)
  record.wrongTarget = { parentMessageCount, childMessageCount, result: 'PASS' }

  await popup.addInitScript({ path: new URL('./observe-bridge.js', import.meta.url).pathname })
  await popup.addInitScript(() => localStorage.setItem('turbine-quality', 'balanced'))
  record.foreignParentConsole = []
  popup.on('console', message => record.foreignParentConsole.push({ type: message.type(), text: redactText(message.text()) }))
  await popup.evaluate(childOrigin => {
    const iframe = document.createElement('iframe')
    iframe.name = 'foreign-parent-viewer'
    iframe.style.cssText = 'width:1000px;height:700px;display:block'
    iframe.src = `${childOrigin}/viewer/?embedded=1&viewer_instance_id=foreign-parent&lang=zh&experience=console&presentation=console&speed=0`
    document.body.append(iframe)
  }, origin)
  const foreignChild = await (await popup.locator('iframe[name="foreign-parent-viewer"]').elementHandle()).contentFrame()
  await foreignChild.locator('.bridge-status').waitFor()
  const foreignBefore = await childState(foreignChild)
  const foreignMessageCount = await foreignChild.evaluate(() => window.__feiObserve.messages.length)
  await popup.evaluate(({ message, origin }) => document.querySelector('iframe[name="foreign-parent-viewer"]').contentWindow.postMessage(message, origin),
    { message: { schema_version: '1', type: 'update-component-state', viewer_instance_id: 'foreign-parent', ...fixture.context_a, payload: fixture.snapshot_a }, origin })
  await foreignChild.waitForFunction(count => window.__feiObserve.messages.length > count, foreignMessageCount)
  const foreignEvent = await foreignChild.evaluate(() => window.__feiObserve.messages.at(-1))
  assert.equal(foreignEvent.source, 'parent')
  assert.equal(foreignEvent.origin, other.origin)
  assert.equal(foreignEvent.trusted, true)
  assert.deepEqual(await childState(foreignChild), foreignBefore)
  record.childWrongOrigin = foreignEvent
  await popup.close()
  await page.evaluate(() => document.querySelector('iframe[name="wrong-source"]').remove())
  record.wrongOrigin = wrongOrigin
  await step('A02/A04：父子真实Window拒绝错误source/origin、错误targetOrigin不送达、实例/协议/部件/范围/载荷拒绝')

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
  const staleSelect = { ...base, device_id: 'fixture-device-b', run_id: 'fixture-run-b', context_revision: 1,
    payload: { component_id: 'compressor', request_id: 'old-revision-selection' } }
  const acknowledgementsBefore = await page.evaluate(request => window.__feiObserve.messages.filter(entry => entry.data.payload?.request_id === request).length, staleSelect.payload.request_id)
  await toChild(frame, staleSelect)
  await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  assert.deepEqual(await childState(frame), newState)
  assert.deepEqual(await parentState(), parentNewState)
  assert.equal(await page.evaluate(request => window.__feiObserve.messages.filter(entry => entry.data.payload?.request_id === request).length, staleSelect.payload.request_id), acknowledgementsBefore)
  record.oldRevisionSelection = { message: staleSelect, parent: parentNewState, child: newState, acknowledgementsBefore }
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
    const oldFrame = frame
    const oldStats = await frame.evaluate(() => ({ frames: window.__feiObserve.frames, deleted: window.__feiObserve.deletedResources,
      resources: { ...window.__feiObserve.resources }, context: { device_id: document.querySelector('#bridge-context').dataset.device,
        run_id: document.querySelector('#bridge-context').dataset.run, context_revision: Number(document.querySelector('#bridge-context').dataset.revision) } }))
    const staleMessage = { schema_version: '1', type: 'component-selected', viewer_instance_id: new URL(oldHref).searchParams.get('viewer_instance_id'),
      ...oldStats.context, payload: { component_id: 'compressor', request_id: `old-frame-cycle-${cycle}`, trigger: 'user', result: 'selected' } }
    timeline('old-window-unload-start', { cycle: cycle + 1, ...pageDetails(page), ...frameDetails(oldFrame), old_href: safeUrl(oldHref) })
    await save()
    await page.evaluate(message => {
      const document = window.document.querySelector('iframe[title="燃气轮机教学模型"]').contentDocument
      const script = document.createElement('script')
      script.textContent = `parent.postMessage(${JSON.stringify(message)}, location.origin); parent.document.querySelector('.workspace-nav button').click()`
      document.body.append(script)
    }, staleMessage)
    await page.waitForFunction(() => document.querySelectorAll('iframe[title="燃气轮机教学模型"]').length === 0)
    assert.equal(oldFrame.isDetached(), true)
    timeline('old-window-unload-complete', { cycle: cycle + 1, ...pageDetails(page), ...frameDetails(oldFrame), detached: oldFrame.isDetached() })
    assert.equal(await page.evaluate(() => window.__feiObserve.messageListeners), baselineListeners)
    await page.getByRole('button', { name: '模型联动', exact: true }).click()
    frame = await getFrame()
    assert.notEqual(frame.url(), oldHref)
    assert.equal(await frame.locator('#scene').count(), 1)
    assert.equal(await page.evaluate(() => window.__feiObserve.messageListeners), baselineListeners + 1)
    const detached = await page.evaluate(old => window.__feiDocuments.find(item => item.href === old), oldHref)
    for (const kind of ['deleteBuffer', 'deleteTexture', 'deleteProgram']) {
      assert(detached.resources[kind] > oldStats.resources[kind], `第${cycle + 1}次卸载必须新增${kind}实际调用`)
    }
    assert.equal(detached.messageListeners, 0)
    const staleEvent = await page.evaluate(request => window.__feiObserve.messages.find(item => item.data.payload?.request_id === request), staleMessage.payload.request_id)
    assert(staleEvent && staleEvent.trusted)
    assert.equal(staleEvent.source, 'other')
    assert.equal((await parentState()).selected, '无')
    assert.equal((await parentState()).count, '0')
    const stoppedFrames = detached.frames
    await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    assert.equal(await page.evaluate(old => window.__feiDocuments.find(item => item.href === old).frames, oldHref), stoppedFrames)
    record.lifecycle.push({ cycle: cycle + 1, oldHref, newHref: frame.url(), oldStats, detached })
    await save()
  }
  await step('A06：连续五次实际卸载/挂载，父监听器恢复原数目，旧frame回调停止，无重复iframe或主画布')

  const cameraContext = await parentState()
  const observeCamera = () => frame.evaluate(() => window.__feBaseObserve('#scene'))
  const rotationDelta = (a, b) => Math.max(...[0, 1, 2, 4, 5, 6, 8, 9, 10].map(index => Math.abs(a[index] - b[index])))
  const distance = matrix => Math.hypot(...matrix.slice(12, 15))
  await frame.waitForFunction(() => window.__feBaseObserve('#scene')?.main.length > 0)
  const cameraBefore = await observeCamera()
  await frame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const stationary = await observeCamera()
  assert(rotationDelta(cameraBefore.main[0].matrix, stationary.main[0].matrix) <= 1e-5)
  const canvas = frame.locator('#scene')
  const cameraBounds = await canvas.boundingBox()
  assert(await canvas.evaluate(canvas => {
    const bounds = canvas.getBoundingClientRect()
    return document.elementFromPoint(bounds.left + bounds.width * .55, bounds.top + bounds.height * .52) === canvas
  }))
  const input = { x: cameraBounds.x + cameraBounds.width * .55, y: cameraBounds.y + cameraBounds.height * .52, dx: 160, dy: 80 }
  await page.mouse.move(input.x, input.y)
  await page.mouse.down()
  await page.mouse.move(input.x + input.dx, input.y + input.dy, { steps: 12 })
  await page.mouse.up()
  await frame.waitForFunction(cameraChangedAfterInput, { selector: '#scene', reference: stationary.main[0].matrix,
    operation: 'rotate', afterInput: stationary.inputSequence })
  const rotated = await observeCamera()
  assert(rotationDelta(stationary.main[0].matrix, rotated.main[0].matrix) > 1e-5)
  await page.mouse.move(input.x, input.y)
  const inward = await observeCamera()
  await page.mouse.wheel(0, -600)
  await frame.waitForFunction(cameraChangedAfterInput, { selector: '#scene', reference: inward.main[0].matrix,
    operation: 'zoom-in', afterInput: inward.inputSequence })
  const zoomed = await observeCamera()
  assert(distance(inward.main[0].matrix) - distance(zoomed.main[0].matrix) > .01)
  const outward = await observeCamera()
  await page.mouse.wheel(0, 600)
  await frame.waitForFunction(cameraChangedAfterInput, { selector: '#scene', reference: outward.main[0].matrix,
    operation: 'zoom-out', afterInput: outward.inputSequence })
  const restored = await observeCamera()
  assert(distance(restored.main[0].matrix) - distance(outward.main[0].matrix) > .01)
  const afterCamera = await parentState()
  for (const key of ['device', 'run', 'revision']) assert.equal(afterCamera[key], cameraContext[key])
  record.embeddedCamera = { frame: frameDetails(frame), input, before: cameraBefore, stationary, rotated, zoomed, restored }
  await step('A05/A06：真实嵌入canvas旋转与双向缩放改变GPU镜头矩阵，保持设备、批次与revision')

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
  assert(!record.timeline.some(entry => entry.event === 'page-crash'))
  assert(!record.responses.some(response => response.status >= 400 && !response.url.includes('/api/')))
  record.state = 'FUNCTIONAL_PASS'
}
try {
  await guard.run(verify)
} catch (error) {
  record.state = 'FAIL'
  record.failure = { name: error.name, message: error.message }
  throw error
} finally {
  timeline('browser-close-start', { connected: browser.isConnected() })
  await save()
  await browser.close()
  record.browserClosed = !browser.isConnected()
  timeline('browser-close-complete', { connected: browser.isConnected() })
  assert.equal(record.browserClosed, true)
  record.finished_at = new Date().toISOString()
  if (record.state === 'FUNCTIONAL_PASS') record.state = 'PASS'
  await save()
}
