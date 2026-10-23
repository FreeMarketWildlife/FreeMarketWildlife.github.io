import {Polygon,Vec2} from '../vendor/planck/planck.mjs';
/** Original illustrated silhouettes, in fractions of authored length/height.
 * Mass fractions are game tuning, not biological measurements. Each fixture
 * carries its own mass; Planck derives the center of mass and moment of inertia. */
const E=(id,x,y,rx,ry,mass)=>({id,x,y,rx,ry,mass});
const profiles={
 mouse:[E('torso',0,-.055,.18,.40,.788),E('head',.205,-.02,.115,.28,.20),E('tail',-.43,-.12,.25,.025,.002),E('ear',.155,.32,.035,.18,.010)],
 frog:[E('torso',-.06,0,.34,.32,.52),E('head',.27,.15,.23,.35,.30),E('haunch',-.31,-.26,.19,.24,.18)],
 chipmunk:[E('torso',-.05,0,.32,.36,.67),E('head',.30,.08,.20,.34,.24),E('tail',-.405,.07,.095,.30,.06),E('ear',.20,.39,.065,.11,.03)],
 squirrel:[E('torso',-.01,-.06,.29,.30,.60),E('head',.32,.04,.18,.31,.20),E('tail',-.34,.12,.16,.38,.18),E('ear',.24,.40,.07,.10,.02)],
 rabbit:[E('torso',-.09,-.10,.35,.29,.65),E('head',.30,.02,.20,.28,.22),E('ears',.25,.31,.10,.19,.04),E('haunch',-.30,-.29,.20,.21,.09)],
 armadillo:[E('shell',-.03,.04,.40,.46,.80),E('head',.33,-.04,.17,.25,.14),E('tail',-.43,-.13,.07,.09,.025),E('feet',-.08,-.40,.23,.10,.035)],
 fox:[E('torso',-.02,-.03,.30,.33,.60),E('head',.32,.08,.18,.32,.24),E('tail',-.36,-.10,.14,.23,.12),E('ear',.26,.40,.065,.10,.04)],
 tiger:[E('torso',-.06,.02,.34,.38,.73),E('head',.31,.08,.19,.34,.22),E('tail',-.44,-.02,.06,.12,.02),E('feet',-.07,-.40,.25,.10,.03)],
 bear:[E('torso',-.07,-.02,.43,.40,.76),E('head',.30,.12,.20,.32,.20),E('haunch',-.24,-.35,.20,.15,.04)],
 elephant:[E('torso',-.13,.02,.37,.36,.67),E('head',.24,.12,.20,.32,.25),E('trunk',.43,-.15,.07,.35,.045),E('legs',-.10,-.38,.24,.12,.035)],
 whale:[E('body',.02,-.01,.48,.40,.87),E('flukes',-.43,-.05,.07,.39,.09),E('flipper',-.07,-.36,.18,.14,.04)],
};
export function critterBodyProfile(animal){const shapes=profiles[animal.id];if(!shapes)throw Error(`Missing physical silhouette: ${animal.id}`);return shapes.map(p=>({...p}));}
export function addCritterFixtures(body,animal,{lengthScale=1,massScale=1,mass=animal.grams/1000,options={}}={}){
 const profile=critterBodyProfile(animal),sum=profile.reduce((n,p)=>n+p.mass,0);
 // Thin parts can have their vertices merged by Planck. Use the final hull
 // area so each fixture still receives its declared mass fraction.
 for(const p of profile){const vertices=Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return Vec2((p.x+Math.cos(a)*p.rx)*animal.length/lengthScale,(p.y+Math.sin(a)*p.ry)*animal.width/lengthScale);});const shape=Polygon(vertices),hull=shape.m_vertices.slice(0,shape.m_count);let area=0;for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length];area+=a.x*b.y-a.y*b.x;}area=Math.abs(area)/2;
  const f=body.createFixture(shape,{...options,density:mass/massScale*(p.mass/sum)/area});f.setUserData({critterPart:p.id});
 }
 return profile;
}

/** Rotation-independent bounds of the actual compound fixture vertices, in metres. */
export function critterHitboxBounds(animal){
 const profile=critterBodyProfile(animal);
 const minX=Math.min(...profile.map(p=>(p.x-p.rx)*animal.length));
 const maxX=Math.max(...profile.map(p=>(p.x+p.rx)*animal.length));
 const minY=Math.min(...profile.map(p=>(p.y-p.ry)*animal.width));
 const maxY=Math.max(...profile.map(p=>(p.y+p.ry)*animal.width));
 return{minX,maxX,minY,maxY,longestSide:Math.max(maxX-minX,maxY-minY)};
}
