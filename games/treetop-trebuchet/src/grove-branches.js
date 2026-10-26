/** Metre geometry shared by the branch brush, extension tool and starter. */
export function branchPolygon(a,b,width=1.2,tipWidth=width*.42){
 const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<.12)throw Error('Draw a branch at least 0.12 m long.');
 width=Math.max(.08,Math.min(80,width));tipWidth=Math.max(.06,Math.min(width,tipWidth));const nx=-dy/length,ny=dx/length;
 return[{x:a.x+nx*width/2,y:a.y+ny*width/2},{x:b.x+nx*tipWidth/2,y:b.y+ny*tipWidth/2},{x:b.x-nx*tipWidth/2,y:b.y-ny*tipWidth/2},{x:a.x-nx*width/2,y:a.y-ny*width/2}];
}
export function slopedPlatform(a,b,depth=Math.max(.25,Math.abs(b.y-a.y)*.3)){
 if(Math.abs(b.x-a.x)<.12)throw Error('Give a slope some horizontal length.');const bottom=Math.min(a.y,b.y)-depth;
 return[{...a},{...b},{x:b.x,y:bottom},{x:a.x,y:bottom}];
}
export function branchTip(object){
 if(!object?.points?.length)throw Error('Select a wooden polygon branch first.');
 const points=object.points,rank=points.map((p,i)=>({i,x:(p.x+points[(i+1)%points.length].x)/2,length:Math.hypot(p.x-points[(i+1)%points.length].x,p.y-points[(i+1)%points.length].y)})).sort((a,b)=>b.x-a.x);
 const short=[...rank].sort((a,b)=>a.length-b.length),edge=points.length===4&&short[0].length<short[1].length*.85?short[0]:rank[0],a=points[edge.i],b=points[(edge.i+1)%points.length];
 return{point:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},width:Math.max(.3,Math.min(40,edge.length))};
}
