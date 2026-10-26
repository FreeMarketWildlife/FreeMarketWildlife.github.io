// Shared rendering preference; independent of all gameplay saves.
export const RENDER_SETTINGS_KEY='critz.render-settings.v1';
export function readRenderSettings(storage){try{return {shadows:JSON.parse(storage.getItem(RENDER_SETTINGS_KEY))?.shadows!==false};}catch{return {shadows:true};}}
export function saveRenderSettings(storage,settings){storage.setItem(RENDER_SETTINGS_KEY,JSON.stringify({shadows:settings.shadows!==false}));}
