import {stepBodies,shipPose,forceField} from '../assets/js/business-scene.js';
import assert from 'node:assert/strict';
const bodies=[{x:100,y:100,r:30,vx:30,vy:0},{x:159,y:100,r:30,vx:-30,vy:0}];
assert.ok(stepBodies(bodies,400,300,.01)>0);
assert.ok(bodies[0].vx<0&&bodies[1].vx>0);
assert.ok(bodies[1].x-bodies[0].x>=65-.001);
const edge={x:31,y:70,r:30,vx:-50,vy:0};stepBodies([edge],400,300,.1);assert.ok(edge.x>=30&&edge.vx>0);
const field=forceField(800,600),rock={x:field.x+field.r+29,y:field.y,r:30,vx:-50,vy:0};
stepBodies([rock],800,600,.02,field);assert.ok(rock.x>=field.x+field.r+34);assert.equal(rock.vx,50);
const right=shipPose(800,600,{x:700,y:300});assert.equal(right.x,400);assert.equal(right.y,300);assert.equal(right.angle,0);assert.equal(right.muzzle.x,424);
// Thousands of contacts preserve separation, the central field, and kinetic energy.
const rocks=Array.from({length:6},(_,i)=>({x:100+i*110,y:100,r:30,vx:40-i*11,vy:30+i*4}));
const energy=()=>rocks.reduce((n,b)=>n+b.vx*b.vx+b.vy*b.vy,0),initial=energy();
for(let i=0;i<10000;i++){
 stepBodies(rocks,800,600,.016,field);
 for(const a of rocks){assert.ok(a.x>=a.r-.01&&a.x<=800-a.r+.01&&a.y>=a.r-.01&&a.y<=600-a.r+.01);assert.ok(Math.hypot(a.x-field.x,a.y-field.y)>=a.r+field.r+4-.01);}
 for(let a=0;a<rocks.length;a++)for(let b=a+1;b<rocks.length;b++)assert.ok(Math.hypot(rocks[a].x-rocks[b].x,rocks[a].y-rocks[b].y)>=65-.01);
}
assert.ok(Math.abs(energy()-initial)<.001);
console.log('PASS: elastic collisions, walls, center force field, ship aim, and 10000 simulation steps without overlap or energy loss.');
