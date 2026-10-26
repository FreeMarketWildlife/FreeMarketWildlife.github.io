import {MAP_KEY,createGroveMap,readGroveMap,validateGroveMap} from './grove-map.js?v=70';
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
export class WorldMapConflictError extends Error{
 constructor(){super('The saved map changed in another tab. Your edits remain here; export a backup before reloading the saved map.');this.name='WorldMapConflictError';}
}
/** One current world for both tools and play. Startup reads once and never
 * writes/migrates stored bytes. Editor transactions replace this authority;
 * a running throw is rebuilt by the app only when switching back to Play. */
export function createWorldSession({storage,map}={}){
 let observedRaw=null;try{observedRaw=storage?.getItem(MAP_KEY)??null;}catch{}
 let current=freeze(validateGroveMap(map??readGroveMap({getItem:()=>observedRaw})??createGroveMap())),serial=JSON.stringify(current),revision=0,readOnly=false,dirty=false;
 const officialSerial=JSON.stringify(validateGroveMap(createGroveMap()));
 const listeners=new Set(),notify=()=>{for(const fn of listeners)fn({map:current,revision,readOnly,dirty});};
 return Object.freeze({
  get map(){return current;},get rewardEligible(){return !readOnly&&serial===officialSerial;},get revision(){return revision;},get readOnly(){return readOnly;},get dirty(){return dirty;},
  replace(value,{readOnly:nextReadOnly=readOnly,dirty:nextDirty=true}={}){
   const next=validateGroveMap(value),nextSerial=JSON.stringify(next),changed=serial!==nextSerial;
   if(changed){current=freeze(next);serial=nextSerial;revision++;}
   const metadata=readOnly!==!!nextReadOnly||dirty!==!!nextDirty;readOnly=!!nextReadOnly;dirty=!!nextDirty;
   if(changed||metadata)notify();return current;
  },
  save(){
   if(readOnly)throw Error('Shared snapshot: choose Edit a copy before saving.');
   if(!storage)throw Error('Map storage is unavailable. Export a backup to keep your edits.');
   if((storage.getItem(MAP_KEY)??null)!==observedRaw)throw new WorldMapConflictError();
   storage.setItem(MAP_KEY,serial);observedRaw=serial;dirty=false;notify();return current;
  },
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
 });
}
