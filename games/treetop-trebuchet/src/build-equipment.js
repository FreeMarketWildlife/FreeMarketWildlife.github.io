import {part,validateBuild,buildFacts,TUNING,critter,counterweightKit} from './build-catalog.js?v=71';
/** Fit owned equipment, reducing dimensions only when the selected part cannot
 * accommodate them. Buying capacity never secretly fills the counterweight. */
export function fitEquipment(build,offer){
 const c={...build};
 if(offer.kind==='voucher')return c;
 if(offer.kind==='animal')c.animal=offer.id;
 else{
  const p=part(offer.id);c[p.slot]=p.id;const kit=counterweightKit(p);if(kit){Object.assign(c,kit);c.counterGrams=Math.min(c.counterGrams,part(c.ballast).maxMass);}
  if(p.slot==='arm'&&c.longArm+c.shortArm>p.maxLength){const ratio=p.maxLength/(c.longArm+c.shortArm);c.longArm*=ratio;c.shortArm*=ratio;}
  if(p.slot==='frame'){c.pivotHeight=Math.min(c.pivotHeight,p.maxHeight);c.frameGrams=Math.min(c.frameGrams,p.maxMass);}
  if(p.slot==='ballast')c.counterGrams=Math.min(c.counterGrams,p.maxMass);
  if(p.slot==='sling'){c.slingLength=Math.min(c.slingLength,p.maxLength);c.pouchWidth=Math.min(c.pouchWidth,p.width);}
 }
 return validateBuild(c);
}

/** Purchases grant inventory first. A smaller capacity never silently shrinks
 * a custom machine, and incompatible cargo does not replace a working rig.
 * Explicit selection of older owned parts retains fitEquipment's old behavior. */
export function purchaseFit(build,offer){
 const unchanged={...build};if(offer.kind==='voucher')return{build:unchanged,fitted:false,reason:''};
 try{
  const candidate=fitEquipment(build,offer);
  if(TUNING.some(([key])=>candidate[key]!==build[key]))return{build:unchanged,fitted:false,reason:'Kept your current dimensions. Fit this part from Build when you want to resize.'};
  // Actual capacity/torque warnings decide attachment compatibility. Cloth
  // heavier than the animal is normal and is included in physics inertia.
  const warning=buildFacts(candidate).warnings[0];
  if(warning)return{build:unchanged,fitted:false,reason:warning+' Your current build is unchanged.'};
  return{build:candidate,fitted:true,reason:''};
 }catch(error){return{build:unchanged,fitted:false,reason:error.message+' Your current build is unchanged.'};}
}
