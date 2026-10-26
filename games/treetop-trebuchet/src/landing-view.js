import {objectBounds,polygonArea} from './grove-geometry.js?v=66';
// A short presentation forecast, never a collision response or aiming guide.
// Only the next upward solid face in the current ballistic path is considered.
const cache=new WeakMap(),cross=(a,b)=>a.x*b.y-a.y*b.x;
function candidates(map){
 if(!map)return[];let value=cache.get(map);if(value)return value;
 value=map.objects.filter(o=>o.collision!==false&&!['foliage','sap'].includes(o.material)&&o.type!=='enemy').map(o=>({o,b:objectBounds(o)}));cache.set(map,value);return value;
}
function segment(a,b,p,q){
 const r={x:b.x-a.x,y:b.y-a.y},s={x:q.x-p.x,y:q.y-p.y},v={x:p.x-a.x,y:p.y-a.y},d=cross(r,s);
 if(Math.abs(d)<1e-9)return null;const t=cross(v,s)/d,u=cross(v,r)/d;
 return t>=0&&t<=1&&u>=0&&u<=1?{t,x:a.x+t*r.x,y:a.y+t*r.y}:null;
}
export function imminentLanding(map,p,{radius=.05,gravity=8.825985,horizon=.65}={}){
 if(![p.x,p.y,p.vx,p.vy,radius,gravity,horizon].every(Number.isFinite)||radius<0||gravity<0||horizon<=0)return null;
 const at=t=>({x:p.x+p.vx*t,y:p.y+p.vy*t-.5*gravity*t*t}),end=at(horizon),apex=gravity>0?at(Math.max(0,Math.min(horizon,p.vy/gravity))):p;
 const bounds={minX:Math.min(p.x,end.x)-radius,maxX:Math.max(p.x,end.x)+radius,minY:Math.min(p.y,end.y)-radius,maxY:Math.max(p.y,end.y,apex.y)+radius};
 const nearby=candidates(map).filter(({b})=>b.maxX>=bounds.minX&&b.minX<=bounds.maxX&&b.maxY>=bounds.minY&&b.minY<=bounds.maxY);
 const floor=-(map?.launch.y??0),steps=20,dt=horizon/steps;
 for(let i=0;i<steps;i++){
  const t=i*dt,a=at(t),b=at(t+dt);let first=null;
  const keep=(hit,id,nx,ny)=>{if(hit&&(!first||hit.t<first.fraction))first={id,x:hit.x-nx*radius,y:hit.y-ny*radius,eta:t+hit.t*dt,fraction:hit.t};};
  if(a.y>=floor+radius&&b.y<floor+radius)keep(segment(a,b,{x:bounds.minX-1,y:floor+radius},{x:bounds.maxX+1,y:floor+radius}),'ground',0,1);
  for(const {o}of nearby){
   if(o.points){const sign=o.type==='chain'?null:polygonArea(o.points)<0?1:-1,n=o.type==='chain'?o.points.length-1:o.points.length;
    for(let j=0;j<n;j++){const u=o.points[j],v=o.points[(j+1)%o.points.length],dx=v.x-u.x,dy=v.y-u.y,length=Math.hypot(dx,dy);if(length<1e-6)continue;
     const outward=sign??(dx>=0?1:-1),nx=-dy/length*outward,ny=dx/length*outward;
     if(ny<.2||p.vx*nx+(p.vy-gravity*(t+dt*.5))*ny>=0)continue;
     keep(segment(a,b,{x:u.x+nx*radius,y:u.y+ny*radius},{x:v.x+nx*radius,y:v.y+ny*radius}),o.id,nx,ny);
    }
   }else if(o.type==='circle'){
    const dx=b.x-a.x,dy=b.y-a.y,ox=a.x-o.x,oy=a.y-o.y,r=o.radius+radius,A=dx*dx+dy*dy,B=2*(ox*dx+oy*dy),C=ox*ox+oy*oy-r*r,D=B*B-4*A*C;
    if(A>1e-12&&D>=0){const f=(-B-Math.sqrt(D))/(2*A);if(f>=0&&f<=1){const x=a.x+f*dx,y=a.y+f*dy,nx=(x-o.x)/r,ny=(y-o.y)/r;if(ny>.2)keep({t:f,x,y},o.id,nx,ny);}}
   }
  }
  if(first){delete first.fraction;return first;}
 }
 return null;
}
