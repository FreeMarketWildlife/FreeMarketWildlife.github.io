(function(root){
 'use strict';
 const FPS=24,mod=(v,n)=>(v%n+n)%n;
 // Seconds only enter here. Every character cel is selected on the same 24 Hz timebase.
 function tickAt(seconds){return Math.max(0,Math.floor(Math.max(0,Number.isFinite(seconds)?seconds:0)*FPS+1e-8));}
 function tickCount(action){return action.totalTicks||action.exposureTicks.reduce((a,b)=>a+b,0);}
 function duration(action){return action?tickCount(action)/FPS:0;}
 function frameAtTick(action,tick){const holds=action.exposureTicks;if(!holds||action.fps!==FPS)throw Error('Character animation must use a 24 fps exposure sheet');const total=tickCount(action);let left=action.loop===false?Math.min(Math.max(0,tick),total-1):mod(Math.max(0,tick),total),at=0;while(at<holds.length-1&&left>=holds[at])left-=holds[at++];return at;}
 function frameAt(action,seconds){return frameAtTick(action,tickAt(seconds));}
 function celStartTick(action,index){return action.exposureTicks.slice(0,index).reduce((a,b)=>a+b,0);}
 function drawCel(ctx,manifest,images,who,state,time,x,y,options={}){
  const actor=manifest.characters[who];if(!actor)return null;
  const action=actor.actions[state]||actor.actions.idle,index=options.frame??frameAt(action,time),f=action.frames[mod(index,action.frames.length)],im=images.get?images.get(f.atlas||action.atlas):images[f.atlas||action.atlas];if(!im)return null;
  const s=manifest.runtimeScale*(options.scale||1);ctx.save();ctx.imageSmoothingEnabled=true;ctx.globalAlpha*=options.alpha??1;ctx.translate(x,y);ctx.scale((options.facing||1)*s,s);ctx.drawImage(im,f.x,f.y,f.w,f.h,-f.anchorX,-f.anchorY,f.w,f.h);ctx.restore();return {action,index,frame:f,tick:tickAt(time)};
 }
 function validateManifest(manifest){
  if(manifest.animationFps!==FPS||manifest.runtimeScale!==1/12)throw Error('Character cels require fixed 24 fps and 1/12 scale');
  if(!manifest.characters||!Object.keys(manifest.characters).length)throw Error('Animation manifest has no characters');
  for(const [who,actor]of Object.entries(manifest.characters)){
   if(!actor?.actions?.idle)throw Error('Animation character requires an idle fallback: '+who);
   for(const [state,a]of Object.entries(actor.actions)){
    if(a.fps!==FPS||!Array.isArray(a.frames)||!a.frames.length||!Array.isArray(a.exposureTicks)||a.frames.length!==a.exposureTicks.length||!a.exposureTicks.every(t=>Number.isInteger(t)&&t>0)||a.totalTicks!==a.exposureTicks.reduce((n,t)=>n+t,0))throw Error('Invalid 24 fps exposure sheet: '+who+'/'+state);
   }
  }
  return manifest;
 }
 const api={FPS,tickAt,tickCount,duration,frameAtTick,celStartTick,frameAt,drawCel,validateManifest,manifest:null,images:new Map()};
 // Capture the script URL while it is available; asynchronous callers have no currentScript.
 const scriptBase=typeof document!=='undefined'&&document.currentScript?.src?new URL('.',document.currentScript.src).href:null;
 let loading=null;
 api.load=function(base=scriptBase||new URL('.',location.href).href){
  if(api.manifest)return Promise.resolve(api.manifest);
  if(loading)return loading;
  loading=(async()=>{
   const manifest=validateManifest(await fetch(new URL('manifest.json',base),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Animation manifest '+r.status);return r.json();}));
   const urls=new Set(Object.values(manifest.characters).flatMap(c=>Object.values(c.actions).flatMap(a=>[a.atlas,...a.frames.map(f=>f.atlas).filter(Boolean)].filter(Boolean))));
   const images=new Map();
   // Drain every image callback before releasing a failed attempt for retry.
   const loads=await Promise.allSettled([...urls].map(url=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images.set(url,im);resolve();};im.onerror=()=>reject(Error('Cannot load '+url));im.src=new URL(url,base).href;})));
   const failed=loads.find(result=>result.status==='rejected');if(failed)throw failed.reason;
   // Publish a complete library together. A failed attempt cannot leak partial atlases.
   api.images=images;api.manifest=manifest;return manifest;
  })().finally(()=>{loading=null;});
  return loading;
 };
 api.draw=(ctx,who,state,time,x,y,options)=>api.manifest?drawCel(ctx,api.manifest,api.images,who,state,time,x,y,options):null;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DrawnArt=api;
})(typeof window!=='undefined'?window:globalThis);
