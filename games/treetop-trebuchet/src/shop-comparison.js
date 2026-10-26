import {part,critter,buildFacts} from './build-catalog.js?v=71';
import {purchaseFit,fitEquipment} from './build-equipment.js?v=71';
import {equipmentSpec} from './equipment-summary.js?v=71';
export function rigStats(c){const f=buildFacts(c);return {height:c.pivotHeight,capacity:f.capacity,movingGrams:critter(c.animal).grams+part(c.sling).mass+2*part(c.rope).linearGrams*c.slingLength,beamGrams:f.beamGrams,torque:c.counterGrams/1000*8.825985*c.shortArm,inertia:f.beamGrams/1000*(c.longArm**2-c.longArm*c.shortArm+c.shortArm**2)/3,potential:c.counterGrams/1000*8.825985*2*c.shortArm,opening:c.pouchWidth};}
export function shopComparison(build,offer){
 if(offer.kind!=='part')return null;
 const p=part(offer.id),fit=purchaseFit(build,offer),current=rigStats(build);let candidate;try{candidate=fitEquipment(build,offer);}catch{candidate=build;}const next=rigStats(candidate);
 const rows=[['Axle height','height','m',2],['Pouch opening','opening','m',2],['Cargo capacity','capacity','g',0],['Payload + pouch + cords','movingGrams','g',1],['Beam mass','beamGrams','g',1],['Counterweight torque scale','torque','N·m',2],['Beam rotational inertia','inertia','kg·m²',4],['Counterweight energy scale','potential','J',2]].map(([label,key,unit,digits])=>({label,before:current[key].toFixed(digits)+' '+unit,after:next[key].toFixed(digits)+' '+unit,changed:current[key]!==next[key]}));
 return {spec:equipmentSpec(p),fit,candidate,rows,currentPart:part(build[p.slot]).name};
}
