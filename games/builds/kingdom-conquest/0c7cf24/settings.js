/* Optional presentation layer for ten.html. Never changes simulation timing or rules. */
(() => {
 'use strict';
 const storageKey='kingdom-conquest.settings.v1';
 const defaults={quality:matchMedia('(max-width:760px)').matches?'low':'balanced',volume:50,muted:false,reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches,contrast:false,stats:false};
 const sanitize=value=>({quality:['low','balanced','high'].includes(value?.quality)?value.quality:defaults.quality,volume:Number.isFinite(value?.volume)?Math.max(0,Math.min(100,value.volume)):defaults.volume,...Object.fromEntries(['muted','reducedMotion','contrast','stats'].map(k=>[k,typeof value?.[k]==='boolean'?value[k]:defaults[k]]))});
 let state;try{state=sanitize(JSON.parse(localStorage.getItem(storageKey)))}catch{state={...defaults}}
 const dialog=document.getElementById('settings-dialog');
 const fields={quality:document.getElementById('setting-quality'),volume:document.getElementById('setting-volume'),muted:document.getElementById('setting-muted'),reducedMotion:document.getElementById('setting-motion'),contrast:document.getElementById('setting-contrast'),stats:document.getElementById('setting-stats')};
 const descriptions={low:'Low: 1× pixel ratio for lower GPU load. All gameplay and characters remain available.',balanced:'Balanced: up to 1.5× pixel ratio for the 3D layer.',high:'High: up to 2× pixel ratio for a sharper 3D layer. Uses more GPU work.'};
 let appliedRenderer=null,appliedPreset=null;
 function applyRenderer(){const api=window.Minion3D;if(api?.setQuality&&(api!==appliedRenderer||appliedPreset!==state.quality)){api.setQuality(state.quality);appliedRenderer=api;appliedPreset=state.quality}}
 function apply(persist=true){
  for(const [key,field] of Object.entries(fields)){if(field.type==='checkbox')field.checked=state[key];else field.value=state[key]}
  document.getElementById('volume-value').textContent=state.volume+'%';
  document.getElementById('quality-description').textContent=descriptions[state.quality];
  document.body.classList.toggle('hud-contrast',state.contrast);
  document.getElementById('render-stats').hidden=!state.stats;
  applyRenderer();
  if(persist)try{localStorage.setItem(storageKey,JSON.stringify(state))}catch{}
  window.dispatchEvent(new CustomEvent('kingdom-settings-change',{detail:{...state}}));
 }
 for(const [key,field] of Object.entries(fields))field.addEventListener(field.type==='range'?'input':'change',()=>{state[key]=field.type==='checkbox'?field.checked:key==='volume'?Number(field.value):field.value;apply()});
 document.getElementById('online-open').addEventListener('click',()=>{document.body.classList.add('roster-open');document.getElementById('network-panel').scrollIntoView({block:'start',behavior:'instant'})});
 document.getElementById('settings-open').addEventListener('click',()=>{keys.clear();attackMove=false;dialog.showModal()});
 document.getElementById('settings-defaults').addEventListener('click',()=>{state={...defaults};apply()});
 document.getElementById('roster-close').addEventListener('click',()=>{document.body.classList.remove('roster-open');document.getElementById('choose').focus()});
 // The existing global game listener must not cast or move while typing in lobby/settings.
 window.addEventListener('keydown',e=>{if(dialog.open||e.target?.matches('input,select,textarea,[contenteditable=true]')){keys.clear();e.stopImmediatePropagation();return}if(e.key==='Escape'){document.body.classList.remove('roster-open');closeShop();keys.clear()}},true);
 const labelRoster=()=>document.querySelectorAll('#roster .pick').forEach(button=>button.setAttribute('aria-pressed',String(button.classList.contains('active'))));
 const previousRoster=renderRoster;
 renderRoster=function(){previousRoster();labelRoster()};
 labelRoster();
 const previousTone=tone;
 tone=function(freq,duration=.08,type='sine',gain=.03){if(!state.muted&&state.volume>0)previousTone(freq,duration,type,gain*state.volume/100)};
 const previousBurst=burst;
 burst=function(x,y,color,count=10){if(!state.reducedMotion)previousBurst(x,y,color,state.quality==='low'?Math.min(count,5):count)};
 let resultState=null;
 const result=document.getElementById('battle-result');
 function syncResult(){
  const online=!!window.KingdomNetwork?.active,key=String(winner)+':'+online;
  if(key===resultState)return;resultState=key;result.hidden=winner===null;
  if(winner===null)return;
  document.getElementById('battle-result-title').textContent=`${winner===0?'Verdant':'Crimson'} Kingdom victorious`;
  document.getElementById('battle-result-message').textContent=online?'This match is complete. Leave this room, then create or join another room for a rematch. Empty slots can use bots.':'The enemy Castle has fallen. Start a new battle to conquer again.';
  document.getElementById('result-new').hidden=online;
  document.getElementById('result-room').hidden=!online;
  document.getElementById('result-leave').hidden=!online;
 }
 document.getElementById('result-new').addEventListener('click',()=>{if(!window.KingdomNetwork?.active){init();syncResult()}});
 document.getElementById('result-room').addEventListener('click',()=>{document.body.classList.add('roster-open');document.getElementById('network-panel').scrollIntoView({block:'start',behavior:'instant'})});
 document.getElementById('result-leave').addEventListener('click',()=>{window.KingdomNetwork?.leave();syncResult()});
 const previousDraw=draw;
 draw=function(){syncResult();if(state.reducedMotion)shake=0;previousDraw()};
 let samples=0,previousTime=performance.now(),lastTime=previousTime,total=0;
 function sample(now){applyRenderer();const elapsed=now-previousTime;previousTime=now;if(!document.hidden&&elapsed>0&&elapsed<1000){samples++;total+=elapsed}if(now-lastTime>=1000){if(state.stats){const api=window.Minion3D;document.getElementById('render-stats').textContent=`${samples?Math.round(samples*1000/total):0} FPS · ${state.quality} · ${api?.drawCalls??0} 3D draws · ${api?.triangles??0} triangles`}samples=0;total=0;lastTime=now}requestAnimationFrame(sample)}
 window.KingdomSettings={get:()=>({...state}),set:patch=>{state=sanitize({...state,...patch});apply()},reset:()=>{state={...defaults};apply()}};
 apply(false);requestAnimationFrame(sample);
})();
