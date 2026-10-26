import {validateGroveMap,createV4Revision11GroveMap} from './grove-map.js?v=70';
const MAX_JSON=2000000,MAX_LINK=140000;
async function bytesFromStream(stream,max=MAX_JSON){const reader=stream.getReader(),chunks=[];let length=0;try{while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>max)throw Error('Map is too large. Use a smaller map or JSON export.');chunks.push(value);}}finally{reader.releaseLock();}const result=new Uint8Array(length);let cursor=0;for(const c of chunks){result.set(c,cursor);cursor+=c.length;}return result;}
function base64(bytes){let string='';for(let i=0;i<bytes.length;i+=4096)string+=String.fromCharCode(...bytes.subarray(i,i+4096));return btoa(string).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
// Reference the retained starter losslessly instead of repeating thousands of
// unchanged curved-branch vertices. Old full-map j1/g1 links remain readable.
function sharePayload(map){
 const valid=validateGroveMap(map),base=validateGroveMap(createV4Revision11GroveMap()),byId=new Map(base.objects.map(o=>[o.id,JSON.stringify(o)]));
 const changed=valid.objects.filter(o=>JSON.stringify(o)!==byId.get(o.id)),{objects,...header}=valid;
 const full=JSON.stringify(valid),delta=JSON.stringify({$base:11,map:header,order:objects.map(o=>o.id),changed});
 return delta.length<full.length?delta:full;
}
function restorePayload(payload){
 if(payload?.$base===undefined)return validateGroveMap(payload);
 if(payload.$base!==11||!Array.isArray(payload.order)||!Array.isArray(payload.changed)||payload.order.length>4000||payload.changed.length>4000)throw Error('Invalid shared map base.');
 const byId=new Map(validateGroveMap(createV4Revision11GroveMap()).objects.map(o=>[o.id,o]));
 for(const o of payload.changed){if(!o||typeof o.id!=='string')throw Error('Invalid shared map object.');byId.set(o.id,o);}
 const objects=payload.order.map(id=>{if(typeof id!=='string'||!byId.has(id))throw Error('Missing shared map object.');return byId.get(id);});
 return validateGroveMap({...payload.map,objects});
}
export async function encodeMapLink(map){let bytes=new TextEncoder().encode(sharePayload(map));if(bytes.length>MAX_JSON)throw Error('Map is too large to share.');let prefix='j1.';if(typeof CompressionStream!=='undefined'){bytes=await bytesFromStream(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')));prefix='g1.';}const token=prefix+base64(bytes);if(token.length>MAX_LINK)throw Error('This map is too detailed for a portable link. Export JSON instead.');return token;}
export async function decodeMapLink(token){if(typeof token!=='string'||token.length>MAX_LINK||!/^([gj]1)\.[A-Za-z0-9_-]+$/.test(token))throw Error('Invalid or oversized shared map link.');const raw=atob(token.slice(3).replaceAll('-','+').replaceAll('_','/'));let bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));if(token.startsWith('g1.')){if(typeof DecompressionStream==='undefined')throw Error('This browser cannot open compressed links. Ask for a JSON export.');bytes=await bytesFromStream(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')));}if(bytes.length>MAX_JSON)throw Error('Shared map exceeds the size limit.');return restorePayload(JSON.parse(new TextDecoder().decode(bytes)));}
