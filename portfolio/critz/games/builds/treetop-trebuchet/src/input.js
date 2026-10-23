/** Pointer ownership only: positions are force targets for the caller, never body teleports.
 * Wire pointerdown/move/up/cancel/lostpointercapture on the surface and blur on window.
 * Optional capture/releaseCapture receive pointerId; toPoint maps client to world coordinates.
 * Tap-to-hold retains the grip after pointerup; a subsequent tap releases it.
 */
export function createGripController({onStart=()=>true,onMove=()=>{},onEnd=()=>{},toPoint=e=>({x:e.clientX,y:e.clientY}),tapHold=false,capture=()=>{},releaseCapture=()=>{}}={}){
 let owner=null,pressed=false,holding=false,lastPoint=null;
 const sticky=()=>typeof tapHold==='function'?Boolean(tapHold()):Boolean(tapHold);
 const point=e=>{const p=toPoint(e);return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?{x:p.x,y:p.y}:null;};
 function end(reason){if(!holding)return false;const id=owner;holding=false;pressed=false;owner=null;lastPoint=null;
  // Clear first: releasePointerCapture may synchronously dispatch lostpointercapture.
  try{releaseCapture(id);}finally{onEnd(reason);}return true;
 }
 return Object.freeze({
  get active(){return holding;},get pointerId(){return owner;},
  snapshot(){return {active:holding,pressed,pointerId:owner,point:lastPoint?{...lastPoint}:null};},
  pointerDown(e){
   if(pressed||e.isPrimary===false||e.button!==undefined&&e.button!==0)return false;
   if(holding){e.preventDefault?.();return end('tap-release');}
   const p=point(e);if(!p)return false;
   if(onStart(p,e)===false)return false;
   owner=e.pointerId;pressed=true;holding=true;lastPoint=p;e.preventDefault?.();
   try{capture(owner);}catch(error){end('capture-failed');throw error;}return true;
  },
  pointerMove(e){if(!holding||e.pointerId!==owner)return false;const p=point(e);if(!p)return false;lastPoint=p;e.preventDefault?.();onMove(p,e);return true;},
  pointerUp(e){if(!holding||!pressed||e.pointerId!==owner)return false;
   // Deliver final target, but do not derive or inject any pointer velocity.
   const p=point(e);if(p){lastPoint=p;onMove(p,e);}pressed=false;e.preventDefault?.();
   if(!sticky())return end('pointerup');
   try{releaseCapture(owner);}catch(error){end('capture-failed');throw error;}return true;
  },
  pointerCancel(e){return holding&&e.pointerId===owner?end('pointercancel'):false;},
  lostPointerCapture(e){return holding&&pressed&&e.pointerId===owner?end('lostpointercapture'):false;},
  blur(){return end('blur');},
  reset(){return end('reset');},
  dispose(){return end('dispose');}
 });
}

// Arrow keys belong to form controls while editing; a focused launch button still
// permits flight steering after activation. Never intercept browser shortcuts.
export function isFlightControlKey(event){
 if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.altKey||event.ctrlKey||event.metaKey)return false;
 const target=event.target;return !target?.isContentEditable&&!['INPUT','SELECT','TEXTAREA'].includes(target?.tagName?.toUpperCase());
}
