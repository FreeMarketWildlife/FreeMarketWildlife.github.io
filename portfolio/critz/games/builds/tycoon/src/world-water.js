import {waterComponents,nearestShoreGround} from './water-map.js';
import {compileCoastalField} from './coastal-format.js';
import {createCoastalDrawing,coastalFieldPath,drawCoastalBoundary} from './coastal-drawing.js';
import {surface,footstepRipples,ripplePose,RIPPLE_SECONDS} from './water-surfaces.js';
import {loadCloudArt,cloudsVisible} from './water-clouds.js';
import {displayedMinute} from './day-clock.js';
const cache=new WeakMap();let water,cloud,sand,actorCanvas;
export async function loadWorldWater(){
 const load=async path=>{const url=new URL(path,import.meta.url),response=await fetch(url);if(!response.ok)throw Error('Water manifest failed to load');const manifest=await response.json(),image=new Image();image.src=new URL(manifest.image,url);await image.decode();return {manifest,image};};
 const [bank,cloudBank,sandBank]=await Promise.all([load('../assets/review/coastal-format/water.json'),loadCloudArt(),load('../assets/review/coastal-format/props.json')]);
 const {manifest:m,image:im}=bank;
 const entries=new Map(m.assets.map(a=>[a.id,a]));water={draw(c,id,x,y){const a=entries.get(id);if(!a)throw Error('Missing water '+id);c.drawImage(im,a.x,a.y,a.w,a.h,x,y,a.w,a.h);}};cloud=cloudBank;sand=sandBank;
}
export function drawSand(c,x,y,variant=0){const a=sand.manifest.assets.find(a=>a.id===`sand.${variant%4}`);c.drawImage(sand.image,a.x,a.y,a.w,a.h,x,y,32,32);}
function drawing(map){
 const signature=map.w+':'+map.h+'|'+map.terrain.join(',')+'|'+Object.keys(map.raw||{}).join(',');
 const previous=cache.get(map);
 if(previous?.signature===signature){previous.compiledComponents=0;return previous;}
 const layout=waterComponents(map), old=new Map(previous?.components.map(d=>[d.key,d])||[]);
 let compiled=0;
 const components=layout.components.map(body=>{
  if(old.has(body.key))return old.get(body.key);
  compiled++;
  const {x,y,w,h}=body.bounds, local=body.cells.map(a=>({...a,x:a.x-x/32,y:a.y-y/32}));
  const byCell=new Map(body.cells.map(a=>[`${a.x},${a.y}`,a]));
  const field=compileCoastalField(local,w,h);
  const d=createCoastalDrawing(field,(px,py)=>{
   const wx=px+x,wy=py+y,a=byCell.get(`${Math.floor(wx/32)},${Math.floor((wy-16)/32)}`);
   // The north projection may sit above the registered cell. Resolve its
   // source depth for the new dry-side shoulder without changing wet pixels.
   const projected=a||byCell.get(`${Math.floor(wx/32)},${Math.floor(wy/32)}`);
   return {ground:nearestShoreGround(a?.grounds||[],wx,wy),shallow:!!a?.surface.shallow,landwardGround:nearestShoreGround(projected?.grounds||[],wx,wy),landwardShallow:projected?!!projected.surface.shallow:body.cells.every(a=>a.surface.shallow),moving:!!a?.surface.moving};
  });
  const fresh=local.filter(a=>a.surface.identity==='fresh');
  d.freshPath=fresh.length===local.length?d.path:fresh.length?coastalFieldPath(compileCoastalField(fresh,w,h)):new Path2D();
  d.deepPath=body.mixed?coastalFieldPath(compileCoastalField(local.filter(a=>!a.surface.shallow),w,h,{sideInset:5,verticalInset:5})):null;
  // Runtime drawing needs the compiled paths, bank bitmap and packed shore
  // points. Keep dimensions for diagnostics; let construction masks/distances
  // leave the cache after all three paths have been compiled.
  d.field={width:field.width,height:field.height};
  return Object.assign(d,body);
 });
 const d={...layout,components,signature,compiledComponents:compiled,ripples:previous?.ripples||[],lastPositions:previous?.lastPositions||[]};
 cache.set(map,d);return d;
}
function clipComponent(c,d,path=d.path){c.translate(d.bounds.x,d.bounds.y);c.clip(path);c.translate(-d.bounds.x,-d.bounds.y);}
export function drawWorldWater(c,map,state,time,actors,character,{bounds=null}={}){
 const d=drawing(map),f=Math.floor(time/.1)%32,minute=displayedMinute(state.dayClock),identity=map.waterIdentity||'fresh';
 const visible=a=>!bounds||(a.x*32<bounds.x+bounds.w&&(a.x+1)*32>bounds.x&&a.y*32+2<bounds.y+bounds.h&&a.y*32+48>bounds.y);
 if(!d.cells.length)return {cells:0,identity,frame:f,components:0,compiledComponents:d.compiledComponents,fieldPixels:0};
 for(const [i,a]of actors.entries()){
  const x=Math.floor(a.x/32),y=Math.floor((a.y-1)/32),key=`${x},${y}`;
  if(d.lastPositions[i]&&key!==d.lastPositions[i]&&footstepRipples(d.byCell.get(key)?.surface))d.ripples.push({x:a.x,y:a.y,time});
  d.lastPositions[i]=key;
 }
 d.ripples=d.ripples.filter(r=>time>=r.time&&time-r.time<RIPPLE_SECONDS);
 for(const body of d.components){
  const b=body.bounds;
  if(bounds&&(b.x>=bounds.x+bounds.w||b.y>=bounds.y+bounds.h||b.x+b.w<=bounds.x||b.y+b.h<=bounds.y))continue;
  c.save();clipComponent(c,body);
  for(const a of body.cells)if(visible(a)){
   const id=`${a.surface.identity}.${(body.mixed&&!a.surface.shallow?'shallow-'+a.surface.type:a.surface.type)}.${f}`;
   // Cover the newly exposed north half without shifting existing interior or south texture.
   if(!d.byCell.has(`${a.x},${a.y-1}`))water.draw(c,id,a.x*32,a.y*32-16);
   water.draw(c,id,a.x*32,a.y*32+16);
  }
  if(body.deepPath){c.save();clipComponent(c,body,body.deepPath);for(const a of body.cells)if(!a.surface.shallow&&visible(a))water.draw(c,`${a.surface.identity}.${a.surface.type}.${f}`,a.x*32,a.y*32+16);c.restore();}
  if(minute>=1260){for(let i=0;i<70;i++){c.fillStyle=i%3?'#acd5da':'#e5eacb';c.fillRect((i*83+31)%(map.w*32),(i*57+126)%(map.h*32),2,2);}}
  else if(cloudsVisible(minute,'sunny')){c.save();c.globalAlpha=.52;for(let i=0;i<6;i++)cloud.draw(c,i%3,minute,Math.round(((map.w*32+i*181-time*9)%(map.w*32+200)))-96,140+i*66);c.restore();}
  for(const r of d.ripples){const pose=ripplePose(time-r.time);if(pose){c.save();c.globalAlpha=pose.alpha;c.fillStyle='#d0e7d9';for(let y=-pose.ry;y<=pose.ry;y++){const w=Math.round(pose.rx*Math.sqrt(Math.max(0,1-y*y/pose.ry**2)));c.fillRect(r.x-w,r.y+y,1,1);c.fillRect(r.x+w,r.y+y,1,1);}c.restore();}}
  c.save();clipComponent(c,body,body.freshPath);
  for(const a of actors){if(!actorCanvas){actorCanvas=document.createElement('canvas');actorCanvas.width=actorCanvas.height=64;}const cv=actorCanvas,ac=cv.getContext('2d');ac.clearRect(0,0,64,64);character(ac,32,64,a.options);c.save();c.globalAlpha=.5;c.translate(Math.round(a.x)-32,Math.round(a.y)-4);c.scale(1,-1);c.drawImage(cv,0,-64);c.restore();}
  c.restore();c.restore();
  c.save();c.translate(b.x,b.y);drawCoastalBoundary(c,body,f,{bounds:bounds?{...bounds,x:bounds.x-b.x,y:bounds.y-b.y}:null});c.restore();
 }
 return {cells:d.cells.length,identity,frame:f,components:d.components.length,compiledComponents:d.compiledComponents,fieldPixels:d.components.reduce((n,a)=>n+a.field.width*a.field.height,0),retainedFieldBytes:d.components.reduce((n,a)=>n+(a.field.wet?.byteLength||0)+(a.field.signed?.byteLength||0),0),cachedWaveBytes:d.components.reduce((n,a)=>n+[...a.waves.values()].reduce((n,cv)=>n+cv.width*cv.height*4,0),0)};
}
