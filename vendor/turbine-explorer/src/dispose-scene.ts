import * as THREE from 'three'

export function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  scene.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
      geometries.add(object.geometry)
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material)
      if (object instanceof THREE.InstancedMesh) object.dispose()
    }
    if (object instanceof THREE.Light && 'shadow' in object) (object.shadow as THREE.LightShadow).dispose()
  })
  for (const material of materials) {
    for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
    material.dispose()
  }
  if (scene.background instanceof THREE.Texture) textures.add(scene.background)
  if (scene.environment) textures.add(scene.environment)
  geometries.forEach(geometry => geometry.dispose())
  textures.forEach(texture => texture.dispose())
  scene.clear()
}
