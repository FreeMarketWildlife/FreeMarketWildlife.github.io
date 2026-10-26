import {branchPolygon,slopedPlatform} from './grove-branches.js?v=70';
export const CROWN_TREE=Object.freeze({height:800,trunkX:-145,trunkWidth:280,doorX:-8,crownRadius:500,crownDepth:350});
const ellipsePoints=(x,y,rx,ry)=>Array.from({length:12},(_,i)=>({x:x+Math.cos(i*Math.PI/6)*rx,y:y+Math.sin(i*Math.PI/6)*ry}));
export function crownStarterObjects(base,makeEnemy){
 const objects=base.objects.map(o=>{
  if(o.id==='root-bank')return{...o,points:o.points.map(p=>({...p,y:p.y-300}))};
  if(o.id==='floor-fungus')return{...o,y:-592};
  if(['star-yokai','ring-piece','cloud-one','cloud-two','canopy-pod','canopy-bug'].includes(o.id))return{...o,y:o.y*2};
  if(o.material==='leaf')return{...o,material:'wood',name:o.name.replace('leafy','mossy'),points:o.id.startsWith('lower-canopy')?o.points.map(p=>({...p,y:p.y*2})):o.points};
  return o;
 });let seed=73;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const polygon=(id,name,points,extra={})=>({id,name,type:'polygon',points,collision:true,layer:'world',material:'wood',bounce:.26,...extra});
 const branch=(id,name,a,b,w)=>{const o=polygon(id,name,branchPolygon(a,b,w));objects.push(o);return o;};
 const kinds=['beetle','hopper','pod','vinebug','skid','bird','elder-beetle','royal-hopper'];
 // The crown has real, editable boughs on both sides of the immense trunk.
 const heights=[-355,-285,-215,-150,-95,-45,38,78,120,162];
 for(let row=0;row<heights.length;row++)for(const side of[-1,1]){
  const a={x:-145+side*30,y:heights[row]},length=180+random()*300,b={x:a.x+side*length,y:a.y+18+random()*35},width=10+random()*14;
  branch(`great-bough-${row}-${side}`,`Great bough ${row+1} ${side<0?'west':'east'}`,a,b,width);
  const fork={x:a.x+(b.x-a.x)*.69,y:a.y+(b.y-a.y)*.69},tip={x:b.x+side*(35+random()*55),y:b.y+20+random()*22};
  branch(`crown-fork-${row}-${side}`,`Crown fork ${row+1}`,fork,tip,width*.32);
  const t=.6+random()*.2,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t+width*.3;
  objects.push(makeEnemy(`bough-friend-${row}-${side}`,kinds[(row+(side+1))%kinds.length],x,y));
  if(row%3===1){const xx=a.x+(b.x-a.x)*.8,yy=a.y+(b.y-a.y)*.8+width*.22;objects.push(polygon(`bough-sap-${row}-${side}`,'Sticky amber sap',ellipsePoints(xx,yy,2.6,.7),{material:'sap',bounce:0}));}
 }
 // Small editing ideas near the launch: ramps, stepping boughs, enemy gardens.
 for(let i=0;i<20;i++){
  const x=28+i%5*34,y=-22-Math.floor(i/5)*48,a={x,y},b={x:x+10+random()*12,y:y+(i%2?4:-3)};
  objects.push(polygon(`stepping-bough-${i}`,`Sloped stepping bough ${i+1}`,slopedPlatform(a,b,1.1),{material:'wood',bounce:i%4===0?.48:.28}));
  const kind=kinds[i%kinds.length],p=makeEnemy(`garden-friend-${i}`,kind,x+5,y+(b.y-y)*.3+.3);objects.push(p);
  if(i%3===0)objects.push(makeEnemy(`garden-pal-${i}`,kinds[(i+2)%kinds.length],x+8,y+(b.y-y)*.6+.3));
 }
 // A field is an aggregated leaf cluster, never one physics body per leaf.
 for(let row=0;row<8;row++){
  const y=-105+row*42,alt=y+600,span=500*Math.sqrt(Math.max(.08,1-((alt-625)/185)**2));
  for(let x=-145-span+35,col=0;x<-145+span;x+=78,col++){
   const cx=x+(random()-.5)*24,cy=y+(random()-.5)*12;
   if(Math.abs(cx)<65&&Math.abs(cy)<42)continue; // Door and launch pocket.
   objects.push(polygon(`crown-leaves-${row}-${col}`,'Crown leaf cluster',ellipsePoints(cx,cy,51+random()*13,27+random()*8),{material:'foliage',density:2+random()*5,bounce:0}));
  }
 }
 for(let i=0;i<15;i++){const x=35+i%5*39,y=-52-Math.floor(i/5)*58;objects.push(polygon(`dense-leaves-${i}`,'Dense leaf tangle',ellipsePoints(x,y,5+random()*7,3+random()*4),{material:'foliage',density:22+random()*24,bounce:0}));}
 // The far crown and dark forest offer larger, explicitly named encounters.
 for(let i=0;i<12;i++)objects.push(makeEnemy(`crown-encounter-${i}`,['bird','cloud','crown-cloud','yokai'][i%4],-390+i*65,180+(i%3)*19+(i%4===3?230:0)));
 for(let i=0;i<9;i++){
  const x=-210+i*58,y=-594+(i%3)*3;branch(`forest-log-${i}`,`Forest log ${i+1}`,{x,y},{x:x+24,y:y+(i%2?3:-2)},2.5);
  objects.push(makeEnemy(`forest-friend-${i}`,i%3===0?'ancient-fungus':'fungus',x+12,y+2));
 }
 objects.push(polygon('sap-lesson','A little sap detour',ellipsePoints(67,-28,1.8,.65),{material:'sap',bounce:0}));
 // A clear shaft above the home branch accommodates late-game rigs. These
 // bough sections pass behind the play plane; their outer ends remain solid.
 const clip=(points,x,greater)=>{const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ain=greater?a.x>=x:a.x<=x,bin=greater?b.x>=x:b.x<=x;if(ain)out.push(a);if(ain!==bin){const t=(x-a.x)/(b.x-a.x);out.push({x,y:a.y+(b.y-a.y)*t});}}return out;};
 return objects.flatMap(o=>{if(o.type==='enemy'&&o.y>5&&o.y<250&&Math.abs(o.x)<125)o={...o,x:(o.x<0?-1:1)*(145+(Math.abs(o.y)%45))};if(o.material!=='wood'||!o.points||Math.min(...o.points.map(p=>p.y))<5||Math.max(...o.points.map(p=>p.y))>230)return[o];const lo=Math.min(...o.points.map(p=>p.x)),hi=Math.max(...o.points.map(p=>p.x));if(hi<=-120||lo>=120)return[o];const back=clip(clip(o.points,-120,true),120,false),pieces=[];if(back.length>=3)pieces.push({...o,points:back,collision:false,layer:'back',name:o.name+' · behind the launch shaft'});for(const [x,greater,suffix]of[[-120,false,'west'],[120,true,'east']]){const points=clip(o.points,x,greater);if(points.length>=3)pieces.push({...o,id:o.id+'-'+suffix,points});}return pieces;});
}

