import {encounterPose} from './woodland-encounters.js?v=66';
import {GUILLOTINE,isGuillotine,bladeHeight} from './guillotine.js?v=66';
import {escapeAltitude,spaceWorldDescriptor,spaceCrossingFraction,validateSpaceEscape} from './space-policy.js?v=66';
import {windingMotion} from './winding-comfort.js?v=66';
import {recipeDrawMinimum} from './scale-builds.js?v=66';
import {addCritterFixtures} from './critter-body.js?v=66';
import {createEnvironmentIndex,isEnvironment} from './grove-environment.js?v=66';
import * as P from '../vendor/planck/planck.mjs';
import {validateBuild,buildFacts,part,critter,drawLimit,REST_ARM_ANGLE} from './build-catalog.js?v=66';
import {validateGroveMap,enemyRecipe,gravityScaleAt,spaceScale} from './grove-map.js?v=66';
import {triangulatePolygon,objectBounds} from './grove-geometry.js?v=66';
const {Vec2,World,Box,Circle,Polygon,Edge,RevoluteJoint,RopeJoint,PrismaticJoint,GearJoint}=P;
export const EARTH_GRAVITY=9.80665;
export const GRAVITY=EARTH_GRAVITY*.9;
// Arcade material balance for the released critter on the ordinary forest floor.
// Coefficients stay passive (<1 restitution); hardware and authored surfaces
// retain their existing fixture materials and all launch contacts are unchanged.
export const FOREST_FLOOR_RESPONSE=Object.freeze({restitution:.58,friction:.16});
const rad=d=>d*Math.PI/180,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
/** Similarity units: x_real=L*x_solver, t_real=sqrt(L)*t_solver,
 * m_real=M*m_solver. Therefore g_solver=g_real, F_real=M*F_solver,
 * torque_real=M*L*torque_solver. No launch impulses or range modifiers. */
