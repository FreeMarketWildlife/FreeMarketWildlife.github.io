import {config,geometry,initialState,flightStep} from './physics.js?v=66';
// Cartesian particle + rotating beam. A unilateral massless cable can pull only.
export function ropeConfig(overrides={}) { return config(overrides); }
const inertia=p=>p.beamLinearDensity*(p.longArm+p.shortArm)*( (p.longArm+p.shortArm)**2/12+((p.longArm-p.shortArm)/2)**2)+p.counterMass*p.shortArm**2;
export function ropeGeometry(s,p){const tip={x:p.longArm*Math.cos(s.theta),y:p.pivotHeight+p.longArm*Math.sin(s.theta)};
 const dx=s.x-tip.x,dy=s.y-tip.y,r=Math.hypot(dx,dy),ex=r?dx/r:0,ey=r?dy/r:-1;
 return {tip,r,ex,ey,jt:p.longArm*(ex*Math.sin(s.theta)-ey*Math.cos(s.theta)),
  relative:((Math.atan2(dy,dx)-s.theta)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)};}
export function ropeEnergy(s,p){const c=(p.longArm-p.shortArm)/2,beam=p.beamLinearDensity*(p.longArm+p.shortArm);
 return .5*inertia(p)*s.w*s.w+.5*p.projectileMass*(s.vx*s.vx+s.vy*s.vy)+
   p.gravity*((beam*c-p.counterMass*p.shortArm)*Math.sin(s.theta)+p.projectileMass*(s.y-p.pivotHeight));}
export function ropeState(overrides={}) {const p=config(overrides),g=geometry(initialState(p),p);
 return {theta:p.initialArm,w:0,x:g.projectile.x,y:g.projectile.y,vx:g.projectile.vx,vy:g.projectile.vy,attached:true,released:false};}
export function trayState(overrides={}) {const p=config(overrides);return {...ropeState(p),x:-3.33,y:p.pivotHeight-3.33,vx:0,vy:0,attached:false};}
function forces(s,p,hand){const c=(p.longArm-p.shortArm)/2,beam=p.beamLinearDensity*(p.longArm+p.shortArm),drag=p.flightDrag*Math.hypot(s.vx,s.vy);
 return {torque:p.gravity*(p.counterMass*p.shortArm-beam*c)*Math.cos(s.theta)-p.armDamping*s.w,
  fx:-drag*s.vx+(hand?.fx??0),fy:-p.projectileMass*p.gravity-drag*s.vy+(hand?.fy??0)};}
