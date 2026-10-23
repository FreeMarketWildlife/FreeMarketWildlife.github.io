import {drawMouse} from './mouse-art.js?v=49';
import {doorGeometry,drawCritterDoor} from './critter-door.js?v=49';
import {critterHitboxBounds} from './critter-body.js?v=49';
import {landingOpportunity} from './landing-opportunity.js?v=49';
import {createLandingCue,drawLandingCue} from './landing-cue-art.js?v=49';
import {imminentLanding} from './landing-view.js?v=49';
import {GRAVITY} from './build-physics.js?v=49';
import {drawFlightAccents} from './flight-art.js?v=49';
import {drawCounterweight} from './counterweight-art.js?v=49';
import {drawCrankWheel,crankGeometry,crankState as crankStateForQA} from './crank-wheel.js?v=49';
import {RopeVisual} from './rope-visual.js?v=49';
import {part,grams} from './build-catalog.js?v=49';
import {drawGroveWorld} from './grove-art.js?v=49';
import {createCritterPerformance} from './critter-performance.js?v=49';
import {groveSetupCamera,groveSwingCamera,groveFlightCamera,groveTreeCamera} from './grove-camera.js?v=49';
const TAU=Math.PI*2;
// These are finishes and attached fittings, not replacement collision geometry.
// Capacity tiers keep the user's chosen dimensions; their cages/cloth identify
// the fitted capacity without pretending an empty larger basket adds mass.
const FRAME_FINISH={sapling:'#ad814c',timber:'#94613c',braced:'#806347',giant:'#718781',leviathan:'#526d70'};
const FRAME_TIER={sapling:0,timber:1,braced:2,giant:3,leviathan:4};
const BALLAST_TIER={pebble:0,boulder:1,quarry:2,mountain:3,continental:4};
const POUCH_FINISH={pocket:'#759381',pouch:'#c2a46e',cradle:'#758266',hammock:'#b08c59',elephant:'#936a51',whale:'#648b93'};
const ROPE_FINISH={twine:['#e0d4a0','#c1d3b1',1.8],hemp:['#bd9c63','#dec18a',2.4],cable:['#96b4ae','#d0dfd0',2.1],titanCable:['#6e8f9a','#c8d6d9',3.1]};
const ellipse=(ctx,x,y,rx,ry,color,stroke='#3d4938',lw=2)=>{ctx.beginPath();ctx.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke();}};
const path=(ctx,points,color,width)=>{ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();};
export function drawCritter(ctx,animal,x,y,size,angle=0,air=false,height,performance={}){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(performance.squashX??1,performance.squashY??1);
 if(animal.id==='mouse'){drawMouse(ctx,size,height??size*animal.width/animal.length,{...performance,pose:performance.pose??(air?'flying':'ready')});ctx.restore();return;}
 // At phone scale, subpixel painted detail becomes grey noise. Use the same
 // physical length/height and body angle with a simpler, stronger silhouette.
 if(air&&size<=40&&Number.isFinite(height)&&['mouse','frog','chipmunk'].includes(animal.id)){drawSmallCritter(ctx,animal,size,height,performance);ctx.restore();return;}
 const bounds=animal.id==='whale'?[-68,-24,52,27]:animal.id==='elephant'?[-43,-42,62,41]:animal.id==='rabbit'?[-57,-56,52,32]:animal.id==='squirrel'?[-61,-48,52,32]:[-57,-33,52,32];
 const [x0,y0,x1,y1]=bounds;ctx.scale(size/(x1-x0),height===undefined?size/(x1-x0):height/(y1-y0));ctx.translate(-(x0+x1)/2,-(y0+y1)/2);ctx.lineJoin='round';
 const id=animal.id,color=({mouse:'#b8998d',frog:'#71bb6c',chipmunk:'#c88443',squirrel:'#b77c4c',rabbit:'#b7b6c3',armadillo:'#b99575',fox:'#da824a',bear:'#9b7657',tiger:'#e6a94a',elephant:'#8fa8b0',whale:'#649aa9'})[id]??animal.color,ink='#302d2b',cream='#f5dfb3';
 const pose=performance.pose??(air?'flying':'ready'),tier=performance.tier??0,bonk=pose.startsWith('bonk'),stars=pose==='stars',dazed=pose==='dazed',active=air&&pose!=='ready';
 const flex=performance.flex??{head:0,tail:0},dive=performance.airPose==='dive',float=performance.airPose==='float';
 const shape=(points,fill,width=3)=>{ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=width;ctx.stroke();};
 if(id==='whale'){
  ctx.beginPath();ctx.moveTo(-45,0);ctx.bezierCurveTo(-18,-28,42,-23,48,-3);ctx.bezierCurveTo(50,26,-15,25,-42,8);ctx.lineTo(-56,24);ctx.lineTo(-53,3);ctx.lineTo(-66,-8);ctx.lineTo(-47,-6);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2.5;ctx.stroke();ellipse(ctx,16,13,24,5,'#b7d1c5',null);path(ctx,bonk?[[-2,10],[-17,pose==='bonk-a'?-3:27],[10,14]]:active?[[-2,10],[-18,24],[10,14]]:[[-2,10],[-13,24],[10,14]],'#547f8a',4);drawCritterFace(ctx,{x:36,y:-1,whale:true,pose,tier});
 }else{
  const elephant=id==='elephant',frog=id==='frog',rabbit=id==='rabbit',fox=id==='fox',chipmunk=id==='chipmunk',squirrel=id==='squirrel',bear=id==='bear',tiger=id==='tiger';
  // Tail masses are the first silhouette cue. They flex around their attachment,
  // never around a replacement body angle or a different collision transform.
  if(!frog&&!elephant){ctx.save();ctx.translate(-34,6);ctx.rotate(flex.tail??0);ctx.translate(34,-6);
   if(fox){
    shape([[-26,9],[-34,-1],[-42,-14],[-52,-17],[-56,-9],[-53,4],[-47,13],[-34,18]],color,3.3);
    shape([[-43,-14],[-52,-17],[-56,-9],[-53,4],[-49,9],[-47,-1],[-44,2],[-46,-7]],cream,1.7);
   }else if(squirrel){
    ctx.beginPath();ctx.moveTo(-26,13);ctx.bezierCurveTo(-58,21,-61,-15,-52,-35);ctx.bezierCurveTo(-43,-51,-26,-42,-27,-26);ctx.bezierCurveTo(-27,-13,-44,-18,-41,-4);ctx.quadraticCurveTo(-39,6,-26,6);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=3.5;ctx.stroke();
    path(ctx,[[-34,8],[-47,0],[-48,-22],[-40,-32]],'#eac28c',5.4);
   }else if(chipmunk){
    shape([[-28,12],[-46,12],[-54,3],[-54,-17],[-48,-27],[-40,-22],[-41,-8],[-29,-1]],color,3.2);
    path(ctx,[[-46,7],[-48,-8],[-46,-22]],'#5e4033',5);path(ctx,[[-42,7],[-44,-8],[-43,-20]],cream,2.5);
   }else if(rabbit)ellipse(ctx,-35,11,8.5,8.5,cream,ink,2.8);
   else if(bear)ellipse(ctx,-35,12,6,6,'#78563e',ink,2.8);
   else{ctx.beginPath();ctx.moveTo(-34,6);ctx.quadraticCurveTo(-63,12,-53,-4);ctx.strokeStyle=ink;ctx.lineWidth=id==='armadillo'?7:4;ctx.stroke();ctx.strokeStyle=id==='mouse'?'#d8b9a6':color;ctx.lineWidth=id==='armadillo'?4.5:2;ctx.stroke();}
   ctx.restore();
  }
  const limbY=bonk?(pose==='bonk-a'?8:27):active?(dive?7:float?22:15):22;
  if(frog){
   ellipse(ctx,-23,14,16,13,color,ink,3.2);
   path(ctx,[[-18,16],[-39,27],[-48,23]],ink,7);path(ctx,[[-18,16],[-39,27],[-48,23]],'#a2d174',3.7);
   shape([[-45,23],[-51,28],[-38,30],[-30,27]],'#9acb76',2.2);
  }else for(const xx of[-23,17]){
   const stride=pose==='walking'?Math.sin((performance.frame??0)+(xx<0?0:Math.PI)):0,ly=pose==='walking'?22-Math.max(0,stride)*8:limbY,lx=xx+(pose==='walking'?stride*9:bonk?(xx<0?-9:8):active?(xx<0?-5:4):0);
   ellipse(ctx,lx,ly,elephant?9:rabbit&&xx<0?13:fox?6.2:8,elephant?17:rabbit&&xx<0?10:fox?6.7:8,fox?'#70452f':color,ink,2.6);
  }
  const bodyRx=elephant?37:rabbit?31:fox?33:34,bodyRy=elephant?29:frog?20:fox?20:rabbit?25:24;
  ellipse(ctx,-4,2,bodyRx,bodyRy,color,ink,3.8);
  ctx.save();ctx.beginPath();ctx.ellipse(-4,2,bodyRx,bodyRy,0,0,TAU);ctx.clip();ctx.fillStyle=elephant?'#647e8d':frog?'#3d8d58':id==='mouse'?'#876e70':rabbit?'#858797':'#8c593c';ctx.beginPath();ctx.moveTo(-44,12);ctx.quadraticCurveTo(-3,22,36,2);ctx.lineTo(45,40);ctx.lineTo(-45,40);ctx.closePath();ctx.fill();ellipse(ctx,-13,-11,15,4,elephant?'#bed0cf':frog?'#b0d788':'#edc69a',null);ctx.restore();
  ellipse(ctx,-7,12,fox?25:23,fox?7:9,elephant?'#abb9af':tiger?'#f2c678':frog?'#bed887':cream,null);
  if(tiger)for(const xx of[-28,-12,4])path(ctx,[[xx,-19],[xx+3,-5],[xx-3,1]],'#73523c',4);
  if(id==='armadillo')for(const xx of[-24,-14,-4,6]){ctx.beginPath();ctx.ellipse(xx,0,10,22,0,-1.2,1.2);ctx.strokeStyle='#665e56';ctx.lineWidth=2;ctx.stroke();}
  if(chipmunk){path(ctx,[[-28,-8],[-9,-15],[10,-10]],'#5b3e30',8);path(ctx,[[-28,-8],[-9,-15],[10,-10]],cream,4.4);path(ctx,[[-27,0],[-9,-5],[8,-1]],'#765137',2.3);}
  if(rabbit)ellipse(ctx,-19,12,15,13,'#ced0d5',ink,2.5);
  ctx.save();ctx.translate(15,0);ctx.rotate(flex.head??0);ctx.translate(-15,0);
  if(rabbit){
   ctx.save();ctx.translate(18,-17);ctx.rotate(active?(dive?-.27:.13):-.08);ellipse(ctx,0,-14,6,21,color,ink,3);ellipse(ctx,0,-15,2.5,14,'#daaaa6',null);ctx.restore();
   ctx.save();ctx.translate(30,-16);ctx.rotate(active?(dive?.04:.27):.15);ellipse(ctx,0,-14,6.5,22,color,ink,3);ellipse(ctx,0,-15,2.5,14,'#daaaa6',null);ctx.restore();
  }else if(fox){
   shape([[12,-12],[10,-31],[26,-23],[30,-10]],'#b9663e',3);shape([[16,-17],[15,-27],[23,-22]],ink,1);
   shape([[28,-14],[29,-32],[41,-20],[40,-9]],color,3);shape([[32,-18],[32,-27],[37,-21]],ink,1);
  }else if(!frog){
   ellipse(ctx,16,-20,elephant?15:squirrel?7.2:chipmunk?8:11,elephant?20:squirrel?12:chipmunk?9:12,color,ink,2.8);if(!elephant)ellipse(ctx,16,-21,squirrel?3:chipmunk?3.8:5,chipmunk?4.8:6,'#d7a99c',null);
  }
  if(fox){
   shape([[11,-8],[18,-20],[31,-22],[40,-12],[51,-2],[41,12],[24,12],[14,5]],color,3.4);
   shape([[21,-1],[31,2],[47,-1],[42,8],[33,13],[22,9]],cream,1.5);
  }else{
   ellipse(ctx,29,-6,elephant?20:frog?23:rabbit?17:19,elephant?24:frog?16:18,color,ink,3.5);
   ellipse(ctx,36,2,10,6,elephant?'#b9cccb':frog?'#b4d88b':cream,null);
  }
  if(elephant){ellipse(ctx,13,-5,13,19,'#b1bcb0',ink,2);path(ctx,[[43,4],[49,25],[57,24]],ink,10);path(ctx,[[43,4],[49,25],[57,24]],color,6);path(ctx,[[38,9],[46,14],[47,10]],'#f3e1b9',3);}
  if(frog){ellipse(ctx,21,-19,8.5,10,color,ink,2.6);ellipse(ctx,39,-18,8.5,10,color,ink,2.6);ellipse(ctx,23,-20,5.5,6.6,'#fffbed',ink,1.8);ellipse(ctx,25,-20,2.6,4,ink,null);}
  if(bear)ellipse(ctx,40,0,8,6,'#c2a382',null);
  drawCritterFace(ctx,{x:fox?34:frog?39:34,y:fox?-10:frog?-18:-10,pose,tier,dive,float,fox,frog});ctx.restore();
  if(fox)shape([[47,-4],[52,-2],[49,2],[45,1]],ink,1);
  else if(!frog&&!elephant)ellipse(ctx,46,0,rabbit?2.7:4,rabbit?2:3,rabbit?'#b87e7e':ink,null);
  if(active){const pawY=bonk?(pose==='bonk-a'?-5:24):dive?11:18;
   if(frog){path(ctx,[[17,12],[33,pawY+6],[43,pawY+3]],ink,5.5);path(ctx,[[17,12],[33,pawY+6],[43,pawY+3]],'#98c975',3);}
   else{path(ctx,[[-16,8],[-29,pawY],[-39,pawY-3]],ink,5);path(ctx,[[-16,8],[-29,pawY],[-39,pawY-3]],fox?'#70452f':color,2.7);if(!elephant){path(ctx,[[12,12],[19,pawY+5],[27,pawY+2]],ink,4);path(ctx,[[12,12],[19,pawY+5],[27,pawY+2]],fox?'#70452f':color,2);}}
  }
 }
 if(stars||dazed)drawDizzyStars(ctx,tier,performance.frame??0);
 ctx.restore();
}
/** Pixel-detail variant inside the existing physical silhouette. Coordinates
 * are screen projections of the compound torso/head/tail proportions, not an
 * enlarged sprite or a portrait. Stroke widths stay legible under thin bodies. */
