import {WOODLAND_ENEMIES,validateEncounterSettings} from './woodland-encounters.js?v=70';
import {CURRENT_OAK,naturalOakObjects} from './oak-world.js?v=70';
import {PROPORTIONED_TREE,PROPORTIONED_LAUNCH_Y,PROPORTIONED_LEVELS,proportionedV1StarterObjects,proportionedV2StarterObjects,proportionedV3StarterObjects,proportionedV4StarterObjects,proportionedStarterObjects,oakLaunchBayObjects} from './grove-proportioned.js?v=70';
import {ancientBough} from './grove-tree-layout.js?v=70';
import {jungleStarterObjects} from './grove-jungle.js?v=70';
import {CROWN_TREE,crownStarterObjects,launchRunStarterObjects,openingLandmarkObjects,canopyExitObjects} from './grove-starter.js?v=70';
import {isSimplePolygon,objectBounds} from './grove-geometry.js?v=70';
export {objectBounds} from './grove-geometry.js?v=70';
export const MAP_KEY='treetop-grove-map-v2';
export const LEGACY_LEVELS=Object.freeze([
 {id:'forestFloor',name:'Forest floor',low:0,high:120,color:'#b98d64'},
 {id:'jungleCanopy',name:'Lower canopy',low:120,high:240,color:'#78a976'},
 {id:'grandfatherTree',name:'Grandfather Tree',low:240,high:360,color:'#b3cf79'},
 {id:'openSky',name:'Open sky',low:360,high:480,color:'#a4d2df'},
 {id:'space',name:'Starlight',low:480,high:1500,color:'#b8a6df'}]);
