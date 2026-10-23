// Fence rails occupy an edge; their row remains walkable behind the artwork.
// N/E/S/W mask bits match the shared autotiling catalogue. Isolated posts use
// the horizontal rail rule; junctions carry both edges.
export function fenceAxes(mask=0){return {horizontal:!!(mask&10)||!(mask&5),vertical:!!(mask&5)};}
export function crossesFence(from,to,maskAt){
 const dx=to.x-from.x,dy=to.y-from.y;
 if(Math.abs(dx)+Math.abs(dy)!==1)return true;
 if(dy){const mask=maskAt(from.x,Math.min(from.y,to.y));return mask!==null&&fenceAxes(mask).horizontal;}
 const mask=maskAt(Math.min(from.x,to.x),from.y);return mask!==null&&fenceAxes(mask).vertical;
}
