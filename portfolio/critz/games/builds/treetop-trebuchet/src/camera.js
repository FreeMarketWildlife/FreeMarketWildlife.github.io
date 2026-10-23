const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
/** Post-release only: X is exactly the physical COM, including reversals.
 * Y may move inside a small dead zone; an immediate bound prevents fast flight
 * escaping the view. Ground framing keeps visible floor below the volunteer. */
export function createFlightCamera(){let y=0,ready=false;
 return {update(center,{width,height,scale,dt=1/60,reducedMotion=false}){
  if(![center.x,center.y,center.vx??0,center.vy??0,width,height,scale,dt].every(Number.isFinite)||width<=0||height<=0||scale<=0||dt<0)throw new Error('Invalid camera frame');
  const deadZone=height*.08/scale;if(!ready||reducedMotion){y=center.y;ready=true;}else y=clamp(y,center.y-deadZone,center.y+deadZone);
  return {x:center.x,y:Math.max(y,height*.25/scale)};
 }};
}
