import{drawLoadingContacts}from'./loading-contact-art.js?v=70';
import {drawFixedObstacles} from './fixed-obstacles.js?v=70';
import {encounterAnimationState} from './encounter-state.js?v=70';
import {drawMechanismDetails} from './mechanism-art.js?v=70-trebuchet';
import {drawGripTether} from './grip-art.js?v=70';
import {terrainApproaches} from './terrain-cues.js?v=70';
import {surfaceY} from './terrain.js?v=70';
import {drawSurfaceTrim} from './surface-art.js?v=70';
import {PICKUP_RADIUS_CSS} from './pickup.js?v=70';
import {approachCues,payloadWarningRadius} from './approach-cues.js?v=70';
import {drawSpeciesMarkings} from './species-art.js?v=70';
import {biomeAt,atmosphereAt} from './journey.js?v=70-trebuchet';
import {createFlightCamera} from './camera.js?v=70';
import {world as layout} from './world.js?v=70';
import {drawScenery,drawFace,drawEncounterDetails} from './scenery.js?v=70';
export function viewportFor(width,height=Infinity){return width<=650&&height>=width?{width:480,height:600,portrait:true,originX:240,originY:560}:{width:960,height:480,portrait:false,originX:260,originY:440};}
export function pointerWorld(point,bounds,viewport){
 if(![point.clientX,point.clientY,bounds.left,bounds.top,bounds.width,bounds.height].every(Number.isFinite)||bounds.width<=0||bounds.height<=0)return null;
 const x=(point.clientX-bounds.left)*viewport.width/bounds.width,y=(point.clientY-bounds.top)*viewport.height/bounds.height;
 return {x:(x-viewport.originX)/45,y:294+(viewport.originY-y)/45};}
