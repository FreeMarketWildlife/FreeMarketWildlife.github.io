import {drawLimit,REST_ARM_ANGLE} from './build-catalog.js?v=66';
// Arcade preparation balance, separate from bearing friction and launch energy.
export const BEARING_WINDING_SECONDS=Object.freeze({woodAxle:3.6,bronze:3,bearings:2.4,precision:2});
export const LOADING_LINEAR_DAMPING=2;
export const LOADED_DESCENT_SPEED=2.5;
/** A loaded bowl must not outrun its freely falling passenger. This conservative
 * angular bound keeps downward tip speed below2.5m/s; a one-second startup ramp
 * is used only when large geometry exceeds the ordinary bearing pace. Contact
 * remains observed, never enforced, and a partial stop may still need settling. */
export function windingMotion(build,{loaded=true}={}){
 if(!loaded)return{minimumSeconds:1.65,rampSeconds:0,travelLimited:false};
 const rated=BEARING_WINDING_SECONDS[build.bearing];if(!Number.isFinite(rated))throw Error('Unknown winding bearing.');
 const span=Math.PI+drawLimit(build)*Math.PI/180-REST_ARM_ANGLE;
 const travel=Number.isFinite(span*build.longArm)?Math.max(0,span*build.longArm/LOADED_DESCENT_SPEED):0;
 const travelLimited=travel>rated;
 return{minimumSeconds:Math.max(rated,travel),rampSeconds:travelLimited?1:0,travelLimited};
}
export function windingMinimum(build,options){return windingMotion(build,options).minimumSeconds;}
