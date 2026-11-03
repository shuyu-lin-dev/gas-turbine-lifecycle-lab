import { sameContext, validIdentifier, validMessage, type Context, type Snapshot, type SelectionResult } from '../../../shared/viewer-protocol'

export function installViewerBridge(apply: (snapshot: Snapshot) => void, select: (component: string) => boolean) {
  const params = new URLSearchParams(location.search)
  if (params.get('embedded') !== '1') return null
  const instance = params.get('viewer_instance_id')
  if (!validIdentifier(instance)) throw new Error('viewer_instance_id 无效')
  const origin = location.origin
  let context: Context | null = null
  const requests = new Set<string>()
  function send(payload: SelectionResult) {
    if (!context) return
    window.parent.postMessage({ schema_version: '1', type: 'component-selected', viewer_instance_id: instance,
      ...context, payload }, origin)
  }
  function receive(event: MessageEvent) {
    if (event.origin !== origin || event.source !== window.parent || !validMessage(event.data)
      || event.data.viewer_instance_id !== instance) return
    const data = event.data
    if (data.type === 'update-component-state') {
      if (context && (data.context_revision < context.context_revision
        || (data.context_revision === context.context_revision && !sameContext(context, data)))) return
      if (!context || data.context_revision > context.context_revision) requests.clear()
      context = { run_id: data.run_id, device_id: data.device_id, context_revision: data.context_revision }
      const label = document.querySelector<HTMLElement>('#bridge-context')!
      label.textContent = `${context.device_id} / ${context.run_id} / revision ${context.context_revision}`
      label.dataset.device = context.device_id
      label.dataset.run = context.run_id
      label.dataset.revision = String(context.context_revision)
      apply(data.payload)
    } else if (data.type === 'select-component' && context && sameContext(context, data)) {
      if (requests.has(data.payload.request_id)) return
      requests.add(data.payload.request_id)
      const selected = select(data.payload.component_id)
      send({ ...data.payload, trigger: 'request', result: selected ? 'selected' : 'unavailable' })
    }
  }
  window.addEventListener('message', receive)
  window.parent.postMessage({ schema_version: '1', type: 'viewer-ready', viewer_instance_id: instance,
    context_revision: null, payload: {} }, origin)
  return {
    userSelect(component_id: string) {
      const selected = select(component_id)
      send({ component_id, request_id: crypto.randomUUID(), trigger: 'user', result: selected ? 'selected' : 'unavailable' })
    },
    dispose() { window.removeEventListener('message', receive); context = null; requests.clear() },
  }
}
