import fs from 'node:fs';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { createTurbineModel } from './src/turbine.ts';
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result=result; this.onload?.({target:this}); this.onloadend?.({target:this}); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => { this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`; this.onload?.({target:this}); this.onloadend?.({target:this}); }); }
};
const model=createTurbineModel();
model.root.name='industrial-gas-turbine-educational';
for (const obj of [model.flow,model.operationGlow,model.rotorMotion,...model.operationLights]) obj?.removeFromParent();
const mats=new Set();
model.root.traverse(obj=>{
  obj.userData={};
  if(obj.material) for(const m of Array.isArray(obj.material)?obj.material:[obj.material]) mats.add(m);
});
for(const m of mats) for(const [k,v] of Object.entries(m)) if(v?.isTexture) m[k]=null;
model.root.userData={source:'https://github.com/AlexZhangji/turbine-explorer',license:'MIT',purpose:'educational visualization',derived_asset:true,modifications:'Exported from author procedural geometry; runtime particles and lights removed; procedural material textures omitted; physical material colors retained. Geometry illustrative, not manufacturer CAD. Original source inspired by public GE Vernova 9HA references.'};
model.root.updateMatrixWorld(true);
const out=await new GLTFExporter().parseAsync(model.root,{binary:true,onlyVisible:false,trs:true,includeCustomExtensions:false});
fs.writeFileSync('../industrial-gas-turbine-educational.glb',Buffer.from(out));
console.log(JSON.stringify({bytes:out.byteLength,metrics:model.metrics,materials:mats.size}));
