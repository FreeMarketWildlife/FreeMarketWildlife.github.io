// Original bounded trim stays below the same contact segment used by physics.
export function drawSurfaceTrim(ctx,{x1,x2,y,y2=y,width,height,ground=false}){
 if(![x1,x2,y,y2,width,height].every(Number.isFinite)||width<=0||height<=0||x1===x2)return;
 const left=Math.max(0,Math.min(x1,x2)),right=Math.min(width,Math.max(x1,x2));if(right<=left)return;
 const at=x=>y+(y2-y)*(x-x1)/(x2-x1),yl=at(left),yr=at(right),sloped=y!==y2;
 if(Math.min(yl,yr)>height||Math.max(yl,yr)<-14)return;
 ctx.save();ctx.beginPath();
 if(sloped){ctx.moveTo(left,yl+2);ctx.lineTo(right,yr+2);ctx.lineTo(right,height+20);ctx.lineTo(left,height+20);ctx.closePath();}
 else ctx.rect(left,y+2,right-left,Math.max(0,height-y-2));
 ctx.clip();ctx.fillStyle=ground?'#987957':'#806342';
 if(sloped){ctx.beginPath();ctx.moveTo(left,yl+2);ctx.lineTo(right,yr+2);ctx.lineTo(right,yr+10);ctx.lineTo(left,yl+10);ctx.closePath();ctx.fill();}
 else ctx.fillRect(left,y+2,right-left,ground?Math.max(0,height-y-2):8);
 const step=Math.max(32,(right-left)/24);for(let x=left+12;x<right;x+=step){
  ctx.fillStyle=ground?'#b69b70':'#61804d';ctx.beginPath();ctx.ellipse(x,at(x)+(ground?9:12),ground?4:7,ground?1.5:3,ground?0:.35,0,Math.PI*2);ctx.fill();
 }ctx.restore();
}
