import {purchaseFit} from './build-equipment.js?v=71';
import {PARTS, CRITTERS, STARTER_PARTS, part, critter, shopPart} from './build-catalog.js?v=71';

export const VOUCHERS = [
  {id:'luckyPenny',name:'Lucky penny',price:80,description:'Rerolls start at 3 Bells instead of 5. A little luck goes a long way.',slot:'voucher'},
  {id:'extraShelf',name:'One more shelf',price:120,description:'A wider choice of affordable finds within each three-card deal.',slot:'voucher'},
  {id:'friendDiscount',name:'Friends of the grove',price:180,description:'10% off equipment and packs. Forever.',slot:'voucher'},
];
const owned = (s,p) => (p.kind==='animal'?s.animals:p.kind==='voucher'?s.vouchers:s.owned).includes(p.id);
export const product = offer => offer.kind==='animal'?critter(offer.id):offer.kind==='voucher'?VOUCHERS.find(v=>v.id===offer.id):part(offer.id);
export function priceFor(state, offer) {
  const p=product(offer);
  if(!p)throw Error('Unknown shop card.');
  const discount=offer.kind!=='voucher'&&state.vouchers?.includes('friendDiscount') ? .9 : 1;
  return Math.max(1,Math.floor(p.price*discount));
}
export const rerollPrice = s => (s.vouchers.includes('luckyPenny')?3:5)+s.shop.rerolls;
function rng(seed) {
  let n=seed>>>0;
  return {next(){n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;},seed(){return n;}};
}
function draw(s,random,kind,count,exclude=[]) {
  const catalog=kind==='animal'?CRITTERS:PARTS;
  const pool=catalog.filter(p=>p.price>0&&(kind==='animal'||shopPart(p))&&!owned(s,{...p,kind})&&!exclude.includes(p.id));
  const earned=s.bells+PARTS.filter(p=>s.owned.includes(p.id)&&!STARTER_PARTS.includes(p.id)).reduce((a,p)=>a+p.price,0);
  const budget=Math.max(65,earned*.65);
  const out=[];
  while(pool.length&&out.length<count){
    // Every unowned part remains possible; nearby upgrades are much more common.
    const weights=pool.map(p=>1/(1+(p.price/budget)**2)),total=weights.reduce((a,b)=>a+b,0);
    let roll=random.next()*total,index=0;
    while(index<pool.length-1&&(roll-=weights[index])>0)index++;
    out.push({kind,id:pool.splice(index,1)[0].id});
  }
  return out;
}
/** Three stable equipment slots. Compatibility is checked against the actual
 * current geometry/cargo, not a tier label. One affordable find is reserved
 * when available, then different equipment slots are preferred. Previous stock
 * is avoided on reroll when enough alternatives exist. LCG state is persisted. */
