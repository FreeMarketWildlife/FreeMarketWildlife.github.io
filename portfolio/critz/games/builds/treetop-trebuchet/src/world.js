import {readMap,mapSurfaces} from './map-document.js?v=49';
import {surfaceY,surfaceCrossing} from './terrain.js?v=49';
import {flightStep} from './physics.js?v=49';
// One authored layout. Test dimensions/material coefficients are not lore.
const surfaces=[
  {id:'launch branch',y:294,minX:-8,maxX:5,restitution:.2,tangentRetention:.7},
  {id:'canopy branch',y:105,minX:170,maxX:230,restitution:.35,tangentRetention:.8},
  {id:'ground',y:0,minX:-10000,maxX:10000,restitution:.3,tangentRetention:.8},
  // Fixed short landing opportunities, not a continuous floor. Ordinary and
  // faster trajectories meet different gaps; no launch-corridor geometry moves.
  {id:'canopy approach',flightOnly:true,slope:-.35,y:112,minX:42,maxX:51,restitution:.3,tangentRetention:.8},
  {id:'canopy fork',flightOnly:true,slope:-.35,y:88,minX:65,maxX:75,restitution:.3,tangentRetention:.8},
  {id:'canopy crossing',flightOnly:true,slope:-.35,y:61,minX:88,maxX:99,restitution:.3,tangentRetention:.8},
  {id:'canopy lower',flightOnly:true,slope:-.35,y:32,minX:112,maxX:124,restitution:.3,tangentRetention:.8},
  {id:'canopy outer fork',flightOnly:true,slope:-.35,y:92,minX:110,maxX:121,restitution:.3,tangentRetention:.8},
  {id:'canopy outer crossing',flightOnly:true,slope:-.35,y:58,minX:145,maxX:157,restitution:.3,tangentRetention:.8},
  {id:'canopy outer lower',flightOnly:true,slope:-.35,y:26,minX:180,maxX:193,restitution:.3,tangentRetention:.8}
];
export const defaultWorld=Object.freeze({bumpers:Object.freeze([{x:32,y:255,radius:1.2},{x:48,y:165,radius:1.1},{x:75,y:260,radius:1.2},{x:110,y:215,radius:1.5},{x:145,y:165,radius:1.4},{x:180,y:90,radius:1.2},{x:230,y:18,radius:1.3}].map(p=>Object.freeze({...p,lore:'Grimroot Grove wind-worn branch',shape:'deflector',slope:-.65,friction:.08,restitution:.3}))),launchHeight:300,canopyTop:240,ground:0,
  groundDeceleration:2, surfaces:Object.freeze(surfaces.map(Object.freeze)),
  regions:Object.freeze(['Grandfather Tree branches/leaves → open-air freefall','Long jungle-canopy descent','Ground travel while horizontal momentum remains'])});
const authored=readMap();
export const world=authored?Object.freeze({...defaultWorld,bumpers:Object.freeze([]),surfaces:Object.freeze([...defaultWorld.surfaces.filter(s=>['ground','launch branch'].includes(s.id)).map(s=>s.id==='ground'?{...s,maxX:20000}:s),...mapSurfaces(authored)]),authoredEnemies:authored.objects.filter(o=>o.type==='enemy'),ambient:authored.ambient}):defaultWorld;
export function regionAt(y){return y>world.canopyTop?'Branches / open air':y>world.ground?'Jungle canopy':'Ground';}
// Point reference against authored one-way contact segments; swept crossing avoids tunneling.
export function firstCollision(a,b,layout=world) {
  const hits=[];
  for(const surface of layout.surfaces){
    const hit=surfaceCrossing(a,b,surface);if(hit)hits.push(hit);
  }
  return hits.sort((a,b)=>a.fraction-b.fraction)[0]??null;
}
export function impact(shot,surface) {
  if(surface.restitution<0 || surface.restitution>1 || surface.tangentRetention<0 || surface.tangentRetention>1)
    throw new Error('Passive collision coefficients must lie in [0,1]');
  const slope=surface.slope??0,norm=Math.hypot(1,slope),tx=1/norm,ty=slope/norm,nx=-ty,ny=tx;
  const tangent=(shot.vx*tx+shot.vy*ty)*surface.tangentRetention,normal=Math.abs(shot.vx*nx+shot.vy*ny)*surface.restitution;
  return {...shot,y:surfaceY(surface,shot.x),vx:tangent*tx+normal*nx,vy:tangent*ty+normal*ny};
}
export function worldStep(shot,p,dt,layout=world) {
  if(!(dt>0 && dt<=.02))throw new Error('World timestep must be <= 0.02 s');
  if(shot.y<=layout.ground && Math.abs(shot.vy)<.3){
    const speed=Math.abs(shot.vx),sign=Math.sign(shot.vx),duration=Math.min(dt,speed/layout.groundDeceleration);
    return {shot:{x:shot.x+sign*(speed*duration-.5*layout.groundDeceleration*duration**2),y:layout.ground,
      vx:sign*Math.max(0,speed-layout.groundDeceleration*dt),vy:0},collision:null};
  }
  const next=flightStep(shot,p,dt),hit=firstCollision(shot,next,layout);
  if(!hit)return {shot:next,collision:null};
  // Refine time on ballistic/drag path rather than use the chord's approximate crossing time.
  let lo=0,hi=dt;for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(flightStep(shot,p,mid||Number.EPSILON).y>=surfaceY(hit.surface,flightStep(shot,p,mid||Number.EPSILON).x))lo=mid;else hi=mid;}
  const at=flightStep(shot,p,hi),x=at.x;
  if(x<hit.surface.minX || x>hit.surface.maxX)return {shot:next,collision:null};
  const bounced=impact(at,hit.surface),remaining=dt-hi;
  const result=remaining>1e-10?flightStep(bounced,p,remaining):bounced;
  // Low bounces settle into dissipative ground travel; no extra launch energy.
  if(hit.surface.id==='ground' && bounced.vy<.3){result.y=layout.ground;result.vy=0;}
  return {shot:result,collision:hit.surface.id};
}
export function worldFlight(release,p,{dt=.001,duration=30,layout=world}={}) {
  if(!(dt>0 && dt<=.02) || !(duration>0 && duration<=60))throw new Error('Invalid world time domain');
  let shot={...release};const frames=[{time:0,...shot}],collisions=[];
  for(let i=1;i<=Math.round(duration/dt);i++){
    const next=worldStep(shot,p,dt,layout);shot=next.shot;
    if(!Object.values(shot).every(Number.isFinite))throw new Error('Invalid world flight');
    if(next.collision)collisions.push({time:i*dt,id:next.collision});
    frames.push({time:i*dt,...shot});
    if(shot.y===layout.ground && shot.vx===0 && shot.vy===0)break;
  }
  return {frames,collisions};
}
