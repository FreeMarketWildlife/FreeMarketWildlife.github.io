import {foliageClump,fern,liana} from './grove-nature.js?v=71';
// Four botanical strata in a shared world, with depth fading to zero when the
// player zooms out. Background trees never masquerade as collision platforms.
export function drawJungleBackdrop(c,{project,camera:cam,scale:s,width:W,height:H,origin,parallax}){
 const visible=(x,y,rx,ry)=>{const p=project(x,y);return p[0]+rx*s>0&&p[0]-rx*s<W&&p[1]+ry*s>0&&p[1]-ry*s<H;};
 for(let layer=0;layer<3;layer++){
  const spacing=165-layer*25,par=1-(.1+layer*.035)*parallax,offset=cam.x*(1-par),x0=Math.floor((cam.x-W/(2*s)-110-offset)/spacing)*spacing;
  // Continuous scalloped foliage shelves close the gaps between tree crowns.
  // These sit at different world altitudes, never as screen-space skyboxes.
  for(const [band,thickness]of[[280+layer*35,115],[70+layer*16,52]]){
   const left=cam.x-W/(2*s)-80,right=cam.x+W/(2*s)+80,step=Math.max(32,(right-left)/32),base=band-origin;c.beginPath();c.moveTo(...project(left,base-thickness));for(let x=left;x<=right+step*.1;x+=step){const n=Math.sin(x*.019+layer)*19+Math.cos(x*.049)*9;c.quadraticCurveTo(...project(x-step*.5,base+n+15),...project(x,base+n));}for(let x=right;x>=left-step*.1;x-=step){const n=Math.sin(x*.025+layer)*12;c.quadraticCurveTo(...project(x+step*.5,base-thickness+n-9),...project(x,base-thickness+n));}c.closePath();c.fillStyle=layer===0?'#7ca59b':layer===1?'#4c8078':'#2d6261';c.fill();
  }
  const bark=['#73988e','#4c786f','#315b58'][layer],foliage=['#7da99a','#4a887b','#2e6a64'][layer],light=['#b0cba4','#8aba96','#79ab87'][layer];
  for(let i=0,x=x0;i<Math.min(34,Math.ceil(W/s/spacing)+4);i++,x+=spacing){
   const n=Math.floor(x/spacing),xx=x+offset+Math.sin(n*2.8+layer)*26,h=260+layer*45+Math.sin(n*1.9+layer)*52+(n%5===0?110:0),base=-origin,yy=base+h,tw=5+layer*3;
   if(!visible(xx,base+h/2,95,h/2+70))continue;
   c.beginPath();c.moveTo(...project(xx-tw*2,base));c.bezierCurveTo(...project(xx-tw,base+12),...project(xx-tw*.5,yy-h*.3),...project(xx-2,yy));c.lineTo(...project(xx+tw*.7,yy));c.quadraticCurveTo(...project(xx+tw*.5,base+20),...project(xx+tw*2,base));c.closePath();c.fillStyle=bark;c.fill();
   for(let side of[-1,1]){c.beginPath();c.moveTo(...project(xx,yy-h*.32));c.quadraticCurveTo(...project(xx+side*17,yy-15),...project(xx+side*67,yy+6));c.strokeStyle=bark;c.lineWidth=Math.max(.6,tw*s*.6);c.stroke();}
   if(s<.65||(s<1.5&&W/s>500))foliageClump(c,project,xx,yy,92,36,foliage,light,n,true);
   else for(let j=0;j<4;j++)foliageClump(c,project,xx+(j-1.5)*35,yy+Math.sin(j*2+n)*15,49,22+(j%2)*9,foliage,light,n+j);
   if(s>1){liana(c,project,xx+25,yy-5,h*.52,light,.23);liana(c,project,xx-42,yy,h*.38,light,.2);}
  }
 }
 // Ferns and broad-leaf shrubs form a second, much lower vegetation tier.
 const step=s>3?3.4:24,start=Math.floor((cam.x-W/(2*s)-30)/step)*step,end=cam.x+W/(2*s)+30;
 for(let x=start,i=0;x<end&&i<80;x+=step,i++){
  const n=Math.floor(x/step),y=-origin+Math.sin(n*2)*1.4,size=s>3?1.1+(Math.sin(n*7)+1)*.3:12+(Math.sin(n*7)+1)*7;
  if(!visible(x,y,size,size*1.2))continue;
  if(s>1.3)fern(c,project,x,y,size,n%2?'#2d655b':'#528667',false);
  else if(s>.65)foliageClump(c,project,x,y+size*.3,size,size*.5,n%2?'#2c5d54':'#457a62','#8dbb89',n,true);
 }
 // Leaf litter, exposed roots, shelf fungi and tiny lights on the forest floor.
 const gy=project(0,-origin)[1];if(gy<H){const g=c.createLinearGradient(0,gy,0,Math.max(gy+1,H));g.addColorStop(0,'#9a7147');g.addColorStop(.12,'#6e5539');g.addColorStop(1,'#263f3b');c.fillStyle=g;c.fillRect(0,Math.max(0,gy),W,H-Math.max(0,gy));}
 if(s>2){const step=Math.max(1.4,9/s),low=Math.floor((cam.x-W/(2*s))/step)*step;for(let x=low,i=0;x<cam.x+W/(2*s)&&i<90;x+=step,i++){const n=Math.sin(x*19),p=project(x,-origin+.02);c.beginPath();c.ellipse(p[0],p[1]-1,Math.max(1,s*.15),Math.max(.6,s*.045),n,0,Math.PI*2);c.fillStyle=n>0?'#ddaa61':'#99704a';c.fill();}}
}

export function drawForestForeground(c,{project,camera:cam,scale:s,width:W,height:H,origin}){
 const ground=-origin,gy=project(0,ground)[1];if(s<3||gy<-s*2||gy>H+s*2)return;
 const step=1.7,x0=Math.floor((cam.x-W/(2*s)-1)/step)*step;let budget=10;
 for(let x=x0;x<cam.x+W/(2*s)+1&&budget>0;x+=step){
  const n=Math.sin(x*19.3),size=.65+(n+1)*.3;
  fern(c,project,x,ground+.02,size,n>0?'#5a9a73':'#2d6b5c',size*s>9);budget--;
  const p=project(x+.6,ground+.08),r=s*.09;c.beginPath();c.ellipse(p[0],p[1],r,r*.44,.2,0,Math.PI*2);c.fillStyle='#ddbc78';c.fill();
  if(n>.2){c.beginPath();c.moveTo(...project(x+.42,ground));c.lineTo(...project(x+.44,ground+.17));c.strokeStyle='#c6b98e';c.lineWidth=Math.max(.6,s*.025);c.stroke();const q=project(x+.44,ground+.17);c.beginPath();c.ellipse(q[0],q[1],s*.09,s*.045,-.1,Math.PI,Math.PI*2);c.fillStyle='#d58a61';c.fill();}
 }
}
