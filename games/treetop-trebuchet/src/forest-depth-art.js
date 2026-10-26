import {drawLeafVolume} from './oak-canopy-art.js?v=71';
import {foliageClump,fern,liana} from './grove-nature.js?v=71';
const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const noise=n=>{const q=Math.sin(n*127.1+311.7)*43758.5453;return q-Math.floor(q);};
/** The forest interior is opaque below 25 m at every horizontal coordinate.
 * World-anchored trees and undergrowth sit on that continuous distant mass.
 * These distant silhouettes never introduce terrain or collision contacts. */
export function drawDenseJungle(c,{project,camera:cam,scale:s,width:W,height:H,origin}){
 const clump=(c,project,x,y,rx,ry,...rest)=>{const p=project(x,y);if(p[0]+rx*s*1.15<0||p[0]-rx*s*1.15>W||p[1]+ry*s*1.15<0||p[1]-ry*s*1.15>H)return;foliageClump(c,project,x,y,rx,ry,rest[0],rest[0],rest[2],rest[3]);};
 const roof=project(0,25-origin)[1];if(roof>H+8*s)return;
 c.save();const top=Math.max(0,roof),g=c.createLinearGradient(0,top,0,Math.max(top+1,H));
 g.addColorStop(0,'#4d755a');g.addColorStop(.24,'#305c4a');g.addColorStop(.7,'#244c42');g.addColorStop(1,'#1c3c35');c.fillStyle=g;c.fillRect(0,top,W,H-top);
 const left=cam.x-W/(2*s),right=cam.x+W/(2*s),bottom=cam.y-H/(2*s),high=cam.y+H/(2*s);
 // Overlapping crowns are a roof, not a row of separated specimen trees.
 for(let layer=0;layer<3;layer++){
  const spacing=layer===0?7:layer===1?9:12,step=spacing*Math.max(1,Math.ceil(W/s/spacing/6));
  for(let cell=Math.floor(left/step)-1;cell<=Math.ceil(right/step)+1;cell++){
   const seed=cell*17+layer*91,r=noise(seed),x=cell*step+(noise(seed+3)-.5)*spacing*.6;
   const height=25+noise(seed+2)*5,y=height-origin,rx=step*(.75+noise(seed+4)*.3),ry=3.2+r*2.7;
   const colors=[['#547b63','#6e9370'],['#38694f','#6a8b5b'],['#285840','#66844b']][layer];
   if(y+ry<bottom||y-32>high)continue;
   // Buttressed trunks lean, fork below the canopy and disappear into shade.
   const base=-origin,w=.35+noise(seed+8)*.55,lean=(r-.5)*2.8,tip=x+lean;
   if(y-ry<high&&y>bottom&&x>left-3&&x<right+3){
    c.beginPath();c.moveTo(...project(x-w*2,base));c.bezierCurveTo(...project(x-w,base+3),...project(tip-w*.55,y-11),...project(tip-w*.35,y-4));c.lineTo(...project(tip+w*.35,y-4));c.bezierCurveTo(...project(tip+w*.7,y-13),...project(x+w,base+2),...project(x+w*2.2,base));c.closePath();c.fillStyle=layer===0?'#466752':layer===1?'#32533f':'#304b35';c.fill();
    for(let side=-1;side<=1;side+=2){c.beginPath();c.moveTo(...project(tip,y-7));c.bezierCurveTo(...project(tip+side*1.5,y-5),...project(tip+side*rx*.5,y-5.5),...project(tip+side*rx*.8,y-2.5));c.strokeStyle=layer===2?'#3d573a':'#49674c';c.lineWidth=Math.max(.6,s*.24);c.lineCap='round';c.stroke();}
   }
   if(y+2>bottom&&y-ry*2<high){
    clump(c,project,tip,y-ry,rx,ry,colors[0],colors[0],seed,s<8);
    for(let j=0;j<(s<8?2:4);j++){const xx=tip+(j-(s<8?.5:1.5))*rx*.45,yy=y-ry*.65+Math.sin(j*1.7+seed)*ry*.3;clump(c,project,xx,yy,rx*.39,ry*(.62+noise(seed+j)*.18),j%2?colors[0]:colors[1],colors[1],seed+j,s<8);}
   }
   if(s>3&&layer===2&&y-5>bottom&&base<high&&tip>left-rx&&tip<right+rx){
    // Fixed vines trail from branches, never follow the screen edges.
    liana(c,project,tip+rx*.43,y-3,8+r*12,'#547148',.055);
    if(s>10)liana(c,project,tip-rx*.47,y-4,6+r*9,'#385740',.035);
   }
  }
 }
 // Interior foliage tiers erase the empty trunk-only park appearance. Their
 // darkest greens are still foliage, with no pale sky or transparent gaps.
 for(let layer=0;layer<3;layer++){
  const altitude=[4,11,19][layer],rx=[3.7,4.7,5.8][layer],step=rx*1.25*Math.max(1,Math.ceil(W/s/(rx*1.25)/7));
  if(altitude+6-origin<bottom||altitude-6-origin>high)continue;
  for(let i=Math.floor(left/step)-1;i<=Math.ceil(right/step)+1;i++){
   const seed=i*31+layer*73,x=i*step+noise(seed)*rx*.3,y=altitude-origin+(noise(seed+1)-.5)*7.5;
   clump(c,project,x,y,Math.max(rx,step*.78),2.8+noise(seed+2)*1.8,['#264d3b','#315c40','#3b6748'][layer],['#4e744b','#527b51','#5d8355'][layer],seed,s<8);
   if(layer===0&&s>3)fern(c,project,x,y-2,.8+noise(seed)*1.2,'#4d774b',false);
  }
 }
 // Middle-distance trunks remain visible between the foliage tiers. Their
 // roots, lianas and epiphytes give the interior vertical structure, rather
 // than turning a closed forest into horizontal bands of green wallpaper.
 const trunkStep=8*Math.max(1,Math.ceil(W/s/8/9));
 for(let i=Math.floor(left/trunkStep)-1;i<=Math.ceil(right/trunkStep)+1;i++){
  const seed=i*41,x=i*trunkStep+noise(seed)*2,height=22+noise(seed+2)*5,w=.24+noise(seed+4)*.38,lean=(noise(seed+3)-.5)*2;
  if(x<left-2||x>right+2||height-origin<bottom)continue;
  c.save();c.globalAlpha=.55;
  c.beginPath();c.moveTo(...project(x-w*2,-origin));c.bezierCurveTo(...project(x-w*.6,3-origin),...project(x+lean-w,height-9-origin),...project(x+lean-w*.24,height-origin));c.lineTo(...project(x+lean+w*.24,height-origin));c.bezierCurveTo(...project(x+lean+w,height-8-origin),...project(x+w*.6,3-origin),...project(x+w*2.3,-origin));c.closePath();c.fillStyle='#26463c';c.fill();
  c.beginPath();c.moveTo(...project(x+w*.3,1-origin));c.bezierCurveTo(...project(x+w*.5,7-origin),...project(x+lean,height-5-origin),...project(x+lean,height-origin));c.strokeStyle='#66805a';c.lineWidth=Math.max(.45,s*.045);c.stroke();
  c.globalAlpha=.65;if(s>3){liana(c,project,x+lean+.4,height-origin,8+noise(seed)*8,'#718450',.035);const fy=12+noise(seed+6)*6-origin;if(fy>bottom-2&&fy<high+2)fern(c,project,x+lean*.65,fy,.8+noise(seed+8),'#608452',false);}
  c.restore();
 }
 // Thin fixed-world creepers add depth at close range with a bounded budget.
 if(s>18){const step=Math.max(.7,W/s/12);let n=0;for(let x=Math.floor(left/step)*step;x<right&&n<14;x+=step,n++){
  const y=clamp(cam.y,2-origin,22-origin);c.globalAlpha=.18;liana(c,project,x,y+H/s*.6,Math.min(8,H/s*1.3),'#92aa69',.014);
 }}
 c.restore();
}

