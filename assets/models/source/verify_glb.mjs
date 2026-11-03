import fs from 'node:fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const bytes=fs.readFileSync('../industrial-gas-turbine-educational.glb');
const ab=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const gltf=await new GLTFLoader().parseAsync(ab,'');
let meshes=0,instances=0,vertices=0;const selected=[];
gltf.scene.traverse(o=>{if(o.isMesh){meshes++;vertices+=o.geometry.attributes.position.count;}if(o.isInstancedMesh)instances+=o.count;if(/^(combustion|rotor|stator|exhaust|compressor-upper-casing|front-bearing-journal)$/.test(o.name))selected.push(o.name);});
console.log(JSON.stringify({loaded:true,meshes,instances,vertices,namedSelections: selected}));
