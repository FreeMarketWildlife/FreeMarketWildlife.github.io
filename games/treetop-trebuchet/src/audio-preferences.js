const KEY='critz-prototype-audio-v1';
export const DEFAULT_AUDIO=Object.freeze({muted:false,volume:.35});
function valid(s){return s&&typeof s.muted==='boolean'&&Number.isFinite(s.volume)&&s.volume>=0&&s.volume<=1;}
// Preferences are separate from opt-in game progress. Writes happen only after a
// user changes mute/volume. Unavailable/corrupt device storage never blocks play.
export function loadAudioPreferences(storage){try{const s=JSON.parse(storage?.getItem(KEY)??'null');return valid(s)?{muted:s.muted,volume:s.volume}:{...DEFAULT_AUDIO};}catch{return {...DEFAULT_AUDIO};}}
export function saveAudioPreferences(storage,s){if(!valid(s))throw new Error('Invalid audio preferences');try{if(!storage)return false;storage.setItem(KEY,JSON.stringify({muted:s.muted,volume:s.volume}));return true;}catch{return false;}}
