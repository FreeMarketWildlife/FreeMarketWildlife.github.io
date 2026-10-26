/** A gravity-draped, inextensible display strand. The solver's unilateral rope
 * joint supplies actual tension; this lightweight Verlet strand only renders
 * slack, settling and the free release tail. It adds no forces to the throw. */
import {GRAVITY} from './build-physics.js?v=71';
export class RopeVisual {
 constructor(count=18){this.count=count;this.points=[];}
 reset(a,b,length){
  const slack=Math.sqrt(Math.max(0,length*length-((b.x-a.x)**2+(b.y-a.y)**2)))*.48;
  this.points=Array.from({length:this.count+1},(_,i)=>{const t=i/this.count,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t-Math.sin(t*Math.PI)*slack;return{x,y,px:x,py:y};});
 }
 update(a,b,length,dt=1/60,floor=()=>0,{pinA=true}={}){
  if(!this.points.length||pinA&&Math.hypot(this.points[0].x-a.x,this.points[0].y-a.y)>length*.6)this.reset(a,b,length);
  const ps=this.points,n=this.count,span=Math.max(length,Math.hypot(b.x-a.x,b.y-a.y))/n,h=Math.min(1/30,Math.max(0,dt));
  if(h===0){if(pinA)Object.assign(ps[0],a);Object.assign(ps[n],b);return ps;}
  for(let i=pinA?1:0;i<n;i++){const p=ps[i],vx=(p.x-p.px)*.94,vy=(p.y-p.py)*.94;p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy-GRAVITY*h*h;}
  for(let pass=0;pass<18;pass++){
   if(pinA)Object.assign(ps[0],a);Object.assign(ps[n],b);
   for(let i=0;i<n;i++){const p=ps[i],q=ps[i+1],dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||1,err=(d-span)/d,k=(i===0&&pinA)||i===n-1?1:.5;if(i>0||!pinA){p.x+=dx*err*k;p.y+=dy*err*k;}if(i+1<n){q.x-=dx*err*k;q.y-=dy*err*k;}}
   for(let i=pinA?1:0;i<n;i++)ps[i].y=Math.max(floor(ps[i].x),ps[i].y);
  }
  if(pinA)Object.assign(ps[0],a);Object.assign(ps[n],b);return ps;
 }
}
