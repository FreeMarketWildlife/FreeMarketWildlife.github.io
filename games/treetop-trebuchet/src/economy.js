// Explicit prototype balancing, not established story canon. Points and bells
// are calculated independently; there is deliberately no points-to-bells exchange.
export const PROTOTYPE_BALANCE = Object.freeze({pointsPerMetre:10,pointsPerImpact:25,bellsPerLaunch:5,bellsPerImpact:2,maxRewardImpacts:50,maxRewardDistance:10000});
const freeze = value => { for(const v of Object.values(value)) if(v&&typeof v==='object')freeze(v);return Object.freeze(value); };
export const catalog=freeze([
 {id:'counterweight-heavy',label:'Heavier counterweight',slot:'counterweight',price:30,effects:{counterMass:180}},
 {id:'beam-long',label:'Longer beam',slot:'beam',price:45,effects:{longArm:3.6,shortArm:.9,beamLinearDensity:2.2}},
 {id:'beam-light',label:'Lighter beam',slot:'beam',price:55,effects:{longArm:3,shortArm:.8,beamLinearDensity:1.6}},
 {id:'sling-long',label:'Longer sling',slot:'sling',price:35,effects:{sling:2.9}},
 {id:'frame-heavy',label:'Heavier frame',slot:'frame',price:40,effects:{frameMass:50,frameFriction:.65}},
 {id:'frame-grip',label:'Grippier feet',slot:'frame',price:40,effects:{frameMass:30,frameFriction:.85}}
]);
export function createEconomyState(){return {version:1,points:0,bells:0,owned:[],equipped:{},completedShots:[]};}
const itemFor=id=>{const item=catalog.find(i=>i.id===id);if(!item)throw new RangeError('Unknown equipment');return item;};
function nonnegative(value,name){if(!Number.isFinite(value)||value<0)throw new RangeError(`Invalid ${name}`);return value;}
export function shotReward({distance,impacts}){
 const d=Math.min(nonnegative(distance,'distance'),PROTOTYPE_BALANCE.maxRewardDistance);
 const n=Math.min(nonnegative(impacts,'impacts'),PROTOTYPE_BALANCE.maxRewardImpacts);
 if(!Number.isInteger(impacts))throw new RangeError('Impacts must be an integer');
 return {points:Math.floor(d*PROTOTYPE_BALANCE.pointsPerMetre+n*PROTOTYPE_BALANCE.pointsPerImpact),bells:PROTOTYPE_BALANCE.bellsPerLaunch+n*PROTOTYPE_BALANCE.bellsPerImpact};
}
// Invalid transactions fail without changing their input state.
export function economyReducer(state,action){
 validateState(state);
 switch(action.type){
 case 'purchase':{const item=itemFor(action.id);if(state.owned.includes(item.id))throw new Error('Already owned');if(state.bells<item.price)throw new Error('Insufficient bells');return {...state,bells:state.bells-item.price,owned:[...state.owned,item.id]};}
 case 'equip':{const item=itemFor(action.id);if(!state.owned.includes(item.id))throw new Error('Equipment not owned');return {...state,equipped:{...state.equipped,[item.slot]:item.id}};}
 case 'unequip':{if(!catalog.some(i=>i.slot===action.slot))throw new RangeError('Unknown slot');const equipped={...state.equipped};delete equipped[action.slot];return {...state,equipped};}
 case 'record-shot':{if(typeof action.shotId!=='string'||!action.shotId.trim()||action.shotId.length>200)throw new RangeError('Shot ID required');if(state.completedShots.includes(action.shotId))return state;const reward=shotReward(action);return validateState({...state,points:state.points+reward.points,bells:state.bells+reward.bells,completedShots:[...state.completedShots,action.shotId]});}
 default:throw new RangeError('Unknown economy action');
 }
}
export function derivePhysicalConfig(state,base={}){validateState(state);const result={...base};for(const id of Object.values(state.equipped))Object.assign(result,itemFor(id).effects);return result;}
export function validateState(s){
 if(!s||s.version!==1||!Number.isSafeInteger(s.points)||s.points<0||!Number.isSafeInteger(s.bells)||s.bells<0||!Array.isArray(s.owned)||!Array.isArray(s.completedShots)||!s.equipped||typeof s.equipped!=='object'||Array.isArray(s.equipped))throw new RangeError('Invalid economy save');
 if(new Set(s.owned).size!==s.owned.length||new Set(s.completedShots).size!==s.completedShots.length||s.completedShots.some(id=>typeof id!=='string'||!id.trim()||id.length>200))throw new RangeError('Invalid save IDs');
 s.owned.forEach(itemFor);for(const [slot,id]of Object.entries(s.equipped)){if(itemFor(id).slot!==slot||!s.owned.includes(id))throw new RangeError('Invalid equipped item');}return s;
}
// Caller explicitly supplies storage (e.g. localStorage) and opts in. No global
// storage reads or writes, network calls, or automatic persistence.
export function createEconomyPersistence(storage,{enabled=false,key='critz-prototype-economy-v1'}={}){
 return {save(state){if(!enabled)return false;validateState(state);storage.setItem(key,JSON.stringify(state));return true;},load(){if(!enabled)return null;const raw=storage.getItem(key);if(raw===null)return null;return validateState(JSON.parse(raw));},clear(){if(enabled)storage.removeItem(key);}};
}
