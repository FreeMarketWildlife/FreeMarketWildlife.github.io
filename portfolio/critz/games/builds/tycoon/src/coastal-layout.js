import {surface,neighborMask} from './water-surfaces.js';
export const COAST_WIDTH=20,COAST_HEIGHT=15;
export const COAST_SCENES=['showcase','beach','deep-land','still','moving','puddles'];
export function coastalMap(scene='showcase',ground='grass',identity='fresh'){
 const get=(x,y)=>{if(x<0||x>=COAST_WIDTH||y<0||y>=COAST_HEIGHT)return null;
  if(scene==='beach'){if(y>=5+(x<5?2:x<9?1:0))return surface('moving','ocean');}
  else if(scene==='deep-land'){if(x>=3&&x<=16&&y>=4&&y<=12&&!(x<6&&y<7))return surface('still',identity);}
  else if(scene==='still'||scene==='moving'){const t=scene;if(x>=4&&x<=15&&y>=4&&y<=12)return surface(x>=6&&x<=13&&y>=6&&y<=10?t:'shallow-'+t,identity);}
  else if(scene==='puddles'){if((x>=3&&x<=8&&y>=5&&y<=10)||(x>=12&&x<=17&&y>=5&&y<=10))return surface(x<10?'shallow-still':'shallow-moving',identity);}
  else {if(x>=1&&x<=8&&y>=5&&y<=12&&!(x<=2&&y===5))return surface('still',identity);if(x>=11&&x<=18&&y>=5&&y<=12&&!(x===11&&y===5))return surface('moving','ocean');if(x>=13&&x<=16&&y>=1&&y<=2)return surface('shallow-still',identity);}
  return null;
 },land=(x,y)=>scene==='beach'||(scene==='showcase'&&x>=10)?'sand':ground;
 const cells=[];for(let y=0;y<COAST_HEIGHT;y++)for(let x=0;x<COAST_WIDTH;x++){const s=get(x,y);if(s)cells.push({x,y,surface:s,ground:land(x,y),mask:neighborMask(x,y,(xx,yy)=>!!get(xx,yy)),depthMask:neighborMask(x,y,(xx,yy)=>!!get(xx,yy)&&!get(xx,yy).shallow)});}
 return {scene,get,land,cells};
}
// An object occupies one whole cell. Its eight neighboring cells must have the
// exact same water identity, motion and depth: neither shore nor depth transition.
export function rockPlacementValid(map,x,y){const s=map.get(x,y);return !!s&&neighborMask(x,y,(xx,yy)=>{const n=map.get(xx,yy);return n&&n.type===s.type&&n.identity===s.identity;})===255;}
export function coastalRocks(map){const candidates=map.scene==='showcase'?[[4,8],[6,10],[14,8],[16,10]]:map.scene==='beach'?[[5,10],[11,9],[16,11]]:map.scene==='deep-land'?[[8,7],[12,9],[7,10]]:map.scene==='puddles'?[[5,7],[14,8]]:[[7,7],[12,9]];return candidates.filter(([x,y])=>rockPlacementValid(map,x,y)).map(([x,y],i)=>({x,y,variant:i%3}));}
export function coastalWalkable(map,rocks,x,y){const s=map.get(x,y);return x>=0&&x<COAST_WIDTH&&y>=0&&y<COAST_HEIGHT&&(!s||s.shallow)&&!rocks.some(r=>r.x===x&&r.y===y)&&!(x===1&&(y===1||y===2));}
