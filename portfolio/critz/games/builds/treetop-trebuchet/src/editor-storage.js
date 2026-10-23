/** QA maps survive a tab reload without reading or replacing personal maps. */
export function editorMapStorage(local,session,{qa=false}={}){
 if(!qa)return local;
 const prefix='treetop-editor-qa:';
 return{getItem:key=>session.getItem(prefix+key),setItem:(key,value)=>session.setItem(prefix+key,value),removeItem:key=>session.removeItem(prefix+key)};
}
