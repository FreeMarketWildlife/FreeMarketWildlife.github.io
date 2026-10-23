// Original Critz orchard rules. Time uses the saved habitat clock, not wall time.
export const FRUIT_TREES = [
  {id:'apple-yard',scene:'yard',x:13,y:3},
  {id:'apple-rootport',scene:'town',x:10,y:3},
  {id:'apple-mossway',scene:'forest',x:3,y:26},
  {id:'apple-liarsville',scene:'liarsville',x:16,y:20},
];
export const APPLES_PER_TREE = 3, FRUIT_REGROW_HOURS = 24;
export const APPLE_POSITIONS = [[18,23],[43,26],[30,40]];
const cues=new WeakMap();
export const fruitCells = tree => [[tree.x,tree.y+1],[tree.x+1,tree.y+1]];
export function fruitStatus(state,id){
 const tree=FRUIT_TREES.find(t=>t.id===id);if(!tree)return {ripe:false,remaining:0};
 const last=state.fruitHarvests?.[id],remaining=last===undefined?0:Math.max(0,last+FRUIT_REGROW_HOURS-state.time);
 return {ripe:remaining===0,remaining};
}
export function harvestFruit(state,id){
 const tree=FRUIT_TREES.find(t=>t.id===id);
 if(!tree||state.stage!=='morning'||tree.scene!==state.scene||!fruitCells(tree).some(([x,y])=>Math.abs(x-state.player.x)+Math.abs(y-state.player.y)===1))return {ok:false,reason:'distance'};
 const status=fruitStatus(state,id);if(!status.ripe)return {ok:false,reason:'growing',remaining:status.remaining};
 const apples=state.inventory.apples??0;if(apples>10000-APPLES_PER_TREE)return {ok:false,reason:'full'};
 state.inventory.apples=apples+APPLES_PER_TREE;
 (state.fruitHarvests??={})[id]=state.time;
 return {ok:true,count:APPLES_PER_TREE};
}
export function cueFruitShake(state,id,time,harvested,calm=false){
 let map=cues.get(state);if(!map){map=new Map();cues.set(state,map);}map.set(id,{time,harvested,calm,scene:state.scene});
}
export function fruitTreeView(state,id,time){
 const cue=cues.get(state)?.get(id),age=cue&&cue.scene===state.scene?Math.max(0,time-cue.time):Infinity;
 const active=age<1.05,calm=cue?.calm;
 const shake=active&&!calm&&age<.42?[0,-2,2,-2,1,0][Math.min(5,Math.floor(age/.07))]:0;
 const falling=active&&cue.harvested&&!calm;
 return {ripe:fruitStatus(state,id).ripe,active,shake,falling,age,calm:!!calm};
}
export function validFruitSave(state){
 const n=state.inventory?.apples;if(n!==undefined&&(!Number.isInteger(n)||n<0||n>10000))return false;
 const h=state.fruitHarvests;if(h===undefined)return true;
 return !!h&&typeof h==='object'&&!Array.isArray(h)&&Object.entries(h).every(([id,t])=>FRUIT_TREES.some(tree=>tree.id===id)&&Number.isFinite(t)&&t>=0&&t<=state.time);
}
