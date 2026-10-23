// Transient acting only. No saved positions, story fields or source sprite edits.
import {TICK_SECONDS} from './movement.js';
const runtimes=new WeakMap();
export const PATROLS={
 'town:nugget':[[0,0],[1,0],[1,1],[0,1]],
 'town:kaid':[[0,0],[1,0],[2,0],[1,0]],
 'town:rival':[[0,0],[1,0],[2,0],[1,0]],
 'house:mom':[[0,0],[0,1],[-1,1],[-1,0]],
 'kaidHome:kaid':[[0,0],[0,1],[-1,1],[-1,0]],
};
function runtime(state){let r=runtimes.get(state);if(!r||r.scene!==state.scene){r={scene:state.scene,actors:new Map(),accumulator:0,time:0,cues:new Map(),speaker:null,calm:false};runtimes.set(state,r);}return r;}
export function initializeActors(state,entities){const r=runtime(state);for(const e of entities)if(e.type==='npc'&&!r.actors.has(e.id))r.actors.set(e.id,{id:e.id,x:e.x,y:e.y,homeX:e.x,homeY:e.y,facing:'down',path:PATROLS[`${state.scene}:${e.id}`]||null,point:0,wait:120+(e.x*7+e.y*11)%100,step:null,stride:0,look:0});for(const a of r.actors.values())if(a.path&&!a.step&&a.x===state.player.x&&a.y===state.player.y){const point=a.path.findIndex(([x,y])=>a.homeX+x!==state.player.x||a.homeY+y!==state.player.y);if(point>=0){a.point=point;a.x=a.homeX+a.path[point][0];a.y=a.homeY+a.path[point][1];}}return r;}
export function actorEntity(state,e){const a=runtimes.get(state)?.scene===state.scene?runtimes.get(state)?.actors.get(e.id):null;return a?{...e,x:a.x,y:a.y,collision:[a.x,a.y,1,1],reserved:a.step?[a.step.x,a.step.y]:null}:e;}
export function actorBlocks(state,scene,x,y){const r=runtimes.get(state);return r?.scene===scene&&[...r.actors.values()].some(a=>(a.x===x&&a.y===y)||(a.step?.x===x&&a.step?.y===y));}
export function updateActors(state,dt,{paused=false,canEnter,playerDestination=null,calm=false}={}){
 const r=runtime(state);r.time+=Math.min(.1,Math.max(0,dt));r.calm=calm;
 if(paused){r.accumulator=0;return;}
 r.accumulator+=Math.min(dt,8*TICK_SECONDS);
 while(r.accumulator+1e-9>=TICK_SECONDS){r.accumulator-=TICK_SECONDS;for(const a of r.actors.values()){
  if(a.step){a.step.tick++;if(a.step.tick===16){a.x=a.step.x;a.y=a.step.y;a.step=null;a.stride^=1;a.wait=90+(a.point%3)*40;}continue;}
  const near=Math.abs(a.x-state.player.x)+Math.abs(a.y-state.player.y)<=2;
  if(near||r.speaker===a.id)continue;
  if(--a.wait>0)continue;
  if(!a.path){a.facing=['down','left','down','right'][a.look++%4];a.wait=180;continue;}
  const point=(a.point+1)%a.path.length,[dx,dy]=a.path[point],x=a.homeX+dx,y=a.homeY+dy;
  const direction=x>a.x?'right':x<a.x?'left':y>a.y?'down':'up';a.facing=direction;
  const occupied=[...r.actors.values()].some(b=>b!==a&&((b.x===x&&b.y===y)||(b.step?.x===x&&b.step?.y===y)));
  if(Math.abs(x-a.x)+Math.abs(y-a.y)!==1||occupied||(state.player.x===x&&state.player.y===y)||(playerDestination?.x===x&&playerDestination?.y===y)||!canEnter(x,y,a.id,{x:a.x,y:a.y})){a.wait=45;continue;}
  a.point=point;a.step={x,y,tick:0};
 }}
}
export function facePlayer(state,id){const r=runtime(state),a=r.actors.get(id);r.speaker=id;if(!a)return;const dx=state.player.x-a.x,dy=state.player.y-a.y;a.facing=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';}
export function releaseActors(state){runtime(state).speaker=null;}
export function cueActor(state,id,{mark=null,hop=false,look=false}={}){const r=runtime(state);r.cues.set(id,{start:r.time,mark,hop,look});}
export function actorView(state,id){const r=runtime(state),a=r.actors.get(id),cue=r.cues.get(id),age=cue?r.time-cue.start:Infinity;
 let facing=a?.facing||'down',pose=a?.step&&a.step.tick<8?(a.stride?'strideB':'strideA'):'idle';
 if(cue?.look&&age<1.2&&!r.calm)facing=['left','right','down'][Math.min(2,Math.floor(age/.4))];
 const hop=cue?.hop&&age<.42&&!r.calm?Math.round(Math.sin(age/.42*Math.PI)*8):0;
 return {x:a?(a.x+(a.step?(a.step.x-a.x)*a.step.tick/16:0))*16:null,y:a?(a.y+(a.step?(a.step.y-a.y)*a.step.tick/16:0))*16:null,facing,pose,hop,mark:age<1.1?cue?.mark:null,pop:age<.18&&!r.calm?Math.round((1-age/.18)*4):0};
}
// Original small punctuation balloons, drawn on the native world grid.
export function drawReaction(c,x,y,view){if(!view.mark)return;y=Math.round(y-52-view.hop-view.pop);x=Math.round(x-9);c.fillStyle='#304c4a';c.fillRect(x,y,18,19);c.fillRect(x+6,y+19,4,3);c.fillStyle='#fff3ce';c.fillRect(x+2,y+2,14,15);c.fillRect(x+7,y+17,2,3);c.fillStyle='#a05539';if(view.mark==='!'){c.fillRect(x+8,y+4,2,7);c.fillRect(x+8,y+13,2,2);}else{c.fillRect(x+5,y+4,7,2);c.fillRect(x+11,y+6,2,3);c.fillRect(x+8,y+8,4,2);c.fillRect(x+8,y+10,2,2);c.fillRect(x+8,y+14,2,2);}}
export function actorDebug(state){const r=runtime(state);return {scene:r.scene,time:r.time,speaker:r.speaker,reactions:[...r.cues.keys()].map(id=>({id,...actorView(state,id)})),actors:[...r.actors.values()].map(a=>({...a,view:actorView(state,a.id)}))};}
