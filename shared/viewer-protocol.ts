export const componentIds = ['compressor', 'combustor', 'turbine', 'bearing_front', 'exhaust'] as const
export type ComponentId = typeof componentIds[number]
export type Context = { run_id: string; device_id: string; context_revision: number }
export type Measurement = { tag_id: string; value: number | null; unit: string }
export type ComponentState = { component_id: ComponentId; status: 'normal' | 'attention' | 'alarm' | 'unknown'; measurements: Measurement[] }
export type Snapshot = {
  selected_component_id: string | null
  event_time: string | null
  received_at: string | null
  measurement_quality: 'valid' | 'invalid' | 'stale' | 'no_data'
  components: ComponentState[]
}
export type Selection = { component_id: string; request_id: string }
export type SelectionResult = Selection & { trigger: 'request' | 'user'; result: 'selected' | 'unavailable' }
type Envelope = { schema_version: '1'; viewer_instance_id: string }
export type ReadyMessage = Envelope & { type: 'viewer-ready'; context_revision: null; payload: Record<string, never> }
export type BusinessMessage = Envelope & Context & (
  { type: 'select-component'; payload: Selection }
  | { type: 'component-selected'; payload: SelectionResult }
  | { type: 'update-component-state'; payload: Snapshot }
)
export type Message = ReadyMessage | BusinessMessage

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function keys(value: Record<string, unknown>, expected: string[]): boolean {
  return Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key))
}
export function validIdentifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value)
}
export function validComponent(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z][a-z0-9_]{0,63}$/.test(value)
}
export function knownComponent(value: string): value is ComponentId {
  return (componentIds as readonly string[]).includes(value)
}
export function sameContext(a: Context, b: Context): boolean {
  return a.context_revision === b.context_revision && a.run_id === b.run_id && a.device_id === b.device_id
}
function validTime(value: unknown): value is string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return false
  return new Date(value).toISOString() === value
}
function validSnapshot(value: Record<string, unknown>): boolean {
  if (!keys(value, ['selected_component_id', 'event_time', 'received_at', 'measurement_quality', 'components'])
    || (value.selected_component_id !== null && !validComponent(value.selected_component_id))
    || !['valid', 'invalid', 'stale', 'no_data'].includes(value.measurement_quality as string)) return false
  const noTimes = value.event_time === null && value.received_at === null
  const fullTimes = validTime(value.event_time) && validTime(value.received_at) && Date.parse(value.received_at) >= Date.parse(value.event_time)
  if (!noTimes && !fullTimes) return false
  if (value.measurement_quality === 'valid' && !fullTimes) return false
  if (value.measurement_quality === 'no_data' && !noTimes) return false
  if (!Array.isArray(value.components) || value.components.length !== componentIds.length) return false
  const seen = new Set<string>()
  for (const entry of value.components) {
    if (!object(entry) || !keys(entry, ['component_id', 'status', 'measurements'])
      || typeof entry.component_id !== 'string' || !knownComponent(entry.component_id) || seen.has(entry.component_id)
      || !['normal', 'attention', 'alarm', 'unknown'].includes(entry.status as string)
      || (value.measurement_quality !== 'valid' && entry.status !== 'unknown')
      || !Array.isArray(entry.measurements) || entry.measurements.length > 32) return false
    seen.add(entry.component_id)
    const tags = new Set<string>()
    for (const measurement of entry.measurements) {
      if (!object(measurement) || !keys(measurement, ['tag_id', 'value', 'unit'])
        || !validIdentifier(measurement.tag_id) || tags.has(measurement.tag_id)
        || (measurement.value !== null && (typeof measurement.value !== 'number' || !Number.isFinite(measurement.value)))
        || (['invalid', 'no_data'].includes(value.measurement_quality as string) && measurement.value !== null)
        || typeof measurement.unit !== 'string' || measurement.unit.length < 1 || measurement.unit.length > 32
        || !measurement.unit.trim() || /[\u0000-\u001f\u007f]/.test(measurement.unit)) return false
      tags.add(measurement.tag_id)
    }
  }
  return true
}

export function emptySnapshot(): Snapshot {
  return { selected_component_id: null, event_time: null, received_at: null, measurement_quality: 'no_data',
    components: componentIds.map(component_id => ({ component_id, status: 'unknown', measurements: [] })) }
}

export function validMessage(value: unknown): value is Message {
  if (!object(value) || value.schema_version !== '1' || !validIdentifier(value.viewer_instance_id) || !object(value.payload)) return false
  const common = ['schema_version', 'type', 'viewer_instance_id', 'context_revision', 'payload']
  if (value.type === 'viewer-ready') return keys(value, common) && value.context_revision === null && keys(value.payload, [])
  if (!keys(value, [...common, 'run_id', 'device_id']) || !validIdentifier(value.run_id) || !validIdentifier(value.device_id)
    || !Number.isInteger(value.context_revision) || typeof value.context_revision !== 'number'
    || value.context_revision < 0 || value.context_revision > 2147483647) return false
  const payload = value.payload
  if (value.type === 'select-component') return keys(payload, ['component_id', 'request_id'])
    && validComponent(payload.component_id) && validIdentifier(payload.request_id)
  if (value.type === 'component-selected') return keys(payload, ['component_id', 'request_id', 'trigger', 'result'])
    && validComponent(payload.component_id) && validIdentifier(payload.request_id)
    && ['request', 'user'].includes(payload.trigger as string)
    && (payload.result === 'unavailable' || (payload.result === 'selected' && knownComponent(payload.component_id)))
  if (value.type === 'update-component-state') return validSnapshot(payload)
  return false
}