/** The editable jungle trees have leaf fans on their real terminal branches,
 * not bare telephone-pole forks in front of the distant forest. */
export function drawJungleFoliage(c,{map,project,scale:s,width:W,height:H}){
 if(map.version!==4||map.starterRevision<11)return;
 c.save();c.globalAlpha*=1-clamp((s-18)/70,0,1)*.82;
 for(const [i,o]of map.objects.entries()){
  if(/^amazon-tree-\d+-crown$/.test(o.id)){
   const xs=o.points.map(p=>p.x),ys=o.points.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),x=(minX+maxX)/2,y=(minY+maxY)/2,rx=(maxX-minX)/2,ry=(maxY-minY)/2;
   drawLeafVolume(c,project,{x,y,rx,ry,seed:i},s,W,H,false);
   drawLeafVolume(c,project,{x:x-rx*.22,y:y+ry*.25,rx:rx*.75,ry:ry*.72,seed:i+4},s,W,H,true);
  }else if(/^jungle-limb-\d+-\d+$/.test(o.id)){
   if(s<8&&!o.id.endsWith('-1'))continue;
   const a=o.points[o.points.length/2-1],b=o.points[o.points.length/2],x=(a.x+b.x)/2,y=(a.y+b.y)/2;
   drawLeafVolume(c,project,{x,y:y+.6,rx:1.5+(i%3)*.35,ry:1.2,seed:i},s,W,H,i%2===0);
  }
 }
 c.restore();
}
