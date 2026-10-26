// C7 layers and native residents. Display enlargement is nearest-neighbor;
// the authored habitat remains 192×144, and no simulation data is mutated.
import {drawLiving,drawCritter,animatedFrame} from './living-art.js';
import {drawHomeArt,hasHomeArt,homeAnimationFrame} from './home-art.js';
const buffers=new WeakMap();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function nativeCanvas(canvas){let b=buffers.get(canvas);if(!b){b=document.createElement('canvas');b.width=224;b.height=144;buffers.set(canvas,b);}return b;}
export function renderTank(canvas,tank,time=0,{frame=50,zoom=1,reticle=false,habitat='terrarium',demonstration=false}={}){
 const native=nativeCanvas(canvas),c=native.getContext('2d'),target=canvas.getContext('2d');c.imageSmoothingEnabled=target.imageSmoothingEnabled=false;
 c.clearRect(0,0,224,144);rect(c,0,0,224,144,'#183c40');c.save();c.translate(16,0);
 if(demonstration)drawLiving(c,habitat,animatedFrame(habitat,time),0,0);
 else {
  const modern=hasHomeArt('terrarium-back');
  if(modern)drawHomeArt(c,'terrarium-back',0,0);else drawLiving(c,'terrarium-back',0,0,0);
  c.save();c.beginPath();c.rect(13,19,165,93);c.clip();
  // State selects authored native material planes; it never changes simulation data.
  const moisture=clamp(tank.moisture,0,100),soil=['#b5a077','#ac946b','#a18a62','#8d7b57','#756849'][Math.min(4,Math.floor(moisture/20))];
  if(modern){for(const [x,last,y]of[[13,30,90],[31,55,87],[56,78,90],[79,102,86],[103,134,90],[135,160,88],[161,177,91]])rect(c,x,y,last-x+1,112-y,soil);rect(c,14,109,163,3,'#554b38');}
  for(let i=0;i<clamp(tank.plants,0,6);i++){const x=18+i*24,y=93+i%3*3;if(modern)drawHomeArt(c,'moss',x,y-5);else{rect(c,x,y,17,5,'#38694a');rect(c,x+2,y-2,12,4,'#83b467');}}
  if(tank.hide){if(modern)drawHomeArt(c,'hide',76,76);else{rect(c,67,85,26,16,'#705039');rect(c,74,88,11,13,'#253e37');}}
  for(let i=0;i<Math.floor(clamp(tank.food,0,100)/8);i++){const x=18+i*37%145,y=95-i%3*4;if(modern)drawHomeArt(c,'litter',x,y);else rect(c,x,y,5,2,'#caaa66');}
  const speed=tank.stress>50?.3:1;
  for(let i=0;i<Math.min(8,tank.isopods||0);i++){const x=12+Math.floor((i*29+time*speed*2)%139),y=70+i%4*3;if(modern)drawHomeArt(c,homeAnimationFrame('micro-isopod',time*speed+i*.17),x,y);else drawCritter(c,'isopod',x,y,time*speed+i*.17);}
  for(let i=0;i<Math.min(10,tank.springtails||0);i++){const x=12+Math.floor((i*19+time*speed)%141),y=73+i%4*3;if(modern)drawHomeArt(c,homeAnimationFrame('micro-springtail',time*speed+i*.21),x,y);else drawCritter(c,'springtail',x,y,time*speed+i*.21);}
  for(let i=0;i<Math.floor(clamp(tank.waste,0,100)/8);i++){const x=20+i*43%149,y=106-i%3*2;rect(c,x,y,3,2,'#4a4434');rect(c,x+1,y-1,2,1,'#6a5f42');}
  for(let i=0;i<Math.floor(clamp(tank.algae,0,100)/5);i++){const x=18+i*29%151,y=26+i*17%68;rect(c,x,y,3,2,'#91ad6b');rect(c,x+1,y-1,3,2,'#76935b');}
  if(moisture>78)for(let i=0;i<8;i++){const x=19+i*37%148,y=22+i*23%68;rect(c,x,y,1,3,'#b5d3c5');rect(c,x-1,y+3,3,2,'#9dbfb5');}
  c.restore();if(modern)drawHomeArt(c,'terrarium-foreground',0,0);else drawLiving(c,'terrarium-foreground',0,0,0);
 }
 c.restore();
 const z=clamp(zoom,1,1.6),w=Math.round(192/z),h=Math.round(144/z),x=Math.round((224-w)*clamp(frame,0,100)/100),y=Math.round((144-h)/2);
 target.clearRect(0,0,canvas.width,canvas.height);target.drawImage(native,x,y,w,h,0,0,canvas.width,canvas.height);
 if(reticle){target.save();target.scale(canvas.width/192,canvas.height/144);for(const [x,y,dx,dy]of [[20,23,1,1],[171,23,-1,1],[20,109,1,-1],[171,109,-1,-1]]){rect(target,x+(dx<0?-7:0),y,8,1,'#f4edcc');rect(target,x,y+(dy<0?-7:0),1,8,'#f4edcc');}target.restore();}
}
export function renderSpecimen(canvas,slug,time){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,canvas.width,canvas.height);drawCritter(c,slug,0,0,time);}
