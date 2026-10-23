import {loadAtlas} from './atlas.js';
import {TICK_SECONDS} from './movement.js';
let bank,entries;
export async function loadHomeArt(){if(bank)return;bank=await loadAtlas(new URL('../assets/playable/home-v2/atlas.json',import.meta.url));entries=new Map(bank.manifest.assets.map(a=>[a.id,a]));}
export const hasHomeArt=id=>entries?.has(id)||false;
export function drawHomeArt(c,id,x,y){if(!bank)return;bank.draw(c,id,x,y);}
export function homeEntry(id){return entries?.get(id);}
export function homeAnimationFrame(prefix,time){let total=0,frames=[];for(let i=0;entries?.has(prefix+'.'+i);i++){const a=entries.get(prefix+'.'+i);frames.push(a);total+=a.ticks;}let tick=time/TICK_SECONDS%total;for(const a of frames){if(tick<a.ticks)return a.id;tick-=a.ticks;}return prefix+'.0';}
export function drawHomeProp(c,id,o){const a=entries?.get(id);if(!a)return false;const end=o.collision?o.collision[1]+o.collision[3]:o.y+o.h,x=(o.x+o.w/2)*32-a.anchor[0],y=end*32+(o.collision?16:0)-a.anchor[1];drawHomeArt(c,id,x,y);return true;}
export function drawRoomBackdrop(c,camera,width,height){if(!bank)return;for(let y=Math.floor(camera.y/32)*32;y<camera.y+height;y+=32)for(let x=Math.floor(camera.x/32)*32;x<camera.x+width;x+=32)drawHomeArt(c,'room.surround',x,y);}
