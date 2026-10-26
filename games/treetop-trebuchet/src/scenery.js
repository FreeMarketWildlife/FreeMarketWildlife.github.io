/** Original decorative vectors, deliberately pale/distant so collider strokes remain readable.
 * Draw inside the caller's clipped viewport; width/height are viewport pixels.
 * camera:{x,y} is its centre in world metres, scale pixels/metre (y up).
 * Geography is fixed authored decoration; time animates haze and distant noncolliding birds.
 * None of these silhouettes represents a collision surface.
 */
const palettes={tree:['#b8d2cb','#e6eacb','#547b68'],sky:['#a9d4ed','#eef6e8','#699ab1'],canopy:['#98bca2','#d5dfb4','#447a62'],space:['#11132e','#343054','#958ccc'],floor:['#aab893','#e0d1a8','#637a4e']};
function biome(region){const r=String(region??'').toLowerCase();return r==='space'?'space':r.includes('floor')||r==='ground'?'floor':r.includes('canopy')||r.includes('jungle')?'canopy':r.includes('sky')||r.includes('air')?'sky':'tree';}
function ellipse(ctx,x,y,rx,ry,color,angle=0){ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
/** Five authored distant bird paths: decoration only, never enemy descriptors. */
export function backgroundBirds(time=0,reducedMotion=false){const t=reducedMotion?0:time;return [[-10,278],[18,303],[42,330],[67,258],[95,315]].map(([x,y],i)=>({x:x+8*Math.sin(t*.22+i),y:y+2*Math.sin(t*.31+i*2),wing:Math.sin(t*3+i),size:4+i%2}));}
export function drawScenery(ctx,{width,height,region,camera={x:0,y:300},scale=24,reducedMotion=false,time=0}={}){
 if(!ctx||![width,height,scale,camera.x,camera.y,time].every(Number.isFinite)||width<=0||height<=0||scale<=0)return;
 const key=biome(region),p=palettes[key],drift=reducedMotion?0:Math.sin(time*.12)*2;
 ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();
 const gradient=ctx.createLinearGradient(0,0,0,height);gradient.addColorStop(0,p[0]);gradient.addColorStop(1,p[1]);ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
 if(key==='space'){
  ctx.globalAlpha=.8;
  for(let i=0;i<95;i++){const x=((i*137.37-camera.x*1.7)%width+width)%width,y=((i*i*17.31+camera.y*.8)%height+height)%height;ellipse(ctx,x,y,i%7===0?1.8:.8,i%7===0?1.8:.8,'#f9eacf');}
  // Libriam orbits Saturn-like Kronos; Moon is its sub-satellite.
  const px=width*.74,py=height*.3;ctx.globalAlpha=.9;
  ellipse(ctx,px,py,80,65,'#c2997b');
  ctx.save();ctx.translate(px,py);ctx.rotate(-.32);ctx.strokeStyle='#e3c9a2';ctx.lineWidth=10;ctx.beginPath();ctx.ellipse(0,0,125,25,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  ellipse(ctx,width*.18,height*.23,14,14,'#d6d9e1');
  ctx.fillStyle='#e9def6';ctx.font='12px system-ui';ctx.fillText('KRONOS',px-23,py+100);
  const edge=height/2-(600-camera.y)*scale;
  if(edge>-50&&edge<height+50){ctx.strokeStyle='#ed8fa1';ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(0,edge);ctx.lineTo(width,edge);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#ffe3eb';ctx.fillText('DEEP SPACE · LETHAL',20,Math.max(20,edge-12));}
  ctx.restore();return;
 }
 if(key==='sky'){
  ctx.globalAlpha=.28;ctx.fillStyle='#495e88';
  for(let i=0;i<9;i++){const x=((i*171-camera.x*4)% (width+200)+width+200)%(width+200)-100,y=height*.16+(i%3)*height*.23;ellipse(ctx,x,y,105,28,'#495e88');ellipse(ctx,x+35,y-20,54,34,'#495e88');
   ctx.strokeStyle='#d7e5f2';ctx.lineWidth=1;for(let j=0;j<9;j++){ctx.beginPath();ctx.moveTo(x-65+j*17,y+35);ctx.lineTo(x-73+j*17,y+58);ctx.stroke();}}
  ctx.globalAlpha=.7;ctx.strokeStyle='#fff0aa';ctx.lineWidth=3;const bx=width*.64;ctx.beginPath();ctx.moveTo(bx,height*.28);ctx.lineTo(bx-16,height*.36);ctx.lineTo(bx+9,height*.36);ctx.lineTo(bx-12,height*.45);ctx.stroke();
  ctx.globalAlpha=.35;ctx.strokeStyle='#fff9dc';ctx.lineWidth=2;for(let i=0;i<4;i++){const x=width*(.1+i*.24);ctx.beginPath();ctx.moveTo(x,height*.85);ctx.bezierCurveTo(x-25,height*.68,x+25,height*.58,x,height*.48);ctx.stroke();}
  ctx.restore();return;
 }
 // Clouds use authored world x positions and distant parallax; never regenerate on movement.
 ctx.globalAlpha=.26;
 for(let i=0;i<7;i++){const x=width*.5+(i*95-240-camera.x*.15)*Math.min(scale,30)/24,y=height*.5-((315-i*44)-camera.y)*scale*.06+drift;
  ellipse(ctx,x,y,50+(i%3)*14,12+(i%2)*4,'#ffffff');ellipse(ctx,x-20,y-7,25,14,'#ffffff');}
 // A single enormous, distant trunk gives the departure a sense of scale.
 // Authored world coordinates and weak parallax keep it behind every collider.
 const sx=x=>width*.5+(x+25-camera.x*.08)*scale*.5;
 const sy=y=>height*.5-(y-camera.y)*scale*.10;
 ctx.globalAlpha=key==='sky'?.08:.13;ctx.fillStyle=p[2];
 ctx.beginPath();ctx.moveTo(sx(-45),sy(1000));ctx.bezierCurveTo(sx(-48),sy(240),sx(-58),sy(90),sx(-78),sy(-25));ctx.lineTo(sx(-12),sy(-25));ctx.bezierCurveTo(sx(-35),sy(100),sx(-28),sy(240),sx(-30),sy(1000));ctx.closePath();ctx.fill();
 // Bark runs past the camera as altitude changes, rather than sticking to the screen.
 ctx.globalAlpha=.10;ctx.strokeStyle=p[2];ctx.lineCap='round';ctx.lineWidth=3;
 for(let i=0;i<4;i++){const x=-41+i*3;ctx.beginPath();ctx.moveTo(sx(x),sy(1000));ctx.bezierCurveTo(sx(x-4),sy(220),sx(x-1),sy(100),sx(x-12),sy(-10));ctx.stroke();}
 // Distant woodland crowns are broad and soft; no sharp platform-like edges.
 if(key==='canopy'||key==='floor'){
  ctx.globalAlpha=key==='floor'?.20:.14;
  for(let i=0;i<9;i++){
   const x=width*.5+(i*8-32-camera.x*.05)*scale*.6;
   const y=sy(35+(i%3)*24);
   ellipse(ctx,x,y,55+(i%3)*18,36+(i%2)*13,p[2]);
  }
  ctx.globalAlpha=.12;ctx.lineWidth=16;
  for(let i=0;i<4;i++){const x=width*.5+(i*18-26-camera.x*.05)*scale*.6;ctx.beginPath();ctx.moveTo(x,sy(45));ctx.bezierCurveTo(x-18,sy(20),x+12,sy(-15),x+20,sy(-40));ctx.stroke();}
 }
 if(key!=='sky'){
  ctx.globalAlpha=.14;
  for(let i=0;i<18;i++){
   const x=(i*89%Math.ceil(width+120))-60-camera.x*.015,y=key==='floor'?sy(2+i%4):sy(320-i*18);
   ellipse(ctx,x,y,20+(i%4)*6,7+(i%3)*2,p[2],(i%5-2)*.4);
  }
 }
 // Pale, small, distant silhouettes have no eyes/outline, cues, collision or rewards.
 if(key==='tree'){ctx.globalAlpha=.32;ctx.strokeStyle='#567b73';ctx.lineWidth=1.3;ctx.lineCap='round';for(const bird of backgroundBirds(time,reducedMotion)){const x=width/2+(bird.x-camera.x)*scale*.35,y=height/2-(bird.y-camera.y)*scale*.35,size=bird.size;ctx.beginPath();ctx.moveTo(x-size,y-1-bird.wing*2);ctx.quadraticCurveTo(x-size*.45,y-3,x,y);ctx.quadraticCurveTo(x+size*.45,y-3,x+size,y-1-bird.wing*2);ctx.stroke();}}
 // Haze panel has no hard outline or collider-like boundary.
 ctx.globalAlpha=.16;ctx.fillStyle='#fff8db';ctx.fillRect(0,height*.73,width,height*.27);
 ctx.restore();
}
/** Face-only detail for original articulated shapes. Call at each head body's screen
 * position; angle is canvas-clockwise radians and size is head radius in pixels.
 * No body geometry or physics dependency. Species IDs match species.js.
 */
export function drawFace(ctx,{x,y,angle=0,size=7,species='mouse',color='#b6b0a9'}={}){
 if(!ctx||![x,y,angle,size].every(Number.isFinite)||size<=0)return;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);const s=size;
 ctx.lineWidth=Math.max(.6,s*.1);ctx.lineCap='round';
 if(['mouse','small-marsupial','chipmunk','flying-squirrel'].includes(species)){
  ellipse(ctx,-s*.45,-s*.85,s*.34,s*.38,color);ellipse(ctx,-s*.45,-s*.85,s*.18,s*.23,'#e9b9aa');
 }
 if(species==='tiny-primate'){
  ellipse(ctx,-s*.75,0,s*.4,s*.58,'#e6d7b8');ellipse(ctx,s*.2,-s*.65,s*.38,s*.4,'#e6d7b8');
 }
 if(species==='frog')ellipse(ctx,s*.15,-s*.65,s*.3,s*.3,'#9bc77b');
 if(species==='salamander')for(let i=0;i<3;i++)ellipse(ctx,-s*.6+i*s*.35,-s*.4,s*.09,s*.1,'#704e58');
 if(species==='lizard'||species==='snake'){
  ctx.strokeStyle='#5d7750';ctx.beginPath();ctx.moveTo(-s*.8,-s*.35);ctx.lineTo(-s*.3,-s*.75);ctx.lineTo(0,-s*.38);ctx.stroke();
 }
 if(species==='armadillo'){
  ctx.strokeStyle='#695e59';ctx.beginPath();ctx.moveTo(-s*.7,-s*.6);ctx.lineTo(-s*.5,s*.65);ctx.moveTo(-s*.35,-s*.7);ctx.lineTo(-s*.2,s*.68);ctx.stroke();
 }
 if(species==='turtle'){ellipse(ctx,s*.25,s*.35,s*.5,s*.3,'#b9c786');}
 // Single near-side eye reads at tiny simulation scale, with a soft snout and smile.
 ellipse(ctx,s*.35,-s*.25,s*.20,s*.24,'#fff9e9');ellipse(ctx,s*.43,-s*.24,s*.095,s*.13,'#293d37');
 ellipse(ctx,s*.76,s*.13,s*.10,s*.08,'#4d5146');ctx.strokeStyle='#596258';ctx.beginPath();ctx.arc(s*.25,s*.21,s*.28,.1,1.5);ctx.stroke();
 if(species==='chipmunk'){
  ctx.strokeStyle='#f6dfb1';ctx.beginPath();ctx.moveTo(-s*.8,s*.04);ctx.lineTo(-s*.15,s*.1);ctx.stroke();
 }
 ctx.restore();
}
export {drawEncounterDetails} from './enemy-art.js?v=66';
