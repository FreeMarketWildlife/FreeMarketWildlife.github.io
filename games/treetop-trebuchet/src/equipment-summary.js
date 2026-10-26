import {GUILLOTINE,isGuillotine} from './guillotine.js?v=70';
import {windingMinimum,windingMotion} from './winding-comfort.js?v=70';
import {part,drawLimit,REST_ARM_ANGLE} from './build-catalog.js?v=70';
import {GRAVITY} from './build-physics.js?v=70';
const n=value=>Number(value.toFixed(6)).toLocaleString('en-US',{maximumFractionDigits:6});
const mass=g=>g>=1000000?n(g/1000000)+' t':g>=1000?n(g/1000)+' kg':n(g)+' g';
/** What a purchased part changes, independent of a promised distance increase. */
export function equipmentSpec(p){
 switch(p.slot){
 case 'chassis':return {anchored:'Fixed axle · no recoil',skids:'Sliding feet · grip matters',wheels:'Rolling recoil · adjustable brake',walking:'Rocking support · adjustable lean',floating:'Sliding axle · guided weight'}[p.id];
 case 'arm':return n(p.maxLength)+' m beam limit · '+n(p.strength/1e6)+' MPa strength · '+n(p.density)+' kg/m³';
 case 'frame':return n(p.maxHeight)+' m axle limit · '+mass(p.maxMass)+' frame limit';
 case 'ballast':return p.id==='guillotine'?'58 cm guide · 17 cm blade · '+mass(p.maxMass)+' blade limit · gravity-driven cable':mass(p.maxMass)+' mass limit · holder and connection included';
 case 'material':return n(p.density)+' kg/m³ · changes bulk and inertia';
 case 'mount':return p.id==='fixed'?'Weight turns with beam':'Independent hanging weight';
 case 'sling':return mass(p.capacity)+' critter · '+n(p.width)+' m opening · '+n(p.maxLength)+' m cords · '+mass(p.mass)+' cloth';
 case 'rope':return n(p.strength)+' N breaking load · '+mass(p.linearGrams)+'/m per cord';
 case 'bearing':return n(windingMinimum({bearing:p.id}))+' s light-load winding · friction '+n(p.friction);
 case 'release':return 'Ring friction '+n(p.friction)+' · changes release timing';
 case 'winch':return n(p.power)+' W · load-limited winding, no launch boost';
 case 'trough':return 'Rail friction '+n(p.friction)+' · for ground-loaded sliding launches';
 default:throw Error('Unsupported equipment slot');
 }
}
export function equipmentUse(p,c){
 if(p.slot==='frame')return 'Now '+n(c.pivotHeight)+' m / '+mass(c.frameGrams)+'. Capacity leaves dimensions unchanged; adjust below.';
 if(p.slot==='ballast')return 'Counterweight mass: '+mass(c.counterGrams)+'. Holder and connection are included; adjust mass below.';
 if(p.slot==='sling')return 'Now '+n(c.pouchWidth)+' m opening / '+n(c.slingLength)+' m cords. Cloth and cord mass still load the beam.';
 if(p.slot==='trough')return 'Tune the guide deck and cord length so the loaded pouch slides along the rail before lift-off.';
 if(p.slot==='release')return 'Compare release angle, then adjust the pin bend to shape the arc.';
 if(p.slot==='bearing'&&windingMotion(c).travelLimited)return 'Large cargo limits the moving basket to a gentle pace. Bearings still reduce axle friction; current preparation is about '+n(preparationSeconds(c))+' s.';
 if(p.slot==='bearing')return 'Smoother cranking: '+n(windingMinimum(c))+' s light-load preparation. Heavy loads also depend on crank-wheel power.';
 if(p.slot==='winch'&&windingMotion(c).travelLimited)return 'Cargo motion also limits this large basket. More wheel power helps only while counterweight power is the slower limit.';
 if(p.slot==='winch')return 'Bearings set the light-load pace ('+n(windingMinimum(c))+' s). More wheel power raises heavier loads faster.';
 return '';
}
export function tuningLimit(c,key){
 return ({longArm:part(c.arm).maxLength-c.shortArm,shortArm:part(c.arm).maxLength-c.longArm,pivotHeight:part(c.frame).maxHeight,frameGrams:part(c.frame).maxMass,counterGrams:part(c.ballast).maxMass,slingLength:part(c.sling).maxLength,pouchWidth:part(c.sling).width})[key];
}
/** Integral of the same power/governor rule as BuildSimulation.wind; an estimate
 * for a fixed frame, not a claim that every moving-frame load winds identically. */
export function preparationSeconds(c,{loaded=true,samples=512}={}){
 const span=Math.PI+drawLimit(c)*Math.PI/180-REST_ARM_ANGLE,power=part(c.winch).power;
 let seconds=0;
 for(let i=0;i<samples;i++){
  const angle=REST_ARM_ANGLE+span*(i+.5)/samples;
  const joules=c.counterGrams/1000*GRAVITY*(isGuillotine(c)?GUILLOTINE.drumRadius:c.shortArm*Math.max(.01,-Math.cos(angle)))*span;
  seconds+=Math.max(windingMinimum(c,{loaded}),joules/power)/samples;
 }
 return seconds+windingMotion(c,{loaded}).rampSeconds*.5;
}
