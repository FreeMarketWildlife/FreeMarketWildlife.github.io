// Render the existing force target and real body anchor; never move either.
export function drawGripTether(ctx,{anchor,target,pixelRatio=1,capped=false}){
 if(!anchor||!target||![...anchor,...target,pixelRatio].every(Number.isFinite)||pixelRatio<=0)return;
 const r=5*pixelRatio;ctx.save();ctx.strokeStyle=capped?'#f0b35e':'#f7edbd';ctx.fillStyle='#294e43';ctx.lineWidth=1.8*pixelRatio;ctx.setLineDash([4*pixelRatio,3*pixelRatio]);ctx.beginPath();ctx.moveTo(...anchor);ctx.lineTo(...target);ctx.stroke();ctx.setLineDash([]);
 ctx.beginPath();ctx.arc(...anchor,2.5*pixelRatio,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(...target,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(target[0]-r-3*pixelRatio,target[1]);ctx.lineTo(target[0]+r+3*pixelRatio,target[1]);ctx.moveTo(target[0],target[1]-r-3*pixelRatio);ctx.lineTo(target[0],target[1]+r+3*pixelRatio);ctx.stroke();ctx.restore();
}
