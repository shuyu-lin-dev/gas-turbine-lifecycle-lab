import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFile, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'

const [url, healthUrl, instance, output, python, port] = process.argv.slice(2)
assert(url && healthUrl && instance && output && python && port, '需要页面、健康地址、实例、输出、Python和API端口')
assert(process.env.M0_01_CHROME, '需要明确实际Chrome路径')
assert.equal(new URL(healthUrl).hostname, '127.0.0.1')
const expected = JSON.parse(await readFile(new URL(`../../evidence/M0-01/health-${instance}.json`, import.meta.url)))
const apiUrl = `http://127.0.0.1:${port}/api/v1/health`
const record = { url, healthUrl, instance, processes: [], requests: [], responses: [], failures: [], errors: [], console: [], navigations: [], steps: [] }
let api
let browser
const pending = []

async function startApi() {
  const argv = [python, '-m', 'uvicorn', 'gt_lifecycle_api.app:app', '--host', '127.0.0.1', '--port', port]
  const child = spawn(argv[0], argv.slice(1), {
    env: { ...process.env, API_INSTANCE_ID: instance, API_CORS_ORIGINS: JSON.stringify([new URL(url).origin]) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const entry = { argv, cwd: process.cwd(), pid: child.pid, startedAt: new Date().toISOString(), stdout: '', stderr: '' }
  record.processes.push(entry)
  child.stdout.on('data', data => { entry.stdout += data.toString() })
  child.stderr.on('data', data => { entry.stderr += data.toString() })
  const exited = once(child, 'exit').then(([exitCode, signal]) => {
    Object.assign(entry, { exitCode, signal, stoppedAt: new Date().toISOString() })
  })
  api = { child, exited }
  const deadline = Date.now() + 30000
  while (true) {
    assert.equal(child.exitCode, null, 'API启动时提前退出')
    assert.equal(child.signalCode, null, 'API启动时收到终止信号')
    let response
    try {
      response = await fetch(apiUrl, { signal: AbortSignal.timeout(1000) })
    } catch (error) {
      assert(Date.now() < deadline, `API启动超时：${error}`)
      await delay(100)
      continue
    }
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), expected)
    return
  }
}

async function stopApi() {
  if (!api) return
  const current = api
  api = undefined
  if (current.child.exitCode === null && current.child.signalCode === null) current.child.kill('SIGTERM')
  const timeout = setTimeout(() => current.child.kill('SIGKILL'), 15000)
  try {
    await current.exited
    assert.notEqual(current.child.signalCode, 'SIGKILL', 'API未在15秒内正常退出')
  } finally {
    clearTimeout(timeout)
  }
}

try {
  await startApi()
  browser = await chromium.launch({ executablePath: process.env.M0_01_CHROME, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  page.on('pageerror', error => record.errors.push(String(error)))
  page.on('console', message => record.console.push({ type: message.type(), text: message.text() }))
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) record.navigations.push(frame.url()) })
  page.on('request', request => { if (request.url() === healthUrl) record.requests.push({ url: request.url(), method: request.method() }) })
  page.on('requestfailed', request => { if (request.url() === healthUrl) record.failures.push({ url: request.url(), error: request.failure() }) })
  page.on('response', response => {
    if (response.url() === healthUrl) {
      const entry = { url: response.url(), status: response.status(), method: response.request().method() }
      if (response.status() === 200) pending.push(response.text().then(body => record.responses.push({ ...entry, body })))
      else record.responses.push(entry)
    }
  })
  const document = await page.goto(url)
  assert.equal(document.status(), 200)
  await page.getByText('连接正常', { exact: true }).waitFor({ timeout: 30000 })
  assert.equal(await page.getByTestId('version').innerText(), '0.1.0')
  assert.equal(await page.getByTestId('instance').innerText(), instance)
  record.steps.push({ action: '同一页面初次连接成功', text: await page.locator('body').innerText() })

  await stopApi()
  await page.getByRole('button', { name: '重新检查', exact: true }).click()
  await page.getByText('连接失败', { exact: true }).waitFor({ timeout: 30000 })
  for (const field of ['version', 'instance', 'service-status']) assert.equal(await page.getByTestId(field).count(), 0)
  assert.equal(await page.getByText('gt-lifecycle-api', { exact: true }).count(), 0)
  assert((await page.getByRole('alert').innerText()).length > 0)
  record.steps.push({ action: '实际停止API，原页面点击后失败且清除旧成功字段', text: await page.locator('body').innerText() })

  await startApi()
  await page.getByRole('button', { name: '重新检查', exact: true }).click()
  await page.getByText('连接正常', { exact: true }).waitFor({ timeout: 30000 })
  assert.equal(await page.getByTestId('version').innerText(), '0.1.0')
  assert.equal(await page.getByTestId('instance').innerText(), instance)
  assert.equal(await page.getByTestId('service-status').innerText(), 'ok')
  assert.equal(await page.getByRole('alert').count(), 0)
  record.steps.push({ action: '实际恢复API，原页面点击后连接成功', text: await page.locator('body').innerText() })
  await Promise.all(pending)
  const healthy = record.responses.filter(response => response.status === 200)
  assert.equal(healthy.length, 2)
  for (const response of healthy) assert.deepEqual(JSON.parse(response.body), expected)
  assert.equal(record.requests.length, 3)
  assert.equal(record.navigations.length, 1)
  assert.deepEqual(record.errors, [])
  record.state = 'PASS'
} finally {
  try {
    if (browser) await browser.close()
  } finally {
    try {
      await stopApi()
    } finally {
      await writeFile(output, JSON.stringify(record, null, 2) + '\n')
    }
  }
}
