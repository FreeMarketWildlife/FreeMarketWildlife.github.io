import {validateState} from './economy.js?v=71';
import {inspectProgressChoice,commitProgressChoice,swapProgressBackup} from './progress-choice.js?v=71';
export const PROGRESS_KEY='critz-prototype-economy-v1';
const REVISION='critz-prototype-progress-revision-v1';
const LOCK='critz-prototype-progress-write-v1';
export class ProgressConflict extends Error {constructor(){super('Saved progress changed in another tab. Choose which version to keep.');this.name='ProgressConflict';}}
// All browser writers share this origin-scoped exclusive Web Lock. There is no
// unsafe localStorage spin-lock fallback: unsupported environments keep playing
// in memory. Raw comparisons protect choices made before another tab saved.
export function createProgressCoordinator(storage,locks){
 const read=()=>{if(!storage)throw new Error('Device storage unavailable');return {raw:storage.getItem(PROGRESS_KEY),revision:storage.getItem(REVISION)};};
 let observed=storage?read():{raw:null,revision:null};
 const equal=(a,b)=>a.raw===b.raw&&a.revision===b.revision;
 async function locked(expected,action,guard=()=>true){
  if(!locks?.request)throw new Error('Safe saving is unavailable in this browser.');
  return locks.request(LOCK,{mode:'exclusive'},()=>{if(!guard()||!equal(read(),expected))throw new ProgressConflict();storage.setItem(REVISION,crypto.randomUUID());const result=action();observed=read();return result;});
 }
 return {
  load:()=>observed.raw===null?null:validateState(JSON.parse(observed.raw)),
  changed:()=>!equal(read(),observed),
  inspect(current){const raw=read();return {...inspectProgressChoice(storage,current),raw};},
  save(current,guard){const snapshot=JSON.stringify(validateState(current));return locked(observed,()=>{storage.setItem(PROGRESS_KEY,snapshot);return true;},guard);},
  choose(current,choice,expected,guard){return locked(expected,()=>{const {previous}=inspectProgressChoice(storage,current);return commitProgressChoice(storage,current,previous,choice);},guard);},
  restore(current,expected,guard){return locked(expected,()=>swapProgressBackup(storage,current),guard);}
 };
}