export const LEVELS=Object.freeze(LEGACY_LEVELS.map(l=>Object.freeze({...l,low:l.low*2,high:l.high*2})));
export const mapLevels=map=>map?.version===2?LEGACY_LEVELS:map?.version===4?[
 {id:'forestFloor',name:'Forest floor',low:0,high:8,color:'#b98d64'},
 {id:'jungleCanopy',name:'Lower canopy',low:8,high:(map.tree?.height??map.treeHeight??74)-(map.tree?.crownDepth??56),color:'#78a976'},
 {id:'grandfatherTree',name:'Oak crown',low:(map.tree?.height??map.treeHeight??74)-(map.tree?.crownDepth??56),high:map.tree?.height??map.treeHeight??74,color:'#b3cf79'},
 {id:'space',name:'Sky to starlight',low:map.tree?.height??map.treeHeight??74,high:3000,color:'#626c9a'}
]:LEVELS;
export const spaceScale=map=>map?.version===2?1:2;
// Original creatures reuse the established game's encounter vocabulary. These
// are authored arcade encounters, not a simulation of animal biology.
export const ENEMIES=Object.freeze([
 ...WOODLAND_ENEMIES,
 {id:'beetle',kind:'beetle',name:'Archive beetle',biome:'grandfatherTree',shape:'oval',color:'#ba844c',radius:.08,effect:'spin',description:'A sturdy, springy shell.'},
 {id:'hopper',kind:'hopper',name:'Leaf hopper',biome:'grandfatherTree',shape:'leaf',color:'#8bc264',radius:.07,effect:'updraft',description:'A leafy upward bounce.'},
 {id:'cloud',kind:'cloud',name:'Raincloud',biome:'openSky',shape:'wings',color:'#d8d9f5',radius:.275,effect:'updraft',description:'A soft upward gust.'},
 {id:'bird',kind:'bird',name:'Letter bird',biome:'openSky',shape:'oval',color:'#8fc6db',radius:.15,effect:'gust',description:'A friendly nudge to the right.'},
 {id:'pod',kind:'pod',name:'Spring pod',biome:'jungleCanopy',shape:'pod',color:'#dba669',radius:.11,effect:'updraft',description:'A powerful pinball pop.'},
 {id:'vinebug',kind:'vinebug',name:'Vine bug',biome:'jungleCanopy',shape:'oval',color:'#9ab86b',radius:.06,effect:'snare',description:'Slows a rushing traveller.'},
 {id:'skid',kind:'skid',name:'Waxleaf skid',biome:'jungleCanopy',shape:'skid',color:'#68bba0',radius:.15,effect:'gust',description:'A slippery sideward bounce.'},
 {id:'fungus',kind:'fungus',name:'Round fungus',biome:'forestFloor',shape:'cap',color:'#d58fb1',radius:.2,effect:'updraft',description:'A cheerful mushroom trampoline.'},
 {id:'yokai',kind:'yokai',name:'Wandering yokai',biome:'space',shape:'yokai',color:'#b8a2e3',radius:.25,effect:'updraft',description:'A gentle low-gravity lift.'},
 {id:'fragment',kind:'fragment',name:'Ring fragment',biome:'space',shape:'pod',color:'#d8b68e',radius:.18,effect:'spin',description:'A tumbling cosmic bumper.'},
 {id:'elder-beetle',kind:'elder-beetle',model:'beetle',variant:'elder',name:'Elder archive beetle',biome:'grandfatherTree',color:'#a88767',radius:.3,effect:'spin',description:'A bigger, moss-crowned beetle. Always 60 cm across.'},
 {id:'royal-hopper',kind:'royal-hopper',model:'hopper',variant:'royal',name:'Royal leaf hopper',biome:'grandfatherTree',color:'#8bc264',radius:.24,effect:'updraft',description:'A proud leaf-crowned hopper. Always 48 cm across.'},
 {id:'crown-cloud',kind:'crown-cloud',model:'cloud',variant:'crown',name:'Crown raincloud',biome:'openSky',color:'#d8d9f5',radius:1.2,effect:'updraft',description:'A grand cloud with a golden crown. Always 2.4 m across.'},
 {id:'ancient-fungus',kind:'ancient-fungus',model:'fungus',variant:'ancient',name:'Ancient round fungus',biome:'forestFloor',color:'#d58fb1',radius:1.2,effect:'updraft',description:'A tall old mushroom with leafy whiskers. Always 2.4 m across.'}
].map(Object.freeze));
export const enemyRecipe=kind=>ENEMIES.find(e=>e.kind===kind);
export const enemySizeLabel=kind=>{const d=enemyRecipe(kind).radius*2;return d<1?`${Math.round(d*100)} cm across`:`${Number(d.toFixed(2))} m across`;};
export function gravityScaleAt(altitude,map){const k=spaceScale(map),t=Math.max(0,Math.min(1,(altitude-450*k)/(70*k)));return 1-.86*t*t*(3-2*t);}
export function levelAt(altitude,map){const levels=mapLevels(map);return levels.find(l=>altitude<l.high)??levels.at(-1);}
const shape=(id,points,extra={})=>({id,name:id.replaceAll('-',' '),type:'polygon',points:points.map(([x,y])=>({x,y})),collision:true,layer:'world',material:'wood',bounce:.32,...extra});
const enemy=(id,kind,x,y)=>({id,type:'enemy',kind,name:enemyRecipe(kind).name,x,y,radius:enemyRecipe(kind).radius,collision:true,layer:'world',material:'bumper',bounce:.88});
export function createLegacyGroveMap(){return{
 version:2,name:'Grandfather Tree',width:20000,height:1500,launch:{x:0,y:300},tree:{height:400,trunkX:-12,trunkWidth:14,doorX:-8},objects:[
  shape('launch-bough',[[-12,0],[11,0],[15,-.8],[20,-2.6],[11,-2.1],[-4,-2.9],[-12,-4.1]],{name:'Home branch'}),
  shape('far-bough',[[9,-1.2],[20,-.8],[27,2],[34,2.7],[28,1],[19,-2.3]],{name:'Branch passing behind',collision:false,layer:'back'}),
  shape('returning-bough',[[29,-8],[40,-6.5],[48,-5],[56,-5.6],[48,-7],[39,-8.2],[31,-9]],{name:'Returning branch'}),
  shape('leafy-ramp',[[52,-18],[65,-14],[69,-14],[67,-16],[54,-20]],{material:'leaf',bounce:.6}),
  shape('foreground-bough',[[-9,-5],[15,-6],[24,-8],[32,-8.1],[18,-10],[-9,-8]],{collision:false,layer:'front'}),
  shape('lower-canopy-one',[[15,-85],[47,-85],[63,-88],[51,-89],[21,-88]],{material:'leaf',bounce:.55}),
  shape('lower-canopy-two',[[65,-145],[99,-138],[112,-139],[108,-142],[69,-149]],{material:'leaf',bounce:.55}),
  shape('root-bank',[[-80,-299],[30,-299],[57,-294],[70,-296],[86,-300],[-80,-300]],{material:'stone',bounce:.3}),
  enemy('first-hopper','hopper',16,-3.6),enemy('first-beetle','beetle',26,-8),enemy('spring-return','pod',38,-5),
  enemy('sky-gust','bird',51,8),enemy('cloud-one','cloud',65,92),enemy('cloud-two','crown-cloud',105,142),
  enemy('canopy-pod','pod',39,-82),enemy('canopy-bug','vinebug',80,-118),enemy('floor-fungus','ancient-fungus',53,-292),
  enemy('star-yokai','yokai',62,208),enemy('ring-piece','fragment',112,250)
 ]};}
