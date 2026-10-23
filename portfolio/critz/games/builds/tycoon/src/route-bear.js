export const BEAR_ART=Object.freeze({width:96,height:96,footprint:[0,0,3,1],drawOffset:[0,-32],groundAnchor:[48,80],sortAnchor:[48,64]});
export const BEAR_CLOSED=Object.freeze([8,21,3,1]);
export const BEAR_ASIDE=Object.freeze([17,22,3,1]);
export const northOfBear = state => ['liarsville','waterworks'].includes(state.scene)||state.flags?.visited?.some(id=>['liarsville','waterworks'].includes(id));
export function routeBear(state) {
  if(state.scene!=='forest'||state.omitRouteBear)return null;
  const access=state.liarsvilleBearAccess===true,[x,y,w,h]=access?BEAR_ASIDE:BEAR_CLOSED;
  return {id:'route-bear',name:'A resting bear',type:'routeBlocker',x,y,collision:[x,y,w,h],interactionCells:Array.from({length:w},(_,i)=>[x+i,y]),
    text:access?'The big bear rests quietly beside the path. There is room to pass.':'A big bear is resting across the path to Liarsville. The way is blocked for now. Rootport is back south.'};
}
