import {surface,neighborMask} from './water-surfaces.js';
export const WATER_REVIEW_WIDTH=15,WATER_REVIEW_HEIGHT=12;
// Two independent pools: one complete shallow ring around each deep center.
export function reviewWaterType(x,y){
 if(x>=11&&x<=13&&y>=2&&y<=3)return 'shallow-still';
 if(y<5||y>10)return null;
 if(x>=1&&x<=6)return x>=2&&x<=5&&y>=6&&y<=9?'still':'shallow-still';
 if(x>=8&&x<=13)return x>=9&&x<=12&&y>=6&&y<=9?'moving':'shallow-moving';
 return null;
}
const offsets=Array.from({length:9},(_,i)=>[i%3-1,Math.floor(i/3)-1]).filter(([x,y])=>x||y);
export function validateWaterLayout(w,h,get){const visited=new Set(),errors=[];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const key=`${x},${y}`;if(visited.has(key)||!get(x,y))continue;
  const cells=[],pending=[[x,y]];visited.add(key);
  while(pending.length){const [xx,yy]=pending.pop(),s=get(xx,yy);cells.push({x:xx,y:yy,surface:s});for(const [dx,dy] of offsets){const nx=xx+dx,ny=yy+dy,k=`${nx},${ny}`;if(nx>=0&&nx<w&&ny>=0&&ny<h&&!visited.has(k)&&get(nx,ny)){visited.add(k);pending.push([nx,ny]);}}}
  if(!cells.some(c=>c.surface.shallow)||!cells.some(c=>!c.surface.shallow))continue;
  for(const cell of cells.filter(c=>!c.surface.shallow))for(const [dx,dy] of offsets){const nx=cell.x+dx,ny=cell.y+dy;if(nx<0||nx>=w||ny<0||ny>=h||!get(nx,ny))errors.push({deep:{x:cell.x,y:cell.y},land:{x:nx,y:ny},message:'Mixed-depth water requires a complete shallow border; deep water cannot touch land, even diagonally.'});}
 }
 return errors;
}
export function reviewWaterCells(identity='fresh'){const get=(x,y)=>{const t=reviewWaterType(x,y);return t?surface(t,identity):null;},cells=[];
 const errors=validateWaterLayout(WATER_REVIEW_WIDTH,WATER_REVIEW_HEIGHT,get);if(errors.length)throw Error(errors[0].message);
 for(let y=0;y<WATER_REVIEW_HEIGHT;y++)for(let x=0;x<WATER_REVIEW_WIDTH;x++){const s=get(x,y);if(s)cells.push({x,y,surface:s,mask:neighborMask(x,y,(xx,yy)=>!!get(xx,yy)),depthMask:neighborMask(x,y,(xx,yy)=>!!get(xx,yy)&&!get(xx,yy).shallow)});}
 return cells;
}
