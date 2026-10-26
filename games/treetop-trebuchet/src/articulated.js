import {atmosphereAt} from './journey.js?v=71-trebuchet';
import {counterOutline} from './workshop.js?v=71-trebuchet';
import {loadingCollisionRegion,loadingJointRegion} from './loading-refinement.js?v=71';
import {fixedObstacleVertices} from './fixed-obstacles.js?v=71';
import {createEncounterBody} from './encounter-body.js?v=71';
import {surfaceY,surfaceVertices,surfaceCrossing,surfaceNear} from './terrain.js?v=71';
import * as P from '../vendor/planck/planck.mjs';
import {aerodynamicForces} from './glide.js?v=71';
import {config} from './physics.js?v=71';
import {createRig} from './species.js?v=71';
import {createEncounterDirector} from './encounters.js?v=71';
import {world as layout} from './world.js?v=71';
import {stageInitialVolunteer} from './staging.js?v=71';
const serializer=new P.Serializer({rootClass:P.World,
 postSerialize:(data,obj)=>{if(obj.getAngle&&obj.getMassData)data.angle=obj.getAngle();if(obj.getUserData)data.labTag=obj.getUserData();if(obj.getMassData && obj.isDynamic?.()){const m={center:P.Vec2()};obj.getMassData(m);data.labMass=m;if(obj.getGravityScale()!==1)data.labGravityScale=obj.getGravityScale();}return data;},
 // Planck 1.5.1 constructs bodies through a wrapped rotation. Restore the
 // unwrapped sweep before joints are reconstructed; public setAngle wraps again.
 postDeserialize:(obj,data)=>{if(obj.getMassData&&obj.m_sweep&&Number.isFinite(data.angle)){obj.m_sweep.a=data.angle;obj.m_sweep.a0=data.angle;}if(data.labTag && obj.setUserData)obj.setUserData(data.labTag);if(data.labMass && obj.setMassData)obj.setMassData(data.labMass);if(Number.isFinite(data.labGravityScale)&&obj.setGravityScale)obj.setGravityScale(data.labGravityScale);return obj;}});
