import * as P from '../vendor/planck/planck.mjs';
// Construction only. Existing shelf geometry is centered at(-4.3,pivotHeight-4.5).
// Never call after simulation starts or on a restored snapshot.
export function initialVolunteerClearance(scene){
 const input=new P.DistanceInput(),output=new P.DistanceOutput(),cache=new P.SimplexCache();let minimum=Infinity;
 for(const part of scene.parts)for(let a=part.getFixtureList();a;a=a.getNext())for(let body=scene.world.getBodyList();body;body=body.getNext())if(body.getUserData()?.role!=='part')for(let b=body.getFixtureList();b;b=b.getNext()){
  input.proxyA.set(a.getShape(),0);input.proxyB.set(b.getShape(),0);input.transformA.set(part.getTransform());input.transformB.set(body.getTransform());input.useRadii=true;cache.recycle();output.recycle();P.Distance(output,cache,input);minimum=Math.min(minimum,output.distance);
 }
 return minimum;
}
export function stageInitialVolunteer(scene){
 if(scene.elapsed!==0||scene.hand)throw new Error('Volunteer staging is construction-only');
 const clearance=.025,original=scene.parts.map(body=>({body,position:{...body.getPosition()},angle:body.getAngle()})),before=initialVolunteerClearance(scene);
 if(before>=clearance)return {shift:{x:0,y:0},clearance:before,originalClearance:before};
 let bottom=Infinity;for(const {body}of original)for(let f=body.getFixtureList();f;f=f.getNext()){const aabb=new P.AABB();f.getShape().computeAABB(aabb,body.getTransform(),0);bottom=Math.min(bottom,aabb.lowerBound.y);}
 const shelfShift=scene.p.pivotHeight-4.5+.12-bottom;
 for(const dx of [0,-.3,.3,-.6,.6])for(const dy of [shelfShift,shelfShift+.25,shelfShift+.5]){
  for(const {body,position,angle}of original)body.setTransform(P.Vec2(position.x+dx,position.y+dy),angle);
  const distance=initialVolunteerClearance(scene);if(distance>=clearance)return {shift:{x:dx,y:dy},clearance:distance,originalClearance:before};
 }
 throw new Error('No clear volunteer staging position on the loading shelf for this hardware');
}
