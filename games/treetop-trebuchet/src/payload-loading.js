import {pedestalCues} from './pedestal-cues.js?v=71';
import {loadingStand} from './launch-staging.js?v=71';
import {critterBodyProfile} from './critter-body.js?v=71';
import {World,Vec2,Box,Edge,RevoluteJoint,MouseJoint} from '../vendor/planck/planck.mjs';
import {LOADING_LINEAR_DAMPING} from './winding-comfort.js?v=71';
import {GRAVITY} from './build-physics.js?v=71';
/** Jointed preparation bodies remain free on real basket contacts, including
 * after a successful drop and while winding. `loaded` only observes support;
 * it never welds, centers, replaces or freezes the ragdoll. */
export function createPayloadLoading(sim,{door=null,reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false}={}){
 const L=sim.animal.length,T=Math.sqrt(L),w=sim.animal.width,c=sim.c;
 const stand=loadingStand(c,sim.animal,sim.rigOriginX??0);
 const home=()=>({x:stand.x,y:stand.y+w*.52});
 const target=()=>sim.loadingPosition(sim.tip());
 const world=new World(Vec2(0,-GRAVITY)),ground=world.createBody(),basket=world.createKinematicBody();
 ground.createFixture(Edge(Vec2(-1000,0),Vec2(1000,0)),{friction:.65,restitution:.08});
 ground.createFixture(Box(stand.width/(2*L),stand.height/(2*L),Vec2(stand.x/L,(stand.y-stand.height/2)/L)),{friction:.7,restitution:.05});
 const bw=c.pouchWidth*.64,depth=Math.max(w*1.3,c.pouchWidth*.45),base=-w*.45;
 basket.createFixture(Edge(Vec2(-bw/L,base/L),Vec2(bw/L,base/L)),{friction:.75,restitution:.05});
 for(const side of [-1,1])basket.createFixture(Edge(Vec2(side*bw/L,base/L),Vec2(side*bw/L,(base+depth)/L)),{friction:.5,restitution:.03});
 const profile=critterBodyProfile(sim.animal),frontMass=(profile.find(p=>p.id==='head')?.mass??.12)+(sim.animal.id==='mouse'?(profile.find(p=>p.id==='ear')?.mass??0):0),rearMass=profile.find(p=>['tail','haunch','flukes'].includes(p.id))?.mass??.08;
 const mouseShape=sim.animal.id==='mouse';
 const specs=mouseShape?[{id:'body',offset:-.03,a:-.18,b:.12,mass:1-frontMass-rearMass,ry:.40},{id:'head',offset:.22,a:.12,b:.32,mass:frontMass,ry:.46},{id:'tail',offset:-.43,a:-.68,b:-.18,mass:rearMass,ry:.025}]:[{id:'body',offset:-.045,a:-.30,b:.19,mass:1-frontMass-rearMass},{id:'head',offset:.34,a:.19,b:.5,mass:frontMass},{id:['frog','rabbit','elephant'].includes(sim.animal.id)?'haunch':'tail',offset:-.395,a:-.5,b:-.30,mass:rearMass}];
 const bodies=specs.map((s,i)=>{const b=world.createDynamicBody({position:Vec2(0,0),linearDamping:LOADING_LINEAR_DAMPING*T,angularDamping:3*T,bullet:true,allowSleep:true,userData:s.id});const half=(s.b-s.a)/2,ry=w/L*(s.ry??(i===2?.24:.42));b.createFixture(Box(half,Math.max(mouseShape?.004:.025,ry)),{density:1,friction:.55,restitution:.06,filterGroupIndex:-4});const md={mass:s.mass,center:Vec2(0,0),I:s.mass*((half*2)**2+(ry*2)**2)/12};b.setMassData(md);return b;});
 let assist=null,dragging=false,loaded=false,mouse=null,grab=null,cursor=null,clock=0,lastActivity=0,forcedUntil=0,dropTime=0,falling=false,accumulator=0,returning=false,hopAt=-Infinity,returnAt=0,idleHopAt=-Infinity;
 const origin=()=>{const p=bodies[0].getWorldPoint(Vec2(-specs[0].offset,0));return{x:p.x*L,y:p.y*L};};
 const joints=[];
 const poseAt=p=>{for(let i=0;i<bodies.length;i++){bodies[i].setTransform(Vec2(p.x/L+specs[i].offset,p.y/L),0);bodies[i].setLinearVelocity(Vec2(0,0));bodies[i].setAngularVelocity(0);bodies[i].setAwake(true);}};
 poseAt(door?{x:door.x,y:w*.52}:home());
 if(door)returning=true;
 for(const [i,x]of(mouseShape?[[1,.12],[2,-.18]]:[[1,.19],[2,-.30]]))joints.push(world.createJoint(RevoluteJoint({enableLimit:true,lowerAngle:i===1?-.5:-1.2,upperAngle:i===1?.5:1.2,collideConnected:false},bodies[0],bodies[i],Vec2((door?door.x:home().x)/L+x,(door?w*.52:home().y)/L))));
 const sync=()=>{const p=origin();sim.shot.setTransform(Vec2(p.x/sim.L,p.y/sim.L),bodies[0].getAngle());sim.shot.setLinearVelocity(Vec2(0,0));sim.shot.setAngularVelocity(0);};
 const clearMouse=()=>{if(mouse)world.destroyJoint(mouse);mouse=null;grab=null;cursor=null;assist=null;};
 // A finite-force grab acts at the picked point. Basket contacts stay solid
 // throughout dragging; releasing never enables overlapping collision shapes.
 // A tail grip carries the whole critter: scale spring stiffness by the
 // carried mass, rather than making the tail artificially heavy to lift it.
 const startGrab=(point,index)=>{const b=bodies[index],p=Vec2(point.x/L,point.y/L);grab={index,local:b.getLocalPoint(p)};cursor={...point};mouse=world.createJoint(MouseJoint({target:p,maxForce:bodies.reduce((sum,body)=>sum+body.getMass(),0)*GRAVITY*30,frequencyHz:6*T*(mouseShape?Math.sqrt(bodies.reduce((sum,body)=>sum+body.getMass(),0)/b.getMass()):1),dampingRatio:.85,collideConnected:false},ground,b));b.setAwake(true);};
 const activity=()=>{lastActivity=clock;forcedUntil=0;};
 const onPedestal=()=>{const p=origin();return !loaded&&!dragging&&!assist&&!falling&&!returning&&Math.abs(p.x-stand.x)<stand.width*.5&&p.y>stand.y-w*.2&&p.y<stand.y+w*1.5;};
 const cues=()=>pedestalCues(clock-lastActivity,{available:onPedestal(),reducedMotion});
 const basketPoint=()=>{const p=target();basket.setTransform(Vec2(p.x/L,p.y/L),0);return p;};
 function observeSupport(){
  const p=origin(),q=target();let contact=false,maxSpeed=0;
  for(const b of bodies){const v=b.getLinearVelocity();maxSpeed=Math.max(maxSpeed,Math.hypot(v.x,v.y)*L/T);for(let edge=b.getContactList();edge;edge=edge.next)if(edge.other===basket&&edge.contact.isTouching())contact=true;}
  const supported=!dragging&&!assist&&contact&&Math.abs(p.x-q.x)<bw*.85&&p.y>q.y-w&&p.y<q.y+Math.max(w,L*.55);
  if(supported&&!loaded){falling=false;activity();}loaded=supported;
 }

 function pick(point,padding=0){
  const p=Vec2(point.x/L,point.y/L);let best=null;
  for(let i=0;i<bodies.length;i++){const b=bodies[i],local=b.getLocalPoint(p),half=(specs[i].b-specs[i].a)/2,ry=w/L*(specs[i].ry??(i===2?.24:.42));const dx=Math.max(0,Math.abs(local.x)-half),dy=Math.max(0,Math.abs(local.y)-ry),distance=Math.hypot(dx,dy)*L;if(distance<=padding+1e-9&&(!best||distance<best.distance))best={index:i,distance};}
  return best;
 }
 const api={
  get assisting(){return !!assist;},get settling(){const p=origin(),q=target();return !loaded&&!dragging&&!returning&&Math.abs(p.x-q.x)<bw+L*.55&&p.y>q.y-w*1.2&&p.y<q.y+depth+Math.max(w,L*.6);},get returning(){return returning;},get walkPhase(){return clock*9;},get loaded(){return loaded;},get dragging(){return dragging;},get falling(){return falling;},get position(){return origin();},get angle(){return bodies[0].getAngle();},get motion(){const v=bodies[0].getLinearVelocity();return{vx:v.x*L/T,vy:v.y*L/T,omega:bodies[0].getAngularVelocity()/T};},get stand(){return{...stand};},get basketShape(){const p=target();return{left:p.x-bw,right:p.x+bw,bottom:p.y+base,rim:p.y+base+depth};},target,home,activity,
  get hint(){return cues().hint;},get hintPhase(){return cues().hintPhase;},get pedestal(){return {...cues(),idle:clock-lastActivity};},
  requestHint(){},
  get animating(){return !!assist||dragging||falling||returning||onPedestal()||api.hint||bodies.some(b=>b.isAwake());},
  get parts(){return specs.map((s,i)=>{const p=bodies[i].getPosition();return{...s,x:p.x*L,y:p.y*L,angle:bodies[i].getAngle()};});},
  get grip(){if(!grab)return null;const p=bodies[grab.index].getWorldPoint(grab.local);return{x:p.x*L,y:p.y*L,part:specs[grab.index].id,cursor:{...cursor}};},
  begin(point=api.position,padding=0){if(sim.phase!=='ready'||dragging)return false;const hit=pick(point,padding);if(!hit)return false;clearMouse();loaded=false;dragging=true;falling=false;returning=false;activity();startGrab(point,hit.index);return true;},
  move(p){if(!dragging||![p.x,p.y].every(Number.isFinite))return;cursor={...p};mouse.setTarget(Vec2(p.x/L,p.y/L));},
  drop(){if(!dragging&&!assist)return false;clearMouse();dragging=false;falling=true;dropTime=clock;activity();return false;},
  // Explicit keyboard assistance follows a physical lift/across/drop path.
  // It never resets a body pose, and the temporary grab is gone before loaded.
  loadKeyboard(){
   if(sim.phase!=='ready'||dragging)return false;clearMouse();loaded=false;returning=false;falling=false;activity();
   let mass=0,x=0,y=0;for(const b of bodies){const m=b.getMass(),p=b.getWorldCenter();mass+=m;x+=p.x*m*L;y+=p.y*m*L;}
   const p={x:x/mass,y:y/mass},q=target(),top=Math.max(p.y,q.y+base+depth+Math.max(L*.65,w*1.2));
   startGrab(p,0);assist={stage:0,quiet:0,points:[{x:p.x,y:top},{x:q.x+(p.x-origin().x),y:top}]};return true;
  },
  prepareLaunch(){observeSupport();if(!loaded)return false;sync();sim.startX=origin().x;return true;},
  cancel(){if(!dragging&&!assist)return;clearMouse();loaded=false;dragging=false;falling=true;dropTime=clock;sync();activity();},
  reset(){clearMouse();dragging=false;loaded=false;falling=false;returning=false;poseAt(home());sync();activity();},
  step(dt){if(sim.phase!=='ready')return false;const oldHint=api.hint;clock+=Math.max(0,dt);
   // Advance only the hand target; gravity, joints and contacts move the critter.
   if(assist){const goal=assist.points[assist.stage],dx=goal.x-cursor.x,dy=goal.y-cursor.y,d=Math.hypot(dx,dy),step=Math.min(d,8*Math.sqrt(L)*Math.min(.06,Math.max(0,dt)));if(d>0){cursor.x+=dx/d*step;cursor.y+=dy/d*step;}mouse.setTarget(Vec2(cursor.x/L,cursor.y/L));const actual=api.grip;
    if(d<1e-7&&Math.hypot(actual.x-goal.x,actual.y-goal.y)<Math.max(.012,L*.04)){
     if(assist.stage===0)assist.stage=1;
     else {const motion=api.motion;assist.quiet=Math.hypot(motion.vx,motion.vy)<.15*Math.sqrt(L)&&Math.abs(motion.omega)<.4?assist.quiet+Math.max(0,dt):0;if(assist.quiet>.2){clearMouse();falling=true;dropTime=clock;}}
    }
   }

   const desired=target(),bp=basket.getPosition(),basketMoving=Math.hypot(bp.x*L-desired.x,bp.y*L-desired.y)>1e-8;
   const awake=dragging||falling||basketMoving||bodies.some(b=>b.isAwake());accumulator+=awake?Math.min(.06,Math.max(0,dt)):0;let changed=false;
   const steps=Math.floor(accumulator/(1/120));
   if(steps){const duration=steps/120/T;basket.setLinearVelocity(Vec2((desired.x/L-bp.x)/duration,(desired.y/L-bp.y)/duration));}
   while(accumulator>=1/120){world.step(1/120/T,mouseShape?40:14,mouseShape?20:10);accumulator-=1/120;changed=true;}
   basket.setLinearVelocity(Vec2(0,0));
   const wasLoaded=loaded;observeSupport();
   if(loaded)returning=false;
   if(!dragging&&!loaded){const p=origin();
    const onGround=bodies.some(b=>{for(let e=b.getContactList();e;e=e.next)if(e.other===ground&&e.contact.isTouching())return true;return false;});
    if(falling&&clock-dropTime>.45&&onGround){falling=false;returning=true;returnAt=clock;}
    if(returning){
     const dx=home().x-p.x,arrivalAge=clock-returnAt,pace=Math.max(.12,Math.min(1.2,L*1.5)),ease=Math.max(0,Math.min(1,(arrivalAge-.55)/.9)),speed=pace*ease*ease*(3-2*ease),vx=Math.max(-speed,Math.min(speed,dx*3));
     // Active walking is confined to preparation. Ground contacts carry the
     // critter; a small jump clears the pedestal edge without teleporting it.
     const near=Math.abs(dx)<stand.width*.5+L*.8;
     const hop=arrivalAge>.75&&near&&p.y<stand.y+w*.2&&onGround&&clock-hopAt>.6;
     if(hop)hopAt=clock;
     for(const body of bodies){const v=body.getLinearVelocity();body.setLinearVelocity(Vec2(vx*T/L,hop?Math.sqrt(2*GRAVITY*(stand.y+w+L*.2))*T/L:v.y));}
     const body=bodies[0],angle=Math.atan2(Math.sin(body.getAngle()),Math.cos(body.getAngle()));
     body.setAngularVelocity(Math.max(-5,Math.min(5,-angle*8))*T);
     if(Math.abs(dx)<Math.min(stand.width*.2,Math.max(.025,L*.14))&&p.y>stand.y&&onGround){returning=false;falling=false;activity();}
     changed=true;
    }
   }
   // A small preparation-only hop uses the existing bodies and contacts. It
   // never alters a supported basket pose or supplies any launch energy.
   if(onPedestal()){const p=origin(),dx=home().x-p.x,body=bodies[0],angle=Math.atan2(Math.sin(body.getAngle()),Math.cos(body.getAngle()));if(Math.abs(angle)>.08){body.setAngularVelocity(Math.max(-2,Math.min(2,-angle*3))*T);changed=true;}
    // Walking back to the middle during the tiny hops prevents asymmetric
    // head/tail contacts from ratcheting a volunteer off the pedestal. The
    // bodies keep their real poses, vertical motion and contact constraints.
    if(Math.abs(dx)>L*.025){const vx=Math.max(-L*.2,Math.min(L*.2,dx*1.5));for(const b of bodies){const v=b.getLinearVelocity();b.setLinearVelocity(Vec2(vx*T/L,v.y));}changed=true;}
   }
   if(cues().hop&&clock-idleHopAt>1){idleHopAt=clock;const lift=Math.sqrt(2*GRAVITY*Math.min(.035,w*.16));for(const body of bodies){const v=body.getLinearVelocity();body.setLinearVelocity(Vec2(v.x,lift*T/L));}changed=true;}
   if(wasLoaded!==loaded)changed=true;
   sync();return changed||oldHint!==api.hint;
  },
 };basketPoint();sync();return api;
}