const V=(x,y)=>P.Vec2(x,y);
// External hand effort scales with total payload mass; all supplied work is tracked.
export function gripParameters(mass){if(!Number.isFinite(mass)||mass<=0)throw new Error('Invalid grip mass');return {stiffness:120*mass,damping:18*mass,maxForce:Math.max(80,60*mass)};}
const tag=(body,role,id)=>body.setUserData({role,id});
// Cocking setup is a reachable initial pose, with clearance above the support branch.
export function cockedConfig(overrides={},desiredFraction=.6){
 const p=config(overrides);if(!Number.isFinite(desiredFraction))throw new Error('Invalid cocking input');
 const maxFraction=Math.min(.95,(6-p.sling-.3)/p.longArm);
 if(maxFraction<.2)throw new Error('Beam/sling geometry cannot clear this six-metre frame');
 const fraction=Math.max(.2,Math.min(maxFraction,desiredFraction));
 return {...p,initialArm:-Math.PI+Math.asin(fraction)};
}
export class CritterScene {
 constructor(overrides={},species='lizard',saved=null){
  this.p=config(overrides);this.rig=createRig(species);this.phase=this.p.mechanicalWinding?'uncocked':'loading';this.elapsed=0;this.frame=null;this.hand=null;this.handWork=0;this.forceCapped=false;this.release=null;this.control=0;this.assistWork=0;this.events=[];this.impactCount=0;this.enemies=new Map();this.encounters=null;this.spawnEnergy=0;this.despawnEnergy=0;this.encounterSeed=null;this.lastEnemySound=-Infinity;this.lastImpact=-1;this.windingWork=0;this.windingInput=0;this.windingBraking=0;this.windingTarget=null;this.windingStart=0;this.dampingWork=0;this.dragWork=0;this.routeTerrainReady=false;
  if(saved){this.world=serializer.fromJson(saved.world);Object.assign(this,{phase:saved.phase,elapsed:saved.elapsed,release:saved.release,handWork:saved.handWork,assistWork:saved.assistWork??0,control:saved.control??0,impactCount:saved.impactCount??0,windingWork:saved.windingWork??0,windingInput:saved.windingInput??0,windingBraking:saved.windingBraking??0,windingTarget:saved.windingTarget??null,windingStart:saved.windingStart??0,spawnEnergy:saved.spawnEnergy??0,despawnEnergy:saved.despawnEnergy??0,lastImpact:saved.lastImpact??-1,lastEnemySound:saved.lastEnemySound??-Infinity,encounterSeed:saved.encounterSeed??null,dampingWork:saved.dampingWork??0,dragWork:saved.dragWork??0});this.index();if(saved.encounterState)this.encounters=createEncounterDirector(this.encounterSeed,saved.encounterState,layout);return;}
  const p=this.p;if(p.pivotHeight+p.longArm*Math.sin(p.initialArm)-p.sling-.23<294+.02)throw new Error('Cocked cradle intersects support branch; reduce lift or change hardware');this.world=new P.World(V(0,-p.gravity));this.world.setWarmStarting(false);this.world.setAllowSleeping(false);
  const ground=this.world.createBody();tag(ground,'static','world');
  for(const s of layout.surfaces.filter(s=>!s.flightOnly))ground.createFixture(P.Box((s.maxX-s.minX)/2,.04,V((s.minX+s.maxX)/2,s.y-.04)),{friction:.12,restitution:.3,filterCategoryBits:1});
  for(const pin of layout.bumpers){const fixture=ground.createFixture(pin.shape==='deflector'?P.Polygon(fixedObstacleVertices(pin).map(p=>V(p.x,p.y))):P.Circle(V(pin.x,pin.y),pin.radius),{friction:pin.friction??.08,restitution:pin.restitution??.85,filterCategoryBits:1});if(pin.shape==='deflector')fixture.setUserData({role:'deflector',id:`deflector ${pin.x},${pin.y}`,x:pin.x,y:pin.y,radius:pin.radius,slope:pin.slope});}
  // The loading shelf ends before the hanging cradle; no kinematic seating force.
  ground.createFixture(P.Box(.8,.04,V(-4.3,p.pivotHeight-4.5)),{friction:.08,restitution:.1,filterCategoryBits:1});
  this.frame=this.world.createDynamicBody({position:V(0,p.pivotHeight-6)});tag(this.frame,'frame','support');
  // A rigid A-frame with finite fixtures; feet meet the authored branch at y=294.
  for(const sign of [-1,1]){
   this.frame.createFixture(P.Polygon([V(sign*1.3,.02),V(sign*1.6,.15),V(.16,6),V(-.16,6)]),{density:1,friction:p.frameFriction,restitution:0,filterCategoryBits:16,filterMaskBits:15});
   this.frame.createFixture(P.Box(.4,.1,V(sign*1.5,.12)),{density:3,friction:p.frameFriction,restitution:0,filterCategoryBits:16,filterMaskBits:15});
  }
  for(let i=0;i<(p.foundationBraces??0);i++)this.frame.createFixture(P.Box(1.25-i*.18,.07,V(0,.5+i*1.15)),{density:3,friction:p.frameFriction,filterCategoryBits:16,filterMaskBits:15});
  const frameMass={center:V()};this.frame.getMassData(frameMass);this.frame.setMassData({mass:p.frameMass,center:frameMass.center,I:frameMass.I*p.frameMass/frameMass.mass});
  this.arm=this.world.createDynamicBody({position:V(0,p.pivotHeight),angle:p.initialArm});tag(this.arm,'arm','beam');
  this.arm.createFixture(P.Box((p.longArm+p.shortArm)/2,.055,V((p.longArm-p.shortArm)/2,0)),{density:p.beamLinearDensity/.11,filterCategoryBits:8,filterMaskBits:1});
  if(p.counterKind){
   const hinged=p.counterMount==='hinged',body=hinged?this.world.createDynamicBody({position:this.arm.getWorldPoint(V(-p.shortArm,0)),bullet:true}):this.arm;
   if(hinged){this.counterWeight=body;tag(body,'counterweight','swinging-weight');body.createFixture(P.Box(.025,p.counterHanger/2,V(0,-p.counterHanger/2)),{density:0,filterCategoryBits:8,filterMaskBits:1});}
   const vertices=counterOutline(p).map(v=>hinged?{x:v.x+p.shortArm,y:v.y-p.counterHanger}:v),area=Math.abs(vertices.reduce((sum,v,i)=>{const q=vertices[(i+1)%vertices.length];return sum+v.x*q.y-q.x*v.y;},0))/2;
   const weight=body.createFixture(P.Polygon(vertices.map(v=>V(v.x,v.y))),{density:p.counterMass/area,filterCategoryBits:8,filterMaskBits:1});weight.setUserData({role:'counterweight',kind:p.counterKind});
   if(hinged){this.counterHinge=this.world.createJoint(new P.RevoluteJoint({collideConnected:false},this.arm,body,this.arm.getWorldPoint(V(-p.shortArm,0))));this.counterHinge.setUserData({role:'counterweight-hinge'});}
  }else this.arm.createFixture(P.Circle(V(-p.shortArm,0),.1),{density:p.counterMass/(Math.PI*.01),filterCategoryBits:8,filterMaskBits:1});
  this.pivot=this.world.createJoint(new P.RevoluteJoint({enableLimit:true,lowerAngle:0,upperAngle:0},this.frame,this.arm,V(0,p.pivotHeight)));this.pivot.setUserData({role:'pivot'});
  const tip=this.arm.getWorldPoint(V(p.longArm,0));
  this.pouch=this.world.createDynamicBody({position:V(tip.x,tip.y-p.sling),bullet:true});tag(this.pouch,'pouch','cradle');
  for(const shape of [P.Box(.8,.035,V(0,-.19)),P.Box(.035,.19,V(-.8,0)),P.Box(.035,.19,V(.8,0))])this.pouch.createFixture(shape,{density:1,friction:.15,restitution:.05,filterCategoryBits:2,filterMaskBits:21});
  this.ropes=[-.65,.65].map((x,i)=>{const joint=this.world.createJoint(new P.RopeJoint({bodyA:this.arm,bodyB:this.pouch,localAnchorA:V(p.longArm,0),localAnchorB:V(x,0),maxLength:Math.hypot(p.sling,.65),collideConnected:false}));joint.setUserData({role:'rope',id:i});return joint;});this.rope=this.ropes[0];
  const origin=V(-4.3,p.pivotHeight-3.8),map=new Map();
  for(const part of this.rig.bodies){const body=this.world.createDynamicBody({position:V(origin.x+part.x,origin.y+part.y),angle:part.angle,bullet:true});tag(body,'part',part.id);map.set(part.id,body);
   const fixture={density:1,friction:this.rig.friction,restitution:this.rig.restitution,filterCategoryBits:4,filterMaskBits:59,filterGroupIndex:-1};
   const s=part.shape;if(s.type==='circle')body.createFixture(P.Circle(s.radius),fixture);
   else if(s.type==='box')body.createFixture(P.Box(s.width/2,s.height/2),fixture);
   else {const h=Math.max(0,s.length/2-s.radius);if(h>0)body.createFixture(P.Box(h,s.radius),fixture);for(const x of [-h,h])body.createFixture(P.Circle(V(x,0),s.radius),fixture);}
   const data={center:V(0,0)};body.getMassData(data);const factor=part.mass/data.mass;body.setMassData({mass:part.mass,center:data.center,I:data.I*factor});
  }
  for(const j of this.rig.joints){const a=map.get(j.a),b=map.get(j.b);this.world.createJoint(new P.RevoluteJoint({bodyA:a,bodyB:b,localAnchorA:V(j.anchorA.x,j.anchorA.y),localAnchorB:V(j.anchorB.x,j.anchorB.y),referenceAngle:j.referenceAngle,enableLimit:true,lowerAngle:j.minAngle,upperAngle:j.maxAngle,collideConnected:false}));}
  this.index();if(new.target===CritterScene)this.initialStaging=stageInitialVolunteer(this);
 }
 index(){this.routeTerrainReady=false;for(let b=this.world.getBodyList();b;b=b.getNext())if(b.getUserData()?.id==='canopy-route')this.routeTerrainReady=true;this.parts=[];for(let b=this.world.getBodyList();b;b=b.getNext()){const d=b.getUserData();if(d?.role==='counterweight')this.counterWeight=b;if(d?.role==='arm')this.arm=b;if(d?.role==='frame')this.frame=b;if(d?.role==='pouch')this.pouch=b;if(d?.role==='part')this.parts.push(b);if(d?.role==='enemy')this.enemies.set(d.id,b);}
  this.parts.sort((a,b)=>a.getUserData().id.localeCompare(b.getUserData().id));this.rope=null;this.ropes=[];
  for(let j=this.world.getJointList();j;j=j.getNext()){if(j.getUserData()?.role==='counterweight-hinge')this.counterHinge=j;if(j.getUserData()?.role==='pivot')this.pivot=j;if(j.getUserData()?.role==='rope')this.ropes.push(j);}
  this.ropes.sort((a,b)=>a.getUserData().id-b.getUserData().id);this.rope=this.ropes[0]??null;this.world.setWarmStarting(false);this.world.setAllowSleeping(false);
  // Visual contact starts follow actual touching, independently of reward thresholds.
  this.world.on('begin-contact',contact=>{if(this.phase!=='flight')return;const a=contact.getFixtureA().getBody(),b=contact.getFixtureB().getBody(),other=a.getUserData()?.role==='part'?b:b.getUserData()?.role==='part'?a:null;if(other?.getUserData()?.role==='enemy')other.getUserData().lastContact=this.elapsed;});
  const approaching=new WeakMap();this.world.on('pre-solve',contact=>{if(this.phase!=='flight')return;const bodyA=contact.getFixtureA().getBody(),bodyB=contact.getFixtureB().getBody();if(bodyA.getUserData()?.role!=='part'&&bodyB.getUserData()?.role!=='part')return;const m=contact.getWorldManifold(),p=m?.points[0];if(!p){approaching.set(contact,0);return;}const a=bodyA.getLinearVelocityFromWorldPoint(p),b=bodyB.getLinearVelocityFromWorldPoint(p);approaching.set(contact,-((b.x-a.x)*m.normal.x+(b.y-a.y)*m.normal.y));});
  this.world.on('post-solve',(contact,impulse)=>{if(this.phase!=='flight')return;
   const a=contact.getFixtureA().getBody(),b=contact.getFixtureB().getBody();if(a.getUserData()?.role!=='part' && b.getUserData()?.role!=='part')return;
   const strength=impulse.normalImpulses.reduce((n,x)=>n+x,0);if(!(strength>.08)||!((approaching.get(contact)??0)>.4))return;
   const other=a.getUserData()?.role==='part'?b:a,fixture=a.getUserData()?.role==='part'?contact.getFixtureB():contact.getFixtureA(),d=other.getUserData();
   // Contact animation observes every real strong encounter; scoring/audio keep their shared cooldown.
   if(d?.role==='enemy')d.lastContact=this.elapsed;if(this.elapsed-this.lastImpact<.08)return;
   this.lastImpact=this.elapsed;this.impactCount++;
   const material=d?.role==='enemy'?(d.shape==='leaf'||d.shape==='wings'||d.shape==='skid'?'leaf':d.shape==='cap'?'ground':'shell'):d?.role==='static'?(fixture.getShape().getType()==='circle'?'bumper':this.center().y<2?'ground':'wood'):'wood';const point=contact.getWorldManifold()?.points[0],surface=d?.role==='static'&&point?layout.surfaces.find(s=>surfaceNear(s,point,.25))?.id:null;this.events.push({type:'impact',encounter:d?.role==='enemy'?d.kind:null,strength,closingSpeed:approaching.get(contact),position:point?{x:point.x,y:point.y}:this.center(),material,surface:surface??fixture.getUserData()?.id??null,mass:this.rig.totalMass});if(this.events.length>16)this.events.shift();});
 }
 startWinding(fraction){
  if(this.hand || !['uncocked','loading','wind-stalled'].includes(this.phase))throw new Error('Winding requires an unloaded grip and idle mechanism');
  const feasible=cockedConfig(this.p,fraction);this.windingTarget=feasible.initialArm;this.windingStart=this.elapsed;
  this.pivot.enableLimit(false);this.pivot.setMaxMotorTorque(this.p.windingTorque??1800);this.pivot.enableMotor(true);this.phase='winding';
 }
 updateWinding(){
  if(this.phase!=='winding')return;
  const error=this.windingTarget-this.arm.getAngle(),frameSpeed=this.frame.getAngularVelocity(),relativeSpeed=this.pivot.getJointSpeed();
  if(Math.abs(error)<.004 && Math.abs(relativeSpeed)<.025){const angle=this.pivot.getJointAngle();this.pivot.enableMotor(false);this.pivot.setLimits(angle,angle);this.pivot.enableLimit(true);this.phase='loading';this.events.push({type:'cocked'});return;}
  const speed=Math.max(-.6,Math.min(.6,error*5))-frameSpeed;this.pivot.setMotorSpeed(speed);
  if(this.elapsed-this.windingStart>12){this.pivot.enableMotor(false);this.phase='wind-stalled';this.events.push({type:'wind-stalled'});}
 }
 canSpawnEncounter(e){const shape=P.Circle(e.radius+.05),transform=P.Transform(V(e.x,e.y),0);
  for(let body=this.world.getBodyList();body;body=body.getNext())for(let fixture=body.getFixtureList();fixture;fixture=fixture.getNext())if(fixture.getFilterMaskBits()!==0){const other=fixture.getShape();for(let i=0;i<(other.getChildCount?.()??1);i++)if(P.testOverlap(shape,0,other,i,transform,body.getTransform()))return false;}
  return true;
 }
 enableEncounters(seed){this.encounterSeed=seed;this.encounters=createEncounterDirector(seed,null,layout);}
 updateEncounters(){if(!this.encounters||this.phase!=='flight'||this.elapsed-this.release.time<.8)return;
  const time=this.elapsed-this.release.time,c=this.center();
  // Remove old distant bodies before evaluating capacity; account for signed energy removal.
  for(const[id,body]of this.enemies)if((()=>{const p=body.getPosition(),v=body.getLinearVelocity(),tag=body.getUserData(),dx=p.x-c.x,dy=p.y-c.y,d=Math.hypot(dx,dy),receding=dx*(c.vx-v.x)+dy*(c.vy-v.y)<0;return time>tag.expiresAt&&d>20||d>20&&time-(tag.spawnTime??0)>.35&&receding;})()){this.despawnEnergy+=this.bodyEnergy(body);this.world.destroyBody(body);this.enemies.delete(id);}
  const births=this.encounters.update(time,c,undefined,{capacity:8-this.enemies.size}).spawns;let added=false;
  for(const e of births)if(!this.enemies.has(e.id)&&this.enemies.size<8){
   if(Math.hypot(e.x-c.x,e.y-c.y)<e.radius+1.5||!this.canSpawnEncounter(e))continue;
   const body=createEncounterBody(this.world,e);
   this.enemies.set(e.id,body);this.spawnEnergy+=this.bodyEnergy(body);added=true;
  }
  if(added&&time-this.lastEnemySound>=.4){this.lastEnemySound=time;this.events.push({type:'enemy'});if(this.events.length>16)this.events.shift();}
 }
 snapshot(){if(this.hand)throw new Error('Drop grip before taking a launch snapshot');return {encounterSeed:this.encounterSeed,encounterState:this.encounters?.snapshot()??null,spawnEnergy:this.spawnEnergy,despawnEnergy:this.despawnEnergy,lastImpact:this.lastImpact,lastEnemySound:this.lastEnemySound,dampingWork:this.dampingWork,dragWork:this.dragWork,windingWork:this.windingWork,windingInput:this.windingInput,windingBraking:this.windingBraking,windingTarget:this.windingTarget,windingStart:this.windingStart,assistWork:this.assistWork,control:this.control,impactCount:this.impactCount,p:{...this.p},species:this.rig.id,phase:this.phase,elapsed:this.elapsed,release:this.release?structuredClone(this.release):null,handWork:this.handWork,world:serializer.toJson(this.world)};}
 clone(){return new CritterScene(this.p,this.rig.id,this.snapshot());}
 center(){let x=0,y=0,vx=0,vy=0,m=0;for(const b of this.parts){const w=b.getMass(),q=b.getWorldCenter(),v=b.getLinearVelocity();m+=w;x+=q.x*w;y+=q.y*w;vx+=v.x*w;vy+=v.y*w;}return {x:x/m,y:y/m,vx:vx/m,vy:vy/m,mass:m};}
 loadingStatus(){const c=this.center(),cup=this.pouch.getPosition(),v=this.pouch.getLinearVelocityFromWorldPoint(c);let contacting=false,contactingParts=0,maxPartRelativeSpeed=0,maxRelativeSpin=0;
  for(const part of this.parts){let contact=false;for(let edge=part.getContactList();edge;edge=edge.next)if(['pouch','pouchflap'].includes(edge.other.getUserData()?.role)&&edge.contact.isTouching())contact=true;
   contacting ||=contact;if(contact)contactingParts++;const q=part.getWorldCenter(),pv=part.getLinearVelocity(),cv=this.pouch.getLinearVelocityFromWorldPoint(q);maxPartRelativeSpeed=Math.max(maxPartRelativeSpeed,Math.hypot(pv.x-cv.x,pv.y-cv.y));maxRelativeSpin=Math.max(maxRelativeSpin,Math.abs(part.getAngularVelocity()-this.pouch.getAngularVelocity()));
  }
  const cv=this.pouch.getLinearVelocity();
  return {cradleSpeed:Math.hypot(cv.x,cv.y),cradleSpin:this.pouch.getAngularVelocity(),withinEnvelope:Math.abs(c.x-cup.x)<.8&&c.y>cup.y-.2&&c.y<cup.y+.8,contacting,contactingParts,relativeSpeed:Math.hypot(c.vx-v.x,c.vy-v.y),maxPartRelativeSpeed,maxRelativeSpin};
 }
 isLoaded(){const c=this.center(),p=this.pouch.getPosition();return Math.abs(c.x-p.x)<.8 && c.y>p.y-.2 && c.y<p.y+.8;}
 grab(point){if(this.phase!=='loading')return false;let selected=null,anchor=null;
  for(const b of this.parts)for(let f=b.getFixtureList();f;f=f.getNext())if(f.testPoint(point)){selected=b;anchor=point;}
  if(!selected){const b=this.parts.reduce((best,b)=>Math.hypot(b.getWorldCenter().x-point.x,b.getWorldCenter().y-point.y)<Math.hypot(best.getWorldCenter().x-point.x,best.getWorldCenter().y-point.y)?b:best,this.parts[0]);const q=b.getWorldCenter();if(Math.hypot(q.x-point.x,q.y-point.y)<.3){selected=b;anchor=q;}}
  if(!selected)return false;this.hand={body:selected,local:selected.getLocalPoint(anchor),target:V(anchor.x,anchor.y)};return true;}

