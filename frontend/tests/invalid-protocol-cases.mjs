export function invalidProtocolCases(message) {
  const cases = []
  const add = (name, change) => {
    const input = structuredClone(message)
    change(input)
    cases.push({ name: `${message.type}:${name}`, message: input })
  }
  for (const field of Object.keys(message)) add(`missing-envelope-${field}`, input => { delete input[field] })
  add('extra-envelope', input => { input.extra = true })
  for (const field of Object.keys(message.payload)) add(`missing-payload-${field}`, input => { delete input.payload[field] })
  add('extra-payload', input => { input.payload.extra = true })
  for (const value of ['0', '2', 1, true, null]) add(`version-${String(value)}`, input => { input.schema_version = value })
  for (const value of ['unknown-message', '', 1, null]) add(`type-${String(value)}`, input => { input.type = value })
  for (const value of [null, [], 0, true, 'payload']) add(`payload-${JSON.stringify(value)}`, input => { input.payload = value })
  const identifiers = ['', 'bad value', 'a/b', '标识', 'a'.repeat(65), null, 1, true]
  for (const field of ['viewer_instance_id', 'run_id', 'device_id'].filter(field => field in message)) {
    for (const value of identifiers) add(`identifier-${field}-${String(value)}`, input => { input[field] = value })
  }
  const revisions = [-1, .1, 2147483648, '0', true, false, NaN, Infinity, -Infinity]
  revisions.push(...(message.type === 'viewer-ready' ? [0, 2147483647] : [null]))
  for (const value of revisions) add(`revision-${String(value)}`, input => { input.context_revision = value })
  if (message.type === 'viewer-ready') {
    for (const field of ['run_id', 'device_id']) add(`forbidden-${field}`, input => { input[field] = 'fixture-id' })
  }
  if (message.type === 'select-component' || message.type === 'component-selected') {
    for (const value of identifiers) add(`request-id-${String(value)}`, input => { input.payload.request_id = value })
    for (const value of ['', 'Upper', '1component', '../exhaust', '部件', 'a'.repeat(65), null, 1]) {
      add(`component-${String(value)}`, input => { input.payload.component_id = value })
    }
  }
  if (message.type === 'component-selected') {
    for (const field of ['trigger', 'result']) {
      for (const value of ['invalid', '', null, 1]) add(`enum-${field}-${String(value)}`, input => { input.payload[field] = value })
    }
  }
  for (const field of ['component_id', 'event_time', 'received_at', 'measurement_quality', 'value']) {
    if (!(field in message.payload)) add(`forbidden-payload-${field}`, input => { input.payload[field] = 'invalid' })
  }
  if (message.type === 'update-component-state') {
    for (const field of ['event_time', 'received_at']) {
      for (const value of [null, 1, 'invalid-time', '2026-02-30T00:00:00.000Z', '2026-11-03T00:00:00']) {
        add(`time-${field}-${String(value)}`, input => { input.payload[field] = value })
      }
    }
    for (const value of ['', 'bad_quality', 'no_data', null, 1, true]) {
      add(`quality-${String(value)}`, input => { input.payload.measurement_quality = value })
    }
    for (const value of [null, [], {}]) add(`components-${JSON.stringify(value)}`, input => { input.payload.components = value })
    for (const field of ['component_id', 'status', 'measurements']) {
      add(`missing-component-${field}`, input => { delete input.payload.components[0][field] })
    }
    add('extra-component', input => { input.payload.components[0].extra = true })
    add('invalid-component-id', input => { input.payload.components[0].component_id = '../compressor' })
    add('invalid-component-status', input => { input.payload.components[0].status = 'invalid' })
    add('invalid-component-measurements', input => { input.payload.components[0].measurements = null })
    const measurementIndex = message.payload.components.findIndex(component => component.measurements.length > 0)
    if (measurementIndex < 0) throw new Error('矩阵夹具需要实际测量对象')
    for (const field of ['tag_id', 'value', 'unit']) {
      add(`missing-measurement-${field}`, input => { delete input.payload.components[measurementIndex].measurements[0][field] })
    }
    add('extra-measurement', input => { input.payload.components[measurementIndex].measurements[0].extra = true })
    for (const value of identifiers) add(`tag-${String(value)}`, input => { input.payload.components[measurementIndex].measurements[0].tag_id = value })
    for (const value of [NaN, Infinity, -Infinity, '560', true]) {
      add(`value-${String(value)}`, input => { input.payload.components[measurementIndex].measurements[0].value = value })
    }
    for (const value of ['', ' ', 'u'.repeat(33), 'u\n', 'u\u0085', null, 1]) {
      add(`unit-${String(value)}`, input => { input.payload.components[measurementIndex].measurements[0].unit = value })
    }
  }
  return cases
}
