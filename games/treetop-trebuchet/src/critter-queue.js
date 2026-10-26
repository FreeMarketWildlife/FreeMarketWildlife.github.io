import {availableCritters} from './critter-door.js?v=71';
import {buildFacts,critter} from './build-catalog.js?v=71';
/** Door size is an invitation; the fitted machine must also carry its visitor.
 * Preview is a durable promise, advanced only after a collected Adventure run.
 * Build changes may reconcile a promise that has become unsafe. */
export function eligibleVisitors(state,build=state.build){return availableCritters(state).filter(id=>!buildFacts({...build,animal:id}).warnings.length);}
const step=seed=>(Math.imul(seed>>>0,1664525)+1013904223)>>>0;
function pick(pool,seed){const next=step(seed);return{id:pool[Math.floor(next/4294967296*pool.length)],seed:next};}
export function validateQueue(queue,launches){
 if(queue==null)return null;
 if(!Number.isInteger(queue.seed)||queue.seed<0||queue.seed>4294967295||!Number.isSafeInteger(queue.round)||queue.round<0||queue.round>launches)throw Error('Invalid creature queue.');
 critter(queue.current);critter(queue.next);return{current:queue.current,next:queue.next,seed:queue.seed,round:queue.round};
}
export function reconcileQueue(state,{seed=0x74726565,advance=false}={}){
 const pool=eligibleVisitors(state);if(!pool.length)return{...state,creatureQueue:null};
 const old=state.creatureQueue;
 if(old&&(!Number.isInteger(old.seed)||old.seed<0||old.seed>4294967295||!Number.isSafeInteger(old.round)||old.round<0||old.round>state.launches))throw Error('Invalid creature queue.');
 if(old){critter(old.current);critter(old.next);}
 let random=old?.seed??seed>>>0,current=old?.current??state.build.animal,next=old?.next;
 if(advance&&old&&old.round<state.launches)current=old.next;
 if(!pool.includes(current)){const chosen=pick(pool,random);current=chosen.id;random=chosen.seed;}
 if(!next||!pool.includes(next)||advance&&old&&old.round<state.launches){const chosen=pick(pool,random);next=chosen.id;random=chosen.seed;}
 return{...state,build:{...state.build,animal:current},creatureQueue:{current,next,seed:random,round:state.launches}};
}
