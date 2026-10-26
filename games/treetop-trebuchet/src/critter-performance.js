/** Continuous physics orientation with damped illustrated secondary motion.
 * Expressions react to impacts; they never replace the body's physical angle
 * or reset its spin. Simulation time keeps Pause and slow motion coherent. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createCritterPerformance(){
 let owner=null,seq=0,hits=0,lastHit=-Infinity,impactKind='bonk-a',lastTime=0,lastOmega=0;
 let head=0,headV=0,tail=0,tailV=0,squash=0,squashV=0;
 const contacts=new Map();
 function update(sim){
  const time=sim.time??0,p=sim.real(sim.shot),released=!!sim.release;
  if(owner!==sim){owner=sim;seq=0;hits=0;lastHit=-Infinity;lastTime=time;lastOmega=0;head=headV=tail=tailV=squash=squashV=0;contacts.clear();}
  let dt=Math.max(0,time-lastTime),omega=sim.shot?.getAngularVelocity?.()/(sim.T??1);if(!Number.isFinite(omega))omega=0;
  const acceleration=dt>0?clamp((omega-lastOmega)/dt,-40,40):0;
  for(const hit of sim.contactEvents??[]){
   if(hit.seq<=seq)continue;seq=hit.seq;
   if(!released||['foliage','sap'].includes(hit.material)||hit.strength<.12||hit.time-(contacts.get(hit.id)??-Infinity)<.28)continue;
   contacts.set(hit.id,hit.time);hits++;lastHit=hit.time;impactKind=hits%2?'bonk-a':'bonk-b';
   const sign=hits%2?1:-1;headV+=sign*4.5;tailV-=sign*6;squashV+=8*Math.min(1.3,hit.strength);
  }
  // Small damped springs flex around a single continuous painted silhouette.
  // They are secondary animation, not unreported collision bodies or forces.
  const speed=Math.hypot(p.vx??0,p.vy??0),wind=released?clamp(speed/32,0,1):0;
  const headTarget=clamp(-acceleration*.003-omega*.006+wind*.065,-.16,.16),tailTarget=clamp(acceleration*.006+omega*.01-wind*.16,-.3,.3);
  let remaining=Math.min(1,dt);while(remaining>0){const h=Math.min(1/240,remaining);remaining-=h;
   headV+=(90*(headTarget-head)-15*headV)*h;head=clamp(head+headV*h,-.32,.32);
   tailV+=(55*(tailTarget-tail)-10*tailV)*h;tail=clamp(tail+tailV*h,-.5,.5);
   squashV+=(-155*squash-15*squashV)*h;squash=clamp(squash+squashV*h,-.12,.3);
  }
  lastTime=time;lastOmega=omega;
  const age=time-lastHit,tier=hits>=5?3:hits>=3?2:hits?1:0;
  const pose=!released?'ready':sim.phase==='finished'&&hits?'dazed':age<.23?impactKind:age<.62?'stars':'flying';
  const airPose=!released?'rest':p.vy>2?'rise':p.vy< -2?'dive':'float';
  return{pose,tier,hits,airPose,wind,angle:-(p.angle??0),frame:time*8,impactAge:age,flex:{head,tail},squashX:1+squash,squashY:1/(1+squash)};
 }
 return{update};
}
export const critterPoseName=p=>({ready:'Ready to fly',flying:'Wheee!', 'bonk-a':'BONK!', 'bonk-b':'OOF!',stars:'Seeing stars',dazed:p.tier>=3?'Still smiling!':'A little dazed'}[p.pose]??'Wheee!');
