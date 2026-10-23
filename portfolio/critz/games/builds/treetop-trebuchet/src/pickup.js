// UI-only fallback after the scene's ordinary exact/near-part grab misses.
// Attach at the real torso center, never move a body or widen a collider.
export const PICKUP_RADIUS_CSS=22;
export function pickupFallback(scene,point,pixelsPerMetre){
 if(scene?.phase!=='loading'||![point?.x,point?.y,pixelsPerMetre].every(Number.isFinite)||pixelsPerMetre<=0)return null;
 const torso=scene.parts.find(b=>b.getUserData()?.id==='torso')??scene.parts[Math.floor(scene.parts.length/2)];if(!torso)return null;
 const center=torso.getWorldCenter();return Math.hypot(point.x-center.x,point.y-center.y)*pixelsPerMetre<=PICKUP_RADIUS_CSS?{x:center.x,y:center.y}:null;
}
