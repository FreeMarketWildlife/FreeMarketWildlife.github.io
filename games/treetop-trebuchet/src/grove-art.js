import {encounterPose,drawWoodlandCreature} from './woodland-encounters.js?v=66';
import {drawJungleFoliage} from './forest-depth-art.js?v=66';
import {drawOakCanopy} from './oak-canopy-art.js?v=66';
import {drawBotanicalBumper} from './grove-botanical-art.js?v=66';
import {drawMaterialPolygon,GROVE_MATERIALS} from './grove-material-art.js?v=66';
import {ordinaryLeafHalfLength} from './grove-nature.js?v=66';
import {drawForestForeground} from './grove-jungle-art.js?v=66';
import {drawGroveBackdrop} from './grove-backdrop.js?v=66';
import {pointInPolygon} from './grove-geometry.js?v=66';
import {enemyRecipe} from './grove-map.js?v=66';
// Shared world art for the editor and live game. All scenery uses the same
// metre-to-pixel transform; distant layers alone use deliberate parallax.
const TAU=Math.PI*2,INK='#302d2b';
const ellipse=(c,x,y,rx,ry,fill,stroke=INK,line=2)=>{c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.lineWidth=line;c.strokeStyle=stroke;c.stroke();}};
const line=(c,pts,color,w=2)=>{if(!pts.length)return;c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.stroke();};
const objectCache=new WeakMap();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const blend=(a,b,t)=>{const v=x=>[parseInt(x.slice(1,3),16),parseInt(x.slice(3,5),16),parseInt(x.slice(5,7),16)];return'#'+v(a).map((n,i)=>Math.round(mix(n,v(b)[i],t)).toString(16).padStart(2,'0')).join('');};
function leaf(c,x,y,s,angle,color){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(-s,0);c.quadraticCurveTo(-s*.2,-s*.7,s,0);c.quadraticCurveTo(s*.1,s*.8,-s,0);c.fillStyle=color;c.fill();c.strokeStyle=INK;c.lineWidth=Math.max(.7,s*.055);c.stroke();line(c,[[-s*.7,0],[s*.65,0]],'#cee09d',Math.max(.7,s*.04));c.restore();}
function cloud(c,x,y,s,alpha=1){c.save();c.globalAlpha*=alpha;ellipse(c,x,y,s*1.4,s*.36,'#f5f4df',null);ellipse(c,x-s*.5,y-s*.14,s*.62,s*.44,'#f5f4df',null);ellipse(c,x+s*.13,y-s*.32,s*.7,s*.58,'#f8f7e8',null);ellipse(c,x+s*.7,y-s*.04,s*.67,s*.4,'#f5f4df',null);line(c,[[x-s*.8,y+s*.18],[x+s*.8,y+s*.18]],'#c7ded4',Math.max(1,s*.06));c.restore();}
/** The live Grove uses circular enemy contacts. Give that whole physical
 * body a quiet painted surface; the illustration alone can leave invisible
 * contact above a mushroom cap or beside a narrow leaf. Palette portraits and
 * decorative world enemies keep their existing unframed silhouettes. */
