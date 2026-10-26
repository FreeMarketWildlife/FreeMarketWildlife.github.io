import {GRAVITY} from './build-physics.js?v=71';
import {gravityScaleAt,spaceScale} from './grove-map.js?v=71';
import {objectBounds,pointInPolygon,polygonArea} from './grove-geometry.js?v=71';
import {coveredDistance} from './grove-environment.js?v=71';
// An opportunity is an advisory surface region, never an aiming solution.
// Unknown contacts suppress it; no live body or environment history is stepped.
const cache=new WeakMap(),CELL=32,MAX_OBJECTS=5000,MAX_CANDIDATES=96,MAX_EDGES=2048,STEPS=108;
const dot=(a,b)=>a.x*b.x+a.y*b.y,cross=(a,b)=>a.x*b.y-a.y*b.x,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const overlap=(a,b)=>a.maxX>=b.minX&&a.minX<=b.maxX&&a.maxY>=b.minY&&a.minY<=b.maxY;
const segmentBounds=(a,b,r)=>({minX:Math.min(a.x,b.x)-r,maxX:Math.max(a.x,b.x)+r,minY:Math.min(a.y,b.y)-r,maxY:Math.max(a.y,b.y)+r});
function indexFor(map){
 if(!map||!Array.isArray(map.objects)||map.objects.length>MAX_OBJECTS)return null;
 if(cache.has(map))return cache.get(map);const cells=new Map(),large=[];let invalid=false,totalEdges=0;
 for(const o of map.objects){if(!o.collision)continue;if(o.points?.length>512){invalid=true;break;}const b=objectBounds(o),edges=[];
  if(!Object.values(b).every(Number.isFinite)){invalid=true;break;}
  if(o.points){const n=o.type==='chain'?o.points.length-1:o.points.length,sign=polygonArea(o.points)<0?1:-1;
   for(let j=0;j<n;j++){const a=o.points[j],z=o.points[(j+1)%o.points.length],dx=z.x-a.x,dy=z.y-a.y,L=Math.hypot(dx,dy);if(L>1e-8)edges.push({a,b:z,normal:{x:-dy/L*sign,y:dx/L*sign},chain:o.type==='chain',edge:j});}
  }
  totalEdges+=edges.length;if(totalEdges>30000){invalid=true;break;}
  const e={o,b,edges},x0=Math.floor(b.minX/CELL),x1=Math.floor(b.maxX/CELL),y0=Math.floor(b.minY/CELL),y1=Math.floor(b.maxY/CELL);
  if([x0,x1,y0,y1].some(n=>Math.abs(n)>1e7)){invalid=true;break;}
  if((x1-x0+1)*(y1-y0+1)>256)large.push(e);
  else for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const k=x+','+y;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(e);}
 }
 const index=invalid?null:{cells,large};cache.set(map,index);return index;
}
function query(index,bounds){const x0=Math.floor(bounds.minX/CELL),x1=Math.floor(bounds.maxX/CELL),y0=Math.floor(bounds.minY/CELL),y1=Math.floor(bounds.maxY/CELL);if([x0,x1,y0,y1].some(n=>!Number.isFinite(n)||Math.abs(n)>1e7)||(x1-x0+1)*(y1-y0+1)>256)return null;
 const set=new Set(index.large);for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(const e of index.cells.get(x+','+y)??[])set.add(e);
 const entries=[...set].filter(e=>overlap(e.b,bounds));return entries.length>MAX_CANDIDATES||entries.reduce((n,e)=>n+e.edges.length,0)>MAX_EDGES?null:entries;
}
function edgeHit(a,b,u,v){const r={x:b.x-a.x,y:b.y-a.y},s={x:v.x-u.x,y:v.y-u.y},q={x:u.x-a.x,y:u.y-a.y},d=cross(r,s);if(Math.abs(d)<1e-12)return null;const t=cross(q,s)/d,z=cross(q,r)/d;return t>=0&&t<=1&&z>=0&&z<=1?{t,x:a.x+r.x*t,y:a.y+r.y*t}:null;}
function circleHit(a,b,x,y,r){const d={x:b.x-a.x,y:b.y-a.y},q={x:a.x-x,y:a.y-y},A=dot(d,d),B=2*dot(q,d),C=dot(q,q)-r*r,D=B*B-4*A*C;if(C<=0)return{t:0,x:a.x,y:a.y};if(A<1e-20||D<0)return null;const t=(-B-Math.sqrt(D))/(2*A);return t>=0&&t<=1?{t,x:a.x+d.x*t,y:a.y+d.y*t}:null;}
function firstSolid(entries,a,b,r){let first=null;
 const keep=(h,e,normal,edge,corner=false)=>{if(h&&(!first||h.t<first.t))first={...h,id:e.o.id,material:e.o.material??'wood',kind:e.o.type,normal,edge,corner};};
 for(const e of entries){if(!overlap(e.b,segmentBounds(a,b,r)))continue;
  if(e.o.type==='enemy'||['foliage','sap'].includes(e.o.material))continue;
  if(e.o.points){if(e.o.type!=='chain'&&pointInPolygon(a,e.o.points))return{blocked:true,t:0};
   for(const edge of e.edges){const ex=edge.b.x-edge.a.x,ey=edge.b.y-edge.a.y,t=clamp(((a.x-edge.a.x)*ex+(a.y-edge.a.y)*ey)/(ex*ex+ey*ey),0,1);if(Math.hypot(a.x-edge.a.x-t*ex,a.y-edge.a.y-t*ey)<=r)return{blocked:true,t:0};let n=edge.normal;if(edge.chain&&dot({x:b.x-a.x,y:b.y-a.y},n)>0)n={x:-n.x,y:-n.y};
    if(dot({x:b.x-a.x,y:b.y-a.y},n)>=0)continue;
    const h=edgeHit(a,b,{x:edge.a.x+n.x*r,y:edge.a.y+n.y*r},{x:edge.b.x+n.x*r,y:edge.b.y+n.y*r});
    keep(h,e,n,edge.edge);
    // End caps are conservative corner hazards, never a promised landing face.
    for(const v of[edge.a,edge.b]){const h=circleHit(a,b,v.x,v.y,r);if(h){const L=Math.hypot(h.x-v.x,h.y-v.y)||1;keep(h,e,{x:(h.x-v.x)/L,y:(h.y-v.y)/L},edge.edge,true);}}
   }
  }else if(e.o.type==='circle'){const h=circleHit(a,b,e.o.x,e.o.y,e.o.radius+r);if(h){const L=Math.hypot(h.x-e.o.x,h.y-e.o.y)||1;keep(h,e,{x:(h.x-e.o.x)/L,y:(h.y-e.o.y)/L},0);}}
  else return{blocked:true,t:0};
 }
 return first;
}
function trajectory(sim,horizon,center,offset,angle,omega){const c=sim.c,animal=sim.animal,mass=animal.grams/1000,area=Math.PI*(animal.width/2)**2,dt=horizon/STEPS;
 const acceleration=(p,time)=>{const a=angle+omega*time,originY=p.y-offset.x*Math.sin(a)-offset.y*Math.cos(a),air=clamp((520*spaceScale(sim.map)-originY-sim.map.launch.y)/(60*spaceScale(sim.map)),0,1),relative=p.vx-(c.wind??0),v=Math.hypot(relative,p.vy),k=c.drag ? .5*1.225*.8*area*air/mass : 0;
  return{x:-k*v*relative,y:-GRAVITY*gravityScaleAt(originY+sim.map.launch.y,sim.map)-k*v*p.vy};};
 const points=[{...center}];let p={...center};for(let i=0;i<STEPS;i++){const a=acceleration(p,i*dt),mid={x:p.x+p.vx*dt/2,y:p.y+p.vy*dt/2,vx:p.vx+a.x*dt/2,vy:p.vy+a.y*dt/2},z=acceleration(mid,(i+.5)*dt);p={x:p.x+mid.vx*dt,y:p.y+mid.vy*dt,vx:p.vx+z.x*dt,vy:p.vy+z.y*dt};if(!Object.values(p).every(Number.isFinite))return null;points.push(p);}return points;
}
function cast(entries,points,r,horizon,floor){const dt=horizon/STEPS;for(let i=0;i<STEPS;i++){const a=points[i],b=points[i+1],bounds=segmentBounds(a,b,r);
  for(const e of entries)if((e.o.type==='enemy'||['foliage','sap'].includes(e.o.material))&&overlap(e.b,bounds)&&coveredDistance(e.o,a,b,r)>1e-9)return null;
  let hit=firstSolid(entries,a,b,r);
  if(a.y>=floor+r&&b.y<floor+r){const t=(a.y-floor-r)/(a.y-b.y);if(!hit||t<hit.t)hit={id:'forest-floor',kind:'ground',material:'stone',x:a.x+(b.x-a.x)*t,y:floor+r,t,normal:{x:0,y:1},edge:0};}
  if(hit){if(hit.blocked||hit.corner||hit.t<=1e-9&&i===0||hit.normal.y<.35)return null;return{...hit,x:hit.x-hit.normal.x*r,y:hit.y-hit.normal.y*r,eta:(i+hit.t)*dt};}
 }return null;}
