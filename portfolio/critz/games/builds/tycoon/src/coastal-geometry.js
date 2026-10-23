import {CONTACT_RULE,contactTerrainSpan} from './contact-rules.js';
export {CONTACT_RULE};
// Connected rows overlap in the registered projection. Inward returns round the
// exposed land corner in that overlap, joining the 16px side to the shore cap.
export function coastalWaterPixel(x,y,m){
 const s=contactTerrainSpan(m),top=m&1?0:16,bottom=m&4?64:48;
 if(x<s.left||x>=s.right||y<top||y>=bottom)return false;
 const returns=[[0,0,9,128],[31,0,3,16],[31,63,6,32],[0,63,12,64]];
 for(const [cx,cy,pair,diagonal] of returns){
  const dx=Math.abs(x-cx),dy=Math.abs(y-cy);
  if((m&pair)===pair&&!(m&diagonal)&&dx<16&&dy<16&&dx*dx+dy*dy<256)return false;
 }
 const corners=[[s.left,16,!(m&8)&&!(m&1),1,1],[s.right-1,16,!(m&2)&&!(m&1),-1,1],[s.left,47,!(m&8)&&!(m&4),1,-1],[s.right-1,47,!(m&2)&&!(m&4),-1,-1]];
 for(const [cx,cy,on,sx,sy] of corners){const dx=(x-cx)*sx,dy=(y-cy)*sy;if(on&&dx>=0&&dy>=0&&dx<6&&dy<6&&(dx-6)**2+(dy-6)**2>36)return false;}
 return true;
}
