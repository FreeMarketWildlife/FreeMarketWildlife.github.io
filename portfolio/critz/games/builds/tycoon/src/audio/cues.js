import {worldHour} from '../day-clock.js';
// IDs belong to the canonical asset manifest, never to song filenames or save data.
export const SCENE_CUES=Object.freeze({bedroom:2,house:2,yard:19,town:5,forest:6,liarsville:23,waterworks:25,kaidHome:4,rivalHome:10,critz:3,vet:19,pharmacy:18,bike:24,glass:9});
export function chooseCue({scene,stage,storyBeat,time=8,dayClock},panel='',origin=''){
 if(['title','setup','confirm-new','asset-error'].includes(panel)||(panel==='options'&&origin==='title'))return 1;
 if(stage==='night')return storyBeat==='kaid'||panel==='loan'?4:['broken','mom'].includes(storyBeat)?11:21;
 if(['tank','manage','stats','view','capture'].includes(panel))return 20;
 if(panel==='collection')return 7;if(panel==='critter')return 22;
 const hour=worldHour({stage,time,dayClock})%24;
 if(hour<6||hour>=20){if(['bedroom','house','yard'].includes(scene))return 21;if(scene==='town')return 28;if(scene==='forest')return 29;if(scene==='liarsville')return 27;}
 return SCENE_CUES[scene]||1;
}
export const AUDIO_SETTINGS_KEY='critz-tycoon.audio.v1';
export function readAudioSettings(storage){let v={};try{v=JSON.parse(storage.getItem(AUDIO_SETTINGS_KEY)||'{}')||{};}catch{}return {enabled:typeof v.enabled==='boolean'?v.enabled:true,volume:typeof v.volume==='number'&&Number.isFinite(v.volume)?Math.max(0,Math.min(1,v.volume)):.4};}
export function writeAudioSettings(storage,v){try{storage.setItem(AUDIO_SETTINGS_KEY,JSON.stringify({enabled:!!v.enabled,volume:Math.max(0,Math.min(1,v.volume))}));return true;}catch{return false;}}
