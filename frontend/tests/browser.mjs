import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const [url, healthUrl, instance, output, mode = 'healthy'] = process.argv.slice(2)
assert(url && healthUrl && instance && output, '需要页面URL、健康URL、实例和输出路径')
assert(['healthy', 'failed', 'timeout', 'config'].includes(mode))
assert(process.env.M0_01_CHROME, '需要明确实际Chrome路径')
const expected = JSON.parse(await readFile(new URL(`../../evidence/M0-01/health-${instance}.json`, import.meta.url)))
const browser = await chromium.launch({ executablePath: process.env.M0_01_CHROME, args: ['--no-sandbox'] })
const record = { url, healthUrl, instance, mode, requests: [], requestFailures: [], responses: [], errors: [], console: [], steps: [] }
const pending = []
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  page.on('pageerror', error => record.errors.push(String(error)))
  page.on('console', message => record.console.push({ type: message.type(), text: message.text() }))
  page.on('request', request => {
    if (new URL(request.url()).pathname.endsWith('/health')) record.requests.push({ url: request.url(), method: request.method() })
  })
  page.on('requestfailed', request => {
    if (new URL(request.url()).pathname.endsWith('/health')) record.requestFailures.push({ url: request.url(), failure: request.failure() })
  })
  page.on('response', response => {
    if (response.url() === healthUrl) {
      const entry = { url: response.url(), method: response.request().method(), status: response.status(), headers: response.headers() }
      if (mode === 'healthy') {
        pending.push(response.text().then(body => record.responses.push({ ...entry, body })))
      } else {
        record.responses.push(entry)
      }
    }
  })
  const document = await page.goto(url)
  assert.equal(document.status(), 200)
  const expectedState = mode === 'healthy' ? '连接正常' : '连接失败'
  await page.getByText(expectedState, { exact: true }).waitFor({ timeout: 30000 })
  record.steps.push(`首次加载：${expectedState}`)
  if (mode === 'healthy') {
    assert.equal(await page.getByTestId('version').innerText(), '0.1.0')
    assert.equal(await page.getByTestId('instance').innerText(), instance)
    assert.equal(await page.getByTestId('service-status').innerText(), 'ok')
    assert.equal(await page.getByTestId('request-url').innerText(), healthUrl)
  } else {
    assert.equal(await page.getByTestId('version').count(), 0)
    assert.equal(await page.getByTestId('instance').count(), 0)
    assert((await page.getByRole('alert').innerText()).length > 0)
    if (mode === 'timeout') assert.match(await page.getByRole('alert').innerText(), /5秒/)
  }
  const requestCount = record.requests.length
  await page.getByRole('button', { name: '重新检查', exact: true }).click()
  await page.getByText(expectedState, { exact: true }).waitFor({ timeout: 30000 })
  assert.equal(record.requests.length, requestCount + (mode === 'config' ? 0 : 1))
  record.steps.push(`实际点击重新检查：${expectedState}`)
  await Promise.all(pending)
  if (mode === 'healthy') {
    assert(record.responses.length >= 2)
    for (const item of record.responses) {
      assert.equal(item.method, 'GET')
      assert.equal(item.status, 200)
      assert.deepEqual(JSON.parse(item.body), expected)
    }
    assert.deepEqual(record.console.filter(message => message.type === 'error'), [])
  }
  if (mode === 'config') assert.equal(record.requests.length, 0)
  assert.deepEqual(record.errors, [])
  record.text = await page.locator('body').innerText()
  await page.setViewportSize({ width: 390, height: 844 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
  record.steps.push('390px页面无横向溢出')
  record.state = 'PASS'
} finally {
  await browser.close()
  await writeFile(output, JSON.stringify(record, null, 2) + '\n')
}
