import {FRUIT_TREES} from './fruit-trees.js';
import {OPEN_ENTRANCES} from './lighting.js';
// Original map authoring. World cells, IDs and collision are independent of PNG pixels.
export const WORLD_REVISION = 2;
export const OUTDOOR_SCENES = ['yard', 'town', 'forest', 'liarsville'];
// Roof projection is separate from the solid walls. Deeper rear overlap is an
// authored per-building choice; it never opens the bottom two wall rows.
export function buildingFootprint(b){
 const h=b.h??5,depth=b.rearDepth??1;
 if(!Number.isInteger(depth)||depth<0||depth>h-2)throw Error('Invalid building rear depth');
 return [b.x,b.y+depth,b.w,h-depth];
}
export const buildings = [
  {x:4,y:6,w:5,h:5,name:'HOME',scene:'yard',roof:'clay',wall:'plaster'},
  {x:13,y:5,w:5,h:5,name:'KAID',scene:'kaidHome',roof:'teal',wall:'timber'},
  {x:27,y:6,w:5,h:5,name:'RIVAL',scene:'rivalHome',roof:'clay',wall:'plaster'},
  {x:4,y:17,w:7,h:5,name:'CRITZ',scene:'critz',roof:'teal',wall:'timber'},
  {x:16,y:19,w:5,h:5,name:'VET',scene:'vet',roof:'clay',wall:'plaster'},
  {x:28,y:17,w:7,h:5,name:'DRUG STORE',scene:'pharmacy',roof:'teal',wall:'stone'},
  {x:6,y:28,w:5,h:5,name:'BIKE SHOP',scene:'bike',roof:'clay',wall:'timber'},
  {x:23,y:28,w:7,h:5,name:'GLOW N’ BLOW',scene:'glass',roof:'teal',wall:'stone'},
].map(b=>({...b,rearDepth:1,doorX:b.x+Math.floor(b.w/2),doorY:b.y+b.h,collision:buildingFootprint(b)}));
const dirs=[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8],[1,-1,16],[1,1,32],[-1,1,64],[-1,-1,128]];
export function normalizeMask(m){for(const [bit,a,b]of [[16,1,2],[32,2,4],[64,4,8],[128,8,1]])if(!(m&a)||!(m&b))m&=~bit;return m;}
function create(w,h,safeSpawn){return {w,h,safeSpawn,meadow:new Set(),terrain:Array(w*h).fill('grass'),ground:[],decals:[],objects:[],solid:new Set(),grass:new Set(),portals:[]};}
const key=(x,y)=>`${x},${y}`;
function rect(m,x,y,w,h,kind){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>=0&&j>=0&&i<m.w&&j<m.h)m.terrain[j*m.w+i]=kind;}
function block(m,x,y,w=1,h=1){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)m.solid.add(key(i,j));}
function deco(m,id,x,y){m.decals.push({id,x,y});}
function object(m,id,x,y,w=1,h=1,footprint=[0,h-1,w,1],kind='prop'){
 const o={id,sprite:id,x,y,w,h,kind,depth:y+h,collision:footprint&&[x+footprint[0],y+footprint[1],footprint[2],footprint[3]]};if(id.startsWith('fence.')){o.collision=null;o.kind='fence';o.depth=y+1.2;}m.objects.push(o);if(o.collision)block(m,...o.collision);return o;
}
function tree(m,x,y,type='broadleaf'){return object(m,`tree.${type}.rooted`,x,y,2,type==='cypress'?3:2,[0,type==='cypress'?2:1,2,1],'tree');}
function house(m,b){const rows=[];for(let y=0;y<3;y++)rows.push(Array.from({length:b.w},(_,x)=>`roof.${b.roof}.${y}.${x===0?'left':x===b.w-1?'right':'center'}`));for(let y=0;y<2;y++)rows.push(Array.from({length:b.w},(_,x)=>x===Math.floor(b.w/2)?`door.wood.${OPEN_ENTRANCES.has(b.scene)?'open':'closed'}.0.${y}`:x===0||x===b.w-1?`wall.${b.wall}.${y}.${x===0?'left':'right'}`:x===1&&['critz','vet','pharmacy','bike','glass'].includes(b.scene)?`wall.${b.wall}.${y}.center`:x%2?`windowbox.${b.wall}.0.${y}`:`wall.${b.wall}.${y}.center`));
 // The wall base and its ground strip form one deliberately solid metatile.
 rows[4]=rows[4].map((id,x)=>`contact.${id}.${x===Math.floor(b.w/2)?'path':['path','paving'].includes(m.terrain[(b.y+4)*m.w+b.x+x])?m.terrain[(b.y+4)*m.w+b.x+x]:'grass'}`);
 const footprint=buildingFootprint(b),rearDepth=footprint[1]-b.y;
 const o=object(m,'building',b.x,b.y,b.w,5,[0,rearDepth,b.w,footprint[3]],'building');o.tiles=rows;o.name=b.name;o.entrance=OPEN_ENTRANCES.has(b.scene)?'open':'door';o.facade=b.w>=7?'shop':b.roof==='teal'?'garden':'cottage';o.rearDepth=rearDepth;
 if(['critz','vet','pharmacy','bike','glass'].includes(b.scene)){const plaque=object(m,`shop.sign.${b.scene}`,b.x+1,b.y+3,1,1,null);plaque.depth=b.y+5+.1;}
 // Keep attached chimney art above a passing actor, just behind its own roof.
 const chimney=object(m,'chimney',b.x+b.w-2,b.y-1,1,2,null);chimney.depth=o.depth-.05;
 rect(m,b.x+Math.floor(b.w/2),b.y+5,1,3,'path');
}
function fence(m,x,y,n,gap=-1){for(let i=0;i<n;i++){if(i===gap)continue;object(m,`fence.${(i>0&&i-1!==gap?8:0)|(i<n-1&&i+1!==gap?2:0)}`,x+i,y);}}
function flowers(m,x,y,w,h,v=0){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)deco(m,`flowers.${(i+j+v)%6}`,i,j);}
function tall(m,x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){m.grass.add(key(i,j));deco(m,'grass.living.0',i,j);}}
function fountain(m,x,y){object(m,'fountain.small',x,y,3,3,[0,0,3,3]);const jet=object(m,'fountain.jet',x+1,y,1,2,null);jet.depth=y+3+.1;}
function border(m,gaps=[],southGaps=[]){for(let x=0;x<m.w;x+=2){if(!gaps.some(([a,b])=>x>=a&&x<=b))tree(m,x,0);if(!southGaps.some(([a,b])=>x>=a&&x<=b))tree(m,x,m.h-2);}for(let y=3;y<m.h-3;y+=3){tree(m,0,y);tree(m,m.w-2,y);}for(let x=0;x<m.w;x++){block(m,x,0);block(m,x,m.h-1);}for(let y=0;y<m.h;y++){block(m,0,y);block(m,m.w-1,y);}}
function bridge(m,x,y,w,h,dir='horizontal'){rect(m,x,y,w,h,'bridge');for(let j=0;j<h;j++)for(let i=0;i<w;i++)deco(m,`bridge.${dir}.${dir==='horizontal'?(j===0?'near':j===h-1?'far':'center'):(i===0?'near':i===w-1?'far':'center')}`,x+i,y+j);}
// Coordinate hashing avoids repeated diagonal bands while remaining save-independent.
function terrainVariant(x,y,n){let h=Math.imul(x+19,374761393)^Math.imul(y+73,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)%n;}
function turf(m,patches){
 for(const [cx,cy,rx,ry]of patches)for(let y=Math.max(0,cy-ry);y<Math.min(m.h,cy+ry+1);y++)for(let x=Math.max(0,cx-rx);x<Math.min(m.w,cx+rx+1);x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1&&m.terrain[y*m.w+x]==='grass')m.meadow.add(key(x,y));
}
function finish(m){
 // A fence belongs beside a lane, never across its authored walking surface.
 // Remove only obsolete obstacles; no new occupied cells invalidate old saves.
 const road=(x,y)=>['path','paving','bridge'].includes(m.terrain[y*m.w+x]);
 const removed=m.objects.filter(o=>o.id.startsWith('fence.')&&road(o.x,o.y));
 m.objects=m.objects.filter(o=>!removed.includes(o));
 for(const o of removed)if(!m.objects.some(other=>other.collision&&o.x>=other.collision[0]&&o.x<other.collision[0]+other.collision[2]&&o.y>=other.collision[1]&&o.y<other.collision[1]+other.collision[3]))m.solid.delete(key(o.x,o.y));
 const rails=new Set(m.objects.filter(o=>o.id.startsWith('fence.')).map(o=>key(o.x,o.y)));
 for(const o of m.objects.filter(o=>o.id.startsWith('fence.')))o.id=o.sprite=`fence.${(rails.has(key(o.x-1,o.y))?8:0)|(rails.has(key(o.x+1,o.y))?2:0)}`;
 // Flower roots need a planted surface and may not share a solid prop cell.
 m.decals=m.decals.filter(d=>!(d.id.startsWith('flowers.')||d.id==='fern.wild')||(['grass','soil'].includes(m.terrain[d.y*m.w+d.x])&&!m.solid.has(key(d.x,d.y))));

 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
  const kind=m.terrain[y*m.w+x];if(kind==='water')block(m,x,y);
  if(kind==='grass'||kind==='bridge'){
   if(m.meadow.has(key(x,y))){let mask=0;for(const [dx,dy,bit]of dirs)if(m.meadow.has(key(x+dx,y+dy)))mask|=bit;m.ground.push(`meadow.sward.${normalizeMask(mask)}.${terrainVariant(x,y,2)}`);}
   else m.ground.push(`meadow.grass.${terrainVariant(x,y,16)}`);
   continue;
  }
  let mask=0;for(const [dx,dy,bit]of dirs){const a=x+dx,b=y+dy;const n=m.terrain[b*m.w+a];if(a<0||b<0||a>=m.w||b>=m.h||n===kind||(kind==='path'&&n==='bridge'))mask|=bit;}m.ground.push(kind==='path'?`meadow.path.${normalizeMask(mask)}.${[0,0,0,1,1,2,2,3][terrainVariant(x,y,8)]}`:`${kind}.${normalizeMask(mask)}`);
 }
 // Deliberate map boundary: scenic pockets outside the connected playspace are
 // non-walkable. This prevents old saves being recovered onto an isolated bank.
 const queue=[m.safeSpawn],seen=new Set([key(...m.safeSpawn)]);if(m.solid.has(key(...m.safeSpawn)))throw Error('Blocked authored spawn');
 for(let n=0;n<queue.length;n++){const [x,y]=queue[n];for(const [dx,dy]of dirs.slice(0,4)){const a=x+dx,b=y+dy,k=key(a,b);if(a>0&&b>0&&a<m.w-1&&(b<m.h-1||m.portals.some(p=>p.x===a&&p.y===b))&&!m.solid.has(k)&&!seen.has(k)){seen.add(k);queue.push([a,b]);}}}
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)if(!seen.has(key(x,y)))m.solid.add(key(x,y));
 return m;
}
function rootport(){const m=create(44,38,[21,26]);
 // Quiet cottage lane, civic spring, then the workshops by the lower river.
 rect(m,4,12,31,2,'path');rect(m,10,12,3,23,'path');rect(m,23,10,3,25,'path');rect(m,4,24,35,3,'path');rect(m,7,34,23,2,'path');rect(m,20,1,3,13,'path');rect(m,17,11,10,7,'paving');
 for(let y=0;y<m.h;y++)rect(m,37+(y<12?1:y>29?-1:0),y,4,1,'water');bridge(m,36,24,6,3);rect(m,41,24,2,3,'path');
 for(const b of buildings){house(m,b);const road=b.y<10?13:b.y<25?25:34;rect(m,b.doorX,b.doorY,1,road-b.doorY+1,'path');fence(m,b.x-1,b.y+6,b.w+2,Math.floor(b.w/2)+1);object(m,'mailbox',b.x+Math.floor(b.w/2)+1,b.y+5);flowers(m,b.x,b.y+5,1,1);}
 fountain(m,20,13);object(m,'bench',17,16,2,1);object(m,'bench',24,16,2,1);object(m,'lamp',17,12,1,2);object(m,'lamp',26,12,1,2);
 rect(m,4,14,4,2,'soil');for(let j=0;j<2;j++)for(let i=0;i<4;i++)deco(m,`garden.${['lettuce','carrot'][j]}`,4+i,14+j);
 fence(m,3,16,6);flowers(m,29,14,5,1,2);fence(m,28,15,7,3);
 for(const [x,y]of [[3,3],[10,3],[18,4],[33,4],[2,10],[14,14],[34,11],[1,20],[12,19],[26,19],[33,29],[13,29],[18,31],[3,32],[30,34]])tree(m,x,y,(x+y)%3===0?'cypress':'broadleaf');
 for(const [x,y]of [[8,16],[14,27],[31,27],[35,22],[18,10],[27,11],[21,28]])flowers(m,x,y,2,1);
 for(const [x,y]of [[36,6],[36,16],[35,30],[39,32]])deco(m,'reeds.1',x,y);for(const [x,y]of [[39,5],[39,18],[38,31]])deco(m,'lilypad.1',x,y);
 object(m,'sign',19,1,1,2);object(m,'sign',14,24,1,2);object(m,'marker.north',21,7);object(m,'log.hollow',32,32,3,1);border(m,[[20,22]]);turf(m,[[6,4,5,2],[14,15,3,3],[5,25,3,2],[17,29,4,2],[31,15,4,2],[34,32,3,3],[31,5,3,2],[21,8,3,2]]);return finish(m);
}
function forest(){const m=create(28,34,[13,31]);
 // A short winding route. Crossing the meadow's grass is required; no encounter
 // or damage mechanic is introduced by its terrain behavior.
 rect(m,12,25,3,8,'path');rect(m,8,22,7,4,'path');rect(m,8,15,3,10,'path');rect(m,8,13,11,3,'path');rect(m,16,7,3,8,'path');rect(m,12,5,7,3,'path');rect(m,12,1,3,6,'path');
 for(let y=0;y<34;y++)rect(m,y<12?22:y<23?21:22,y,3,1,'water');
 for(const [x,y]of [[3,3],[5,3],[8,2],[16,2],[18,3],[2,7],[4,8],[7,7],[10,9],[12,9],[3,12],[5,13],[12,17],[14,18],[17,18],[3,19],[5,20],[15,23],[17,24],[3,26],[5,28],[8,29],[17,29],[19,30],[24,3],[24,9],[24,17],[24,24],[2,31]])tree(m,x,y,(x+y)%3===0?'cypress':'broadleaf');
 // Narrow the tall meadow across the full traversable throat with tree trunks.
 for(let x=1;x<27;x++)if((x<8||x>10)&&m.terrain[21*m.w+x]!=='water')object(m,'hedge.10',x,21);rect(m,8,20,3,3,'grass');tall(m,8,20,3,3);
 tall(m,13,11,3,2);tall(m,4,16,3,2);tall(m,17,26,3,2);
 object(m,'log.hollow',3,23,3,1);object(m,'log.hollow',12,16,3,1);object(m,'stump.old',6,24);object(m,'marker.north',11,5);object(m,'sign',15,29,1,2);
 for(const [x,y]of [[6,22],[11,24],[13,18],[15,15],[5,9],[19,10],[9,27]]){deco(m,'leaves.litter',x,y);deco(m,'fern.wild',x+1,y);}
 flowers(m,19,7,2,2);flowers(m,5,26,2,1);for(let y=5;y<30;y+=6)deco(m,'reeds.0',20,y);
 // Old spillway embedded in the east bank, with a pool and a safe overlook.
 for(let x=21;x<=25;x++)for(let y=9;y<12;y++)object(m,`cliff.${y-9}.${x===21?'left':x===25?'right':'center'}`,x,y,1,1,[0,0,1,1]);
 for(let y=9;y<12;y++)object(m,`waterfall.0.${y-9}`,23,y,1,1,null);deco(m,'waterfall.splash',23,12);
 border(m,[[12,14]],[[12,14]]);turf(m,[[5,6,5,4],[18,5,3,3],[6,15,5,4],[17,19,3,4],[5,28,4,3],[18,28,3,3]]);return finish(m);
}
export const liarsBuildings=[
 {x:4,y:5,w:9,h:5,rearDepth:2,name:'THE OLD WATERWORKS',scene:'waterworks',roof:'teal',wall:'stone'},
 {x:25,y:6,w:7,h:5,name:'MILLKEEPER’S HOUSE',roof:'clay',wall:'timber'},
 {x:4,y:21,w:5,h:5,name:'GARDENER’S COTTAGE',roof:'clay',wall:'plaster'},
 {x:25,y:23,w:5,h:5,name:'SEED LIBRARY',roof:'teal',wall:'timber'},
];
function liarsville(){const m=create(36,32,[14,28]);
 rect(m,12,10,3,21,'path');rect(m,5,17,26,3,'path');rect(m,8,10,3,3,'path');rect(m,27,11,2,16,'path');rect(m,6,27,9,2,'path');rect(m,24,28,6,2,'path');rect(m,10,11,9,6,'paving');
 for(let y=0;y<32;y++)rect(m,20,y,3,1,'water');bridge(m,19,17,5,3);
 for(const b of liarsBuildings)house(m,b);
 rect(m,22,9,3,3,'water');object(m,'mill.wheel.0',23,9,2,2,[0,0,2,2]);const dial=object(m,'clock.plaque',8,7,1,1,null);dial.depth=11;
 fountain(m,14,12);object(m,'bench',10,15,2,1);object(m,'lamp',18,11,1,2);object(m,'sign',15,28,1,2);
 // Preserved masonry is the town's identity; the river no longer drives a mill.
 for(let x=19;x<25;x++)for(let y=3;y<6;y++)object(m,`cliff.${y-3}.${x===19?'left':x===24?'right':'center'}`,x,y,1,1,[0,0,1,1]);
 for(let y=3;y<6;y++)object(m,`waterfall.0.${y-3}`,21,y,1,1,null);deco(m,'waterfall.splash',21,6);
 rect(m,3,12,5,3,'soil');for(let y=12;y<15;y++)for(let x=3;x<8;x++)deco(m,`garden.${y%2?'lettuce':'seedling'}`,x,y);fence(m,2,15,7);
 rect(m,29,13,4,2,'soil');flowers(m,29,13,4,2);fence(m,25,15,8,3);
 for(const [x,y]of [[2,2],[14,4],[16,5],[30,2],[2,17],[10,19],[16,20],[31,17],[31,27],[2,28],[16,27],[24,20]])tree(m,x,y,(x+y)%2?'cypress':'broadleaf');
 flowers(m,15,23,3,2);flowers(m,9,26,2,1);object(m,'marker.north',18,17);object(m,'log.hollow',24,2,3,1);
 for(let y=9;y<30;y+=7){deco(m,'lilypad.1',21,y);deco(m,'reeds.1',19,y+1);}border(m,[],[[12,14]]);turf(m,[[6,16,5,3],[30,14,3,2],[17,24,3,3],[28,3,5,2],[5,28,3,2]]);return finish(m);
}
function yard(){const m=create(16,12,[8,9]);m.portals=[{x:8,y:3},{x:8,y:11}];rect(m,8,3,1,9,'path');house(m,{x:6,y:-2,w:5,rearDepth:0,name:'HOME',roof:'clay',wall:'plaster'});object(m,'log.hollow',2,6,3,1,[0,0,3,1]);deco(m,'leaves.litter',11,7);deco(m,'leaves.litter',12,7);object(m,'planter.center',11,3);tree(m,1,3);tree(m,13,3);flowers(m,3,9,3,1);flowers(m,10,9,3,1);for(let x=0;x<16;x++){if(x!==8)object(m,'fence.10',x,11);block(m,x,0);}for(let y=0;y<12;y++){block(m,0,y);block(m,15,y);}turf(m,[[3,4,3,2],[12,4,3,2],[4,9,3,1],[12,9,3,1]]);return finish(m);}
export const overworldMaps={town:rootport(),forest:forest(),liarsville:liarsville(),yard:yard()};

// Convert selected existing broadleaf trees without changing a single solid cell.
for(const fruit of FRUIT_TREES){
 const tree=overworldMaps[fruit.scene].objects.find(o=>o.kind==='tree'&&o.x===fruit.x&&o.y===fruit.y);
 if(!tree||tree.h!==2)throw Error(`Fruit tree footprint mismatch: ${fruit.id}`);
 tree.id=tree.sprite='tree.apple.bare';tree.fruitId=fruit.id;
}
