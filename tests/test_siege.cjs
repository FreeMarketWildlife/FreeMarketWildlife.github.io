// Exercise the real controller with a minimal canvas/DOM; no browser dependencies.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync('assets/js/scene.js','utf8').replace(/^import .*\n/,'').replace('  resize();resume();',`  resize();resume();
  globalThis.test={update,spawn,hurtCastle,draw,state:()=>({castleHP,engineHP,construction,deliveredWood,charges,craters,blasts,soldiers,shots,width,pixel,time,victory,wallArchers}),clear:()=>{soldiers=[];shots=[];},craterDepth,unitGround,roadEnd,hit:canvas.listeners.pointerdown,move:canvas.listeners.pointermove,leave:canvas.listeners.pointerleave,hoveredHealth};`);
function load(random=.5){
 const ctx=new Proxy({}, {get:()=>()=>{}});
 const canvas={getContext:()=>ctx,style:{},listeners:{},addEventListener:(name,fn)=>canvas.listeners[name]=fn,getBoundingClientRect:()=>({left:0,top:0})};
 const stage={querySelector:()=>canvas,dataset:{}};
 const math=Object.create(Math);math.random=()=>random;
 const sandbox={addEventListener:()=>{},Math:math,document:{body:{},querySelector:selector=>selector==='[data-pixel-scene]'?stage:null,addEventListener:()=>{}},matchMedia:()=>({matches:false,addEventListener:()=>{}}),getComputedStyle:()=>({getPropertyValue:()=>3}),innerWidth:1440,innerHeight:800,ResizeObserver:class{observe(){}},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}};
 vm.runInNewContext(source,sandbox);return sandbox.test;
}
function advance(battle,seconds){for(let i=0;i<Math.ceil(seconds/.05);i++)battle.update(.05);}
let battle=load();let state=battle.state();
assert.equal(state.pixel,.75);assert.equal(state.width,883);
assert.equal(state.soldiers.length,0,'battlefield starts empty');
assert.equal(state.construction,0,'no prebuilt trebuchet');
battle.move({clientX:48*.75,clientY:65*.75});assert.equal(battle.hoveredHealth(),null);
battle.hit({clientX:48*.75,clientY:65*.75});assert.equal(battle.state().engineHP,120,'unbuilt engine cannot be hit');
advance(battle,3);assert.equal(battle.state().soldiers.length,0);
battle.spawn(1);const builder=battle.state().soldiers[0];builder.x=48;
battle.update(.05);assert(builder.building);assert(battle.state().construction>0);
const partial=battle.state().construction;builder.dead=2;advance(battle,.5);
assert.equal(battle.state().construction,partial,'construction stops without a living builder');
battle.clear();for(let i=0;i<6;i++){battle.spawn(1);battle.state().soldiers.at(-1).x=48;}
advance(battle,4);assert.equal(battle.state().construction,1,'present builders finish the engine');
battle.hit({clientX:(state.width-40)*.75,clientY:40*.75});assert.equal(battle.state().castleHP,565);
battle.hit({clientX:48*.75,clientY:65*.75});assert.equal(battle.state().engineHP,95);
battle.leave();assert.equal(battle.hoveredHealth(),null);
battle.move({clientX:(state.width-40)*.75,clientY:40*.75});
assert.equal(battle.hoveredHealth().hp,565);assert.equal(battle.hoveredHealth().max,600);
battle.move({clientX:48*.75,clientY:65*.75});assert.equal(battle.hoveredHealth().hp,95);
battle.spawn(-1);const unit=battle.state().soldiers.at(-1);unit.hp=10;
battle.move({clientX:unit.x*.75,clientY:(90-unit.lane-5)*.75});assert.equal(battle.hoveredHealth().hp,10);assert.equal(battle.hoveredHealth().max,25);
battle.leave();assert.equal(battle.hoveredHealth(),null);
battle.hurtCastle(10000);battle.clear();advance(battle,120);
assert.equal(battle.state().castleHP,0,'castle must remain rubble past old 90-second reset');
assert(!battle.state().soldiers.some(s=>s.side===-1),'destroyed castle must not spawn defenders');
assert(battle.state().soldiers.length<20,'spawns stay sparse');battle.draw();
const rareBattle=load(.005);rareBattle.spawn(1);rareBattle.spawn(-1);const rare=rareBattle.state().soldiers;
assert.equal(rare[0].kind,'giant');assert.equal(rare[1].kind,'horse');assert.equal(rare[1].power,45);
assert.equal(load().state().castleHP,600,'new page starts intact');
const unattended=load();for(let i=0;i<600;i++){unattended.update(.05);unattended.clear();}
assert.equal(unattended.state().construction,0,'time alone cannot build the trebuchet');
assert.equal(unattended.state().castleHP,600,'an unbuilt trebuchet never fires');
const ending=load();ending.spawn(1);ending.hurtCastle(10000);
const victor=ending.state().soldiers[0];victor.x=ending.state().width-72;
ending.update(.05);assert.equal(ending.state().victory,true);assert.equal(victor.celebrating,true);
const count=ending.state().soldiers.length;advance(ending,50);
assert.equal(ending.state().soldiers.length,count,'no more attackers spawn after reaching rubble');
assert.equal(victor.celebrating,true);ending.draw();
const archery=load();advance(archery,18);archery.clear();archery.spawn(1);
const invader=archery.state().soldiers[0];invader.x=archery.state().width-180;
advance(archery,2.6);assert.equal(archery.state().shots.filter(s=>s.arrow).length,3,'all wall archers fire');
advance(archery,1.6);assert(invader.hp<25,'arrows damage the approaching enemy');
// One delivery cannot finish the whole machine; the worker must fetch more wood.
const supply=load();supply.spawn(1);const carrier=supply.state().soldiers[0];
assert.equal(carrier.carryingWood,true);carrier.x=48;advance(supply,5);
assert.equal(supply.state().deliveredWood,1);assert(supply.state().construction<=1/6);
assert(carrier.fetchingWood);assert(!supply.state().shots.some(shot=>shot.stone));
advance(supply,5);assert(carrier.carryingWood,'builder returns carrying another plank');
function builtBattle(){const b=load();for(let i=0;i<6;i++){b.spawn(1);b.state().soldiers.at(-1).x=48;}advance(b,4);assert.equal(b.state().construction,1);b.clear();return b;}
const bombing=builtBattle();let sapper;
for(let i=0;i<4&&!sapper;i++){bombing.spawn(1);const unit=bombing.state().soldiers.at(-1);if(unit.role==='sapper')sapper=unit;}
assert(sapper);sapper.x=sapper.chargeSite;
advance(bombing,2.6);assert.equal(bombing.state().charges.length,1);assert(sapper.chargeUsed);
advance(bombing,4.1);assert.equal(bombing.state().charges.length,0);assert.equal(bombing.state().craters.length,1);
assert(bombing.craterDepth(sapper.chargeSite)>0,'blast actually deforms the floor');
assert.equal(bombing.roadEnd(),bombing.state().width-4,'road stops at the castle-side cliff');bombing.draw();
const targeting=builtBattle();targeting.spawn(-1);const near=targeting.state().soldiers.at(-1);near.x=targeting.state().width-144;
targeting.spawn(-1);targeting.state().soldiers.at(-1).x=targeting.state().width-300;
advance(targeting,12);const stone=targeting.state().shots.find(shot=>shot.stone);
assert(stone);assert.equal(stone.target,near,'defenders in front of the castle take priority');
advance(targeting,3.6);assert(near.dead||near.hp<=0);assert.equal(targeting.state().castleHP,600,'targeted stone damages defender, not castle');
targeting.clear();advance(targeting,12);assert(targeting.state().castleHP<600,'without defenders the trebuchet returns to the castle');
console.log('PASS: empty start, attacker construction, health, permanent rubble, rare units, archery, victory, reset, quarter scale, wood deliveries, sapper craters, and defender targeting.');
