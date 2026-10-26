import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {clone} from './vendor/SkeletonUtils.js';

// A transparent orthographic layer preserves the existing MOBA simulation and
// canvas map. The camera projects the same ground coordinates as the canvas.
const api=window.Minion3D={ready:0,total:18,heroReady:0,structureReady:0,errors:[],warnings:[],assets:{},instances:0,triangles:0,drawCalls:0};
let renderer,hudCanvas;
let quality='balanced',renderEnabled=true;
api.setQuality=value=>{const preset=typeof value==='string'?value:null;quality=['low','balanced','high'].includes(preset)?preset:quality;const cap={low:1,balanced:1.5,high:2}[quality];renderEnabled=typeof value==='object'&&value.enabled!==undefined?!!value.enabled:true;if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio,typeof value==='object'&&value.pixelRatio?value.pixelRatio:cap));renderer.domElement.style.display=renderEnabled?'':'none';if(hudCanvas)hudCanvas.style.display=renderEnabled?'':'none'}api.quality=quality};
try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'})}
catch(e){api.errors.push('WebGL unavailable: '+e.message)}
if(renderer){
 const canvas=document.getElementById('game'),host=canvas.parentElement;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(),loader=new GLTFLoader();
 function visualFacing(u){if(window.STRUCTURE_MODELS?.length&&['tower','barracks','castle'].includes(u.kind)){const goal=Number.isInteger(u.lane)?pointOnLane(u.lane,Math.max(0,Math.min(1,nearestProgress(u,u.lane)+(u.team?-.035:.035)))):window.KINGDOM_MAP.bases[1-u.team];return Math.atan2(goal.y-u.y,goal.x-u.x)}return u.facing||0}
 renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.domElement.className='minion-layer';renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 // Hero names and health bars share the original painter, above all 3D models
 // and below the existing controls (z-index 2). No state is stored on the units.
 hudCanvas=document.createElement('canvas');hudCanvas.className='unit-hud-layer';hudCanvas.setAttribute('aria-hidden','true');hudCanvas.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:1';host.appendChild(hudCanvas);
 const hudContext=hudCanvas.getContext('2d');let hudView=null,hudReady=false,hudLabels=[];
 const previousDraw=draw,previousHUD=window.drawUnitHUD;
 const overlayDraw=()=>{
  const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);
  if(hudCanvas.width!==Math.round(w*dpr)||hudCanvas.height!==Math.round(h*dpr)){hudCanvas.width=Math.round(w*dpr);hudCanvas.height=Math.round(h*dpr);hudCanvas.style.width=w+'px';hudCanvas.style.height=h+'px'}
  hudContext.setTransform(dpr,0,0,dpr,0,0);hudContext.clearRect(0,0,w,h);hudLabels=[];hudReady=!!hudView&&renderEnabled;
  if(hudReady){hudContext.translate(w/2,h/2);hudContext.scale(hudView.zoom,hudView.zoom*.83);hudContext.translate(-hudView.x,-hudView.y)}
  previousDraw();
 };
 const overlayHUD=(u,color)=>{
  if((u.kind!=='hero'&&!window.STRUCTURE_MODELS?.length)||!hudReady||(!u.conqueror&&!['tower','barracks','castle'].includes(u.kind)))return previousHUD(u,color);
  const oldContext=ctx,oldOffset=u.overhead,asset=api.assets[u.conqueror?'hero:'+u.conqueror:'structure:'+u.kind];let offset=oldOffset||u.radius+30;
  if(asset?.labelOffsets){const angle=((visualFacing(u)%(Math.PI*2))+Math.PI*2)%(Math.PI*2),f=angle/(Math.PI*2)*16,i=Math.floor(f),a=asset.labelOffsets[i],b=asset.labelOffsets[(i+1)%16];offset=Math.max(offset,a+(b-a)*(f-i)+asset.labelMargin)}
  try{ctx=hudContext;u.overhead=offset;ctx.save();if(window.KINGDOM_MAP&&hudView.zoom>=.2){const factor=Math.min(2.5,1/hudView.zoom),y=u.y-offset;ctx.translate(u.x,y);ctx.scale(factor,factor);ctx.translate(-u.x,-y)}if(!window.KINGDOM_MAP||hudView.zoom>=.2)previousHUD(u,color);ctx.restore();hudLabels.push({id:u.id,conqueror:u.conqueror,team:u.team,selected:u===selected,color,offset,x:u.x,y:u.y-offset})}
  finally{ctx=oldContext;u.overhead=oldOffset}
 };
 if(typeof previousHUD==='function'){window.drawUnitHUD=overlayHUD;draw=overlayDraw}
 api.hudSnapshot=()=>({width:hudCanvas.width,height:hudCanvas.height,aboveModels:!!(hudCanvas.compareDocumentPosition(renderer.domElement)&Node.DOCUMENT_POSITION_PRECEDING),labels:hudLabels.slice()});
 function labelOffsets(gltf,scale){
  const offsets=Array(16).fill(-Infinity),directions=offsets.map((_,i)=>({c:Math.cos(i*Math.PI/8),s:Math.sin(i*Math.PI/8)})),p=new THREE.Vector3();gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(!o.isMesh)return;o.skeleton?.update();for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,p);p.applyMatrix4(o.matrixWorld);for(let j=0;j<16;j++){const d=directions[j];offsets[j]=Math.max(offsets[j],(p.x*d.c-p.z*d.s+p.y*3346/4980)*scale)}}});return offsets;
 }
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
 function loadModel(s,path=s.model){
  loader.load(path,gltf=>{
   gltf.scene.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(shareMaterial):shareMaterial(o.material);o.frustumCulled=false}});
   const hero=s.id.startsWith('hero:'),structureModel=s.id.startsWith('structure:'),bounds=new THREE.Box3().setFromObject(gltf.scene);
   if(hero||structureModel){gltf.scene.position.y-=bounds.min.y;gltf.worldScale=s.worldHeight/(bounds.max.y-bounds.min.y)}
   gltf.assetPath=path;api.assets[s.id]={path,fallback:path!==s.model,worldScale:gltf.worldScale||180,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},clips:gltf.animations.map(a=>a.name)};
   if(structureModel||(hero&&path.includes('/upgrades/'))){api.assets[s.id].labelOffsets=labelOffsets(gltf,gltf.worldScale);api.assets[s.id].labelMargin=Math.max(20,s.worldHeight*.18)}
   templates.set(s.id,gltf);if(hero)api.heroReady++;else if(structureModel)api.structureReady++;else api.ready++;
  },undefined,e=>{if(s.fallbackModel&&path!==s.fallbackModel){api.warnings.push(s.id+': upgraded model unavailable; using procedural fallback');loadModel(s,s.fallbackModel)}else api.errors.push(s.id+': '+e.message)});
 }
 for(const s of [...MINION_SPECIES,...(window.CONQUEROR_MODELS||[]),...(window.STRUCTURE_MODELS||[])])loadModel(s);
 // Upgraded quadrupeds extend beyond the old upright-character click ellipse.
 // Use the loaded model's conservative projected bounds for visible upgraded
 // heroes; combat collision/range and the original canvas fallback stay intact.
 const previousHitTest=window.unitContainsPoint;
 const modelHitTest=(u,p,padding=15)=>{
  const a=u.conqueror&&api.assets['hero:'+u.conqueror];
  if(renderEnabled&&a?.path.includes('/upgrades/')){
   const b=a.bounds,k=a.worldScale,x=Math.max(Math.abs(b.min[0]),Math.abs(b.max[0]))*k,z=Math.max(Math.abs(b.min[2]),Math.abs(b.max[2]))*k,h=(b.max[1]-b.min[1])*k;
   const c=Math.abs(Math.cos(u.facing||0)),sn=Math.abs(Math.sin(u.facing||0)),halfX=c*z+sn*x,halfY=sn*z+c*x;
   return Math.abs(p.x-u.x)<=halfX+padding&&p.y>=u.y-halfY-h*3346/4980-padding&&p.y<=u.y+halfY+padding;
  }
  return previousHitTest(u,p,padding);
 };
 if(typeof previousHitTest==='function')window.unitContainsPoint=modelHitTest;
 const structureKinds=new Set(['tower','barracks','castle']);
 const modelKey=u=>u.conqueror?'hero:'+u.conqueror:u.species||(window.STRUCTURE_MODELS?.length&&structureKinds.has(u.kind)?'structure:'+(u.hp>0?u.kind:'rubble'):null);
 const bannerMaterials=[new THREE.MeshStandardMaterial({name:'BannerTeam',color:0x35b9bd,roughness:.9}),new THREE.MeshStandardMaterial({name:'BannerTeam',color:0xc9574f,roughness:.9})];
 function instantiate(u){
  const key=modelKey(u),template=templates.get(key);if(!template)return null;
  const model=clone(template.scene),root=new THREE.Group();root.add(model);model.scale.setScalar(template.worldScale||180);if(key.startsWith('structure:'))model.traverse(o=>{if(o.isMesh){const tint=m=>m.name==='BannerTeam'?bannerMaterials[u.team]:m;o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material)}});
  const ring=new THREE.Mesh(ringGeometry,teamMaterials[u.team]);ring.rotation.x=-Math.PI/2;ring.position.y=.2;if(u.conqueror||key.startsWith('structure:'))ring.scale.setScalar(u.radius/14);root.add(ring);
  const mixer=new THREE.AnimationMixer(model),actions={};
  for(const clip of template.animations){
   let name=clip.name.toLowerCase().replace(/.*\|/,'');
   if(u.conqueror){name=name.replace(/^(rodin|theo)_/,'');name=({heavypunch:'attack',groundslam:'slam',challenge:'rally',hitreact:'hit'})[name]||name}
   actions[name]=mixer.clipAction(clip);
   if(['death','attack','hit','slam','rally'].includes(name)){actions[name].setLoop(THREE.LoopOnce,1);actions[name].clampWhenFinished=true}
  }
  const entry={root,model,ring,mixer,actions,state:null,species:key,structure:key.startsWith('structure:'),hero:!!u.conqueror,deathTime:0,assetPath:template.assetPath};instances.set(u.id,entry);scene.add(root);return entry
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
  entry.root.position.set(u.x,0,u.y);entry.model.rotation.y=Math.PI/2-visualFacing(u);
  if(entry.hero&&!entry.actions.death){entry.deathTime=state==='death'?Math.min(.9,entry.deathTime+dt):0;entry.root.rotation.x=entry.deathTime/.9*1.42}
  entry.ring.visible=u.hp>0&&!entry.structure;entry.ring.material=teamMaterials[u.team];
 }
 let lastWidth=0,lastHeight=0;
 api.render=(units,view,dt,projectiles=[])=>{
  hudView=view;
  if(!renderEnabled)return;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(w!==lastWidth||h!==lastHeight){renderer.setSize(w,h);lastWidth=w;lastHeight=h}
  camera.left=-w/view.zoom/2;camera.right=w/view.zoom/2;camera.top=h/view.zoom/2;camera.bottom=-h/view.zoom/2;
  camera.near=.1;camera.far=12000;camera.position.set(view.x,4980,view.y+3346);camera.lookAt(view.x,0,view.y);camera.updateProjectionMatrix();
  const present=new Set();
  for(const u of units){
   const key=modelKey(u);if(!key)continue;present.add(u.id);
   let entry=instances.get(u.id);
   if(entry&&entry.species!==key){entry.mixer.stopAllAction();entry.mixer.uncacheRoot(entry.model);scene.remove(entry.root);instances.delete(u.id);entry=null}
   entry ||= instantiate(u);if(!entry)continue;
   const margin=entry.structure?750:160;entry.root.visible=Math.abs(u.x-view.x)<w/view.zoom/2+margin&&Math.abs(u.y-view.y)<h/(view.zoom*.83)/2+margin;
   if(entry.root.visible)animate(entry,u,dt);
  }
  for(const [id,e] of instances)if(!present.has(id)){e.mixer.stopAllAction();e.mixer.uncacheRoot(e.model);scene.remove(e.root);instances.delete(id)}
  for(const entry of projectilePool)entry.group.visible=false;
  let projectileIndex=0;
  for(const p of projectiles){
   if(!p.kind||(!templates.has(p.source?.species)&&!templates.has('hero:'+p.source?.conqueror)&&!templates.has('structure:'+p.source?.kind)))continue;
   let entry=projectilePool[projectileIndex];
   if(!entry||entry.kind!==p.kind){if(entry)scene.remove(entry.group);entry={kind:p.kind,group:missile(p.kind,p.color)};projectilePool[projectileIndex]=entry}
   projectileIndex++;const group=entry.group;group.visible=true;
   const remaining=Math.hypot(p.target.x-p.x,p.target.y-p.y)/(p.distance||1),arc=p.kind==='stone'||p.kind==='javelin'?Math.sin(Math.min(1,remaining)*Math.PI)*28:0;
   group.position.set(p.x,18+arc+(p.height||0)*Math.min(1,remaining),p.y+(p.groundOffset||0)*Math.min(1,remaining));direction.set(p.target.x-p.x,0,p.target.y-p.y).normalize();group.quaternion.setFromUnitVectors(up,direction);
  }
  api.projectileInstances=projectileIndex;
  renderer.render(scene,camera);api.instances=instances.size;api.triangles=renderer.info.render.triangles;api.drawCalls=renderer.info.render.calls;
 };
 api.has=id=>renderEnabled&&templates.has(id);
 api.snapshot=()=>[...instances.entries()].map(([id,e])=>({id,species:e.species,assetPath:e.assetPath,structure:e.structure,rotationY:e.model.rotation.y,bannerColors:e.structure?(()=>{const colors=[];e.model.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.name==='BannerTeam')colors.push(m.color.getHexString())});return colors})():undefined,state:e.state,visible:e.root.visible,clips:Object.keys(e.actions),scale:e.model.scale.x,arm:(e.model.getObjectByName('ArmR')||e.model.getObjectByName('Arm.R')||e.model.getObjectByName('upperarm_r'))?.quaternion.toArray()}));
 api.measure=id=>{const e=instances.get(id);if(!e)return null;e.root.updateMatrixWorld(true);const bounds=new THREE.Box3(),p=new THREE.Vector3();let vertices=0,bones={},topOffset=-Infinity;e.model.traverse(o=>{if(o.isBone)bones[o.name]=o.quaternion.toArray();if(o.isMesh){o.skeleton?.update();for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,p);p.applyMatrix4(o.matrixWorld);bounds.expandByPoint(p);topOffset=Math.max(topOffset,e.root.position.z-p.z+p.y*3346/4980);vertices++}}});return{min:bounds.min.toArray(),max:bounds.max.toArray(),vertices,bones,topOffset}};
 api.dispose=()=>{if(draw===overlayDraw)draw=previousDraw;if(window.drawUnitHUD===overlayHUD)window.drawUnitHUD=previousHUD;hudCanvas.remove();if(window.unitContainsPoint===modelHitTest)window.unitContainsPoint=previousHitTest;for(const e of instances.values())e.mixer.stopAllAction();renderer.dispose();renderer.domElement.remove()};
}
