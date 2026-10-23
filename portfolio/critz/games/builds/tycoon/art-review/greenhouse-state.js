// Pure greenhouse economy. Review storage remains separate; the adventure bridge
// persists an optional collection and maps whole dollars to adventure cents.
export const SAVE_KEY = 'critz.lukes-greenhouse.review.v1';
export const PRICE = 100;
export const ROOM = Object.freeze({columns:13,rows:17,doorX:6,doorY:16});
export const DOROTHY_KIND=16, DOROTHY_CHANCE=.001, SHINY_CHANCE=.01;
// Separate deterministic streams: no rerolls on misses, tub switching, or reload.
function roll(seed,salt){return random((seed^salt)>>>0)();}
export const HOP_ROUTE=[0,2,4,6,7,5,3,1];
export function hopperAt(time,seed=0){const turn=Math.floor(Math.max(0,time)/6),p=(Math.max(0,time)%6)/6,offset=(seed>>>0)%8;return {tub:HOP_ROUTE[(turn+offset)%8],next:HOP_ROUTE[(turn+offset+1)%8],jump:Math.max(0,(p-.8)/.2)};}
export function catchTraits(seed,tub,slot,eligible){const salt=(Math.imul(tub+1,0x85ebca6b)^Math.imul(slot+1,0xc2b2ae35))>>>0;return {shiny:!!eligible&&roll(seed,salt^0x31415926)<SHINY_CHANCE,variant:Math.floor(roll(seed,salt^0x27182818)*12)};}

export const TUBS = Array.from({length:8}, (_,i)=>({id:i,x:i%2?8:2,y:4+Math.floor(i/2)*3,w:3,h:2}));
export const initialState = () => ({version:1,money:300,visit:null,collection:[],nextId:1});
const copy = s => JSON.parse(JSON.stringify(s));
export function normalize(value) {
  if (!value || value.version!==1 || !Number.isSafeInteger(value.money) || value.money<0 || !Array.isArray(value.collection) || !Number.isSafeInteger(value.nextId) || value.nextId<1) throw new Error('This review save cannot be read. Export it before resetting.');
  if (value.collection.some(f=>!Number.isSafeInteger(f.serial)||f.serial<1||!Number.isInteger(f.kind)||f.kind<0||f.kind>=17||!Number.isSafeInteger(f.seed))) throw new Error('This review collection cannot be read.');
  if(value.collection.some(f=>(f.shiny!==undefined&&typeof f.shiny!=='boolean')||(f.variant!==undefined&&(!Number.isInteger(f.variant)||f.variant<0||f.variant>=12))))throw new Error('Invalid fish appearance.');
  if(new Set(value.collection.map(f=>f.serial)).size!==value.collection.length || value.collection.some(f=>f.serial>=value.nextId)) throw new Error('This review collection has conflicting fish IDs.');
  const v=value.visit;
  if(v&&((v.rarities!==undefined&&typeof v.rarities!=='boolean')||(v.shimmeringTub!==undefined&&v.shimmeringTub!==null&&(!Number.isInteger(v.shimmeringTub)||v.shimmeringTub<0||v.shimmeringTub>7))))throw new Error('Invalid visit details.');
  if(v && (!['paid','caught'].includes(v.status)||!Number.isSafeInteger(v.seed)||!(v.tub===null||Number.isInteger(v.tub)&&v.tub>=0&&v.tub<8)||v.status==='caught'&&!value.collection.some(f=>f.serial===v.fishSerial))) throw new Error('This review visit cannot be read.');
  return copy(value);
}
export function pay(s,seed) {
  if(s.visit || s.money<PRICE) return s;
  const n=copy(s); n.money-=PRICE; n.visit={rarities:true,status:'paid',seed:seed>>>0,tub:null}; return n;
}
export function chooseTub(s,tub,shimmeringTub=null) {
  if(s.visit?.status!=='paid'||!Number.isInteger(tub)||tub<0||tub>=8)return s;
  const n=copy(s); n.visit.tub=tub; n.visit.shimmeringTub=shimmeringTub; return n;
}
export function random(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
export function fishInTub(seed,tub,rarities=false){
  const r=random((seed+Math.imul(tub+1,2654435761))>>>0);
  const available=Array.from({length:16},(_,i)=>i);
  const fish=Array.from({length:5},(_,i)=>({slot:i,kind:available.splice(Math.floor(r()*available.length),1)[0],seed:Math.floor(r()*4294967296),phase:r()*Math.PI*2,speed:.24+r()*.22,rx:48+r()*82,ry:30+r()*44}));
  if(rarities)for(const f of fish)if(roll(seed,(Math.imul(tub+1,0x27d4eb2d)^Math.imul(f.slot+1,0x165667b1))>>>0)<DOROTHY_CHANCE){f.kind=DOROTHY_KIND;break;}
  return fish;
}
export function fishPosition(f,time){const a=f.phase+time*f.speed;return {x:240+Math.cos(a)*f.rx,y:158+Math.sin(a*1.37)*f.ry,angle:Math.atan2(Math.cos(a*1.37)*f.ry*1.37,-Math.sin(a)*f.rx)-Math.PI/2};}
export function catchAt(fish,x,y,time){return fish.map(f=>({f,d:Math.hypot(fishPosition(f,time).x-x,fishPosition(f,time).y-y)})).filter(p=>p.d<=25).sort((a,b)=>a.d-b.d||a.f.slot-b.f.slot)[0]?.f||null;}
export function collect(s,slot){
  if(s.visit?.status!=='paid'||s.visit.tub===null)return s;
  const fish=fishInTub(s.visit.seed,s.visit.tub,s.visit.rarities).find(f=>f.slot===slot);if(!fish)return s;
  const n=copy(s);n.collection.push({serial:n.nextId++,kind:fish.kind,seed:fish.seed,...(s.visit.rarities?catchTraits(s.visit.seed,s.visit.tub,slot,s.visit.shimmeringTub===s.visit.tub):{}),...(fish.kind===DOROTHY_KIND?{rarity:"legendary"}:{})});n.visit.status='caught';n.visit.fishSerial=n.nextId-1;return n;
}
export function leave(s){const n=copy(s);if(n.visit?.status==='paid')n.money+=PRICE;n.visit=null;return n;}
export function blocked(x,y){return x<1||x>11||y<3||y>16||y===16&&x!==6||TUBS.some(t=>x>=(t.id%2?t.x:t.x-1)&&x<t.x+t.w+(t.id%2?1:0)&&y>=t.y&&y<t.y+t.h);}
export function nearTub(x,y,facing){const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[facing];const ax=x+d[0],ay=y+d[1];return TUBS.find(t=>ax>=t.x&&ax<t.x+t.w&&ay>=t.y&&ay<t.y+t.h);}
