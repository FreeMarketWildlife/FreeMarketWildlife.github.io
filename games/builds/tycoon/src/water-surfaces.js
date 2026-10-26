import {TICK_SECONDS} from './movement.js';
// Review terrain metadata: depth, motion and reflection identity are independent.
export const WATER_TYPES=['still','shallow-still','moving','shallow-moving'];
export const WATER_NAMES=['Still Water','Shallow Still Water','Moving Water','Shallow Moving Water'];
export const GROUNDS=['grass','path','soil','paving','cliff'];
export const surface=(type,identity='fresh')=>({type,identity,shallow:type.startsWith('shallow'),moving:type.endsWith('moving'),reflective:identity==='fresh'});
export const footstepRipples=s=>!!s?.shallow&&!s.moving;
export function canonicalMask(m){if((m&3)!==3)m&=~16;if((m&6)!==6)m&=~32;if((m&12)!==12)m&=~64;if((m&9)!==9)m&=~128;return m;}
export const WATER_MASKS=[...new Set(Array.from({length:256},(_,m)=>canonicalMask(m)))];
export function waterPixel(x,y,m){const east=x>=16,south=y>=16,dx=east?31-x:x,dy=south?31-y:y;
 const vx=!!(m&(east?2:8)),vy=!!(m&(south?4:1)),diag=!!(m&(south?(east?32:64):(east?16:128)));
 if(!vx&&!vy)return dx>=5&&dy>=5&&(dx>=11||dy>=11||(dx-11)**2+(dy-11)**2<=36);
 if(!vx)return dx>=5;if(!vy)return dy>=5;if(!diag&&dx<5&&dy<5)return dx*dx+dy*dy>=25;return true;}
export function neighborMask(x,y,match){return canonicalMask([[0,-1,1],[1,0,2],[0,1,4],[-1,0,8],[1,-1,16],[1,1,32],[-1,1,64],[-1,-1,128]].reduce((m,[dx,dy,b])=>m|(match(x+dx,y+dy)?b:0),0));}
// Emerald's ripple animation command sequence; original Critz ring pixels.
export const RIPPLE_SEQUENCE=[[0,12],[1,9],[2,9],[3,9],[0,9],[1,9],[2,11],[4,11]];
export const RIPPLE_SECONDS=79*TICK_SECONDS;
export function ripplePose(age){if(age<0||age>=RIPPLE_SECONDS)return null;let tick=Math.floor(age/TICK_SECONDS),frame=0;for(const [f,d] of RIPPLE_SEQUENCE){frame=f;if(tick<d)break;tick-=d;}return {frame,rx:4+frame*3,ry:2+frame*2,alpha:.9-age/RIPPLE_SECONDS*.45};}
