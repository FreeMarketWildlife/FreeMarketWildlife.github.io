/** Match the physical ballast radius and body rotation; the basket/straps are
 * surface detail. Never enlarge a weight to imply extra simulated mass. */
export function drawCounterweight(ctx,{point,radius,angle,material}){
 const r=Math.max(1,radius);ctx.save();ctx.translate(...point);ctx.rotate(-angle);ctx.lineJoin='round';ctx.lineCap='round';
 if(material==='stone'){
  ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=r*(i%2?.93:1),p=[Math.cos(a)*rr,Math.sin(a)*rr];i?ctx.lineTo(...p):ctx.moveTo(...p);}ctx.closePath();ctx.fillStyle='#889486';ctx.strokeStyle='#302e25';ctx.lineWidth=2.5;ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-r*.72,-r*.24);ctx.lineTo(-r*.25,-r*.8);ctx.lineTo(r*.38,-r*.68);ctx.lineTo(r*.12,-r*.23);ctx.closePath();ctx.fillStyle='#c1cab0';ctx.fill();
  // Two broad bindings grip the stone; metal rivets read at workshop scale.
  for(const x of [-.48,.48]){ctx.beginPath();ctx.moveTo(r*x,-r*.82);ctx.lineTo(r*x,r*.85);ctx.strokeStyle='#302e25';ctx.lineWidth=Math.max(2,r*.23);ctx.stroke();ctx.strokeStyle='#bb8247';ctx.lineWidth=Math.max(1,r*.13);ctx.stroke();}
 }else{
  ctx.beginPath();ctx.roundRect(-r,-r,r*2,r*2,r*.15);ctx.fillStyle=material==='sand'?'#bc9152':'#748d8c';ctx.strokeStyle='#302e25';ctx.lineWidth=2.6;ctx.fill();ctx.stroke();
  for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-r*.85,r*i*.48);ctx.lineTo(r*.85,r*i*.48);ctx.strokeStyle=material==='sand'?'#63452e':'#c4d0bc';ctx.lineWidth=Math.max(1,r*.1);ctx.stroke();}
 }
 ctx.beginPath();ctx.moveTo(-r*.86,r*.4);ctx.quadraticCurveTo(0,r*1.18,r*.86,r*.4);ctx.strokeStyle='#302e25';ctx.lineWidth=Math.max(2,r*.22);ctx.stroke();ctx.strokeStyle='#b28248';ctx.lineWidth=Math.max(1,r*.12);ctx.stroke();
 ctx.restore();
}
