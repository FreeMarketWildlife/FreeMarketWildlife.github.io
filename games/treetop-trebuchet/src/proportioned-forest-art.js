import {drawDenseJungle} from './forest-depth-art.js?v=66';
import {drawOakCanopy} from './oak-canopy-art.js?v=66';
import {drawProportionedOak} from './grove-tree-art.js?v=66';
import {foliageClump,ordinaryLeafHalfLength,drawCanopySpray} from './grove-nature.js?v=66';
import {mapLevels} from './grove-map.js?v=66';
const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const blend=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
/** Derive decorative crowns from canonical editable props, not another forest
 * generator with different positions, dimensions or apparent landing faces. */
export function proportionedForestCrowns(map){
 return(map.objects??[]).filter(o=>/^amazon-tree-\d+-crown$/.test(o.id)&&o.collision===false&&o.points?.length).map(o=>{const xs=o.points.map(p=>p.x),ys=o.points.map(p=>p.y);return{id:o.id,minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};});
}
/** V4 physical-height scenery. V2/V3 keep their original renderer verbatim. */
export function drawProportionedForestBackdrop(c,{camera:cam,width:W,height:H,map,showDoor=true}){
 const s=cam.scale,origin=map.launch.y,t=map.tree,alt=cam.y+origin,spaceLevel=mapLevels(map).find(l=>l.id==='space'),space=clamp((alt-(spaceLevel?.low??960))/Math.max(1,(spaceLevel?.high??3000)-(spaceLevel?.low??960)),0,1),understory=clamp((35-alt)/35,0,1);
 const project=(x,y)=>[W/2+(x-cam.x)*s,H/2-(y-cam.y)*s],visible=(x,y,rx,ry)=>{const p=project(x,y);return p[0]+rx*s>0&&p[0]-rx*s<W&&p[1]+ry*s>0&&p[1]-ry*s<H;};
 const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,blend(blend('#a6c6be','#476f68',understory),'#182440',space));sky.addColorStop(1,blend(blend('#f0e5b5','#a5b68a',understory),'#536181',space));c.fillStyle=sky;c.fillRect(0,0,W,H);
 if(space>0){c.save();c.globalAlpha*=space;for(let i=0;i<56;i++){const x=((i*173.17-cam.x*s*.006)%(W+20)+W+20)%(W+20),y=((i*91.37+cam.y*s*.004)%(H+20)+H+20)%(H+20);c.fillStyle='#fff3ce';c.fillRect(x,y,i%7?1:2,i%7?1:2);}c.restore();}
 if(space<.96){
  // Physical cloud banks above the 110 m oak. Their positions do not follow
  // the viewport; the clear lower sky keeps the oak's broad crown readable.
  for(let i=-2;i<6;i++){const x=90*i+Math.sin(i*2.7)*16,y=t.height+29+Math.sin(i*1.8)*12-origin;if(!visible(x,y,28,7))continue;c.save();c.globalAlpha*=(1-space)*.46;foliageClump(c,project,x,y,26,5,'#f8f2d8','#f8f2d8',i,true);foliageClump(c,project,x-7,y+3,12,5,'#f8f2d8','#f8f2d8',i+2,true);c.restore();}
  drawDenseJungle(c,{project,camera:cam,scale:s,width:W,height:H,origin});
  // Quiet leaf masses fit inside the authored 35–60 m Amazon tree crowns.
  // The canonical back polygons supply their trunks and editor selection.
  const crowns=proportionedForestCrowns(map).filter(b=>visible((b.minX+b.maxX)/2,(b.minY+b.maxY)/2,(b.maxX-b.minX)/2,(b.maxY-b.minY)/2));
  for(const b of map.starterRevision>=11?[]:crowns){const x=(b.minX+b.maxX)/2,y=(b.minY+b.maxY)/2,rx=(b.maxX-b.minX)/2,ry=(b.maxY-b.minY)/2;if(!visible(x,y,rx,ry))continue;
   c.save();c.globalAlpha*=.68;const p=project(x,y);c.beginPath();c.ellipse(...p,rx*s,ry*s,0,0,TAU);c.clip();
   const count=crowns.length>12?2:Math.min(rx,ry)*s<18?3:5,coarse=count<5||s<2;
   for(let j=0;j<count;j++)foliageClump(c,project,x+rx*(j-(count-1)/2)*(count===2?.65:.38),y+ry*Math.sin(j*1.9)*.26,rx*.46,ry*.71,j%2?'#517c63':'#729779','#a7bb89',j,coarse);c.restore();
  }
  if(map.starterRevision>=11)drawOakCanopy(c,{map,project,scale:s,width:W,height:H});
  drawProportionedOak(c,{project,tree:t,origin,scale:s,width:W,height:H,camera:cam,canopy:map.starterRevision<11});
  // Centimetre leaves, not scaled-up crown-sized leaves. Only the viewport's
  // visible crown/forest cells are visited, with a strict small spray budget.
  if(s>14&&alt<110){const step=Math.max(.65,Math.sqrt(W*H/(s*s*16))),left=cam.x-W/(2*s),bottom=cam.y-H/(2*s),half=t.crownDepth/2,cy=t.height-half-origin;let budget=16;
   for(let x=Math.floor(left/step)*step;x<left+W/s+step&&budget>0;x+=step)for(let y=Math.floor(bottom/step)*step;y<bottom+H/s+step&&budget>0;y+=step){const a=y+origin,inCrown=((x-t.trunkX)/t.crownRadius)**2+((y-cy)/half)**2<1,inForest=a>1&&a<45;if(!inCrown&&!inForest)continue;
    const seed=Math.sin(x*9.3+y*7.7),p=project(x+seed*step*.16,y+Math.cos(x+y)*step*.16);c.save();c.translate(...p);c.scale(s,s);c.rotate(seed*1.8);c.globalAlpha*=.13+(seed+1)*.04;drawCanopySpray(c,ordinaryLeafHalfLength(seed),Math.abs(Math.floor(x*7+y*13))%4,seed);c.restore();budget--;
   }
  }
  if(showDoor){
  const [dx,dy]=project(t.doorX,0),dw=1.4*s,dh=2.15*s;if(dx+dw>0&&dx-dw<W&&dy>0&&dy-dh<H){c.save();c.translate(dx,dy);c.beginPath();c.moveTo(-dw*.5,0);c.lineTo(-dw*.5,-dh+dw*.5);c.arc(0,-dh+dw*.5,dw*.5,Math.PI,TAU);c.lineTo(dw*.5,0);c.closePath();c.fillStyle='#2c4439';c.fill();c.strokeStyle='#d7b375';c.lineWidth=Math.max(.6,s*.04);c.stroke();c.fillStyle='#9c7347';c.fillRect(-dw*.37,-dh*.73,dw*.74,dh*.73);for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(i*dw*.22,-dh*.7);c.lineTo(i*dw*.22,0);c.strokeStyle='#d2ab72';c.lineWidth=Math.max(.4,s*.018);c.stroke();}c.beginPath();c.arc(dw*.2,-dh*.37,Math.max(.5,s*.04),0,TAU);c.fillStyle='#ead39a';c.fill();c.restore();}
  }
 }
 // One honest physical floor. This decoration never adds a raised contact lip.
 const gy=project(0,-origin)[1];if(gy<H+2){const top=Math.max(0,gy),earth=c.createLinearGradient(0,top,0,Math.max(top+1,H));earth.addColorStop(0,'#957043');earth.addColorStop(.18,'#6c5439');earth.addColorStop(1,'#344a3b');c.fillStyle=earth;c.fillRect(0,top,W,H-top);if(gy>=-2){c.fillStyle='#3f5e3e';c.fillRect(0,gy,W,Math.max(1,Math.min(7,s*.04)));c.fillStyle='#c5c182';c.fillRect(0,gy,W,Math.max(.6,Math.min(2,s*.012)));}}
}
