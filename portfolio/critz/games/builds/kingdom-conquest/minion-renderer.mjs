import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {clone} from './vendor/SkeletonUtils.js';

// A transparent orthographic layer preserves the existing MOBA simulation and
// canvas map. The camera projects the same ground coordinates as the canvas.
const api=window.Minion3D={ready:0,total:18,heroReady:0,errors:[],instances:0,triangles:0,drawCalls:0};
let renderer;
try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'})}
catch(e){api.errors.push('WebGL unavailable: '+e.message)}
if(renderer){
 const canvas=document.getElementById('game'),host=canvas.parentElement;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(),loader=new GLTFLoader();
 renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.domElement.className='minion-layer';renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xfff3d6,0x486758,2.5));
 const sun=new THREE.DirectionalLight(0xffedcf,2.8);sun.position.set(-1000,2000,1000);scene.add(sun);
 const templates=new Map(),instances=new Map();
 const ringGeometry=new THREE.RingGeometry(13,15,20);
 const teamMaterials=[new THREE.MeshBasicMaterial({color:0x57ddd0,transparent:true,opacity:.7,side:THREE.DoubleSide}),new THREE.MeshBasicMaterial({color:0xf87963,transparent:true,opacity:.7,side:THREE.DoubleSide})];
 const materials=new Map();
 const projectilePool=[];
 const projectileMaterials=new Map();
 const shaftGeometry=new THREE.CylinderGeometry(.55,.55,13,5),tipGeometry=new THREE.ConeGeometry(1.6,4,5);
 const orbGeometry=new THREE.IcosahedronGeometry(3.5,1),rockGeometry=new THREE.DodecahedronGeometry(3),haloGeometry=new THREE.TorusGeometry(4.7,.65,4,12);
 const up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3();
 function missile(kind,color){
  if(!projectileMaterials.has(kind))projectileMaterials.set(kind,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:['arrow','bolt','dart','javelin','stone'].includes(kind)?0:.65,roughness:.8}));
  const mat=projectileMaterials.get(kind),group=new THREE.Group();
  if(['arrow','bolt','dart','javelin'].includes(kind)){
   group.add(new THREE.Mesh(shaftGeometry,mat));const tip=new THREE.Mesh(tipGeometry,mat);tip.position.y=8;group.add(tip);if(kind==='javelin')group.scale.setScalar(1.35)
  }else{
   group.add(new THREE.Mesh(kind==='stone'||kind==='earth'?rockGeometry:orbGeometry,mat));
   if(['water','air','illusion','heal'].includes(kind)){const halo=new THREE.Mesh(haloGeometry,mat);halo.rotation.x=Math.PI/2;group.add(halo)}
  }
  scene.add(group);return group
 }
 function shareMaterial(mat){
  // Clones of one species share textures, geometry and immutable materials.
  if(!materials.has(mat.uuid)){mat.roughness=.9;mat.metalness=0;materials.set(mat.uuid,mat)}return materials.get(mat.uuid)
 }
 for(const s of [...MINION_SPECIES,...(window.CONQUEROR_MODELS||[])]){
  loader.load(s.model,gltf=>{
   gltf.scene.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(shareMaterial):shareMaterial(o.material);o.frustumCulled=false}});
   const hero=s.id.startsWith('hero:');
   if(hero){const bounds=new THREE.Box3().setFromObject(gltf.scene);gltf.scene.position.y-=bounds.min.y;gltf.worldScale=s.worldHeight/(bounds.max.y-bounds.min.y)}
   templates.set(s.id,gltf);if(hero)api.heroReady++;else api.ready++;
  },undefined,e=>api.errors.push(s.id+': '+e.message));
 }
 function instantiate(u){
  const key=u.conqueror?'hero:'+u.conqueror:u.species,template=templates.get(key);if(!template)return null;
  const model=clone(template.scene),root=new THREE.Group();root.add(model);model.scale.setScalar(template.worldScale||180);
  const ring=new THREE.Mesh(ringGeometry,teamMaterials[u.team]);ring.rotation.x=-Math.PI/2;ring.position.y=.2;if(u.conqueror)ring.scale.setScalar(u.radius/14);root.add(ring);
  const mixer=new THREE.AnimationMixer(model),actions={};
  for(const clip of template.animations){
   let name=clip.name.toLowerCase().replace(/.*\|/,'');
   if(u.conqueror){name=name.replace(/^(rodin|theo)_/,'');name=({heavypunch:'attack',groundslam:'slam',challenge:'rally',hitreact:'hit'})[name]||name}
   actions[name]=mixer.clipAction(clip);
   if(['death','attack','hit','slam','rally'].includes(name)){actions[name].setLoop(THREE.LoopOnce,1);actions[name].clampWhenFinished=true}
  }
  const entry={root,model,ring,mixer,actions,state:null,species:key,hero:!!u.conqueror,deathTime:0};instances.set(u.id,entry);scene.add(root);return entry
 }
 function stateFor(u){return u.hp<=0?'death':u.dash?'walk':u.demoAnimation&&u.demoAnimLeft>0&&u.demoAnimation!=='rally'?u.demoAnimation:u.attackAnim>0?'attack':u.flash>0?'hit':u.moving?'walk':u.demoAnimation==='rally'?'rally':'idle'}
 function animate(entry,u,dt){
  const state=stateFor(u),action=entry.actions[state]||(state==='death'&&entry.hero?entry.actions.hit:null);
  // An attack can repeat while the high-level state remains 'attack'.
  if(state!==entry.state||(state==='attack'&&u.attackAnim>entry.lastAttack+.1)){
   const prev=entry.actions[entry.state];if(prev)prev.fadeOut(.08);
   if(action){action.reset().fadeIn(.06).play();if(state==='attack')action.setDuration(entry.hero?.65:.40);if(state==='hit')action.setDuration(entry.hero?.3:.16);if(state==='slam'||state==='rally')action.setDuration(.9);if(state==='death')action.setDuration(.85)}
   entry.state=state;
  }
  entry.lastAttack=u.attackAnim||0;entry.mixer.update(Math.min(dt,.1));
  entry.root.position.set(u.x,0,u.y);entry.model.rotation.y=Math.PI/2-(u.facing||0);
  if(entry.hero){entry.deathTime=state==='death'?Math.min(.9,entry.deathTime+dt):0;entry.root.rotation.x=entry.deathTime/.9*1.42}
  entry.ring.visible=u.hp>0;
 }
 let lastWidth=0,lastHeight=0;
 api.render=(units,view,dt,projectiles=[])=>{
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(w!==lastWidth||h!==lastHeight){renderer.setSize(w,h);lastWidth=w;lastHeight=h}
  camera.left=-w/view.zoom/2;camera.right=w/view.zoom/2;camera.top=h/view.zoom/2;camera.bottom=-h/view.zoom/2;
  camera.near=.1;camera.far=12000;camera.position.set(view.x,4980,view.y+3346);camera.lookAt(view.x,0,view.y);camera.updateProjectionMatrix();
  const present=new Set();
  for(const u of units){
   if(!u.species&&!u.conqueror)continue;present.add(u.id);const key=u.conqueror?'hero:'+u.conqueror:u.species;
   let entry=instances.get(u.id);
   if(entry&&entry.species!==key){entry.mixer.stopAllAction();entry.mixer.uncacheRoot(entry.model);scene.remove(entry.root);instances.delete(u.id);entry=null}
   entry ||= instantiate(u);if(!entry)continue;
   entry.root.visible=Math.abs(u.x-view.x)<w/view.zoom/2+160&&Math.abs(u.y-view.y)<h/(view.zoom*.83)/2+160;
   if(entry.root.visible)animate(entry,u,dt);
  }
  for(const [id,e] of instances)if(!present.has(id)){e.mixer.stopAllAction();e.mixer.uncacheRoot(e.model);scene.remove(e.root);instances.delete(id)}
  for(const entry of projectilePool)entry.group.visible=false;
  let projectileIndex=0;
  for(const p of projectiles){
   if(!p.kind||!templates.has(p.source?.species))continue;
   let entry=projectilePool[projectileIndex];
   if(!entry||entry.kind!==p.kind){if(entry)scene.remove(entry.group);entry={kind:p.kind,group:missile(p.kind,p.color)};projectilePool[projectileIndex]=entry}
   projectileIndex++;const group=entry.group;group.visible=true;
   const remaining=Math.hypot(p.target.x-p.x,p.target.y-p.y)/(p.distance||1),arc=p.kind==='stone'||p.kind==='javelin'?Math.sin(Math.min(1,remaining)*Math.PI)*28:0;
   group.position.set(p.x,18+arc,p.y);direction.set(p.target.x-p.x,0,p.target.y-p.y).normalize();group.quaternion.setFromUnitVectors(up,direction);
  }
  api.projectileInstances=projectileIndex;
  renderer.render(scene,camera);api.instances=instances.size;api.triangles=renderer.info.render.triangles;api.drawCalls=renderer.info.render.calls;
 };
 api.has=id=>templates.has(id);
 api.snapshot=()=>[...instances.values()].map(e=>({species:e.species,state:e.state,visible:e.root.visible,clips:Object.keys(e.actions),scale:e.model.scale.x,arm:(e.model.getObjectByName('ArmR')||e.model.getObjectByName('Arm.R')||e.model.getObjectByName('upperarm_r'))?.quaternion.toArray()}));
 api.dispose=()=>{for(const e of instances.values())e.mixer.stopAllAction();renderer.dispose();renderer.domElement.remove()};
}