export function createCrownGroveMap(){const base=createLegacyGroveMap();return{...base,version:3,starterRevision:3,height:3000,launch:{x:0,y:600},tree:{...CROWN_TREE},objects:crownStarterObjects(base,enemy)};}
export function createAncientGroveMap(){const base=createCrownGroveMap();
 // Preserve the previous starter generator for exact, non-destructive upgrade
 // detection. Only a fresh/untouched starter gets the new branching routes.
 const oldBough=o=>/^(great-bough|crown-fork|bough-friend|bough-sap)-/.test(o.id),objects=base.objects.filter(o=>!oldBough(o));
 for(let row=0;row<10;row++)for(const side of[-1,1]){
  const points=ancientBough(base.tree,base.launch.y,row,side),id=`great-bough-${row}-${side}`;
  // Keep the launch shaft clear; a segment behind it is scenery, not a wall.
  const outside=points.filter(p=>side<0?p.x<-120:p.x>120);
  objects.push({id,name:`Ancient ${side<0?'west':'east'} bough ${row+1}`,type:'polygon',points:outside.length>=3?outside:points,collision:outside.length>=3,layer:outside.length>=3?'world':'back',material:'wood',bounce:.35});
 }
 return{...base,starterRevision:4,objects:[...objects,...jungleStarterObjects(enemy)]};}
