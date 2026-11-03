import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'

const [root, wheelEnvironment, output] = process.argv.slice(2)
const require = createRequire(join(root, 'frontend/package.json'))
const { chromium } = require('playwright')
await mkdir(output, { recursive: true })
const python = join(wheelEnvironment, 'bin/python')
const record = { candidate: '73d7e29cb2e837eceb4767932e116e76e4916d0f',
  processes: [], commands: [], requests: [], responses: [], requestFailures: [],
  console: [], errors: [], steps: [] }
const processes = []
const pending = []
let browser

async function save() {
  await writeFile(join(output, 'results.json'), JSON.stringify(record, null, 2) + '\n')
}

function start(name, argv, cwd, env = {}) {
  const child = spawn(argv[0], argv.slice(1), { cwd, env: { ...process.env, ...env } })
  const item = { name, argv, cwd, pid: child.pid, startedAt: new Date().toISOString(), stdout: '', stderr: '' }
  child.stdout.on('data', data => { item.stdout += data })
  child.stderr.on('data', data => { item.stderr += data })
  child.on('exit', (code, signal) => { item.exitCode = code; item.signal = signal; item.stoppedAt = new Date().toISOString() })
  record.processes.push(item)
  processes.push(child)
  return child
}

async function stop(child) {
  if (child.exitCode === null && child.signalCode === null) {
    const stopped = new Promise(resolve => child.once('exit', resolve))
    child.kill('SIGTERM')
    await Promise.race([stopped, setTimeout(15000).then(() => { throw Error('进程未在15秒内退出') })])
  }
}

async function ready(url, child) {
  const deadline = Date.now() + 30000
  while (true) {
    assert.equal(child.exitCode, null, '启动进程提前退出')
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) })
      if (response.status === 200) return
    } catch (error) {
      assert(error instanceof TypeError || error.name === 'TimeoutError', String(error))
    }
    assert(Date.now() < deadline, '启动等待超时')
    await setTimeout(100)
  }
}

function api() {
  return start('api', [python, '-m', 'uvicorn', 'gt_lifecycle_api.app:app', '--host', '127.0.0.1', '--port', '8201'], root,
    { API_INSTANCE_ID: 'api-a', API_CORS_ORIGINS: '["http://127.0.0.1:5173"]' })
}

try {
  for (const origins of ['["http://*"]', '["https://*.example.com"]', '["*"]', '["http://127.0.0.1:5173"]']) {
    const argv = [python, '-c', 'import gt_lifecycle_api.app; print(gt_lifecycle_api.app.origins)']
    const result = spawnSync(argv[0], argv.slice(1), { cwd: root,
      env: { ...process.env, API_CORS_ORIGINS: origins }, encoding: 'utf8' })
    record.commands.push({ argv, env: { API_CORS_ORIGINS: origins }, exitCode: result.status,
      stdout: result.stdout, stderr: result.stderr })
  }
  record.wildcardConfigurationRejected = record.commands.slice(0, 2).every(item => item.exitCode !== 0)
  let backend = api()
  await ready('http://127.0.0.1:8201/api/v1/health', backend)
  const web = start('web', ['node', 'node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
    join(root, 'frontend'), { VITE_API_BASE_URL: 'http://127.0.0.1:8201/api/v1' })
  await ready('http://127.0.0.1:5173', web)
  browser = await chromium.launch({ executablePath: process.env.M0_01_CHROME, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  page.on('console', message => record.console.push({ type: message.type(), text: message.text() }))
  page.on('pageerror', error => record.errors.push(String(error)))
  page.on('request', request => record.requests.push({ url: request.url(), method: request.method() }))
  page.on('requestfailed', request => record.requestFailures.push({ url: request.url(), failure: request.failure() }))
  page.on('response', response => {
    if (response.url().endsWith('/health') && response.status() === 200) {
      pending.push(response.text().then(body => record.responses.push({ url: response.url(), status: response.status(), body })))
    }
  })
  assert.equal((await page.goto('http://127.0.0.1:5173')).status(), 200)
  await page.getByText('连接正常', { exact: true }).waitFor()
  assert.equal(await page.getByTestId('version').innerText(), '0.1.0')
  record.steps.push({ action: '同一页面首次成功', text: await page.locator('body').innerText() })
  await stop(backend)
  await page.getByRole('button', { name: '重新检查', exact: true }).click()
  await page.getByText('连接失败', { exact: true }).waitFor()
  assert.equal(await page.getByTestId('version').count(), 0)
  assert.equal(await page.getByTestId('instance').count(), 0)
  assert.equal((await fetch('http://127.0.0.1:5173')).status, 200)
  record.steps.push({ action: '原页面停止API后实际点击重新检查失败且成功字段清除', text: await page.locator('body').innerText() })
  backend = api()
  await ready('http://127.0.0.1:8201/api/v1/health', backend)
  await page.getByRole('button', { name: '重新检查', exact: true }).click()
  await page.getByText('连接正常', { exact: true }).waitFor()
  assert.equal(await page.getByTestId('version').innerText(), '0.1.0')
  assert.equal(await page.getByTestId('instance').innerText(), 'api-a')
  record.steps.push({ action: '原页面恢复API后实际点击重新检查成功', text: await page.locator('body').innerText() })
  await Promise.all(pending)
  const expected = JSON.parse(await readFile(join(root, 'evidence/M0-01/health-api-a.json')))
  assert.equal(record.responses.length, 2)
  for (const response of record.responses) assert.deepEqual(JSON.parse(response.body), expected)
  assert.deepEqual(record.errors, [])
  record.samePageRecovery = 'PASS'
  assert(record.wildcardConfigurationRejected, '冻结要求拒绝通配origin，实际配置被接受')
} finally {
  if (browser) await browser.close()
  for (const child of processes) await stop(child)
  await save()
}
