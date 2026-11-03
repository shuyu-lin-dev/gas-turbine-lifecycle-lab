<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, toRaw } from 'vue'
import { componentIds, emptySnapshot, knownComponent, sameContext, validMessage, type Context, type Snapshot, type SelectionResult } from '../../shared/viewer-protocol'
import fixture from '../../evidence/FE-INTEGRATE/bridge-fixture.json'

const frame = ref<HTMLIFrameElement | null>(null)
const instance = ref(crypto.randomUUID())
const ready = ref(false)
const context = ref<Context>({ ...fixture.context_a })
const snapshot = ref<Snapshot>(emptySnapshot())
const selectionCount = ref(0)
const selectionResult = ref('尚未选择部件')
const message = ref('')
const names: Record<string, string> = { compressor: '压气机', combustor: '燃烧室', turbine: '涡轮', bearing_front: '前轴承', exhaust: '排气段' }
const pending = new Map<string, string>()
const received = new Set<string>()
let latestRequest: string | null = null
let loaded = false
const src = computed(() => '/viewer/?' + new URLSearchParams({ embedded: '1', viewer_instance_id: instance.value,
  lang: 'zh', experience: 'console', presentation: 'console', speed: '0' }))

function send(type: 'update-component-state' | 'select-component', payload: unknown) {
  if (!ready.value) return
  frame.value?.contentWindow?.postMessage({ schema_version: '1', type, viewer_instance_id: instance.value,
    ...context.value, payload }, window.location.origin)
}
function synchronize() {
  send('update-component-state', toRaw(snapshot.value))
}
function receive(event: MessageEvent) {
  if (event.origin !== window.location.origin || event.source !== frame.value?.contentWindow || !validMessage(event.data)
    || event.data.viewer_instance_id !== instance.value) return
  const data = event.data
  if (data.type === 'viewer-ready') {
    if (ready.value) return
    ready.value = true
    synchronize()
    return
  }
  if (!ready.value || data.type !== 'component-selected' || !sameContext(context.value, data)) return
  const result: SelectionResult = data.payload
  if (received.has(result.request_id)) return
  if (result.trigger === 'request') {
    if (pending.get(result.request_id) !== result.component_id || latestRequest !== result.request_id) return
    pending.delete(result.request_id)
    latestRequest = null
  } else {
    snapshot.value.selected_component_id = result.component_id
    selectionCount.value++
    pending.clear()
    latestRequest = null
  }
  received.add(result.request_id)
  selectionResult.value = result.result === 'unavailable' ? `该部件暂不可定位 ${result.component_id}` : `已选择 ${names[result.component_id]} ${result.component_id}`
}
function select(component_id: string) {
  snapshot.value.selected_component_id = component_id
  selectionCount.value++
  selectionResult.value = knownComponent(component_id) ? `已选择 ${names[component_id]} ${component_id}` : `该部件暂不可定位 ${component_id}`
  if (!ready.value) return
  const request_id = crypto.randomUUID()
  pending.clear()
  pending.set(request_id, component_id)
  latestRequest = request_id
  send('select-component', { component_id, request_id })
}
function changeContext(field: 'device_id' | 'run_id', value: string) {
  if (context.value[field] === value) return
  if (context.value.context_revision === 2147483647) {
    message.value = '上下文版本达到上限，请重新打开模型联动。'
    return
  }
  context.value = { ...context.value, [field]: value, context_revision: context.value.context_revision + 1 }
  snapshot.value = emptySnapshot()
  pending.clear()
  received.clear()
  latestRequest = null
  selectionResult.value = '尚未选择部件'
  synchronize()
}
function loadFixture() {
  snapshot.value = structuredClone(fixture.snapshot_a) as Snapshot
  pending.clear()
  latestRequest = null
  selectionResult.value = '尚未选择部件'
  synchronize()
}
function reload() {
  ready.value = false
  instance.value = crypto.randomUUID()
  pending.clear()
  received.clear()
  latestRequest = null
  loaded = false
}
function onLoad() {
  if (loaded) reload()
  else loaded = true
}
onMounted(() => window.addEventListener('message', receive))
onBeforeUnmount(() => {
  window.removeEventListener('message', receive)
  ready.value = false
  pending.clear()
  received.clear()
  frame.value = null
})
</script>

<template>
  <section class="bridge-workspace" aria-labelledby="model-title">
    <div class="model-heading">
      <div><h1 id="model-title">模型联动</h1><p>未接入运行数据。当前操作使用桥接夹具，验证教学模型的部件选择与状态。</p></div>
      <a href="/viewer/?lang=zh" target="_blank" rel="noopener">打开结构学习</a>
    </div>
    <div class="context-controls">
      <label>设备<select aria-label="夹具设备" :value="context.device_id" @change="changeContext('device_id', ($event.target as HTMLSelectElement).value)">
        <option value="fixture-device-a">桥接夹具设备 A</option><option value="fixture-device-b">桥接夹具设备 B</option>
      </select></label>
      <label>批次<select aria-label="夹具批次" :value="context.run_id" @change="changeContext('run_id', ($event.target as HTMLSelectElement).value)">
        <option value="fixture-run-a">桥接夹具批次 A</option><option value="fixture-run-b">桥接夹具批次 B</option>
      </select></label>
      <span data-testid="revision">上下文版本 {{ context.context_revision }}</span>
      <span data-testid="viewer-ready" role="status">{{ ready ? '模型已就绪' : '正在加载模型' }}</span>
      <button type="button" @click="reload">重新加载模型</button>
    </div>
    <div class="model-layout">
      <div class="viewer-surface"><iframe :key="instance" ref="frame" :src="src" title="燃气轮机教学模型" @load="onLoad"></iframe></div>
      <aside class="fixture-panel">
        <h2>桥接夹具</h2><p>以下状态仅用于桥接验证。</p>
        <button type="button" @click="loadFixture">装载状态夹具 A</button>
        <div class="component-list" aria-label="父页面部件选择">
          <button v-for="id in componentIds" :key="id" type="button" :data-component="id" :aria-pressed="snapshot.selected_component_id === id" @click="select(id)">{{ names[id] }}</button>
          <button type="button" data-component="aux_pump" :aria-pressed="snapshot.selected_component_id === 'aux_pump'" @click="select('aux_pump')">未知部件 aux_pump</button>
        </div>
        <p data-testid="selection-result" role="status">{{ selectionResult }}</p>
        <dl class="fixture-details">
          <div><dt>当前设备</dt><dd data-testid="device">{{ context.device_id }}</dd></div>
          <div><dt>当前批次</dt><dd data-testid="run">{{ context.run_id }}</dd></div>
          <div><dt>选中部件</dt><dd data-testid="selected-component">{{ snapshot.selected_component_id ?? '无' }}</dd></div>
          <div><dt>联动次数</dt><dd data-testid="selection-count">{{ selectionCount }}</dd></div>
          <div><dt>夹具质量</dt><dd data-testid="quality">{{ snapshot.measurement_quality }}</dd></div>
        </dl>
        <p v-if="message" role="alert">{{ message }}</p>
        <p class="source-note">教学几何来自 turbine-explorer（MIT）。部件位置表示教学映射。</p>
      </aside>
    </div>
  </section>
</template>
