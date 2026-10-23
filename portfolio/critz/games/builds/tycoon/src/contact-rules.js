// User-approved B contact geometry. World saves and movement cells do not change.
export const CONTACT_RULE=Object.freeze({id:'B',tileSize:32,structurePixels:16,groundPixels:16,registrationY:32});
export function contactRect([x,y,w,h]){const inset=w===1?8:16;return{x:x*32+inset,y:y*32+16,w:Math.max(16,w*32-2*inset),h:h*32};}
// Native translations and edge trims only; never resample a roof, wall or actor.
export function compileContactPixels(p,w,h,{footprint=[0,0,w/32,h/32],overheadRows=0,groundBand=0,neighbors=null}={}){
 const contact=contactRect(footprint);if(neighbors!==null){const left=neighbors&8?footprint[0]*32:neighbors&2?footprint[0]*32+16:contact.x,right=neighbors&2?(footprint[0]+footprint[2])*32:neighbors&8?(footprint[0]+footprint[2])*32-16:contact.x+contact.w;contact.x=left;contact.w=right-left;}let last=-1;for(let y=0;y<h-groundBand;y++)for(let x=0;x<w;x++)if(p[(y*w+x)*4+3])last=y;
 const dy=Math.round(contact.y+contact.h-(last+1)),top=Math.min(0,dy),height=Math.ceil((Math.max(h+dy,contact.y+contact.h)-top)/32)*32,out=new Uint8ClampedArray(w*height*4);
 const put=(x,y,s)=>{if(x<0||x>=w||y<0||y>=height)return;out.set(p.subarray(s,s+4),(y*w+x)*4);};
 for(let y=0;y<h-groundBand;y++)for(let x=0;x<w;x++){
  const s=(y*w+x)*4;if(!p[s+3])continue;let xx=x;
  if(y>=overheadRows*32){if(x<contact.x||x>=contact.x+contact.w)continue;}
  put(xx,y+dy-top,s);
 }
 // Reattach native outer wall returns after trimming the side contact bands.
 if(footprint[2]>=2)for(let y=overheadRows*32;y<h-groundBand;y++)for(let x=0;x<4;x++){
  for(const [sx,dx]of [[footprint[0]*32+x,contact.x+x],[(footprint[0]+footprint[2])*32-4+x,contact.x+contact.w-4+x]]){const s=(y*w+sx)*4;if(sx>=0&&sx<w&&p[s+3])put(dx,y+dy-top,s);}
 }
 return{pixels:out,w,h:height,offsetY:top,dy,contact};
}
const spriteCache=new WeakMap();
export function drawContactSprite(c,source,sourceRect,artRect,footprint,options={}){
 const [x,y,w,h]=artRect,[sx,sy,sw,sh]=sourceRect;let cache=spriteCache.get(source);if(!cache){cache=new Map();spriteCache.set(source,cache);}
 const local=[footprint[0]-x/32,footprint[1]-y/32,footprint[2],footprint[3]],key=JSON.stringify([sourceRect,w,h,local,options.overheadRows||0,options.groundBand||0,options.neighbors??null]);let frame=cache.get(key);
 if(!frame){const input=document.createElement('canvas');input.width=w;input.height=h;const ic=input.getContext('2d');ic.imageSmoothingEnabled=false;ic.drawImage(source,sx,sy,sw,sh,0,0,w,h);const compiled=compileContactPixels(ic.getImageData(0,0,w,h).data,w,h,{...options,footprint:local});const canvas=document.createElement('canvas');canvas.width=compiled.w;canvas.height=compiled.h;canvas.getContext('2d').putImageData(new ImageData(compiled.pixels,compiled.w,compiled.h),0,0);frame={...compiled,canvas};cache.set(key,frame);}
 c.drawImage(frame.canvas,Math.round(x),Math.round(y+frame.offsetY));return{x,y:y+frame.offsetY,w:frame.w,h:frame.h,dx:0,dy:frame.dy,contact:contactRect(footprint)};
}
export function contactTerrainSpan(mask){return{left:mask&8?0:mask&2?16:8,right:mask&2?32:mask&8?16:24,top:16,bottom:48};}
// Identical native water/bank pixels for the named tilesheet and live review.
export function compileWaterContact(p,mask,{bank=false,deep=false,shallow=false}={}){
 const out=new Uint8ClampedArray(32*64*4),s=contactTerrainSpan(mask),rgb=color=>[parseInt(color.slice(1,3),16),parseInt(color.slice(3,5),16),parseInt(color.slice(5,7),16),255];
 for(let y=16;y<48;y++)for(let x=s.left;x<s.right;x++){
  const i=(y*32+x)*4;if(!bank){out.set(p.subarray(((y-16)*32+x)*4,((y-16)*32+x)*4+4),i);continue;}
  const top=!(mask&1)?y-16:99,left=!(mask&8)?x-s.left:99,right=!(mask&2)?s.right-1-x:99,bottom=!(mask&4)?47-y:99,side=Math.min(left,right,bottom);let color=null;
  if(deep&&top<12)color=['#bed0a3','#8da889','#6f8d79','#6f8d79','#5c7969','#6f8d79','#5c7969','#6f8d79','#456c64','#456c64','#305963','#305963'][top];
  else if(deep&&side<4)color=['#9aae92','#6f8d79','#456c64','#305963'][side];
  else if(Math.min(top,side)<(shallow?1:2))color=shallow?'#675b57':'#514e4e';
  if(color)out.set(rgb(color),i);
 }
 return out;
}
