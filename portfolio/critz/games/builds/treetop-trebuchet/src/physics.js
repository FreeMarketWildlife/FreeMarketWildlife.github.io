// SI units, x right, y up. Angles measured counterclockwise from +x.
// First bounded model: fixed axle and rigidly attached counterweight; massless taut sling.
export const defaults = Object.freeze({ longArm: 3, shortArm: 0.8, sling: 2.5,
  counterMass: 100, projectileMass: 1, beamLinearDensity: 8 / 3.8, releasePinAngle: 1.45, gravity: 9.81,
  frameMass:30, frameFriction:.65, armDamping: 0, flightDrag: 0, pivotHeight: 300, initialArm: -2.5, initialSling: -Math.PI / 2, initialSlingSpeed: 0 });
export function config(overrides = {}) {
  const p = { ...defaults, ...overrides };
  if(p.counterMount!==undefined&&!['fixed','hinged'].includes(p.counterMount))throw Error('Invalid counterweight mounting');
  if(p.counterMount==='hinged'&&(!p.counterKind||!Number.isFinite(p.counterHanger)||p.counterHanger<.3||p.counterHanger>1))throw Error('Hinged weight needs a material and a 0.3–1 m hanger');
  if(p.counterKind!==undefined&&!['rock','basket','iron'].includes(p.counterKind))throw Error('Invalid counterweight material');
  if(p.foundationBraces!==undefined&&(!Number.isInteger(p.foundationBraces)||p.foundationBraces<0||p.foundationBraces>3))throw Error('Invalid foundation braces');
  if(p.fastCollisionStepHz!==undefined&&![2400,4800].includes(p.fastCollisionStepHz))throw new Error('Invalid fastCollisionStepHz');
  if(p.collisionStepHz!==undefined&&![1200,2400].includes(p.collisionStepHz))throw new Error('Invalid collisionStepHz');
  if(p.collisionSubsteps!==undefined&&typeof p.collisionSubsteps!=='boolean')throw new Error('Invalid collisionSubsteps');
  for(const key of ['solverVelocityIterations','solverPositionIterations'])if(p[key]!==undefined&&(!Number.isInteger(p[key])||p[key]<1||p[key]>100))throw new Error(`Invalid ${key}`);
  if (p.mechanicalWinding !== undefined && typeof p.mechanicalWinding !== "boolean") throw new Error("Invalid mechanicalWinding");
  if (p.windingTorque !== undefined && (!Number.isFinite(p.windingTorque) || p.windingTorque < 0 || p.windingTorque > 10000)) throw new Error("Winding torque outside tested 0–10000 N m domain");
  for (const key of Object.keys(defaults)) if (!Number.isFinite(p[key])) throw new Error(`Invalid ${key}`);
  for (const key of ['longArm','shortArm','sling','counterMass','projectileMass','beamLinearDensity','gravity'])
    if (p[key] <= 0) throw new Error(`Positive ${key} required`);
  for (const key of ['armDamping','flightDrag','frameFriction'])
    if(p[key]<0) throw new Error(`Nonnegative ${key} required`);
  for (const key of ['longArm','shortArm','sling'])
    if(p[key]<0.1 || p[key]>20) throw new Error(`${key} outside tested 0.1–20 m domain`);
  if(p.longArm<=p.shortArm) throw new Error('Long beam must exceed short beam');
  if(p.projectileMass<0.1 || p.projectileMass>100 || p.counterMass<1 || p.counterMass>1000 || p.beamLinearDensity<0.1 || p.beamLinearDensity>100)
    throw new Error('Mass outside tested prototype domain');
  if(p.pivotHeight<=p.longArm+p.sling) throw new Error('Pivot must clear full suspended mechanism above ground');
  if(p.releasePinAngle<=0 || p.releasePinAngle>=Math.PI) throw new Error('Pin angle must lie between 0 and pi');
  if(Math.abs(p.initialSlingSpeed)>4) throw new Error('Initial sling speed outside tested domain');
  if(p.frameMass<=0 || p.frameMass>200 || p.frameFriction>1)throw new Error('Invalid frame mass/friction');
  return p;
}
export const initialState = p => [p.initialArm, p.initialSling, 0, p.initialSlingSpeed];
function terms(p) {
  const {longArm:a, shortArm:b, sling:l, counterMass:M, projectileMass:m, beamLinearDensity:density}=p;
  const mb=density*(a+b), c=(a-b)/2;
  return {a,b,l,M,m,mb,c,I:mb*((a+b)**2/12+c*c)};
}
export function derivative(s,p) {
  const [t,f,w,v]=s, {a,b,l,M,m,mb,c,I}=terms(p), d=t-f;
  const shot=geometry(s,p).projectile, drag=-p.flightDrag*Math.hypot(shot.vx,shot.vy), fx=drag*shot.vx, fy=drag*shot.vy;
  const A=I+M*b*b+m*a*a, B=m*a*l*Math.cos(d), C=m*l*l;
  const R=-m*a*l*Math.sin(d)*v*v-p.gravity*(m*a+mb*c-M*b)*Math.cos(t)-p.armDamping*w+a*(-fx*Math.sin(t)+fy*Math.cos(t));
  const S=m*a*l*Math.sin(d)*w*w-m*p.gravity*l*Math.cos(f)+l*(-fx*Math.sin(f)+fy*Math.cos(f));
  const det=A*C-B*B;
  return [w,v,(R*C-B*S)/det,(A*S-B*R)/det];
}
export function step(s,p,dt=1/1000) {
  if (!(dt>0 && dt<=0.02)) throw new Error('Use a positive timestep <= 0.02 s');
  const add=(k,h)=>s.map((v,i)=>v+h*k[i]);
  const k1=derivative(s,p), k2=derivative(add(k1,dt/2),p),k3=derivative(add(k2,dt/2),p),k4=derivative(add(k3,dt),p);
  return s.map((v,i)=>v+dt/6*(k1[i]+2*k2[i]+2*k3[i]+k4[i]));
}
export function geometry(s,p) {
  const [t,f,w,v]=s,{a,b,l}=terms(p);
  const tip={x:a*Math.cos(t),y:p.pivotHeight+a*Math.sin(t)};
  return {tip,counter:{x:-b*Math.cos(t),y:p.pivotHeight-b*Math.sin(t)},
    projectile:{x:tip.x+l*Math.cos(f),y:tip.y+l*Math.sin(f),
      vx:-a*Math.sin(t)*w-l*Math.sin(f)*v,vy:a*Math.cos(t)*w+l*Math.cos(f)*v}};
}
export function energy(s,p) {
  const [t,f,w,v]=s,{a,b,l,M,m,mb,c,I}=terms(p);
  return .5*(I+M*b*b+m*a*a)*w*w+.5*m*l*l*v*v+m*a*l*Math.cos(t-f)*w*v+
    p.gravity*((m*a+mb*c-M*b)*Math.sin(t)+m*l*Math.sin(f));
}
export function tension(s,p) {
  const [t,f,w,v]=s,acc=derivative(s,p)[2];
  const shot=geometry(s,p).projectile, drag=-p.flightDrag*Math.hypot(shot.vx,shot.vy);
  return drag*(shot.vx*Math.cos(f)+shot.vy*Math.sin(f))+p.projectileMass*(p.sling*v*v+p.longArm*w*w*Math.cos(t-f)-p.longArm*acc*Math.sin(f-t)-p.gravity*Math.sin(f));
}
export function ballistic(release,time,g=9.81) {
  return {x:release.x+release.vx*time,y:release.y+release.vy*time-.5*g*time*time,
    vx:release.vx,vy:release.vy-g*time};
}
// Idealized release pin: ring opens on the falling relative sling/beam angle.
// This geometric event is not a target trajectory or a full ring/contact simulation.
export function simulate(overrides={},dt=1/1000) {
  const p=config(overrides); if (!(dt>0 && dt<=0.005)) throw new Error('Use timestep <= 0.005 s');
  let s=initialState(p), time=0; const frames=[];
  const frame=(state,t)=>({time:t,state:[...state],...geometry(state,p)});
  frames.push(frame(s,0));
  if(tension(s,p)<0) return {p,frames,release:null,reason:'invalid initial slack',time:0};
  for(let i=0;time<5;i++) {
    const next=step(s,p,dt), nextTime=time+dt;
    // Fail visibly rather than export an unstable or energy-injecting launch.
    const scale=1+Math.abs(energy(s,p));
    if(!next.every(Number.isFinite) || energy(next,p)>energy(s,p)+scale*1e-7)
      return {p,frames,release:null,reason:'numerical validity failure: reduce timestep or revise configuration',time};
    const events=[];
    const checks=[['slack',q=>tension(q,p)],['release pin',q=>q[1]-q[0]-p.releasePinAngle]];
    for(const [reason,value] of checks) if(value(s)>=0 && value(next)<0) {
      let lo=0,hi=dt;
      for(let j=0;j<32;j++){const mid=(lo+hi)/2;if(value(step(s,p,mid))>=0)lo=mid;else hi=mid;}
      events.push({reason,offset:lo,state:step(s,p,lo)});
    }
    if(events.length) {
      const event=events.sort((a,b)=>a.offset-b.offset)[0],final=frame(event.state,time+event.offset);
      frames.push(final);
      return {p,frames,release:{...final.projectile},reason:event.reason,time:final.time};
    }
    s=next;time=nextTime;frames.push(frame(s,time));
  }
  return {p,frames,release:null,reason:'no separation within 5 s',time};
}
// Quadratic air resistance: F=-k*|v|*v, k in kg/m. Zero is vacuum mode.
export function flightStep(s,p,dt) {
  if(!(dt>0 && dt<=0.02)) throw new Error('Flight timestep must be <= 0.02 s');
  if(p.flightDrag===0) return ballistic(s,dt,p.gravity);
  const f=q=>{const drag=p.flightDrag*Math.hypot(q.vx,q.vy)/p.projectileMass;
    return {x:q.vx,y:q.vy,vx:-drag*q.vx,vy:-p.gravity-drag*q.vy};};
  const add=(k,h)=>Object.fromEntries(Object.keys(s).map(key=>[key,s[key]+h*k[key]]));
  const a=f(s),b=f(add(a,dt/2)),c=f(add(b,dt/2)),d=f(add(c,dt));
  return Object.fromEntries(Object.keys(s).map(key=>[key,s[key]+dt/6*(a[key]+2*b[key]+2*c[key]+d[key])]));
}
// Read-only dry run. Optional stop test clips the short hint before authored obstacles.
export function predict(overrides={},beforeObstacle=()=>false) {
  const result=simulate({...overrides}),points=[];
  if(result.release){let s={...result.release};points.push({...s});
    for(let i=1;i<=800;i++){const next=flightStep(s,result.p,.001);
      if(beforeObstacle(s,next))break;s=next;if(i%50===0)points.push({...s});}}
  return {release:result.release?{...result.release}:null,reason:result.reason,points};
}
