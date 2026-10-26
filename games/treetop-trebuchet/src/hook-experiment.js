// Isolated planar contact-release experiments, NOT closed 3D ring-on-pin models.
// The open C-link remains weak/sensitive; the finite channel is more useful in bounded tests.
// Both remain optional research modes, without calibrated-realism claims.
import * as P from '../vendor/planck/planck.mjs';
import {CritterScene} from './articulated.js?v=71-trebuchet';
import {stageInitialVolunteer} from './staging.js?v=71';
const V=P.Vec2;
export function makeCLink(world,position,angle=0,options={}){
 const radius=options.radius??.075,wire=options.wire??.022,span=options.span??130,mass=options.mass??.04;
 if(![position.x,position.y,angle,radius,wire,span,mass].every(Number.isFinite)||radius<.06||radius>.15||wire<.015||wire>.03||span<90||span>140||mass<.01||mass>.2)throw new Error('Invalid planar C-link geometry');
 if(2*radius*Math.sin((180-span)*Math.PI/180)-2*wire<.06)throw new Error('C-link mouth cannot clear the 0.05 m peg with contact margin');
 if(radius-wire<.036)throw new Error('Insufficient initial peg clearance');
 // Adjacent beads overlap even at supported geometry extremes: no unintended exit gaps.
 const step=Math.min(18*Math.PI/180,2*Math.asin(.8*wire/radius));
 const segments=Math.ceil(2*span*Math.PI/180/step);
 const b=world.createDynamicBody({position,angle,bullet:true});b.setUserData({role:'hooklink',id:'open-C-link'});
 for(let i=0;i<=segments;i++){const a=(-span+i*2*span/segments)*Math.PI/180;b.createFixture(P.Circle(V(radius*Math.cos(a),radius*Math.sin(a)),wire),{density:1,friction:.08,restitution:0,filterCategoryBits:128,filterMaskBits:64});}
 const m={center:V()};b.getMassData(m);b.setMassData({mass,center:m.center,I:m.I*mass/m.mass});return b;
}
export class PhysicalHookScene extends CritterScene {
 constructor(overrides={},species='lizard',saved=null){
  if(overrides.stoppedSplitPouch!==undefined&&typeof overrides.stoppedSplitPouch!=='boolean')throw new Error('Invalid stopped split pouch option');
  if(overrides.pouchPanelMass!==undefined&&(!Number.isFinite(overrides.pouchPanelMass)||overrides.pouchPanelMass<.05||overrides.pouchPanelMass>2))throw new Error('Pouch panel mass outside 0.05–2 kg domain');
  if(overrides.pouchPanelMass!==undefined&&!overrides.stoppedSplitPouch&&!overrides.hingedPouch)throw new Error('Panel mass requires a split pouch');
  if(overrides.splitHalfAngle!==undefined&&(!Number.isFinite(overrides.splitHalfAngle)||overrides.splitHalfAngle<Math.PI/36||overrides.splitHalfAngle>7*Math.PI/36))throw new Error('Split pouch half angle outside 5–35 degree domain');
  if(overrides.hingedPouch!==undefined&&typeof overrides.hingedPouch!=='boolean')throw new Error('Invalid hinged pouch option');
  if(overrides.releaseHardware!==undefined&&!['c-link','channel'].includes(overrides.releaseHardware))throw new Error('Unknown physical release hardware');
  super(overrides,species,saved);this.releaseMode='physical-hook';this.hookOpen=false;this.freeDuration=0;
  if(saved){for(let b=this.world.getBodyList();b;b=b.getNext())if(b.getUserData()?.role==='hooklink')this.link=b;this.hookOpen=saved.hookOpen??false;this.freeDuration=saved.freeDuration??0;for(let b=this.world.getBodyList();b;b=b.getNext())if(b.getUserData()?.role==='pouchflap')this.flap=b;for(let j=this.world.getJointList();j;j=j.getNext())if(j.getUserData()?.role==='pouchhinge')this.pouchHinge=j;return;}
  for(const rope of this.ropes)this.world.destroyJoint(rope);this.ropes=[];
  if(this.p.hingedPouch||this.p.stoppedSplitPouch){
   // Two rigid contact panels sharing a free hinge approximate a folding pouch.
   // All construction edits occur before simulation; release removes no material.
   for(let f=this.pouch.getFixtureList();f;){const next=f.getNext();this.pouch.destroyFixture(f);f=next;}
   const beta=this.p.stoppedSplitPouch?(this.p.splitHalfAngle??Math.PI/9):0;
   const origin={...this.pouch.getPosition()},hinge=V(origin.x,origin.y-.19);
   // Construction geometry only: shared world hinge, no initial anchor mismatch.
   if(beta)this.pouch.setTransform(V(hinge.x+.19*Math.sin(beta),hinge.y+.19*Math.cos(beta)),-beta);
   const material={density:1,friction:.15,restitution:.05,filterCategoryBits:2,filterMaskBits:21};
   this.pouch.createFixture(P.Box(.4,.035,V(-.4,-.19)),material);this.pouch.createFixture(P.Box(.035,.19,V(-.8,0)),material);
   this.flap=this.world.createDynamicBody({position:V(hinge.x-.19*Math.sin(beta),hinge.y+.19*Math.cos(beta)),angle:beta,bullet:true});this.flap.setUserData({role:'pouchflap',id:'right-panel'});
   this.flap.createFixture(P.Box(.4,.035,V(.4,-.19)),material);this.flap.createFixture(P.Box(.035,.19,V(.8,0)),material);
   // Explicit physical hardware mass. Preserve each panel's fixture-derived COM
   // and scale its inertia with mass; legacy density=1 remains the default.
   if(this.p.pouchPanelMass!==undefined)for(const panel of[this.pouch,this.flap]){const data={center:V()};panel.getMassData(data);panel.setMassData({mass:this.p.pouchPanelMass,center:data.center,I:data.I*this.p.pouchPanelMass/data.mass});}
   this.pouchHinge=this.world.createJoint(new P.RevoluteJoint({bodyA:this.pouch,bodyB:this.flap,localAnchorA:V(0,-.19),localAnchorB:V(0,-.19),referenceAngle:2*beta,enableLimit:!!this.p.stoppedSplitPouch,lowerAngle:-Math.PI,upperAngle:0,collideConnected:false}));
   this.pouchHinge.setUserData({role:'pouchhinge',id:this.p.stoppedSplitPouch?'stopped-V':'free-fold',halfAngle:beta});
  }
  const alpha=this.p.hookAngle??3.4; if(!Number.isFinite(alpha))throw new Error('Invalid hook angle');
  const pegLocal=V(this.p.longArm+.14*Math.cos(alpha),.14*Math.sin(alpha)),peg=this.arm.getWorldPoint(pegLocal);
  if(this.p.releaseHardware==='channel'){
   // Finite open-ended contact channel: closed heel, two rails, a sliding bead.
   // This is a planar clevis abstraction, not a ring/pin or hidden release constraint.
   const length=this.p.channelLength??.22;if(!Number.isFinite(length)||length<.12||length>.5)throw new Error('Invalid channel length');
   const point=(x,y)=>V(pegLocal.x+x*Math.cos(alpha)-y*Math.sin(alpha),pegLocal.y+x*Math.sin(alpha)+y*Math.cos(alpha));
   const metal={density:.2,friction:.03,restitution:0,filterCategoryBits:64,filterMaskBits:128};
   for(const y of[-.05,.05])this.arm.createFixture(P.Box(length/2,.015,point(length/2,y),alpha),metal);
   this.arm.createFixture(P.Box(.015,.065,point(-.015,0),alpha),metal);
   this.link=this.world.createDynamicBody({position:this.arm.getWorldPoint(point(.04,0)),bullet:true});
   this.link.createFixture(P.Circle(.025),{density:.04/(Math.PI*.025**2),friction:.03,restitution:0,filterCategoryBits:128,filterMaskBits:64});
   this.link.setUserData({role:'hooklink',id:'channel-bead',channelAlpha:alpha,channelLength:length,beadRadius:.025,pegLocal:{x:pegLocal.x,y:pegLocal.y}});
  }else{
   this.arm.createFixture(P.Circle(pegLocal,.025),{density:.2,friction:.08,restitution:0,filterCategoryBits:64,filterMaskBits:128});
   this.link=makeCLink(this.world,peg,this.arm.getAngle()+alpha,{span:this.p.hookSpan??130});this.link.setUserData({role:'hooklink',id:'open-C-link',pegLocal:{x:pegLocal.x,y:pegLocal.y}});
  }
  // Attach the strap to solid material at the arc end, not an imaginary point in the hole.
  const attachmentAngle=this.p.hookAttachmentAngle??-(this.p.hookSpan??130);
  if(!Number.isFinite(attachmentAngle)||Math.abs(attachmentAngle)>(this.p.hookSpan??130))throw new Error('Attachment must lie on the solid C-link arc');
  const attachment=this.p.releaseHardware==='channel'?V():V(.075*Math.cos(attachmentAngle*Math.PI/180),.075*Math.sin(attachmentAngle*Math.PI/180)),linkAnchor=this.link.getWorldPoint(attachment);
  const freePanel=this.flap??this.pouch,armAnchor=this.arm.getWorldPoint(V(this.p.longArm,0)),strandLength=Math.hypot(this.p.sling,.65);
  if(this.p.stoppedSplitPouch){
   // Use equal nominal strand hardware lengths. Translate the whole V to the lower
   // intersection of the two endpoint-distance circles before any simulation.
   const hinge=this.pouch.getWorldPoint(V(0,-.19));
   // Match anchor height difference to the hardware support height difference.
   // This constructs equal-drop strands without starting a large pendulum swing.
   const l0=this.pouch.getWorldPoint(V(-.65,0)),r0=freePanel.getWorldPoint(V(.65,0)),span=r0.x-l0.x;
   if(Math.abs(linkAnchor.y-armAnchor.y)>=span)throw new Error('Stopped V support height exceeds anchor span');
   const tilt=Math.asin((linkAnchor.y-armAnchor.y)/span),ct=Math.cos(tilt),st=Math.sin(tilt);
   for(const panel of[this.pouch,this.flap]){const q=panel.getPosition(),x=q.x-hinge.x,y=q.y-hinge.y;panel.setTransform(V(hinge.x+x*ct-y*st,hinge.y+x*st+y*ct),panel.getAngle()+tilt);}
   const left=this.pouch.getWorldPoint(V(-.65,0)),right=freePanel.getWorldPoint(V(.65,0));
   const A=V(armAnchor.x-left.x+hinge.x,armAnchor.y-left.y+hinge.y),B=V(linkAnchor.x-right.x+hinge.x,linkAnchor.y-right.y+hinge.y);
   const dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy);
   if(d<1e-8||d>=2*strandLength)throw new Error('Stopped V cannot fit equal strand lengths');
   const mx=(A.x+B.x)/2,my=(A.y+B.y)/2,h=Math.sqrt(strandLength**2-d*d/4),nx=-dy/d,ny=dx/d;
   const sign=ny>0?-1:1,target=V(mx+sign*h*nx,my+sign*h*ny);
   if(target.y-.05<294.02)throw new Error('Stopped V floor intersects support branch');
   const shift=V(target.x-hinge.x,target.y-hinge.y);
   for(const panel of[this.pouch,this.flap]){const q=panel.getPosition();panel.setTransform(V(q.x+shift.x,q.y+shift.y),panel.getAngle());}
   for(const panel of[this.pouch,this.flap])for(let f=panel.getFixtureList();f;f=f.getNext()){const bounds=new P.AABB();f.getShape().computeAABB(bounds,panel.getTransform(),0);if(bounds.lowerBound.y<294.02)throw new Error('Stopped V material intersects support branch');}
  }
  const fixed=this.world.createJoint(new P.RopeJoint({bodyA:this.arm,bodyB:this.pouch,localAnchorA:V(this.p.longArm,0),localAnchorB:V(-.65,0),maxLength:strandLength,collideConnected:false}));fixed.setUserData({role:'rope',id:0});
  const anchor=freePanel.getWorldPoint(V(.65,0)),length=this.p.stoppedSplitPouch?strandLength:Math.hypot(linkAnchor.x-anchor.x,linkAnchor.y-anchor.y);
  const free=this.world.createJoint(new P.RopeJoint({bodyA:this.link,bodyB:freePanel,localAnchorA:attachment,localAnchorB:V(.65,0),maxLength:length,collideConnected:false}));free.setUserData({role:'rope',id:1});
  this.ropes=[fixed,free];this.rope=fixed;this.initialStaging=stageInitialVolunteer(this);
 }
 snapshot(){return {...super.snapshot(),hookOpen:this.hookOpen,freeDuration:this.freeDuration};}
 clone(){return new PhysicalHookScene(this.p,this.rig.id,this.snapshot());}
 pouchOpening(){return this.pouchHinge?-this.pouchHinge.getJointAngle():null;}
 hardwareHasEscaped(){
  const tag=this.link.getUserData(),peg=this.arm.getWorldPoint(tag.pegLocal),bead=this.link.getPosition();
  if(tag.id==='channel-bead'){const local=this.arm.getLocalPoint(bead),dx=local.x-tag.pegLocal.x,dy=local.y-tag.pegLocal.y;
   return dx*Math.cos(tag.channelAlpha)+dy*Math.sin(tag.channelAlpha)>tag.channelLength+tag.beadRadius;}
  return Math.hypot(peg.x-bead.x,peg.y-bead.y)>.22;
 }
 step(dt=1/600){super.step(dt);
  this.hookOpen=this.hardwareHasEscaped();
  if(this.phase!=='launching'){this.freeDuration=0;return;}
  // A payload can leave over the rim while the link remains on its peg.
  // Link departure is diagnostic, not a prerequisite for observing genuine separation.
  // Observe loss of payload support; never destroy a strap or disable contact.
  let touching=false;for(const part of this.parts)for(let edge=part.getContactList();edge;edge=edge.next)if((edge.other===this.pouch||edge.other===this.flap) && edge.contact.isTouching())touching=true;
  const c=this.center(),cup=this.pouch.getPosition(),away=Math.hypot(c.x-cup.x,c.y-cup.y)>.7;
  this.freeDuration=!touching&&away?this.freeDuration+dt:0;
  if(this.freeDuration>=.01-1e-12){this.phase='flight';this.release={time:this.elapsed,center:c,parts:this.parts.map(b=>({id:b.getUserData().id,p:{...b.getPosition()},v:{...b.getLinearVelocity()},w:b.getAngularVelocity()}))};this.events.push({type:'launch'});}
 }
 predict(){if(this.phase!=='loading'||this.hand||this.control||!this.isLoaded())return null;const clone=this.clone(),points=[];clone.unlatch();for(let i=0;i<3000&&!clone.release;i++)clone.step();if(!clone.release)return {points,reason:'hook did not release'};
 points.push(clone.center());for(let i=0;i<480;i++){clone.step();if(clone.events.some(e=>e.type==='impact'))break;if(i%30===0)points.push(clone.center());}return {points,release:clone.release,reason:'contact hook experiment'};
 }
}
