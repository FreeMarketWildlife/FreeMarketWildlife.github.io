import {canonicalMask} from './water-surfaces.js';
// M1.WA9 user exception: keep the south +16 registration, but expose 24px
// clear water at north/west/east edges. West/east use4px ground +4px bank;
// north uses2px ground +6px bank (16px registration minus14px seed offset).
export const COAST_FORMAT=Object.freeze({tileSize:32,registrationY:16,sideInset:4,northInset:-14,northBankDepth:6,landwardBankWidth:4,roundRadius:3,minimumWaterBlock:2,loopSeconds:3.2});
export function supportedWaterMask(m){return [19,38,76,137].some(pair=>(m&pair)===pair)&&(!(m&1)||!!(m&144))&&(!(m&2)||!!(m&48))&&(!(m&4)||!!(m&96))&&(!(m&8)||!!(m&192));}
export const COAST_MASKS=[...new Set(Array.from({length:256},(_,m)=>canonicalMask(m)))].filter(supportedWaterMask);
export const COAST_CONTEXTS=Array.from({length:256},(_,m)=>m).filter(m=>COAST_MASKS.includes(canonicalMask(m)));
export function sliverCells(cells){const set=new Set(cells.map(a=>a.x+','+a.y)),on=(x,y)=>set.has(x+','+y);return cells.filter(a=>![[1,1],[1,-1],[-1,1],[-1,-1]].some(([dx,dy])=>on(a.x+dx,a.y)&&on(a.x,a.y+dy)&&on(a.x+dx,a.y+dy)));}
// Exact circular binary morphology, using row prefix counts instead of
// revisiting every tap of the disk for every pixel in a large lake.
export function morphCoastalMask(input,w,h,dilate,radius){
 const runs=[];for(let y=-radius;y<=radius;y++)runs.push([y,Math.floor(Math.sqrt(radius*radius-y*y))]);
 const stride=w+1,prefix=new Uint32Array(stride*h),out=new Uint8Array(input.length);
 for(let y=0;y<h;y++){const row=y*stride;for(let x=0;x<w;x++)prefix[row+x+1]=prefix[row+x]+input[y*w+x];}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let value=dilate?0:1;
  for(const [dy,rx]of runs){
   const yy=y+dy,left=x-rx,right=x+rx+1;
   if(yy<0||yy>=h){if(!dilate){value=0;break;}continue;}
   if(!dilate&&(left<0||right>w)){value=0;break;}
   const count=prefix[yy*stride+Math.min(w,right)]-prefix[yy*stride+Math.max(0,left)];
   if(dilate?count>0:count<right-left){value=dilate?1:0;break;}
  }
  out[y*w+x]=value;
 }
 return out;
}
const morph=morphCoastalMask;
// One construction for all material pairs. Round the complete footprint before
// slicing tiles; no per-tile border, overlap, clipped return or missing diagonal.
export function compileCoastalField(cells,width,height,{registrationY=COAST_FORMAT.registrationY,sideInset=COAST_FORMAT.sideInset,verticalInset=0,northInset=verticalInset||COAST_FORMAT.northInset,roundRadius=sideInset<=5?3:6}={}){
 const seed=new Uint8Array(width*height),set=new Set(cells.map(a=>a.x+','+a.y));
 const on=(x,y)=>set.has(x+','+y);
 for(const a of cells){const left=on(a.x-1,a.y)?0:sideInset,right=on(a.x+1,a.y)?32:32-sideInset,top=on(a.x,a.y-1)?0:northInset,bottom=on(a.x,a.y+1)?32:32-verticalInset;for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const xx=a.x*32+x,yy=a.y*32+y+registrationY;if(xx>=0&&xx<width&&yy>=0&&yy<height)seed[yy*width+xx]=1;}}
 const closed=morph(morph(seed,width,height,true,roundRadius),width,height,false,roundRadius),wet=morph(morph(closed,width,height,false,roundRadius),width,height,true,roundRadius),signed=distanceField(wet,width,height);
 return{wet,signed,width,height};
}
// Native chamfer distance: a continuous field for the entire shoreline, reused
// for each tide frame. Pixel clusters, never blurred alpha or independent strips.
function distanceField(wet,w,h){const d=new Float32Array(w*h).fill(1000),on=(x,y)=>x>=0&&x<w&&y>=0&&y<h?wet[y*w+x]:0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(on(x-1,y)!==wet[y*w+x]||on(x+1,y)!==wet[y*w+x]||on(x,y-1)!==wet[y*w+x]||on(x,y+1)!==wet[y*w+x])d[y*w+x]=.5;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(x)d[i]=Math.min(d[i],d[i-1]+1);if(y){d[i]=Math.min(d[i],d[i-w]+1);if(x)d[i]=Math.min(d[i],d[i-w-1]+1.4142);if(x+1<w)d[i]=Math.min(d[i],d[i-w+1]+1.4142);}}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(x+1<w)d[i]=Math.min(d[i],d[i+1]+1);if(y+1<h){d[i]=Math.min(d[i],d[i+w]+1);if(x)d[i]=Math.min(d[i],d[i+w-1]+1.4142);if(x+1<w)d[i]=Math.min(d[i],d[i+w+1]+1.4142);}}for(let i=0;i<d.length;i++)if(!wet[i])d[i]=-d[i];return d;}
const rgb=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255];
const face=['#bcaa7d','#998769','#8a7764','#8a7764','#736455','#736455','#6c6053','#625b50','#5c5b51','#416d70','#365f69','#315768'].map(rgb),side=['#a79778','#746858','#446969','#315768'].map(rgb),rim=rgb('#797762'),foam=rgb('#edf1cc'),wash=rgb('#91c8c2'),wetSand=rgb('#c3b781');
// M1.WA10: a four-pixel earthen shoulder grows only over dry ground.
// Closest wet samples supply material/depth, so shallow rims and sand never
// acquire a raised shoulder merely because this pixel lies outside the lake.
const landwardTaps=[];
for(let dy=-COAST_FORMAT.landwardBankWidth;dy<=COAST_FORMAT.landwardBankWidth;dy++)for(let dx=-COAST_FORMAT.landwardBankWidth;dx<=COAST_FORMAT.landwardBankWidth;dx++){
 const distance=Math.hypot(dx,dy);if(distance>0&&distance<=COAST_FORMAT.landwardBankWidth)landwardTaps.push({dx,dy,distance});
}
landwardTaps.sort((a,b)=>a.distance-b.distance);
const shoulder=['#b49c74','#bca67b','#c0ad80','#b7a47b'].map(rgb);
function addLandwardBank(field,out,styleAt){
 const {wet,signed,width:w,height:h}=field;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;if(wet[i]||signed?.[i]<-COAST_FORMAT.landwardBankWidth)continue;
  for(const {dx,dy,distance}of landwardTaps){
   const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h||!wet[yy*w+xx])continue;
   const style=styleAt(xx,yy);
   if((style.landwardGround??style.ground)!=='sand'&&!(style.landwardShallow??style.shallow))out.set(shoulder[Math.ceil(distance)-1],i*4);
   break;
  }
 }
 return out;
}
export function coastalBankPixels(field,styleAt=()=>({ground:'grass',shallow:false})){const {wet,width:w,height:h}=field,out=new Uint8ClampedArray(w*h*4),on=(x,y)=>x>=0&&x<w&&y>=0&&y<h?wet[y*w+x]:0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!wet[i]||field.signed?.[i]>12)continue;const style=styleAt(x,y);if(style.ground==='sand')continue;let up=0,edge=0;for(let n=1;n<=COAST_FORMAT.northBankDepth;n++)if(!on(x,y-n)){up=n;break;}for(let n=1;n<=4;n++)if(!on(x-n,y)||!on(x+n,y)||!on(x,y+n)){edge=n;break;}let color=style.shallow?(up===1||edge===1?rim:null):up?face[[0,2,4,6,8,11][up-1]]:edge?side[edge-1]:null;if(color){if(!style.shallow&&up>=2&&up<=4&&x%8===3)color=rgb('#5c554c');out.set(color,i*4);}}return addLandwardBank(field,out,styleAt);}
export function coastalWashColor(distance,advance){
 const front=distance-advance;
 if(Math.abs(front)<=.7)return foam;
 if(front<-.7&&front>=-2.7)return wash;
 if(distance<0&&distance>=-4)return wetSand;
 return null;
}
export function coastalWashPixels(field,frame,enabledAt=()=>true){const {signed,width:w,height:h}=field,out=new Uint8ClampedArray(w*h*4),advance=2*Math.sin((frame%32)*2*Math.PI/32);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,d=signed[i];if(Math.abs(d)>6||!enabledAt(x,y))continue;const color=coastalWashColor(d,advance);if(color)out.set(color,i*4);}return out;}
