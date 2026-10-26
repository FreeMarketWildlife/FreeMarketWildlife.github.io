import {counterOutline,counterCenter} from './workshop.js?v=70-trebuchet';
/** Read-only mechanism annotations. All marks refer to actual bodies/anchors. */
export function drawMechanismDetails(ctx,scene,project,{labels=true}={}){
 if(!scene.p||!scene.arm?.getWorldPoint||!Array.isArray(scene.ropes))return;
 if(scene.p.counterKind){
  const vertices=counterOutline(scene.p).map(p=>project(scene.counterWeight?scene.counterWeight.getWorldPoint({x:p.x+scene.p.shortArm,y:p.y-scene.p.counterHanger}):scene.arm.getWorldPoint(p))),center=project(counterCenter(scene));
  ctx.save();ctx.strokeStyle='#303d36';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(...vertices[0]);for(const p of vertices.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.stroke();
  ctx.strokeStyle=scene.p.counterKind==='iron'?'#b5c5c9':scene.p.counterKind==='basket'?'#513721':'#b4b8a1';ctx.beginPath();ctx.moveTo(...vertices[0]);ctx.lineTo(...center);ctx.lineTo(...vertices[2]);ctx.stroke();
  if(scene.p.counterKind==='basket'){for(let i=1;i<4;i++){const a=vertices[0],b=vertices[1],c=vertices[3],d=vertices[2],t=i/4;ctx.beginPath();ctx.moveTo(a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t);ctx.lineTo(b[0]+(d[0]-b[0])*t,b[1]+(d[1]-b[1])*t);ctx.stroke();}}
  ctx.restore();
 }
 const weight=project(counterCenter(scene));ctx.save();ctx.strokeStyle='#f0d69b';ctx.fillStyle='#d0b35e';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(...weight,scene.p.counterKind?2:4.5,0,Math.PI*2);ctx.fill();ctx.stroke();
 if(labels){const x=Math.max(12,Math.min(370,weight[0]+16)),y=Math.max(46,weight[1]-15);ctx.beginPath();ctx.moveTo(...weight);ctx.lineTo(x,y+3);ctx.stroke();ctx.font='12px system-ui';ctx.fillStyle='#243b30';ctx.fillText(`${scene.p.counterMass} kg ${scene.p.counterKind??'fixed weight'}${scene.counterWeight?' · hinged':''}`,x,y);}
 if(scene.p.counterKind&&['uncocked','winding','loading','launching'].includes(scene.phase)){
  const pin=project(scene.arm.getWorldPoint({x:0,y:0})),end=project(scene.frame.getWorldPoint({x:1.2,y:3})),open=scene.phase==='launching';ctx.save();ctx.strokeStyle='#eedbb0';ctx.lineWidth=1.8;ctx.setLineDash(open?[3,4]:[]);ctx.beginPath();ctx.moveTo(pin[0]+(open?10:0),pin[1]);ctx.lineTo(...end);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#e0bd68';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(pin[0]-6+(open?10:0),pin[1]);ctx.lineTo(pin[0]+6+(open?10:0),pin[1]);ctx.stroke();if(labels){ctx.fillStyle='#243b30';ctx.font='11px system-ui';ctx.fillText(open?'Trigger released':'Trigger cord',end[0]+5,end[1]);}ctx.restore();
 }
 if(labels&&scene.link?.getUserData()?.id==='channel-bead'){const bead=project(scene.link.getWorldCenter()),x=Math.max(12,Math.min(345,bead[0]+16)),y=Math.max(80,bead[1]+20);ctx.strokeStyle='#ad8b38';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(...bead);ctx.lineTo(x,y-4);ctx.stroke();ctx.fillStyle='#243b30';ctx.font='12px system-ui';ctx.fillText('Release bead',x,y);}
 const strands=scene.ropes.map((rope,i)=>{const a=rope.getAnchorA(),b=rope.getAnchorB();return {p:project(a),q:project(b),name:i?'free':'fixed',slack:Math.max(0,rope.getMaxLength()-Math.hypot(a.x-b.x,a.y-b.y))};});
 for(const [i,{p,q,slack}]of strands.entries()){ctx.strokeStyle=i?'#294f72':'#275e50';ctx.lineWidth=3;ctx.setLineDash(slack>.02?[5,3]:[]);ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.stroke();ctx.setLineDash([]);for(let j=1;j<=(scene.p.slingPieces??0);j++){const t=j/((scene.p.slingPieces??0)+1),x=p[0]+(q[0]-p[0])*t,y=p[1]+(q[1]-p[1])*t;ctx.beginPath();ctx.strokeStyle='#dabc7b';ctx.lineWidth=5;ctx.moveTo(x-2,y);ctx.lineTo(x+2,y);ctx.stroke();}ctx.beginPath();ctx.arc(...p,2.5,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(...q,2.5,0,Math.PI*2);ctx.fillStyle=i?'#8cbed7':'#b3d7b4';ctx.fill();}
 if(labels&&strands.length){const {p,q}=strands[0];ctx.fillStyle='#243b30';ctx.font='12px system-ui';const descriptions=strands.map(s=>`${s.name} ${s.slack>.02?`slack ${s.slack.toFixed(2)} m`:'taut'}`);ctx.fillText(`Sling: ${descriptions.join(' / ')}`,Math.max(12,Math.min(180,(p[0]+q[0])/2)),Math.max(65,(p[1]+q[1])/2));}
 ctx.restore();
}
