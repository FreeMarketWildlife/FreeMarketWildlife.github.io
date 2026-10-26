/** The camera changes presentation only: one metre always uses the same scale
 * for the rig, projectile and terrain. Release framing eases into payload follow. */
export function groveSetupCamera(c,{width,height,preview=false,counterRadius=0,door=null,originX=0}={}){
 const W=Math.max(160,width),H=Math.max(120,height);
 const rigHeight=Math.max(1,c.pivotHeight+c.shortArm+counterRadius);
 if(preview){
  const wide=Math.max(c.troughLength*1.15,c.longArm+c.shortArm+c.baseWidth*.5,3.5);
  const scale=Math.min(W*.87/wide,H*.64/rigHeight);
  return{x:-c.troughLength*.2,y:H*.22/scale,scale};
 }
 // Fit the mechanism, left stand and sling inside the area between HUD and dock.
 const rigMinX=originX-Math.max(c.longArm*.92,c.baseWidth*.9)-Math.max(.18,c.pouchWidth*.8),maxX=originX+Math.max(c.baseWidth*.85,c.shortArm+counterRadius);
 const minX=door?Math.min(rigMinX,door.x-door.width):rigMinX;
 const high=Math.max(c.pivotHeight+c.longArm*Math.sin(1),c.pivotHeight+c.shortArm+counterRadius,door?.height??0);
 const scale=Math.min(H*(door ? .58 : .50)/high,W*(door ? .80 : .90)/(maxX-minX));
 // Ground sits just above the bottom dock; the arm has room below the HUD.
 return{x:door?minX+W*.38/scale:(minX+maxX)/2,y:(H*.5-H*.77)/-scale,scale};
}
const FOLLOW_ACQUIRE_SECONDS=.55;
const ease=t=>t*t*(3-2*t),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
/** Keep the real sling payload in view before the pin opens. The setup lens
 * stays fixed while its initial screen offset eases away, so the camera is
 * already travelling with the volunteer when flight framing takes over. */
