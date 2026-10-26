import {drawProportionedForestBackdrop} from './proportioned-forest-art.js?v=71';
import {ordinaryLeafHalfLength,drawCanopySpray} from './grove-nature.js?v=71';
import {drawAncientTree} from './grove-tree-art.js?v=71';
import {drawJungleBackdrop} from './grove-jungle-art.js?v=71';
import {spaceScale} from './grove-map.js?v=71';
const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const blend=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
/** Every crown, trunk and forest tree is placed in metres. Parallax fades out
 * for wide views, where the whole silhouette must retain its true geometry. */
export function drawGroveBackdrop(c,{camera:cam,width:W,height:H,map,time=0,showDoor=true}){
 if(map.version===4)return drawProportionedForestBackdrop(c,{camera:cam,width:W,height:H,map,time,showDoor});
 const s=cam.scale,origin=map.launch.y,t=map.tree,k=spaceScale(map),alt=cam.y+origin,space=clamp((alt-890*k/2)/(210*k/2),0,1),dark=clamp((470*k/2-alt)/(350*k/2),0,1);
 const skyTop=blend('#8fbbb7','#183b43',dark),skyBottom=blend('#f3e7bb','#6e9e93',dark),g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,blend(skyTop,'#222b52',space));g.addColorStop(1,blend(skyBottom,'#69749d',space));c.fillStyle=g;c.fillRect(0,0,W,H);
 const project=(x,y)=>[W/2+(x-cam.x)*s,H/2-(y-cam.y)*s],depth=clamp((s-1)/8,0,1);
 const oval=(x,y,rx,ry,fill,stroke=null,par=1)=>{x+=(cam.x-t.trunkX)*(1-par)*depth;y+=(cam.y-(t.height*.78-origin))*(1-par)*depth;const p=project(x,y),a=rx*s,b=ry*s;if(p[0]+a<0||p[0]-a>W||p[1]+b<0||p[1]-b>H)return;c.beginPath();c.ellipse(...p,Math.max(.01,a),Math.max(.01,b),0,0,TAU);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=Math.min(2,Math.max(.6,s*.025));c.stroke();}};
 const stroke=(points,color,width)=>{c.beginPath();points.forEach(([x,y],i)=>{const p=project(x,y);i?c.lineTo(...p):c.moveTo(...p);});c.strokeStyle=color;c.lineWidth=Math.max(.6,width*s);c.lineCap='round';c.lineJoin='round';c.stroke();};
 if(space>.03){c.globalAlpha=space;for(let i=0;i<60;i++){const x=((i*173.17-cam.x*s*.008)%(W+30)+W+30)%(W+30),y=((i*91.37+cam.y*s*.005)%(H+30)+H+30)%(H+30);c.fillStyle='#fff3c8';c.fillRect(x,y,i%5===0?2:1,i%5===0?2:1);}c.globalAlpha=1;}
 if(space<.95){
  // Cloud banks occupy the sky around the tree, rather than covering its crown.
  for(let i=-4;i<13;i++){const x=i*165+Math.sin(i*2.4)*40,y=t.height+70+Math.sin(i*1.7)*75-origin;c.globalAlpha=(1-space)*.62;oval(x,y,65,12,'#eff0dc');oval(x-22,y+9,30,18,'#f4f3df');oval(x+16,y+11,35,24,'#f4f3df');}c.globalAlpha=1;
  drawJungleBackdrop(c,{project,camera:cam,scale:s,width:W,height:H,origin,parallax:depth});
  // Whole-tree views retain its real silhouette. At mouse scale the immense
  // crown is a distant mass, so transparent cool colour keeps local solids clear.
  const close=clamp((s-3)/24,0,1);c.save();c.globalAlpha=1-close*.92;
  drawAncientTree(c,{project,tree:t,origin,scale:s,width:W,height:H,camera:cam});c.restore();
  // Broad, cool distant trunks and crown arches give close canopy views a
  // woodland structure. Slow, fixed-world parallax keeps them behind the play
  // plane; soft curves have neither the dark outline nor flat lip of terrain.
  const canopy=clamp((s-10)/18,0,1)*clamp((alt-280*k/2)/(100*k/2),0,1)*clamp((t.height+35-alt)/70,0,1);
  if(canopy>0){for(let layer=0;layer<2;layer++){
   const par=.09+layer*.065,ds=s*par,baseStep=13+layer*4;
   // Both apparent size and camera motion use the distant projection. A
   // skipped-cell LOD keeps broad views sparse without changing world anchors.
   const step=baseStep*Math.max(1,Math.ceil(W/(ds*baseStep*4))),vertical=22*Math.max(1,Math.ceil(H/(ds*22*3)));
   const x0=Math.floor((cam.x-W/(2*ds)-7)/step)*step,y0=Math.floor((cam.y-H/(2*ds)-22)/vertical)*vertical;
   let budget=40;c.save();c.globalAlpha=canopy*(layer?.22:.16);
   const p=(x,y)=>[W/2+(x-cam.x)*ds,H/2-(y-cam.y)*ds];
   for(let x=x0;x<cam.x+W/(2*ds)+7&&budget>0;x+=step)for(let y=y0;y<cam.y+H/(2*ds)+18&&budget>0;y+=vertical){
    const seed=Math.sin(x*1.731+y*.371),family=Math.abs(Math.floor(Math.sin(x*.27+y*.13)*19))%3;
    const xx=x+Math.sin(x*.31+y*.27)*3.2,yy=y+Math.sin(x*.21+y*.37)*6,q=p(xx,yy),wide=.8+(seed+1)*.13,tall=.86+(1-seed)*.13,lean=Math.sin(x*.17-y*.21)*1.6;
    if(q[0]+9*ds<0||q[0]-9*ds>W||q[1]+18*ds<0||q[1]-22*ds>H)continue;
    const v=(u,h)=>p(xx+u*wide+lean*clamp((h+10)/24,0,1),yy+h*tall),left=family===1?-2.4:family===2?-2.8:-4.5,right=family===2?4.7:3.2;
    // Every trunk reaches the world floor. Lean, asymmetric branching and crown
    // family vary broad composition, without outlines or extra texture marks.
    c.beginPath();c.moveTo(...p(xx-.65,-origin));c.bezierCurveTo(...v(-.8,-5),...v(.4,2),...v(-1.1,7));c.quadraticCurveTo(...v(-2.1,10),...v(left,12));c.quadraticCurveTo(...v(-1,10),...v(-.1,8));c.quadraticCurveTo(...v(1,10),...v(right,12));c.quadraticCurveTo(...v(1.7,7),...v(1,3));c.bezierCurveTo(...v(.8,-3),...v(.35,-6),...p(xx+.75,-origin));c.closePath();c.fillStyle=layer?'#285f5b':'#4d8075';c.fill();
    c.beginPath();
    if(family===0){ // A spreading crown, open and gently scalloped underneath.
     c.moveTo(...v(-5.8,8));c.bezierCurveTo(...v(-7,11),...v(-4.2,13.2),...v(-1.8,12.1));c.bezierCurveTo(...v(.4,14.4),...v(5.9,13),...v(5.3,10));c.bezierCurveTo(...v(5,7.2),...v(2.1,7.5),...v(.3,8.6));c.bezierCurveTo(...v(-2,7.2),...v(-4.2,7.5),...v(-5.8,8));
    }else if(family===1){ // Tall rounded alder-like crowns leave narrow light gaps.
     c.moveTo(...v(-3.1,7));c.bezierCurveTo(...v(-5.4,8.7),...v(-4.7,15.5),...v(-1.2,16.6));c.bezierCurveTo(...v(2.2,18),...v(5.2,13.5),...v(3.5,9.8));c.bezierCurveTo(...v(2.8,6.5),...v(-.9,6),...v(-3.1,7));
    }else{ // Long drooping crowns frame an uneven, quiet negative space.
     c.moveTo(...v(-5.4,10));c.bezierCurveTo(...v(-5.7,14.8),...v(3.7,15.2),...v(5.9,11));c.quadraticCurveTo(...v(6.7,7),...v(5.3,5.6));c.quadraticCurveTo(...v(4.7,8.6),...v(3.6,9));c.quadraticCurveTo(...v(3.9,5.7),...v(2.2,5.1));c.quadraticCurveTo(...v(1.5,8.4),...v(-.3,9.1));c.quadraticCurveTo(...v(-2.8,7.6),...v(-4.1,5.8));c.quadraticCurveTo(...v(-6.6,6.6),...v(-5.4,10));
    }
    c.closePath();c.fillStyle=layer?'#3d776b':'#6b9987';c.fill();budget--;
   }c.restore();
  }}
  const radius=t.crownRadius??t.trunkWidth*3.6,half=(t.crownDepth??t.height*.44)/2,cy=t.height-half-origin,cx=t.trunkX;
  // Sparse botanical accents occupy stable world cells. Different fronds,
  // curled tips and seed sprays replace a screen-wide repeated leaf wallpaper.
  if(s>6&&alt<350*k/2){const area=W*H/(s*s),step=.95*Math.max(1,Math.ceil(Math.sqrt(area/14)/.95));let budget=14;
   const x0=Math.floor((cam.x-W/(2*s))/step)*step,y0=Math.floor((cam.y-H/(2*s))/step)*step;
   for(let x=x0;x<cam.x+W/(2*s)+step*.3&&budget>0;x+=step)for(let y=y0;y<cam.y+H/(2*s)+step*.3&&budget>0;y+=step){
    const inCrown=((x-cx)/radius)**2+((y-cy)/half)**2<1,inWoods=y+origin>2&&y+origin<350*k/2;if(!inCrown&&!inWoods)continue;
    const seed=Math.sin(x*9.3+y*7.7),family=Math.abs(Math.floor(x*11+y*17))%4,xx=x+seed*step*.23,yy=y+Math.cos(x+y)*step*.22,p=project(xx,yy),size=ordinaryLeafHalfLength(seed);
    c.save();c.translate(...p);c.scale(s,s);c.rotate(seed*2.2);c.globalAlpha=.18+(seed+1)*.09;
    drawCanopySpray(c,size,family,seed);c.restore();budget--;
   }
   if(alt<480*k/2){c.globalAlpha=.24;const x0=Math.floor((cam.x-W/(2*s))/13)*13;for(let x=x0;x<cam.x+W/(2*s);x+=13)stroke([[x,-origin+10],[x+Math.sin(x)*1.5,-origin+160*k/2],[x-1,-origin+335*k/2]],'#345f61',.07);c.globalAlpha=1;}
  }
  if(showDoor){
  const [dx,dy]=project(t.doorX,0),dw=1.4*s,dh=2.15*s;if(dx+dw>0&&dx-dw<W&&dy>0&&dy-dh<H){c.save();c.translate(dx,dy);c.beginPath();c.moveTo(-dw*.5,0);c.lineTo(-dw*.5,-dh+dw*.5);c.arc(0,-dh+dw*.5,dw*.5,Math.PI,TAU);c.lineTo(dw*.5,0);c.closePath();c.fillStyle='#253f40';c.fill();c.strokeStyle='#d2b777';c.lineWidth=Math.max(1,s*.06);c.stroke();c.fillStyle='#9b643e';c.fillRect(-dw*.37,-dh*.73,dw*.74,dh*.73);for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*dw*.22,-dh*.7);c.lineTo(i*dw*.22,0);c.strokeStyle='#d8a966';c.lineWidth=Math.max(.5,s*.025);c.stroke();}c.beginPath();c.arc(dw*.2,-dh*.37,Math.max(.6,s*.05),0,TAU);c.fillStyle='#f0d88d';c.fill();c.restore();}
  }
  if(alt<480*k/2){c.globalAlpha=.55;for(let i=0;i<32;i++)oval(-600+i*43,50+(i*31)%300-origin,.08,.08,'#e1d58f');c.globalAlpha=1;}
  // The ordinary physical floor has its own continuous contact edge. Unlike
  // background silhouettes it stays opaque and exactly at y=-launch altitude.
  const gy=project(0,-origin)[1];if(gy<H+2){
   const top=Math.max(0,gy),earth=c.createLinearGradient(0,top,0,Math.max(top+1,H));earth.addColorStop(0,'#a66c42');earth.addColorStop(.18,'#755136');earth.addColorStop(1,'#33483c');c.fillStyle=earth;c.fillRect(0,top,W,H-top);
   if(gy>=-2){c.fillStyle='#314e3a';c.fillRect(0,gy,W,Math.max(2,Math.min(13,s*.065)));c.fillStyle='#c9c978';c.fillRect(0,gy,W,Math.max(1,Math.min(3,s*.015)));}
   if(s>2){const step=Math.max(.55,22/s),x0=Math.floor((cam.x-W/(2*s))/step)*step;let budget=48;
    for(let x=x0;x<cam.x+W/(2*s)&&budget-->0;x+=step){const seed=Math.sin(x*11.3),p=project(x,-origin-.1-Math.abs(seed)*.16),r=Math.min(7,s*.025);c.beginPath();c.moveTo(p[0]-r,p[1]);c.quadraticCurveTo(p[0],p[1]-r*.55,p[0]+r*1.5,p[1]+r*.4);c.strokeStyle=seed>0?'#dfab6a':'#4c4933';c.lineWidth=Math.max(.7,s*.007);c.stroke();}
   }
  }

 }
}
