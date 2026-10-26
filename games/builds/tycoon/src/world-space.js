// A saved (x,y) is the occupied ground cell. All actors use its bottom center,
// indoors and outdoors. Motion coordinates retain the original 16px units.
export const CAMERA_FOCUS_Y = 176;
export const worldFoot = (x, y) => ({x:x*2+16, y:y*2+32});
export const cellFoot = (x, y) => worldFoot(x*16,y*16);
// Stable visible-body focus, independent of map bounds and animation pose.
// The authored idle silhouettes center 20.5/22.5px above their ground feet.
export const heroFocus = (foot, gender='boy') => ({x:foot.x,y:foot.y-(gender==='girl'?23:21)});
export function centeredCamera(foot,width,height,gender='boy') {
  const focus=heroFocus(foot,gender);
  return {x:focus.x-width/2,y:focus.y-height/2};
}
export const normalizeZoom = value => Number.isInteger(value)&&value>=0&&value<=2?value:0;
export function worldViewport(width,height,zoom=0) {
  const fit=Math.min(width/480,height/320),base=fit>=1?Math.floor(fit):fit;
  const level=normalizeZoom(zoom),scale=base>=1?base*(level+1):[base,1,2][level];
  if(!(scale>0))return null;
  // Even buffers and symmetric clipping put the focus at the visible center.
  return {width:Math.ceil(width/scale/2)*2,height:Math.ceil(height/scale/2)*2,scale,level};
}
