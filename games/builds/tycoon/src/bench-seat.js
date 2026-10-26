// Bench front is its facing direction. Collision remains explicit and separate
// from the transparent PNG. Seating is a transition, never ordinary traversal.
export const BENCH_DIRECTIONS={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]};
export const opposite=d=>({down:'up',up:'down',left:'right',right:'left'})[d];
export function benchFacing(type){return type==='bench'?'down':type.startsWith('bench-')?type.slice(6):null;}
export function seatApproach(object,footprint,from,to,direction){
 const facing=benchFacing(object.type);if(!BENCH_DIRECTIONS[facing]||direction!==opposite(facing))return null;
 const [dx,dy]=BENCH_DIRECTIONS[facing];
 const onFront=facing==='down'?to.y===footprint.y+footprint.h-1:facing==='up'?to.y===footprint.y:facing==='left'?to.x===footprint.x:to.x===footprint.x+footprint.w-1;
 if(!onFront||from.x!==to.x+dx||from.y!==to.y+dy)return null;
 return {id:object.id,facing,exit:{x:from.x,y:from.y}};
}