/** A short authored opening route in the same editable map as the rest of the
 * crown. These are real sloping leaf-stem mats, not launch assistance. The
 * descending faces turn an incoming fall into four separated forward skips. */
export function launchRunStarterObjects(base,makeEnemy){
 const superseded=new Set(['returning-bough','leafy-ramp','first-hopper','first-beetle','spring-return','sky-gust']);
 const bounds=o=>o.points?{minX:Math.min(...o.points.map(p=>p.x)),maxX:Math.max(...o.points.map(p=>p.x)),minY:Math.min(...o.points.map(p=>p.y)),maxY:Math.max(...o.points.map(p=>p.y))}:{minX:o.x-o.radius,maxX:o.x+o.radius,minY:o.y-o.radius,maxY:o.y+o.radius};
 const objects=base.objects.filter(o=>!superseded.has(o.id)&&!/^stepping-bough-[0-4]$|^garden-(friend|pal)-[0-4]$/.test(o.id)).map(o=>{
  const b=bounds(o);
  // Keep the visual canopy, but author a sunlit air gap through the first
  // skips. The outside tree still has dense drag fields and sap hazards.
  return o.material==='foliage'&&b.minX<110&&b.maxX>17&&b.minY<2&&b.maxY>-65?{...o,collision:false,layer:'back',name:'Airy opening · '+o.name}:o;
 });
 const skips=[
  [22,-3.8,28,-6.8,'First skip · sunlit leaf mat'],
  [32,-10,38,-13,'Second skip · waxleaf sweep'],
  [42,-18,48,-21,'Third skip · fern spring'],
  [52,-27,61,-31.5,'Fourth skip · canopy exit']
 ];
 for(let i=0;i<skips.length;i++){
  const[x,y,endX,endY,name]=skips[i];
  objects.push({id:`opening-skip-${i+1}`,name,type:'polygon',points:[{x,y},{x:endX,y:endY},{x:endX,y:endY-.5},{x,y:y-.5}],collision:true,layer:'world',material:'leaf',bounce:.87});
 }
 // A visible choice beyond the four skips: the friendly waxleaf and pod can
 // rescue a lower approach; the sap patch is off the main landing faces.
 objects.push(makeEnemy('opening-exit-pod','pod',65,-40),makeEnemy('opening-exit-skid','skid',72,-47));
 return objects;
}

