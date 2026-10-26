/** Original test-bed rigs. Metres/kg are arbitrary calibration units, NOT biological data.
 * Profiles describe gameplay proportions; the squirrel uses the passive flight-only glide model.
 * Bodies use local rig x/y; capsules run along their local x axis (length includes endcaps).
 */
const circle=(id,x,y,r,f)=>({id,x,y,angle:0,shape:{type:'circle',radius:r},massFraction:f});
const capsule=(id,x,y,length,radius,f)=>({id,x,y,angle:0,shape:{type:'capsule',length,radius},massFraction:f});
const box=(id,x,y,width,height,f)=>({id,x,y,angle:0,shape:{type:'box',width,height},massFraction:f});
const hinge=(a,b,limit=.7)=>({a,b,minAngle:-limit,maxAngle:limit});
const quadruped=(torso,head,tail,legs)=>[torso,head,tail,...legs];
const legs=(x,y,r,f)=>[capsule('rear-leg',-x,y,r*3,r,f),capsule('front-leg',x,y,r*3,r,f)];
const definition=(id,label,mass,friction,color,bodies,joints,extra={})=>({id,label,totalMass:mass,friction,restitution:.32,color,queueWeight:10,glideCoefficient:0,provisional:false,bodies,joints,...extra});
const standardJoints=(tailLimit=.8)=>[hinge('torso','head',.5),hinge('torso','tail',tailLimit),hinge('torso','rear-leg',.95),hinge('torso','front-leg',.95)];
export const profiles=[
 definition('lizard','Lizard',.65,.38,'#83a950',quadruped(capsule('torso',0,0,.52,.085,.40),capsule('head',.31,.035,.22,.09,.16),capsule('tail',-.43,0,.46,.045,.16),legs(.17,-.12,.04,.14)),standardJoints(1.1)),
 definition('salamander','Salamander',.8,.075,'#ed9961',quadruped(capsule('torso',0,0,.58,.10,.44),circle('head',.33,.015,.12,.18),capsule('tail',-.42,0,.35,.065,.14),legs(.19,-.11,.035,.12)),standardJoints(1)),
 definition('mouse','Mouse',.75,.19,'#b6b0a9',quadruped(capsule('torso',0,0,.38,.135,.49),circle('head',.25,.07,.12,.22),capsule('tail',-.38,0,.43,.018,.05),legs(.12,-.15,.035,.12)),standardJoints(1.4)),
 // Move 4% of total mass from shell to tail: retain total mass/geometry/limits,
 // avoiding a low-inertia tail contact artifact verified by the incoming-state test.
 definition('turtle','Turtle',2.4,.20,'#78965d',quadruped(circle('torso',0,0,.25,.74),capsule('head',.30,0,.19,.075,.08),capsule('tail',-.29,-.02,.12,.025,.06),legs(.15,-.19,.055,.06)),standardJoints(.35),{massNote:'74% of mass in the carapace body; 6% in the tail maintains finite contact inertia.'}),
 definition('snake','Snake',1.1,.14,'#86bca2',Array.from({length:7},(_,i)=>capsule(i===0?'head':`segment-${i}`, .6-i*.2,0,.25,i===0?.085:.065,i===0?.16:.14)),Array.from({length:6},(_,i)=>hinge(i===0?'head':`segment-${i}`,`segment-${i+1}`,1.05)),{quirk:'Flexible articulated chain; no propulsion or steering force is implied.'}),
 definition('chipmunk','Chipmunk',1,.22,'#be8055',quadruped(capsule('torso',0,0,.44,.14,.43),circle('head',.27,.075,.13,.20),capsule('tail',-.36,.09,.32,.09,.13),legs(.14,-.16,.045,.12)),standardJoints(1.2)),
 definition('flying-squirrel','Flying squirrel',.9,.16,'#b9a394',[capsule('torso',0,0,.43,.13,.42),circle('head',.27,.06,.12,.18),capsule('tail',-.40,.01,.40,.08,.12),box('rear-membrane',-.13,-.12,.22,.04,.14),box('front-membrane',.13,-.12,.26,.04,.14)],[hinge('torso','head',.5),hinge('torso','tail',1.1),hinge('torso','rear-membrane',.65),hinge('torso','front-membrane',.65)],{queueWeight:.15,glideCoefficient:1,quirk:'Very rare; passive membrane and tail aerodynamics apply only after release; left flares and right dives.'}),
 definition('armadillo','Armadillo',5,.24,'#9c8a7b',quadruped(capsule('torso',0,0,.61,.23,.68),capsule('head',.40,-.015,.25,.09,.12),capsule('tail',-.47,-.025,.32,.045,.06),legs(.20,-.23,.055,.07)),standardJoints(.6)),
 definition('small-marsupial','Pygmy possum',.7,.26,'#cea99d',quadruped(capsule('torso',0,0,.34,.13,.43),circle('head',.22,.07,.13,.23),capsule('tail',-.36,.03,.42,.025,.10),legs(.11,-.15,.035,.12)),standardJoints(1.5),{provisional:false}),
 definition('tiny-primate','Pygmy marmoset',.85,.30,'#c4a374',[capsule('torso',0,0,.27,.14,.40),circle('head',.12,.23,.14,.24),capsule('tail',-.29,-.015,.50,.03,.10),capsule('rear-leg',-.08,-.20,.30,.045,.13),capsule('front-leg',.19,.02,.33,.04,.13)],standardJoints(1.3),{provisional:false}),
 definition('frog','Frog',1.05,.18,'#83b86b',[capsule('torso',0,0,.32,.16,.42),circle('head',.20,.075,.15,.22),capsule('rear-thigh',-.20,-.10,.32,.08,.16),capsule('rear-shin',-.22,-.24,.35,.045,.10),capsule('front-leg',.17,-.17,.22,.04,.10)],[hinge('torso','head',.25),hinge('torso','rear-thigh',1.1),hinge('rear-thigh','rear-shin',1.5),hinge('torso','front-leg',.9)])
];
export const speciesProfiles=profiles;
export function createRig(profileId){
 const profile=profiles.find(p=>p.id===profileId);if(!profile)throw new RangeError(`Unknown species: ${profileId}`);
 const result=structuredClone(profile);result.bodies.forEach(b=>{b.mass=b.massFraction*result.totalMass;});
 result.joints.forEach(j=>{const a=result.bodies.find(b=>b.id===j.a),b=result.bodies.find(b=>b.id===j.b);const x=(a.x+b.x)/2,y=(a.y+b.y)/2;j.anchorA={x:x-a.x,y:y-a.y};j.anchorB={x:x-b.x,y:y-b.y};j.referenceAngle=b.angle-a.angle;});
 return result;
}
/** Seedable queue encapsulates its future. Only current + at most 3 next are exposed. */
export function createVolunteerQueue(seed=1){
 if(!Number.isInteger(seed))throw new TypeError('Queue seed must be an integer');let state=seed>>>0;
 const random=()=>{state=(state+0x6D2B79F5)>>>0;let n=state;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;};
 const total=profiles.reduce((s,p)=>s+p.queueWeight,0);
 const choose=()=>{let n=random()*total;for(const p of profiles){n-=p.queueWeight;if(n<0)return p.id;}return profiles.at(-1).id;};
 const queue=Array.from({length:4},choose);
 return Object.freeze({get current(){return queue[0];},peek(count=3){if(!Number.isInteger(count)||count<0||count>3)throw new RangeError('Peek count must be 0–3');return queue.slice(1,count+1);},consume(){const previous=queue.shift();queue.push(choose());return previous;}});
}
