import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { MIMEType } from 'node:util'
import { chromium } from 'playwright'
import { pageFailureGuard } from './page-failure-guard.mjs'

const [url, output] = process.argv.slice(2)
assert(url && output && process.env.M0_01_CHROME)
const base = new URL(url)
const record = { url, responses: [], documents: [], errors: [], console: [] }
const save = () => writeFile(output, JSON.stringify(record, null, 2) + '\n')
const guard = pageFailureGuard(record)
const knownTypes = new Map()
const allowedTypes = { script: ['text/javascript', 'application/javascript'], stylesheet: ['text/css'],
  font: ['font/ttf'], hdr: ['image/vnd.radiance', 'application/octet-stream'] }
const browser = await chromium.launch({ executablePath: process.env.M0_01_CHROME,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })

async function verify() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' })
  guard.watch(page)
  page.setDefaultTimeout(120000)
  await page.addInitScript({ path: new URL('../../scripts/fe-base/observe-webgl.js', import.meta.url).pathname })
  await page.addInitScript(() => localStorage.setItem('turbine-quality', 'balanced'))
  page.on('console', message => {
    record.console.push({ type: message.type(), text: message.text() })
    if (message.type() === 'error') guard.fail(new Error(message.text()))
  })
  page.on('requestfailed', request => guard.fail(new Error(`请求失败：${request.url()}：${request.failure()?.errorText}`)))
  page.on('response', response => {
    const entry = { url: response.url(), status: response.status(), resource_type: response.request().resourceType(),
      content_type: response.headers()['content-type'] ?? null, phase: record.phase }
    record.responses.push(entry)
    try {
      assert(entry.status < 400, `${entry.url}：HTTP ${entry.status}`)
      const resource = new URL(entry.url)
      const kind = resource.pathname.endsWith('.ttf') ? 'font' : resource.pathname.endsWith('.hdr') ? 'hdr'
        : ['script', 'stylesheet'].includes(entry.resource_type) ? entry.resource_type : null
      if (!kind) return
      entry.kind = kind
      assert.equal(resource.origin, base.origin)
      assert(resource.pathname.startsWith('/viewer/'), entry.url)
      assert([200, 304].includes(entry.status), `${entry.url}：HTTP ${entry.status}`)
      if (entry.status === 304 && !entry.content_type) {
        assert(knownTypes.has(entry.url), `304响应需要已有的资源类型：${entry.url}`)
        entry.mime = knownTypes.get(entry.url)
        entry.representation = 'not-transferred'
      } else {
        assert(entry.content_type, `资源缺少Content-Type：${entry.url}`)
        entry.mime = new MIMEType(entry.content_type).essence
        assert(allowedTypes[kind].includes(entry.mime), `${entry.url}：${entry.content_type}`)
        knownTypes.set(entry.url, entry.mime)
      }
      entry.mime_verified = true
    } catch (error) {
      guard.fail(error)
    }
  })
  const rendered = async selector => {
    await page.waitForFunction(selector => {
      const value = window.__feBaseObserve(selector)
      return value?.main.length > 0 && value.frameDraws.length >= 3
    }, selector)
    return page.evaluate(selector => window.__feBaseObserve(selector), selector)
  }
  async function inspect(phase, response, fonts) {
    record.phase = phase
    assert([200, 304].includes(response.status()))
    assert.equal(new URL(page.url()).origin, base.origin)
    await page.waitForFunction(() => document.querySelector('#app').dataset.environment === 'studio-hdr')
    const observation = await rendered('#scene')
    if (fonts) {
      await page.locator('.parts-launch').click()
      await rendered('.parts-lab canvas')
      await page.evaluate(() => document.fonts.ready)
      const faces = await page.evaluate(() => [...document.fonts].map(face => ({ family: face.family, status: face.status })))
      for (const family of ['Manrope', 'Space Grotesk']) assert(faces.some(face => [family, `"${family}"`].includes(face.family) && face.status === 'loaded'))
      record.fontFaces = faces
      await page.locator('.lab-close').click()
      assert.equal(await page.locator('.parts-lab').evaluate(dialog => dialog.open), false)
    }
    record.documents.push({ phase, url: page.url(), timeOrigin: await page.evaluate(() => performance.timeOrigin), observation })
    await save()
  }
  const initial = new URL(base)
  initial.pathname = '/viewer'
  initial.search = new URLSearchParams({ lang: 'en', quality: 'balanced', experience: 'console', speed: '0', env: 'studio' }).toString()
  record.phase = 'initial'
  await inspect('initial', await page.goto(initial.href), true)
  const beforeReload = record.documents.at(-1).timeOrigin
  record.phase = 'reload'
  await inspect('reload', await page.reload(), true)
  assert.notEqual(record.documents.at(-1).timeOrigin, beforeReload)
  const contrast = new URL(initial)
  contrast.pathname = '/viewer/'
  contrast.searchParams.set('env', 'contrast')
  record.phase = 'contrast'
  await inspect('contrast', await page.goto(contrast.href), false)
  for (const name of ['Manrope-Variable.ttf', 'SpaceGrotesk-Variable.ttf', 'poly_haven_studio_1k.hdr', 'studio_kontrast_02_1k.hdr']) {
    assert(record.responses.some(entry => new URL(entry.url).pathname.endsWith('/' + name) && entry.mime_verified), name)
  }
  assert(record.responses.some(entry => entry.kind === 'script' && entry.mime_verified))
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