export function createOpeningGroveMap(){const base=createAncientGroveMap();return{...base,starterRevision:5,objects:launchRunStarterObjects(base,enemy)};}
export function createLandmarkedGroveMap(){const base=createOpeningGroveMap();return{...base,starterRevision:6,objects:openingLandmarkObjects(base)};}
export function createV3GroveMap(){const base=createLandmarkedGroveMap();return{...base,starterRevision:7,objects:canopyExitObjects(base)};}
export function createV4Revision1GroveMap(){return{version:4,starterRevision:1,name:'Grandfather Tree',width:20000,height:3000,launch:{x:0,y:PROPORTIONED_LAUNCH_Y},tree:{...PROPORTIONED_TREE},objects:proportionedV1StarterObjects(enemy)};}
export function createV4Revision2GroveMap(){return{...createV4Revision1GroveMap(),starterRevision:2,objects:proportionedV2StarterObjects(enemy)};}
export function createV4Revision3GroveMap(){return{...createV4Revision1GroveMap(),starterRevision:3,objects:proportionedV3StarterObjects(enemy)};}
export function createV4Revision4GroveMap(){return{...createV4Revision1GroveMap(),starterRevision:4,objects:proportionedV4StarterObjects(enemy)};}
export function createV4Revision5GroveMap(){return{...createV4Revision1GroveMap(),starterRevision:5,objects:proportionedStarterObjects(enemy)};}
export function createV4Revision6GroveMap(){
 const map=createV4Revision5GroveMap();
 // Keep the home branch and all authored forest routes fixed. Only the oak's
 // upper scaffolds follow its shorter crown; custom documents stay untouched.
 map.tree={...map.tree,height:74,crownDepth:56};map.starterRevision=6;
 map.objects=map.objects.map(o=>/^oak-/.test(o.id)&&o.points?{...o,points:o.points.map(p=>({...p,y:p.y*40/78}))}:o);
 return map;
}
export function createV4Revision7GroveMap(){const map=createV4Revision6GroveMap();return{...map,starterRevision:7,objects:oakLaunchBayObjects(map)};}
export function createV4Revision8GroveMap(){const prior=createV4Revision7GroveMap();return{...prior,starterRevision:8,tree:{...CURRENT_OAK},objects:naturalOakObjects(prior,enemy,8)};}
export function createV4Revision9GroveMap(){const prior=createV4Revision7GroveMap();return{...prior,starterRevision:9,tree:{...CURRENT_OAK},objects:naturalOakObjects(prior,enemy,9)};}
export function isUntouchedV4Revision9Starter(map){return map.version===4&&map.starterRevision===9&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createV4Revision9GroveMap()));}
export function createV4Revision10GroveMap(){const prior=createV4Revision7GroveMap();return{...prior,starterRevision:10,tree:{...CURRENT_OAK},objects:naturalOakObjects(prior,enemy,10)};}
export function isUntouchedV4Revision10Starter(map){return map.version===4&&map.starterRevision===10&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createV4Revision10GroveMap()));}
export function createV4Revision11GroveMap(){const prior=createV4Revision7GroveMap();return{...prior,starterRevision:11,tree:{...CURRENT_OAK},objects:naturalOakObjects(prior,enemy)};}
export function createProportionedGroveMap(){return createV4Revision11GroveMap();}
export function isUntouchedV4Revision8Starter(map){return map.version===4&&map.starterRevision===8&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createV4Revision8GroveMap()));}
export function isUntouchedV4Revision7Starter(map){return map.version===4&&map.starterRevision===7&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createV4Revision7GroveMap()));}
export function isUntouchedV4Revision6Starter(map){return map.version===4&&map.starterRevision===6&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createV4Revision6GroveMap()));}
export function isUntouchedV4Revision5Starter(map){return map.version===4&&map.starterRevision===5&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createV4Revision5GroveMap()));}
export function isUntouchedV4Revision1Starter(map){return map.version===4&&map.starterRevision===1&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createV4Revision1GroveMap()));}
export function isUntouchedV4Revision2Starter(map){return map.version===4&&map.starterRevision===2&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createV4Revision2GroveMap()));}
export function isUntouchedV4Revision3Starter(map){return map.version===4&&map.starterRevision===3&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createV4Revision3GroveMap()));}
export function isUntouchedV4Revision4Starter(map){return map.version===4&&map.starterRevision===4&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createV4Revision4GroveMap()));}
export function createGroveMap(){return createProportionedGroveMap();}
export function isUntouchedV3Starter(map){return map.version===3&&map.starterRevision===7&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createV3GroveMap()));}
export function isUntouchedLandmarkedStarter(map){return map.version===3&&map.starterRevision===6&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createLandmarkedGroveMap()));}
export function isUntouchedOpeningStarter(map){return map.version===3&&map.starterRevision===5&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createOpeningGroveMap()));}
export function isUntouchedAncientStarter(map){return map.version===3&&map.starterRevision===4&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createAncientGroveMap()));}
export function isUntouchedCrownStarter(map){return map.version===3&&map.starterRevision===3&&JSON.stringify(validateGroveMap(map))===JSON.stringify(validateGroveMap(createCrownGroveMap()));}
export function groveTreeBounds(map){const t=map.tree,r=t.crownRadius??t.trunkWidth*3.6;return{minX:t.trunkX-r-40,maxX:Math.max(220,t.trunkX+r+40),minY:-map.launch.y-20,maxY:t.height-map.launch.y+50};}
const finite=(v,lo,hi)=>Number.isFinite(v)&&v>=lo&&v<=hi;
export function validateGroveMap(value){
 const proportioned=value?.version===4;
 if(!value||![2,3,4].includes(value.version)||typeof value.name!=='string'||!value.name.trim()||value.name.length>80||value.width!==20000||(proportioned?value.height!==3000:!finite(value.height,600,3000))||!Array.isArray(value.objects)||value.objects.length>2000)throw Error('Use a Grove map, with a name and no more than 2,000 objects.');
 if(value.launch?.x!==0||value.launch?.y!==(value.version===2?300:value.version===4?PROPORTIONED_LAUNCH_Y:600))throw Error('The launch stays on its authored home branch.');
 if(!value.tree||!finite(value.tree.height,value.version===4?40:350,value.version===4?140:1800)||!finite(value.tree.trunkX,-1500,-5)||!finite(value.tree.trunkWidth,value.version===4?.5:5,value.version===4?20:1000)||!finite(value.tree.doorX,-100,-3))throw Error('Invalid Grandfather Tree dimensions.');
 if(value.starterRevision!==undefined&&(!Number.isInteger(value.starterRevision)||value.starterRevision<1||value.starterRevision>100))throw Error('Invalid starter revision.');
 const seen=new Set();let vertexCount=0,patrolCount=0;
 const objects=value.objects.map(o=>{
  if(!o||typeof o.id!=='string'||!o.id||o.id.length>100||seen.has(o.id)||!['polygon','chain','circle','enemy'].includes(o.type))throw Error('Every object needs a unique ID and a supported shape.');seen.add(o.id);
  if(typeof o.collision!=='boolean'||!['back','world','front'].includes(o.layer)||!['wood','leaf','stone','bumper','foliage','sap'].includes(o.material)||!finite(o.bounce,0,1))throw Error('Invalid collision, depth layer, material or bounce setting.');
  const n={id:o.id,type:o.type,name:typeof o.name==='string'?o.name.slice(0,80):o.id,collision:o.collision,layer:o.layer,material:o.material,bounce:o.bounce};
  if(o.type==='polygon'||o.type==='chain'){
   if(!Array.isArray(o.points)||o.points.length<(o.type==='polygon'?3:2)||o.points.length>(o.type==='polygon'?128:256))throw Error('Polygons use 3–128 points; paths use 2–256 points.');
   n.points=o.points.map(p=>{if(!p||!finite(p.x,-1500,20000)||!finite(p.y,-value.launch.y,value.height-value.launch.y))throw Error('Keep points inside the world: x −1,500…20,000 m and inside the authored altitude range.');return{x:p.x,y:p.y};});
   vertexCount+=n.points.length;if(vertexCount>18000)throw Error('The map has too many collision vertices. Simplify a few shapes.');
   if(o.type==='polygon'&&!isSimplePolygon(n.points))throw Error('Polygon edges cannot cross or double back.');
   if(o.type==='chain'&&n.points.some((p,i)=>i&&Math.hypot(p.x-n.points[i-1].x,p.y-n.points[i-1].y)<.002))throw Error('Path points must be distinct.');
  }else{
   if(!finite(o.x,-1500,20000)||!finite(o.y,-value.launch.y,value.height-value.launch.y)||!finite(o.radius,.03,500))throw Error('Invalid circle position or radius (0.03–500 m).');
   Object.assign(n,{x:o.x,y:o.y,radius:o.radius});
   if(o.type==='enemy'){const recipe=enemyRecipe(o.kind);if(!recipe)throw Error('Unknown enemy. Choose one from the illustrated palette.');n.kind=o.kind;n.radius=recipe.radius;if(o.encounter!==undefined){n.encounter=validateEncounterSettings(o.encounter,o.kind);if(n.encounter.motion!=='still'&&++patrolCount>128)throw Error('Use no more than 128 moving encounters per map.');const e=n.encounter;if(o.x+e.dx< -1500||o.x+e.dx>20000||o.y+Math.min(0,e.motion==='walk'?0:e.dy)< -value.launch.y||o.y+Math.max(0,e.motion==='walk'?0:e.dy)+(e.motion==='bounce'?e.height:0)>value.height-value.launch.y)throw Error('Keep encounter routes inside the world.');}}
  }
  if(['foliage','sap'].includes(o.material)&&!['polygon','circle'].includes(o.type))throw Error('Leaves and sap need a closed polygon or circle.');
  if(o.material==='foliage'){const d=o.density??16;if(!finite(d,.1,180))throw Error('Leaf density must be 0.1–180.');n.density=d;}
  return n;
 });
 const tree={height:value.tree.height,trunkX:value.tree.trunkX,trunkWidth:value.tree.trunkWidth,doorX:value.tree.doorX};if(value.version===3||value.version===4){tree.crownRadius=value.tree.crownRadius??(value.version===4?PROPORTIONED_TREE.crownRadius:500);tree.crownDepth=value.tree.crownDepth??(value.version===4?PROPORTIONED_TREE.crownDepth:350);if(!finite(tree.crownRadius,value.version===4?5:100,value.version===4?80:1500)||!finite(tree.crownDepth,value.version===4?10:50,value.version===4?120:1200))throw Error('Invalid crown size.');}return{version:value.version,...(value.starterRevision?{starterRevision:value.starterRevision}:{}),name:value.name.trim(),width:20000,height:value.height,launch:{x:0,y:value.launch.y},tree,objects};
}
export function readGroveMap(storage){try{const raw=(storage??globalThis.localStorage)?.getItem(MAP_KEY);if(!raw)return null;const map=validateGroveMap(JSON.parse(raw));return (isUntouchedLegacyStarter(map)||isUntouchedCrownStarter(map)||isUntouchedAncientStarter(map)||isUntouchedOpeningStarter(map)||isUntouchedLandmarkedStarter(map)||isUntouchedV3Starter(map)||isUntouchedV4Revision1Starter(map)||isUntouchedV4Revision2Starter(map)||isUntouchedV4Revision3Starter(map)||isUntouchedV4Revision4Starter(map)||isUntouchedV4Revision5Starter(map)||isUntouchedV4Revision6Starter(map)||isUntouchedV4Revision7Starter(map)||isUntouchedV4Revision8Starter(map)||isUntouchedV4Revision9Starter(map)||isUntouchedV4Revision10Starter(map))?createGroveMap():map;}catch{return null;}}
export function saveGroveMap(storage,value){const map=validateGroveMap(value);storage.setItem(MAP_KEY,JSON.stringify(map));return map;}

export function isUntouchedLegacyStarter(map){
 if(map.version!==2||map.name!=='Grandfather Tree'||map.tree.height!==400||map.tree.trunkWidth!==14||map.tree.trunkX!==-12||map.tree.doorX!==-8||map.height!==1500)return false;const old=createLegacyGroveMap();if(map.objects.length!==old.objects.length)return false;
 return old.objects.every(o=>{const n=map.objects.find(n=>n.id===o.id);if(!n)return false;const keys=o.points?['type','name','collision','layer','material','bounce','points']:['type','name','kind','collision','layer','material','bounce','x','y'];return keys.every(k=>k==='kind'&&((o.id==='cloud-two'&&n.kind==='cloud')||(o.id==='floor-fungus'&&n.kind==='fungus'))||k==='name'&&((o.id==='cloud-two'&&n.name==='Raincloud')||(o.id==='floor-fungus'&&n.name==='Round fungus'))||JSON.stringify(n[k])===JSON.stringify(o[k]));});
}