export function groveSwingCamera(previous,payload,{width,height,dt=1/60,reducedMotion=false}={}){
 if(![payload.x,payload.y,previous.x,previous.y,previous.scale,width,height].every(Number.isFinite)||previous.scale<=0||width<=0||height<=0)throw Error('Finite swing camera and positive dimensions required.');
 const step=Number.isFinite(dt)?clamp(dt,0,.1):0,prior=previous.swingAcquisition;
 const acquisition=prior?{...prior,age:Math.min(FOLLOW_ACQUIRE_SECONDS,prior.age+step)}:{
  age:0,x:(previous.x-payload.x)*previous.scale/width,y:(previous.y-payload.y)*previous.scale/height
 };
 const remaining=reducedMotion?0:1-ease(acquisition.age/FOLLOW_ACQUIRE_SECONDS);
 return{x:payload.x+acquisition.x*remaining*width/previous.scale,y:payload.y+acquisition.y*remaining*height/previous.scale,scale:previous.scale,swingAcquisition:reducedMotion?{...acquisition,age:FOLLOW_ACQUIRE_SECONDS}:acquisition};
}
// Exact bounded exponential response: the same elapsed time gives the same
// lead at 30 or 120 Hz, including the rate-limited part of a large handoff.
function approachLead(value,target,dt){
 const delta=target-value,distance=Math.abs(delta),threshold=.7/4.5;
 if(distance<=threshold)return value+delta*(1-Math.exp(-dt*4.5));
 const linearTime=(distance-threshold)/.7;
 return dt<=linearTime?value+Math.sign(delta)*.7*dt:target-Math.sign(delta)*threshold*Math.exp(-(dt-linearTime)*4.5);
}
export function groveFlightCamera(previous,payload,{width,height,animalLength,hitboxLongestSide,dt=1/60,reducedMotion=false,landing=null}={}){
 const hitboxFraming=hitboxLongestSide!==undefined;
 if(hitboxFraming)animalLength=hitboxLongestSide;
 if(![payload.x,payload.y,animalLength,width,height].every(Number.isFinite)||animalLength<=0||width<=0||height<=0)throw Error('Finite camera dimensions and positive animal length required.');
 // Finish this frame's sling tracking before starting the flight handoff.
 // Holding the previous camera at pin release would create a one-frame stall.
 if(previous.swingAcquisition)previous=groveSwingCamera(previous,payload,{width,height,dt,reducedMotion});
 // Use travel measured in viewports per second, so a mouse and a whale get the
 // same framing response without changing their physical sizes or velocities.
 const viewportSpan=Math.min(height,width);
 const bodyFraction=hitboxFraming ? .12 : .085;
 const baseScale=viewportSpan*bodyFraction/animalLength;
 const vx=Number.isFinite(payload.vx)?payload.vx:0,vy=Number.isFinite(payload.vy)?payload.vy:0;
 const screenVx=vx*baseScale/width,screenVy=vy*baseScale/height,speed=Math.hypot(screenVx,screenVy);
 // Hitbox framing holds a fixed screen footprint regardless of speed or pose.
 // Legacy length-only callers retain their speed-responsive lens.
 const size=hitboxFraming ? .12 : .10-.015*ease(clamp((speed-.3)/1.7,0,1));
 // Briefly open the lens for an imminent landing. Keep a readable body and
 // both regions in one physical transform; no inset, arrow or future route.
 const validLanding=landing&&[landing.x,landing.y,landing.eta].every(Number.isFinite)&&landing.eta>=0&&landing.eta<=.65;
 const step=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0,minDimension=Math.min(width,height);
 const dx=validLanding?landing.x-payload.x:0,dy=validLanding?landing.y-payload.y:0;
 const contextSize=validLanding&&!hitboxFraming?Math.min(size,Math.max(.067,Math.min(width*.60/(Math.abs(dx)+animalLength*2),height*.50/(Math.abs(dy)+animalLength*2))*animalLength/minDimension)):size;
 const oldLens=previous.followLens??{size,hold:0},lens={size:oldLens.size,hold:Math.max(0,oldLens.hold-step)};
 // An approaching face can open the lens, but never close it on every frame as
 // distance shrinks. Keep that local framing through the rebound and nearby next
 // approach; small forecast changes do not restart a visible zoom cycle.
 if(step>0&&validLanding){lens.hold=1.65;if(contextSize<lens.size*.96)lens.size=contextSize;}
 else if(step>0&&lens.hold===0){const recovery=1-Math.exp(-step*.85);lens.size=Math.exp(Math.log(lens.size)*(1-recovery)+Math.log(size)*recovery);}
 const target=minDimension*lens.size/animalLength;
 const priorScale=Number.isFinite(previous.scale)&&previous.scale>0?previous.scale:target;
 // A forecast can briefly switch faces around a joint or disappear between
 // samples. Confirm a new ID before handing off and bridge only a tenth of a
 // second of missing data; this never extends the forecast's local horizon.
 const oldFocus=previous.followLanding,focus=oldFocus?{...oldFocus}:null;
 let landingFocus=focus;
 if(step>0&&validLanding){
  if(!focus||focus.missing>.10)landingFocus={id:landing.id,x:landing.x,y:landing.y,eta:landing.eta,missing:0,candidate:null,candidateAge:0};
  else if(focus.id===landing.id){Object.assign(focus,{x:landing.x,y:landing.y,eta:landing.eta,missing:0,candidate:null,candidateAge:0});}
  else{focus.missing+=step;focus.candidateAge=focus.candidate===landing.id?focus.candidateAge+step:step;focus.candidate=landing.id;if(focus.candidateAge>=.08)landingFocus={id:landing.id,x:landing.x,y:landing.y,eta:landing.eta,missing:0,candidate:null,candidateAge:0};}
 }else if(step>0&&focus){focus.missing+=step;if(focus.missing>.10)landingFocus=null;}
 // Keep the volunteer at its release-frame screen position while the lens opens,
 // then ease into travel framing. Tracking its actual position immediately avoids
 // permanent chase lag; presentation offsets never assign a physics transform.
 const prior=previous.followAcquisition;
 const acquisition=prior?{...prior,age:Math.min(FOLLOW_ACQUIRE_SECONDS,prior.age+step)}:{
  age:0,
  x:((Number.isFinite(previous.x)?previous.x:payload.x)-payload.x)*priorScale/width,
  y:((Number.isFinite(previous.y)?previous.y:payload.y)-payload.y)*priorScale/height
 };
 if(reducedMotion)return{x:payload.x,y:payload.y,scale:baseScale,followAcquisition:{...acquisition,age:FOLLOW_ACQUIRE_SECONDS},followMotion:{x:0,y:0},followLens:{size:bodyFraction,hold:0},followLanding:null};
 // A bounded, eased lead reveals the next branch in the travel direction. Smooth
 // the offset rather than body velocity so a rebound cannot jerk the camera or
 // let the animal slide out of frame while tracking catches up.
 const oldMotion=previous.followMotion??{x:0,y:0};
 const travelX=.17*Math.tanh(screenVx*.24/.17),travelY=.10*Math.tanh(screenVy*.16/.10);
 const leadX=landingFocus?clamp((landingFocus.x-payload.x)*target/width*.60,-.24,.24):travelX;
 const leadY=landingFocus?clamp((landingFocus.y-payload.y)*target/height*.60,-.24,.16):travelY;
 // A suddenly different forecast cannot pan faster than .7 of a viewport/sec.
 const motion={x:approachLead(oldMotion.x,leadX,step),y:approachLead(oldMotion.y,leadY,step)};
 // Log interpolation handles the full mouse-to-whale range without a scale pop.
 const mix=1-Math.exp(-step*(target<priorScale?7:1.5));
 const scale=step===0?priorScale:Math.exp(Math.log(priorScale)*(1-mix)+Math.log(target)*mix);
 const blend=ease(acquisition.age/FOLLOW_ACQUIRE_SECONDS),remaining=1-blend;
 return{x:payload.x+(acquisition.x*remaining+motion.x*blend)*width/scale,y:payload.y+(acquisition.y*remaining+motion.y*blend)*height/scale,scale,followAcquisition:acquisition,followMotion:motion,followLens:lens,followLanding:landingFocus};
}
export function groveProject(point,camera,width,height){return{x:width/2+(point.x-camera.x)*camera.scale,y:height/2-(point.y-camera.y)*camera.scale};}
export function groveOverviewBounds(map){
 const t=map.tree,r=t.crownRadius??t.trunkWidth*3.6;
 if(map.version===4){
  const radius=Math.max(r,t.trunkWidth*.5),padX=Math.max(3,radius*.10),padY=Math.max(4,t.height*.08);
  return{minX:t.trunkX-radius-padX,maxX:t.trunkX+radius+padX,minY:-map.launch.y-padY,maxY:t.height-map.launch.y+padY};
 }
 // Saved giant-tree worlds retain their original overview and navigation.
 return{minX:t.trunkX-r-40,maxX:Math.max(220,t.trunkX+r+40),minY:-map.launch.y-30,maxY:t.height-map.launch.y+55};
}
export function groveTreeCamera(map,{width,height}){
 const {minX,maxX,minY,maxY}=groveOverviewBounds(map);
 return{x:(minX+maxX)/2,y:(minY+maxY)/2,scale:Math.min(Math.max(160,width)*.9/(maxX-minX),Math.max(120,height)*.84/(maxY-minY))};
}