/** Small original landmarks, authored as ordinary editable shapes. Back-layer
 * stalks and seedpods never become hidden hitboxes or future-route markers. */
export function openingLandmarkObjects(base){
 const objects=base.objects.map(o=>({...o}));
 const poly=(id,name,points,material,collision=false,bounce=0)=>objects.push({id,name,type:'polygon',points,collision,layer:collision?'world':'back',material,bounce});
 for(const [i,x,y,lean]of[[1,24.7,-5.15,-.18],[2,35.5,-11.75,.22]]){
  const stem=[{x:x-.075,y:y-.35},{x:x+.03,y:y-.38},{x:x+lean+.09,y:y+.62},{x:x+lean+.01,y:y+.65}];
  poly(`opening-landmark-${i}-stem`,'Amber seedpod stalk',stem,'wood');
  for(const[j,dx,dy,r]of[[0,lean,.78,.23],[1,lean-.28,.53,.15],[2,lean+.27,.4,.13]])objects.push({id:`opening-landmark-${i}-pod-${j}`,name:'Amber seedpod · backdrop',type:'circle',x:x+dx,y:y+dy,radius:r,collision:false,layer:'back',material:'bumper',bounce:0});
  // Each leaflet stays near mouse length. The fan is a cluster, not one giant
  // leaf; its distinct silhouette gives the landing a little local identity.
  for(const side of[-1,1])for(let j=0;j<3;j++){
   const cx=x+side*(.12+j*.13),cy=y+.03+j*.14;
   poly(`opening-landmark-${i}-leaf-${side}-${j}`,'Fern leaflet · backdrop',[{x:cx-side*.075,y:cy-.02},{x:cx+side*.055,y:cy+.085},{x:cx+side*.08,y:cy+.025},{x:cx-side*.035,y:cy-.035}],'leaf');
  }
 }
 // A lower alternative for medium throws that slip past the second main mat.
 // It rejoins a broad terrace rather than adding another long empty fall.
 poly('opening-rescue-mat','Low route · fern spring',[{x:30.5,y:-13.5},{x:34.5,y:-15.5},{x:34.5,y:-15.95},{x:30.5,y:-13.95}],'leaf',true,.84);
 poly('opening-rest-terrace','Low route · mossy landing terrace',[{x:37,y:-24},{x:48,y:-24},{x:48,y:-24.65},{x:37,y:-24.65}],'wood',true,.62);
 return objects;
}

/** A quiet landing after the four spring mats. Two shallow, passive logs
 * catch coast/weapon trajectories before overlapping lower foliage turns
 * them into a long vertical fall. The west log also catches the low leftward
 * staff path; a real two-metre fork remains open between the logs. */
export function canopyExitObjects(base){
 const objects=base.objects.map(o=>({...o}));
 for(const [side,x,y,endX,endY]of[['west',22,-55+(38-22)*1.5/28,66,-56.5],['east',68,-61+(70-68)*2/30,100,-63]])objects.push({
  id:`canopy-exit-${side}-log`,name:`Canopy exit · ${side} moss log`,type:'polygon',
  points:[{x,y},{x:endX,y:endY},{x:endX,y:endY-.8},{x:endX-3,y:endY-1.2},{x:x+4,y:y-1.2},{x,y:y-.6}],
  collision:true,layer:'world',material:'wood',bounce:.42
 });
 return objects;
}
