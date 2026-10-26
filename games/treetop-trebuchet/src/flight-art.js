import {surfaceImpactSource,recentContactFeedback,drawContactWord} from './impact-feedback.js?v=70';
/** Original ink-and-cream flight punctuation. Rendering only, driven by real
 * simulation time and contact events; no forces, randomness or screen flashes. */
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function drawFlightAccents(c,{sim,project,scale,width,height,reducedMotion=false}){
 if(!sim.release)return;
 const p=sim.real(sim.shot),pos=project(p),speed=Math.hypot(p.vx,p.vy),r=clamp(sim.animal.length*scale*.65,12,38);
 c.save();c.lineCap='round';c.lineJoin='round';
 if(!reducedMotion&&sim.phase==='flight'&&speed>5){
  const ux=p.vx/speed,uy=-p.vy/speed,pace=clamp(speed/28,0,1);c.globalAlpha=.25+pace*.25;
  for(let i=-1;i<=1;i++){const drift=((sim.time*3+i*.31)%1+1)%1,back=r+8+drift*12,span=8+pace*17,n=i*(r*.65+2);c.beginPath();c.moveTo(pos[0]-ux*back-uy*n,pos[1]-uy*back+ux*n);c.lineTo(pos[0]-ux*(back+span)-uy*n,pos[1]-uy*(back+span)+ux*n);c.strokeStyle='#fff6cd';c.lineWidth=2.8;c.stroke();}
 }
 for(const hit of sim.contactEvents??[]){
  if(!hit)continue;
  const age=sim.time-hit.time;if(age<0||age>.46||hit.material==='foliage'||hit.material==='sap'||(hit.strength<.3&&!hit.power)||!surfaceImpactSource(sim,hit))continue;
  const q=project(hit),life=1-age/.46,spread=reducedMotion?14:12+age*55,axis=hit.normal?Math.atan2(-hit.normal.y,hit.normal.x):-Math.PI/2;
  c.globalAlpha=life;
  for(let i=0;i<7;i++){const a=axis+(i-3)*.42,j=i%2?1:.72,inner=spread*.44,outer=spread*j;c.beginPath();c.moveTo(q[0]+Math.cos(a)*inner,q[1]+Math.sin(a)*inner);c.lineTo(q[0]+Math.cos(a-.07)*outer,q[1]+Math.sin(a-.07)*outer);c.lineTo(q[0]+Math.cos(a+.07)*outer,q[1]+Math.sin(a+.07)*outer);c.closePath();c.fillStyle=i%2?'#f6d260':'#fff4ce';c.fill();c.strokeStyle='#6c533c';c.lineWidth=1.2;c.stroke();}
  if(!reducedMotion)for(let i=0;i<3;i++){const a=axis+(i-1)*.85,d=8+age*(28+i*8),x=q[0]+Math.cos(a)*d,y=q[1]+Math.sin(a)*d+age*age*65;c.save();c.translate(x,y);c.rotate(i+age*4);c.fillStyle=i%2?'#e7b462':'#bad27f';c.strokeStyle='#4d6346';c.lineWidth=1;c.beginPath();c.ellipse(0,0,3.8*life,2*life,0,0,TAU);c.fill();c.stroke();c.restore();}
 }
 c.restore();
 drawContactWord(c,recentContactFeedback(sim),project,{width,height});
}