// The large envelope can touch the selected face before the small one. Keep
// checking unknown interactions until the later bound; stopping at first touch
// would incorrectly promise a landing through a nearby field or side wall.
function clearUntil(entries,points,r,horizon,until,accepted){
 const dt=horizon/STEPS;for(let i=0;i<STEPS&&i*dt<until;i++){
  const a=points[i],end=points[i+1],fraction=Math.min(1,(until-i*dt)/dt),b={x:a.x+(end.x-a.x)*fraction,y:a.y+(end.y-a.y)*fraction},bounds=segmentBounds(a,b,r);
  for(const e of entries){if(!overlap(e.b,bounds))continue;
   if(e.o.id!==accepted.id){if(coveredDistance(e.o,a,b,r)>1e-9)return false;continue;}
   for(const edge of e.edges){if(edge.edge===accepted.edge)continue;const movement={x:b.x-a.x,y:b.y-a.y};let n=edge.normal;if(edge.chain&&dot(movement,n)>0)n={x:-n.x,y:-n.y};if(dot(movement,n)<0&&coveredDistance({points:[edge.a,edge.b]},a,b,r)>1e-9)return false;}
  }
 }return true;
}
/** Reads fresh state on every call. A boost invalidates the former path at once.
 * Map objects must be immutable, as in the current validated simulation map. */
