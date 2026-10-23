import {branchPolygon} from './grove-branches.js?v=49';

// A deliberately fantastic old oak, surrounded by trees on a tropical-forest
// scale. All measurements are metres; no saved map is rescaled to these values.
export const PROPORTIONED_LAUNCH_Y=32;
export const PROPORTIONED_TREE=Object.freeze({height:110,trunkX:-8,trunkWidth:7,doorX:-4,crownRadius:38,crownDepth:64});
export const PROPORTIONED_LEVELS=Object.freeze([
 {id:'forestFloor',name:'Forest floor',low:0,high:8,color:'#b98d64'},
 {id:'jungleCanopy',name:'Jungle canopy',low:8,high:45,color:'#78a976'},
 {id:'grandfatherTree',name:'Grandfather Tree',low:45,high:110,color:'#b3cf79'},
 {id:'openSky',name:'Open sky',low:110,high:960,color:'#a4d2df'},
 {id:'space',name:'Starlight',low:960,high:3000,color:'#b8a6df'}
].map(Object.freeze));
const point=(x,y)=>({x,y});
const ellipse=(x,y,rx,ry)=>Array.from({length:16},(_,i)=>point(x+Math.cos(i*Math.PI/8)*rx,y+Math.sin(i*Math.PI/8)*ry));

/** The only solid bough faces are these editor polygons. Background trunks and
 * leaf masses explicitly have collision:false; illustrations add no fixtures. */
