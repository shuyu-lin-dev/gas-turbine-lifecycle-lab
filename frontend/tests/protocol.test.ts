import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { validMessage } from '../../shared/viewer-protocol.ts'
import { invalidProtocolCases } from './invalid-protocol-cases.mjs'

const fixture = JSON.parse(readFileSync(new URL('../../evidence/FE-INTEGRATE/bridge-fixture.json', import.meta.url), 'utf8'))
test('完整快照验证时间、质量、唯一部件和测量值', () => {
  const snapshot = { schema_version: '1', type: 'update-component-state', viewer_instance_id: 'instance-a', ...fixture.context_a, payload: fixture.snapshot_a }
  const message = (payload: unknown) => ({ ...snapshot, payload })
  assert.equal(validMessage(snapshot), true)
  assert.equal(validMessage(message(fixture.snapshot_b)), true)
  for (const quality of ['invalid', 'stale']) assert.equal(validMessage(message({ ...fixture.snapshot_b, measurement_quality: quality })), true)
  for (const invalid of [[], null, { ...fixture.snapshot_a, extra: true }, { ...fixture.snapshot_a, event_time: null },
    { ...fixture.snapshot_a, received_at: '2026-11-02T00:00:00.000Z' }, { ...fixture.snapshot_a, event_time: '2026-02-30T00:00:00.000Z' },
    { ...fixture.snapshot_a, event_time: '2026-11-03T00:00:00' }, { ...fixture.snapshot_a, components: fixture.snapshot_a.components.slice(1) },
    { ...fixture.snapshot_a, components: Array(5).fill(fixture.snapshot_a.components[0]) },
    { ...fixture.snapshot_a, measurement_quality: 'no_data' }, { ...fixture.snapshot_a, measurement_quality: 'invalid' }]) {
    assert.equal(validMessage(message(invalid)), false)
  }
  const reversedExtendedTime = structuredClone(fixture.snapshot_a)
  reversedExtendedTime.event_time = '+010000-01-01T00:00:00.000Z'
  reversedExtendedTime.received_at = '9999-12-31T23:59:59.999Z'
  assert.equal(validMessage(message(reversedExtendedTime)), false)
  for (const value of [NaN, Infinity, -Infinity, '560', true]) {
    const data = structuredClone(fixture.snapshot_a)
    data.components[4].measurements[0].value = value
    assert.equal(validMessage(message(data)), false)
  }
  for (const key of Object.keys(fixture.snapshot_a)) {
    const data = structuredClone(fixture.snapshot_a)
    delete data[key]
    assert.equal(validMessage(message(data)), false)
  }
})

test('固定标识长度、测量边界与缺失字段不能被隐式补齐', () => {
  const base = { schema_version: '1', type: 'select-component', viewer_instance_id: 'i', ...fixture.context_a,
    payload: { component_id: 'a', request_id: 'r' } }
  assert.equal(validMessage(base), true)
  assert.equal(validMessage({ ...base, viewer_instance_id: 'a'.repeat(64), run_id: 'b'.repeat(64), device_id: 'c'.repeat(64),
    payload: { component_id: 'd'.repeat(64), request_id: 'e'.repeat(64) } }), true)
  for (const identifier of ['', 'a'.repeat(65), 'bad value', '部件', 'a/b', 'a\n']) {
    for (const key of ['viewer_instance_id', 'run_id', 'device_id']) assert.equal(validMessage({ ...base, [key]: identifier }), false)
    assert.equal(validMessage({ ...base, payload: { ...base.payload, request_id: identifier } }), false)
  }
  for (const component of ['', 'a'.repeat(65), 'Upper', '1component', '../exhaust', '排气段']) {
    assert.equal(validMessage({ ...base, payload: { ...base.payload, component_id: component } }), false)
  }
  const state = (payload: unknown) => ({ ...base, type: 'update-component-state', payload })
  const maximum = structuredClone(fixture.snapshot_a)
  maximum.components[4].measurements = Array.from({ length: 32 }, (_, index) => ({ tag_id: `t${index}`, value: index, unit: 'u'.repeat(32) }))
  assert.equal(validMessage(state(maximum)), true)
  maximum.components[4].measurements.push({ tag_id: 't32', value: 32, unit: 'u' })
  assert.equal(validMessage(state(maximum)), false)
  const duplicates = structuredClone(fixture.snapshot_a)
  duplicates.components[4].measurements.push({ ...duplicates.components[4].measurements[0] })
  assert.equal(validMessage(state(duplicates)), false)
  for (const unit of ['', ' ', 'u'.repeat(33), 'u\n', 'u\u0080', 'u\u0085', 'u\u009f']) {
    const input = structuredClone(fixture.snapshot_a)
    input.components[4].measurements[0].unit = unit
    assert.equal(validMessage(state(input)), false)
  }
  for (const unit of ['µg/m³', '°C']) {
    const input = structuredClone(fixture.snapshot_a)
    input.components[4].measurements[0].unit = unit
    assert.equal(validMessage(state(input)), true)
  }
  for (const key of ['component_id', 'status', 'measurements']) {
    const input = structuredClone(fixture.snapshot_a)
    delete input.components[0][key]
    assert.equal(validMessage(state(input)), false)
  }
  for (const key of ['tag_id', 'value', 'unit']) {
    const input = structuredClone(fixture.snapshot_a)
    delete input.components[4].measurements[0][key]
    assert.equal(validMessage(state(input)), false)
  }
  const stale = structuredClone(fixture.snapshot_a)
  stale.measurement_quality = 'stale'
  stale.components.forEach((entry: { status: string }) => { entry.status = 'unknown' })
  assert.equal(validMessage(state(stale)), true)
  const invalid = structuredClone(stale)
  invalid.measurement_quality = 'invalid'
  assert.equal(validMessage(state(invalid)), false)
  invalid.components[4].measurements[0].value = null
  assert.equal(validMessage(state(invalid)), true)
  invalid.components[4].measurements[0].value = 0
  assert.equal(validMessage(state(invalid)), false)
})

