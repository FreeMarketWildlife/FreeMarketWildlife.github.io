import {part,validateBuild,buildFacts,TUNING,critter} from './build-catalog.js?v=49';
/** Fit owned equipment, reducing dimensions only when the selected part cannot
 * accommodate them. Buying capacity never secretly fills the counterweight. */
export function fitEquipment(build,offer){
 const c={...build};
 if(offer.kind==='voucher')return c;
 if(offer.kind==='animal')c.animal=offer.id;
 else{
  const p=part(offer.id);c[p.slot]=p.id;
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
  // A large cloth/cord tier can overload a small rig despite fitting its
  // dimensions. Keep that purchase owned without silently replacing the
  // player's working hardware. This is an auto-fit policy, not a claim that
  // static balance predicts every dynamic failure; Build remains explicit.
  const movingGrams=c=>part(c.sling).mass+2*part(c.rope).linearGrams*c.slingLength;
  if(movingGrams(candidate)>movingGrams(build)+1e-9&&movingGrams(candidate)>critter(candidate.animal).grams)return{build:unchanged,fitted:false,reason:'This heavier pouch and cord need a balance check. Owned: fit it from Build when you are ready. Your current build is unchanged.'};
  const warning=buildFacts(candidate).warnings[0];
  if(warning)return{build:unchanged,fitted:false,reason:warning+' Your current build is unchanged.'};
  return{build:candidate,fitted:true,reason:''};
 }catch(error){return{build:unchanged,fitted:false,reason:error.message+' Your current build is unchanged.'};}
}
