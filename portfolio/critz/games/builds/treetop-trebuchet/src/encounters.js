import {biomeAt} from './journey.js?v=50-trebuchet';
// Original passive encounter recipes. Values are gameplay tuning, not biology.
// Descriptors are observations of a seeded world schedule; no terrain is changed.
export const encounterPools = Object.freeze({
  space: [
    {kind:'wandering yokai',shape:'yokai',color:'#b7a2ef',radius:.8,mass:.7,friction:.03,restitution:.85,motion:'wave',interaction:'yokai-pull'},
    {kind:'Kronos ring fragment',shape:'pod',color:'#d7b28d',radius:.7,mass:3,friction:.06,restitution:.6,motion:'roll',interaction:'spin'}],
  grandfatherTree: [
    {interaction:'spin',kind:'archive beetle',shape:'oval',color:'#b77a42',radius:.5,mass:1.2,friction:.22,restitution:.65,motion:'bob'},
    {interaction:'updraft',kind:'Fey-blood leaf hopper',shape:'leaf',color:'#80ae56',radius:.4,mass:.65,friction:.3,restitution:.72,motion:'hop'}],
  openSky: [
    {interaction:'updraft',kind:'restoration raincloud',shape:'wings',color:'#dfc6ef',radius:.65,mass:.45,friction:.08,restitution:.7,motion:'wave'},
    {interaction:'gust',kind:'migrating letter bird',shape:'oval',color:'#7faed0',radius:.55,mass:.8,friction:.12,restitution:.6,motion:'wave'}],
  jungleCanopy: [
    {interaction:'updraft',kind:'Grimroot spring pod',shape:'pod',color:'#d69e5f',radius:.65,mass:1.5,friction:.18,restitution:.8,motion:'bob'},
    {interaction:'snare',kind:'Grimroot vine bug',shape:'oval',color:'#97b95d',radius:.45,mass:.7,friction:.28,restitution:.65,motion:'hop'},
    {interaction:'gust',kind:'waxleaf skid',shape:'skid',color:'#60bda0',radius:1.1,mass:1.2,friction:.015,restitution:.08,motion:'wave'}],
  forestFloor: [
    {interaction:'updraft',kind:'round fungus',shape:'cap',geometry:'dome',color:'#d28ba8',radius:.8,mass:2.5,friction:.2,restitution:.75,motion:'bob'},
    {interaction:'spin',kind:'Grimroot rolling beetle',shape:'circle',color:'#ad8059',radius:.6,mass:1.8,friction:.15,restitution:.7,motion:'roll'},
    {interaction:'gust',kind:'Grandfather seed-husk skid',shape:'skid',color:'#c3a16a',radius:1.2,mass:6,friction:.025,restitution:.1,motion:'roll'}]
});
for(const pool of Object.values(encounterPools)){pool.forEach(Object.freeze);Object.freeze(pool);}
export const encounterRegions={space:[480,600],openSky:[360,480],grandfatherTree:[240,360],jungleCanopy:[120,240],forestFloor:[.8,120]};
const regions=encounterRegions;
const aliases={'Grandfather Tree':'grandfatherTree','Grandfather Tree branches/leaves':'grandfatherTree','open sky':'openSky','open air':'openSky','Jungle canopy':'jungleCanopy','forest floor':'forestFloor','Ground':'forestFloor'};
function hash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function random(key){let a=hash(key);return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function resolveRegion(region,y){if(regions[region])return region;if(aliases[region])return aliases[region];return biomeAt(y).id;}
/** Reject materialization on the player's short relative-motion corridor. This
 * only chooses whether a fresh encounter is born; it never moves an existing body.
 * The full solver separately checks every fixture for actual overlap. */
export function hasArrivalClearance(enemy,player){
 const values=[enemy.x,enemy.y,enemy.radius,enemy.vx??0,enemy.vy??0,player.x,player.y,player.vx??0,player.vy??0];
 if(!values.every(Number.isFinite)||enemy.radius<=0)return false;
 const vx=(player.vx??0)-(enemy.vx??0),vy=(player.vy??0)-(enemy.vy??0),dx=enemy.x-player.x,dy=enemy.y-player.y,speed2=vx*vx+vy*vy;
 const t=speed2?Math.max(0,Math.min(.4,(dx*vx+dy*vy)/speed2)):0;
 return Math.hypot(dx-vx*t,dy-vy*t)>enemy.radius+1.5;
}
/** update(timeSeconds, {x,y}, optionalRegion) -> {active,events}.
 * Active bodies use SI-like world coordinates (y up). Motion is authored kinematic
 * scheduling, NOT a dynamic collision solver. An integrator must replace descriptor
 * motion with dynamic bodies on activation and account for moving-obstacle work.
 * Same seed/time/position yields identical active descriptors, including after rewind.
 * spawns contains only newly observed fresh births with player clearance; consume once
 * into dynamic bodies. It is intentionally stateful. Rewinds emit no duplicate births.
 * Use time since release and do not call until the launch preview quiet period ends.
 * Events describe visibility transitions only; collision sounds belong to the solver.
 */
export function createEncounterDirector(seed=0,saved=null,mapOptions={}){
  if(!['number','string'].includes(typeof seed)||typeof seed==='number'&&!Number.isFinite(seed))throw new Error('Seed must be finite number or string');
  let previous=new Set(),observed=new Map(),latestTime=-1,lastSound=-Infinity;
  // Seed/cell/slot recipes are immutable. Cache only derived constants, never
  // player clearance, motion, births or public descriptors. FIFO bound survives
  // arbitrarily long travel/rewinds without retaining the visited world.
  const recipes=new Map();
  function recipeFor(id,biome,c,row,s){let entry=recipes.get(id);if(entry)return entry;
    const rng=random(`${seed}:${id}`),start=s*.5+rng()*.15;
    const recipe=encounterPools[biome][Math.floor(rng()*encounterPools[biome].length)],baseX=biome==='openSky'?c*10+1+rng()*8:c*18+2+rng()*14,[low,high]=regions[biome],margin=recipe.radius+(biome==='forestFloor'?.2:1.5),baseY=Math.max(low+margin,Math.min(high-margin,low+row*8+1+rng()*6)),phase=rng()*Math.PI*2;
    entry={start,recipe,baseX,baseY,phase};recipes.set(id,entry);if(recipes.size>64)recipes.delete(recipes.keys().next().value);return entry;
  }
  if(saved!==null){
    if(!saved || saved.version!==1 || saved.seed!==seed || !Array.isArray(saved.previous) || !Array.isArray(saved.observed)
      || saved.previous.length>8 || saved.observed.length>10000 || !saved.previous.every(id=>typeof id==='string')
      || !saved.observed.every(e=>Array.isArray(e)&&e.length===2&&typeof e[0]==='string'&&Number.isFinite(e[1])&&e[1]>=0)
      || !Number.isFinite(saved.latestTime) || saved.latestTime< -1
      || !(saved.lastSound===null || Number.isFinite(saved.lastSound)&&saved.lastSound>=0&&saved.lastSound<=saved.latestTime))throw new Error('Invalid encounter snapshot or seed mismatch');
    previous=new Set(saved.previous);observed=new Map(saved.observed);latestTime=saved.latestTime;lastSound=saved.lastSound??-Infinity;
  }
  return {update(time,player,region,{capacity=8}={}){
    if(!Number.isFinite(time)||time<0||!player||!Number.isFinite(player.x)||!Number.isFinite(player.y))throw new Error('Finite nonnegative time and player position required');
    const biome=resolveRegion(region??player.region,player.y),cell=Math.floor(player.x/(biome==='openSky'?10:18)),slot=Math.floor(time/.5),[low,high]=regions[biome],lastRow=Math.ceil((high-low)/8)-1,row=Math.max(0,Math.min(lastRow,Math.floor((player.y-low)/8))),candidates=[];
    // Seeded 10m(sky)/18m(other) x8m neighborhood; four live .5s slots. At most36 recipes, eight public observations/births.
    for(let c=cell-1;c<=cell+1;c++)for(let r=Math.max(0,row-1);r<=Math.min(lastRow,row+1);r++)for(let s=Math.max(0,slot-3);s<=slot;s++){
      const id=`${biome}:${c}:${r}:${s}`,{start,recipe,baseX,baseY,phase}=recipeFor(id,biome,c,r,s),age=time-start;
      if(age<0||age>=2)continue;
      const amplitude=biome==='forestFloor'?.2:1.5,omega=1.2;
      const horizontal=recipe.motion==='roll'||recipe.motion==='wave',offset=amplitude*Math.sin(age*omega+phase),velocity=amplitude*omega*Math.cos(age*omega+phase);
      candidates.push({id,biome,kind:recipe.kind,interaction:recipe.interaction,shape:recipe.shape,color:recipe.color,motion:recipe.motion,...(recipe.geometry?{geometry:recipe.geometry}:{}),
        x:baseX+(horizontal?offset:0),y:baseY+(horizontal?0:offset),vx:horizontal?velocity:0,vy:horizontal?0:velocity,
        radius:recipe.radius,mass:recipe.mass,material:{friction:recipe.friction,restitution:recipe.restitution},spawnTime:start,expiresAt:start+2,harmless:true});
    }
    candidates.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)||a.id.localeCompare(b.id));
    if(mapOptions.ambient===false)candidates.length=0;
    const authored=[];for(const o of mapOptions.authoredEnemies??[]){const recipe=encounterPools[o.biome]?.[o.recipe];if(!recipe||Math.hypot(o.x-player.x,o.y-player.y)>18)continue;const id=`authored:${o.id}`;if(observed.has(id))continue;const e={...recipe,id,biome:o.biome,x:o.x,y:o.y,vx:0,vy:0,radius:recipe.radius*o.size,mass:recipe.mass*o.size**2,material:{friction:recipe.friction,restitution:recipe.restitution},spawnTime:time,expiresAt:time+600,harmless:true};if(hasArrivalClearance(e,player)){authored.push(e);}}
    authored.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
    candidates.unshift(...authored);
    const active=candidates.slice(0,8),current=new Set(active.map(e=>e.id)),events=[],spawns=[];
    // Dynamic solvers consume spawns, NOT the historical active observations.
    // A birth is available for 0.25 s, never replayed after a rewind or revisit.
    // Reject overlapping materialization, rather than push the player out of it.
    const forward=time>=latestTime;
    for(const [id,expiry] of observed)if(expiry<time && forward)observed.delete(id);
    if(forward)for(const enemy of candidates)if(!observed.has(enemy.id)){
      if(enemy.id.startsWith('authored:')&&spawns.length>=capacity)continue;
      observed.set(enemy.id,enemy.expiresAt);
      if(spawns.length<Math.min(8,capacity)&&time-enemy.spawnTime<=.25 && hasArrivalClearance(enemy,player))spawns.push(enemy);
    }
    const audible=new Set();
    if(spawns.length && time-lastSound>=.4){audible.add(spawns[0].id);lastSound=time;}
    latestTime=Math.max(latestTime,time);
    for(const enemy of active)if(!previous.has(enemy.id))events.push({type:'encounter-enter',id:enemy.id,biome,time,sound:audible.has(enemy.id)?'encounter-arrive':null});
    for(const id of previous)if(!current.has(id))events.push({type:'encounter-exit',id,time});
    previous=current;return {active,spawns,events};
  },snapshot(){return {version:1,seed,previous:[...previous],observed:[...observed].map(([id,expiry])=>[id,expiry]),latestTime,lastSound:Number.isFinite(lastSound)?lastSound:null};},reset(){previous=new Set();observed=new Map();latestTime=-1;lastSound=-Infinity;recipes.clear();}};
}
