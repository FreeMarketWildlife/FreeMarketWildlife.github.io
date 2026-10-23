import {DOORS,availableCritters,critterHeight} from './critter-door.js?v=49';
import {PARTS,CRITTERS,STARTER,COMPACT_STARTER,PREVIOUS_STARTER,LEGACY_STARTER,STARTER_PARTS,STARTER_ANIMALS,SLOTS,part,critter,validateBuild} from './build-catalog.js?v=49';
import {VOUCHERS,validateShop} from './build-shop.js?v=49';
import {validateSpaceEscape} from './space-policy.js?v=49';
export const SAVE_KEY='treetop-custom-workshop-v1';
export function newProgress(){return{version:1,doorTier:0,doorUpgradeRound:-1,saveRevision:0,starterRevision:6,vouchers:[],shop:null,bells:0,points:0,best:0,launches:0,owned:[...STARTER_PARTS],animals:[...STARTER_ANIMALS],build:{...STARTER},blueprints:[],history:[],claimed:[],achievements:[],pendingSpace:null};}
export function canBuild(state,build,creative=false){validateBuild(build);if(creative)return true;if(build.wind!==0||build.drag!==1)throw Error('Adventure uses calm air with air resistance. Reset Creative atmosphere settings first.');for(const[slot]of SLOTS)if(!state.owned.includes(build[slot]))throw Error(`Buy ${part(build[slot]).name} first.`);if(!availableCritters(state).includes(build.animal))throw Error('Upgrade the tree door to let this critter through.');return true;}
export function buy(state,id,animal=false){if(animal)throw Error('Critters are not for sale. Upgrade the tree door.');const product=animal?critter(id):part(id),key=animal?'animals':'owned';if(state[key].includes(id))throw Error('Already owned.');if(state.bells<product.price)throw Error('More Bells needed.');return {...state,bells:state.bells-product.price,[key]:[...state[key],id]};}
const SPACE_ACHIEVEMENT='spaceEscape';
const validShotId=id=>{if(typeof id!=='string'||!id.length||id.length>120)throw Error('Invalid shot id.');return id;};
function achievementIds(raw){
 const ids=raw===undefined?[]:raw;if(!Array.isArray(ids)||ids.length>1||ids.some(id=>id!==SPACE_ACHIEVEMENT)||new Set(ids).size!==ids.length)throw Error('Invalid achievements.');return [...ids];
}
function withSpaceAchievement(ids){return ids.includes(SPACE_ACHIEVEMENT)?ids:[...ids,SPACE_ACHIEVEMENT];}
function minimalBuild(raw){if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(STARTER).some(key=>!Object.hasOwn(raw,key)))throw Error('Incomplete space build.');const c=validateBuild(raw);return Object.fromEntries(Object.keys(STARTER).map(key=>[key,c[key]]));}
function validatePendingSpace(raw,state){
 if(raw==null)return null;
 if(typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid pending space run.');
 const id=validShotId(raw.id),build=minimalBuild(raw.build),spaceEscape=validateSpaceEscape(raw.spaceEscape);
 if(build.animal!==spaceEscape.animal)throw Error('Space build critter does not match.');
 canBuild(state,build);return{id,build,spaceEscape};
}
/** The crossing record is the sole reward input; drift never raises its totals. */
export function pendingSpaceResult(packet){
 const spaceEscape=validateSpaceEscape(packet?.spaceEscape);
 return{distance:spaceEscape.distance,height:spaceEscape.height,release:{...spaceEscape.release},grams:spaceEscape.grams,animal:spaceEscape.animal,failure:spaceEscape.failure,spaceEscape};
}
/** Remember only an already completed escape, never arbitrary active physics. */
export function markSpaceEscape(state,{id,result,build,spaceEscape},creative=false){
 if(creative)return state;
 validShotId(id);if(state.claimed.includes(id))return state;
 if(result?.phase==='invalid')throw Error('An invalid run cannot escape.');
 const packet=validatePendingSpace({id,build,spaceEscape},state),data=pendingSpaceResult(packet);
 if(result){
  for(const key of ['distance','height','grams','animal','failure'])if(result[key]!==undefined&&result[key]!==data[key])throw Error('Space result does not match the crossing.');
  if(!result.release)throw Error('Space escape requires a released flight.');
 }
 if(state.pendingSpace){
  const existing=validatePendingSpace(state.pendingSpace,state);
  if(existing.id===id&&JSON.stringify(existing)===JSON.stringify(packet))return state;
  throw Error('Collect the pending space run before starting another.');
 }
 return{...state,achievements:withSpaceAchievement(achievementIds(state.achievements)),pendingSpace:packet};
}
function normalRewards({distance=0,height=0,release,grams=25,failure=''}){
 if(!Number.isFinite(distance)||distance<0||!Number.isFinite(height)||height<0||!Number.isFinite(grams)||grams<=0)throw Error('Invalid shot result.');
 const d=Math.min(distance,20000),massBonus=Math.min(20,Math.max(0,Math.log10(grams/25))*3);
 return{bells:Math.floor(8+Math.sqrt(d)*7+(release?massBonus:0)),points:Math.round(d*10+Math.min(height,10000)*2),distance:d,height,release:!!release,failure};
}
export function rewards(result){
 if(!result.spaceEscape||result.phase==='invalid')return normalRewards(result);
 const reward=normalRewards(pendingSpaceResult(result));
 return{...reward,bells:reward.bells*7,points:reward.points*7,multiplier:7,spaceEscape:true};
}
export function bank(state,shotId,result,creative=false){
 if(creative||state.claimed.includes(shotId))return state;
 validShotId(shotId);
 const matching=state.pendingSpace?.id===shotId,pending=matching?validatePendingSpace(state.pendingSpace,state):null,data=pending?pendingSpaceResult(pending):result;
 if(data.phase==='invalid')return state;
 const reward=rewards(data),bells=state.bells+reward.bells,points=state.points+reward.points,launches=state.launches+1;
 if(![bells,points,launches].every(Number.isSafeInteger))throw Error('Progress total exceeds the supported range.');
 const achievements=reward.spaceEscape?withSpaceAchievement(achievementIds(state.achievements)):achievementIds(state.achievements);
 const animal=reward.spaceEscape?data.spaceEscape.animal:data.animal??'mouse';critter(animal);
 return{...state,bells,points,best:Math.max(state.best,reward.distance),launches,achievements,pendingSpace:matching?null:state.pendingSpace??null,history:[{...reward,animal,id:shotId},...state.history].slice(0,12),claimed:[...state.claimed,shotId].slice(-100)};
}
export function validateProgress(raw){
 if(!raw||raw.version!==1)throw Error('Unsupported save.');
 const saveRevision=raw.saveRevision??0;if(!Number.isSafeInteger(saveRevision)||saveRevision<0)throw Error('Invalid save revision.');
 for(const k of ['bells','points','launches'])if(!Number.isSafeInteger(raw[k])||raw[k]<0)throw Error('Invalid progress totals.');
 if(!Number.isFinite(raw.best)||raw.best<0||raw.best>20000)throw Error('Invalid best distance.');
 if(!Array.isArray(raw.owned)||!Array.isArray(raw.animals)||!Array.isArray(raw.blueprints)||!Array.isArray(raw.claimed)||!Array.isArray(raw.history))throw Error('Invalid save collections.');
 if(raw.owned.length>PARTS.length||raw.animals.length>CRITTERS.length||raw.blueprints.length>20||raw.claimed.length>100||raw.history.length>12)throw Error('Oversized save.');
 raw.owned.forEach(part);raw.animals.forEach(critter);if(new Set(raw.owned).size!==raw.owned.length||new Set(raw.animals).size!==raw.animals.length)throw Error('Duplicate ownership entries.');
 for(const h of raw.history){critter(h.animal);for(const k of ['distance','height','bells','points'])if(!Number.isFinite(h[k])||h[k]<0)throw Error('Invalid launch history.');if(typeof h.failure!=='string'||h.failure.length>300)throw Error('Invalid launch notes.');}
 if(!raw.animals.includes('mouse'))throw Error('Starter critter missing.');
 for(const id of raw.claimed)if(typeof id!=='string'||id.length>120)throw Error('Invalid shot id.');
 const vouchers=raw.vouchers??[];
 if(!Array.isArray(vouchers)||vouchers.length>VOUCHERS.length||new Set(vouchers).size!==vouchers.length||vouchers.some(id=>!VOUCHERS.some(v=>v.id===id)))throw Error('Invalid shop upgrades.');
 // Grant the complete new kit once. Migrate only the untouched old recipe;
 // preserve custom geometry, earned Bells, critters, history and blueprints.
 const upgraded=!raw.starterRevision;
 const wheelRevision=!raw.starterRevision||raw.starterRevision<3;
 const compactRevision=!raw.starterRevision||raw.starterRevision<5;
 const untouchedTower=compactRevision&&Object.entries(PREVIOUS_STARTER).every(([key,value])=>['name','animal','winch'].includes(key)||raw.build?.[key]===value);
 const legacy=upgraded&&Object.entries(LEGACY_STARTER).every(([key,value])=>['name','animal'].includes(key)||raw.build?.[key]===value);
 const owned=upgraded?[...new Set([...raw.owned,...STARTER_PARTS])]:raw.owned;
 const untouchedCompact=(raw.starterRevision??0)<6&&Object.entries(COMPACT_STARTER).every(([key,value])=>['name','animal','winch'].includes(key)||raw.build?.[key]===value);
 const build=legacy||untouchedTower||untouchedCompact?{...STARTER,...((untouchedTower||untouchedCompact)?{winch:raw.build.winch}:{}),name:raw.build.name,animal:raw.build.animal}:raw.build;
 const animals=wheelRevision?[...new Set([...raw.animals,...STARTER_ANIMALS])]:raw.animals;
 const tier=raw.doorTier??Math.max(0,DOORS.findIndex(d=>d.height+1e-10>=Math.max(...raw.animals.map(id=>critterHeight(critter(id))))));
 if(!Number.isInteger(tier)||tier<0||tier>=DOORS.length)throw Error('Invalid door tier.');
 const doorUpgradeRound=raw.doorUpgradeRound??-1;
 if(!Number.isInteger(doorUpgradeRound)||doorUpgradeRound < -1||doorUpgradeRound>raw.launches)throw Error('Invalid door upgrade round.');
 const s={...raw,doorTier:tier,doorUpgradeRound,saveRevision,starterRevision:6,owned,animals,vouchers,shop:validateShop(raw.shop,raw.launches),build:validateBuild(build),blueprints:raw.blueprints.map(validateBuild),achievements:achievementIds(raw.achievements),pendingSpace:null};s.animals=availableCritters(s);canBuild(s,s.build);
 const pending=validatePendingSpace(raw.pendingSpace,s);if(pending){s.achievements=withSpaceAchievement(s.achievements);if(!s.claimed.includes(pending.id))s.pendingSpace=pending;}return s;
}
export class StaleProgressError extends Error{
 constructor(){super('Saved progress changed in another tab. Reload before saving to keep your purchases, rewards and achievements.');this.name='StaleProgressError';}
}
function protectSavedSpace(previous,next){
 if(!previous.pendingSpace&&!previous.achievements.includes(SPACE_ACHIEVEMENT))return;
 const stale=()=>{throw new StaleProgressError();};
 if(!next.achievements.includes(SPACE_ACHIEVEMENT))stale();
 const waiting=previous.pendingSpace?.id;
 if(waiting&&next.pendingSpace?.id!==waiting&&!next.claimed.includes(waiting))stale();
 if(next.pendingSpace&&previous.claimed.includes(next.pendingSpace.id))stale();
 // Once a space completion is durable, an older collector must not roll back
 // its claim or later earnings. Permit only the existing 100-ID window eviction
 // justified by this caller's additional completed launches; never merge money.
 const advances=next.launches-previous.launches;if(advances<0)stale();
 const retained=previous.claimed.slice(Math.max(0,previous.claimed.length+advances-100));
 if(retained.some(id=>!next.claimed.includes(id)))stale();
}
/** Optimistic stale-tab guard. The synchronous read/write is not a cross-process
 * atomic compare-and-swap; all writers would need a shared asynchronous lock
 * for that stronger guarantee. Explicit validated imports can replace normal
 * progress, but never bypass the existing space reward/achievement protections. */
export function saveProgress(storage,state,{replace=false}={}){
 const next=validateProgress(state),raw=storage.getItem(SAVE_KEY);
 const previous=raw===null||raw===undefined?null:validateProgress(JSON.parse(raw));
 if(previous){
  protectSavedSpace(previous,next);
  if(!replace&&next.saveRevision!==previous.saveRevision)throw new StaleProgressError();
  if(JSON.stringify(previous)===JSON.stringify(next))return next;
 }
 const revision=(previous?.saveRevision??next.saveRevision)+1;
 if(!Number.isSafeInteger(revision))throw Error('Save revision exceeds the supported range.');
 next.saveRevision=revision;
 storage.setItem(SAVE_KEY,JSON.stringify(next));
 // Only acknowledge the durable revision after a successful write. Immutable
 // domain reducers retain it through their ordinary object spreads.
 state.saveRevision=revision;return next;
}
export function loadProgress(storage){const data=storage.getItem(SAVE_KEY);return data?validateProgress(JSON.parse(data)):newProgress();}
