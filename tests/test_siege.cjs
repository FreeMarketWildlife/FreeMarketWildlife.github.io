// Exercise the real controller with a minimal canvas/DOM; no browser dependencies.
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=readFileSync('assets/js/scene.js','utf8').replace(/^import .*\n/,'').replace('  spawn(1);spawn(-1);resize();resume();',`  spawn(1);spawn(-1);resize();resume();
  globalThis.test={update,spawn,hurtCastle,draw,state:()=>({castleHP,engineHP,soldiers,shots,width,pixel,time}),clear:()=>{soldiers=[];shots=[];},hit:canvas.listeners.pointerdown,move:canvas.listeners.pointermove,leave:canvas.listeners.pointerleave,hoveredHealth};`);
function load(random=.5){
 const ctx=new Proxy({}, {get:()=>()=>{}});
 const canvas={getContext:()=>ctx,style:{},listeners:{},addEventListener:(name,fn)=>canvas.listeners[name]=fn,getBoundingClientRect:()=>({left:0,top:0})};
 const stage={querySelector:()=>canvas,dataset:{}};
 const math=Object.create(Math);math.random=()=>random;
 const sandbox={addEventListener:()=>{},Math:math,document:{body:{},querySelector:selector=>selector==='[data-pixel-scene]'?stage:null,addEventListener:()=>{}},matchMedia:()=>({matches:false,addEventListener:()=>{}}),getComputedStyle:()=>({getPropertyValue:()=>3}),innerWidth:1440,innerHeight:800,ResizeObserver:class{observe(){}},requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}};
 vm.runInNewContext(source,sandbox);return sandbox.test;
}
let battle=load();let state=battle.state();
assert.equal(state.pixel,.75);assert.equal(state.width,729);
battle.hit({clientX:(state.width-40)*.75,clientY:40*.75});assert.equal(battle.state().castleHP,565);
battle.hit({clientX:37*.75,clientY:65*.75});assert.equal(battle.state().engineHP,95);
assert.equal(battle.hoveredHealth(),null);
battle.move({clientX:(state.width-40)*.75,clientY:40*.75});
assert.equal(battle.hoveredHealth().hp,565);assert.equal(battle.hoveredHealth().max,600);
battle.move({clientX:0,clientY:65*.75});assert.equal(battle.hoveredHealth().hp,95);
const unit=battle.state().soldiers[1];unit.hp=10;
battle.move({clientX:unit.x*.75,clientY:(90-unit.lane-5)*.75});assert.equal(battle.hoveredHealth().hp,10);assert.equal(battle.hoveredHealth().max,25);
battle.leave();assert.equal(battle.hoveredHealth(),null);
battle.hurtCastle(10000);battle.clear();
for(let i=0;i<2400;i++)battle.update(.05);
assert.equal(battle.state().castleHP,0,'castle must remain rubble past old 90-second reset');
assert(!battle.state().soldiers.some(s=>s.side===-1),'destroyed castle must not spawn defenders');
assert(battle.state().soldiers.length<20,'spawns stay sparse');
battle.draw();
const rare=load(.005).state().soldiers;
assert.equal(rare[0].kind,'giant');assert.equal(rare[1].kind,'horse');assert.equal(rare[1].power,45);
assert.equal(load().state().castleHP,600,'new page starts intact');
console.log('PASS: quarter scale, long field, click damage, persistent destruction, slow spawns, rare units, reload reset.');