export function compatibleStock(s){return PARTS.filter(p=>p.price>0&&shopPart(p)&&!s.owned.includes(p.id)&&purchaseFit(s.build,{kind:'part',id:p.id}).fitted);}
function deal(s,random,previous=[],exclude=[]){
 const all=compatibleStock(s).filter(p=>!exclude.includes(p.id)),fresh=all.filter(p=>!previous.some(o=>o.id===p.id));
 const pool=fresh.length>=3?fresh:all,selected=[];
 const earned=s.bells+PARTS.filter(p=>s.owned.includes(p.id)&&!STARTER_PARTS.includes(p.id)).reduce((n,p)=>n+p.price,0);
 const budget=Math.max(65,earned*.65)*(s.vouchers.includes('extraShelf')?1.35:1);
 while(pool.length&&selected.length<3){
  let choices=pool;
  if(!selected.length){const affordable=pool.filter(p=>priceFor(s,{kind:'part',id:p.id})<=s.bells);if(affordable.length)choices=affordable;}
  else{const diverse=pool.filter(p=>!selected.some(o=>part(o.id).slot===p.slot));if(diverse.length)choices=diverse;}
  const weights=choices.map(p=>1/(1+(p.price/budget)**2)),total=weights.reduce((a,b)=>a+b,0);
  let roll=random.next()*total,index=0;while(index<choices.length-1&&(roll-=weights[index])>0)index++;
  const chosen=choices[index];selected.push({kind:'part',id:chosen.id});pool.splice(pool.indexOf(chosen),1);
 }
 return selected;
}
export function visitShop(raw, seed=Math.floor(Math.random()*4294967296)) {
  const s={...raw,vouchers:raw.vouchers??[]};
  if(s.shop?.round===s.launches&&s.shop.dealVersion===2){
    const kept=s.shop.offers.filter(o=>s.owned.includes(o.id)||purchaseFit(s.build,o).fitted);
    if(kept.length===s.shop.offers.length&&(kept.length===3||!compatibleStock(s).some(p=>!kept.some(o=>o.id===p.id))))return s;
    // A crafted rig can invalidate old offers. Replace only those slots using
    // saved RNG, without charging, resetting prices or changing paid choices.
    const random=rng(s.shop.seed),extra=deal(s,random,[],kept.map(o=>o.id)).slice(0,3-kept.length);
    return{...s,shop:{...s.shop,offers:[...kept,...extra],seed:random.seed()}};
  }
  // Preserve a paid legacy parcel while upgrading the equipment stock.
  const legacy=s.shop?.round===s.launches?s.shop:null;
  const random=rng(seed);
  const offers=deal(s,random);
  const vouchers=VOUCHERS.filter(v=>!s.vouchers.includes(v.id));
  const voucher=vouchers.length?{kind:'voucher',id:vouchers[Math.floor(random.next()*vouchers.length)].id}:null;
  const pack=draw(s,random,'part',3,offers.map(o=>o.id));
  const packCost=pack.length?Math.max(15,Math.floor(Math.min(...pack.map(p=>product(p).price))*.8)):0;
  return {...s,shop:{round:s.launches,dealVersion:2,seed:random.seed(),rerolls:legacy?.rerolls??0,offers,voucher:null,pack:legacy?.packOpened&&!legacy.packTaken?legacy.pack:[],packCost:legacy?.packOpened&&!legacy.packTaken?legacy.packCost:0,packOpened:!!legacy?.packOpened,packTaken:!!legacy?.packTaken}};
}
export function rerollShop(state) {
  if(!state.shop)throw Error('Visit the shop first.');
  const cost=rerollPrice(state);
  if(state.bells<cost)throw Error('More Bells needed for a reroll.');
  const random=rng(state.shop.seed),offers=deal(state,random,state.shop.offers);
  return {...state,bells:state.bells-cost,shop:{...state.shop,seed:random.seed(),rerolls:state.shop.rerolls+1,offers}};
}
export function purchaseOffer(state, offer) {
  if(offer.kind==='animal')throw Error('Critters are not for sale. Upgrade the tree door.');
  const shop=state.shop;
  const listed=[...shop.offers,...(shop.voucher?[shop.voucher]:[])].some(p=>p.id===offer.id&&p.kind===offer.kind);
  if(!listed)throw Error('That card is no longer in the shop.');
  if(owned(state,offer))throw Error('Already owned.');
  if(shop.dealVersion===2&&offer.kind==='part'&&!purchaseFit(state.build,offer).fitted)throw Error('Your rig changed. Reroll for parts that fit this build.');
  const cost=priceFor(state,offer);
  if(state.bells<cost)throw Error('More Bells needed.');
  const key=offer.kind==='animal'?'animals':offer.kind==='voucher'?'vouchers':'owned';
  return {...state,bells:state.bells-cost,[key]:[...state[key],offer.id]};
}
export const packPrice = s => Math.floor(s.shop.packCost*(s.vouchers.includes('friendDiscount') ? .9 : 1));
export function openPack(state) {
  if(state.shop.packOpened||state.shop.packTaken||!state.shop.pack.length)throw Error('This pack has already been opened.');
  if(state.shop.pack.every(p=>state.owned.includes(p.id)))throw Error('You already own every part in this parcel.');
  const cost=packPrice(state);
  if(state.bells<cost)throw Error('More Bells needed.');
  return {...state,bells:state.bells-cost,shop:{...state.shop,packOpened:true}};
}
export function choosePack(state,id) {
  if(!state.shop.packOpened||state.shop.packTaken||!state.shop.pack.some(p=>p.id===id))throw Error('Choose a card from your open pack.');
  if(state.owned.includes(id))throw Error('You already own this card. Pick another.');
  return {...state,owned:[...new Set([...state.owned,id])],shop:{...state.shop,packTaken:true}};
}
export function validateShop(shop, launches) {
  if(shop==null)return null; // Saves created before the travelling shop.
  if(!Number.isSafeInteger(shop.round)||shop.round<0||shop.round>launches||!Number.isInteger(shop.seed)||shop.seed<0||shop.seed>4294967295||!Number.isSafeInteger(shop.rerolls)||shop.rerolls<0||shop.rerolls>1000000)throw Error('Invalid shop state.');
  if(!Array.isArray(shop.offers)||shop.offers.length>5||!Array.isArray(shop.pack)||shop.pack.length>3||!Number.isSafeInteger(shop.packCost)||shop.packCost<0||typeof shop.packOpened!=='boolean'||typeof shop.packTaken!=='boolean'||shop.packTaken&&!shop.packOpened)throw Error('Invalid shop stock.');
  for(const list of [shop.offers,shop.pack,shop.voucher?[shop.voucher]:[]]){
    for(const o of list)if(!o||!['part','animal','voucher'].includes(o.kind)||!product(o))throw Error('Invalid shop card.');
    if(new Set(list.map(o=>`${o.kind}:${o.id}`)).size!==list.length)throw Error('Duplicate shop cards.');
  }
  if(shop.offers.some(o=>o.kind==='voucher')||shop.pack.some(o=>o.kind!=='part')||shop.voucher&&shop.voucher.kind!=='voucher')throw Error('Invalid card category.');
  if(!shop.pack.length&&shop.packCost!==0)throw Error('Invalid empty pack price.');
  if(shop.dealVersion===2&&shop.offers.length>3)throw Error('Only three equipment slots are supported.');
  if(shop.pack.length&&shop.packCost!==Math.max(15,Math.floor(Math.min(...shop.pack.map(p=>product(p).price))*.8)))throw Error('Invalid pack price.');
  return {...structuredClone(shop),offers:shop.offers.filter(o=>o.kind!=='animal')};
}

/** Paid legacy parcel choices remain recoverable; all fresh stock is gear. */
export function shopView(state){
 const shop=state.shop;if(!shop)return{choosing:false,cards:[],page:0,pages:1,total:0};
 const choosing=shop.packOpened&&!shop.packTaken;
 const cards=choosing?shop.pack.filter(o=>!owned(state,o)):shop.offers.slice(0,3);
 return{choosing,cards,page:0,pages:1,total:cards.length};
}
