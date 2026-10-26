import {objectBounds,pointInPolygon} from './grove-geometry.js?v=71';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const LEAF_DRAG_PER_METRE=.018;
export const leafRetention=(density,distance,resistance=0)=>Math.exp(-LEAF_DRAG_PER_METRE*Math.max(0,density)*Math.max(0,distance)*(1-clamp(resistance,0,1)));
export const sapRetention=(resistance=0)=>.01+.99*clamp(resistance,0,1);
export const isEnvironment=o=>o.collision&&['foliage','sap'].includes(o.material);
const edgeDistance=(p,a,b)=>{const x=b.x-a.x,y=b.y-a.y,t=clamp(((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1),0,1);return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y);};
const contains=(o,p,padding=0)=>o.points?pointInPolygon(p,o.points)||padding>0&&o.points.some((a,i)=>edgeDistance(p,a,o.points[(i+1)%o.points.length])<=padding):Math.hypot(p.x-o.x,p.y-o.y)<=o.radius+padding;
function circleInterval(x,y,r,a,b){const dx=b.x-a.x,dy=b.y-a.y,A=dx*dx+dy*dy;if(A<1e-20)return[];const px=a.x-x,py=a.y-y,B=2*(px*dx+py*dy),C=px*px+py*py-r*r,D=B*B-4*A*C;if(D<=0)return[];const root=Math.sqrt(D),lo=clamp((-B-root)/(2*A),0,1),hi=clamp((-B+root)/(2*A),0,1);return hi>lo?[[lo,hi]]:[];}
function edgeStrip(a,b,p,q,r){const ex=q.x-p.x,ey=q.y-p.y,L=Math.hypot(ex,ey);if(!L)return[];const x=((a.x-p.x)*ex+(a.y-p.y)*ey)/L,y=((a.y-p.y)*ex-(a.x-p.x)*ey)/L,dx=((b.x-a.x)*ex+(b.y-a.y)*ey)/L,dy=((b.y-a.y)*ex-(b.x-a.x)*ey)/L;let lo=0,hi=1;for(const [v,d,min,max]of[[x,dx,0,L],[y,dy,-r,r]]){if(Math.abs(d)<1e-15){if(v<min||v>max)return[];}else{const t0=(min-v)/d,t1=(max-v)/d;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));}}return hi>lo?[[lo,hi]]:[];}
/** Swept centre-path length through the region, expanded by the real payload
 * radius. Edge strips and vertex discs preserve concave notches exactly. */
export function coveredDistance(o,a,b,padding=0){
 const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<1e-12)return 0;
 let intervals=[];
 if(!o.points)intervals=circleInterval(o.x,o.y,o.radius+padding,a,b);
 else{
  const cuts=[0,1];for(let i=0;i<o.points.length;i++){const p=o.points[i],q=o.points[(i+1)%o.points.length],ex=q.x-p.x,ey=q.y-p.y,den=dx*ey-dy*ex;if(Math.abs(den)>1e-12){const px=p.x-a.x,py=p.y-a.y,t=(px*ey-py*ex)/den,u=(px*dy-py*dx)/den;if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);}if(padding>0)intervals.push(...edgeStrip(a,b,p,q,padding),...circleInterval(p.x,p.y,padding,a,b));}
  cuts.sort((x,y)=>x-y);for(let i=1;i<cuts.length;i++){const lo=cuts[i-1],hi=cuts[i],t=(lo+hi)/2;if(hi-lo>1e-12&&pointInPolygon({x:a.x+dx*t,y:a.y+dy*t},o.points))intervals.push([lo,hi]);}
 }
 intervals.sort((a,b)=>a[0]-b[0]);let total=0,end=-1;for(const [lo,hi]of intervals){if(hi<=end)continue;total+=hi-Math.max(lo,end);end=hi;}return total*length;
}
export function createEnvironmentIndex(objects,cellSize=32){
 const entries=objects.filter(isEnvironment).map(o=>({o,b:objectBounds(o)})),cells=new Map(),large=[];let previous=new Set();
 const key=(x,y)=>`${x},${y}`;
 for(const e of entries){const x0=Math.floor(e.b.minX/cellSize),x1=Math.floor(e.b.maxX/cellSize),y0=Math.floor(e.b.minY/cellSize),y1=Math.floor(e.b.maxY/cellSize);if((x1-x0+1)*(y1-y0+1)>256){large.push(e);continue;}for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const k=key(x,y);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(e);}}
 function candidates(a,b){const x0=Math.floor(Math.min(a.x,b.x)/cellSize),x1=Math.floor(Math.max(a.x,b.x)/cellSize),y0=Math.floor(Math.min(a.y,b.y)/cellSize),y1=Math.floor(Math.max(a.y,b.y)/cellSize);if((x1-x0+1)*(y1-y0+1)>4096)return entries;const result=new Set(large);for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(const e of cells.get(key(x,y))??[])result.add(e);return [...result];}
 return{size:entries.length,step(a,b,{foliageResistance=0,sapResistance:sapResistanceValue=0,width=0,length=0}={}){
  const radius=width/2,half=Math.max(0,length/2-radius),padding=half+radius,count=half?Math.min(17,Math.ceil(half*2/Math.max(radius*1.5,.05))+1):1,paths=Array.from({length:count},(_,i)=>{const offset=count===1?0:-half+i*half*2/(count-1);return[{x:a.x+Math.cos(a.angle??0)*offset,y:a.y+Math.sin(a.angle??0)*offset},{x:b.x+Math.cos(b.angle??0)*offset,y:b.y+Math.sin(b.angle??0)*offset}];});
  const nearby=candidates({x:Math.min(a.x,b.x)-padding,y:Math.min(a.y,b.y)-padding},{x:Math.max(a.x,b.x)+padding,y:Math.max(a.y,b.y)+padding}),inside=new Set(),events=[];let depth=0,saps=0;
  for(const {o,b:bounds}of nearby){if(Math.max(a.x,b.x)+padding<bounds.minX||Math.min(a.x,b.x)-padding>bounds.maxX||Math.max(a.y,b.y)+padding<bounds.minY||Math.min(a.y,b.y)-padding>bounds.maxY)continue;const atEnd=paths.some(([,p])=>contains(o,p,radius)),distance=Math.max(...paths.map(([p,q])=>coveredDistance(o,p,q,radius)));if(atEnd)inside.add(o.id);if(!atEnd&&distance<=0)continue;
   if(o.material==='foliage')depth+=(o.density??16)*distance;
   if(!previous.has(o.id)){events.push(o);if(o.material==='sap')saps++;}
  }
  previous=inside;return{retention:leafRetention(1,depth,foliageResistance)*sapRetention(sapResistanceValue)**saps,leafDepth:depth,sapHits:saps,events,checks:nearby.length};
 }};
}
