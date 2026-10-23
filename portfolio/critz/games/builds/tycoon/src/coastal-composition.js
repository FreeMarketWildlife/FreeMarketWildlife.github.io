import {coastalWaterPixel} from './coastal-geometry.js';
// Overlapping registered sprites share one assembled shoreline. Remove internal
// bank/foam seams after composition; a tile's image edge is not a land edge.
export function coastalBoundaryPlanes(cells,width,height){
 const wet=new Uint8Array(width*height),bank=new Uint8Array(width*height),wash=new Uint8Array(width*height);
 for(const a of cells)for(let y=0;y<64;y++)for(let x=0;x<32;x++){const xx=a.x*32+x,yy=a.y*32+y;if(xx>=0&&xx<width&&yy>=0&&yy<height&&coastalWaterPixel(x,y,a.mask??a.m))wet[yy*width+xx]=1;}
 const on=(x,y)=>x>=0&&y>=0&&x<width&&y<height?wet[y*width+x]:0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x,v=wet[i];for(let n=1;n<=12;n++){if(v&&(!on(x,y-n)||(n<=4&&(!on(x-n,y)||!on(x+n,y)||!on(x,y+n)))))bank[i]=1;if(n<=7&&(on(x-n,y)!==v||on(x+n,y)!==v||on(x,y-n)!==v||on(x,y+n)!==v))wash[i]=1;}}
 return{wet,bank,wash,width,height};
}
export function coastalPlanePath(plane,width,height){const p=new Path2D();for(let y=0;y<height;y++){let start=-1;for(let x=0;x<=width;x++){const on=x<width&&plane[y*width+x];if(on&&start<0)start=x;if(!on&&start>=0){p.rect(start,y,x-start,1);start=-1;}}}return p;}
