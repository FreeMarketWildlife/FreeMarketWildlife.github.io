function compactPath(points,tolerance){if(points.length<3)return points;const a=points[0],b=points.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],dd=dx*dx+dy*dy;let worst=tolerance*tolerance,index=-1;for(let i=1;i<points.length-1;i++){const p=points[i],t=dd?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/dd)):0,ex=p[0]-a[0]-t*dx,ey=p[1]-a[1]-t*dy,d=ex*ex+ey*ey;if(d>worst){worst=d;index=i;}}return index<0?[a,b]:[...compactPath(points.slice(0,index+1),tolerance).slice(0,-1),...compactPath(points.slice(index),tolerance)];}
/** Original material illustration follows the exact editable polygon silhouette.
 * Broad bark seams, leaf folds and stone facets are decoration, never terrain. */
const INK='#302d2b',clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const GROVE_MATERIALS={wood:['#a5663e','#d6a15a'],leaf:['#738d52','#c2d58c'],stone:['#617b80','#b3c7bb'],bumper:['#bd6a4e','#f2cf79']};
const stroke=(c,pts,color,width)=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
export function drawMaterialPolygon(c,o,b,project,{width:W,height:H,scale:s}){
 const colors=GROVE_MATERIALS[o.material]??GROVE_MATERIALS.wood,pts=o.points.map(p=>project(p.x,p.y));
 if(/^(oak-limb-|jungle-limb-)/.test(o.id)&&pts.length===26){
  // Follow curved wood grain along the actual ribbon. Leave the root cap
  // unoutlined so forks blend into their parent instead of looking bolted on.
  const upper=[],lower=[],grain=[];
  for(let i=0;i<13;i++){const a=pts[i],b=pts[25-i],lo=a[1]>b[1]?a:b,hi=lo===a?b:a;upper.push(hi);lower.push(lo);grain.push([hi[0]*.65+lo[0]*.35,hi[1]*.65+lo[1]*.35]);}
  const tolerance=s<8?.25:0,outline=tolerance?[...compactPath(pts.slice(0,13),tolerance),...compactPath(pts.slice(13),tolerance)]:pts,g=tolerance?compactPath(grain,tolerance):grain,l=tolerance?compactPath(lower,tolerance):lower;
  c.beginPath();outline.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle='#96734b';c.fill();
  c.beginPath();g.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));for(const p of [...l].reverse())c.lineTo(...p);c.closePath();c.fillStyle='#654b33';c.fill();
  stroke(c,outline,'#3d382b',clamp(s*.025,.45,1.4));
  if(s>2.5)stroke(c,g,'#c0a06b',clamp(s*.018,.35,1.2));
  return;
 }

 c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=colors[0];c.fill();
 if(s<3){c.strokeStyle=INK;c.lineWidth=.65;c.stroke();return;}
 c.save();c.clip();
 const left=Math.max(-40,project(b.minX,0)[0]),right=Math.min(W+40,project(b.maxX,0)[0]),top=project(0,b.maxY)[1],bottom=project(0,b.minY)[1],thick=bottom-top;
 if(o.material==='stone'||o.material==='bumper'){c.fillStyle=o.material==='stone'?'#425f68':'#833f39';c.fillRect(left,top+thick*.67,Math.max(0,right-left),Math.max(0,thick*.33));}
 if(o.material==='leaf'){
  // A waxy ribbed leaf surface, not a timber plank. All growth is inside the
  // exact authored face; the top contact edge stays clean and unambiguous.
  const a=o.points[0],z=o.points[1],dx=z.x-a.x,slope=Math.abs(dx)>.001?(z.y-a.y)/dx:0;
  const depth=Math.max(.08,...o.points.map(p=>a.y+(p.x-a.x)*slope-p.y)),at=(x,f)=>project(x,a.y+(x-a.x)*slope-depth*f);
  const worldLeft=Math.max(b.minX,b.minX+(left-project(b.minX,0)[0])/s),worldRight=Math.min(b.maxX,worldLeft+(right-left)/s);
  const family=Number(o.id?.match(/opening-skip-(\d)/)?.[1]??0)%4;
  const tones=[['#a8bd70','#78915e','#e0d999'],['#bdc779','#879e62','#f3e5aa'],['#8fbba5','#6b9781','#b6d6a0'],['#a3bd7e','#799765','#d3dc97']][family];
  const light=c.createLinearGradient(...at(a.x,0),...at(a.x,1));
  light.addColorStop(0,tones[0]);light.addColorStop(.4,tones[1]);light.addColorStop(1,'#46684e');c.fillStyle=light;c.fillRect(left,top,Math.max(0,right-left),Math.max(0,thick));
  // One broad sinuous midrib and large alternating side folds give each mat
  // a plant-scale read. The wave is anchored in metres, never the viewport.
  const mid=x=>.46+.055*Math.sin(x*.7+family),spacing=family===2?1.65:family===1?.93:1.2;
  if(s<12)stroke(c,[at(worldLeft,.46),at(worldRight,.46)],'#b5cc8b',clamp(s*.028,1.1,2.8));
  else{const span=4;let count=0;for(let x=Math.floor(worldLeft/span)*span;x<worldRight&&count<32;x+=span,count++){
   c.beginPath();c.moveTo(...at(x,mid(x)));c.bezierCurveTo(...at(x+span/3,mid(x)+span/3*.0385*Math.cos(x*.7+family)),...at(x+span*2/3,mid(x+span)-span/3*.0385*Math.cos((x+span)*.7+family)),...at(x+span,mid(x+span)));c.strokeStyle='#b5cc8b';c.lineWidth=clamp(s*.028,1.1,2.8);c.stroke();
  }}
  if(depth*s>5){let ribs=0;
   for(let x=Math.ceil(worldLeft/spacing)*spacing;x<worldRight&&ribs<7;x+=spacing,ribs++){
    const root=at(x,mid(x)),tip=at(x-spacing*.58,.06),low=at(x-spacing*.42,.94),bend=at(x-spacing*.17,.17);
    c.beginPath();c.moveTo(...at(x-spacing*.8,.04));c.bezierCurveTo(...at(x-spacing*.35,.07),...at(x-spacing*.12,.23),...root);c.bezierCurveTo(...at(x-spacing*.16,.68),...at(x-spacing*.37,.92),...at(x-spacing*.67,.96));c.bezierCurveTo(...at(x-spacing*.46,.7),...at(x-spacing*.5,.27),...at(x-spacing*.8,.04));c.closePath();c.fillStyle=family===2?'#85ad95':family===3?'#96ae77':'#9aaf78';c.fill();
    c.beginPath();c.moveTo(...tip);c.bezierCurveTo(...bend,...at(x-spacing*.05,.42),...root);c.bezierCurveTo(...at(x-spacing*.08,.64),...at(x-spacing*.2,.81),...low);c.strokeStyle='#425f42';c.lineWidth=clamp(s*.021,1,2.7);c.stroke();
    if(family===2||family===3){c.beginPath();c.moveTo(...at(x-spacing*.62,.07));c.bezierCurveTo(...at(x-spacing*.38,.05),...at(x-spacing*.11,.29),...root);c.strokeStyle=tones[0];c.lineWidth=clamp(s*.025,1,3);c.stroke();}
   }
  }
 }else if(o.material==='stone'){
  const step=Math.max(28,Math.min(90,s*.45));let count=0;for(let x=Math.floor(left/step)*step;x<right&&count<24;x+=step,count++){
   const y=top+thick*(.22+.18*Math.sin(x*.3));c.beginPath();c.moveTo(x,y);c.lineTo(x+step*.58,y-thick*.1);c.lineTo(x+step*.83,y+thick*.35);c.lineTo(x+step*.2,y+thick*.18);c.closePath();c.fillStyle=count%2?'#809b9c':'#6d888c';c.fill();stroke(c,[[x,y],[x+step*.58,y-thick*.1]],'#aec7bb',1.2);
  }
 }else if(o.material==='wood'||!GROVE_MATERIALS[o.material]){
  // Long boughs need large flowing forms, not only a uniform shaded band.
  // Bark plates fork around broad knots, all clipped to the collision outline.
  const a=o.points[0],z=o.points[1],dx=z.x-a.x,slope=Math.abs(dx)>.001?(z.y-a.y)/dx:0;
  const depth=Math.max(.08,...o.points.map(p=>a.y+(p.x-a.x)*slope-p.y)),at=(x,f)=>project(x,a.y+(x-a.x)*slope-depth*f);
  const worldLeft=Math.max(b.minX,b.minX+(left-project(b.minX,0)[0])/s),worldRight=Math.min(b.maxX,worldLeft+(right-left)/s);
  const d=depth/(1+slope*slope),p=project(a.x,a.y),q=project(a.x+slope*d,a.y-d),shade=c.createLinearGradient(...p,...q);
  for(const [at,color]of[[0,'#bd9b61'],[.15,'#a0784a'],[.5,'#81583b'],[.83,'#5d4030'],[1,'#3d332b']])shade.addColorStop(at,color);
  c.fillStyle=shade;c.fillRect(left,top,Math.max(0,right-left),Math.max(0,thick));
  if(depth*s>8){const spacing=3,start=Math.floor(worldLeft/spacing)*spacing;let seams=0;
   for(let x=start;x<worldRight&&seams<5;x+=spacing,seams++){
    const seed=Math.sin(Math.floor(x/spacing)*9.17),f=.47+seed*.09,cx=x+spacing*.55;
    // Open fissures wander around an irregular old knot. No closed almond,
    // concentric ring or black centre: the log must read as wood, not an eye.
    c.beginPath();c.moveTo(...at(x,.82));c.bezierCurveTo(...at(x+spacing*.18,.73),...at(cx-spacing*.17,.31),...at(cx,.34));c.bezierCurveTo(...at(cx+spacing*.19,.43),...at(x+spacing*.8,.73),...at(x+spacing,.63));c.strokeStyle='#513a2e';c.lineWidth=clamp(depth*s*.019,1,2.6);c.stroke();
    c.beginPath();c.moveTo(...at(x,.93));c.bezierCurveTo(...at(x+spacing*.2,.86),...at(cx-spacing*.12,.55),...at(cx,.61));c.bezierCurveTo(...at(cx+spacing*.24,.8),...at(x+spacing*.81,.9),...at(x+spacing,.82));c.strokeStyle='#ac895e';c.lineWidth=clamp(s*.012,.8,1.6);c.stroke();
    const rx=.31,ry=.14;
    c.beginPath();c.moveTo(...at(cx-rx,f));c.bezierCurveTo(...at(cx-rx*.8,f-ry),...at(cx+rx*.5,f-ry*.75),...at(cx+rx,f-.01));c.bezierCurveTo(...at(cx+rx*.75,f+ry*.5),...at(cx+rx*.3,f+ry*.9),...at(cx-rx*.3,f+ry*.4));c.bezierCurveTo(...at(cx-rx*.75,f+ry*.15),...at(cx-rx*1.1,f+ry*.5),...at(cx-rx,f));c.fillStyle='#715139';c.fill();
    c.beginPath();c.moveTo(...at(cx-rx*.65,f+.01));c.bezierCurveTo(...at(cx-rx*.35,f-ry*.55),...at(cx+rx*.5,f-ry*.4),...at(cx+rx*.7,f+.01));c.strokeStyle='#b69969';c.lineWidth=clamp(s*.012,.8,1.6);c.stroke();

   }
  }
 }else{
  // Grain bends with the bough's top edge. It is anchored in metres, not to
  // a screen-space plank grid, so camera motion never slides its pattern.
  const a=o.points[0],z=o.points[1],dx=z.x-a.x,dy=z.y-a.y,slope=Math.abs(dx)>.001?dy/dx:0;
  const grainDepth=Math.max(.08,Math.min(.65,b.maxY-b.minY,(b.maxY-b.minY)-Math.abs(dy)));
  for(let row=1;row<=3;row++){
   const yy=a.y-grainDepth*row*.23,worldLeft=Math.max(b.minX,b.minX+(left-project(b.minX,0)[0])/s),worldRight=Math.min(b.maxX,worldLeft+(right-left)/s);
   const p=project(worldLeft,yy+(worldLeft-a.x)*slope),q=project(worldRight,yy+(worldRight-a.x)*slope),bend=Math.min(10,thick*.13);
   c.beginPath();c.moveTo(...p);c.bezierCurveTo(p[0]+(q[0]-p[0])*.32,p[1]+bend,q[0]-(q[0]-p[0])*.25,q[1]-bend,...q);c.strokeStyle=row%2?'#78492e':'#d39a57';c.lineWidth=row===2?2.1:1.1;c.stroke();
  }
  if(thick>13&&s>4){const spacing=2.7,x0=Math.ceil((b.minX+(left-project(b.minX,0)[0])/s)/spacing)*spacing;let knots=0;
   for(let x=x0;x<b.maxX&&knots<5;x+=spacing,knots++){const y=(b.minY+b.maxY)*.5+Math.sin(x)*Math.min(.08,(b.maxY-b.minY)*.08),p=project(x,y),rx=clamp(s*.055,3,12),ry=Math.max(2,rx*.33);c.beginPath();c.ellipse(...p,rx,ry,-.13,0,Math.PI*2);c.strokeStyle='#5a3d2c';c.lineWidth=1.5;c.stroke();c.beginPath();c.ellipse(...p,rx*.42,ry*.55,-.13,0,Math.PI*2);c.fillStyle='#70462f';c.fill();}
  }
 }
 c.restore();c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.strokeStyle=INK;c.lineWidth=clamp(thick*.08,.8,2.8);c.stroke();
 const area=o.points.reduce((sum,p,i)=>{const q=o.points[(i+1)%o.points.length];return sum+p.x*q.y-q.x*p.y;},0);
 for(let i=0;i<o.points.length;i++){
  const a=o.points[i],z=o.points[(i+1)%o.points.length],dx=z.x-a.x,dy=z.y-a.y;if(dx*(area<0?1:-1)<=0||Math.abs(dy)>Math.abs(dx)*1.2)continue;
  const p=project(a.x,a.y),q=project(z.x,z.y);stroke(c,[p,q],o.material==='wood'?(o.id?.startsWith('canopy-exit-')?'#a4ba80':'#b59b6d'):colors[1],clamp(s*.04,1.3,3.5));
 }
}
