import {branchPolygon} from './grove-branches.js?v=70';
/** Editable routes, not scenery masquerading as physics. Leaf mats are many
 * small leaves supported on springy stems; lianas and logs have exact paths. */
export const JUNGLE_LAYERS=Object.freeze([
 {id:'emergent',name:'Emergent boughs',alt:385,low:340,high:480,color:'#93a65e'},
 {id:'canopy',name:'Jungle canopy',alt:285,low:230,high:340,color:'#5e8755'},
 {id:'understory',name:'Vines & understory',alt:140,low:70,high:230,color:'#466e50'},
 {id:'floor',name:'Roots & forest floor',alt:18,low:0,high:70,color:'#827647'}
].map(Object.freeze));
export const PROPORTIONED_JUNGLE_LAYERS=Object.freeze([
 {id:'emergent',name:'Emergent crowns',alt:52,low:45,high:60,color:'#93a65e'},
 {id:'canopy',name:'Amazon canopy',alt:32,low:20,high:45,color:'#5e8755'},
 {id:'understory',name:'Vines & understory',alt:11,low:2,high:20,color:'#466e50'},
 {id:'floor',name:'Roots & forest floor',alt:1,low:0,high:2,color:'#827647'}
].map(Object.freeze));
export const NATURAL_JUNGLE_LAYERS=Object.freeze([
 {id:'emergent',name:'Jungle canopy crowns',alt:28,low:25,high:30,color:'#93a65e'},
 {id:'canopy',name:'Jungle canopy',alt:21,low:15,high:25,color:'#5e8755'},
 {id:'understory',name:'Vines & understory',alt:8,low:2,high:15,color:'#466e50'},
 {id:'floor',name:'Roots & forest floor',alt:1,low:0,high:2,color:'#827647'}
].map(Object.freeze));
export const jungleLayersFor=map=>map?.version===4?(map.starterRevision>=8?NATURAL_JUNGLE_LAYERS:PROPORTIONED_JUNGLE_LAYERS):JUNGLE_LAYERS;
export const jungleLayerAt=(altitude,map)=>[3,4].includes(map?.version)?jungleLayersFor(map).find(l=>altitude>=l.low&&altitude<l.high):undefined;
export function jungleStarterObjects(makeEnemy){
 const objects=[],origin=600;
 const poly=(id,name,points,material='wood',bounce=.45)=>objects.push({id,name,type:'polygon',points,collision:true,layer:'world',material,bounce});
 const bands=JUNGLE_LAYERS;
 for(let row=0;row<bands.length;row++){
  const band=bands[row];
  for(let col=0;col<18;col++){
   const x=-310+col*52+(row%2)*24,y=Math.max(3,band.alt+Math.sin(col*2.1+row)*22)-origin,width=9+col%4*3;
   // Each shelf is short, with open shafts for a falling volunteer.
   const a={x,y},b={x:x+width,y:y+Math.sin(col)*2};
   poly(`jungle-${band.id}-bough-${col}`,`${band.id} · spring bough ${col+1}`,branchPolygon(a,b,row===3?1.5:.7),row%2?'leaf':'wood',row===3?.48:.72);
   objects.push(makeEnemy(`jungle-${band.id}-friend-${col}`,row===3?(col%3?'fungus':'ancient-fungus'):['pod','hopper','skid','beetle'][col%4],x+width*.55,y+.65));
   if(row<3&&col%2===0){const vx=x+width*.8,vy=y+34;objects.push({id:`jungle-${band.id}-vine-${col}`,name:`${band.id} · hanging liana`,type:'chain',points:[{x:vx-2,y:vy},{x:vx-2.8,y:vy-9},{x:vx-1,y:vy-20},{x:vx,y:y+4}],collision:true,layer:'world',material:'leaf',bounce:.62});}
   if(row===1&&col%4===1)poly(`jungle-sap-${col}`,'Sticky amber on the canopy',Array.from({length:10},(_,i)=>({x:x+width*.3+Math.cos(i*Math.PI/5)*1.2,y:y+.28+Math.sin(i*Math.PI/5)*.35})),'sap',0);
   if(row>0&&col%3===0){const rx=width*.7,ry=3;poly(`jungle-${band.id}-leaves-${col}`,`${band.id} · small leaf thicket`,Array.from({length:10},(_,i)=>({x:x+width*.5+Math.cos(i*Math.PI/5)*rx,y:y+2+Math.sin(i*Math.PI/5)*ry})),'foliage',0);objects.at(-1).density=5;}
  }
 }
 // A low route of rotting logs, spring caps and root ramps keeps the last
 // metres playable instead of becoming an empty flat green strip.
 for(let i=0;i<22;i++){
  const x=-230+i*35,y=-origin+1.2+(i%3)*.5;
  poly(`jungle-floor-log-${i}`,`Mossy fallen log ${i+1}`,branchPolygon({x,y},{x:x+9+i%4,y:y+(i%2?1.6:-.5)},1.6), 'wood',.38);
  if(i%2===0)objects.push(makeEnemy(`jungle-floor-spring-${i}`,'ancient-fungus',x+13,-origin+1.25));
 }
 for(let i=0;i<46;i++){const x=-60+i*8;objects.push(makeEnemy(`jungle-floor-mushroom-${i}`,i%5===0?'ancient-fungus':'fungus',x,-origin+(i%5===0?1.2:.2)));}
 return objects;
}
