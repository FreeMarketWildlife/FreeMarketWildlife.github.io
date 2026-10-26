const KEY='critz-prototype-progress-enabled';
// Remember only an explicit checkbox choice. Saved progress is not read until this
// flag is enabled; opting out retains the recoverable save but stops automatic use.
export function loadProgressConsent(storage){try{return storage?.getItem(KEY)==='1';}catch{return false;}}
export function saveProgressConsent(storage,enabled){try{if(!storage)return false;storage.setItem(KEY,enabled?'1':'0');return true;}catch{return false;}}
