/** Construction choices use SI units and modify real fixture mass and geometry. */
export const workshopDefaults=Object.freeze({counterKind:'rock',counterMass:140,slingPieces:0,foundation:0,wood:'oak',longArm:3,shortArm:.8,counterMount:'fixed',hangerLength:.65,hookDegrees:203.4});
export const counterMaterials=Object.freeze({rock:{label:'Rock',density:2700},basket:{label:'Stone basket',density:1700},iron:{label:'Iron block',density:7800}});
export function workshopConfig(choice,base={}){
 const c={...workshopDefaults,...choice};
 if(!['fixed','hinged'].includes(c.counterMount))throw Error('Choose a counterweight mounting');
 if(!counterMaterials[c.counterKind]||!['oak','pine','heavy'].includes(c.wood))throw Error('Choose a Workshop material');
 for(const [key,min,max]of [['counterMass',20,300],['longArm',2.2,3.6],['shortArm',.5,1],['slingPieces',0,3],['foundation',0,3],['hangerLength',.3,1],['hookDegrees',180,225]])if(!Number.isFinite(c[key])||c[key]<min||c[key]>max)throw Error(`Workshop ${key} outside supported range`);
 if(!Number.isInteger(c.slingPieces)||!Number.isInteger(c.foundation))throw Error('Construction pieces must be whole numbers');
 return {...base,...(c.counterMount==='hinged'?{solverVelocityIterations:Math.max(40,base.solverVelocityIterations??20)}:{}),counterMount:c.counterMount,counterHanger:c.hangerLength,hookAngle:c.hookDegrees*Math.PI/180,counterKind:c.counterKind,counterMass:c.counterMass,longArm:c.longArm,shortArm:c.shortArm,beamLinearDensity:{oak:8/3.8,pine:1.6,heavy:3.1}[c.wood],woodKind:c.wood,slingPieces:c.slingPieces,sling:2.5+c.slingPieces*.15,pouchPanelMass:.5+c.slingPieces*.06,frameMass:30+c.foundation*15,frameFriction:base.frameFriction??.65,foundationBraces:c.foundation};
}
export function counterRadius(p){return Math.cbrt(3*p.counterMass/(4*Math.PI*counterMaterials[p.counterKind].density));}
export function counterOutline(p){const r=counterRadius(p);return (p.counterKind==='rock'?[[1,0],[.55,.85],[-.35,1],[-1,.3],[-.75,-.65],[.25,-.95]]:[[-1,-1],[1,-1],[1,1],[-1,1]]).map(([x,y])=>({x:-p.shortArm+x*r,y:y*r}));}

/** Current physical weight center, never the beam endpoint for a swinging weight. */
export function counterCenter(scene){
 if(scene.counterWeight)return scene.counterWeight.getWorldCenter();
 for(let f=scene.arm.getFixtureList();f;f=f.getNext())if(f.getUserData()?.role==='counterweight'){const data={center:{x:0,y:0}};f.getMassData(data);return scene.arm.getWorldPoint(data.center);}
 return scene.arm.getWorldPoint({x:-scene.p.shortArm,y:0});
}
