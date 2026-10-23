/** After a lost loading gesture, reveal the canvas after responsive layout.
 * Grip release remains the caller's responsibility; no body state is changed. */
export function createViewRecovery({now=()=>performance.now(),schedule=fn=>requestAnimationFrame(fn),reveal=()=>{}}={}){
 let interruptedAt=-Infinity,pending=null,revision=0;
 return {ended(reason){if(['pointercancel','lostpointercapture','blur'].includes(reason))interruptedAt=now();},
 resize(active){if(!active&&now()-interruptedAt>=300)return false;interruptedAt=-Infinity;if(pending===null){const token=++revision;pending=token;schedule(()=>{if(pending!==token)return;pending=null;reveal();});}return true;},
 reset(){interruptedAt=-Infinity;pending=null;revision++;}
 };
}