export class BuildSimulation{
 constructor(raw,{map=null,world=null,originX=0}={}){
  if(!Number.isFinite(originX))throw Error('Finite launch origin required.');this.rigOriginX=originX;
  if(world){map=world.map;if(!Object.isFrozen(map)||!Object.isFrozen(map.objects))throw Error('Use the immutable active world authority.');validateGroveMap(map);}
  this.map=world?map:map?validateGroveMap(map):null;this.worldObjects=this.map?.objects??[];this.contactEvents=[];this.contactSequence=0;this.gravityFactor=1;this.spaceState='bound';this.spaceEscape=null;this.spaceDriftAngle=null;this.escapeThreshold=this.map?escapeAltitude(this.map):null;this.shotContacts=new Set();this.pendingEncounters=[];this.encounterTimes=new Map();this.contactTimes=new Map();this.impactApproaches=new WeakMap();this.pendingImpacts=new Map();
  this.c=validateBuild(raw);this.facts=buildFacts(this.c);this.animal=critter(this.c.animal);
  const c=this.c;this.L=Math.max(.25,c.longArm/3,c.pivotHeight/4,c.slingLength/4);this.M=Math.max(.01,c.counterGrams/1000/80);this.T=Math.sqrt(this.L);
  this.world=new World(Vec2(0,-GRAVITY));this.time=0;this.phase='ready';this.release=null;this.failure='';this.events=[];this.trail=[];this.maxX=0;this.maxY=0;this.peakTension=0;this.peakStress=0;this.lastTension=0;this.wheels=[];this.wheelAxles=[];this.moving=[];this.elapsedSettled=0;this.accumulator=0;
  this.groundY=this.map?-this.map.launch.y:0;
  this.ground=this.world.createBody();const earth=this.ground.createFixture(Box(100000/this.L,1/this.L,Vec2(0,(this.groundY-1)/this.L)),{friction:.8,restitution:.12});earth.setUserData({worldObject:{id:'forest-floor',type:'ground',material:'stone'}});
  if(this.map)this.installMap();
  this.initialAngle=Math.PI+rad(c.cockAngle);
  this.frame=this.body(originX,0,0,c.frameGrams/1000,'frame');
  const h=c.pivotHeight,b=c.baseWidth/2,t=Math.max(c.beamWidth*.65,h*.025),wheelLift=c.chassis==='wheels'?c.wheelRadius*1.3:0;
  this.frame.setPosition(Vec2(originX/this.L,wheelLift/this.L));
  this.bar(this.frame,{x:-b,y:t},{x:0,y:h-wheelLift},t*.55);this.bar(this.frame,{x:b,y:t},{x:0,y:h-wheelLift},t*.55);this.bar(this.frame,{x:-b,y:t},{x:b,y:t},t*.55);
  for(let i=0;i<c.braceCount;i++){const y=h*(i+1)/(c.braceCount+2);this.bar(this.frame,{x:-b*(1-y/h),y},{x:b*(1-y/h),y},t*.35);}
  // The trough has its own collision lane: it supports the pouch, while the
  // beam and counterweight move beside it in this side-on model.
  this.troughFixture=this.frame.createFixture(Box(c.troughLength/(2*this.L),c.troughHeight/(2*this.L),Vec2(-c.troughLength*.25/this.L,c.troughHeight/(2*this.L))),{density:0,friction:part(c.trough).friction,restitution:0,filterCategoryBits:2,filterMaskBits:4});
  this.troughFixture.setUserData('trough');
  if(isGuillotine(c)){
   const g=GUILLOTINE;for(const side of [-1,1])this.bar(this.frame,{x:g.x+side*g.width/2,y:g.base},{x:g.x+side*g.width/2,y:g.base+g.height},.009);
   this.bar(this.frame,{x:g.x-g.width/2,y:g.base+g.height},{x:g.x+g.width/2,y:g.base+g.height},.012);
  }
  this.setMass(this.frame,(c.frameGrams+(isGuillotine(c)?GUILLOTINE.supportGrams:0))/1000*(1+c.braceCount*.04));
  if(c.chassis==='walking'){
   // A separate support triangle rocks on real toe contacts. Its initial lean is a tuning-string setting.
   this.frame.setAngle(-rad(c.walkingLean));const verts=this.vertices(this.frame);const low=Math.min(...verts.map(v=>v.y));this.frame.setPosition(Vec2(originX/this.L,this.frame.getPosition().y-low+.008));
  }
  this.pivotLocal=this.frame.getLocalPoint(Vec2(originX/this.L,c.pivotHeight/this.L));
  if(c.chassis==='walking')this.pivotLocal=Vec2(0,(h-wheelLift)/this.L);
  let pivot=this.frame.getWorldPoint(this.pivotLocal);
  this.initialAngle=Math.PI+rad(drawLimit(c,pivot.y*this.L,this.railPoint(0).y));
  this.arm=this.body(pivot.x*this.L,pivot.y*this.L,this.initialAngle,this.facts.beamGrams/1000,'arm');
  this.bar(this.arm,{x:-c.shortArm,y:0},{x:c.longArm,y:0},c.beamWidth/2);
  this.setMass(this.arm,this.facts.beamGrams/1000);
  const cwLocal=Vec2(-c.shortArm/this.L,0),cwAttach=this.arm.getWorldPoint(cwLocal),r=this.facts.counterRadius/this.L;
  if(isGuillotine(c)){
   const g=GUILLOTINE,local=Vec2(g.x/this.L,bladeHeight(this.initialAngle,REST_ARM_ANGLE)/this.L),point=this.frame.getWorldPoint(local);
   this.counter=this.body(point.x*this.L,point.y*this.L,this.frame.getAngle(),c.counterGrams/1000,'counter');
   const vertices=[[-.085,.05],[.085,.05],[.085,-.015],[-.085,-.05]].map(([x,y])=>Vec2(x/this.L,y/this.L));
   this.counter.createFixture(Polygon(vertices),{density:1,friction:.3,restitution:0,filterGroupIndex:-1});this.setMass(this.counter,c.counterGrams/1000);
   this.bladeStartY=bladeHeight(this.initialAngle,REST_ARM_ANGLE);
   this.bladeGuide=this.world.createJoint(PrismaticJoint({enableLimit:true,lowerTranslation:(g.lowerY-this.bladeStartY)/this.L,upperTranslation:(g.upperY-this.bladeStartY)/this.L},this.frame,this.counter,point,this.frame.getWorldVector(Vec2(0,1))));
  }else if(c.mount==='fixed'&&c.chassis!=='floating'){
   const fixture=this.arm.createFixture(Circle(cwLocal,r),{density:(c.counterGrams/1000/this.M)/(Math.PI*r*r),friction:.6,restitution:.05,filterGroupIndex:-1});fixture.setUserData('counter');this.counter=this.arm;
  }else{
   const hanger=c.chassis==='floating'?0:c.hanger/this.L;
   this.counter=this.body(cwAttach.x*this.L,(cwAttach.y-hanger)*this.L,0,c.counterGrams/1000,'counter');
   this.counter.createFixture(Circle(r),{density:1,friction:.6,restitution:.04,filterGroupIndex:-1});
   if(hanger)this.bar(this.counter,{x:0,y:0},{x:0,y:c.hanger},Math.max(c.beamWidth*.15,.005));
   this.setMass(this.counter,c.counterGrams/1000);
   this.hinge=this.world.createJoint(RevoluteJoint({enableMotor:true,motorSpeed:0,maxMotorTorque:c.hingeFriction*c.counterGrams/1000*GRAVITY*c.axleRadius/(this.M*this.L)},this.arm,this.counter,cwAttach));
  }
  if(c.chassis==='floating'){
   this.carriage=this.body(pivot.x*this.L,pivot.y*this.L,0,c.frameGrams/20000,'carriage');this.carriage.createFixture(Circle(Math.max(.025,c.beamWidth)/this.L),{density:1,filterGroupIndex:-1});this.setMass(this.carriage,c.frameGrams/20000);
   this.track=this.world.createJoint(PrismaticJoint({enableLimit:true,lowerTranslation:-c.baseWidth/2/this.L,upperTranslation:c.baseWidth/2/this.L},this.ground,this.carriage,pivot,Vec2(1,0)));
   if(!isGuillotine(c))this.guide=this.world.createJoint(PrismaticJoint({},this.ground,this.counter,this.counter.getPosition(),Vec2(0,1)));
   this.axle=this.world.createJoint(RevoluteJoint({},this.carriage,this.arm,pivot));
  }else this.axle=this.world.createJoint(RevoluteJoint({},this.frame,this.arm,pivot));
  if(isGuillotine(c))this.bladeCable=this.world.createJoint(GearJoint({joint1:this.axle,joint2:this.bladeGuide,ratio:-this.L/GUILLOTINE.drumRadius},this.arm,this.counter));
  if(c.chassis==='wheels'){
   for(const x of [-b,b]){const w=this.body(originX+x,c.wheelRadius,0,c.wheelGrams/1000,'wheel');w.createFixture(Circle(c.wheelRadius/this.L),{density:1,friction:c.footFriction,restitution:.02,filterGroupIndex:-1});this.setMass(w,c.wheelGrams/1000);this.wheels.push(w);this.wheelAxles.push(this.world.createJoint(RevoluteJoint({enableMotor:true,motorSpeed:0,maxMotorTorque:0},this.frame,w,w.getPosition())));}
  }
  for(let f=this.frame.getFixtureList();f;f=f.getNext())if(f!==this.troughFixture)f.setFriction(c.footFriction);
  const tip=this.tip(),payloadRadius=this.animal.width/2,pouchMass=part(c.sling).mass/1000+2*part(c.rope).linearGrams*c.slingLength/1000;
  this.payloadMass=this.animal.grams/1000;this.pouchMass=pouchMass;
  this.payloadRadius=payloadRadius;
  const loaded=this.loadingPosition(tip);
  this.shot=this.body(loaded.x,loaded.y,0,this.payloadMass+pouchMass,'payload');
  this.bodyProfile=addCritterFixtures(this.shot,this.animal,{lengthScale:this.L,massScale:this.M,mass:this.payloadMass+pouchMass,options:{friction:.32,restitution:.32,filterGroupIndex:-1,filterCategoryBits:4}});
  this.setMass(this.shot,this.payloadMass+pouchMass);this.shot.setBullet(true);
  this.sling=this.world.createJoint(RopeJoint({maxLength:c.slingLength/this.L,localAnchorA:Vec2(c.longArm/this.L,0),localAnchorB:Vec2(0,0)},this.arm,this.shot));
  this.startX=this.shot.getPosition().x*this.L;this.initialCounterY=this.counterPoint().y;this.initialEnergy=this.energy();this.initialPivot={x:pivot.x*this.L,y:pivot.y*this.L};
  this.storeTypes=new Map();for(const bdy of this.moving){this.storeTypes.set(bdy,bdy.getType());bdy.setType('static');}
  this.world.on('begin-contact',contact=>this.onContact(contact));
  this.world.on('pre-solve',contact=>{this.configureFlightContact(contact);this.observeImpact(contact);});
  this.world.on('post-solve',(contact,impulse)=>this.resolveImpact(contact,impulse));
  this.world.on('end-contact',contact=>{this.shotContacts.delete(contact);});
 }
 installMap(){
  this.terrain=[];this.mapBodies=[];this.patrolBodies=[];this.environment=createEnvironmentIndex(this.worldObjects);
  for(const o of this.worldObjects){
   if(!o.collision||isEnvironment(o))continue;
   const b=this.world.createBody(),bounds=objectBounds(o);this.mapBodies.push(b);
   const options={friction:o.material==='leaf'?.22:o.material==='bumper'?.05:.65,restitution:o.bounce,filterCategoryBits:8};
   const add=shape=>{const f=b.createFixture(shape,options);f.setUserData({worldObject:o});};
   const point=p=>Vec2(p.x/this.L,p.y/this.L);
   if(o.type==='polygon')for(const triangle of triangulatePolygon(o.points)){
    const vertices=triangle.map(point);
    // Planck welds polygon vertices closer than half its linear slop. Feeding a
    // tiny triangle to it silently creates a 2×2 fallback box at the origin.
    // Keep sub-resolution details as boundary edges instead, at their real place.
    const minEdge=Math.min(...vertices.map((p,i)=>Math.hypot(p.x-vertices[(i+1)%3].x,p.y-vertices[(i+1)%3].y)));
    if(minEdge<.0026){for(let i=0;i<3;i++)add(Edge(vertices[i],vertices[(i+1)%3]));}
    else add(Polygon(vertices));
   }
   else if(o.type==='chain')for(let i=1;i<o.points.length;i++)add(Edge(point(o.points[i-1]),point(o.points[i])));
   else if(o.type==='enemy'&&o.encounter&&o.encounter.motion!=='still'){b.setType('kinematic');b.setPosition(Vec2(o.x/this.L,o.y/this.L));add(Circle(o.radius/this.L));this.patrolBodies.push({o,b});}
   else add(Circle(Vec2(o.x/this.L,o.y/this.L),o.radius/this.L));
   if(o.type!=='enemy')this.terrain.push({o,bounds});
  }
 }
 terrainHeight(x,ceiling=Infinity){
  let highest=this.groundY;
  for(const {o,bounds} of this.terrain??[]){
   if(x<bounds.minX||x>bounds.maxX||bounds.minY>ceiling)continue;
   if(o.type==='circle'){const y=o.y+Math.sqrt(Math.max(0,o.radius**2-(x-o.x)**2));if(y<=ceiling)highest=Math.max(highest,y);continue;}
   const n=o.points.length-(o.type==='chain'?1:0);
   for(let i=0;i<n;i++){const a=o.points[i],b=o.points[(i+1)%o.points.length];if(Math.abs(b.x-a.x)<1e-9||x<Math.min(a.x,b.x)||x>Math.max(a.x,b.x))continue;const y=a.y+(x-a.x)*(b.y-a.y)/(b.x-a.x);if(y<=ceiling)highest=Math.max(highest,y);}
  }
  return highest;
 }
 onContact(contact){
  const a=contact.getFixtureA(),b=contact.getFixtureB();
  if(a.getBody()!==this.shot&&b.getBody()!==this.shot)return;
  this.shotContacts.add(contact);
  if(!this.release)return;
  const other=a.getBody()===this.shot?b:a,o=other.getUserData()?.worldObject;
  if(o?.type==='enemy'&&this.time-(this.encounterTimes.get(o.id)??-100)>.7){this.encounterTimes.set(o.id,this.time);this.pendingEncounters.push(o);}
 }
 configureFlightContact(contact){
  if(!this.release)return;
  const a=contact.getFixtureA(),b=contact.getFixtureB();
  const other=a.getBody()===this.shot?b:b.getBody()===this.shot?a:null;
  if(other?.getUserData()?.worldObject?.type!=='ground')return;
  contact.setRestitution(FOREST_FLOOR_RESPONSE.restitution);
  contact.setFriction(FOREST_FLOOR_RESPONSE.friction);
 }
 observeImpact(contact){
  if(!this.release)return;
  const a=contact.getFixtureA(),b=contact.getFixtureB(),shotA=a.getBody()===this.shot;
  if(!shotA&&b.getBody()!==this.shot)return;
  const other=shotA?b:a,o=other.getUserData()?.worldObject,manifold=contact.getWorldManifold();
  if(!o||!manifold||!contact.getManifold().pointCount)return;
  // Measure closing speed at the actual contact, including physical tumbling.
  // A fast graze is quiet; the speed parallel to a branch is not a BONK.
  const normal={x:manifold.normal.x*(shotA?-1:1),y:manifold.normal.y*(shotA?-1:1)};
  let impact=null;
  for(let i=0;i<contact.getManifold().pointCount;i++){
   const point=manifold.points[i],v=this.shot.getLinearVelocityFromWorldPoint(point),w=other.getBody().getLinearVelocityFromWorldPoint(point);
   const speed=Math.max(0,-((v.x-w.x)*normal.x+(v.y-w.y)*normal.y))*this.L/this.T;
   if(!impact||speed>impact.speed)impact={o,speed,x:point.x*this.L,y:point.y*this.L,normal};
  }
  this.impactApproaches.set(contact,impact);
 }
 resolveImpact(contact,impulse){
  const impact=this.impactApproaches.get(contact);this.impactApproaches.delete(contact);
  if(!impact)return;
  const change=impulse.normalImpulses.reduce((sum,n)=>sum+n,0)/this.shot.getMass()*this.L/this.T;
  // Resting support and tiny fixture-seam taps must not restart hit pause,
  // count as bounce chains, or produce repeated full-strength impact sounds.
  if(impact.speed<.6||change<.35)return;
  const old=this.pendingImpacts.get(impact.o.id);
  if(!old||impact.speed>old.speed)this.pendingImpacts.set(impact.o.id,{...impact,change});
 }
 recordImpact(hit){
  const o=hit.o;
  if(this.time-(this.contactTimes.get(o.id)??-100)<=.12)return;
  this.contactTimes.set(o.id,this.time);this.contacts=(this.contacts??0)+1;
  if(!this.map)return;
  this.contactEvents.push({seq:++this.contactSequence,id:o.id,kind:o.type==='enemy'?o.kind:o.material??'wood',material:o.material??'stone',x:hit.x,y:hit.y,
   normal:{...hit.normal},normalSpeed:hit.speed,velocityChange:hit.change,...(hit.power?{power:true}:{}),strength:Math.min(1,Math.sqrt((hit.power?hit.change:hit.speed)/20)),time:this.time});
  if(this.contactEvents.length>64)this.contactEvents.shift();
 }
 flushImpacts(){for(const hit of this.pendingImpacts.values())this.recordImpact(hit);this.pendingImpacts.clear();}
 applyEncounters(){
  // These small, authored impulses are pinball powers. They only happen after
  // release and are intentionally excluded from the mechanism's energy audit.
  for(const o of this.pendingEncounters.splice(0)){
   const recipe=enemyRecipe(o.kind),p=this.real(this.shot),pop=Math.min(18,9+Math.sqrt(o.radius)*3),power=o.encounter?.strength??1;
   if(power===0)continue;
   let vx=p.vx,vy=p.vy;
   if(recipe.effect==='updraft')vy=Math.max(vy,pop*Math.abs(power));
   if(recipe.effect==='gust'){vx=o.encounter?Math.max(-35,Math.min(35,vx+6*power)):Math.min(35,Math.max(7,vx+6));vy=Math.max(vy,4*Math.abs(power));}
   if(recipe.effect==='snare'){vx*=Math.max(.35,1-.3*Math.abs(power));vy*=Math.max(.4,1-.2*Math.abs(power));}
   if(recipe.effect==='spin'){vy=Math.max(vy,pop*.65*Math.abs(power));this.shot.setAngularVelocity(Math.max(-12,Math.min(12,this.shot.getAngularVelocity()+2*power)));}
   const mass=this.shot.getMass();this.shot.applyLinearImpulse(Vec2((vx-p.vx)*this.T/this.L*mass,(vy-p.vy)*this.T/this.L*mass),this.shot.getWorldCenter(),true);
   // An authored power can activate from a gentle touch. Keep its punctuation
   // even when the physical impact was too quiet to count as a normal bounce.
   const change=Math.hypot(vx-p.vx,vy-p.vy);
   if(change>.35){const pose=encounterPose(o,this.time),dx=p.x-pose.x,dy=p.y-pose.y,d=Math.hypot(dx,dy)||1,normal={x:dx/d,y:dy/d};this.recordImpact({o,speed:0,change,power:true,x:pose.x+normal.x*o.radius,y:pose.y+normal.y*o.radius,normal});}

  }
 }
 railPoint(x){const p=this.frame.getWorldPoint(Vec2(x/this.L,this.c.troughHeight/this.L));return{x:p.x*this.L,y:p.y*this.L};}
 supportHeight(x){
  const a=this.railPoint(-this.c.troughLength*.75),b=this.railPoint(this.c.troughLength*.25);
  const ground=this.map?this.terrainHeight(x,.1):0;
  if(x<Math.min(a.x,b.x)||x>Math.max(a.x,b.x))return ground;
  return Math.max(ground,a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x||1));
 }
 loadingPosition(tip){
  const c=this.c,r=this.payloadRadius,skin=.012*this.L;
  let x=tip.x+c.slingLength,y;
  for(let i=0;i<8;i++){
   const floor=this.supportHeight(x)+r+skin;
   y=Math.max(floor,tip.y-c.slingLength*.8);
   const dy=y-tip.y;
   x=tip.x+.94*Math.sqrt(Math.max(0,c.slingLength**2-dy**2));
  }
  // Resolve support before enabling dynamics, never by injecting a correction
  // into a moving payload. Ground contact while winding is a normal load state.
  return{x,y:Math.max(y,this.supportHeight(x)+r+skin)};
 }
 body(x,y,a,mass,role){const b=this.world.createDynamicBody({position:Vec2(x/this.L,y/this.L),angle:a,allowSleep:false,userData:{role}});this.moving.push(b);return b;}
 bar(body,a,b,r){const dx=b.x-a.x,dy=b.y-a.y;body.createFixture(Box(Math.hypot(dx,dy)/(2*this.L),r/this.L,Vec2((a.x+b.x)/(2*this.L),(a.y+b.y)/(2*this.L)),Math.atan2(dy,dx)),{density:1,friction:.6,restitution:0,filterGroupIndex:-1});}
 setMass(b,kg){const mass=b.getMass(),ratio=kg/this.M/mass;for(let f=b.getFixtureList();f;f=f.getNext())f.setDensity(f.getDensity()*ratio);b.resetMassData();}
 vertices(b){const vs=[];for(let f=b.getFixtureList();f;f=f.getNext()){const sh=f.getShape();if(sh.getType()==='polygon')vs.push(...sh.m_vertices.map(v=>b.getWorldPoint(v)));}return vs;}
 real(b){const p=b.getPosition(),v=b.getLinearVelocity();return{x:p.x*this.L,y:p.y*this.L,vx:v.x*this.L/this.T,vy:v.y*this.L/this.T,angle:b===this.shot&&this.spaceState==='escaped'&&Number.isFinite(this.spaceDriftAngle)?this.spaceDriftAngle:b.getAngle()};}
 tip(){const q=this.arm.getWorldPoint(Vec2(this.c.longArm/this.L,0));return{x:q.x*this.L,y:q.y*this.L};}
 counterPoint(){const p=this.counter===this.arm?this.arm.getWorldPoint(Vec2(-this.c.shortArm/this.L,0)):this.counter.getPosition();return{x:p.x*this.L,y:p.y*this.L};}
 pivot(){if(this.beamBroken)return this.lastPivot;const p=this.axle?.getAnchorA()??this.arm.getPosition();return{x:p.x*this.L,y:p.y*this.L};}
 energy(){let E=0;for(const b of this.moving){const m=b.getMass()*this.M,v=b.getLinearVelocity(),w=b.getAngularVelocity()/this.T;E+=m*GRAVITY*b.getWorldCenter().y*this.L+.5*m*(v.x*v.x+v.y*v.y)*this.L+.5*(b.getInertia()-b.getMass()*b.getLocalCenter().lengthSquared())*this.M*this.L*this.L*w*w;}return E;}
 preparationStatus(){
  if(this.phase!=='ready')return{ready:false,code:'active',message:'Finish this experiment before winding again.'};
  const draw=this.drawFraction??1;if(!Number.isFinite(draw)||draw<0||draw>1)return{ready:false,code:'draw-invalid',message:'Invalid winding position. Reset this experiment before launching.'};
  if(this.loading?.assisting)return{ready:false,code:'carrying',message:'Keyboard lift in progress. Let the critter drop into the basket.'};
  if(this.loading&&!this.loading.loaded)return{ready:false,code:this.loading.settling?'settling':'loading',message:this.loading.settling?'The critter is settling in the basket. Wait for support, then hold and release again.':'Load the basket and let the critter settle before winding.'};
  const minimum=this.loading?recipeDrawMinimum(this.c):null;
  if(minimum!==null&&draw+1e-9<minimum)return{ready:false,code:'draw',minimumDraw:minimum,message:`Keep cranking to at least ${Math.round(minimum*100)}% for this setup. The ratchet keeps your current draw.`};
  return{ready:true,code:'ready',minimumDraw:minimum};
 }
 fire(){
  if(!this.preparationStatus().ready)return false;
  if(this.loading&&!this.loading.prepareLaunch())return false;
  const fatal=this.facts.warnings.filter(w=>w.includes('exceeds')||w.includes('too small')||w.includes('starts below'));
  if(fatal.length){this.failure=fatal[0];this.phase='invalid';return false;}
  for(const [b,type]of this.storeTypes){b.setType(type);b.setAwake(true);}
  if(this.loading){const motion=this.loading.motion;this.shot.setLinearVelocity(Vec2(motion.vx*this.T/this.L,motion.vy*this.T/this.L));this.shot.setAngularVelocity(motion.omega*this.T);}
  if(['anchored','floating'].includes(this.c.chassis))this.frame.setType('static');
  this.phase='swing';this.initialEnergy=this.energy();this.events.push({time:0,text:'Trigger withdrawn. Gravity takes over.'});return true;
 }
 /** Quasi-static ratchet rigging. The winch supports the mechanism before the
  * latch opens. It changes gravitational potential, never launch velocity.
  * Rope and counterweight joints remain coincident, including floating rails. */
 setDraw(fraction,{winding=false}={}){
  if(this.phase!=='ready'||!Number.isFinite(fraction))return;
  if(!winding)this.windAge=0;
  this.drawFraction=Math.max(0,Math.min(1,fraction));
  const c=this.c,angle=REST_ARM_ANGLE+(this.initialAngle-REST_ARM_ANGLE)*this.drawFraction;
  const pivot={...this.initialPivot};
  if(this.carriage){
   const guideX=this.initialPivot.x-c.shortArm*Math.cos(this.initialAngle);
   pivot.x=guideX+c.shortArm*Math.cos(angle);
   this.carriage.setPosition(Vec2(pivot.x/this.L,pivot.y/this.L));
  }
  this.arm.setTransform(Vec2(pivot.x/this.L,pivot.y/this.L),angle);
  if(this.counter!==this.arm){
   if(isGuillotine(c)){
    const point=this.frame.getWorldPoint(Vec2(GUILLOTINE.x/this.L,bladeHeight(angle,REST_ARM_ANGLE)/this.L));this.counter.setTransform(point,this.frame.getAngle());
   }else this.counter.setTransform(Vec2((pivot.x-c.shortArm*Math.cos(angle))/this.L,(pivot.y-c.shortArm*Math.sin(angle)-(c.chassis==='floating'?0:c.hanger))/this.L),0);
  }
  const loaded=this.loadingPosition(this.tip());
  if(!this.loading)this.shot.setTransform(Vec2(loaded.x/this.L,loaded.y/this.L),0);
  this.startX=loaded.x;this.initialCounterY=this.counterPoint().y;
 }
 beginWinding(){this.windAge=0;}
 wind(dt){
  if(this.phase!=='ready'||!Number.isFinite(dt)||dt<=0)return;
  const c=this.c,f=this.drawFraction??0,span=this.initialAngle-REST_ARM_ANGLE;
  // Bearing comfort sets the readable crank-rate governor; heavier loads additionally
  // respect motor power through d(mgh)/d(fraction). Ratchet holds at each stop.
  const angle=REST_ARM_ANGLE+span*f;
  const joulesPerFraction=c.counterGrams/1000*GRAVITY*(isGuillotine(c)?GUILLOTINE.drumRadius:c.shortArm*Math.max(.01,-Math.cos(angle)))*span;
  const motion=windingMotion(c,{loaded:!!this.loading}),step=Math.max(0,Math.min(.1,dt));
  this.windAge=(this.windAge??0)+step;
  const ramp=motion.rampSeconds?Math.min(1,this.windAge/motion.rampSeconds):1;
  const rate=Math.min(1/motion.minimumSeconds,part(c.winch).power/Math.max(.01,joulesPerFraction));
  this.setDraw(f+step*rate*ramp,{winding:true});
 }
 detach(reason){
  if(!this.sling||this.release)return;
  const p=this.real(this.shot);this.release={...p,time:this.time,reason,speed:Math.hypot(p.vx,p.vy),angle:Math.atan2(p.vy,p.vx)*180/Math.PI,energy:.5*this.payloadMass*(p.vx*p.vx+p.vy*p.vy)};
  this.world.destroyJoint(this.sling);this.sling=null;
  // Split the co-moving pouch mass without changing either body's velocity.
  this.pouch=this.body(p.x,p.y,p.angle,this.pouchMass,'pouch');this.pouch.createFixture(Circle(Math.max(.012,this.c.pouchWidth*.1)/this.L),{density:1,filterGroupIndex:-1});this.setMass(this.pouch,this.pouchMass);this.pouch.setLinearVelocity(this.shot.getLinearVelocity());this.pouch.setAngularVelocity(this.shot.getAngularVelocity());this.setMass(this.shot,this.payloadMass);
  this.emptyCord=this.world.createJoint(RopeJoint({maxLength:this.c.slingLength/this.L,localAnchorA:Vec2(this.c.longArm/this.L,0)},this.arm,this.pouch));
  this.phase='flight';this.events.push({time:this.time,text:reason});
 }
 /** Rehydrate only a validated completed crossing, never an in-progress flight.
  * Its captured world descriptor keeps rewards valid after editor-map changes. */
 restoreSpaceEscape(record){
  const escape=validateSpaceEscape(record);
  if(escape.animal!==this.animal.id||escape.grams!==this.animal.grams)throw Error('Space critter does not match this build.');
  if(this.spaceState==='escaped'){
   if(JSON.stringify(this.spaceEscape)===JSON.stringify(escape))return false;
   throw Error('A different space run is already active.');
  }
  if(this.phase!=='ready'||this.release)throw Error('Restore space before starting a new launch.');
  this.applySpaceEscape(escape);return true;
 }
 applySpaceEscape(record){
  const escape=validateSpaceEscape(record),origin=this.map?.launch.y??0;
  // Isolate the crossing packet from later world, body, UI or reward mutations.
  for(const value of[escape.world,escape.payload,escape.release])Object.freeze(value);
  this.spaceEscape=Object.freeze(escape);this.spaceState='escaped';this.phase='escaped';this.gravityFactor=0;
  if(this.sling){this.world.destroyJoint(this.sling);this.sling=null;this.setMass(this.shot,this.payloadMass);}
  if(!this.release)this.release={...escape.release,y:escape.release.y+escape.world.launchY-origin};
  this.failure=escape.failure;this.maxX=escape.distance;this.maxY=escape.height;this.time=escape.time;this.lastTension=0;this.elapsedSettled=0;
  const p=escape.payload;this.spaceDriftAngle=p.angle;this.shot.setType('dynamic');this.shot.setTransform(Vec2(p.x/this.L,(p.y+escape.world.launchY-origin)/this.L),p.angle);
  this.shot.setLinearVelocity(Vec2(p.vx*this.T/this.L,p.vy*this.T/this.L));this.shot.setAngularVelocity(p.omega*this.T);this.shot.setGravityScale(0);
  for(let f=this.shot.getFixtureList();f;f=f.getNext())f.setFilterMaskBits(0);
  this.shotContacts.clear();this.pendingEncounters.length=0;this.pendingImpacts.clear();this.leafDepth=0;this.environmentChecks=0;
  this.events.push({type:'space-escape',time:escape.time,altitude:escape.altitude,text:'Beyond the moon — free drift.'});
 }
 driftSpace(dt){
  if(this.phase!=='escaped'||!Number.isFinite(dt)||dt<=0)return;
  const h=Math.min(dt,.1),p=this.real(this.shot),omega=this.shot.getAngularVelocity()/this.T;
  const x=p.x+p.vx*h,y=p.y+p.vy*h,angle=p.angle+omega*h,time=this.time+h;
  // Constant velocity in actual zero gravity. Only an arithmetic overflow holds
  // the final pose; rewards, contacts and the ordinary flight timeout stay fixed.
  if(![x,y,angle,time].every(Number.isFinite))return;
  // Planck's setTransform stores an equivalent angle in [-pi,pi]. Retain
  // the analytical unwrapped angle so physical rotation stays continuous.
  this.shot.setTransform(Vec2(x/this.L,y/this.L),angle);this.spaceDriftAngle=angle;this.time=time;
  if(this.time-(this.lastTrail??-1)>.06){this.trail.push({x,y,t:this.time});this.lastTrail=this.time;if(this.trail.length>1200)this.trail.shift();}
 }
 step(dt=1/60){
  if(this.phase==='escaped'){this.driftSpace(dt);return;}
  if(!['swing','flight'].includes(this.phase))return;
  this.accumulator+=Math.min(dt,.1);const h=this.T/480;
  let steps=0;while(this.accumulator>=h&&steps++<200){this.tick(h);this.accumulator-=h;if(this.phase==='escaped'){const remaining=this.accumulator;this.accumulator=0;this.driftSpace(remaining);break;}if(!['swing','flight'].includes(this.phase))break;}
 }
 tick(h){
  if(this.phase==='escaped'){this.driftSpace(h);return;}
  const c=this.c,dt=h/this.T;
  const total=(c.counterGrams+c.frameGrams+this.facts.beamGrams+this.animal.grams)/1000;
  const reaction=this.beamBroken?null:this.axle.getReactionForce(1/dt);
  const bearingLoad=this.time>0&&reaction?reaction.length()*this.M:(c.counterGrams+this.facts.beamGrams+this.animal.grams)/1000*GRAVITY;
  const axleFriction=part(c.bearing).friction*bearingLoad*c.axleRadius/(this.M*this.L);
  if(!this.beamBroken){this.axle.enableMotor(true);this.axle.setMotorSpeed(0);this.axle.setMaxMotorTorque(axleFriction);}
  for(const joint of this.wheelAxles){joint.setMaxMotorTorque(c.brake*total*GRAVITY*c.wheelRadius/2/(this.M*this.L));}
  const p=this.real(this.shot),area=Math.PI*(this.animal.width/2)**2,rvx=p.vx-c.wind,v=Math.hypot(rvx,p.vy);
  if(this.map&&this.release){this.gravityFactor=gravityScaleAt(p.y+this.map.launch.y,this.map);this.shot.setGravityScale(this.gravityFactor);}
  if(this.release&&(this.map?this.shotContacts.size>0:p.y<this.payloadRadius+.06*this.L)&&Math.abs(p.vx)>.005)this.shot.applyForceToCenter(Vec2(-Math.tanh(p.vx*10)*this.payloadMass*GRAVITY*.18/this.M,0),true);
  if(c.drag){const air=this.map&&this.release?Math.max(0,Math.min(1,(520*spaceScale(this.map)-p.y-this.map.launch.y)/(60*spaceScale(this.map)))):1,k=.5*1.225*.8*area*air;this.shot.applyForceToCenter(Vec2(-k*v*rvx/this.M,-k*v*p.vy/this.M),true);}
  // Kinematic paths use the exact same clock and pose as the painted world.
  // Set velocity to the next fixed-step pose, so contacts see relative motion.
  for(const {o,b} of this.patrolBodies??[]){const now=encounterPose(o,this.time),next=encounterPose(o,this.time+h);b.setPosition(Vec2(now.x/this.L,now.y/this.L));b.setLinearVelocity(Vec2((next.x-now.x)/this.L/dt,(next.y-now.y)/this.L/dt));}
  this.world.step(dt,32,12);this.time+=h;
  if(this.bladeGuide&&!this.guillotineCut){
   const y=this.frame.getLocalPoint(this.counter.getPosition()).y*this.L;
   if(y<=GUILLOTINE.lowerY+.001){this.guillotineCut={time:this.time,y};this.events.push({time:this.time,text:'Guillotine blade reached its stop.'});}
  }
  if(this.map&&this.release&&this.phase==='flight'){
   const q=this.real(this.shot),stable=[q.x,q.y,q.vx,q.vy,this.counterPoint().y].every(Number.isFinite)&&Math.abs(q.x)<=100000;
   const crossing=stable?spaceCrossingFraction(p,q,this.escapeThreshold,this.map.launch.y):null;
   if(crossing!==null){
    const mix=key=>p[key]+(q[key]-p[key])*crossing,payload={x:mix('x'),y:this.escapeThreshold-this.map.launch.y,vx:mix('vx'),vy:mix('vy'),angle:mix('angle'),omega:this.shot.getAngularVelocity()/this.T};
    this.applySpaceEscape({version:1,world:spaceWorldDescriptor(this.map),threshold:this.escapeThreshold,altitude:this.escapeThreshold,time:this.time-h+h*crossing,payload,
     distance:Math.max(this.maxX,payload.x-this.startX),height:Math.max(this.maxY,payload.y),release:{...this.release},failure:this.failure,grams:this.animal.grams,animal:this.animal.id});
    this.driftSpace(h*(1-crossing));return;
   }
  }
  this.flushImpacts();
  if(this.pendingEncounters.length)this.applyEncounters();
  if(this.release&&this.environment){
   const result=this.environment.step(p,this.real(this.shot),this.animal);this.leafDepth=result.leafDepth;this.environmentChecks=result.checks;
   if(result.retention<1){const v=this.shot.getLinearVelocity(),mass=this.shot.getMass();this.shot.applyLinearImpulse(Vec2(v.x*(result.retention-1)*mass,v.y*(result.retention-1)*mass),this.shot.getWorldCenter(),true);this.shot.setAngularVelocity(this.shot.getAngularVelocity()*result.retention);}
   for(const o of result.events){this.contactEvents.push({seq:++this.contactSequence,id:o.id,kind:o.material,material:o.material,x:p.x,y:p.y,strength:o.material==='foliage'?.02:Math.min(1,Math.hypot(p.vx,p.vy)/22),time:this.time});if(this.contactEvents.length>64)this.contactEvents.shift();}
  }
  if(c.wind===0&&!(this.map&&this.release)&&this.energy()>this.initialEnergy*1.05+1){this.failure='Numerical energy check failed — change the geometry or mass balance';this.phase='invalid';return;}
  const q=this.real(this.shot);this.maxX=Math.max(this.maxX,q.x-this.startX);this.maxY=Math.max(this.maxY,q.y);this.lastTension=this.sling?this.sling.getReactionForce(1/dt).length()*this.M:0;this.peakTension=Math.max(this.peakTension,this.lastTension);
  if(this.sling){
   const tip=this.tip(),phi=Math.atan2(q.y-tip.y,q.x-tip.x),relative=wrap(phi-this.arm.getAngle());
   const finger=c.pinAngle*Math.PI/180;
   // A finite idealized ring slides along the finger under resolved cord tension.
   // Friction resists sliding; the free loop must traverse pinLength before release.
   const pull=this.lastTension*Math.cos(relative-finger),normal=this.lastTension*Math.abs(Math.sin(relative-finger));
   const outward=pull-part(c.release).friction*normal;
   const airborne=q.y-this.payloadRadius>this.supportHeight(q.x)+.018*this.L;
   if(airborne&&Math.hypot(q.vx,q.vy)>.5*Math.sqrt(this.L))this.hasLifted=true;
   if(outward>0&&this.time>.03&&this.hasLifted){const accel=outward/Math.max(.001,this.payloadMass*.08);this.ringSpeed=(this.ringSpeed??0)+accel*h;this.ringTravel=(this.ringTravel??0)+this.ringSpeed*h;}else{this.ringSpeed=0;this.ringTravel=0;}
   if(this.lastTension>part(c.rope).strength){this.failure='Sling cord snapped';this.detach('Cord overload — uncontrolled release');}
   else if(this.ringTravel>=c.pinLength)this.detach('Release ring cleared the pin');
   const bending=this.lastTension*c.longArm+c.counterGrams/1000*GRAVITY*c.shortArm*.15;
   this.peakStress=Math.max(this.peakStress,bending/(c.beamWidth**3/6));
   if(this.peakStress>part(c.arm).strength*2&&!this.failure){this.failure='Beam overloaded';this.detach('Beam overloaded — throw interrupted');this.lastPivot=this.pivot();this.world.destroyJoint(this.axle);this.beamBroken=true;}
  }
  if(this.time-(this.lastTrail??-1)>.06){this.trail.push({x:q.x,y:q.y,t:this.time});this.lastTrail=this.time;if(this.trail.length>1200)this.trail.shift();}
  if(![q.x,q.y,q.vx,q.vy,this.counterPoint().y].every(Number.isFinite)||Math.abs(q.x)>100000){this.failure='Configuration exceeded the solver’s stable range';this.phase='invalid';return;}
  if(this.release){this.elapsedSettled=Math.hypot(q.vx,q.vy)<.16&&(this.map?this.shotContacts.size>0:q.y<this.supportHeight(q.x)+this.payloadRadius+.06*this.L)?this.elapsedSettled+h:0;if((this.time-this.release.time>.35*this.T&&this.elapsedSettled>.8)||this.time>(this.map?Math.max(100,this.map.tree.height*.5):100))this.phase='finished';}
  else if(this.time>Math.max(8,12*this.T)){this.failure=this.failure||'No release — try the pin, arm ratio, or counterweight';this.phase='finished';}
 }
 snapshot(){return{phase:this.phase,time:this.time,payload:{...this.real(this.shot),...(this.phase==='ready'&&this.loading?{vx:this.loading.motion.vx,vy:this.loading.motion.vy}:{})},tip:this.tip(),pivot:this.pivot(),counter:this.counterPoint(),frame:this.real(this.frame),armAngle:this.arm.getAngle(),release:this.release,distance:this.maxX,height:this.maxY,tension:this.lastTension,peakTension:this.peakTension,peakStress:this.peakStress,energy:this.energy(),initialEnergy:this.initialEnergy,failure:this.failure,guillotine:this.bladeGuide?{blade:this.counterPoint(),cut:this.guillotineCut??null}:null,spaceState:this.spaceState,spaceEscape:this.spaceEscape?structuredClone(this.spaceEscape):null};}
}
export function runBuild(c,seconds=80){const sim=new BuildSimulation(c);sim.fire();for(let t=0;t<seconds&&['swing','flight'].includes(sim.phase);t+=1/60)sim.step(1/60);return sim;}
