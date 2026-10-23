/** Uniform-density provisional cap/stem geometry, centered on true COM.
 * Both convex pieces stay within the existing encounter radius (including skin).
 */
function properties(vertices){let twice=0,x=0,y=0;for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length],q=a.x*b.y-b.x*a.y;twice+=q;x+=(a.x+b.x)*q;y+=(a.y+b.y)*q;}return {area:Math.abs(twice)/2,center:{x:x/(3*twice),y:y/(3*twice)}};}
export function mushroomGeometry(radius){if(!(Number.isFinite(radius)&&radius>.05))throw Error('Invalid mushroom radius');
 const cap=Array.from({length:7},(_,i)=>({x:Math.cos(i*Math.PI/6),y:Math.sin(i*Math.PI/6)})),stem=[{x:-.12,y:0},{x:.12,y:0},{x:.12,y:-.7},{x:-.12,y:-.7}],a=properties(cap),b=properties(stem),area=a.area+b.area,center={x:(a.center.x*a.area+b.center.x*b.area)/area,y:(a.center.y*a.area+b.center.y*b.area)/area};
 const extent=Math.max(...[...cap,...stem].map(p=>Math.hypot(p.x-center.x,p.y-center.y))),scale=(radius-.015)/extent,convert=v=>v.map(p=>({x:(p.x-center.x)*scale,y:(p.y-center.y)*scale}));
 return {cap:convert(cap),stem:convert(stem),area:area*scale**2,capCenter:{x:(a.center.x-center.x)*scale,y:(a.center.y-center.y)*scale}};
}
