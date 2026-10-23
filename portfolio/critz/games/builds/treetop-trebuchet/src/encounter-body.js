import {mushroomGeometry} from './mushroom-geometry.js?v=49';
import * as P from '../vendor/planck/planck.mjs';
/** Dynamic passive contacts only. Bounding radius encloses every rotated fixture. */
export function createEncounterBody(world,e){
 const body=world.createDynamicBody({position:P.Vec2(e.x,e.y),linearVelocity:P.Vec2(e.vx,e.vy),bullet:true});
 body.setUserData({role:'enemy',id:e.id,color:e.color,kind:e.kind,interaction:e.interaction,biome:e.biome,shape:e.shape,radius:e.radius,expiresAt:e.expiresAt,spawnTime:e.spawnTime??0});
 if(e.geometry==='dome'){const g=mushroomGeometry(e.radius);body.setUserData({...body.getUserData(),geometry:'dome',capCenter:g.capCenter});for(const [part,vertices]of [['cap',g.cap],['stem',g.stem]]){const f=body.createFixture(P.Polygon(vertices.map(p=>P.Vec2(p.x,p.y))),{density:e.mass/g.area,friction:e.material.friction,restitution:part==='cap'?e.material.restitution:.2,filterCategoryBits:32,filterMaskBits:5});f.setUserData({part});}return body;}
 const fixtures=e.shape==='skid'?(()=>{const h=e.radius*.22,l=e.radius*.78;return [P.Box(l,h),P.Circle(P.Vec2(-l,0),h),P.Circle(P.Vec2(l,0),h)];})():[P.Circle(e.radius)];
 const area=e.shape==='skid'?4*(e.radius*.78)*(e.radius*.22)+2*Math.PI*(e.radius*.22)**2:Math.PI*e.radius**2;
 for(const shape of fixtures)body.createFixture(shape,{density:e.mass/area,friction:e.material.friction,restitution:e.material.restitution,filterCategoryBits:32,filterMaskBits:5});
 return body;
}