export function proportionedV1StarterObjects(makeEnemy){
 const objects=[],floor=-PROPORTIONED_LAUNCH_Y;
 const poly=(id,name,points,material='wood',bounce=.35,extra={})=>{
  const o={id,name,type:'polygon',points,collision:true,layer:'world',material,bounce,...extra};objects.push(o);return o;
 };
 const branch=(id,name,a,b,width,tipWidth=width*.35,extra={})=>poly(id,name,branchPolygon(a,b,width,tipWidth),'wood',.38,extra);
 const backdrop={collision:false,layer:'back',bounce:0};
 // Preserve the level contact face beneath the existing 1.2m launcher. The
 // lower outline is a major oak scaffold, narrowing below one metre at its tip.
 poly('launch-bough','Home branch',[
  point(-20,0),point(11,0),point(15,-.8),point(20,-2.6),
  point(19.8,-2.78),point(14.9,-1.08),point(10.9,-.55),point(-9,-3),point(-20,-.65)
 ],'wood',.32);
 // Great scaffolds attach above the large launcher swing envelope; their
 // shorter forks remain narrow. No invisible lower boughs block the beam.
 for(const[row,y,x,endY,width]of[[0,50,14,59,1.8],[1,55,22,66,1.5],[2,61,18,73,1.1],[3,66,9,76,.65]])for(const side of[-1,1]){
  const a=point(-8,y),b=point(-8+side*(x+8),endY),label=side<0?'west':'east';
  branch(`oak-scaffold-${row}-${label}`,`Oak ${label} scaffold ${row+1}`,a,b,width,[.35,.28,.2,.12][row]);
  const fork=point(a.x+(b.x-a.x)*.79,a.y+(b.y-a.y)*.79);
  branch(`oak-twig-${row}-${label}`,`Oak ${label} fork ${row+1}`,fork,point(fork.x+side*(3+row),fork.y+2.1+row*.3),.24-row*.035,.08);
  for(let j=0;j<2;j++)poly(`oak-leaves-${row}-${label}-${j}`,'Oak leaf cluster',ellipse(b.x-side*(1+j*3),b.y+1+j*.7,2.8,1.6),'foliage',0,{density:.5});
 }
 // Four small, flexible stem clusters form the first authored bounce route.
 // Horizontal spans are 6,6,6,8m; physical thickness is only 18cm.
 for(const[i,x,y,endX,endY]of[[1,22,-3.8,28,-6.8],[2,32,-10,38,-13],[3,42,-18,48,-21],[4,52,-27,60,-31]]){
  poly(`opening-skip-${i}`,['','Sunlit stems','Waxleaf stems','Fern stems','Low canopy stems'][i],
   [point(x,y),point(endX,endY),point(endX,endY-.18),point(x,y-.18)],'leaf',.87);
 }
 poly('opening-rescue-mat','Lower fork · fern stems',[point(30.5,-13.5),point(34.5,-15.5),point(34.5,-15.68),point(30.5,-13.68)],'leaf',.78);
 branch('opening-rest-terrace','Lower fork · fallen bough',point(37,-24),point(44,-24),.35,.18,{bounce:.48});
 // Recognizable seedpods beside the first two landings stay off the play plane.
 for(const[i,x,y]of[[1,24.7,-5.15],[2,35.5,-11.75]]){
  branch(`opening-landmark-${i}-stem`,'Seedpod stalk',point(x,y-.25),point(x+.09,y+.55),.08,.06,backdrop);
  for(const[j,dx,dy,r]of[[0,.09,.66,.16],[1,-.12,.4,.1],[2,.23,.35,.09]])objects.push({id:`opening-landmark-${i}-pod-${j}`,name:'Seedpod · background',type:'circle',x:x+dx,y:y+dy,radius:r,material:'bumper',...backdrop});
 }
 // These rooted background silhouettes define the neighbouring forest. Their
 // bounds are shared with the V4 renderer; no procedural giant trunks are added.
 for(const[i,x,height,diameter,radius,depth]of[[0,-35,40,1.2,6,11],[1,52,35,.85,5.5,9],[2,84,45,1.3,7,12],[3,120,60,1.6,8,14]]){
  const top=height-PROPORTIONED_LAUNCH_Y;
  poly(`amazon-tree-${i}-trunk`,i===3?'Emergent forest tree · 60m':'Canopy tree · '+height+'m',[
   point(x-diameter/2,floor),point(x+diameter/2,floor),point(x+diameter*.08,top),point(x-diameter*.08,top)
  ],'wood',0,backdrop);
  poly(`amazon-tree-${i}-crown`,'Forest tree crown · background',ellipse(x,top-depth/2,radius,depth/2),'foliage',0,{...backdrop,density:.5});
  for(let j=0;j<2;j++){
   const side=j?-1:1,a=point(x,top-depth+1.2+j*2),b=point(x+side*(3.5+i*.5),a.y+.8);
   branch(`amazon-bough-${i}-${j}`,'Forest twig bough',a,b,.22+i*.025,.08,{bounce:.48});
  }
 }
 // Small ground logs and pebbles, not broad terraces filling every air gap.
 for(const[i,x,length,diameter]of[[0,8,3.5,.3],[1,38,5,.4],[2,68,4.5,.28],[3,95,4,.25],[4,128,6,.5]]){
  branch(`floor-log-${i}`,'Fallen log',point(x,floor+diameter/2),point(x+length,floor+diameter/2),diameter,diameter*.75,{bounce:.38});
  const px=x+length+1,rx=.16+i*.025,ry=.14+i*.018;
  poly(`floor-stone-${i}`,'Small forest stone',ellipse(px,floor+ry,rx,ry),'stone',.28);
  poly(`floor-leaves-${i}`,'Leaf litter · background',ellipse(x+length*.5,floor+.16,1.2,.15),'foliage',0,{...backdrop,density:.5});
 }
 // Optional small targets use canonical species radii, never scaled copies.
 for(const[id,kind,x,y]of[
  ['first-beetle','beetle',17,-3],['first-hopper','hopper',29,-7.8],['spring-return','pod',39,-14.5],
  ['opening-exit-skid','skid',63,-29],['forest-pod','pod',73,-30.8],['canopy-bug','vinebug',50,-12],
  ['sky-gust','bird',29,19],['cloud-one','cloud',43,42],['cloud-two','crown-cloud',-30,65],
  ['elder-beetle-one','elder-beetle',-35,60.3],['royal-hopper-one','royal-hopper',-27,68.3],
  ['floor-fungus','ancient-fungus',-20,floor+1.2],['small-floor-fungus','fungus',89,floor+.2],
  ['star-yokai','yokai',62,1000],['ring-piece','fragment',112,1400]
 ])objects.push(makeEnemy(id,kind,x,y));
 return objects;
}

