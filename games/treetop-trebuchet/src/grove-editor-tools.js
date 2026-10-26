import {isSimplePolygon,polygonArea} from './grove-geometry.js?v=70';
import {validateGroveMap,objectBounds,enemyRecipe} from './grove-map.js?v=70';
const clone=v=>structuredClone(v);
export function createEditorHistory(initial,limit=80){
 let states=[clone(initial)],index=0;
 return {push(doc){states=states.slice(0,index+1);states.push(clone(doc));if(states.length>limit)states.shift();index=states.length-1;},undo(){if(index)index--;return clone(states[index]);},redo(){if(index<states.length-1)index++;return clone(states[index]);},get canUndo(){return index>0;},get canRedo(){return index<states.length-1;}};
}
export function translateObject(o,dx,dy){return o.points?{...o,points:o.points.map(p=>({x:p.x+dx,y:p.y+dy}))}:{...o,x:o.x+dx,y:o.y+dy};}
export function resizeObject(o,width,height){
 if(o.type==='enemy')return {...o,radius:enemyRecipe(o.kind).radius};
 if(!o.points)return {...o,radius:Math.max(.05,width/2)};
 const b=objectBounds(o),sx=width/(b.maxX-b.minX||1),sy=height/(b.maxY-b.minY||1);
 return {...o,points:o.points.map(p=>({x:b.minX+(p.x-b.minX)*sx,y:b.minY+(p.y-b.minY)*sy}))};
}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function pointInside(p,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export function simplifyStroke(points,tolerance){
 if(points.length<3)return points.map(p=>({...p}));
 let maximum=0,index=0;for(let i=1;i<points.length-1;i++){const d=segmentDistance(points[i],points[0],points.at(-1));if(d>maximum){maximum=d;index=i;}}
 return maximum>tolerance?[...simplifyStroke(points.slice(0,index+1),tolerance).slice(0,-1),...simplifyStroke(points.slice(index),tolerance)]:[{...points[0]},{...points.at(-1)}];
}
export function insertVertex(o,index){if(!o.points)return o;const end=o.type==='polygon'?(index+1)%o.points.length:Math.min(index+1,o.points.length-1),a=o.points[index],b=o.points[end];if(index===end)throw Error('Select a segment before inserting a point.');const points=o.points.map(p=>({...p}));points.splice(index+1,0,{x:(a.x+b.x)/2,y:(a.y+b.y)/2});return {...o,points};}
export function removeVertex(o,index){const minimum=o.type==='polygon'?3:2;if(!o.points||o.points.length<=minimum)throw Error(`This shape needs at least ${minimum} points.`);return {...o,points:o.points.filter((_,i)=>i!==index).map(p=>({...p}))};}
export {encodeMapLink,decodeMapLink} from './map-link-codec.js?v=70';

/** Close a sampled stroke. Crossings are rejected atomically, never silently
 * replaced by a hull that fills areas the author did not draw. */
export function closeFreehandStroke(input,tolerance=.02){
 const distinct=input.filter((p,i)=>!i||Math.hypot(p.x-input[i-1].x,p.y-input[i-1].y)>=.002);
 if(distinct.length>2&&Math.hypot(distinct[0].x-distinct.at(-1).x,distinct[0].y-distinct.at(-1).y)<Math.max(.002,tolerance))distinct.pop();
 let points=simplifyStroke(distinct,tolerance);
 for(let t=tolerance;points.length>128;t*=1.5)points=simplifyStroke(distinct,t);
 if(points.length<3)throw Error('Draw a wider shape with at least three corners.');
 if(Math.abs(polygonArea(points))<Math.max(.0001,tolerance*tolerance*4))throw Error('Stroke has no clear interior. Draw a wider outline without crossings.');
 if(!isSimplePolygon(points))throw Error('Stroke crosses itself. Draw one outline without crossings; your map is unchanged.');
 return points;
}
