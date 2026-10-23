/** All persisted masses are grams. Geometry is metres; SI conversion is confined to the solver. */
const item=(id,slot,name,price,description,data={})=>({id,slot,name,price,description,...data});
export const PARTS=[
 item('anchored','chassis','Root anchors',0,'A fixed axle. No chassis recoil; all reaction goes into the branch.'),
 item('skids','chassis','Timber skids',45,'An unanchored frame. Foot friction decides whether it slides or tips.'),
 item('wheels','chassis','Rolling chassis',110,'Two turning wheels let the entire machine recoil. Brake and wheel size matter.'),
 item('walking','chassis','Walking triangle',240,'A rocking support with changing ground contacts. Tune lean, foot grip and proportions.'),
 item('floating','chassis','Floating axle rails',420,'A horizontal rolling axle and a vertically guided counterweight.'),
 ...[
 ['twig','Willow beam',0,2.2,500,32e6,'#ba804a'],['oak','Oak beam',65,7,700,55e6,'#9d6138'],['laminated','Laminated beam',260,20,580,90e6,'#c28e53'],['ironwood','Ironwood beam',1100,65,850,160e6,'#714c3d'],['colossus','Colossus truss',4800,160,450,260e6,'#678e87']
 ].map(([id,name,price,maxLength,density,strength,color])=>item(id,'arm',name,price,'Set both lever lengths and the beam thickness. Mass and bending strength follow its geometry.',{maxLength,density,strength,color})),
 ...[['sapling','Sapling A-frame',0,3,10000],['timber','Timber tower',80,10,100000],['braced','Braced tower',300,30,3000000],['giant','Giant gantry',1400,100,100000000],['leviathan','Leviathan gantry',5000,220,2000000000]].map(([id,name,price,maxHeight,maxMass])=>item(id,'frame',name,price,'Set axle height, base width, ballast and bracing. Wide feet resist tipping.',{maxHeight,maxMass})),
 ...[['pebble','Pebble basket',0,5000],['boulder','Boulder basket',55,100000],['quarry','Quarry basket',220,2000000],['mountain','Mountain ballast',950,100000000],['continental','Continental ballast',4200,15000000000]].map(([id,name,price,maxMass])=>item(id,'ballast',name,price,'Buy more counterweight capacity, then choose the actual fill mass.',{maxMass})),
 item('stone','material','River stone',0,'2,700,000 g/m³. A lumpy, bulky weight.',{density:2700}),
 item('sand','material','Sand basket',35,'1,600,000 g/m³. The same mass needs a larger basket.',{density:1600}),
 item('steel','material','Steel plates',150,'7,850,000 g/m³. Compact ballast with a different moment of inertia.',{density:7850}),
 item('runway','trough','Timber launch rail',0,'A low wooden trough supports the loaded pouch and guides its first slide.',{friction:.24}),
 item('waxedRunway','trough','Waxed launch rail',85,'A smooth lined trough reduces the friction before lift-off.',{friction:.06}),
 item('fixed','mount','Fixed weight',0,'Rigidly attached to the short arm; its mass and inertia turn with the beam.'),
 item('hinged','mount','Swinging hanger',90,'An independent pendulum. Hanger length and hinge friction change the energy transfer.'),
 ...[['pocket','Leaf pocket',0,150,.22,3,2],['pouch','Canvas pouch',60,3000,.75,10,35],['cradle','Deep cradle',200,20000,1.7,25,250],['hammock','Great hammock',650,500000,4,65,5000],['elephant','Elephant harness',2200,8000000,9,120,80000],['whale','Whale hammock',6500,150000000,32,230,1000000]].map(([id,name,price,capacity,width,maxLength,mass])=>item(id,'sling',name,price,'Larger cargo needs a larger pouch. Extra cloth adds moving mass.',{capacity,width,maxLength,mass})),
 ...[['twine','Braided twine',0,150,12],['hemp','Hemp cord',70,12000,45],['cable','Steel cable',500,2500000,350],['titanCable','Titan cable',2500,1500000000,2500]].map(([id,name,price,strength,linearGrams])=>item(id,'rope',name,price,'Breaking load and cord mass both matter. A snapped sling releases wherever it is.',{strength,linearGrams})),
 ...[['woodAxle','Wooden axle',0,.022],['bronze','Bronze bushings',70,.009],['bearings','Roller bearings',350,.002],['precision','Precision bearings',1500,.0005]].map(([id,name,price,friction])=>item(id,'bearing',name,price,'Bearing friction resists rotation; axle diameter affects friction torque.',{friction})),
 item('nail','release','Bent release nail',0,'Adjust the pin angle and length. The ring slips when tension pulls along the pin.',{friction:.16}),
 item('polished','release','Polished release pin',75,'Less ring friction changes release timing.',{friction:.04}),
 item('rollerPin','release','Roller release finger',360,'A low-friction roller lets the ring clear sooner. Adjust the pin bend to shape the release arc.',{friction:.008}),
 ...[['hand','Acorn crank wheel',0,100,.12,.24,3,6,'#bb793e'],['geared','Brass geared wheel',100,2500,.145,.22,5,8,'#d2a24e'],['capstan','Iron capstan wheel',700,500000,.18,.26,7,8,'#819b91'],['engine','Gantry winding wheel',3000,500000000,.21,.28,9,10,'#677e87']].map(([id,name,price,power,radiusRatio,drumRatio,gearing,spokes,color])=>item(id,'winch',name,price,'Front-mounted winding wheel. Hold to crank counterclockwise; release to freewheel clockwise as the ballast falls. Larger geared drums raise heavier loads faster.',{power,radiusRatio,drumRatio,gearing,spokes,color})),
];
export const SLOTS=[['chassis','Foundation'],['arm','Throwing arm'],['frame','Frame'],['ballast','Counterweight capacity'],['material','Ballast material'],['mount','Counterweight joint'],['sling','Pouch'],['rope','Sling cords'],['bearing','Axle'],['release','Release finger'],['winch','Crank wheel'],['trough','Launch trough']];
export const CRITTERS=[
 {id:'mouse',name:'Field mouse',grams:25,length:0.18,width:0.035,color:'#b0a19a',price:0},
 {id:'frog',name:'Tree frog',grams:30,length:0.08,width:0.05,color:'#8ab667',price:20},
 {id:'chipmunk',name:'Chipmunk',grams:100,length:0.26,width:0.09,color:'#c58a53',price:40},
 {id:'squirrel',name:'Squirrel',grams:500,length:0.45,width:0.14,color:'#b18361',price:90},
 {id:'rabbit',name:'Rabbit',grams:2000,length:0.45,width:0.22,color:'#d9c6af',price:160},
 {id:'armadillo',name:'Armadillo',grams:5000,length:0.65,width:0.27,color:'#a4978b',price:250},
 {id:'fox',name:'Fox',grams:6000,length:0.85,width:0.3,color:'#d77d49',price:330},
 {id:'tiger',name:'Tiger',grams:220000,length:2.6,width:0.8,color:'#e3a04a',price:800},
 {id:'bear',name:'Brown bear',grams:250000,length:2.2,width:1.1,color:'#8e6851',price:900},
 {id:'elephant',name:'Elephant',grams:5000000,length:6,width:2.6,color:'#9daaaa',price:2600},
 {id:'whale',name:'Blue whale',grams:100000000,length:24,width:4.5,color:'#6d9ca9',price:7000},
];
// Prototype balance, not world canon: all three small critters fit the starter.
export const STARTER_MAX_GRAMS=150;
export const REST_ARM_ANGLE=Math.PI-1;
export const STARTER_ANIMALS=CRITTERS.filter(a=>a.grams<=STARTER_MAX_GRAMS).map(a=>a.id);
export const part=id=>{const p=PARTS.find(p=>p.id===id);if(!p)throw Error(`Unknown part: ${id}`);return p;};
export const critter=id=>{const c=CRITTERS.find(c=>c.id===id);if(!c)throw Error(`Unknown critter: ${id}`);return c;};
export const LEGACY_STARTER={name:'Little acorn',chassis:'anchored',arm:'twig',frame:'sapling',ballast:'pebble',material:'stone',mount:'fixed',sling:'pocket',rope:'twine',bearing:'woodAxle',release:'nail',winch:'hand',animal:'mouse',longArm:1.25,shortArm:.32,beamWidth:.025,pivotHeight:1.05,baseWidth:.85,frameGrams:1800,counterGrams:2000,hanger:.22,slingLength:1.1,pouchWidth:.16,pinAngle:-30,pinLength:.035,axleRadius:.012,cockAngle:28,footFriction:.8,wheelRadius:.13,wheelGrams:150,brake:.002,walkingLean:22,braceCount:1,hingeFriction:.008,wind:0,drag:1};
// A complete, tuned kit is granted at the beginning; upgrades still have shop prices.
// Retained 3 m tower recipe for older custom saves and larger critters.
export const PREVIOUS_STARTER={...LEGACY_STARTER,name:'Acorn Flyer',arm:'oak',ballast:'boulder',mount:'hinged',bearing:'bronze',release:'polished',winch:'hand',trough:'runway',longArm:2.6,shortArm:.65,beamWidth:.04,pivotHeight:3,baseWidth:2,frameGrams:9000,counterGrams:18000,hanger:.4,slingLength:2.4,pouchWidth:.2,cockAngle:55,pinAngle:-45,braceCount:2,troughLength:4,troughHeight:.06};
// Compact kit for tiny critters; larger recipes retain the original tower.
export const COMPACT_STARTER={...PREVIOUS_STARTER,name:'Acorn Flyer',longArm:1.04,shortArm:.26,beamWidth:.02,pivotHeight:1.2,baseWidth:.8,frameGrams:1500,counterGrams:6000,hanger:.16,slingLength:.96,troughLength:1.6,troughHeight:.035,pinLength:.018,axleRadius:.008,pinAngle:-40};
// Mouse-sized stock rig. Custom dimensions are never scaled on load.
export const STARTER={...COMPACT_STARTER,longArm:.52,shortArm:.13,beamWidth:.014,pivotHeight:.60,baseWidth:.40,frameGrams:400,counterGrams:2000,hanger:.08,slingLength:.48,troughLength:.80,troughHeight:.02,pouchWidth:.20,pinLength:.009,axleRadius:.004,pinAngle:-65,wheelRadius:.065,wheelGrams:40};
export const STARTER_PARTS=[...new Set([...PARTS.filter(p=>p.price===0).map(p=>p.id),...SLOTS.map(([slot])=>STARTER[slot])])];
export const dimensions=a=>`${Number((a.length*100).toFixed(1))} × ${Number((a.width*100).toFixed(1))} cm`;
export function drawLimit(c,pivotY=c.pivotHeight,deckY=c.troughHeight){return Math.min(c.cockAngle,Math.asin(Math.max(0,Math.min(1,(pivotY-deckY-c.beamWidth/2-.025)/c.longArm)))*180/Math.PI);}
export const TUNING=[
 ['troughLength','Guide length','m',.3,350,.1,'trough'],['troughHeight','Guide deck height','m',.02,15,.01,'trough'],
 ['longArm','Long arm','m',.15,150,.05,'arm'],['shortArm','Short arm','m',.08,60,.02,'arm'],['beamWidth','Beam thickness','m',.01,12,.005,'arm'],
 ['pivotHeight','Axle height','m',.2,220,.05,'frame'],['baseWidth','Footprint','m',.15,180,.05,'frame'],['frameGrams','Frame + ballast','g',100,2000000000,100,'frame'],['braceCount','Cross braces','',0,6,1,'frame'],
 ['counterGrams','Counterweight fill','g',100,15000000000,100,'ballast'],['hanger','Hanger length','m',.05,100,.05,'mount'],['hingeFriction','Hinge friction','',0,.3,.001,'mount'],
 ['slingLength','Cord length','m',.1,230,.05,'sling'],['pouchWidth','Pouch opening','m',.06,32,.01,'sling'],
 ['pinAngle','Pin bend','°',-120,100,1,'release'],['pinLength','Pin length','m',.005,3,.005,'release'],
 ['axleRadius','Axle radius','m',.003,3,.001,'bearing'],['cockAngle','Draw-down angle','°',5,80,1,'winch'],
 ['footFriction','Foot grip','',.02,1.5,.01,'chassis'],['wheelRadius','Wheel radius','m',.03,10,.01,'chassis'],['wheelGrams','Each wheel','g',10,50000000,10,'chassis'],['brake','Wheel brake / rolling loss','',0,.3,.001,'chassis'],['walkingLean','Walking support lean','°',5,55,1,'chassis']
];
export const grams=g=>`${Math.round(g).toLocaleString('en-US')} g`;
export function validateBuild(raw){
 const c={...STARTER,...raw};
 if(typeof c.name!=='string'||c.name.length>60)throw Error('Name must be 60 characters or fewer.');
 for(const [slot]of SLOTS)if(part(c[slot]).slot!==slot)throw Error(`Wrong part for ${slot}.`);
 critter(c.animal);
 for(const [key,label,,min,max]of TUNING)if(!Number.isFinite(c[key])||c[key]<min||c[key]>max)throw Error(`${label} must be between ${min} and ${max}.`);
 if(!Number.isInteger(c.braceCount))throw Error('Use a whole number of braces.');
 if(!Number.isFinite(c.wind)||Math.abs(c.wind)>30||![0,1].includes(c.drag))throw Error('Invalid atmosphere.');
 if(c.longArm+c.shortArm>part(c.arm).maxLength+1e-6)throw Error('This beam is too short. Fit a larger beam.');
 if(c.pivotHeight>part(c.frame).maxHeight||c.frameGrams>part(c.frame).maxMass)throw Error('This frame needs a larger tower.');
 if(c.counterGrams>part(c.ballast).maxMass)throw Error('This basket cannot hold that much counterweight.');
 if(c.slingLength>part(c.sling).maxLength||c.pouchWidth>part(c.sling).width)throw Error('Fit a larger sling to use these dimensions.');
 return c;
}
export function buildFacts(c){
 const a=critter(c.animal),s=part(c.sling),wood=part(c.arm),beamGrams=wood.density*c.beamWidth**2*(c.longArm+c.shortArm)*1000;
 const counterRadius=Math.cbrt(3*(c.counterGrams/1000)/(4*Math.PI*part(c.material).density));
 const warnings=[];
 const initialCounterY=c.pivotHeight+c.shortArm*Math.sin(drawLimit(c)*Math.PI/180)-(c.mount==='hinged'&&c.chassis!=='floating'?c.hanger:0);
 if(initialCounterY<counterRadius)warnings.push('The counterweight starts below the deck. Raise the axle or reduce its size.');
 if(a.grams>s.capacity)warnings.push(`${a.name} exceeds this pouch’s ${grams(s.capacity)} capacity.`);
 if(c.pouchWidth<a.length*.7)warnings.push('The pouch opening is too small for this critter.');
 if(drawLimit(c)<c.cockAngle)warnings.push('The rail limits draw-down to '+drawLimit(c).toFixed(1)+'°. Raise the axle for more travel.');
 if(c.pivotHeight<c.shortArm+(c.mount==='hinged'?c.hanger:0)+counterRadius)warnings.push('The counterweight may hit the deck before completing its fall.');
 if(c.counterGrams*c.shortArm<(a.grams*c.longArm+beamGrams*(c.longArm-c.shortArm)/2))warnings.push('The payload side may overpower the counterweight. Expect a stall or backward motion.');
 return {beamGrams,counterRadius,warnings,ratio:c.longArm/c.shortArm,payload:a,capacity:s.capacity};
}
export function scaledPreset(animal='mouse',chassis='anchored'){
 const profiles={mouse:{},frog:{animal:'frog'},chipmunk:{animal:'chipmunk'},squirrel:{animal:'squirrel',sling:'pouch',pouchWidth:.4,rope:'hemp',counterGrams:30000,pinAngle:-60,beamWidth:.05},rabbit:{animal:'rabbit',cockAngle:28,sling:'pouch',pouchWidth:.55,rope:'hemp',ballast:'quarry',counterGrams:150000,arm:'oak',frame:'timber',longArm:3,shortArm:.8,pivotHeight:2.7,slingLength:2.7,beamWidth:.1,frameGrams:30000,baseWidth:2,pinAngle:-45},armadillo:{},fox:{}};
 const heavy={tiger:[3,220000,6500000],bear:[3,250000,7500000],elephant:[9,5000000,200000000],whale:[32,100000000,5000000000]};
 let c={...(STARTER_ANIMALS.includes(animal)?STARTER:PREVIOUS_STARTER),...profiles[animal],animal,chassis};
 if(['armadillo','fox'].includes(animal))c={...c,...profiles.rabbit,animal,sling:'cradle',rope:'cable',pouchWidth:1,beamWidth:.1,mount:'fixed',counterGrams:200000,pinAngle:-45};
 if(heavy[animal]){const [k,,mass]=heavy[animal];c={...c,cockAngle:28,arm:animal==='whale'?'colossus':'ironwood',frame:animal==='whale'?'leviathan':'giant',ballast:'continental',material:'steel',mount:'hinged',sling:animal==='whale'?'whale':animal==='elephant'?'elephant':'hammock',rope:'titanCable',bearing:'precision',release:'polished',winch:'engine',longArm:k*2.6,shortArm:k*.8,pivotHeight:k*2.7,baseWidth:k*2,beamWidth:k*.19,frameGrams:mass*.22,counterGrams:mass,hanger:k*.5,slingLength:k*2.4,pouchWidth:k*.88,axleRadius:k*.025,pinLength:k*.025,pinAngle:animal==='tiger'?-40:-45,wheelRadius:k*.22,wheelGrams:mass*.008};}
 if(heavy[animal]){c.troughLength=heavy[animal][0]*5.5;c.troughHeight=heavy[animal][0]*.06;}
 if(chassis==='walking')c={...c,longArm:c.longArm*.65,shortArm:c.longArm*.55,cockAngle:62,pivotHeight:c.longArm*1.12,walkingLean:25};
 return {...c,name:`${critter(animal).name} ${chassis}`};
}