/** Revision two broadens actual flight routes with small, real branches. The
 * original generator remains callable for non-destructive migration detection. */
export function proportionedV2StarterObjects(makeEnemy){
 const objects=proportionedV1StarterObjects(makeEnemy),floor=-PROPORTIONED_LAUNCH_Y;
 const poly=(id,name,points,material='wood',bounce=.55,extra={})=>objects.push({id,name,type:'polygon',points,collision:true,layer:'world',material,bounce,...extra});
 const limb=(id,name,x,y,length,rise=0,width=.2,material='wood',bounce=.58)=>poly(id,name,branchPolygon(point(x,y),point(x+length,y+rise),width,width*.6),material,bounce);
 const backdrop={collision:false,layer:'back',bounce:0};
 const tree=(index,x,height,diameter=1.05)=>{
  const top=height-PROPORTIONED_LAUNCH_Y,depth=height===60?13:10,radius=height===60?7:5.5;
  poly(`amazon-tree-${index}-trunk`,height===60?'Emergent forest tree · 60m':`Canopy tree · ${height}m`,[point(x-diameter/2,floor),point(x+diameter/2,floor),point(x+.1,top),point(x-.1,top)],'wood',0,backdrop);
  poly(`amazon-tree-${index}-crown`,'Forest tree crown · background',ellipse(x,top-depth/2,radius,depth/2),'foliage',0,{...backdrop,density:.5});
 };
 // These shallow perches catch a descending critter on their top, rather than
 // placing circular blockers directly in the ascent. Widths stay in metres.
 tree(4,14,45,.8);tree(5,47,60,1.25);tree(6,62,60,1.2);tree(25,93,60,1.15);tree(26,116,60,1.2);
 for(const[i,x,y,length,rise]of[[0,9,5.8,7,0],[1,10,8.5,7,0],[2,44,13.8,7,0],[3,60,23,7,-.1],[4,84,18.5,7,-.2],[5,105,12,7,-.25]])limb(`route-perch-${i}`,'Forest landing bough',x,y,length,rise,.18,'leaf',.7);
 for(const[i,x,y,length,rise]of[[0,17,1.2,7,-3.5],[1,18.5,-3.9,7,-3.5],[2,18.5,-8.3,7,-3.5],[3,25.5,-12.8,6,-2.4],[4,28,-5.5,6,-2],[5,35,-12,6,-2.5],[6,39,-21.5,7,-2.1],[7,46,-25.5,7,-2]]){
  poly(`route-opening-catch-${i}`,'Fern-stem fork',[point(x,y),point(x+length,y+rise),point(x+length,y+rise-.18),point(x,y-.18)],'leaf',.8);
 }
 // Continuing forest bays provide multiple useful heights after a longer
 // throw. Background trees have no fixtures; only these short limbs are solid.
 for(let col=0;col<18;col++){
  const x=130+col*35,height=[38,45,34,60,42,36][col%6];tree(col+7,x,height,.85+(col%3)*.15);
  for(let row=0;row<3;row++){
   const altitude=[7,18,height-7][row]+Math.sin(col*1.7+row)*.9,start=x+(row%2?-2:1);
   limb(`route-forest-bough-${col}-${row}`,'Forest branch',start,altitude-PROPORTIONED_LAUNCH_Y,5+(col+row)%3,.35+Math.sin(col+row)*.3,.18+row*.04,row===1?'leaf':'wood',row===1?.72:.5);
   if(row===1)objects.push(makeEnemy(`route-forest-friend-${col}`,['beetle','hopper','skid'][col%3],start+3,altitude-PROPORTIONED_LAUNCH_Y+.4));
  }
  limb(`route-floor-log-${col}`,'Fallen forest log',x-5,floor+.18,3.5+col%3*.5,.03,.34,'wood',.42);
  poly(`route-floor-stone-${col}`,'Forest stone',ellipse(x+7,floor+.24,.3,.24),'stone',.4);
 }
 // Supported emergent bays bridge the ordinary upgraded descents. Each face
 // is a short real bough; no airborne wall or extra encounter impulse is added.
 for(const[i,x,y,height]of[[0,85,21.5,60],[1,115,20,60],[2,140,16,60],[3,165,10,45],[4,190,3,40]]){
  tree(27+i,x+3,height,1.2);limb(`route-mid-bay-${i}`,'Emergent landing bough',x,y,7,-.05,.24,'leaf',.72);
 }
 for(let i=0;i<11;i++){
  const x=185+i*45;tree(32+i,x+4,60,1.25);
  limb(`route-upper-bay-${i}-a`,'Emergent canopy bough',x,25,7,-.1,.25,'leaf',.72);
  limb(`route-upper-bay-${i}-b`,'Emergent canopy fork',x+8,23.5,7,.15,.2,'wood',.62);
 }
 // Short intermediate forks join the descent bands between canopy bays.
 // These supported top faces catch a range of prepared poses; they do not
 // assign flight velocity or change any encounter size or launcher contact.
 for(const[i,x,y,height]of[[0,41.2,-12.2,30],[1,57.7,13.1,60],[2,112.1,11.6,45],[3,177.1,18.4,60],[4,324.8,-19.7,30],[5,293.6,-18.9,30],[6,320.5,4.6,45],[7,350,8.1,45],[8,146.5,24.9,60],[9,218.1,17.1,60],[10,250.7,21.1,60],[11,255.8,13.5,60]]){
  tree(43+i,x+2,height,1.05);limb(`route-descent-fork-${i}`,i>=8?'Sturdy landing fork':'Forest descent fork',x,y,7,-.08,.2,i>=8?'wood':'leaf',i>=8?.38:.68);
 }
 return objects;
}