 move(point){if(this.hand && Number.isFinite(point.x)&&Number.isFinite(point.y))this.hand.target=V(point.x,point.y);}
 drop(){this.hand=null;}
 unlatch(){if(this.phase!=='loading')throw new Error('Finish physical winding before unlatching');if(this.hand)throw new Error('Release your grip first');if(!this.isLoaded())throw new Error('Place critter in cradle first');this.pivot.enableLimit(false);this.phase='launching';}
 bodyEnergy(b){const m=b.getMass(),c=b.getWorldCenter(),v=b.getLinearVelocity(),local=b.getLocalCenter(),I=b.getInertia()-m*(local.x**2+local.y**2);return .5*m*(v.x**2+v.y**2)+.5*I*b.getAngularVelocity()**2+m*this.p.gravity*(c.y-this.p.pivotHeight);}
 energy(){let e=0;for(let b=this.world.getBodyList();b;b=b.getNext())if(b.isDynamic())e+=this.bodyEnergy(b);return e;}
 collisionRegion(dt){
  if(this.phase!=='flight')return false;
  const obstacles=[...layout.bumpers,...[...this.enemies.values()].map(e=>({x:e.getPosition().x,y:e.getPosition().y,radius:e.getUserData()?.radius??e.getFixtureList().getShape().getRadius(),speed:e.getLinearVelocity().length()}))],enemySpeed=Math.max(0,...obstacles.map(o=>o.speed??0));
  for(const b of this.parts){const v=b.getLinearVelocity(),speed=Math.hypot(v.x,v.y),spin=Math.abs(b.getAngularVelocity());if(speed<3&&spin<10&&enemySpeed<3)continue;
   const center=b.getWorldCenter();
   for(let f=b.getFixtureList();f;f=f.getNext()){const a=f.getAABB(0),lo=a.lowerBound,hi=a.upperBound;
    // The old0.15m safety margin already covers ordinary spin. Enlarge it only
    // when a fixture's angular sweep can exceed that margin before the next step.
    const radius=Math.hypot(Math.max(Math.abs(lo.x-center.x),Math.abs(hi.x-center.x)),Math.max(Math.abs(lo.y-center.y),Math.abs(hi.y-center.y))),rotation=radius*Math.min(2,spin*dt),pad=Math.max(.15,rotation)+(speed+enemySpeed)*dt;
    // The loading shelf is also a real arrival surface when a poor throw
    // returns toward the rig. Its centre/half-extents match construction above.
    if(hi.x+pad>=-5.1&&lo.x-pad<=-3.5&&hi.y+pad>=this.p.pivotHeight-4.54&&lo.y-pad<=this.p.pivotHeight-4.46)return true;
    if(layout.surfaces.some(s=>hi.x+pad>=s.minX&&lo.x-pad<=s.maxX&&hi.y+pad>=Math.min(s.y,surfaceY(s,s.maxX))-.08&&lo.y-pad<=Math.max(s.y,surfaceY(s,s.maxX))))return true;
    for(const obstacle of obstacles)if(hi.x+pad>=obstacle.x-obstacle.radius&&lo.x-pad<=obstacle.x+obstacle.radius&&hi.y+pad>=obstacle.y-obstacle.radius&&lo.y-pad<=obstacle.y+obstacle.radius)return true;
   }
  }return false;
 }
 installRouteTerrain(){
  // Fixed distant geography is constructed only after physical release. Keeping
  // extra broadphase proxies out of loading preserves the existing contact order.
  if(this.routeTerrainReady)return;
  const terrain=this.world.createBody();tag(terrain,'static','canopy-route');
  for(const s of layout.surfaces.filter(s=>s.flightOnly))terrain.createFixture(P.Polygon(surfaceVertices(s).map(p=>V(p.x,p.y))),{friction:.12,restitution:s.restitution??.3,filterCategoryBits:1});
  this.routeTerrainReady=true;
 }
 step(dt=1/600){if(this.phase==='dead')return;if(!(dt>0&&dt<=1/120))throw new Error('Engine timestep outside tested domain');if(this.phase==='flight'&&!this.routeTerrainReady)this.installRouteTerrain();
  // Loading contacts and fast arrivals at angular stops need connected-joint
  // resolution too. Keep the same force laws and limits, at at most 1200 Hz.
  if(this.p.loadingConstraintSubsteps&&this.p.collisionSubsteps&&this.phase==='loading'&&
     (loadingJointRegion(this,dt)||loadingCollisionRegion(this,dt))){
   const count=Math.min(2,Math.ceil(dt*1200));
   for(let i=0;i<count;i++)this.integrate(dt/count);
   return;
  }
  const near=this.p.collisionSubsteps&&this.collisionRegion(dt);
  // Pinned Planck TOI solves contacts without connected joints. Resolve a fast
  // arrival more finely before that contact-only pass can rotate a small limb.
  // This changes integration resolution only, never mass/inertia, limits or state.
  const fast=near&&this.p.fastCollisionStepHz&&this.parts.some(b=>b.getLinearVelocity().length()>40||Math.abs(b.getAngularVelocity())>100);
  const hz=fast?Math.max(this.p.collisionStepHz??1200,this.p.fastCollisionStepHz):this.p.collisionStepHz??1200;
  const count=near?Math.min(fast?8:4,Math.ceil(dt*hz)):1;
  for(let i=0;i<count;i++)this.integrate(dt/count);
 }
 integrate(dt){
  if(this.phase==='dead')return;
  if(this.phase==='flight'){
   const c=this.center(),a=atmosphereAt(c.y,this.elapsed,c.x);
   if(a.dead){this.phase='dead';this.control=0;this.events.push({type:'deep-space'});return;}
   // Each body samples local altitude; machinery stays under normal gravity.
   for(const body of [...this.parts,...this.enemies.values()]){
    const local=atmosphereAt(body.getPosition().y,this.elapsed,body.getPosition().x);
    body.setGravityScale(local.gravity);
    if(this.parts.includes(body))body.applyForceToCenter(V(body.getMass()*a.wind,body.getMass()*a.lift),true);
   }
   for(const enemy of this.enemies.values()){
    const q=enemy.getPosition(),tag=enemy.getUserData(),dx=q.x-c.x,dy=q.y-c.y,d=Math.hypot(dx,dy);
    // Readable proximity interactions; all act through forces, never teleportation.
    if(d>5||d<.01)continue;
    for(const body of this.parts){const m=body.getMass(),v=body.getLinearVelocity();let fx=0,fy=0;
     if(tag.interaction==='yokai-pull'){fx=dx/d*2;fy=dy/d*2;}
     if(tag.interaction==='updraft')fy=8*(1-d/5);
     if(tag.interaction==='gust')fx=4*Math.sin(this.elapsed*2);
     if(tag.interaction==='snare'){fx=-v.x*.8;fy=-v.y*.8;}
     if(tag.interaction==='spin'){fx=-dy/d*3;fy=dx/d*3;}
     body.applyForceToCenter(V(m*fx,m*fy),true);
    }
   }
  }
  const before=this.hand?this.hand.body.getWorldPoint(this.hand.local):null;let force=null;
  if(this.hand){const b=this.hand.body,q=before,v=b.getLinearVelocityFromWorldPoint(q),grip=gripParameters(this.rig.totalMass);let fx=grip.stiffness*(this.hand.target.x-q.x)-grip.damping*v.x,fy=grip.stiffness*(this.hand.target.y-q.y)-grip.damping*v.y;const mag=Math.hypot(fx,fy),scale=Math.min(1,grip.maxForce/(mag||1));this.forceCapped=mag>grip.maxForce;force=V(fx*scale,fy*scale);b.applyForce(force,q,true);}
  const dampingTorque=-this.p.armDamping*this.pivot.getJointSpeed(),dampingAngle=this.pivot.getJointAngle(),drag=[];
  if(dampingTorque){this.arm.applyTorque(dampingTorque,true);this.frame.applyTorque(-dampingTorque,true);}
  if(this.p.flightDrag)for(const b of this.parts){const v=b.getLinearVelocity(),k=(this.phase==='flight'?atmosphereAt(b.getPosition().y).air:1)*this.p.flightDrag*b.getMass()/this.rig.totalMass*Math.hypot(v.x,v.y),F=V(-k*v.x,-k*v.y);drag.push({body:b,force:F,before:{...b.getWorldCenter()}});b.applyForceToCenter(F,true);}
  this.updateWinding();this.updateEncounters();const winding=this.phase==='winding',oldRelativeAngle=this.pivot.getJointAngle();const old=this.phase==='launching'&&this.releaseMode!=='physical-hook'?this.relative():null;const assist=[];
  if(this.phase==='flight' && (this.control || this.rig.id==='flying-squirrel')){
   const root=this.parts.find(b=>b.getUserData().id==='torso')??this.parts[0];
   if(this.rig.id==='flying-squirrel'){const velocity=root.getLinearVelocity(),aero=aerodynamicForces({vx:velocity.x,vy:velocity.y,mass:root.getMass(),area:.22*atmosphereAt(root.getPosition().y).air,pitch:root.getAngle(),angularVelocity:root.getAngularVelocity(),input:this.control});
    // Equivalent membrane+tail loads act on the torso used to evaluate local airflow.
    // F·v + torque*omega is passive for this same body, even while the rig tumbles.
    const F=V(aero.fx,aero.fy);assist.push({body:root,force:F,before:{...root.getWorldCenter()},angle:root.getAngle(),torque:aero.torque});root.applyForceToCenter(F,true);root.applyTorque(aero.torque,true);
   } else if(this.rig.id!=='flying-squirrel'){const F=V(this.control*.25,0);assist.push({body:root,force:F,before:{...root.getWorldCenter()},angle:root.getAngle(),torque:0});root.applyForceToCenter(F,true);}
  }
  this.world.step(dt,this.p.solverVelocityIterations??20,this.p.solverPositionIterations??12);this.elapsed+=dt;this.dampingWork+=dampingTorque*(this.pivot.getJointAngle()-dampingAngle);for(const a of drag){const q=a.body.getWorldCenter();this.dragWork+=a.force.x*(q.x-a.before.x)+a.force.y*(q.y-a.before.y);}if(winding){const work=this.pivot.getMotorTorque(1/dt)*(this.pivot.getJointAngle()-oldRelativeAngle);this.windingWork+=work;if(work>=0)this.windingInput+=work;else this.windingBraking-=work;}for(const a of assist){const q=a.body.getWorldCenter();this.assistWork+=a.force.x*(q.x-a.before.x)+a.force.y*(q.y-a.before.y)+a.torque*(a.body.getAngle()-a.angle);}
  if(this.hand){const q=this.hand.body.getWorldPoint(this.hand.local);this.handWork+=force.x*(q.x-before.x)+force.y*(q.y-before.y);}
  if(this.phase==='launching' && this.rope){const rel=this.relative(),a=this.rope.getAnchorA(),b=this.rope.getAnchorB(),r=Math.hypot(a.x-b.x,a.y-b.y);
    const pulling=this.ropes.some(rope=>{const a=rope.getAnchorA(),b=rope.getAnchorB(),F=rope.getReactionForce(1/dt),d=Math.hypot(b.x-a.x,b.y-a.y);return d>0 && -(F.x*(b.x-a.x)+F.y*(b.y-a.y))/d>.001;});
    if(this.releaseMode!=='physical-hook' && old>this.p.releasePinAngle && rel<=this.p.releasePinAngle && old-rel<Math.PI && pulling && r>Math.hypot(this.p.sling,.65)-.03){
     for(const rope of this.ropes)this.world.destroyJoint(rope);this.ropes=[];this.rope=null;for(let f=this.pouch.getFixtureList();f;f=f.getNext())f.setFilterData({categoryBits:2,maskBits:0,groupIndex:0});
     this.phase='flight';this.events.push({type:'launch'});this.release={time:this.elapsed,center:this.center(),parts:this.parts.map(b=>({id:b.getUserData().id,p:{...b.getPosition()},v:{...b.getLinearVelocity()},w:b.getAngularVelocity()}))};
    }
  }
  for(const b of this.parts){const q=b.getPosition(),v=b.getLinearVelocity();if(![q.x,q.y,v.x,v.y,b.getAngle()].every(Number.isFinite))throw new Error('Nonfinite articulated state');}
 }
 relative(){const a=this.arm.getWorldPoint(V(this.p.longArm,0)),b=this.pouch.getPosition();return ((Math.atan2(b.y-a.y,b.x-a.x)-this.arm.getAngle())%(2*Math.PI)+2*Math.PI)%(2*Math.PI);}
 predict(){if(this.phase!=='loading' || this.hand || this.control || !this.isLoaded())return null;const saved=this.snapshot(),clone=new CritterScene(this.p,this.rig.id,saved),points=[];clone.unlatch();
  for(let i=0;i<3000 && !clone.release;i++)clone.step();if(!clone.release)return {points,reason:'no pin release'};
  points.push(clone.center());for(let i=0;i<480;i++){const before=clone.center();clone.step();const after=clone.center();if(clone.events.some(e=>e.type==='impact'))break;
   // Stop before any authored surface, without exposing bounce outcomes.
   if(layout.surfaces.some(s=>surfaceCrossing(before,after,s,{clearance:.5,bothDirections:true})))break;
   if(i%30===0)points.push(after);}
  return {points,release:clone.release,reason:'same articulated solver'};
 }
}
