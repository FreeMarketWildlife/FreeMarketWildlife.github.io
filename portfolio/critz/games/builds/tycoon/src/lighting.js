import {drawExitCue} from './passage-art.js';
import {worldHour} from './day-clock.js';
// Original Critz lighting follows the existing saved simulation clock.
// Emerald's door animation is a reference; its lighting is not being reproduced.
export const OPEN_ENTRANCES=new Set(['glass','waterworks']);
export function daylight(state){const hour=worldHour(state),h=hour%24;if(!state.dayClock)return {hour:h,strength:h<6||h>=20?0:h<8?(h-6)/2:h<=17?1:(20-h)/3};return {hour:h,strength:h<6||h>=22?0:h<8?(h-6)/2:h<=20?1:(22-h)/2};}
export function doorPresentation(scene,state){const open=OPEN_ENTRANCES.has(scene);return {open,mat:!open,beam:open?daylight(state).strength:0};}
export function drawThreshold(c,e,scene,state){const p=doorPresentation(scene,state);drawExitCue(c,e.x,e.y,{open:p.open,beam:p.beam});}

export function applyLighting(c,state,inside=false){const d=daylight(state),night=1-d.strength;c.save();c.fillStyle=inside?`rgba(26,35,66,${night*.16})`:`rgba(19,30,65,${night*.48})`;c.fillRect(0,0,c.canvas.width,c.canvas.height);if((d.hour>=18&&d.hour<22)||(d.hour>=6&&d.hour<8)){c.fillStyle='rgba(222,134,70,.10)';c.fillRect(0,0,c.canvas.width,c.canvas.height);}c.restore();return d;}

// Exterior thresholds also belong to the pavement: crossing sideways must not
// pull the player into a building. Interior exits are approached southwards.
export function approachesDoor(outside,destinationOutside,door,facing){
 if(door.entryFacing)return facing===door.entryFacing;
 if(outside&&destinationOutside&&door.id!=='yard')return true;
 if(outside)return facing==='up';
 return facing===(door.id==='stairs'&&door.y<6?'up':'down');
}