export function handForce(s,target,p) {
 if(!target)return null;
 // Finite compliant hand: spring-damper with a disclosed 80 N force ceiling.
 const k=80,c=12;let fx=k*(target.x-s.x)-c*s.vx,fy=k*(target.y-s.y)-c*s.vy;
 const magnitude=Math.hypot(fx,fy),scale=Math.min(1,80/(magnitude||1));
 return {fx:fx*scale,fy:fy*scale};
}
export function ropeImpact(input,p,locked=false){
 const s={...input},g=ropeGeometry(s,p),invI=locked?0:1/inertia(p),invM=1/p.projectileMass;
 const radial=g.jt*s.w+g.ex*s.vx+g.ey*s.vy;
 if(g.r<p.sling-1e-9 || radial<=0)return {state:s,impulse:0,loss:0};
 const impulse=radial/(g.jt*g.jt*invI+invM);
 s.w-=impulse*g.jt*invI;s.vx-=impulse*g.ex*invM;s.vy-=impulse*g.ey*invM;
 return {state:s,impulse,loss:.5*impulse*radial};
}
export function ropeStep(input,p,dt=.001,{locked=false,hand=null,capture=false}={}) {
 if(!(dt>0 && dt<=.002))throw new Error('Rope step outside (0, 0.002] s domain');
 if(!Object.values(input).filter(v=>typeof v==='number').every(Number.isFinite))throw new Error('Nonfinite rope state');
 const s={...input},beforeEnergy=ropeEnergy(s,p),old=ropeGeometry(s,p), invI=locked?0:1/inertia(p),invM=1/p.projectileMass;
 const F=forces(s,p,hand),v0={w:s.w,vx:s.vx,vy:s.vy};
 s.w=locked?0:s.w+.5*dt*F.torque*invI;s.vx+=.5*dt*F.fx*invM;s.vy+=.5*dt*F.fy*invM;
 const trial={theta:s.theta+dt*s.w,x:s.x+dt*s.vx,y:s.y+dt*s.vy};
 s.theta=trial.theta;s.x=trial.x;s.y=trial.y;
 // Resolve a slack-to-taut impact at contact, rather than losing energy through
 // a large positional correction at the end of the step.
 if(input.attached && !input.released && old.r<p.sling-1e-8 && ropeGeometry(s,p).r>p.sling){
   const free={...input,attached:false};let lo=0,hi=dt;
   for(let i=0;i<32;i++){const mid=(lo+hi)/2;if(ropeGeometry(ropeStep(free,p,mid,{locked,hand}).state,p).r<p.sling)lo=mid;else hi=mid;}
   const contact=ropeStep(free,p,hi,{locked,hand});contact.state.attached=true;
   const hit=ropeImpact(contact.state,p,locked),remaining=dt-hi;
   const tail=remaining>1e-10?ropeStep(hit.state,p,remaining,{locked,hand}):{state:hit.state,handWork:0,lossEstimate:0,velocityImpactLoss:0,tensionImpulse:0,extension:0};
   const endEnergy=ropeEnergy(tail.state,p),handWork=contact.handWork+tail.handWork,lossEstimate=contact.lossEstimate+tail.lossEstimate,velocityImpactLoss=hit.loss+tail.velocityImpactLoss;
   return {...tail,captured:false,handWork,lossEstimate,velocityImpactLoss,energyChange:endEnergy-beforeEnergy,
     constraintResidual:endEnergy-beforeEnergy-handWork+lossEstimate+velocityImpactLoss,tensionImpulse:hit.impulse+tail.tensionImpulse};
 }
 let positionImpulse=0;
 if(s.attached && !s.released && ropeGeometry(s,p).r>p.sling){
   // Bracket the nearest nonnegative old-gradient multiplier; never pull by compression.
   const at=lambda=>({...s,theta:trial.theta-lambda*old.jt*invI,x:trial.x-lambda*old.ex*invM,y:trial.y-lambda*old.ey*invM});
   let lo=0,hi=(ropeGeometry(s,p).r-p.sling)/(old.jt*old.jt*invI+invM);
   for(let i=0;i<16 && ropeGeometry(at(hi),p).r>p.sling;i++)hi*=2;
   if(ropeGeometry(at(hi),p).r>p.sling)throw new Error('No positive rope constraint root: reduce timestep');
   for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(ropeGeometry(at(mid),p).r>p.sling)lo=mid;else hi=mid;}
   positionImpulse=hi;const corrected=at(hi);s.theta=corrected.theta;s.x=corrected.x;s.y=corrected.y;
   if(Math.abs(ropeGeometry(s,p).r-p.sling)>1e-7)throw new Error('Rope position constraint did not converge');
   s.w+=(s.theta-trial.theta)/dt;s.vx+=(s.x-trial.x)/dt;s.vy+=(s.y-trial.y)/dt;
 }
 const G=forces(s,p,hand);s.w+=.5*dt*G.torque*invI;s.vx+=.5*dt*G.fx*invM;s.vy+=.5*dt*G.fy*invM;
 let velocityImpulse=0,velocityImpactLoss=0;
 if(s.attached && !s.released){const projected=ropeImpact(s,p,locked);Object.assign(s,projected.state);velocityImpulse=projected.impulse;velocityImpactLoss=projected.loss;}
 let captured=false;
 if(capture && !s.attached){const g=ropeGeometry(s,p),pouch={x:g.tip.x,y:g.tip.y-p.sling};
   if(Math.hypot(s.x-pouch.x,s.y-pouch.y)<.3 && g.r<=p.sling){s.attached=true;captured=true;}}
 const after=ropeGeometry(s,p),previousRelative=old.relative;
 // Unwrap relative sling angle locally; release only on an outward-moving pin crossing.
 let relative=after.relative;while(relative-previousRelative>Math.PI)relative-=2*Math.PI;while(relative-previousRelative< -Math.PI)relative+=2*Math.PI;
 if(!locked && s.attached && !s.released && after.r>=p.sling-1e-7 && previousRelative>p.releasePinAngle && relative<=p.releasePinAngle)s.released=true;
 const handWork=hand?hand.fx*(s.x-input.x)+hand.fy*(s.y-input.y):0;
 const lossEstimate=dt*(p.armDamping*(v0.w*v0.w+s.w*s.w)/2+p.flightDrag*(Math.hypot(v0.vx,v0.vy)**3+Math.hypot(s.vx,s.vy)**3)/2);
 if(![s.theta,s.w,s.x,s.y,s.vx,s.vy].every(Number.isFinite))throw new Error('Invalid rope integration');
 return {state:s,captured,handWork,lossEstimate,velocityImpactLoss,constraintResidual:ropeEnergy(s,p)-beforeEnergy-handWork+lossEstimate+velocityImpactLoss,energyChange:ropeEnergy(s,p)-beforeEnergy,
   tensionImpulse:positionImpulse/dt+velocityImpulse,extension:Math.max(0,after.r-p.sling)};
}
export function ropeLaunch(snapshot,overrides={}, {dt=.001,duration=5}={}){
 const p=config(overrides),frames=[{time:0,state:{...snapshot}}];let s={...snapshot};
 if(!s.attached) return {p,frames,release:null,reason:'critter not in pouch'};
 for(let i=1;i<=Math.round(duration/dt);i++){
   const previous=s;s=ropeStep(s,p,dt).state;
   if(s.released){let lo=0,hi=dt;for(let j=0;j<28;j++){const mid=(lo+hi)/2;if(ropeStep(previous,p,mid).state.released)hi=mid;else lo=mid;}
     s=ropeStep(previous,p,hi).state;const time=(i-1)*dt+hi;frames.push({time,state:{...s}});
     return {p,frames,release:{x:s.x,y:s.y,vx:s.vx,vy:s.vy},time,reason:'geometric pin'};}
   frames.push({time:i*dt,state:{...s}});
 }
 return {p,frames,release:null,time:duration,reason:'no pin release'};
}

export function ropePredict(snapshot,overrides={},beforeObstacle=()=>false){
 const result=ropeLaunch({...snapshot},overrides),points=[];
 if(result.release){let s={...result.release};points.push({...s});for(let i=1;i<=800;i++){
  const next=flightStep(s,result.p,.001);if(beforeObstacle(s,next))break;s=next;if(i%50===0)points.push({...s});}}
 return {points,snapshot:{...snapshot},release:result.release?{...result.release}:null,reason:result.reason};
}
