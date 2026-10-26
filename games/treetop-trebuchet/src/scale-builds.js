import {STARTER,SIXTY_CM_STARTER,SLOTS,part,validateBuild,buildFacts,scaledPreset} from './build-catalog.js?v=71';

// Optional named recipes, never a starter migration or a purchase. Every value
// is real solver geometry/mass; comparison views must use one shared scale.
const recipe=(id,label,build,minimumDraw)=>Object.freeze({id,label,minimumDraw,name:build.name,build:Object.freeze(validateBuild(build))});
export const SCALE_BUILDS=Object.freeze([
 recipe('small','Small',{...STARTER},.7),
 recipe('medium','Medium',{...scaledPreset('rabbit'),name:'Oak field launcher',winch:'geared',counterGrams:480000,shortArm:.75,pivotHeight:45/13,baseWidth:30/13,beamWidth:.10532489417670134,cockAngle:55,pinAngle:-40,pinLength:.05192307692307692,axleRadius:.023076923076923078,hanger:.46153846153846156,troughLength:60/13,troughHeight:.10096153846153846},.4),
 recipe('large','Large',{...scaledPreset('bear'),name:'Braced bear launcher',frame:'braced',ballast:'mountain',winch:'capstan',rope:'cable',counterGrams:60000000},.4),
 recipe('elephant','Elephant',{
  ...scaledPreset('elephant'),name:'Elephant grove gantry',
  chassis:'anchored',arm:'ironwood',frame:'giant',ballast:'continental',material:'steel',mount:'hinged',sling:'elephant',rope:'titanCable',bearing:'precision',release:'polished',winch:'engine',trough:'runway',animal:'elephant',
  longArm:15.6,shortArm:4.8,beamWidth:1.14,pivotHeight:16.2,baseWidth:12,frameGrams:17600000,counterGrams:300000000,hanger:3,slingLength:14.4,pouchWidth:5.28,pinAngle:-45,pinLength:.15,axleRadius:.15,cockAngle:28,
  wheelRadius:1.32,wheelGrams:640000,troughLength:33,troughHeight:.36,
 },.6),
]);

/** An independent build: changing a preview cannot change a saved recipe. */
export function createScaleBuild(id){
 const entry=SCALE_BUILDS.find(entry=>entry.id===id);if(!entry)throw Error('Unknown scale recipe.');return {...entry.build};
}

/** Unzoomed SI dimensions. Long-side reach is a geometric envelope from axle
 * to the outermost volunteer, not a promise that the arm can rotate through
 * terrain. Stationary workspace also includes the existing guide/stand/crank. */
export function scaleBuildFacts(idOrBuild){
 const build=typeof idOrBuild==='string'?createScaleBuild(idOrBuild):validateBuild(idOrBuild),facts=buildFacts(build),animal=facts.payload;
 const wheel=part(build.winch),wheelRadius=Math.min(build.pivotHeight,build.baseWidth*1.65)*wheel.radiusRatio,wheelX=build.baseWidth*.44;
 const standX=-Math.max(build.longArm*.92,build.baseWidth*.9),standWidth=Math.max(animal.length*1.35,build.pouchWidth*1.25);
 const guide={minX:-build.troughLength*.75,maxX:build.troughLength*.25};
 const stationaryBounds={minX:Math.min(-build.baseWidth*.5,guide.minX,standX-standWidth*.5,wheelX-wheelRadius*1.1),maxX:Math.max(build.baseWidth*.5,guide.maxX,standX+standWidth*.5,wheelX+wheelRadius*1.1)};
 return{
  minimumDraw:recipeDrawMinimum(build),axleHeight:build.pivotHeight,feetWidth:build.baseWidth,guideLength:build.troughLength,guideBounds:guide,stationaryBounds,stationaryWidth:stationaryBounds.maxX-stationaryBounds.minX,
  beamLength:build.longArm+build.shortArm,longArm:build.longArm,shortArm:build.shortArm,cordLength:build.slingLength,longSideReach:build.longArm+build.slingLength+animal.length*.5,
  counterSideReach:build.shortArm+(build.mount==='hinged'?build.hanger:0)+facts.counterRadius,
  beamThickness:build.beamWidth,pouchOpening:build.pouchWidth,pouchCapacityGrams:facts.capacity,volunteerLength:animal.length,volunteerWidth:animal.width,volunteerGrams:animal.grams,counterGrams:build.counterGrams,frameGrams:build.frameGrams,beamGrams:facts.beamGrams,counterRadius:facts.counterRadius,
  parts:SLOTS.map(([slot,label])=>({slot,label,id:build[slot],name:part(build[slot]).name})),
 };
}

/** Calibration belongs only to these tested configurations, not arbitrary saved
 * experiments. A name change is cosmetic; equipment/geometry changes require
 * their own tuning. No user's custom settings are silently replaced. */
export function recipeDrawMinimum(build){
 const match=SCALE_BUILDS.find(({build:known})=>Object.keys(known).every(key=>key==='name'||known[key]===build[key]));
 if(match)return match.minimumDraw;
 if(Object.keys(SIXTY_CM_STARTER).every(key=>key==='name'||SIXTY_CM_STARTER[key]===build[key]))return .7;
 return null;
}
