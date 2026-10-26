import {loadGreenhouseGrounds,renderGreenhouseGrounds} from './greenhouse-grounds.js';
import {loadBearArt} from './bear-art.js';
import {loadTanoshiArt,drawTanoshi} from './tanoshi-art.js';
import {loadHomeArt,hasHomeArt,homeEntry,drawHomeArt,drawHomeProp,drawRoomBackdrop} from './home-art.js';
import {drawContactSprite} from './contact-rules.js';
import {worldFoot,centeredCamera} from './world-space.js';
import {actorView,drawReaction} from './actors.js';
import {loadEnvironment,renderEnvironment,drawEnvironmentTile} from './environment-render.js';
// Native, appearance-only exploration renderer. Collision and interaction live
// in world.js; sprite bounds and transparency never decide a walkable cell.
import { loadAtlas } from './atlas.js';
import { scenes, buildings, getEntities } from './world.js';
import {loadLivingArt,drawLiving,characterFrame,npcIdentity,drawHabitatProp,drawCritter,RESCUES} from './living-art.js';
import {drawThreshold,applyLighting} from './lighting.js';
let atlas, entries, correctedCast;
const contactSources=new Map();
function contactSource(id,draw,w,h){
 if(!contactSources.has(id)){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'));contactSources.set(id,canvas);}
 return contactSources.get(id);
}
export async function initWorldArt() {
  [atlas,correctedCast] = await Promise.all([
    loadAtlas(new URL('../assets/playable/atlas.json', import.meta.url)),
    loadAtlas(new URL('../assets/playable/characters/atlas.json', import.meta.url)),
    loadEnvironment(),loadLivingArt(),loadGreenhouseGrounds(),loadHomeArt(),loadTanoshiArt(),loadBearArt(),
  ]);
  entries = new Map(atlas.manifest.assets.map(a => [a.id, a]));
}
function sprite(c, id, x, y) {
  const a = entries.get(id);
  if (!a) throw new Error(`Missing exploration art: ${id}`);
  atlas.draw(c, id, x - a.anchor[0], y - a.anchor[1]);
}
export function character(c, x, y, {gender='boy',look, facing='down',pose='idle',mode='walk'}={}) {
  if(['rival-mom','rival-dad'].includes(look)) {c.save();c.translate(x,y);c.scale(2,2);correctedCast.draw(c,`char.${look}.${facing}.${mode}.${pose}`,-12,-32);c.restore();return;}
  if(look?.startsWith('legacy.')) { c.save();c.translate(x,y);c.scale(2,2);sprite(c,`char.${look.slice(7)}.${facing}.${mode}.${pose}`,0,0);c.restore();return; }
  drawLiving(c,look||`hero-${gender}`,characterFrame(facing,pose),x-16,y-64);
}
let debug = {};
export function getRenderDebug() { return structuredClone(debug); }
export function renderWorld(canvas, state, time, view) {
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  if(scenes[state.scene].style==='greenhouse'){debug=renderGreenhouseGrounds(c,state,time,view,character);return;}
  if(scenes[state.scene].map) { debug=renderEnvironment(c,state,time,view,character,npcIdentity); return; }
  c.save();
  const scene = scenes[state.scene], outside = ['town','yard'].includes(scene.style);
  // Camera tracks the integer rendered foot position directly, without easing.
  const foot=worldFoot(view.x,view.y);
  const camera = centeredCamera(foot,canvas.width,canvas.height,state.gender);
  debug = {camera, playerFoot:foot, width:canvas.width,height:canvas.height, scene:state.scene, atlas:atlas.manifest.image};
  c.fillStyle = outside ? '#446749' : '#223038'; c.fillRect(0,0,canvas.width,canvas.height);
  c.save(); c.translate(-camera.x,-camera.y);
  if(!outside)drawRoomBackdrop(c,camera,canvas.width,canvas.height);
  const oldSprite=(id,x,y)=>{if(hasHomeArt(id)){const a=homeEntry(id);drawHomeArt(c,id,x-a.anchor[0],y-a.anchor[1]);return;}c.save();c.translate(x,y);c.scale(2,2);sprite(c,id,0,0);c.restore();};
  const tile = (id,x,y) => {const home=id==='floor.wood'?'floor.wood.'+((x+y)%2):id==='wall.interior.upper'?'wall.top':id==='wall.interior'?'wall.face':null;if(home){drawHomeArt(c,home,x*32,y*32);return;}c.save();c.scale(2,2);atlas.draw(c,id,x*16,y*16);c.restore();};
  const path = (x,y) => scene.style === 'yard' ? (x===7 || x===8) :
    [8,9,17,18,25].includes(y) || [9,10,19,20].includes(x) ||
    buildings.some(b => x===b.x+3 && y>=b.y+5 && y<=b.y+6);
  for (let y=0;y<scene.h;y++) for(let x=0;x<scene.w;x++) {
    if (outside) tile(path(x,y)?'ground.path':'ground.grass',x,y);
    else if(y===3) {tile(scene.style==='shop'?'floor.tile':'floor.wood',x,y);c.save();c.beginPath();c.rect(x*32,y*32,32,16);c.clip();drawEnvironmentTile(c,`interior.base.${scene.style==='shop'?'tile':'wood'}`,x*32,y*32-12);c.restore();}
    else if(x===0&&y>3) {tile(scene.style==='shop'?'floor.tile':'floor.wood',x,y);c.save();c.beginPath();c.rect(x*32,y*32,16,32);c.clip();drawEnvironmentTile(c,'interior.side.left',x*32-16,y*32);c.restore();}
    else tile(y===0?'wall.interior.upper':y<3?'wall.interior':scene.style==='shop'?'floor.tile':'floor.wood',x,y);
  }
  if (outside) {
    for(let x=0;x<scene.w;x++) { tile('fence.horizontal',x,0); if (x!==7&&x!==8) tile('fence.horizontal',x,scene.h); }
    for(let y=1;y<scene.h-1;y++) { tile('fence.vertical',0,y); tile('fence.vertical',scene.w,y); }
  } else {
    for(let y=0;y<scene.h;y++){tile(scene.style==='shop'?'floor.tile':'floor.wood',scene.w,y);c.save();c.beginPath();c.rect(scene.w*32+16,y*32,16,32);c.clip();drawEnvironmentTile(c,'interior.side.right',scene.w*32+16,y*32);c.restore();}
    for(let x=0;x<=scene.w;x++){tile(scene.style==='shop'?'floor.tile':'floor.wood',x,scene.h);c.save();c.beginPath();c.rect(x*32,scene.h*32+16,32,16);c.clip();drawEnvironmentTile(c,'interior.front.rim',x*32,scene.h*32+16);c.restore();}
    if(scene.style !== 'shop') oldSprite('rug',8*32,8*32);
  }
  const drawables=[], effects=[];
  const add=(depth, draw) => drawables.push({depth,draw});
  const prop = (o,id=o.sprite) => {if(drawHomeProp(c,id,o))return;if(o.kind==='tank'&&state.stage==='morning'&&id!=='prop.tank.broken'&&drawHomeProp(c,'terrarium-world',o))return;const x=(o.x+o.w/2)*32,y=(o.y+o.h)*32;
    if(!o.collision){if(o.kind==='tank'&&id!=='prop.tank.broken')drawHabitatProp(c,'terrarium',x,y);else oldSprite(id,x,y);return;}
    const living=o.kind==='tank'&&id!=='prop.tank.broken',entry=entries.get(id),w=living?96:entry.rect[2]*2,h=living?96:entry.rect[3]*2;
    const image=contactSource(living?'terrarium-contact':id,ctx=>{if(living)drawHabitatProp(ctx,'terrarium',48,96);else {ctx.imageSmoothingEnabled=false;ctx.scale(2,2);atlas.draw(ctx,id,0,0);}},w,h);
    const artRect=[x-(living?48:entry.anchor[0]*2),y-(living?96:entry.anchor[1]*2),w,h];
    drawContactSprite(c,image,[0,0,w,h],artRect,o.collision,{kind:o.kind,key:id});};
  for(const o of scene.objects) {
    if(o.kind==='pond') { for(let y=o.y;y<o.y+o.h;y++) for(let x=o.x;x<o.x+o.w;x++) tile('ground.water',x,y); continue; }
    if(o.kind==='tree') {
      prop(o,'tree.trunk');
      add((o.y+o.h)*32,()=>prop(o,'tree.canopy')); continue;
    }
    let id=o.sprite;
    if(o.kind==='tank'&&state.scene==='bedroom'&&state.stage==='night')
      id=['broken','kaid'].includes(state.storyBeat)?'prop.tank.broken':'prop.tank.night';
    if(o.kind==='leaves') prop(o,id);
    else add((o.y+o.h)*32,()=>prop(o,id));
  }
  if(scene.style==='town') for(const b of buildings) add((b.y+b.h)*32,()=>prop(b));
  if(scene.visualHouse) add((scene.visualHouse.y+scene.visualHouse.h)*32,()=>prop(scene.visualHouse));
  for(const e of getEntities(state)) {
    if(e.type==='npc') {const v=actorView(state,e.id),{x,y}=worldFoot(v.x===null?e.x*16:v.x,v.y===null?e.y*16:v.y);add(y,()=>{character(c,x,y-v.hop,{look:npcIdentity(e,state.gender),facing:v.facing,pose:v.pose});});effects.push(()=>drawReaction(c,x,y,v));}
    else if(e.type==='tanoshi') add((e.y+1)*32,()=>drawTanoshi(c,e));
    else if(e.type==='rescue') add((e.y+1)*32,()=>drawCritter(c,RESCUES[e.id],e.x*32,e.y*32,time));
    else if(e.id==='townSign'||e.type==='route') add(e.y*32,()=>oldSprite(e.type==='route'?'sign.route':'sign.town',e.x*32,e.y*32));
    else if(e.type==='door'&&!outside) {
      // Threshold decoration shares the authored entity anchor, never its bounds.
      if(!e.stair)drawThreshold(c,e,state.scene,state);
    }
  }
  // Stairs remain visible during the opening even while travel is story-locked.
  // Their lower lip is the entrance; side/back cells belong to the solid well.
  for(const e of scene.entities.filter(e=>e.stair))
    prop({kind:'stairs',sprite:state.scene==='bedroom'?'stairs.down':'stairs.up',x:e.x-1,y:e.y-1,w:3,h:2,collision:e.stair.footprint});
  if(state.stage==='night'&&state.scene==='bedroom') {
    if(['mom','broken','kaid'].includes(state.storyBeat)) add(7*32,()=>{const v=actorView(state,'mom');character(c,11*32+16,7*32-v.hop,{look:'mom',facing:v.facing});drawReaction(c,11*32+16,7*32,v);});
    if(state.storyBeat==='kaid') add(6*32,()=>{const v=actorView(state,'kaid');character(c,12*32+16,6*32-v.hop,{look:'kaid',facing:v.facing});drawReaction(c,12*32+16,6*32,v);});
  }
  const hero=actorView(state,'hero');add(foot.y+.1,()=>character(c,foot.x,foot.y-hero.hop,{gender:state.gender,facing:hero.mark==='?'?hero.facing:view.facing,pose:view.pose,mode:view.action==='run'?'run':'walk'}));effects.push(()=>drawReaction(c,foot.x,foot.y,hero));
  if(state.scene==='glass')for(const [type,x]of [['aquarium',4],['paludarium',12]])add(5*32,()=>drawHabitatProp(c,type,x*32,5*32));
  if(state.scene==='vet')for(const [id,x]of [['gecko',4],['snail',11]])if(state.flags.rescued.includes(id))add(5*32,()=>drawCritter(c,RESCUES[id],x*32,4*32,time));
  drawables.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
  effects.forEach(draw=>draw());
  c.restore();
  debug.lighting=applyLighting(c,state,true);
  c.restore();
}
