/** Read-only risk tests for bounded loading resolution. Forces and poses stay physical. */
export function loadingCollisionRegion(scene,dt){
 if(scene.phase!=='loading')return false;
 const obstacles=[];let maxSpeed=0;
 const sweep=(body,fixture)=>{
  const a=fixture.getAABB(0),center=body.getWorldCenter();
  const radius=Math.hypot(
   Math.max(Math.abs(a.lowerBound.x-center.x),Math.abs(a.upperBound.x-center.x)),
   Math.max(Math.abs(a.lowerBound.y-center.y),Math.abs(a.upperBound.y-center.y)));
  return {a,rotation:radius*Math.min(2,Math.abs(body.getAngularVelocity())*dt)};
 };
 for(let body=scene.world.getBodyList();body;body=body.getNext()){
  if(body.getUserData()?.role==='part')continue;
  const velocity=body.getLinearVelocity(),speed=Math.hypot(velocity.x,velocity.y);maxSpeed=Math.max(maxSpeed,speed);
  for(let fixture=body.getFixtureList();fixture;fixture=fixture.getNext())
   obstacles.push({fixture,speed,...sweep(body,fixture)});
 }
 for(const body of scene.parts){
  const velocity=body.getLinearVelocity(),speed=Math.hypot(velocity.x,velocity.y),spin=Math.abs(body.getAngularVelocity());
  if(speed+maxSpeed<3&&spin<10)continue;
  for(let fixture=body.getFixtureList();fixture;fixture=fixture.getNext()){
   const {a,rotation}=sweep(body,fixture);
   for(const obstacle of obstacles){
    const other=obstacle.fixture,g=fixture.getFilterGroupIndex(),h=other.getFilterGroupIndex();
    const collide=g!==0&&g===h?g>0:Boolean(
     (fixture.getFilterMaskBits()&other.getFilterCategoryBits())&&
     (other.getFilterMaskBits()&fixture.getFilterCategoryBits()));
    if(!collide)continue;
    const pad=Math.max(.15,rotation+obstacle.rotation)+(speed+obstacle.speed)*dt;
    if(a.upperBound.x+pad>=obstacle.a.lowerBound.x&&a.lowerBound.x-pad<=obstacle.a.upperBound.x&&
       a.upperBound.y+pad>=obstacle.a.lowerBound.y&&a.lowerBound.y-pad<=obstacle.a.upperBound.y)return true;
   }
  }
 }
 return false;
}
/** Predict an enabled angular-stop arrival, including away from external contact. */
export function loadingJointRegion(scene,dt){
 if(scene.phase!=='loading')return false;
 const slop=2*Math.PI/180; // Pinned Planck angular slop; this changes resolution, not limits.
 for(let joint=scene.world.getJointList();joint;joint=joint.getNext()){
  if(joint.getType()!=='revolute-joint'||!joint.isLimitEnabled())continue;
  const angle=joint.getJointAngle(),speed=joint.getJointSpeed();
  const lower=joint.getLowerLimit(),upper=joint.getUpperLimit();
  if(angle>upper+2*slop||angle<lower-2*slop)return true;
  if(Math.abs(speed)*dt>slop/2&&
     (speed>0?angle+speed*dt>upper-slop:angle+speed*dt<lower+slop))return true;
 }
 return false;
}