export function drawGroveEnemyContactBody(c,kind,x,y,r){
 if(![x,y,r].every(Number.isFinite)||r<=0)return false;
 const color=enemyRecipe(kind)?.color??'#ba844c',edge=Math.min(2.2,Math.max(.45,r*.045),r*.28);
 c.save();c.beginPath();c.arc(x,y,r<2?r:r-edge/2,0,TAU);c.fillStyle=r<2?color:blend(color,'#d8d2ad',.68);c.fill();
 if(r>=2){c.strokeStyle=INK;c.lineWidth=edge;c.stroke();}c.restore();return true;
}
/** Original illustrated encounter models. size means diameter in screen px. */
export function drawGroveEnemy(c,kind,x,y,size,time=0,settings=null){
 const recipe=enemyRecipe(kind),name=String(recipe?.model??kind??'beetle').toLowerCase();c.save();c.translate(x,y);c.scale(Math.max(.001,size)/100,Math.max(.001,size)/100);c.lineJoin='round';c.lineCap='round';
 if(drawWoodlandCreature(c,kind,time,settings)){c.restore();return;}
 const frog=name.includes('hopper')||name.includes('leaf'),bird=name.includes('bird'),yokai=name.includes('yokai'),cloudy=name.includes('cloud'),fungus=name.includes('fung')||name.includes('mushroom'),pod=name.includes('pod'),ring=name.includes('fragment')||name.includes('ring'),skid=name.includes('skid'),b=Math.sin(time*3)*2;
 if(yokai){
  c.beginPath();c.moveTo(-29,20);c.bezierCurveTo(-53,-39,32,-57,35,0);c.quadraticCurveTo(38,20,47,32);c.quadraticCurveTo(24,26,14,38);c.quadraticCurveTo(4,26,-9,37);c.quadraticCurveTo(-20,28,-29,20);c.fillStyle='#b3a1da';c.fill();c.strokeStyle='#534968';c.lineWidth=3;c.stroke();
  ellipse(c,-9,-4,7,11,'#f3eddd',null);ellipse(c,15,-4,7,11,'#f3eddd',null);ellipse(c,-7,-2,3,5,'#493c60',null);ellipse(c,17,-2,3,5,'#493c60',null);line(c,[[-5,15],[3,19],[12,14]],'#655073',3);leaf(c,-24,-28,15,-.6,'#7c75ad');leaf(c,21,-31,14,.8,'#7c75ad');
  c.globalAlpha=.5;ellipse(c,-42,6,4,4,'#ebe2ff',null);ellipse(c,44,-23,3,3,'#ebe2ff',null);
 }else if(cloudy){
  cloud(c,0,6,29,1);ellipse(c,-7,2,3,4,INK,null);ellipse(c,13,2,3,4,INK,null);line(c,[[0,11],[5,14],[10,10]],INK,2);for(let i=0;i<3;i++)line(c,[[-21+i*20,31],[-25+i*20,40+b]],'#87b9cb',4);leaf(c,23,-23,14,-.5,'#8aaf8c');
 }else if(fungus){
  ellipse(c,0,23,13,22,'#ead5a1',INK,3);line(c,[[-9,39],[-18,44]],INK,4);line(c,[[9,39],[18,44]],INK,4);
  c.beginPath();c.moveTo(-44,9);c.bezierCurveTo(-40,-48,37,-51,45,9);c.quadraticCurveTo(5,28,-44,9);c.fillStyle='#d48b93';c.fill();c.strokeStyle=INK;c.lineWidth=3;c.stroke();ellipse(c,0,11,44,10,'#f2d3a9',INK,3);
  for(const [a,b,r]of [[-21,-13,7],[8,-24,10],[29,-7,5]])ellipse(c,a,b,r,r*.7,'#ffe9bb',null);
  ellipse(c,-4,26,2.5,4,INK,null);ellipse(c,6,26,2.5,4,INK,null);line(c,[[-1,35],[4,37],[8,34]],INK,2);
 }else if(bird){
  line(c,[[-8,26],[-14,39],[-23,39]],INK,3);line(c,[[13,26],[18,39],[27,39]],INK,3);
  ellipse(c,0,0,31,28,'#7eabbe',INK,3);leaf(c,-28,-3,22,.2+b*.05,'#9dc4c5');leaf(c,29,-4,23,-.2-b*.05,'#9dc4c5');ellipse(c,14,-13,18,17,'#a6c6c7',INK,3);
  c.beginPath();c.moveTo(28,-12);c.lineTo(43,-6);c.lineTo(28,-1);c.closePath();c.fillStyle='#e4ba6e';c.fill();c.strokeStyle=INK;c.stroke();ellipse(c,20,-16,3.3,4.5,INK,null);
  c.save();c.rotate(-.2);c.fillStyle='#fff0bf';c.strokeStyle='#7a7052';c.lineWidth=2;c.fillRect(-16,3,32,22);c.strokeRect(-16,3,32,22);line(c,[[-16,3],[0,16],[16,3]],'#9e8c5d',2);ellipse(c,0,17,4,4,'#bb705b',null);c.restore();
 }else if(ring){
  c.rotate(.25);c.beginPath();c.moveTo(-37,-14);c.lineTo(-14,-36);c.lineTo(30,-25);c.lineTo(43,12);c.lineTo(12,35);c.lineTo(-29,26);c.closePath();c.fillStyle='#c5a584';c.fill();c.strokeStyle='#5c554f';c.lineWidth=3;c.stroke();line(c,[[-30,-11],[9,-19],[28,4],[9,25]],'#eee0b2',5);line(c,[[-9,-27],[-1,-9],[-13,8],[-2,30]],'#8a7668',3);ellipse(c,25,-12,3,3,'#fff0ba',null);
 }else if(pod){
  line(c,[[-19,27],[-27,42]],INK,4);line(c,[[19,27],[27,42]],INK,4);ellipse(c,0,0,29,36,'#d4a05c',INK,3);ellipse(c,-5,5,17,26,'#edc582',null);for(const xx of[-16,0,16])line(c,[[xx,-23],[xx*.8,25]],'#a67b47',2);leaf(c,-10,-32,20,-.65,'#83a85c');leaf(c,13,-30,19,.6,'#98b974');ellipse(c,-9,-2,3.5,5,INK,null);ellipse(c,11,-2,3.5,5,INK,null);line(c,[[-5,10],[2,16],[11,9]],INK,2.5);line(c,[[-25,7],[-40,1]],INK,3);line(c,[[25,7],[39,0]],INK,3);
 }else if(skid){
  leaf(c,0,0,49,-.16,name.includes('wax')?'#71b6a0':'#c7a46a');ellipse(c,3,7,26,12,'#e3ca91',INK,3);ellipse(c,-8,3,3,4,INK,null);ellipse(c,12,0,3,4,INK,null);line(c,[[-25,23],[24,14]],'#e4ebc0',4);line(c,[[-22,31],[13,24]],'#e4ebc0',2);
 }else if(frog){
  line(c,[[-20,14],[-37,31],[-46,26]],INK,5);line(c,[[20,14],[37,31],[46,26]],INK,5);ellipse(c,0,4,31,25,'#86b966',INK,3);leaf(c,-10,-12,35,-.4,'#9bc477');line(c,[[-21,-11],[-27,-31],[-36,-37]],INK,2);line(c,[[17,-12],[23,-33],[32,-38]],INK,2);ellipse(c,-14,-14,10,12,'#c4d38e',INK,3);ellipse(c,14,-16,10,12,'#c4d38e',INK,3);ellipse(c,-11,-14,4,6,INK,null);ellipse(c,17,-16,4,6,INK,null);line(c,[[-6,10],[2,17],[13,8]],INK,3);ellipse(c,-25,5,5,3,'#d4cf8c',null);
 }else{
  for(let i=0;i<3;i++){const yy=-10+i*15;line(c,[[-20,yy],[-36,yy-8],[-44,yy+1+b]],INK,4);line(c,[[20,yy],[36,yy-8],[44,yy+1-b]],INK,4);}
  ellipse(c,0,5,31,33,name.includes('archive')?'#b77c4a':'#a88767',INK,3);ellipse(c,-8,0,15,26,'#d9a562',null);line(c,[[0,-24],[0,35]],'#705b3e',3);for(const y of[-10,6,22]){line(c,[[-25,y],[-4,y+6]],'#8d6e44',2);line(c,[[6,y+6],[25,y]],'#8d6e44',2);}
  ellipse(c,0,-24,22,17,'#7f9c73',INK,3);line(c,[[-12,-36],[-20,-45],[-29,-45]],INK,2.5);line(c,[[12,-36],[20,-45],[29,-45]],INK,2.5);ellipse(c,-9,-25,5,7,'#f7ebbc',INK,1.8);ellipse(c,10,-25,5,7,'#f7ebbc',INK,1.8);ellipse(c,-7,-24,2,4,INK,null);ellipse(c,12,-24,2,4,INK,null);
 }
 // Larger encounters are separate named models, with their own readable marks.
 if(recipe?.variant){
  if(recipe.variant==='ancient'){leaf(c,-27,26,19,.25,'#9cad77');leaf(c,26,26,19,2.8,'#9cad77');line(c,[[-17,-19],[-2,-24],[14,-17]],'#f4e1ac',3);}
  else{const yy=recipe.variant==='elder'?-43:-35;c.beginPath();c.moveTo(-18,yy);c.lineTo(-20,yy-14);c.lineTo(-8,yy-8);c.lineTo(0,yy-23);c.lineTo(9,yy-8);c.lineTo(20,yy-14);c.lineTo(18,yy);c.closePath();c.fillStyle=recipe.variant==='elder'?'#9bae70':'#e6bd65';c.fill();c.strokeStyle=INK;c.lineWidth=2.5;c.stroke();ellipse(c,0,yy-7,3,3,'#f8e9ad',null);}
 }
 c.restore();
}
function objectBounds(o){if(o.points?.length){const xs=o.points.map(p=>p.x),ys=o.points.map(p=>p.y);return{minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};}const r=o.radius??1;return{minX:o.x-r,maxX:o.x+r,minY:o.y-r,maxY:o.y+r};}
export function drawGroveWorld(c,{camera,width:W,height:H,map,time=0,foreground=false,editor=false,showDoor=true}={}){
 if(!map)return;const cam=camera,s=cam.scale,alt=cam.y+(map.launch?.y??300),project=(x,y)=>[W/2+(x-cam.x)*s,H/2-(y-cam.y)*s];
 c.save();c.lineJoin='round';c.lineCap='round';
 if(!foreground)drawGroveBackdrop(c,{camera:cam,width:W,height:H,map,time,showDoor});
 const visible={minX:cam.x-W/(2*s)-4,maxX:cam.x+W/(2*s)+4,minY:cam.y-H/(2*s)-4,maxY:cam.y+H/(2*s)+4};
 const palette={...GROVE_MATERIALS,foliage:['#789c59','#b8ce83'],sap:['#c9913a','#f7d98b']};
 let objects=map.objects??[];
 if(!editor){let cached=objectCache.get(map);if(!cached){cached=objects.map(o=>({o,b:objectBounds(o)})).sort((a,b)=>(a.o.layer==='back'?-1:0)-(b.o.layer==='back'?-1:0));objectCache.set(map,cached);}objects=cached;}else objects=objects.map(o=>({o,b:objectBounds(o)})).sort((a,b)=>(a.o.layer==='back'?-1:0)-(b.o.layer==='back'?-1:0));
 let leafBudget=160;
 for(const {o,b} of objects){
  const layer=o.layer??'world';if((layer==='front')!==foreground)continue;
  if(o.type!=='enemy'&&(b.maxX<visible.minX||b.minX>visible.maxX||b.maxY<visible.minY||b.minY>visible.maxY))continue;
  c.save();if(o.collision===false)c.globalAlpha=/^oak-limb-/.test(o.id)&&o.material==='wood'?.83:editor?.55:layer==='back'?(o.material==='wood'?.52-.32*clamp((s-3)/24,0,1):.52):.7;
  if(o.type==='enemy'){const pose=encounterPose(o,editor?0:time);if(pose.x+o.radius<visible.minX||pose.x-o.radius>visible.maxX||pose.y+o.radius<visible.minY||pose.y-o.radius>visible.maxY){c.restore();continue;}const p=project(pose.x,pose.y),r=(o.radius??.5)*s,size=r*2;
   if(o.collision)drawGroveEnemyContactBody(c,o.kind,...p,r);
   if(size<12){if(o.collision){if(size>=4)ellipse(c,...p,r*.58,r*.48,enemyRecipe(o.kind)?.color??'#ba844c',null);}else ellipse(c,...p,Math.max(.45,size*.43),Math.max(.45,size*.4),enemyRecipe(o.kind)?.color??'#ba844c',INK,Math.min(.8,size*.08));}
   else drawGroveEnemy(c,o.kind??o.enemy??o.recipe,...p,size,time,o.encounter);c.restore();continue;
  }
  const colors=palette[o.material]??palette.wood;
  if(o.id?.startsWith('oak-limb-')&&o.material==='foliage'){c.restore();continue;}
  if(o.material==='foliage'&&!editor&&s<6){c.restore();continue;}
  if(['foliage','sap'].includes(o.material)){
   const sap=o.material==='sap',p=project((b.minX+b.maxX)/2,(b.minY+b.maxY)/2);
   c.beginPath();if(o.points){o.points.forEach((q,i)=>{const p=project(q.x,q.y);i?c.lineTo(...p):c.moveTo(...p);});c.closePath();}else c.ellipse(...p,o.radius*s,o.radius*s,0,0,TAU);
   c.globalAlpha*=sap?.82:editor?.18:.055;c.fillStyle=colors[0];c.fill();if(sap||editor){c.globalAlpha=sap?.9:.2;c.strokeStyle=colors[1];c.lineWidth=sap?2:.65;c.stroke();}c.globalAlpha=1;
   if(sap){const r=Math.min(20,(b.maxX-b.minX)*s*.18);ellipse(c,p[0]-r*.8,p[1]-r*.45,Math.max(1,r),Math.max(.8,r*.3),'#ffe5a0',null);ellipse(c,p[0]+r,p[1]+r*.2,Math.max(1,r*.3),Math.max(1,r*.3),'#ffefb7',null);}
   else if(s*.18>1.1){const x0=Math.max(b.minX,visible.minX),x1=Math.min(b.maxX,visible.maxX),y0=Math.max(b.minY,visible.minY),y1=Math.min(b.maxY,visible.maxY),spacing=Math.max(.65,Math.sqrt((x1-x0)*(y1-y0)/26));let count=0;
    for(let x=Math.ceil(x0/spacing)*spacing;x<=x1&&count<32&&leafBudget>0;x+=spacing)for(let y=Math.ceil(y0/spacing)*spacing;y<=y1&&count<32&&leafBudget>0;y+=spacing){const inside=o.points?pointInPolygon({x,y},o.points):Math.hypot(x-o.x,y-o.y)<o.radius;if(!inside)continue;const pp=project(x,y),seed=Math.sin(x*12.9+y*7.3);leaf(c,...pp,s*ordinaryLeafHalfLength(seed),seed*2,seed>0?'#8eaf67':'#779b58');count++;leafBudget--;}
    if(count===0&&leafBudget>0){leaf(c,...p,s*ordinaryLeafHalfLength(0),.3,'#8eaf67');leafBudget--;}
   }
   c.restore();continue;
  }
  if(o.type==='circle'){const p=project(o.x,o.y),r=(o.radius??1)*s;if(o.material==='bumper'){drawBotanicalBumper(c,o,{x:p[0],y:p[1],r,scale:s});c.restore();continue;}ellipse(c,...p,r,r,colors[0],INK,2.5);ellipse(c,p[0]-r*.15,p[1]-r*.16,r*.64,r*.58,colors[1],INK,1.4);ellipse(c,...p,r*.2,r*.2,'#f0dc9c',INK,1.5);}
  else if(o.points?.length){
   const simple=(s<1.5&&o.id.startsWith('great-bough-'))||s<.65||(b.maxY-b.minY)*s<2||(b.maxX-b.minX)*s<9;
   if(o.type==='polygon'&&!simple)drawMaterialPolygon(c,o,b,project,{width:W,height:H,scale:s});
   else{
    const stride=s<1.5&&/^(oak-limb-|jungle-limb-)/.test(o.id)?Math.max(1,Math.ceil(o.points.length/(s<.65?8:16))):1;
    const pts=o.points.filter((_,i)=>i%stride===0).map(p=>project(p.x,p.y));c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);
    if(o.type==='polygon'){c.closePath();c.fillStyle=colors[0];c.fill();}
    else{c.strokeStyle=INK;c.lineWidth=Math.max(.6,Math.min(16,(o.width??.16)*s+.45));c.stroke();line(c,pts,colors[0],Math.max(.25,Math.min(13,(o.width??.16)*s)));}
   }
  }

  // The authored opening's flexible stem mats have a warm, readable lip and
  // bound moss ribs. These marks follow the actual editable collision face.
  if(o.id.startsWith('opening-skip-')&&o.points?.length>=2){
   const a=project(o.points[0].x,o.points[0].y),z=project(o.points[1].x,o.points[1].y),dx=z[0]-a[0],dy=z[1]-a[1],length=Math.hypot(dx,dy);
   if(length>10){const nx=dy/length,ny=-dx/length;line(c,[a,z],'#2e4941',Math.max(3,Math.min(10,s*.13)));line(c,[a,z],'#b9d982',Math.max(1.8,Math.min(6,s*.075)));line(c,[[a[0]+nx*2,a[1]+ny*2],[z[0]+nx*2,z[1]+ny*2]],'#f4e8b2',Math.max(1,Math.min(2,s*.025)));
    for(let j=1;j<=Math.min(12,Math.floor(length/18));j++){const t=j/(Math.min(12,Math.floor(length/18))+1),x=a[0]+dx*t,y=a[1]+dy*t;line(c,[[x-nx*3,y-ny*3],[x-nx*7+dx/length*3,y-ny*7+dy/length*3]],'#4d7250',Math.max(1,Math.min(2,s*.025)));}
   }
  }
  c.restore();
 }
 if(!foreground)drawJungleFoliage(c,{map,project,scale:s,width:W,height:H});
 if(!foreground)drawOakCanopy(c,{map,project,scale:s,width:W,height:H,front:true});
 if(foreground)drawForestForeground(c,{project,camera:cam,scale:s,width:W,height:H,origin:map.launch.y});
 // Foreground decoration uses the same metre scale as the flight layer.
 // Never paste fixed-size leaves around the screen: they destroy scale cues.
 c.restore();
}
