/** One tentative incoming-surface mark. No camera, timing or physics writes.
 * Broken strokes distinguish an advisory region from a guaranteed hit point. */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finitePoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
export function layoutLandingCue(target,animal,{width,height,exclusions}={}){
 if(!finitePoint(target)||!finitePoint(animal)||![width,height].every(Number.isFinite)||width<160||height<150)return null;
 const inset=24,top=96,bottom=height-28;
 const visible=target[0]>=inset&&target[0]<=width-inset&&target[1]>=top&&target[1]<=bottom;
 let x=target[0],y=target[1],angle=0;
 if(!visible){
  if(animal[0]<inset||animal[0]>width-inset||animal[1]<top||animal[1]>bottom)return null;
  const dx=x-animal[0],dy=y-animal[1],limits=[];
  if(dx>0)limits.push((width-inset-animal[0])/dx);else if(dx<0)limits.push((inset-animal[0])/dx);
  if(dy>0)limits.push((bottom-animal[1])/dy);else if(dy<0)limits.push((top-animal[1])/dy);
  const t=Math.min(...limits.filter(n=>n>=0));if(!Number.isFinite(t))return null;
  x=animal[0]+dx*t;y=animal[1]+dy*t;angle=Math.atan2(dy,dx);
 }
 const blocks=exclusions??[{x:0,y:0,width:220,height:92},{x:width-85,y:0,width:85,height:90},{x:0,y:92,width:88,height:310}];
 if(blocks.some(b=>x+18>b.x&&x-18<b.x+b.width&&y+12>b.y&&y-12<b.y+b.height)||Math.hypot(x-animal[0],y-animal[1])<45)return null;
 return{x,y,angle,mode:visible?'surface':'edge'};
}
export function createLandingCue(){
 let owner=null,id=null,age=0;
 function clear(){id=null;age=0;}
 return{clear,update(sim,target,{project,width,height,dt=1/60,paused=false,enabled=true,exclusions}={}){
  if(owner!==sim){owner=sim;clear();}
  if(!enabled||!sim.release||sim.phase!=='flight'){clear();return null;}
  if(paused)return null;
  if(!target?.advisory||typeof target.id!=='string'||!Number.isFinite(target.x)||!Number.isFinite(target.y)||!Number.isFinite(target.eta)||target.eta<=.10){clear();return null;}
  if(id!==target.id){id=target.id;age=0;}else age+=clamp(Number.isFinite(dt)?dt:0,0,.1);
  if(age<.08)return null;
  const layout=layoutLandingCue(project(target),project(sim.real(sim.shot)),{width,height,exclusions});if(!layout)return null;
  return{...layout,id:target.id,alpha:clamp((age-.08)/.10,0,1)*.85,normal:target.normal&&[target.normal.x,target.normal.y].every(Number.isFinite)?target.normal:{x:0,y:1}};
 }};
}
export function drawLandingCue(c,cue){
 if(!cue||cue.alpha<=0)return;
 c.save();c.globalAlpha=cue.alpha;c.translate(cue.x,cue.y);c.rotate(cue.mode==='edge'?cue.angle:Math.atan2(cue.normal.x,cue.normal.y));c.lineCap='round';c.lineJoin='round';
 const strokes=cue.mode==='edge'?[[[-16,0],[-13,0]],[[-9,-8],[0,0],[-9,8]],[[4,-7],[4,7]]]:[[[-16,-3],[-10,-3]],[[-3,-3],[3,-3]],[[10,-3],[16,-3]]];
 for(const[color,width]of[['#29473c',4.4],['#f3e8b9',2.0]])for(const points of strokes){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 c.restore();
}
