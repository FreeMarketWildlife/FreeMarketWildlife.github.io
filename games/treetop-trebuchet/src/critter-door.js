import {CRITTERS} from './build-catalog.js?v=70';
import {critterHitboxBounds} from './critter-body.js?v=70';
// Game progression dimensions and prices, not biological or world canon.
export const DOORS=Object.freeze([
 {height:.10,price:0},{height:.15,price:35},{height:.22,price:65},
 {height:.30,price:110},{height:.80,price:220},{height:1.10,price:400},
 {height:2.60,price:800},{height:4.50,price:1600},
].map((d,tier)=>Object.freeze({...d,tier,name:`${Math.round(d.height*100)} cm door`})));
export function doorTier(state){return state.doorTier??0;}
export function doorHeight(state){return DOORS[doorTier(state)].height;}
export function critterHeight(animal){const b=critterHitboxBounds(animal);return b.maxY-b.minY;}
export function availableCritters(state){return CRITTERS.filter(a=>critterHeight(a)<=doorHeight(state)+1e-10).map(a=>a.id);}
export function nextDoor(state){return DOORS[doorTier(state)+1]??null;}
export function upgradeDoor(state){
 const next=nextDoor(state);if(!next)throw Error('Your door is fully upgraded.');
 if(state.doorUpgradeRound===state.launches)throw Error('One door upgrade per round. Complete another round first.');
 if(state.bells<next.price)throw Error('More Bells needed.');
 const result={...state,bells:state.bells-next.price,doorTier:next.tier,doorUpgradeRound:state.launches};
 return{...result,animals:availableCritters(result)};
}
export function doorGeometry(map,height=.10){
 const tree=map.tree,width=height*.72;
 // Inset the entire opening into the front face of the trunk.
 let edge=tree.trunkX+tree.trunkWidth/2;
 if(map.version===4){
  const cubic=(a,b,c,d,t)=>(1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d;
  const altitude=(map.launch?.y??0)+height;
  let lo=0,hi=1;for(let i=0;i<40;i++){const t=(lo+hi)/2;if(cubic(0,.24,.44,.55,t)*tree.height<altitude)lo=t;else hi=t;}
  edge=tree.trunkX+tree.trunkWidth*cubic(.5,.34,.31,.19,(lo+hi)/2);
 }
 return{x:edge-width*.85,y:0,width,height};
}
export function drawCritterDoor(ctx,door,project,scale,{open=false}={}){
 const [x,y]=project(door),w=door.width*scale,h=door.height*scale;
 ctx.save();ctx.translate(x,y);ctx.lineWidth=Math.max(.65,h*.025);
 ctx.beginPath();ctx.moveTo(-w/2,0);ctx.lineTo(-w/2,-h+w/2);ctx.arc(0,-h+w/2,w/2,Math.PI,Math.PI*2);ctx.lineTo(w/2,0);ctx.closePath();
 ctx.fillStyle='#182c27';ctx.fill();ctx.strokeStyle='#d8b375';ctx.stroke();
 if(!open){ctx.save();ctx.clip();ctx.fillStyle='#94613c';ctx.fillRect(-w*.44,-h,w*.88,h);ctx.strokeStyle='#c6975d';for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*w*.24,0);ctx.lineTo(i*w*.24,-h);ctx.stroke();}ctx.fillStyle='#f0d88d';ctx.beginPath();ctx.arc(w*.25,-h*.43,Math.max(.6,w*.045),0,Math.PI*2);ctx.fill();ctx.restore();}
 ctx.restore();
}
