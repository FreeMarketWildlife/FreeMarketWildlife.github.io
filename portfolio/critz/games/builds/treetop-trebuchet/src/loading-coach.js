import {world as layout} from './world.js?v=49';
/** Observes real contact/motion; never changes a pose or imposes a settling timer. */
export function createLoadingCoach(){let touched=false;return {update(scene,{fraction=.6,held=false}={}){
 if(scene.phase==='wind-stalled')return {reason:'The motor did not reach its target. Retry this volunteer at medium winding or adjust hardware.',retry:true};
 if(scene.phase!=='loading')return {reason:'',retry:false};
 const q=scene.loadingStatus(),c=scene.center(),cup=scene.pouch.getPosition();touched ||=q.contacting;
 if(scene.hardwareHasEscaped?.())return {reason:'The release bead has left its rail while loading. Retry this volunteer; compare rail or sling settings.',retry:true};
 if(!held&&!(q.contacting&&q.withinEnvelope)&&c.y<layout.surfaces.find(s=>s.id==='launch branch').y-.8)return {reason:'The volunteer fell below the launch branch. Retry this volunteer at medium winding.',retry:true};
 if(!held&&Math.hypot(c.x-cup.x,c.y-cup.y)>8)return {reason:'The volunteer is far from the cradle. Retry this volunteer at medium winding.',retry:true};
 if(!held&&!q.withinEnvelope&&(scene.pouchOpening?.()??0)>Math.PI/2)return {reason:'The cradle has folded open. Retry this volunteer at medium winding, or adjust the hardware before loading again.',retry:true};
 if(held)return {reason:scene.forceCapped?'Grip force cap reached. Lift beside the cradle first; move across above it, then release.':'Lift up beside the cradle, move across above it, wait for the volunteer to catch up, then release.',retry:false};
 if(touched&&!q.contacting&&(c.y<cup.y-.5||Math.abs(c.x-cup.x)>1.4))return {reason:`Contact was lost; the volunteer is ${c.y<cup.y-.5?'below':'beside'} the cradle. Re-grip from the branch or retry at medium winding.`,retry:true};
 if(q.contacting&&q.withinEnvelope)return {reason:q.relativeSpeed>.35||q.maxPartRelativeSpeed>.35?`Contact ready, but the load is moving (${Math.max(q.relativeSpeed,q.maxPartRelativeSpeed).toFixed(1)} m/s relative). Unlatch is available; waiting changes the shot.`:'Contact ready. Unlatch when you want to test this pose.',retry:false};
 if(q.contacting)return {reason:'A body part touched the cradle, but the load is off-center. Re-grip and center the volunteer before unlatching.',retry:true};
 if(!q.withinEnvelope&&c.y<cup.y-.5)return {reason:'The volunteer is below the cradle. Re-grip from the branch or retry at medium winding.',retry:true};
 if(q.withinEnvelope)return {reason:'Near the cradle, without supporting contact. Let gravity lower the volunteer into it.',retry:false};
 if(fraction<.3)return {reason:`Low winding; cradle moving ${q.cradleSpeed.toFixed(1)} m/s. Lift beside it first, then across above its center. A brief contact window may be usable; medium winding is easier to retry.`,retry:true};
 return {reason:'Lift up beside the green cradle first, then move across above it and release gently.',retry:false};
 }};}
