// Simple polygons may be concave. Ear clipping produces convex physics fixtures
// without replacing the authored silhouette by its convex hull.
const EPS=1e-9;
export const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
export function polygonArea(points){let a=0;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];a+=p.x*q.y-q.x*p.y;}return a/2;}
function between(a,b,p){return Math.abs(cross(a,b,p))<EPS&&p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS;}
function intersects(a,b,c,d){const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b);return abC*abD<0&&cdA*cdB<0||between(a,b,c)||between(a,b,d)||between(c,d,a)||between(c,d,b);}
export function isSimplePolygon(points){
 if(points.length<3||Math.abs(polygonArea(points))<1e-5)return false;
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if(Math.hypot(a.x-b.x,a.y-b.y)<.002)return false;
  for(let j=i+1;j<points.length;j++){if(j===i+1||i===0&&j===points.length-1)continue;if(intersects(a,b,points[j],points[(j+1)%points.length]))return false;}}
 return true;
}
function inTriangle(p,a,b,c){return cross(a,b,p)>=-EPS&&cross(b,c,p)>=-EPS&&cross(c,a,p)>=-EPS;}
export function triangulatePolygon(input){
 if(!isSimplePolygon(input))throw Error('Draw a simple polygon without crossed edges or duplicate points.');
 let p=input.map(v=>({...v}));if(polygonArea(p)<0)p.reverse();
 // Redundant points on straight edges are harmless in freehand silhouettes.
 for(let i=p.length-1;i>=0&&p.length>3;i--)if(Math.abs(cross(p[(i+p.length-1)%p.length],p[i],p[(i+1)%p.length]))<EPS)p.splice(i,1);
 const triangles=[];let attempts=0;
 while(p.length>3&&attempts++<input.length*input.length){let found=false;for(let i=0;i<p.length;i++){
  const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];if(cross(a,b,c)<=EPS)continue;
  if(p.some((q,j)=>j!==i&&j!==(i+p.length-1)%p.length&&j!==(i+1)%p.length&&inTriangle(q,a,b,c)))continue;
  triangles.push([a,b,c]);p.splice(i,1);found=true;break;
 }if(!found)throw Error('This polygon has overlapping or nearly coincident edges. Move the points apart.');}
 if(p.length===3)triangles.push(p);return triangles;
}
export function pointInPolygon(point,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if(between(a,b,point))return true;if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export function objectBounds(o){if(o.points){const xs=o.points.map(p=>p.x),ys=o.points.map(p=>p.y);return{minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};}return{minX:o.x-o.radius,maxX:o.x+o.radius,minY:o.y-o.radius,maxY:o.y+o.radius};}
