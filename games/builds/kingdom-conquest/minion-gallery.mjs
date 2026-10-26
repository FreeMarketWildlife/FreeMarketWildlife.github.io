import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);renderer.domElement.className='view';document.body.appendChild(renderer.domElement);
const loader=new GLTFLoader(),entries=[],root=document.getElementById('roster');
let current='idle',rotate=true,previous=performance.now();
window.minionGallery={ready:0,errors:[],entries};
for(const s of MINION_SPECIES){
 const card=document.createElement('article');card.className='card';card.innerHTML=`<div class="model-frame" aria-label="${s.name} animated 3D model"></div><div class="label"><span class="role">${s.role}</span><h2>${s.name}</h2><p>${s.gear}<br>${Math.round(s.height*100)} cm · ${s.range} range · ${s.cooldown}s attack</p></div>`;root.appendChild(card);
 const frame=card.firstChild;
 loader.load(s.model,gltf=>{
  const scene=new THREE.Scene(),model=gltf.scene;scene.add(model);scene.add(new THREE.HemisphereLight(0xfff5df,0x53715a,2.8));
  const sun=new THREE.DirectionalLight(0xffebc9,2.5);sun.position.set(-1,2,2);scene.add(sun);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(.22,32),new THREE.MeshBasicMaterial({color:0x0b1d17,transparent:true,opacity:.4}));floor.rotation.x=-Math.PI/2;floor.position.y=-.002;scene.add(floor);
  const camera=new THREE.PerspectiveCamera(32,1,.01,10);camera.position.set(0,s.height*.65,s.height*2.6);camera.lookAt(0,s.height*.48,0);
  const mixer=new THREE.AnimationMixer(model),actions={};for(const clip of gltf.animations){const key=clip.name.toLowerCase().replace(/.*\|/,'');actions[key]=mixer.clipAction(clip)}
  const entry={id:s.id,model,scene,camera,mixer,actions,frame,angle:0};entries.push(entry);actions[current]?.play();
  window.minionGallery.ready=entries.length;document.getElementById('load').textContent=`${entries.length} / 18 models ready`;
 },undefined,e=>{window.minionGallery.errors.push(s.id+': '+e.message);document.getElementById('load').textContent='Some models could not load'});
 let drag=null;frame.style.cursor='grab';frame.onpointerdown=e=>{drag=e.clientX;frame.setPointerCapture(e.pointerId)};
 frame.onpointermove=e=>{if(drag===null)return;const entry=entries.find(x=>x.id===s.id);if(entry)entry.angle+=(e.clientX-drag)*.02;drag=e.clientX};frame.onpointerup=()=>drag=null;
}
document.querySelectorAll('[data-clip]').forEach(button=>button.onclick=()=>{
 current=button.dataset.clip;document.querySelectorAll('[data-clip]').forEach(b=>b.classList.toggle('active',b===button));
 for(const e of entries){e.mixer.stopAllAction();e.actions[current]?.reset().play()}
});
document.getElementById('rotate').onclick=()=>{rotate=!rotate;document.getElementById('rotate').textContent='Turntable: '+(rotate?'on':'off')};
function frame(now){
 const dt=Math.min((now-previous)/1000,.1);previous=now;
 renderer.setSize(innerWidth,innerHeight,false);renderer.setScissorTest(false);renderer.clear();renderer.setScissorTest(true);
 for(const e of entries){const r=e.frame.getBoundingClientRect();e.mixer.update(dt);if(rotate)e.angle+=dt*.18;e.model.rotation.y=e.angle;
  if(r.bottom<0||r.top>innerHeight)continue;
  e.camera.aspect=r.width/r.height;e.camera.updateProjectionMatrix();renderer.setViewport(r.left,innerHeight-r.bottom,r.width,r.height);renderer.setScissor(r.left,innerHeight-r.bottom,r.width,r.height);renderer.render(e.scene,e.camera);
 }
 requestAnimationFrame(frame)
}requestAnimationFrame(frame);