export function landingOpportunity(sim,{horizon=.9}={}){
 if(sim?.phase!=='flight'||!sim.release||sim.shotContacts?.size>0||sim.pendingEncounters?.length)return null;
 const animal=sim.animal,p=sim.real(sim.shot);if(!animal||![animal.length,animal.width,animal.grams,p.x,p.y,p.vx,p.vy,horizon].every(Number.isFinite)||animal.length<=0||animal.width<=0||animal.grams<=0||p.vy>=-.6||horizon<=0)return null;
 if(!Number.isFinite(sim.c?.wind??0)||!Number.isFinite(p.angle??0)||!sim.shot?.getLocalCenter)return null;
 horizon=Math.min(.9,horizon);const index=indexFor(sim.map);if(!index)return null;
 const local=sim.shot.getLocalCenter(),angle=p.angle??0,omega=(sim.shot.getAngularVelocity?.()??0)/(sim.T??1),offset={x:local.x*sim.L,y:local.y*sim.L},center={x:p.x+offset.x*Math.cos(angle)-offset.y*Math.sin(angle),y:p.y+offset.x*Math.sin(angle)+offset.y*Math.cos(angle),vx:p.vx,vy:p.vy};
 // A rotating compound can touch before its centre. Agreeing nested envelopes
 // limits the face/ETA uncertainty without pretending a width-only circle fits.
 if(![offset.x,offset.y,omega].every(Number.isFinite))return null;
 const outer=Math.hypot(animal.length,animal.width)/2+Math.hypot(offset.x,offset.y),inner=animal.width*.15,points=trajectory(sim,horizon,center,offset,angle,omega);if(!points)return null;
 // The launcher is not in the authored map. Suppress a path that can return
 // through its moving hardware rather than silently assuming only map contacts.
 if(typeof sim.pivot==='function'){
  const pivot=sim.pivot(),c=sim.c,base=Math.max(c.longArm??0,(c.shortArm??0)+(sim.facts?.counterRadius??0),Math.hypot((c.baseWidth??0)*.6,c.pivotHeight??0));
  const moving=!['anchored','floating'].includes(c.chassis),frame=moving&&sim.frame?sim.real(sim.frame):{vx:0,vy:0},radius=base+outer+(moving?Math.hypot(frame.vx,frame.vy)*horizon+.5*GRAVITY*horizon*horizon:0);
  for(let i=1;i<points.length;i++)if(coveredDistance({x:pivot.x,y:pivot.y,radius},points[i-1],points[i])>0)return null;
 }
 const bounds={minX:Math.min(...points.map(p=>p.x))-outer,maxX:Math.max(...points.map(p=>p.x))+outer,minY:Math.min(...points.map(p=>p.y))-outer,maxY:Math.max(...points.map(p=>p.y))+outer},entries=query(index,bounds);if(!entries)return null;
 const early=cast(entries,points,outer,horizon,-sim.map.launch.y),late=cast(entries,points,inner,horizon,-sim.map.launch.y);
 if(!early||!late||early.id!==late.id||early.edge!==late.edge||dot(early.normal,late.normal)<.95||late.eta-early.eta>.16)return null;
 const spread=Math.hypot(early.x-late.x,early.y-late.y)/2+outer;
 if(spread>Math.max(.6,animal.length*.8)||!clearUntil(entries,points,outer,horizon,late.eta,early))return null;
 return{id:early.id,x:(early.x+late.x)/2,y:(early.y+late.y)/2,eta:(early.eta+late.eta)/2,etaMin:early.eta,etaMax:late.eta,kind:early.kind,material:early.material,normal:{...early.normal},spread,advisory:true,confidence:'advisory'};
}
