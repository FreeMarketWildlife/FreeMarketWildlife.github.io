import {surface} from './water-surfaces.js';

export const isWater = kind => kind === 'water' || kind?.startsWith('water-');
export const waterSurface = kind => kind === 'water'
  ? {identity: 'fresh', type: 'moving'}
  : {identity: kind.split('-')[1], type: kind.split('-').slice(2).join('-')};
const neighbors = [[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]];
const index = (map,x,y) => x >= 0 && y >= 0 && x < map.w && y < map.h ? y * map.w + x : -1;
export function mapWaterSurface(map,x,y) {
  const i = index(map,x,y), kind = map.terrain[i];
  if (i < 0 || map.raw?.[i] || !isWater(kind)) return null;
  const s = waterSurface(kind);
  return surface(s.type,s.identity);
}

// Bounds are checked before indexing, so east/west neighbors never wrap rows.
export function shoreGrounds(map,x,y) {
  return neighbors.flatMap(([dx,dy]) => {
    const xx=x+dx, yy=y+dy, i=index(map,xx,yy), kind=map.terrain[i];
    if (i < 0 || isWater(kind) && !map.raw?.[i]) return [];
    return [{x:xx,y:yy,kind:isWater(kind)?'grass':kind}];
  });
}
export function nearestShoreGround(grounds,px,py) {
  let kind='grass', distance=Infinity;
  for (const a of grounds) {
    const dx=Math.max(a.x*32-px,0,px-(a.x+1)*32);
    const dy=Math.max(a.y*32-py,0,py-(a.y+1)*32);
    const d=dx*dx+dy*dy;
    if (d < distance) { kind=a.kind; distance=d; }
  }
  return kind;
}
export function waterUnderlay(map,x,y) {
  const grounds=shoreGrounds(map,x,y);
  return [[8,8],[24,8],[8,24],[24,24]].map(([dx,dy]) => nearestShoreGround(grounds,x*32+dx,y*32+dy));
}

// Match the canonical layout validator's eight-neighbor water bodies. A shallow
// puddle cannot change the depth contour of a disconnected deep-only lake.
export function waterComponents(map) {
  const cells=[], byCell=new Map();
  for (let y=0;y<map.h;y++) for (let x=0;x<map.w;x++) {
    const s=mapWaterSurface(map,x,y);
    if (s) { const a={x,y,surface:s,grounds:shoreGrounds(map,x,y)}; cells.push(a); byCell.set(`${x},${y}`,a); }
  }
  const seen=new Set(), components=[];
  for (const first of cells) {
    if (seen.has(first)) continue;
    const body=[], queue=[first]; seen.add(first);
    for (let n=0;n<queue.length;n++) {
      const a=queue[n]; body.push(a);
      for (const [dx,dy] of neighbors) {
        const b=byCell.get(`${a.x+dx},${a.y+dy}`);
        if (b && !seen.has(b)) { seen.add(b); queue.push(b); }
      }
    }
    body.sort((a,b)=>a.y-b.y||a.x-b.x);
    const minX=Math.min(...body.map(a=>a.x)), minY=Math.min(...body.map(a=>a.y));
    const maxX=Math.max(...body.map(a=>a.x)), maxY=Math.max(...body.map(a=>a.y));
    // One-cell padding contains all four radius-six morphology passes. The
    // extra southern row also retains the approved sixteen-pixel registration.
    const x=Math.max(0,minX-1)*32, y=Math.max(0,minY-1)*32;
    const right=Math.min(map.w,maxX+2)*32, bottom=Math.min(map.h+1,maxY+3)*32;
    const bounds={x,y,w:right-x,h:bottom-y};
    const key=JSON.stringify([bounds,body.map(a=>[a.x,a.y,a.surface.identity,a.surface.type,a.grounds])]);
    components.push({cells:body,bounds,key,mixed:body.some(a=>a.surface.shallow)&&body.some(a=>!a.surface.shallow)});
  }
  return {cells,byCell,components};
}
