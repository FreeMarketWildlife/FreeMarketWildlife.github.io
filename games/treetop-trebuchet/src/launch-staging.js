/** Launch-clearing layout, in world metres. The door stays on the tree;
 * equipment is placed beside it without rescaling any part or critter. */
export function loadingStand(c,animal,originX=0){
 return{x:originX-Math.max(c.longArm*.92,c.baseWidth*.9),y:Math.max(.1,c.pivotHeight*.16),width:Math.max(animal.length*1.35,c.pouchWidth*1.25),height:Math.max(.08,c.pivotHeight*.1)};
}
export function launchFootprint(c,animal){
 const stand=loadingStand(c,animal),wheel=c.chassis==='wheels'?c.wheelRadius:0;
 return{minX:Math.min(-c.longArm-c.pouchWidth*.15,-c.troughLength*.75,stand.x-stand.width/2,-c.baseWidth/2-wheel),maxX:Math.max(c.baseWidth/2+wheel,c.troughLength*.25,c.shortArm+c.pouchWidth*.5)};
}
export function rigOriginForDoor(c,animal,door){
 if(!door)return 0;
 const footprint=launchFootprint(c,animal);if(footprint.maxX-footprint.minX>2.5)return 0;
 const left=footprint.minX,gap=Math.max(.12,Math.min(.3,door.height*1.6));
 // Large machines already occupy the clearing. Preserve their tested launch
 // corridor; compact machines move left until their stand is near the door.
 return Math.min(0,door.x+door.width/2+gap-left);
}
