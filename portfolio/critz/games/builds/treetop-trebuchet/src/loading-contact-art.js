/** Read actual touching points only. Dots describe contact, not containment or readiness. */
export function loadingContactPoints(scene){
 if(!['loading','launching'].includes(scene?.phase)||!Array.isArray(scene.parts))return [];const points=[],seen=new Set();
 for(const part of scene.parts)for(let edge=part.getContactList();edge;edge=edge.next){const c=edge.contact;if(seen.has(c)||!['pouch','pouchflap'].includes(edge.other.getUserData()?.role)||!c.isTouching())continue;seen.add(c);const m=c.getWorldManifold(),count=c.getManifold().pointCount;for(let i=0;i<count&&points.length<16;i++){const p=m?.points[i];if(p&&[p.x,p.y].every(Number.isFinite))points.push({x:p.x,y:p.y});}if(points.length===16)return points;}
 return points;
}
export function drawLoadingContacts(ctx,scene,project,pixelScale=1){const points=loadingContactPoints(scene);if(!points.length)return 0;ctx.save();ctx.setLineDash([]);ctx.fillStyle='#f5c66a';ctx.strokeStyle='#354e3c';ctx.lineWidth=1;for(const point of points){ctx.beginPath();ctx.arc(...project(point),2.5*pixelScale,0,Math.PI*2);ctx.fill();ctx.stroke();}ctx.restore();return points.length;}
