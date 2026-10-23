import {contactTerrainSpan,CONTACT_RULE,compileWaterContact} from './contact-rules.js';
// All reflection/effect masks are hard native pixels; no reference artwork.
import {cloudsVisible} from './water-clouds.js';
import {waterPixel,ripplePose} from './water-surfaces.js';
export async function loadWaterTerrain(path='../assets/review/water-terrain/atlas.json'){
 const url=new URL(path,import.meta.url),manifest=await(await fetch(url)).json(),img=new Image();img.src=new URL(manifest.image,url).href;await img.decode();const tiles=new Map(manifest.assets.map(t=>[t.id,t])),cache=new Map();
 const draw=(c,id,x,y)=>{const a=tiles.get(id);if(!a)throw Error('Missing water tile '+id);c.drawImage(img,a.x,a.y,32,32,x,y,32,32);};
 return{manifest,draw,drawContact(c,id,x,y){let frame=cache.get(id);if(!frame){const a=tiles.get(id);if(!a)throw Error('Missing water contact '+id);const canvas=document.createElement('canvas');canvas.width=32;canvas.height=64;const cc=canvas.getContext('2d'),input=document.createElement('canvas');input.width=input.height=32;const ic=input.getContext('2d');if(id.startsWith('join.'))draw(ic,a.inner+'.0',0,0);const pixels=compileWaterContact(ic.getImageData(0,0,32,32).data,a.neighborMask,{bank:!id.startsWith('join.'),deep:id.startsWith('depth.'),shallow:a.inner?.includes('shallow')});cc.putImageData(new ImageData(pixels,32,64),0,0);frame=canvas;cache.set(id,frame);}c.drawImage(frame,x,y);},contactRule:CONTACT_RULE};
}

const pathCache=new Map();
export function maskPath(cells,predicate=()=>true){const selected=cells.filter(cell=>predicate(cell.surface)),key=selected.map(({x,y,mask})=>`${x},${y},${mask}`).join(';');if(pathCache.has(key))return pathCache.get(key);const p=new Path2D();for(const {x,y,mask}of selected){const span=contactTerrainSpan(mask);p.rect(x*32+span.left,y*32+span.top,span.right-span.left,span.bottom-span.top);}pathCache.set(key,p);return p;}

const ellipse=(c,cx,cy,rx,ry,color,outline=false)=>{c.fillStyle=color;for(let yy=-ry;yy<=ry;yy++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));if(outline){c.fillRect(cx-w,cy+yy,2,1);c.fillRect(cx+w-1,cy+yy,2,1);}else c.fillRect(cx-w,cy+yy,w*2+1,1);}};
export function drawRipples(c,ripples,time,clip){c.save();c.clip(clip);for(const r of ripples){const p=ripplePose(time-r.time);if(!p)continue;c.globalAlpha=p.alpha;ellipse(c,r.x,r.y,p.rx,p.ry,'#c8e5d9',true);if(time-r.time<.134){c.fillRect(r.x-5,r.y-2,3,1);c.fillRect(r.x+3,r.y-3,2,2);}}c.restore();}
export function drawReflection(c,actor,clip,time,moving=false){c.save();c.clip(clip);c.globalAlpha=.52;
 // Copy the same pose, invert about the foot anchor. Integer scanlines keep pixels crisp.
 for(let y=0;y<64;y++){const drift=moving?Math.round(Math.sin(time*2+y/7)):0;c.drawImage(actor.image,0,63-y,32,1,Math.round(actor.x)-16+drift,Math.round(actor.y)-4+y,32,1);}
 c.restore();}
export function drawSky(c,time,minute,clip,calm,cloudArt,weather='sunny'){const night=minute>=1260,phase=calm?0:time;c.save();c.clip(clip);
 if(night){for(let i=0;i<28;i++){const x=(i*73+21)%480,y=(i*47+136)%320;c.fillStyle=i%3?'#b4d5db':'#deead7';c.globalAlpha=.35+(calm?.1:Math.sin(phase*1.8+i)*.15);c.fillRect(x,y,2,2);if(i%5===0){c.fillRect(x-2,y+1,6,1);c.fillRect(x+1,y-2,1,6);}}}
 else if(cloudArt&&cloudsVisible(minute,weather)){c.globalAlpha=.52;for(let i=0;i<3;i++){const x=Math.round(((370+i*167-phase*9)%680+680)%680)-96,y=126+i*50;cloudArt.draw(c,i,minute,x,y);}}
 c.restore();}
