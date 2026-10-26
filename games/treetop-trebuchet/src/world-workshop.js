/** Both modes share one world authority and one existing game runtime. The
 * ShadowRoot scopes the tools' IDs/CSS; it is not a second page or game. */
export function installWorldWorkshop({author=false,world,onEnterEdit,onReturnToPlay,onError=console.error,qa=false,document:documentRef=globalThis.document,window:windowRef=globalThis.window,fetch:fetchFile=globalThis.fetch,loadEditor,getDoor=()=>null,getBuild,getRigOrigin,onAdoptMap}={}){
 const navigation=documentRef.getElementById('worldModeSwitch');navigation.innerHTML='<span id="worldMapStatus">Grandfather Tree</span><button id="worldPlay" type="button" aria-pressed="true">▶ Play</button><button id="worldEdit" type="button" aria-pressed="false">✎ Edit</button>';navigation.hidden=false;
 const host=documentRef.getElementById('worldEditor'),editButton=documentRef.getElementById('worldEdit'),playButton=documentRef.getElementById('worldPlay'),label=documentRef.getElementById('worldMapStatus');
 let mode='play',editor=null,loading=null,transition=null;
 const render=()=>{navigation.hidden=mode!=='edit';host.hidden=mode!=='edit';host.inert=mode!=='edit';documentRef.body.dataset.worldMode=mode;editButton.setAttribute('aria-pressed',String(mode==='edit'));playButton.setAttribute('aria-pressed',String(mode==='play'));label.textContent=world.map.name+(world.readOnly?' · snapshot':world.dirty?' · unsaved':'');label.dataset.revision=String(world.revision);};
 async function ensureEditor(){
  if(editor)return editor;
  if(!loading)loading=(async()=>{
   if(loadEditor){editor=await loadEditor({world,onPlay:()=>setMode('play'),isActive:()=>mode==='edit',qa,getDoor,getBuild,getRigOrigin,manageLocation:false,onAdoptMap});await editor.ready;return editor;}
   const htmlUrl=new URL('editor.html',windowRef.location.href),cssUrl=new URL('editor.css?v=71',windowRef.location.href),[htmlResponse,cssResponse]=await Promise.all([fetchFile(htmlUrl),fetchFile(cssUrl)]);
   if(!htmlResponse.ok||!cssResponse.ok)throw Error('The map tools could not load. Your world and game are unchanged.');
   const [html,css]=await Promise.all([htmlResponse.text(),cssResponse.text()]),template=new DOMParser().parseFromString(html,'text/html'),shadow=host.shadowRoot??host.attachShadow({mode:'open'}),style=documentRef.createElement('style');
   style.textContent=css.replaceAll(':root',':host').replace(/\bbody\.shared\b/g,':host(.shared)').replace(/\bbody\b/g,':host')+'\n:host{position:fixed;inset:0;z-index:50;display:block}:host([hidden]){display:none!important}.inspector-bottom{padding-bottom:45px}';
   template.querySelectorAll('script,#playOverlay').forEach(n=>n.remove());shadow.replaceChildren(style,...[...template.body.childNodes].map(n=>documentRef.importNode(n,true)));
   const {mountMapEditor}=await import('./map-editor.js?v=71');
   editor=mountMapEditor({root:shadow,world,onPlay:()=>setMode('play'),isActive:()=>mode==='edit',qa,getDoor,getBuild,getRigOrigin,manageLocation:false,onAdoptMap});await editor.ready;return editor;
  })().catch(error=>{loading=null;editor=null;throw error;});
  return loading;
 }
 async function changeMode(next){
  if(next===mode)return true;
  if(next==='edit'){
   if(await onEnterEdit?.()===false)return false;
   try{await ensureEditor();}catch(error){await onReturnToPlay?.({map:world.map,revision:world.revision,aborted:true});throw error;}
   mode='edit';render();editor.enter();return true;
  }
  editor?.leave();const accepted=await onReturnToPlay?.({map:world.map,revision:world.revision});if(accepted===false){editor?.enter();return false;}
  mode='play';render();documentRef.getElementById('stage')?.focus({preventScroll:true});return true;
 }
 function setMode(next){
  if(!['play','edit'].includes(next))return Promise.resolve(false);
  if(transition)return transition;
  editButton.disabled=true;playButton.disabled=true;
  transition=changeMode(next).catch(error=>{onError(error);return false;}).finally(()=>{transition=null;editButton.disabled=false;playButton.disabled=false;render();});return transition;
 }
 editButton.onclick=()=>setMode('edit');playButton.onclick=()=>setMode('play');world.subscribe(render);render();
 const params=new URLSearchParams(windowRef.location.search);if(params.get('mode')==='edit')setMode('edit');
 return Object.freeze({setMode,syncWorld(){editor?.enter();render();},get mode(){return mode;},get editing(){return mode==='edit';}});
}
