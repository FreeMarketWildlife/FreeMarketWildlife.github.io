import {coastalBankPixels,coastalWashColor} from './coastal-format.js';
export function coastalFieldPath(field){const p=new Path2D(),{wet,width:w,height:h}=field;for(let y=0;y<h;y++){let start=-1;for(let x=0;x<=w;x++){const on=x<w&&wet[y*w+x];if(on&&start<0)start=x;if(!on&&start>=0){p.rect(start,y,x-start,1);start=-1;}}}return p;}
function nativeCanvas(field,pixels){const cv=document.createElement('canvas');cv.width=field.width;cv.height=field.height;cv.getContext('2d').putImageData(new ImageData(pixels,field.width,field.height),0,0);return cv;}
export function createCoastalDrawing(field,styleAt){
 const enabledAt=(x,y)=>{const s=styleAt(x,y);return s.ground==='sand'&&s.moving;};
 // Pack only boundary tiles that can contain moving wash. All 32 phases fit
 // in a small shoreline atlas instead of repeatedly allocating whole lakes.
 const patches=[],byTile=new Map();
 for(let y=0;y<field.height;y++)for(let x=0;x<field.width;x++){
  const distance=field.signed[y*field.width+x];
  if(Math.abs(distance)>6||!enabledAt(x,y))continue;
  const tx=Math.floor(x/32)*32,ty=Math.floor(y/32)*32,key=tx+','+ty;
  let patch=byTile.get(key);
  if(!patch){patch={x:tx,y:ty,index:patches.length,points:[]};patches.push(patch);byTile.set(key,patch);}
  patch.points.push(x-tx,y-ty,distance);
 }
 for(const patch of patches)patch.points=Float32Array.from(patch.points);
 return{field,path:coastalFieldPath(field),bank:nativeCanvas(field,coastalBankPixels(field,styleAt)),waves:new Map(),enabledAt,patches};
}
function washAtlas(d,f){
 const columns=Math.min(8,d.patches.length),width=columns*32,height=Math.ceil(d.patches.length/columns)*32,pixels=new Uint8ClampedArray(width*height*4),advance=2*Math.sin(f*2*Math.PI/32);
 for(const patch of d.patches){const px=patch.index%columns*32,py=Math.floor(patch.index/columns)*32;for(let i=0;i<patch.points.length;i+=3){const color=coastalWashColor(patch.points[i+2],advance);if(color)pixels.set(color,((py+patch.points[i+1])*width+px+patch.points[i])*4);}}
 return nativeCanvas({width,height},pixels);
}
export function drawCoastalBoundary(c,d,f,{bank=true,wash=true,bounds=null}={}){
 if(bank)c.drawImage(d.bank,0,0);
 if(!wash||!d.patches.length)return;
 f=((f%32)+32)%32;
 if(!d.waves.has(f))d.waves.set(f,washAtlas(d,f));
 const image=d.waves.get(f),columns=image.width/32;
 const limit=Math.max(1,Math.min(32,Math.floor(16*1024*1024/(image.width*image.height*4))));
 while(d.waves.size>limit)d.waves.delete(d.waves.keys().next().value);
 for(const p of d.patches){
  if(bounds&&(p.x>=bounds.x+bounds.w||p.y>=bounds.y+bounds.h||p.x+32<=bounds.x||p.y+32<=bounds.y))continue;
  c.drawImage(image,p.index%columns*32,Math.floor(p.index/columns)*32,32,32,p.x,p.y,32,32);
 }
}