function drawSmallCritter(c,animal,w,h,performance){
 const id=animal.id,frog=id==='frog',chip=id==='chipmunk',ink='#252a26',rim='#fff2d1',cream='#ffe8b9',color=frog?'#65b34e':chip?'#c5823d':'#bc927c';
 const bonk=String(performance.pose).startsWith('bonk'),dazed=['stars','dazed'].includes(performance.pose),flex=performance.flex??{};
 const oval=(x,y,rx,ry,fill)=>{c.beginPath();c.ellipse(x*w,y*h,rx*w,ry*h,0,0,TAU);c.fillStyle=fill;c.fill();c.strokeStyle=rim;c.lineWidth=1.5;c.stroke();c.strokeStyle=ink;c.lineWidth=.8;c.stroke();};
 const mark=(points,stroke,width)=>path(c,points.map(([x,y])=>[x*w,y*h]),stroke,width);
 // Tail and folded haunch are species cues; no one-pixel grain or fur hatching.
 c.save();c.translate(-.34*w,.06*h);c.rotate(flex.tail??0);c.translate(.34*w,-.06*h);
 if(chip){oval(-.405,-.07,.095,.30,color);mark([[-.42,.12],[-.43,-.05],[-.42,-.24]],cream,.8);}
 else if(!frog){mark([[-.34,.03],[-.44,.19],[-.49,.13],[-.49,-.02]],rim,1.6);mark([[-.34,.03],[-.44,.19],[-.49,.13],[-.49,-.02]],ink,.8);}
 c.restore();
 if(frog){oval(-.31,.26,.19,.24,'#559e43');mark([[-.27,.27],[-.43,.41],[-.49,.35]],cream,1);}
 else oval(-.20,.31,.10,.11,color);
 oval(-.06,0,frog?.34:chip?.32:.31,.36,color);
 // A single light belly and bold chipmunk stripe survive a twenty-pixel stamp.
 c.beginPath();c.ellipse(-.07*w,.16*h,.235*w,.16*h,0,0,TAU);c.fillStyle=cream;c.fill();
 if(chip){mark([[-.31,-.14],[-.09,-.25],[.10,-.18]],ink,1.7);mark([[-.31,-.14],[-.09,-.25],[.10,-.18]],cream,.8);}
 c.save();c.translate(.15*w,0);c.rotate(flex.head??0);c.translate(-.15*w,0);
 if(!frog){oval(.20,-.38,.07,.12,color);}
 oval(frog?.27:.30,frog?-.15:-.06,frog?.23:.20,frog?.35:.34,frog?'#81c45c':color);
 if(frog)oval(.18,-.36,.085,.12,'#81c45c');
 // One large readable eye on rodents; the frog keeps its unmistakable eye pair.
 for(const x of frog?[.18,.36]:[.34]){
  const y=frog?-.33:-.13,rx=frog?.055:.061,ry=frog?.135:.18;
  c.beginPath();c.ellipse(x*w,y*h,rx*w,ry*h,0,0,TAU);c.fillStyle='#fffbed';c.fill();
  if(bonk){mark([[x-rx*.7,y-ry*.7],[x+rx*.7,y+ry*.7]],ink,.7);mark([[x+rx*.7,y-ry*.7],[x-rx*.7,y+ry*.7]],ink,.7);}
  else{c.beginPath();c.ellipse((x+.019)*w,(y+(dazed?.05:0))*h,.023*w,.10*h,0,0,TAU);c.fillStyle=ink;c.fill();}
 }
 if(!frog){c.beginPath();c.ellipse(.485*w,.02*h,.024*w,.07*h,0,0,TAU);c.fillStyle=ink;c.fill();}
 const mouthX=frog?.30:.36,mouthY=frog?.17:.19;
 if(bonk||dazed){c.beginPath();c.ellipse(mouthX*w,mouthY*h,.044*w,.095*h,0,0,TAU);c.fillStyle=ink;c.fill();}
 else mark([[mouthX-.035,mouthY-.015],[mouthX,mouthY+.025],[mouthX+.045,mouthY-.03]],ink,.65);
 if((performance.tier??0)>=2){mark([[.19,-.20],[.26,-.12]],cream,1.05);}
 c.restore();
}
function drawCritterFace(ctx,{x,y,whale=false,pose,tier,dive=false,float=false,fox=false,frog=false}){
 const ink='#302d2b',bonk=pose.startsWith('bonk'),dazed=pose==='stars'||pose==='dazed',active=pose!=='ready',eye=whale?4.8:fox?5.8:6.4;
 if(bonk){path(ctx,[[x-eye,y-eye],[x+eye,y+eye]],ink,2.5);path(ctx,[[x+eye,y-eye],[x-eye,y+eye]],ink,2.5);}
 else if(dazed){ctx.beginPath();for(let i=0;i<26;i++){const a=i*.46,r=.16*i;const xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.strokeStyle=ink;ctx.lineWidth=1.9;ctx.stroke();}
 else{ellipse(ctx,x,y,eye,eye*(fox?1.2:1.4),'#fffbed',ink,1.4);ellipse(ctx,x+(dive?2.4:1.5),y+(dive?1:float?-1:-.5),eye*.5,eye*.7,'#293e32',null);ellipse(ctx,x+2,y-2,1,1,'#fffbed',null);}
 if(active&&!bonk&&!dazed)path(ctx,[[x-eye-1,y-eye*1.5],[x,y-eye*(dive?1.8:1.7)],[x+eye,y-eye*1.4]],ink,1.8);
 const mx=x+(fox?6:frog?-8:1),my=y+(whale?10:fox?15:frog?24:16);
 if(active){
  ellipse(ctx,mx,my,bonk?7:6,bonk?6.8:4.7,'#684b46',ink,1.5);
  if(!bonk||tier>=2){ctx.fillStyle='#fff6dc';ctx.beginPath();ctx.roundRect(mx-4.5,my-3.2,9,3.6,1);ctx.fill();if(tier>=2){ctx.fillStyle='#684b46';ctx.fillRect(mx-.7,my-3.6,tier>=3?3.6:2.2,4.4);}}
  if(bonk||tier===0)ellipse(ctx,mx+1,my+2,3.1,1.7,'#d89683',null);
 }else path(ctx,[[mx-4,my],[mx,my+2],[mx+4,my-1]],ink,1.5);
 if(tier>0){ellipse(ctx,x-10,y+9,5,3.5,'#bc8f99',null);path(ctx,[[x-13,y+8],[x-10,y+11]],'#937d91',1);}
 if(tier>=2){ctx.save();ctx.translate(x-13,y-9);ctx.rotate(-.4);ctx.fillStyle='#f3dbac';ctx.strokeStyle='#9b825d';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(-8,-3,16,6,2);ctx.fill();ctx.stroke();ctx.fillStyle='#d1b184';ctx.fillRect(-2.5,-2.5,5,5);ctx.restore();}
}
function drawDizzyStars(ctx,tier,frame){
 const ink='#8b764e';for(let i=0;i<3;i++){const a=i*Math.PI*2/3+frame*Math.PI/12,x=13+Math.cos(a)*24,y=-24+Math.sin(a)*8,r=3.4+(tier>2?1:0);ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.4,y-r*.3);ctx.lineTo(x+r,y);ctx.lineTo(x+r*.35,y+r*.35);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.35,y+r*.35);ctx.lineTo(x-r,y);ctx.lineTo(x-r*.4,y-r*.3);ctx.closePath();ctx.fillStyle=i%2?'#f4d476':'#fff0b4';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=1;ctx.stroke();}
}
export function createBuildRenderer(canvas){
 let guidanceActive=false;
 const ctx=canvas.getContext('2d');let cam={x:0,y:2,scale:100},lastSim=null,fit=true;let zoomFactor=1,treeZoom=1,treeOverview=false,cameraUntil=0;let W=1000,H=600,preview=false,ropeTime=0,ropeDt=1/60,strandDt=1/60,lastDrawnSimTime=0;let cords=[new RopeVisual(),new RopeVisual()];let effects=[],nowTime=0,windActive=false;const performanceState=createCritterPerformance(),landingCue=createLandingCue();let critterCel={pose:'ready',tier:0,hits:0,angle:0};const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
 function project(p){return[W/2+(p.x-cam.x)*cam.scale,H/2-(p.y-cam.y)*cam.scale];}
 function line(a,b,color,width=2){path(ctx,[project(a),project(b)],color,width);}
 function fitScene(sim){
  if(sim.spaceState==='escaped'&&sim.release&&!preview){
   // A restored completion has no on-screen launcher-to-flight transition.
   // Seed the existing centred, fully acquired framing before its first draw;
   // subsequent draws use the player's normal motion preference and lead.
   cam=groveFlightCamera({},sim.real(sim.shot),{width:W,height:H,hitboxLongestSide:critterHitboxBounds(sim.animal).longestSide/zoomFactor,dt:0,reducedMotion:true});
  }else{cam=groveSetupCamera(sim.c,{width:W,height:H,preview,counterRadius:sim.facts.counterRadius,door:sim.critterDoor});cam.scale*=zoomFactor;}
  fit=false;
 }
 function background(sim){
  if(sim.map){drawGroveWorld(ctx,{camera:cam,width:W,height:H,map:sim.map,time:sim.time,editor:false,showDoor:!sim.critterDoor});if(sim.critterDoor)drawCritterDoor(ctx,sim.critterDoor,p=>project(p),cam.scale,{open:sim.phase==='ready'&&sim.loading?.returning});return;}
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#cedec5');grad.addColorStop(.65,'#dee4be');grad.addColorStop(1,'#b5c18d');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  // The same authored clearing and tree silhouettes at every launch; camera parallax only.
  ctx.globalAlpha=.18;
  for(let i=0;i<13;i++){const x=i*145-170-cam.x*cam.scale*.025;path(ctx,[[x,H*.9],[x+30,H*.38],[x+16,-80]],'#819e74',25+i%3*12);ellipse(ctx,x+15,H*.17,160,100,'#a7bf92',null);}
  ctx.globalAlpha=.24;ctx.fillStyle='#fffbe0';ctx.beginPath();ctx.moveTo(W*.66,0);ctx.lineTo(W*.87,0);ctx.lineTo(W*.45,H);ctx.lineTo(W*.23,H);ctx.fill();ctx.globalAlpha=1;
  const tx=W*.10-cam.x*cam.scale*.06;
  ctx.fillStyle='#728b57';ctx.beginPath();ctx.moveTo(tx-165,-10);ctx.lineTo(tx-18,-10);ctx.bezierCurveTo(tx-37,H*.3,tx-30,H*.65,tx+30,H);ctx.lineTo(tx-190,H);ctx.closePath();ctx.fill();
  path(ctx,[[tx-27,H*.36],[tx+85,H*.18],[tx+195,H*.15]],'#728b57',21);path(ctx,[[tx-130,H*.22],[tx-115,H*.65],[tx-147,H]],'#879d62',9);path(ctx,[[tx-77,-5],[tx-90,H*.48],[tx-64,H*.84]],'#617d50',5);
  for(let i=0;i<16;i++){const x=tx-100+Math.cos(i*2.3)*220,y=-17+Math.sin(i*1.6)*85;ellipse(ctx,x,y,75+i%3*15,48+i%4*8,['#718e4c','#819c55','#90a863'][i%3],'#6b854f',1.5);}
  const gy=project({x:0,y:0})[1];if(gy<H+100){ctx.fillStyle='#85965b';ctx.fillRect(0,gy,W,H-gy+5);ctx.fillStyle='#aaba73';ctx.fillRect(0,gy,W,8);path(ctx,[[0,gy+8],[W,gy+8]],'#667e48',2);
   const earth=ctx.createLinearGradient(0,gy+8,0,H);earth.addColorStop(0,'#8a8855');earth.addColorStop(1,'#596d42');ctx.fillStyle=earth;ctx.fillRect(0,gy+10,W,H-gy);
   for(let i=0;i<75;i++){const x=((i*93.71-cam.x*cam.scale)%(W+80)+W+80)%(W+80)-40;const y=gy+10+(i*37)%Math.max(20,H-gy);ellipse(ctx,x,y,2+i%4,1.5,'#b2ad73',null);}
   for(let i=0;i<30;i++){const x=((i*63.2-cam.x*cam.scale)%(W+60)+W+60)%(W+60)-30;path(ctx,[[x-4,gy],[x-7,gy-7],[x-2,gy-2],[x+3,gy-11],[x+4,gy]],'#6b8547',1.5);}

  }
  if(!preview){
   const stride=cam.scale<12?10:cam.scale<30?5:1,start=Math.ceil((cam.x-W/(2*cam.scale)-sim.startX)/stride)*stride,end=cam.x+W/(2*cam.scale)-sim.startX;
   for(let m=start;m<=end;m+=stride){if(m<0)continue;const x=project({x:sim.startX+m,y:0})[0],y=gy;path(ctx,[[x,y+2],[x,y+13]],'#4b613e',2);ctx.fillStyle='#ece3b4';ctx.textAlign='center';ctx.font='bold 10px Trebuchet MS';ctx.fillText(`${m} m`,x,y+27);}
  }
  // Pale pollen and distant birds are decorative, never hidden forces.
  for(let i=0;i<20;i++)ellipse(ctx,(i*317.1)%W,(i*97.3)%(H*.7),1+i%2,1+i%2,'#f7f5cd',null);
 }
 function polygon(body,fixture,fill,outline='#4d5139'){
  const shape=fixture.getShape();ctx.lineWidth=2;ctx.strokeStyle=outline;ctx.fillStyle=fill;
  if(shape.getType()==='circle'){const w=body.getWorldPoint(shape.getCenter()),p=project({x:w.x*lastSim.L,y:w.y*lastSim.L});const r=shape.getRadius()*lastSim.L*cam.scale;ctx.beginPath();ctx.arc(p[0],p[1],Math.max(.5,r),0,TAU);}else{const pts=shape.m_vertices.map(v=>{const q=body.getWorldPoint(v);return project({x:q.x*lastSim.L,y:q.y*lastSim.L});});ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);ctx.closePath();}
  ctx.fill();ctx.stroke();
  // All treatment is clipped to the existing member. No painted cross-brace
  // appears where the physics has none, including on a leaning/moving frame.
  const tier=FRAME_TIER[lastSim.c.frame];
  if(tier){ctx.save();ctx.clip();const h=lastSim.c.pivotHeight,span=h*cam.scale,point=(x,y)=>{const p=body.getWorldPoint({x:x/lastSim.L,y:y/lastSim.L});return project({x:p.x*lastSim.L,y:p.y*lastSim.L});};
   for(let i=0;i<tier+1;i++){const y=h*(i+1)/(tier+2);path(ctx,[point(-h,y),point(h,y)],tier<3?'#dbbd82':'#d0d8bd',Math.max(1,span*.015));}
   if(tier>=2){for(const side of [-1,1])path(ctx,[point(side*h*.10,h),point(side*h*.18,0)],tier===2?'#493f30':'#344e4b',Math.max(1,span*.009));}
   if(tier===4)path(ctx,[point(-h,h*.20),point(0,h*.76),point(h,h*.20)],'#adba9e',Math.max(1,span*.008));
   ctx.restore();
  }
 }
 function timber(a,b,width,color){line(a,b,'#444a34',Math.max(4,width*cam.scale+3));line(a,b,color,Math.max(2,width*cam.scale));const p=project(a),q=project(b);path(ctx,[[p[0],p[1]-Math.max(1,width*cam.scale*.2)],[q[0],q[1]-Math.max(1,width*cam.scale*.2)]],'#e1b16b',Math.max(.7,width*cam.scale*.09));}
 function annotation(p,text,dx,dy){const [x,y]=project(p),xx=Math.max(15,Math.min(W-190,x+dx)),yy=Math.max(88,Math.min(H-80,y+dy));path(ctx,[[x,y],[xx,yy+9],[xx+8,yy+9]],'#61754e88',1);ctx.font='10px "DM Sans",sans-serif';const width=Math.min(190,ctx.measureText(text).width+18);ctx.fillStyle='#f4f4dfec';ctx.beginPath();ctx.roundRect(xx+5,yy-3,width,24,5);ctx.fill();ctx.fillStyle='#5a6d45';ctx.textAlign='left';ctx.fillText(text,xx+14,yy+12);}
 function rope(a,b,length,index=0,free=false){
  const ps=cords[index].update(a,b,length,strandDt,x=>lastSim.supportHeight(x)+.006*lastSim.L,{pinA:!free});
  const points=ps.map(project),finish=ROPE_FINISH[lastSim.c.rope],width=finish[2];path(ctx,points,'#394738',width+1.7);path(ctx,points,finish[index],width);
  if(['cable','titanCable'].includes(lastSim.c.rope)){
   path(ctx,points,'#eef0d9',lastSim.c.rope==='cable'?.65:.8);
   if(lastSim.c.rope==='titanCable')for(let i=3;i<points.length-1;i+=6){const a=points[i-1],b=points[i+1],p=points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1])||1,dx=-(b[1]-a[1])/d*2,dy=(b[0]-a[0])/d*2;path(ctx,[[p[0]-dx,p[1]-dy],[p[0]+dx,p[1]+dy]],'#364d51',1.2);}
  }
 }
 function trough(sim,front=false){
  const c=sim.c,a=sim.railPoint(-c.troughLength*.75),b=sim.railPoint(c.troughLength*.25),dy=front?-.04:.025;
  const waxed=c.trough==='waxedRunway';
  timber({x:a.x,y:a.y+dy},{x:b.x,y:b.y+dy},Math.max(.025,c.troughHeight*.5),waxed?(front?'#86a995':'#b2c6a0'):(front?'#c7a062':'#e3c48c'));
  if(!front){const slats=waxed?3:8;for(let i=0;i<=slats;i++){const x=a.x+(b.x-a.x)*i/slats,y=a.y+(b.y-a.y)*i/slats;line({x,y:y-.04},{x,y:y+.06},waxed?'#577969':'#695a3b',1.3);}
   if(waxed)line({x:a.x,y:a.y+.015},{x:b.x,y:b.y+.015},'#f4edb8',2);
  }
 }
 function beamFinish(sim,a,b){
  const p=project(a),q=project(b),length=Math.hypot(q[0]-p[0],q[1]-p[1]),w=sim.c.beamWidth*cam.scale,id=sim.c.arm;
  if(length<2||w<.2)return;
  ctx.save();ctx.translate(...p);ctx.rotate(Math.atan2(q[1]-p[1],q[0]-p[0]));ctx.beginPath();ctx.rect(0,-w/2,length,w);ctx.clip();
  if(id==='laminated')for(const y of [-.30,0,.30])path(ctx,[[0,y*w],[length,y*w]],'#6d4e31',Math.max(.65,w*.08));
  else if(id==='colossus'){const n=8;for(let i=0;i<n;i++)path(ctx,[[length*i/n,-w*.42],[length*(i+.5)/n,w*.42],[length*(i+1)/n,-w*.42]],'#d0d7b7',Math.max(.75,w*.12));}
  else if(id==='ironwood')for(const t of [.14,.48,.82]){path(ctx,[[length*t,-w*.5],[length*t,w*.5]],'#b5b7a2',Math.max(1.1,w*.30));path(ctx,[[length*t,-w*.28],[length*t,w*.28]],'#3f4b40',Math.max(.7,w*.10));}
  else{const count=id==='twig'?2:3;for(let i=0;i<count;i++){const x=length*(i+1)/(count+1);ellipse(ctx,x,0,Math.max(2,length*.016),Math.max(.45,w*.24),id==='twig'?'#775738':'#6e4931',null);}}
  ctx.restore();
 }
 function capacityCage(sim,point,radius){
  const r=Math.max(1,radius),tier=BALLAST_TIER[sim.c.ballast];ctx.save();ctx.translate(...point);ctx.rotate(-sim.real(sim.counter).angle);ctx.beginPath();ctx.arc(0,0,r*.94,0,TAU);ctx.clip();
  const strap=tier<2?'#b88c51':tier===2?'#879d8c':tier===3?'#b4bfa3':'#91b8b1',ink='#354437',width=Math.max(1,r*.12);
  for(let i=0;i<=tier;i++){const x=r*(i-(tier/2))*1.35/(tier+1);path(ctx,[[x,-r],[x,r]],ink,width+1);path(ctx,[[x,-r],[x,r]],strap,width);}
  if(tier>=2){path(ctx,[[-r,0],[r,0]],ink,width+1);path(ctx,[[-r,0],[r,0]],strap,width);}
  if(tier>=3)for(const x of [-.50,.50])for(const y of [-.47,.47])ellipse(ctx,x*r,y*r,Math.max(1,r*.075),Math.max(1,r*.075),'#e0d7ac',ink,.7);
  if(tier===4)path(ctx,[[-r*.6,0],[0,-r*.65],[r*.6,0],[0,r*.65],[-r*.6,0]],'#e2e7cf',Math.max(.8,r*.07));
  ctx.restore();
 }
 function axleHardware(sim){
  const p=project(sim.pivot()),r=Math.max(5,sim.c.axleRadius*cam.scale*2),id=sim.c.bearing,ink='#304639';
  ellipse(ctx,...p,r,r,id==='woodAxle'?'#94683e':id==='bronze'?'#c59950':id==='bearings'?'#a4b8ad':'#688f93',ink,1.8);
  if(id==='woodAxle')path(ctx,[[p[0]-r*.6,p[1]-r*.35],[p[0]+r*.6,p[1]+r*.35]],'#d6b47a',1.1);
  else{const n=id==='bronze'?4:id==='bearings'?8:6;for(let i=0;i<n;i++){const a=i*TAU/n;ellipse(ctx,p[0]+Math.cos(a)*r*.64,p[1]+Math.sin(a)*r*.64,Math.max(.75,r*.12),Math.max(.75,r*.12),id==='bronze'?'#675b40':'#344f49',null);}
   if(id==='precision')ellipse(ctx,...p,r*.83,r*.83,null,'#d9d7aa',.7);
  }
  ellipse(ctx,...p,Math.max(1.2,r*.23),Math.max(1.2,r*.23),'#e0dcc0',ink,.8);
 }
 function releaseHardware(sim,tip,end){
  const id=sim.c.release;line(tip,end,'#30473d',4.3);line(tip,end,id==='nail'?'#976e48':id==='polished'?'#e2ca88':'#9cbcb4',id==='nail'?2.2:2.7);
  const p=project(end);if(id==='rollerPin'){ellipse(ctx,...p,2.8,2.8,'#cbd4bb','#354e43',1);ellipse(ctx,...p,.8,.8,'#354e43',null);}
  else if(id==='polished'){const a=project(tip);path(ctx,[[a[0],a[1]-.6],[p[0],p[1]-.6]],'#fff1bd',.7);}
 }
 function pouchPaint(id,left,right,top,bottom){
  ctx.fillStyle=POUCH_FINISH[id];ctx.strokeStyle='#354e3e';ctx.lineWidth=2;ctx.fill();ctx.stroke();ctx.save();ctx.clip();
  const w=right-left,h=Math.max(3,bottom-top),mid=(left+right)/2,ink='#3a5140',light=id==='whale'?'#c2d6c5':'#e5d3a1';
  if(id==='pocket'){path(ctx,[[mid,top],[mid,bottom]],light,1.2);for(const y of [.30,.62])path(ctx,[[left,top+h*(y-.22)],[mid,top+h*y],[right,top+h*(y-.22)]],light,.8);}
  else if(id==='pouch'){for(let i=1;i<7;i++){const x=left+w*i/7;path(ctx,[[x,top+h*.14],[x+w*.05,top+h*.29]],ink,.9);}ctx.fillStyle='#e4d2a6';ctx.fillRect(mid-w*.13,top+h*.34,w*.26,h*.36);}
  else if(id==='cradle'){for(const t of [.23,.5,.77])path(ctx,[[left+w*t,top],[left+w*t,bottom]],light,1.7);path(ctx,[[left,top+h*.67],[right,top+h*.67]],ink,1.3);}
  else if(id==='hammock'){for(let i=-2;i<6;i++)path(ctx,[[left+w*i/4,top],[left+w*(i+2)/4,bottom]],light,1);}
  else if(id==='elephant'){path(ctx,[[left,top],[right,bottom]],ink,Math.max(2,h*.24));path(ctx,[[right,top],[left,bottom]],ink,Math.max(2,h*.24));path(ctx,[[mid,top],[mid,bottom]],light,Math.max(1,h*.11));}
  else{for(let i=-2;i<7;i++){path(ctx,[[left+w*i/5,top],[left+w*(i+2)/5,bottom]],light,.9);path(ctx,[[left+w*i/5,bottom],[left+w*(i+2)/5,top]],light,.9);}}
  ctx.restore();
 }
 function mechanism(sim,labels){
  const c=sim.c,wood=part(c.arm).color,frame=sim.frame;
  for(let f=frame.getFixtureList();f;f=f.getNext())if(f!==sim.troughFixture)polygon(frame,f,FRAME_FINISH[c.frame]);
  trough(sim);
  if(sim.loading&&!preview&&sim.c.pivotHeight*cam.scale>14)drawLoadingStand(sim);
  // Grain follows actual frame members.
  const fp=pt=>{const q=frame.getWorldPoint({x:pt.x/sim.L,y:pt.y/sim.L});return{x:q.x*sim.L,y:q.y*sim.L};};
  if(c.chassis==='anchored')for(const x of [-c.baseWidth/2,c.baseWidth/2]){const a=fp({x,y:.04}),b={x:a.x-.08*c.pivotHeight,y:-.12*c.pivotHeight};line(a,b,'#5a6c50',Math.max(2,cam.scale*c.beamWidth*.4));}
  if(c.chassis==='skids')for(const side of [-1,1]){const a=fp({x:side*c.baseWidth*.18,y:c.pivotHeight*.025}),b=fp({x:side*c.baseWidth*.49,y:c.pivotHeight*.025});line(a,b,'#57472e',Math.max(2,c.pivotHeight*cam.scale*.018));}
  if(c.chassis==='walking')for(const x of [-c.baseWidth*.48,c.baseWidth*.48]){const p=project(fp({x,y:c.pivotHeight*.025}));ellipse(ctx,...p,Math.max(2,c.pivotHeight*cam.scale*.018),Math.max(1,c.pivotHeight*cam.scale*.008),'#c7a25e','#4a4932',1);}
  if(c.chassis==='floating'){line({x:-c.baseWidth/2,y:c.pivotHeight},{x:c.baseWidth/2,y:c.pivotHeight},'#788c7d',6);const cw=sim.counterPoint();line({x:cw.x,y:0},{x:cw.x,y:c.pivotHeight+c.shortArm},'#697c6b',4);}
  for(const wheel of sim.wheels){const q=sim.real(wheel),p=project(q),r=c.wheelRadius*cam.scale;ellipse(ctx,...p,r,r,'#b2874b','#445039',3);ellipse(ctx,...p,r*.74,r*.74,'#d2ac6b','#697148',2);for(let i=0;i<6;i++){const a=q.angle+i*TAU/6;path(ctx,[p,[p[0]+Math.cos(a)*r*.72,p[1]-Math.sin(a)*r*.72]],'#796842',Math.max(1,r*.08));}ellipse(ctx,...p,r*.14,r*.14,'#667f65',null);}
  const transform=p=>{const q=sim.arm.getWorldPoint({x:p.x/sim.L,y:p.y/sim.L});return{x:q.x*sim.L,y:q.y*sim.L};};
  const tip=sim.tip(),short=transform({x:-c.shortArm,y:0}),pivot=sim.pivot(),cw=sim.counterPoint();timber(short,tip,c.beamWidth,wood);beamFinish(sim,short,tip);
  if(c.mount==='hinged'&&c.chassis!=='floating')timber(short,cw,c.beamWidth*.3,'#7a8972');
  const cp=project(cw),r=sim.facts.counterRadius*cam.scale;
  drawCounterweight(ctx,{point:cp,radius:r,angle:sim.real(sim.counter).angle,material:c.material});capacityCage(sim,cp,r);
  const pinEnd={x:tip.x+Math.cos(sim.arm.getAngle()+c.pinAngle*Math.PI/180)*c.pinLength,y:tip.y+Math.sin(sim.arm.getAngle()+c.pinAngle*Math.PI/180)*c.pinLength};releaseHardware(sim,tip,pinEnd);
  const animalPoint=sim.real(sim.shot),payload=sim.loading&&sim.phase==='ready'?sim.loading.target():animalPoint,p=project(payload),physicalSize=sim.animal.length*cam.scale;
  if(sim.sling){rope(tip,payload,c.slingLength);const o=c.pouchWidth*.32;rope({...tip,x:tip.x+.02*c.longArm},{x:payload.x+o,y:payload.y},c.slingLength,1);
   if(sim.loading&&sim.phase==='ready'&&!preview){
    const b=sim.loading.basketShape,lt=project({x:b.left,y:b.rim}),rt=project({x:b.right,y:b.rim}),lb=project({x:b.left,y:b.bottom}),rb=project({x:b.right,y:b.bottom});
    ctx.beginPath();ctx.moveTo(...lt);ctx.quadraticCurveTo(lb[0],lb[1]+3,(lb[0]+rb[0])/2,lb[1]+3);ctx.quadraticCurveTo(rb[0],rb[1]+3,...rt);ctx.closePath();pouchPaint(c.sling,lt[0],rt[0],lt[1],Math.max(lb[1],rb[1])+3);
   }else{
   ctx.save();ctx.translate(...p);ctx.beginPath();const pw=Math.max(9,c.pouchWidth*cam.scale*.65);ctx.moveTo(-pw,-4);ctx.quadraticCurveTo(-pw,physicalSize*.4,0,physicalSize*.39);ctx.quadraticCurveTo(pw,physicalSize*.4,pw,-4);ctx.lineTo(pw*.7,2);ctx.quadraticCurveTo(0,physicalSize*.22,-pw*.7,2);ctx.closePath();pouchPaint(c.sling,-pw,pw,-4,physicalSize*.4);ctx.restore();}
  }else if(sim.pouch){const pouch=sim.real(sim.pouch);rope(tip,pouch,c.slingLength);rope(tip,pouch,c.slingLength,1,true);const a=project(pouch),t=Math.min(1,(sim.time-sim.release.time)*4),pw=Math.max(8,c.pouchWidth*cam.scale*.5);path(ctx,[[a[0]-pw,a[1]],[a[0],a[1]+pw*.55],[a[0]+pw*(1+t),a[1]+pw*t]],'#3f624d',6);path(ctx,[[a[0]-pw,a[1]],[a[0],a[1]+pw*.55],[a[0]+pw*(1+t),a[1]+pw*t]],POUCH_FINISH[c.sling],3);}
  if(sim.loading&&sim.phase==='ready'&&!preview)drawLoadingCritter(sim);
  else drawCritter(ctx,sim.animal,...project(animalPoint),physicalSize,critterCel.angle,!!sim.release,sim.animal.width*cam.scale,critterCel);
  trough(sim,true);
  drawCrankWheel(ctx,sim,project,cam.scale);
  // The winding quadrant otherwise completely occludes the small axle cap.
  axleHardware(sim);
  if(guidanceActive&&sim.phase==='ready'&&!preview&&sim.c.pivotHeight*cam.scale>14)loadingCues(sim);
  if(preview&&H>250){
   const a=project({x:-c.baseWidth*.75,y:0}),b=project({x:-c.baseWidth*.75,y:c.pivotHeight});path(ctx,[a,b],'#66774f',1);for(const pt of[a,b])path(ctx,[[pt[0]-4,pt[1]],[pt[0]+4,pt[1]]],'#66774f',1.5);ctx.fillStyle='#4a613d';ctx.font='bold 11px Trebuchet MS';ctx.textAlign='left';ctx.textAlign='right';ctx.fillText(`${c.pivotHeight.toFixed(2)} m`,a[0]-7,(a[1]+b[1])/2);
  }
  if(labels&&!sim.release&&!preview){annotation(cw,grams(c.counterGrams),24,-55);annotation({x:(tip.x+payload.x)/2,y:(tip.y+payload.y)/2},`${c.slingLength.toFixed(2)} m sling`,-150,-33);if(W>550)annotation(pivot,part(c.chassis).name,35,-25);if(physicalSize<25)annotation(payload,`${sim.animal.name} · ${grams(sim.animal.grams)}`,35,-25);}
  if(sim.release){const origin=project(sim.release);if(origin[0]>0&&origin[0]<W){ellipse(ctx,...origin,5,5,'#f0cb78','#926d38',1.5);ctx.font='9px "DM Sans",sans-serif';ctx.fillStyle='#687848';ctx.textAlign='left';ctx.fillText('RELEASE',origin[0]+9,origin[1]-7);}}
 }
 function drawLoadingStand(sim){
  const s=sim.loading.stand,a={x:s.x-s.width*.5,y:s.y},b={x:s.x+s.width*.5,y:s.y};
  for(const x of [s.x-s.width*.34,s.x+s.width*.34])timber({x,y:sim.supportHeight(x)+.02},{x,y:s.y},s.height*.25,'#947447');
  timber(a,b,s.height*.45,'#d4ad69');
  const p=project({x:s.x,y:s.y-s.height*.35});ctx.font='bold 9px Trebuchet MS,sans-serif';ctx.textAlign='center';ctx.fillStyle='#514a32';ctx.fillText('CRITTER',p[0],p[1]+15);
 }
 function drawLoadingCritter(sim){
  const size=sim.animal.length*cam.scale,h=sim.animal.width*cam.scale;
  ctx.save();if(sim.critterDoor){const edge=project({x:sim.critterDoor.x-sim.critterDoor.width/2,y:0})[0];ctx.beginPath();ctx.rect(edge,0,Math.max(0,W-edge),H);ctx.clip();}
  for(const p of sim.loading.parts){ctx.save();ctx.translate(...project(p));ctx.rotate(-p.angle);ctx.beginPath();ctx.rect((p.a-p.offset-.012)*size,-h*.7,(p.b-p.a+.024)*size,h*1.4);ctx.clip();drawCritter(ctx,sim.animal,-p.offset*size,0,size,0,false,h,{pose:sim.loading.returning?'walking':'ready',frame:sim.loading.walkPhase});ctx.restore();}
  const grip=sim.loading.grip;if(grip){const p=project(grip),q=project(grip.cursor);if(Math.hypot(p[0]-q[0],p[1]-q[1])>3){ctx.save();ctx.setLineDash([3,3]);path(ctx,[p,q],'#f6d782',1.5);ctx.restore();}ellipse(ctx,...p,4.5,4.5,'#ffe4a5','#715637',1.5);ellipse(ctx,...p,1.5,1.5,'#6a603e',null);}
  ctx.restore();
 }
 function loadingCues(sim){
  const target=project(sim.loading.target()),animal=project(sim.real(sim.shot)),held=sim.loading.dragging;
  ctx.save();ctx.setLineDash([4,4]);ellipse(ctx,...target,Math.max(12,sim.c.pouchWidth*cam.scale*.65),Math.max(7,sim.animal.width*cam.scale*.55),'#ffe5a418','#e5ba63',1.5);ctx.setLineDash([]);
  ctx.font='bold 12px Trebuchet MS,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#fff0cc';ctx.fillStyle='#3b3428';
  if(sim.loading.hint){
   const phase=sim.loading.hintPhase,t=reducedMotion?.55:Math.max(0,Math.min(1,(phase-.08)/.65)),ease=t*t*(3-2*t),x=animal[0]+(target[0]-animal[0])*ease,y=animal[1]+(target[1]-animal[1])*ease-Math.sin(t*Math.PI)*Math.min(65,H*.1);
   ctx.globalAlpha=reducedMotion?.8:Math.min(1,phase*10,(1-phase)*7);ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(...animal);ctx.quadraticCurveTo((animal[0]+target[0])/2,Math.min(animal[1],target[1])-70,...target);ctx.strokeStyle='#ffe6a5';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
   // A cursor paw, not an in-world operator or human hand.
   ellipse(ctx,x,y,8,6,'#fff0c2','#6e6746',1.5);for(let i=0;i<3;i++)ellipse(ctx,x-7+i*7,y-8-Math.abs(i-1)*2,3,3.5,'#fff0c2','#6e6746',1);
   const labelY=Math.max(H*.38,Math.min(target[1],animal[1])-30);ctx.strokeText('Drag → drop',W/2,labelY);ctx.fillStyle='#3b3428';ctx.fillText('Drag → drop',W/2,labelY);
  }ctx.restore();
 }
 function effectAnchor(sim,slot){
  if(['ballast','material','mount'].includes(slot))return sim.counterPoint();
  if(['release','arm'].includes(slot))return sim.tip();
  if(['sling','rope','animal'].includes(slot))return sim.real(sim.shot);
  if(slot==='trough')return sim.railPoint(0);
  if(slot==='winch')return crankGeometry(sim).center;
  if(slot==='chassis')return{x:sim.c.baseWidth*.5,y:sim.c.wheelRadius};
  return sim.pivot();
 }
 function drawEffects(sim){
  effects=effects.filter(e=>nowTime-e.start<1.2);
  for(const e of effects){const age=(nowTime-e.start)/1.2,p=project(effectAnchor(sim,e.slot));ctx.save();ctx.globalAlpha=1-age;const spread=(reducedMotion?12:12+age*58);for(let i=0;i<12;i++){const a=i*TAU/12+.2,xx=p[0]+Math.cos(a)*spread,yy=p[1]+Math.sin(a)*spread-age*15,r=(1-age)*(i%3+2.5);ctx.fillStyle=i%2?'#fff0a1':'#e7b95d';ctx.beginPath();ctx.moveTo(xx,yy-r*1.6);ctx.lineTo(xx+r*.5,yy-r*.4);ctx.lineTo(xx+r*1.4,yy);ctx.lineTo(xx+r*.4,yy+r*.4);ctx.lineTo(xx,yy+r*1.5);ctx.lineTo(xx-r*.4,yy+r*.4);ctx.lineTo(xx-r*1.4,yy);ctx.lineTo(xx-r*.4,yy-r*.4);ctx.closePath();ctx.fill();}ellipse(ctx,...p,6+age*40,6+age*40,null,'#f8eab0',2*(1-age));ctx.restore();}
 }
 function drawSwingTrail(sim,feel){
  if(!feel||reducedMotion||preview)return;
  for(const p of feel.trail){ctx.save();ctx.globalAlpha=p.alpha;const r=Math.max(3,sim.facts.counterRadius*cam.scale*.75);ellipse(ctx,...project(p),r,r,'#f2cf79',null);ctx.restore();}
 }
 function drawLaunchFeedback(sim,feel){
  if(!feel||preview)return;
  if(sim.release&&feel.releaseAge!==null&&feel.releaseAge<.32){
   const t=feel.releaseAge/.32,p=project(sim.release),angle=Math.atan2(-sim.release.vy,sim.release.vx);ctx.save();ctx.globalAlpha=(1-t)*.8;
   if(reducedMotion){ellipse(ctx,...p,9,9,'#fff0b744','#e7bf68',1.5);}
   else{const radius=12+t*43;for(let i=0;i<10;i++){const a=angle+Math.PI+(i-4.5)*.18,dx=Math.cos(a),dy=Math.sin(a),jitter=7*Math.sin(i*3.7);path(ctx,[[p[0]+dx*(radius*.4)+jitter,p[1]+dy*radius*.4],[p[0]+dx*radius+jitter,p[1]+dy*radius]],i%2?'#fff0ad':'#dfb35e',2-t);}
    ctx.beginPath();ctx.arc(...p,6+t*30,angle+Math.PI*.45,angle+Math.PI*1.55);ctx.strokeStyle='#f6db8f';ctx.lineWidth=3*(1-t)+.5;ctx.stroke();}
   ctx.restore();
  }
  if(feel.impact>0&&feel.impactPoint){const p=project(feel.impactPoint),r=reducedMotion?10:9+feel.impactAge*90;ctx.save();ctx.globalAlpha=feel.impact*.55;ellipse(ctx,...p,r,r,'#ffe8a41a','#f7d87f',1.7);ctx.restore();}
 }
 function draw(sim,{labels=true,follow=true,paused=false,pixelRatio=2,preview:showPreview=false,winding=false,feel=null,landingMarks=true}={}){
  guidanceActive=!paused&&!!sim.loading?.hint&&sim.phase==='ready';
  preview=showPreview;windActive=winding||!!sim.winding;const now=performance.now()/1000;nowTime=now;ropeDt=Math.min(1/30,now-ropeTime||1/60);ropeTime=now;
  const bounds=canvas.getBoundingClientRect();W=Math.max(160,bounds.width);H=Math.max(120,bounds.height);const dpr=Math.min(pixelRatio,devicePixelRatio||1);if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);if(!(lastSim===sim&&(sim.release||sim.phase==='swing')&&follow&&!preview))fit=true;}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineCap='round';ctx.lineJoin='round';
  if(lastSim!==sim){lastSim=sim;lastDrawnSimTime=sim.time;fit=true;cords=[new RopeVisual(),new RopeVisual()];}if(fit)fitScene(sim);strandDt=paused?0:['swing','flight','finished','escaped'].includes(sim.phase)?Math.min(1/30,Math.max(0,sim.time-lastDrawnSimTime)):ropeDt;lastDrawnSimTime=sim.time;
  if(treeOverview&&sim.map&&!preview){const target=groveTreeCamera(sim.map,{width:W,height:H});target.scale*=treeZoom;const mix=reducedMotion||nowTime>=cameraUntil?1:1-Math.exp(-ropeDt*8);cam={x:cam.x+(target.x-cam.x)*mix,y:cam.y+(target.y-cam.y)*mix,scale:Math.exp(Math.log(cam.scale)*(1-mix)+Math.log(target.scale)*mix)};}
  else if(sim.phase==='swing'&&follow&&!preview){cam=groveSwingCamera(cam,sim.real(sim.shot),{width:W,height:H,dt:paused?0:ropeDt,reducedMotion});}
  else if(sim.release&&follow&&!preview){
   const payload=sim.real(sim.shot),landing=sim.phase==='flight'?imminentLanding(sim.map,payload,{radius:sim.animal.width*.5,gravity:GRAVITY*(sim.gravityFactor??1)}):null;
   cam=groveFlightCamera(cam,payload,{width:W,height:H,hitboxLongestSide:critterHitboxBounds(sim.animal).longestSide/zoomFactor,dt:paused?0:ropeDt,reducedMotion,landing});
   const landingPoint=landing?project(landing):null;canvas.dataset.landingView=landing?.id??'';canvas.dataset.landingPoint=landingPoint?JSON.stringify(landingPoint):'';canvas.dataset.landingVisible=String(!!landingPoint&&landingPoint[0]>=12&&landingPoint[0]<=W-12&&landingPoint[1]>=100&&landingPoint[1]<=H-32);
  }
  const steadyCam={...cam};if(feel&&!preview&&!reducedMotion){cam.x-=feel.shakeX/cam.scale;cam.y+=feel.shakeY/cam.scale;}
  canvas.dataset.cameraScale=cam.scale.toFixed(4);canvas.dataset.cameraX=String(cam.x);canvas.dataset.cameraY=String(cam.y);canvas.dataset.cameraAcquire=String(cam.followAcquisition?.age??0);canvas.dataset.cameraMode=treeOverview&&!preview?'tree':follow&&!preview?(sim.release?'payload':sim.phase==='swing'?'sling':'rig'):'rig';
  critterCel=performanceState.update(sim);canvas.dataset.critterPose=critterCel.pose;canvas.dataset.critterHits=String(critterCel.hits);canvas.dataset.critterDamage=String(critterCel.tier);
  background(sim);
  if(sim.trail.length>2){ctx.setLineDash([2,6]);ctx.beginPath();for(let i=0;i<sim.trail.length;i++){const p=project(sim.trail[i]);i?ctx.lineTo(...p):ctx.moveTo(...p);}ctx.strokeStyle='#f3e5a2';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);}
  drawSwingTrail(sim,feel);
  mechanism(sim,labels);
  const crank=crankStateForQA(sim);canvas.dataset.crankAngle=String(crank.angle);canvas.dataset.crankRadius=String(crank.radius);canvas.dataset.loaded=String(sim.loading?.loaded??true);canvas.dataset.dragging=String(sim.loading?.dragging??false);canvas.dataset.loadingHint=String(guidanceActive&&!preview);canvas.dataset.grabPart=sim.loading?.grip?.part??'';canvas.dataset.loadingParts=JSON.stringify(sim.loading?.parts.map(p=>({...p,screen:project(p)}))??[]);canvas.dataset.loadingGrip=JSON.stringify(sim.loading?.grip?project(sim.loading.grip):null);
  canvas.dataset.animalPoint=JSON.stringify(project(sim.real(sim.shot)));canvas.dataset.slingPoint=JSON.stringify(project(sim.loading?.target()??sim.real(sim.shot)));

  const cueEnabled=landingMarks&&follow&&!treeOverview&&!preview&&!labels;
  const opportunity=cueEnabled&&!paused?landingOpportunity(sim):null;
  const cue=landingCue.update(sim,opportunity,{project,width:W,height:H,dt:ropeDt,paused,enabled:cueEnabled});
  canvas.dataset.flightCue=cue?.id??'';canvas.dataset.flightCueMode=cue?.mode??'';canvas.dataset.flightCueOpacity=String(cue?.alpha??0);canvas.dataset.flightCuePoint=cue?JSON.stringify([cue.x,cue.y]):'';
  drawLandingCue(ctx,cue);
  if(sim.map)drawGroveWorld(ctx,{camera:cam,width:W,height:H,map:sim.map,time:sim.time,foreground:true});
  if(!preview)drawFlightAccents(ctx,{sim,project,width:W,height:H,scale:cam.scale,reducedMotion});
  drawEffects(sim);drawLaunchFeedback(sim,feel);
  cam=steadyCam;
  // The optional parts overlay includes a scale bar in real world units.
  if(!preview&&labels){
  const desired=90/cam.scale,n=10**Math.floor(Math.log10(desired)),bar=n*(desired/n>=5?5:desired/n>=2?2:1),px=bar*cam.scale;
  path(ctx,[[W-35-px,H-61],[W-35,H-61]],'#536849',1);path(ctx,[[W-35-px,H-65],[W-35-px,H-57]],'#536849',1);path(ctx,[[W-35,H-65],[W-35,H-57]],'#536849',1);ctx.fillStyle='#576d48';ctx.font='9px "DM Sans",sans-serif';ctx.textAlign='center';ctx.fillText(`${bar.toLocaleString('en-US',{maximumFractionDigits:2})} m`,W-35-px/2,H-70);
  }
 }
 return{draw,clearLandingCue:()=>landingCue.clear(),fit:(reset=true)=>{fit=reset||!(lastSim?.release||lastSim?.phase==='swing');if(reset){zoomFactor=1;treeZoom=1;treeOverview=false;}},overview(){treeOverview=!treeOverview;cameraUntil=performance.now()/1000+.7;if(!treeOverview)fit=true;return treeOverview;},zoomBy(factor){if(!Number.isFinite(factor)||factor<=0)return;if(treeOverview){cameraUntil=performance.now()/1000+.45;treeZoom=Math.max(.3,Math.min(10,treeZoom*factor));}else{const before=zoomFactor;zoomFactor=Math.max(.002,Math.min(4,zoomFactor*factor));cam.scale*=zoomFactor/before;}},project,unproject:(x,y)=>({x:cam.x+(x-W/2)/cam.scale,y:cam.y-(y-H/2)/cam.scale}),equipBurst(slot){effects.push({slot,start:performance.now()/1000});if(effects.length>8)effects.shift();},needsAnimation(){const now=performance.now()/1000;effects=effects.filter(e=>now-e.start<1.2);return effects.length>0||now<cameraUntil;},get camera(){return{...cam};}};
}