const ready = { schema_version: '1', type: 'viewer-ready', viewer_instance_id: 'instance-a', context_revision: null, payload: {} }

test('初次ready无需未知运行范围，字段和版本必须精确', () => {
  assert.equal(validMessage(ready), true)
  for (const value of [null, [], {}, { ...ready, run_id: 'unknown' }, { ...ready, schema_version: 1 },
    { ...ready, context_revision: -1 }, { ...ready, payload: { extra: true } }, { ...ready, viewer_instance_id: '' },
    { ...ready, payload: new Map() }, { ...ready, payload: new Set() }, { ...ready, payload: new Date('2026-11-03T00:00:00.000Z') }]) {
    assert.equal(validMessage(value), false)
  }
})

test('选择请求与回执只接受冻结字段及有效范围', () => {
  const select = { schema_version: '1', type: 'select-component', viewer_instance_id: 'instance-a', ...fixture.context_a,
    payload: { component_id: 'compressor', request_id: 'request-a' } }
  const ack = { ...select, type: 'component-selected', payload: { ...select.payload, trigger: 'request', result: 'selected' } }
  for (const valid of [select, ack, { ...select, context_revision: 2147483647 },
    { ...select, payload: { component_id: 'aux_pump', request_id: 'unknown' } },
    { ...ack, payload: { component_id: 'aux_pump', request_id: 'unknown', trigger: 'user', result: 'unavailable' } }]) {
    assert.equal(validMessage(valid), true)
  }
  for (const revision of [-1, .1, 2147483648, '0', true, null, NaN, Infinity]) assert.equal(validMessage({ ...select, context_revision: revision }), false)
  for (const field of Object.keys(select)) {
    const invalid: Record<string, unknown> = { ...select }
    delete invalid[field]
    assert.equal(validMessage(invalid), false)
  }
  for (const invalid of [{ ...select, type: 'unknown-message' }, { ...select, device_id: '' }, { ...select, extra: 1 },
    { ...select, payload: { ...select.payload, request_id: '' } }, { ...select, payload: { ...select.payload, component_id: '../exhaust' } },
    { ...ack, payload: { ...ack.payload, trigger: 'program' } }, { ...ack, payload: { ...ack.payload, component_id: 'aux_pump' } }]) {
    assert.equal(validMessage(invalid), false)
  }
})

for (const type of ['viewer-ready', 'select-component', 'component-selected', 'update-component-state']) {
  test(`冻结四消息矩阵：${type}`, () => {
    const payload = type === 'viewer-ready' ? {} : type === 'update-component-state' ? structuredClone(fixture.snapshot_a)
      : type === 'component-selected' ? { component_id: 'compressor', request_id: 'matrix-request', trigger: 'request', result: 'selected' }
        : { component_id: 'compressor', request_id: 'matrix-request' }
    const message = type === 'viewer-ready' ? { ...ready }
      : { schema_version: '1', type, viewer_instance_id: 'instance-a', ...fixture.context_a, payload }
    assert.equal(validMessage(message), true)
    if (type !== 'viewer-ready') {
      for (const revision of [0, 2147483647]) assert.equal(validMessage({ ...message, context_revision: revision }), true)
    }
    const cases = invalidProtocolCases(message)
    assert(cases.length > 0)
    for (const invalid of cases) assert.equal(validMessage(invalid.message), false, invalid.name)
  })
}