export function createRenderer(canvas){const ctx=canvas.getContext('2d');let viewport=viewportFor(1000),camera=createFlightCamera(),cameraScene=null,lastTime=0,wasFlying=false,approachNotice='',lastCssWidth=0,lastCssHeight=0,cueScale=1,cssPixelsPerMetre=45;
 const line=(a,b,color,width=3)=>{ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();};
 const dot=(p,r,color)=>{ctx.beginPath();ctx.fillStyle=color;ctx.arc(...p,r,0,Math.PI*2);ctx.fill();};
 function body(scene,b,transform,scale,motion=0,includeStatic=false){const tag=b.getUserData(),role=tag?.role,position=b.getWorldCenter(),velocity=b.getLinearVelocity(),state=role==='enemy'?encounterAnimationState({time:scene.elapsed,lastContact:tag.lastContact,player:scene.center(),enemy:{x:position.x,y:position.y,vx:velocity.x,vy:velocity.y},radius:tag.radius??b.getFixtureList().getShape().getRadius()}):'idle';if(role==='static'&&!includeStatic)return;
  if(role==='enemy'&&b.getUserData().shape==='skid'){const p=transform(b.getWorldCenter()),d=b.getUserData();drawEncounterDetails(ctx,{x:p[0],y:p[1],size:d.radius*scale,shape:d.shape,kind:d.kind,color:d.color,angle:-b.getAngle(),state});return;}
  for(let f=b.getFixtureList();f;f=f.getNext()){const s=f.getShape(),color=role==='static'?'#675337':role==='arm'&&scene.p.woodKind&&!f.getUserData()&&!(f.getFilterCategoryBits()&64)?({oak:'#936039',pine:'#c79859',heavy:'#64462e'}[scene.p.woodKind]):role==='arm'&&(f.getFilterCategoryBits()&64)?'#bca45d':role==='part'?scene.rig.color:role==='pouch'?'#71988b':role==='pouchflap'?'#78a3b6':role==='frame'?'#92724a':role==='hooklink'?'#d0b35e':role==='enemy'?b.getUserData().color:'#594936';ctx.fillStyle=f.getUserData()?.role==='counterweight'?({rock:'#777d70',basket:'#a47a48',iron:'#515c63'}[scene.p.counterKind]):tag?.geometry==='dome'&&f.getUserData()?.part==='stem'?'#dcc8a0':color;
   if(s.getType()==='circle'){dot(transform(b.getWorldPoint(s.getCenter())),s.getRadius()*scale,color);if(role==='part'||role==='enemy'){ctx.strokeStyle='#344b38';ctx.lineWidth=role==='enemy'?1.5:1.1;ctx.stroke();}}
   else if(s.getType()==='polygon'){const points=s.m_vertices.map(v=>transform(b.getWorldPoint(v)));ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fill();ctx.strokeStyle='#344b38';ctx.lineWidth=1.1;ctx.stroke();}
  }
  if(role==='part'){const profile=scene.rig.bodies.find(p=>p.id===b.getUserData().id),p=transform(b.getPosition());drawSpeciesMarkings(ctx,{species:scene.rig.id,part:profile.id,shape:profile.shape,x:p[0],y:p[1],angle:-b.getAngle(),scale});}
  if(role==='enemy'&&tag.geometry==='dome'){const p=transform(b.getWorldPoint(tag.capCenter)),r=tag.radius*scale;ctx.save();ctx.translate(...p);ctx.rotate(-b.getAngle());
   // Spots and a cap sheen stay inside the actual mushroom cap fixture.
   ctx.save();const cap=b.getFixtureList();let capFixture=cap;while(capFixture&&capFixture.getUserData()?.part!=='cap')capFixture=capFixture.getNext();
   if(capFixture){ctx.beginPath();const points=capFixture.getShape().m_vertices.map(v=>({x:(v.x-tag.capCenter.x)*scale,y:-(v.y-tag.capCenter.y)*scale}));ctx.moveTo(points[0].x,points[0].y);for(const q of points.slice(1))ctx.lineTo(q.x,q.y);ctx.closePath();ctx.clip();for(const [dx,dy,rx]of [[-.38,-.25,.14],[.2,-.42,.11],[.48,-.05,.12]]){ctx.beginPath();ctx.ellipse(dx*r,dy*r,rx*r,rx*r*.65,-.2,0,Math.PI*2);ctx.fillStyle='#f9e7c1';ctx.fill();}ctx.beginPath();ctx.ellipse(-.22*r,-.46*r,.23*r,.055*r,-.35,0,Math.PI*2);ctx.fillStyle='#ffeacb';ctx.fill();}ctx.restore();ctx.fillStyle='#344b38';ctx.strokeStyle='#344b38';ctx.lineWidth=Math.max(1,r*.035);for(const x of [-.12,.12]){ctx.beginPath();if(state==='post'){ctx.moveTo((x-.04)*r,0);ctx.lineTo((x+.04)*r,0);ctx.stroke();}else{ctx.arc(x*r,0,r*(state==='pre'?.05:.035),0,Math.PI*2);ctx.fill();}}ctx.restore();return;}
  if(role==='enemy'){const p=transform(b.getWorldCenter()),f=b.getFixtureList();drawEncounterDetails(ctx,{x:p[0],y:p[1],size:(b.getUserData().radius??f.getShape().getRadius())*scale,shape:b.getUserData().shape,kind:b.getUserData().kind,color:b.getUserData().color,angle:-b.getAngle(),motion,state});}
  if(role==='part'&&b.getUserData().id==='head'){const p=transform(b.getPosition()),profile=scene.rig.bodies.find(p=>p.id==='head');drawFace(ctx,{x:p[0],y:p[1],angle:-b.getAngle(),size:Math.max(3,(profile.shape.radius??.1)*scale),species:scene.rig.id,color:scene.rig.color});}
 }
 function drawFlightHud(scene,c,panel,biome,contactLabel){
  ctx.save();ctx.fillStyle='rgba(250,245,219,.88)';ctx.fillRect(panel.x+8,panel.y+8,Math.min(panel.w-16,360),52);
  drawFace(ctx,{x:panel.x+27,y:panel.y+28,size:11,species:scene.rig?.id,color:scene.rig?.color});
  ctx.fillStyle='#273f35';ctx.font='bold 15px system-ui';ctx.fillText(`${scene.rig?.label??'Volunteer'} • ${biome.label}`,panel.x+47,panel.y+29);
  ctx.font='12px system-ui';ctx.fillText(scene.phase==='dead'?'Lost to deep space · Choose next volunteer':contactLabel||`${Math.max(0,c.x-(scene.release?.center.x??0)).toFixed(0)} m forward • ${Math.max(0,c.y).toFixed(0)} m high · ${Math.round(atmosphereAt(c.y).gravity*100)}% gravity`,panel.x+16,panel.y+49,Math.min(panel.w-32,336));
  const nearest=[...scene.enemies.values()].map(b=>({tag:b.getUserData(),d:Math.hypot(b.getPosition().x-c.x,b.getPosition().y-c.y)})).sort((a,b)=>a.d-b.d)[0];
  const actions={'yokai-pull':'Pulls you inward',updraft:'Rising air',gust:'Sideways gust',snare:'Slows your flight',spin:'Swirling current'};
  const note=scene.phase==='dead'?'DEEP SPACE · Run ended':c.y>570?'DEEP SPACE AHEAD · 600 m is lethal':nearest&&nearest.d<8?`${nearest.tag.kind} · ${actions[nearest.tag.interaction]??'Deflects on contact'}`:biome.id==='openSky'?'Cloud lift ↑ · Storms push sideways':biome.id==='space'?'Low gravity · No gliding · Deep space at 600 m':'';
  if(note){ctx.fillStyle='rgba(250,245,219,.92)';ctx.fillRect(panel.x+8,panel.y+66,Math.min(panel.w-16,380),28);ctx.fillStyle='#4b3154';ctx.font='12px system-ui';ctx.fillText(note,panel.x+16,panel.y+85,Math.min(panel.w-32,364));}
  if(panel.w>=800){const x=panel.x+panel.w-14,top=panel.y+70,h=panel.h-92,level=y=>top+(1-Math.max(0,Math.min(600,y))/600)*h;ctx.globalAlpha=.85;
   for(const [high,low,color]of [[600,480,'#8d80c5'],[480,360,'#7eb6d3'],[360,240,'#52795d'],[240,120,'#4f8b5b'],[120,0,'#9c7852']]){ctx.fillStyle=color;ctx.fillRect(x,level(high),6,Math.max(2,level(low)-level(high)));}
   dot([x+3,level(c.y)],5,'#fff7d7');ctx.globalAlpha=1;ctx.font='11px system-ui';for(const [y,label]of [[590,'DEATH'],[540,'Space'],[420,'Storm'],[300,'Tree'],[180,'Canopy'],[60,'Floor']])ctx.fillText(label,x-48,level(y)+4);
  }ctx.restore();
 }
 return {get approachNotice(){return approachNotice;},get viewport(){return viewport;},get cssPixelsPerMetre(){return cssPixelsPerMetre;},point(e){return pointerWorld(e,canvas.getBoundingClientRect(),viewport);},
 draw(scene,preview,effects,time,reduced,width,height=globalThis.innerHeight??Infinity,contactLabel=''){
  approachNotice='';viewport=viewportFor(width,height);if(canvas.width!==viewport.width||canvas.height!==viewport.height){canvas.width=viewport.width;canvas.height=viewport.height;canvas.style.aspectRatio=`${viewport.width}/${viewport.height}`;}
  if(width!==lastCssWidth||height!==lastCssHeight){lastCssWidth=width;lastCssHeight=height;const displayed=canvas.getBoundingClientRect?.().width??Math.max(240,width-16);cueScale=Math.max(1,Math.min(1.75,viewport.width/Math.max(1,displayed)));cssPixelsPerMetre=45*Math.max(1,displayed)/viewport.width;}
  const {portrait,originX,originY}=viewport,c=scene.center(),flying=['flight','dead'].includes(scene.phase),local=p=>[originX+p.x*45,originY-(p.y-294)*45];ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!flying){cameraScene=null;
   ctx.save();ctx.beginPath();ctx.rect(0,0,480,canvas.height);ctx.clip();drawScenery(ctx,{width:480,height:canvas.height,region:'grandfatherTree',camera:{x:0,y:297},scale:45,reducedMotion:reduced,time});
   line(local({x:-8,y:294}),local({x:5,y:294}),'#534735',7);line(local({x:-5.1,y:295.5}),local({x:-3.5,y:295.5}),'#92724a',4);
   if(scene.hand)drawGripTether(ctx,{anchor:local(scene.hand.body.getWorldPoint(scene.hand.local)),target:local(scene.hand.target),pixelRatio:45/cssPixelsPerMetre,capped:scene.forceCapped});
   for(let b=scene.world.getBodyList();b;b=b.getNext())body(scene,b,local,45);drawMechanismDetails(ctx,scene,local);drawLoadingContacts(ctx,scene,local,cueScale);
   dot(local(scene.arm.getWorldPoint({x:0,y:0})),5,'#e6c475');
   if(scene.phase==='loading'&&!scene.hand&&scene.parts?.length){const root=scene.parts.find(b=>b.getUserData().id==='torso')??scene.parts[Math.floor(scene.parts.length/2)],p=local(root.getWorldCenter());ctx.setLineDash([3,3]);ctx.beginPath();ctx.strokeStyle='#f8eab8';ctx.lineWidth=2;ctx.arc(...p,PICKUP_RADIUS_CSS*45/cssPixelsPerMetre,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#273f35';ctx.font='12px system-ui';ctx.fillText('Grab here',Math.max(10,p[0]-27),p[1]-PICKUP_RADIUS_CSS*45/cssPixelsPerMetre-6);}
   if(portrait&&preview)preview.points.forEach((p,i)=>dot(local(p),2,`rgba(82,85,45,${(1-i/preview.points.length)*.8})`));
   ctx.fillStyle='#243b30';ctx.font='14px system-ui';ctx.fillText(scene.phase==='uncocked'?'Set height to wind the real counterweight':scene.phase==='winding'?'Winding under torque…':scene.phase==='launching'?'Arm moving under gravity':'Lift beside cradle → across above → release',12,24);if(scene.phase==='loading'){ctx.font=`${12*cueScale}px system-ui`;ctx.fillText('Amber dots: actual pouch contact',12,45);}ctx.restore();
  }
  if(!portrait||flying){
   const panel=flying?{x:0,y:0,w:canvas.width,h:canvas.height}:{x:500,y:56,w:460,h:424},biome=biomeAt(c.y),scale=flying?42:100;
   if(flying&&(!wasFlying||cameraScene!==scene)){camera=createFlightCamera();cameraScene=scene;}
   const cam=flying?camera.update(c,{width:panel.w,height:panel.h,scale,dt:Math.max(0,time-lastTime),reducedMotion:reduced}):c;
   const view=p=>[panel.x+panel.w/2+(p.x-cam.x)*scale,panel.y+panel.h/2-(p.y-cam.y)*scale];
   ctx.save();ctx.translate(panel.x,panel.y);drawScenery(ctx,{width:panel.w,height:panel.h,region:biome.id,camera:cam,scale,reducedMotion:reduced,time});ctx.restore();
   ctx.save();ctx.beginPath();ctx.rect(panel.x,panel.y,panel.w,panel.h);ctx.clip();
   let fixedObstacles=[];
   if(flying){for(const s of layout.surfaces){const a=view({x:s.minX,y:s.y}),b=view({x:s.maxX,y:surfaceY(s,s.maxX)});ctx.save();ctx.translate(panel.x,panel.y);drawSurfaceTrim(ctx,{x1:a[0]-panel.x,x2:b[0]-panel.x,y:a[1]-panel.y,y2:b[1]-panel.y,width:panel.w,height:panel.h,ground:s.id==='ground'});ctx.restore();line(a,b,s.editorType==='platform'?'#b5a277':'#675337',5);}
    fixedObstacles=drawFixedObstacles(ctx,scene,view,scale);
   }else dot([panel.x+panel.w/2,panel.y+panel.h/2],110,'rgba(255,248,222,.45)');
   if(preview)preview.points.forEach((p,i)=>dot(view(p),2,`rgba(82,85,45,${(1-i/preview.points.length)*.8})`));
   for(const e of reduced?[]:effects){const p=view(e),t=1-e.life/.4,r=4+t*(8+14*(e.strength??.4));ctx.save();ctx.globalAlpha=Math.max(0,e.life/.4)*.8;ctx.strokeStyle=e.material==='leaf'?'#e9f4af':e.material==='bumper'?'#f9bd55':'#fff0ba';ctx.lineWidth=1.5;ctx.beginPath();if(e.material==='ground')ctx.ellipse(...p,r,r*.4,0,0,Math.PI*2);else ctx.arc(...p,r,0,Math.PI*2);ctx.stroke();if((e.strength??0)>.25)for(let i=0;i<4;i++){const a=i*Math.PI/2+.4;line([p[0]+Math.cos(a)*(r+2),p[1]+Math.sin(a)*(r+2)],[p[0]+Math.cos(a)*(r+5),p[1]+Math.sin(a)*(r+5)],ctx.strokeStyle,1.5);}ctx.restore();}
   // Feedback sits behind actual articulated bodies and collision silhouettes.
   if(flying){const encounters=[...scene.enemies.values()].map(b=>{const p=b.getWorldCenter(),v=b.getLinearVelocity(),tag=b.getUserData();return {id:tag.id,kind:tag.kind,shape:tag.shape,x:p.x,y:p.y,vx:v.x,vy:v.y,radius:tag.radius??b.getFixtureList().getShape().getRadius()};});
    const bounds=[];for(const part of scene.parts)for(let f=part.getFixtureList();f;f=f.getNext())bounds.push(f.getAABB(0));
    const payloadRadius=payloadWarningRadius(c,bounds),terrain=terrainApproaches(c,{...layout,bumpers:fixedObstacles},{payloadRadius});
    const cues=approachCues(c,[...encounters,...terrain],{camera:cam,width:panel.w,height:panel.h,scale,payloadRadius});approachNotice=cues.length?'Nearby: '+cues.map(q=>`${q.count>1?q.count+' nearby obstacles':q.kind} (${Math.abs(Math.sin(q.angle))>.707?(Math.sin(q.angle)>0?'below':'above'):(Math.cos(q.angle)>0?'right':'left')})`).join(', ')+'.':'';
    for(const cue of cues){ctx.save();ctx.translate(cue.x,cue.y);ctx.scale(cueScale,cueScale);ctx.rotate(cue.angle);ctx.fillStyle='#f8d58c';ctx.strokeStyle='#5c4b2a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-7,-7);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();ctx.stroke();ctx.rotate(-cue.angle);if(cue.count>1){ctx.fillStyle='#263b31';ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(String(cue.count),-Math.cos(cue.angle)*14,-Math.sin(cue.angle)*14+4);}else if(cue.interaction==='slide'||cue.interaction==='bounce'){const bx=-Math.cos(cue.angle)*18,by=-Math.sin(cue.angle)*18;dot([bx,by],9,'#263b31');ctx.fillStyle='#f8d58c';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText(cue.interaction==='bounce'?'↑':'↔',bx,by+4);}ctx.restore();}
   }
   // Show actual hardware context in the contact close-up and through physical departure.
   if(!flying)for(let b=scene.world.getBodyList();b;b=b.getNext())if(b.getUserData()?.role==='static')body(scene,b,view,scale,0,true);
   for(let b=scene.world.getBodyList();b;b=b.getNext())if(['counterweight','frame','arm','pouch','pouchflap','hooklink'].includes(b.getUserData()?.role))body(scene,b,view,scale);drawMechanismDetails(ctx,scene,view,{labels:false});
   // Encounters first: a foreground collision cannot hide the volunteer's body.
   for(const role of ['enemy','part'])for(let b=scene.world.getBodyList();b;b=b.getNext())if(b.getUserData()?.role===role)body(scene,b,view,scale,reduced?0:Math.sin(time*8));
   if(!flying)drawLoadingContacts(ctx,scene,view,cueScale);
   ctx.restore();
   if(flying)drawFlightHud(scene,c,panel,biome,typeof contactLabel==='string'?contactLabel.slice(0,64):'');else{ctx.fillStyle='#273f35';ctx.font='bold 17px system-ui';ctx.fillText(`${scene.rig?.label??'Volunteer'} • ${(scene.rig?.totalMass??0).toFixed(2)} kg`,512,25);ctx.font='12px system-ui';ctx.fillText('Contact close-up • dots = pouch contact • drag left',512,44);}
  }
  if(!portrait&&!flying)line([480,0],[480,480],'#8c9f95',1);wasFlying=flying;lastTime=time;
 }};
}