/** Four rare emergents join the upper prepared-flight route. The height ceiling
 * is anchored to the measured 88.5m Dinizia excelsa; crown/branch dimensions
 * and positions below are authored game geometry, not botanical measurements.
 * https://www.botanic.cam.ac.uk/expedition-finds-the-tallest-tree-in-the-amazon/
 * Trunks/crowns are background props; every supporting bough is its editable
 * visible polygon. No collision wall, scaled encounter or extra impulse. */
export function proportionedV3StarterObjects(makeEnemy){
 const objects=proportionedV2StarterObjects(makeEnemy),floor=-PROPORTIONED_LAUNCH_Y;
 const poly=(id,name,points,material,bounce,extra={})=>objects.push({id,name,type:'polygon',points,collision:true,layer:'world',material,bounce,...extra});
 const bough=(id,name,x,y,endX,endY,width=.32,material='wood',bounce=.58)=>poly(id,name,branchPolygon(point(x,y),point(endX,endY),width,width*.45),material,bounce);
 const back={collision:false,layer:'back',bounce:0};
 for(const[i,x,height,diameter,branches]of[
  [55,96,88.5,2.2,[[0,-1,36.8,6,38,.38,'wood',.58],[1,0,40.5,-7,42.5,.32,'leaf',.72],[2,0,52.8,-7,54.6,.36,'wood',.38],[3,0,54.6,7,55.4,.22,'leaf',.55]]],
  [56,182,88.5,2.1,[[0,-1,41,6,43,.42,'wood',.58],[1,0,48.2,-7,50.2,.32,'leaf',.72],[2,0,54.2,7,55.3,.22,'wood',.38]]],
  [57,240,88.5,2.2,[[0,0,39.2,7,40.5,.4,'wood',.38],[1,0,47.1,-7,48.5,.3,'wood',.38],[2,0,54.5,7,55.6,.22,'wood',.38]]],
  [58,310,85,2,[[0,0,36.8,7,38.2,.4,'wood',.38],[1,0,44,-7,45.5,.3,'leaf',.55],[2,0,51.6,7,52.5,.22,'leaf',.55]]]
 ]){
  const top=height-32;
  poly(`amazon-tree-${i}-trunk`,`Rare emergent · ${height}m · background`,[point(x-diameter/2,floor),point(x+diameter/2,floor),point(x+.15,top),point(x-.15,top)],'wood',0,back);
  poly(`amazon-tree-${i}-crown`,'Rare emergent crown · background',ellipse(x,top-8,9,8),'foliage',0,{...back,density:.5});
  for(const[j,dx,y,endDx,endY,width,material,bounce]of branches)bough(`route-rare-bough-${i}-${j}`,'Rare emergent bough',x+dx,y,x+endDx,endY,width,material,bounce);
 }
 return objects;
}

