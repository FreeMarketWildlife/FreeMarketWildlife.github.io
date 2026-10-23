// One placement contract for transparent trees in adventure, editor and review.
// Appearance never changes the authored ground footprint or save-facing cells.
let bank;
export const TREE_FILES=['tiered-cedar','soft-willow','old-grove','coastal-palm'];
export function treePlacement(meta,x,y){
 const [dx,dy]=meta.drawOffsetFromFootprintPixels;
 return {x:Math.round(x*32+dx),y:Math.round(y*32+dy),depth:y*32+32};
}
export function treeStyle(object,scene='',map=null){
 if(object.id?.includes('cypress')||object.type==='cypress')return 'tiered-cedar';
 if(object.type==='willow')return 'soft-willow';
 if(object.type==='palm')return 'coastal-palm';
 if(map&&scene!=='yard'){
  const [cx,cy]=object.collision||[object.x,object.y+1];
  for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+3;x++)if(x>=0&&y>=0&&x<map.w&&y<map.h&&map.terrain[y*map.w+x]==='water')return 'soft-willow';
 }
 return 'old-grove';
}
export async function loadTreeArt(){
 if(bank)return bank;
 const url=new URL('../assets/review/trees-r2/objects.json',import.meta.url),response=await fetch(url);
 if(!response.ok)throw Error('Tree object metadata unavailable');
 const metadata=await response.json(),entries=new Map();
 if(metadata.tileSize!==32)throw Error('Tree grid mismatch');
 await Promise.all(metadata.assets.map(async a=>{
  const slug=a.id.split(':')[1],img=new Image();img.src=new URL(a.image,url).href;await img.decode();
  if(img.width!==a.canvasPixels[0]||img.height!==a.canvasPixels[1]||a.collisionRectPixels[2]!==64||a.collisionRectPixels[3]!==32)throw Error('Invalid tree object '+slug);
  entries.set(slug,{meta:a,img});
 }));
 if(TREE_FILES.some(id=>!entries.has(id)))throw Error('Incomplete tree set');
 bank=entries;return bank;
}
export function drawTree(c,slug,footprintX,footprintY){
 const a=bank?.get(slug);if(!a)throw Error('Tree art not loaded: '+slug);
 const p=treePlacement(a.meta,footprintX,footprintY);
 c.imageSmoothingEnabled=false;c.drawImage(a.img,p.x,p.y);return {...p,width:a.img.width,height:a.img.height};
}
export function treeArtInfo(){return {source:'assets/review/trees-r2/objects.json',loaded:bank?.size||0};}
