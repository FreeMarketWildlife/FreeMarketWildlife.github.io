import {createEconomyState,validateState} from './economy.js?v=49';
const SAVE='critz-prototype-economy-v1',BACKUP='critz-prototype-economy-backup-v1',QUARANTINE='critz-prototype-economy-unreadable-v1';
function quarantine(storage,key,raw){const existing=storage.getItem(key),entries=existing===null?[]:JSON.parse(existing);if(!Array.isArray(entries)||entries.some(v=>typeof v!=='string'))throw new Error('Unreadable recovery archive');if(!entries.includes(raw))storage.setItem(key,JSON.stringify([...entries,raw]));}
const copy=s=>JSON.parse(JSON.stringify(validateState(s)));
export function sameProgress(a,b){return JSON.stringify(copy(a))===JSON.stringify(copy(b));}
export function hasProgress(s){return !sameProgress(s,createEconomyState());}
export function inspectProgressChoice(storage,current){
 if(!storage)throw new Error('Device storage unavailable');
 const raw=storage.getItem(SAVE);let previous=null;try{previous=raw===null?null:copy(JSON.parse(raw));}catch{return {previous:null,unreadable:true,conflict:true};}
 return {previous,unreadable:false,conflict:!!previous&&hasProgress(current)&&!sameProgress(current,previous)};
}
export function readProgressBackup(storage){
 const raw=storage?.getItem(BACKUP);if(raw===null||raw===undefined)return null;
 const envelope=JSON.parse(raw);if(envelope?.version!==1)throw new Error('Invalid recovery version');
 const active=copy(envelope.active),backup=copy(envelope.backup),primaryRaw=storage.getItem(SAVE);
 let primary=null;try{primary=primaryRaw===null?null:copy(JSON.parse(primaryRaw));}catch{/* Recovery candidates remain independently valid. */}
 // Show the intended saved version unless it is already primary; then show
 // the alternate. This also handles interrupted or unrelated replacements.
 return primary&&sameProgress(primary,active)?backup:active;
}
// One recovery write contains BOTH versions before replacing the primary save.
// A quota/write failure never replaces the caller's in-memory economy. Even a
// failed primary write leaves both alternatives recoverable in this envelope.
export function commitProgressChoice(storage,current,previous,choice){
 if(!storage)throw new Error('Device storage unavailable');
 if(!['current','previous'].includes(choice))throw new RangeError('Choose progress to keep');
 // Preserve exact unreadable/unsupported bytes before any explicit replacement.
 const raw=storage.getItem(SAVE);let unreadable=false;try{if(raw!==null)copy(JSON.parse(raw));}catch{unreadable=true;}
 if(unreadable)quarantine(storage,QUARANTINE,raw);
 const selected=copy(choice==='current'?current:previous),other=previous?copy(choice==='current'?previous:current):null;
 if(other&&!sameProgress(selected,other)){const prior=storage.getItem(BACKUP);if(prior!==null){let invalid=false,displaced=false;try{const e=JSON.parse(prior);if(e?.version!==1)throw new Error('version');const alternatives=[copy(e.active),copy(e.backup)];displaced=alternatives.some(v=>!sameProgress(v,selected)&&!sameProgress(v,other));}catch{invalid=true;}if(invalid)quarantine(storage,'critz-prototype-economy-unreadable-backup-v1',prior);else if(displaced)quarantine(storage,'critz-prototype-economy-displaced-backups-v1',prior);}storage.setItem(BACKUP,JSON.stringify({version:1,active:selected,backup:other}));}
 storage.setItem(SAVE,JSON.stringify(selected));return selected;
}
export function swapProgressBackup(storage,current){const backup=readProgressBackup(storage);if(!backup)throw new Error('No backup available');return commitProgressChoice(storage,current,backup,'previous');}
