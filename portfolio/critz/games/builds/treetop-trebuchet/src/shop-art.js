import {drawCritter} from './build-art.js?v=49';
/** Tiny original paper-card illustrations, using the same ink and timber palette. */
export function drawShopArt(canvas,p,kind='part') {
  const ctx=canvas.getContext('2d');
  canvas.width=300;canvas.height=170;ctx.scale(2,2);ctx.translate(75,43);
  ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=2.5;ctx.strokeStyle='#45593c';
  function line(points,color='#b98a4a',width=7){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle='#46543a';ctx.lineWidth=width+3;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function ball(x,y,r,fill='#b38a4e'){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#46543a';ctx.lineWidth=2;ctx.stroke();}
  function box(x,y,w,h,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,5);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#46543a';ctx.lineWidth=2;ctx.stroke();}
  function wheel(x,y,r=19){ball(x,y,r,'#cfa364');ball(x,y,r*.73,'#ead39c');for(let i=0;i<6;i++){const a=i*Math.PI/3;line([[x,y],[x+Math.cos(a)*r*.72,y+Math.sin(a)*r*.72]],'#a17d42',2);}ball(x,y,3,'#739279');}
  if(kind==='animal'){drawCritter(ctx,p,0,1,90,0,false);return;}
  if(kind==='pack'){box(-25,-32,50,65,'#bc8d68');line([[-21,-27],[21,-27]],'#e5c595',3);line([[-21,28],[21,28]],'#e5c595',3);ctx.rotate(-.1);box(-16,-21,32,40,'#f2dfac');line([[-10,10],[10,-10]],'#8ba06a',4);ball(7,-7,6,'#d3a74e');return;}
  if(kind==='voucher'){
    box(-40,-24,80,48,'#eed39a');ctx.setLineDash([3,4]);line([[-24,-18],[-24,18]],'#b69b65',1);ctx.setLineDash([]);
    if(p.id==='luckyPenny'){ball(10,0,15,'#e8b850');ball(10,0,10,'#f3d880');ctx.fillStyle='#8c753c';ctx.font='bold 18px serif';ctx.fillText('✦',2,6);}
    else if(p.id==='extraShelf'){line([[-13,13],[29,13]],'#8f7040',6);box(-7,-10,12,19,'#b7c495');box(11,-15,13,24,'#b48a58');}
    else {drawCritter(ctx,{id:'mouse',color:'#a99b8f'},6,0,45,0,false);}
    return;
  }
  const slot=p.slot;
  if(slot==='chassis'||slot==='frame'){line([[-34,24],[0,-28],[34,24]],'#b88b50',7);line([[-36,24],[36,24]],'#ac8049',7);line([[-21,5],[21,5]],'#cb9c59',5);ball(0,-26,5,'#718c72');if(p.id==='wheels'){wheel(-27,24,12);wheel(27,24,12);}if(p.id==='floating')line([[-40,-26],[40,-26]],'#879a82',5);if(p.id==='walking'){line([[-34,24],[-47,31]],'#b18c50',6);}}
  else if(slot==='arm'){line([[-47,24],[45,-24]],p.color||'#bc8b4b',10);ball(-18,9,7,'#7c9277');line([[-42,20],[38,-22]],'#e6bf78',1);}
  else if(slot==='ballast'||slot==='material'){if(p.id==='steel'){for(let i=0;i<4;i++)box(-27,-21+i*11,54,10,'#8fa394');}else{box(-32,-6,64,31,'#b18953');for(let i=0;i<6;i++)ball(-22+i*9,-8-(i%2)*7,11,p.id==='sand'?'#c0aa70':'#9ca88b');line([[-32,10],[32,10]],'#e0bd7c',3);}}
  else if(slot==='trough'){line([[-50,10],[42,10]],'#d6b270',9);line([[-50,20],[42,20]],p.id==='waxedRunway'?'#aec5a0':'#aa7c43',5);for(let x=-43;x<43;x+=17)line([[x,7],[x,24]],'#805f39',2);line([[-20,-22],[-8,4],[7,5],[20,-22]],'#c5b482',2);ball(0,1,7,'#9dac82');}
  else if(slot==='sling'){line([[-30,-30],[-23,15],[0,26],[23,15],[30,-30]],'#b8a477',2);ctx.beginPath();ctx.moveTo(-28,6);ctx.quadraticCurveTo(0,53,28,6);ctx.quadraticCurveTo(0,22,-28,6);ctx.fillStyle='#83a18b';ctx.fill();ctx.stroke();ball(0,9,9,'#bac6a3');}
  else if(slot==='rope'){for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(-8+i*4,-2,28,18,.3,0,Math.PI*2);ctx.lineWidth=4;ctx.strokeStyle=i%2?'#bda573':'#8d815b';ctx.stroke();}line([[19,13],[40,22],[46,11]],'#bda573',3);}
  else if(slot==='bearing'){wheel(0,0,27);for(let i=0;i<7;i++)ball(Math.cos(i)*21,Math.sin(i)*21,4,'#799a8c');}
  else if(slot==='release'){line([[-39,26],[10,-15]],'#ad8952',8);line([[10,-15],[30,-27],[37,-19]],'#718e80',5);ctx.beginPath();ctx.ellipse(20,-18,8,12,.5,0,Math.PI*2);ctx.strokeStyle='#c9a452';ctx.lineWidth=3;ctx.stroke();}
  else if(slot==='winch'){const r=18+p.radiusRatio*65;line([[-28,30],[-6,0],[18,30]],'#a77543',5);wheel(-6,0,r);if(p.gearing>1)wheel(27,14,8+p.gearing*2);line([[-6,0],[r*.55-6,-r*.16]],'#8ea498',4);ball(r*.55-6,-r*.16,4,'#efbd61');line([[-6,-r-2],[36,-r-2]],'#d6b479',2);}
  else {line([[-18,-30],[-18,-7],[13,21]],'#718e80',6);ball(-18,-7,7,'#e1ba69');box(-3,11,39,22,'#aa8652');}
}
