// Exercise the real controller with a minimal canvas/DOM; no browser dependencies.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync('assets/js/scene.js','utf8').replace(/^import .*\n/,'').replace('  resize();resume();',`  resize();resume();
  globalThis.test={update,spawn,hurtCastle,draw,state:()=>({castleHP,engineHP,construction,soldiers,shots,width,pixel,time,victory,wallArchers}),clear:()=>{soldiers=[];shots=[];},hit:canvas.listeners.pointerdown,move:canvas.listeners.pointermove,leave:canvas.listeners.pointerleave,hoveredHealth};`);
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
battle.clear();battle.spawn(1);battle.state().soldiers[0].x=48;
advance(battle,12.1);assert.equal(battle.state().construction,1,'present builders finish the engine');
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
console.log('PASS: empty start, attacker construction, health, permanent rubble, rare units, archery, victory, reset, and quarter scale.');