/** A short return fork on the existing 45m tree. Visible passive contact, not
 * a larger tree, invisible barrier, enlarged animal or powered launch. */
export function proportionedV4StarterObjects(makeEnemy){
 const objects=proportionedV3StarterObjects(makeEnemy);
 objects.push({id:'corridor-return-fork',name:'Forest return fork',type:'polygon',points:branchPolygon(point(352,-7),point(345,-6),.25,.10),collision:true,layer:'world',material:'wood',bounce:.5});
 return objects;
}

/** An open-sided return through existing trunks. Descending faces continue
 * forward instead of opposing west/east roofs that can trap a larger body.
 * These are ordinary visible passive map polygons, not conditional fixtures. */
export function proportionedStarterObjects(makeEnemy){
 const objects=proportionedV4StarterObjects(makeEnemy);
 for(const[id,name,x,h,endX,endH,material,bounce]of[
  ['crown-west','Crown return · west',93,46,86,46.5,'leaf',.61],
  ['crown-east','Crown return · east',93,46,100,44.5,'wood',.55],
  ['middle','Mid-canopy return',116,43,123,41.5,'wood',.55],
  ['lower','Lower canopy return',120,28,127,27,'wood',.55],
  ['exit','Forest return · exit',130,20,137,18.5,'wood',.55]
 ])objects.push({id:'forest-return-'+id,name,type:'polygon',points:branchPolygon(point(x,h-PROPORTIONED_LAUNCH_Y),point(endX,endH-PROPORTIONED_LAUNCH_Y),.22,.10),collision:true,layer:'world',material,bounce});
 return objects;
}

/** A visibly open launch bay in the74m oak. The west scaffolds sit below the
 * home deck; the east crown grows above the arm sweep. Every retained bough
 * remains an ordinary solid polygon in the shared authoring/runtime map. */
export function oakLaunchBayObjects(map){
 const replacements=new Map(),pointAt=(x,height)=>({x,y:height-map.launch.y});
 const limb=(id,a,b,width,tip)=>replacements.set(id,branchPolygon(a,b,width,tip));
 for(const[row,reach,width,tip]of[[0,14,1.8,.35],[1,22,1.5,.28],[2,18,1.1,.2],[3,9,.65,.12]])for(const side of[-1,1]){
  const west=side<0,rootHeight=(west?[19.5,22,24.5,27]:[66,67.5,69,70.5])[row],tipHeight=(west?[20.5,23,25.5,28]:[70,71,72,72.5])[row];
  const a=pointAt(map.tree.trunkX,rootHeight),b=pointAt(map.tree.trunkX+side*(reach+8),tipHeight),label=west?'west':'east';
  limb(`oak-scaffold-${row}-${label}`,a,b,width,tip);
  const fork={x:a.x+(b.x-a.x)*.79,y:a.y+(b.y-a.y)*.79};
  limb(`oak-twig-${row}-${label}`,fork,{x:fork.x+side*(3+row),y:Math.min(map.tree.height-map.launch.y-.4,fork.y+1.1+row*.15)},.24-row*.035,.08);
  for(let j=0;j<2;j++){
   const id=`oak-leaves-${row}-${label}-${j}`,old=map.objects.find(o=>o.id===id),cx=old.points.reduce((n,p)=>n+p.x,0)/old.points.length,cy=old.points.reduce((n,p)=>n+p.y,0)/old.points.length;
   const nextY=Math.min(map.tree.height-map.launch.y-1.7,tipHeight-map.launch.y+1+j*.7);
   replacements.set(id,old.points.map(p=>({x:p.x-cx+b.x-side*(1+j*3),y:p.y-cy+nextY})));
  }
 }
 return map.objects.map(o=>replacements.has(o.id)?{...o,points:replacements.get(o.id)}:o);
}
