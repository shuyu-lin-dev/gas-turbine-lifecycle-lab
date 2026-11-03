import * as THREE from 'three'
import type { TurbineModel } from './turbine'
import { componentIds, emptySnapshot, knownComponent, type ComponentId, type Snapshot } from '../../../shared/viewer-protocol'
import { installViewerBridge } from './viewer-bridge'
import './embedded.css'

export function installEmbeddedScene(model: TurbineModel, scene: THREE.Scene, camera: THREE.Camera,
  canvas: HTMLCanvasElement, focus: (center: THREE.Vector3) => void) {
  if (new URLSearchParams(location.search).get('embedded') !== '1') return null
  const nodeNames: Record<ComponentId, string> = { compressor: 'compressor-rotor-01', combustor: 'combustor-module-06',
    turbine: 'turbine-rotor-1', bearing_front: 'sectioned-front-bearing-housing', exhaust: 'exhaust' }
  const labels: Record<ComponentId, string> = { compressor: '压气机', combustor: '燃烧室', turbine: '涡轮', bearing_front: '前轴承', exhaust: '排气段' }
  const colors = { normal: '#a7b5c6', attention: '#f0bd67', alarm: '#ff9292', unknown: '#64748b' }
  const statusLabels = { normal: '正常', attention: '关注', alarm: '告警', unknown: '未知' }
  const nodes = new Map<ComponentId, THREE.Object3D>()
  const materials = new Map<ComponentId, THREE.MeshStandardMaterial[]>()
  const originals: { mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] }[] = []
  for (const id of componentIds) {
    const node = model.root.getObjectByName(nodeNames[id])
    if (!node) throw new Error(`教学映射缺少节点 ${nodeNames[id]}`)
    nodes.set(id, node)
    const copies: THREE.MeshStandardMaterial[] = []
    node.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      originals.push({ mesh: object, material: object.material })
      const clone = (material: THREE.Material) => {
        const copy = material.clone()
        if (copy instanceof THREE.MeshStandardMaterial) copies.push(copy)
        return copy
      }
      object.material = Array.isArray(object.material) ? object.material.map(clone) : clone(object.material)
    })
    if (!copies.length) throw new Error(`教学映射缺少材质 ${id}`)
    materials.set(id, copies)
  }
  const panel = document.createElement('section')
  panel.className = 'bridge-status'
  panel.setAttribute('aria-label', '桥接夹具状态')
  const notice = document.createElement('p')
  notice.textContent = '未接入运行数据 · 桥接夹具 · 教学模型'
  const contextLabel = document.createElement('small')
  contextLabel.id = 'bridge-context'
  contextLabel.textContent = '等待页面同步上下文'
  const buttons = document.createElement('nav')
  buttons.setAttribute('aria-label', '模型部件选择')
  const selection = document.createElement('output')
  selection.id = 'bridge-selection'
  const details = document.createElement('div')
  details.id = 'bridge-values'
  panel.append(notice, contextLabel, buttons, selection, details)
  document.body.append(panel)
  const helper = new THREE.BoxHelper(model.root, '#63d8df')
  helper.visible = false
  scene.add(helper)
  let selected: string | null = null
  let snapshot = emptySnapshot()
  function choose(component: string | null, moveCamera = true): boolean {
    selected = component
    const node = component && knownComponent(component) ? nodes.get(component)! : null
    helper.visible = Boolean(node)
    if (node) {
      helper.setFromObject(node)
      if (moveCamera) focus(new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3()))
    }
    selection.textContent = component === null ? '尚未选择部件' : node ? `已选择 ${labels[component as ComponentId]} ${component}` : `该部件暂不可定位 ${component}`
    selection.dataset.component = component ?? ''
    for (const button of buttons.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.component === component))
    return Boolean(node)
  }
  function paint() {
    for (const entry of snapshot.components) {
      const active = new Set(materials.get(entry.component_id)!)
      nodes.get(entry.component_id)!.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          if (material instanceof THREE.MeshStandardMaterial) active.add(material)
        }
      })
      for (const material of active) {
        material.emissive.set(colors[entry.status])
        material.emissiveIntensity = .45
      }
    }
  }
  function apply(value: Snapshot) {
    snapshot = value
    paint()
    choose(value.selected_component_id, false)
    details.replaceChildren()
    const quality = document.createElement('p')
    const qualityLabels = { valid: '有效', invalid: '失效', stale: '过期', no_data: '无数据' }
    quality.textContent = `桥接夹具质量：${qualityLabels[value.measurement_quality]}；测量时间：${value.event_time ?? '无'}；接收时间：${value.received_at ?? '无'}（UTC）`
    quality.dataset.quality = value.measurement_quality
    details.append(quality)
    for (const entry of value.components) {
      const row = document.createElement('span')
      row.dataset.component = entry.component_id
      row.dataset.status = entry.status
      row.textContent = `${labels[entry.component_id]}：${statusLabels[entry.status]} ${entry.measurements.map(item => `${item.tag_id} ${item.value ?? '缺测'} ${item.unit}`).join('；')}`
      details.append(row)
    }
  }
  const bridge = installViewerBridge(apply, component => choose(component))!
  for (const id of componentIds) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = labels[id]
    button.dataset.component = id
    button.addEventListener('click', () => bridge.userSelect(id))
    buttons.append(button)
  }
  const ray = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let startX = 0, startY = 0
  const onDown = (event: PointerEvent) => { startX = event.clientX; startY = event.clientY }
  const onUp = (event: PointerEvent) => {
    if (event.button !== 0 || Math.hypot(event.clientX - startX, event.clientY - startY) > 5) return
    const bounds = canvas.getBoundingClientRect()
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2)
    ray.setFromCamera(pointer, camera)
    model.root.updateWorldMatrix(true, true)
    const hit = ray.intersectObjects([...nodes.values()], true).find(entry => {
      for (let node: THREE.Object3D | null = entry.object; node; node = node.parent) if (!node.visible) return false
      return true
    })
    if (!hit) return
    for (const [id, node] of nodes) {
      for (let object: THREE.Object3D | null = hit.object; object; object = object.parent) {
        if (object === node) { bridge.userSelect(id); return }
      }
    }
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointerup', onUp)
  apply(snapshot)
  return {
    update() {
      paint()
      if (selected && knownComponent(selected)) helper.setFromObject(nodes.get(selected)!)
    },
    dispose() {
      bridge.dispose()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      const copies = new Set<THREE.Material>()
      for (const entry of originals) {
        for (const material of Array.isArray(entry.mesh.material) ? entry.mesh.material : [entry.mesh.material]) copies.add(material)
        entry.mesh.material = entry.material
      }
      copies.forEach(material => material.dispose())
      scene.remove(helper)
      helper.geometry.dispose()
      ;(helper.material as THREE.Material).dispose()
      panel.remove()
    },
  }
}
