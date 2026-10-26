/** User-generated item idea. Metres, fixed item dimensions (not a scale boost).
 * The cable winds on a passive axle drum: blade travel = radius * arm travel. */
export const GUILLOTINE=Object.freeze({width:.22,height:.58,x:.36,base:.035,restY:.18,drumRadius:.13,lowerY:.12,upperY:.50,bladeWidth:.17,bladeHeight:.10,supportGrams:450});
export const isGuillotine=c=>c.ballast==='guillotine';
export function bladeHeight(angle,restAngle){return GUILLOTINE.restY+GUILLOTINE.drumRadius*(angle-restAngle);}
export function guillotineGeometry(sim){
 const g=GUILLOTINE,point=(x,y)=>{const p=sim.frame.getWorldPoint({x:x/sim.L,y:y/sim.L});return{x:p.x*sim.L,y:p.y*sim.L};};
 return{...g,point,blade:sim.counterPoint(),top:point(g.x,g.base+g.height),pulley:point(g.x,g.base+g.height-.025),drum:sim.pivot(),bottom:point(g.x,g.lowerY),cut:sim.guillotineCut??null};
}
/** Read-only illustration: guide rails and cable follow the actual frame/body. */
export function drawGuillotine(ctx,sim,project,scale){
 const g=guillotineGeometry(sim),p=(x,y)=>project(g.point(x,y)),b=project(g.blade),ink='#302e25';
 const stroke=(ps,color,width)=>{ctx.beginPath();ps.forEach((q,i)=>i?ctx.lineTo(...q):ctx.moveTo(...q));ctx.strokeStyle=ink;ctx.lineWidth=width+2;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 for(const side of [-1,1]){const x=g.x+side*g.width/2;stroke([p(x,g.base),p(x,g.base+g.height)],'#af7843',Math.max(2,.018*scale));stroke([p(x-side*.014,g.lowerY),p(x-side*.014,g.base+g.height-.03)],'#a8b6ae',Math.max(1,.005*scale));}
 stroke([p(g.x-g.width*.65,g.base),p(g.x+g.width*.65,g.base)],'#98653a',Math.max(3,.025*scale));
 stroke([p(g.x-g.width/2,g.base+g.height),p(g.x+g.width/2,g.base+g.height)],'#bc8b4e',Math.max(3,.024*scale));
 stroke([p(g.x-g.width/2,g.lowerY-.065),p(g.x+g.width/2,g.lowerY-.065)],'#92623c',Math.max(3,.025*scale));
 const pulley=project(g.pulley),drum=project(g.drum),r=g.drumRadius*scale;
 ctx.beginPath();ctx.arc(...drum,r,0,Math.PI*2);ctx.fillStyle='#775337';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
 for(let i=0;i<4;i++){const angle=-sim.arm.getAngle()+i*Math.PI/2;stroke([drum,[drum[0]+Math.cos(angle)*r*.84,drum[1]+Math.sin(angle)*r*.84]],'#ba8a51',Math.max(1,.006*scale));}
 // The hauling rope is tied directly to the blade; the other end winds on
 // the axle drum. GearJoint enforces this passive no-slip cable relation.
 stroke([[b[0],b[1]-.045*scale],pulley,[drum[0],drum[1]-r]],'#d7bd87',Math.max(1.4,.004*scale));
 ctx.beginPath();ctx.arc(...pulley,Math.max(3,.017*scale),0,Math.PI*2);ctx.fillStyle='#a6b4aa';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
 // Rectangular/diagonal blade exactly matches its compound collision polygon.
 const vertices=[[-.085,.05],[.085,.05],[.085,-.015],[-.085,-.05]].map(([x,y])=>{const q=sim.counter.getWorldPoint({x:x/sim.L,y:y/sim.L});return project({x:q.x*sim.L,y:q.y*sim.L});});
 ctx.beginPath();vertices.forEach((q,i)=>i?ctx.lineTo(...q):ctx.moveTo(...q));ctx.closePath();ctx.fillStyle='#98adb3';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();stroke([vertices[2],vertices[3]],'#e8f3e8',Math.max(1,.004*scale));
 ctx.beginPath();ctx.arc(b[0],b[1]-.05*scale,Math.max(2,.006*scale),0,Math.PI*2);ctx.strokeStyle='#e8cd8b';ctx.lineWidth=2;ctx.stroke();
 // A small non-graphic cartoon serpent gag. Head pops away at the measured
 // blade stop; it does not collide with or inject energy into the mechanism.
 const cut=g.cut,age=cut?Math.min(1,Math.max(0,sim.time-cut.time)):0,snakeY=g.lowerY-.07;
 const body=[p(g.x-.09,snakeY),p(g.x-.045,snakeY+.014),p(g.x,snakeY),p(g.x+.04,snakeY+.008)];stroke(body,'#81a452',Math.max(3,.013*scale));
 const head=p(g.x+.065+age*.10,snakeY+Math.sin(age*Math.PI)*.045);ctx.beginPath();ctx.ellipse(head[0],head[1],Math.max(4,.023*scale),Math.max(3,.014*scale),0,0,Math.PI*2);ctx.fillStyle='#98b85f';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=1.6;ctx.stroke();ctx.beginPath();ctx.arc(head[0]+.008*scale,head[1]-.004*scale,Math.max(1,.002*scale),0,Math.PI*2);ctx.fillStyle=ink;ctx.fill();
 ctx.restore();
}
