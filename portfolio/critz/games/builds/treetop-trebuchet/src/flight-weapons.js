// Critz deck identities; limited-shot flight effects are Treetop game balance.
import {Vec2} from '../vendor/planck/planck.mjs';
export const WEAPONS=Object.freeze([
 {id:'slingshot',name:'Slingshot',ammo:3,kick:5,radius:32,cooldown:.25,color:'#edbb73',word:'THWIP!',hint:'3 precise pebble shots'},
 {id:'staff',name:'Wizard Staff',ammo:Infinity,kick:7,radius:62,cooldown:.35,color:'#68e4ff',word:'ZAP!',hint:'Magic burst · overheats'},
 {id:'air',name:'Bottle o’ Air',ammo:1,kick:12,radius:120,cooldown:.5,color:'#b3f5dd',word:'WHOOSH!',hint:'1 wide air blast'},
]);
export function createFlightWeapons(){
 let selected='slingshot',ammo={},heat=0,locked=false,next=0;
 const reset=()=>{ammo=Object.fromEntries(WEAPONS.map(w=>[w.id,w.ammo]));heat=0;locked=false;next=0;};reset();
 return {reset,select(id){if(WEAPONS.some(w=>w.id===id))selected=id;},
  update(dt){heat=Math.max(0,heat-Math.max(0,dt)*.22);if(heat<=.15)locked=false;},
  snapshot(){return {selected,ammo:{...ammo},heat,locked};},
  cooldownRemaining(time){return Math.max(0,next-time);},
  fire(sim,aim,target,{blocked=false}={}){
   const w=WEAPONS.find(w=>w.id===selected);
   if(blocked||sim.phase!=='flight'||!sim.release||sim.time<next||ammo[w.id]<=0||(w.id==='staff'&&locked)||![...aim,...target].every(Number.isFinite))return null;
   next=sim.time+w.cooldown;ammo[w.id]--;
   if(w.id==='staff'){heat=Math.min(1,heat+.42);if(heat>=.99)locked=true;}
   const hit=Math.hypot(aim[0]-target[0],aim[1]-target[1])<=w.radius;
   if(hit){const mass=sim.shot.getMass(),v=sim.real(sim.shot),dvx=Math.max(0,Math.min(w.kick*.65,40-v.vx)),dvy=Math.max(0,Math.min(w.kick,32-v.vy));sim.shot.applyLinearImpulse(Vec2(dvx*sim.T/sim.L*mass,dvy*sim.T/sim.L*mass),sim.shot.getWorldCenter(),true);sim.elapsedSettled=0;}
   return {...w,hit,aim:[...aim],target:[...target],time:sim.time};
  }
 };
}
