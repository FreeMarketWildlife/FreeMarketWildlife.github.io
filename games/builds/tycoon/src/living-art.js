import {loadAtlas} from './atlas.js';
import {TICK_SECONDS} from './movement.js';
let atlas,entries,buttonAtlas,buttonEntries;
export const CRITTERS=['pebble-gecko','button-snail','isopod','springtail','tree-frog','cherry-shrimp','guppy','stag-beetle','mangrove-crab','cory-catfish'];
export const HABITATS=['terrarium','aquarium','paludarium'];
const NPCS={mom:'mom',nugget:'professor-nugget',kaid:'kaid','shop-critz':'juniper','shop-vet':'dr-fern','shop-pharmacy':'mina','shop-bike':'ollie','shop-glass':'aunt-ember',rivalMom:'rival-mom',rivalDad:'rival-dad'};
export const RESCUES={gecko:'pebble-gecko',snail:'button-snail',isopods:'isopod',springtails:'springtail'};
export function npcIdentity(e,gender='boy'){return e.id==='rival'?`rival-${gender==='boy'?'girl':'boy'}`:NPCS[e.id]||e.look;}
export function characterFrame(facing='down',pose='idle') {return ({down:0,up:4,left:8,right:12}[facing]??0)+({strideA:0,idle:1,passing:1,strideB:2}[pose]??1);}
export async function loadLivingArt(){[atlas,buttonAtlas]=await Promise.all([loadAtlas(new URL('../assets/playable/living/atlas.json',import.meta.url)),loadAtlas(new URL('../assets/playable/button-v2/atlas.json',import.meta.url))]);entries=new Map(atlas.manifest.assets.map(a=>[a.id,a]));buttonEntries=new Map(buttonAtlas.manifest.assets.map(a=>[a.id,a]));for(const [id,a]of buttonEntries)entries.set(id,a);}
export function drawLiving(c,slug,frame,x,y){if(!atlas)return;const id=`${slug}.${frame}`;(buttonEntries?.has(id)?buttonAtlas:atlas).draw(c,id,Math.round(x),Math.round(y));}
export function animatedFrame(slug,time){const frames=[];for(let i=0;entries?.has(`${slug}.${i}`);i++)frames.push(entries.get(`${slug}.${i}`).ticks);const total=frames.reduce((a,b)=>a+b,0);let tick=((time/TICK_SECONDS)%total+total)%total;for(let i=0;i<frames.length;i++){if(tick<frames[i])return i;tick-=frames[i];}return 0;}
export function drawCritter(c,slug,x,y,time=0){drawLiving(c,slug,animatedFrame(slug,time),x,y);}
export function drawHabitatProp(c,type,x,y){drawLiving(c,`${type}-world-prop`,0,x-48,y-96);}
