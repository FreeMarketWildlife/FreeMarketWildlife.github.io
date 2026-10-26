// Presentation follows authored altitude bands; it never changes terrain or motion.
export const MAP_TOP=600;
export const TREE_CENTER=300;
export const BIOMES=Object.freeze([
 Object.freeze({id:'space',label:'Kronos sky · Space',min:480}),
 Object.freeze({id:'openSky',label:'Storm sky',min:360}),
 Object.freeze({id:'grandfatherTree',label:'Grandfather Tree',min:240}),
 Object.freeze({id:'jungleCanopy',label:'Jungle canopy',min:120}),
 Object.freeze({id:'forestFloor',label:'Grimroot forest floor',min:-Infinity})
]);
export const biomeAt=y=>BIOMES.find(b=>y>b.min)||BIOMES.at(-1);
// Compressed gameplay altitude, not astronomical metres. Smoothly enter 14% gravity.
export function gravityScaleAt(y){const t=Math.max(0,Math.min(1,(y-440)/80));return 1-.86*t*t*(3-2*t);}
export function atmosphereAt(y,time=0,x=0){
 const sky=y>360&&y<480,storm=sky&&Math.sin(x*.045+time*.7)>.35;
 return {gravity:gravityScaleAt(y),air:1-Math.max(0,Math.min(1,(y-440)/60)),
  wind:sky?2.8*Math.sin(time*.7+x*.045):0,lift:sky?(storm?7:13):0,storm,dead:y>=MAP_TOP};
}
export function createJourneyTracker(){
 let current=null;const visited=new Set();
 return {update(phase,y){if(!Number.isFinite(y))throw new Error('Finite journey height required');
  if(phase!=='flight')return {biome:biomeAt(y),changed:false,firstVisit:false};
  const next=biomeAt(y);let candidate=next;
  if(current&&next!==current){const boundary=BIOMES[Math.min(BIOMES.indexOf(current),BIOMES.indexOf(next))].min;if(Math.abs(y-boundary)<2)candidate=current;}
  const changed=current!==null&&candidate!==current,firstVisit=changed&&!visited.has(candidate.id);current=candidate;visited.add(current.id);
  return {biome:current,changed,firstVisit};
 }};
}
