/** Current authored oak/forest proportions, in metres. Historic starter
 * factories remain unchanged so only untouched old defaults migrate. */
export const CURRENT_OAK=Object.freeze({height:75,trunkX:-8,trunkWidth:7,doorX:-4,crownRadius:36,crownDepth:45});
const p=(x,y)=>({x,y}),mix=(a,b,t)=>a+(b-a)*t;
export function curvePoint(points,t){const u=1-t;return p(u*u*u*points[0].x+3*u*u*t*points[1].x+3*u*t*t*points[2].x+t*t*t*points[3].x,u*u*u*points[0].y+3*u*u*t*points[1].y+3*u*t*t*points[2].y+t*t*t*points[3].y);}
/** One tapered, gently curved collision polygon. Normals follow the centreline
 * so this is actual branch geometry in both editor and physics, not a stroke. */
export function curvedBranch(points,width,tipWidth=.09){
 const samples=Array.from({length:13},(_,i)=>curvePoint(points,i/12)),left=[],right=[];
 for(let i=0;i<samples.length;i++){const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)],d=Math.hypot(b.x-a.x,b.y-a.y),r=mix(width,tipWidth,(i/12)**.85)/2,nx=-(b.y-a.y)/d,ny=(b.x-a.x)/d;left.push(p(samples[i].x+nx*r,samples[i].y+ny*r));right.push(p(samples[i].x-nx*r,samples[i].y-ny*r));}
 return [...left,...right.reverse()];
}
const ellipse=(x,y,rx,ry)=>Array.from({length:16},(_,i)=>p(x+Math.cos(i*Math.PI/8)*rx,y+Math.sin(i*Math.PI/8)*ry));
function previousOakBranchPlan(tree=CURRENT_OAK,origin=32){
 const x=tree.trunkX,scale=tree.height/75,at=(dx,h)=>p(x+dx*scale,h*scale-origin),plans=[];
 for(const [id,side,h,c1,c2,end,width,back]of[
  ['west-low',-1,33,[-5,33],[-12,36],[-28,42],2.3,false],
  ['west-middle',-1,42,[-7,44],[-12,52],[-33,54],2,false],
  ['west-high',-1,52,[-6,57],[-10,62],[-25,66],1.6,false],
  ['west-crown',-1,61,[-4,67],[-8,70],[-15,72],1,false],
  ['east-low',1,38,[7,39],[17,43],[33,45],2.2,true],
  ['east-middle',1,48,[7,50],[16,56],[32,57],1.8,true],
  ['east-high',1,64,[10,70],[23,66],[34,59],1.5,false],
  ['east-crown',1,69,[8,74],[17,73],[25,69],1,false],
  ['leader',1,56,[3,64],[-3,70],[2,73],1.3,false]
 ]){
  const points=[at(0,h),at(...c1),at(...c2),at(...end)],parent={id:'oak-limb-'+id,points,width:width*scale,tipWidth:.14,side,back};plans.push(parent);
  for(const [j,t]of [[0,.46],[1,.76]]){
   const root=curvePoint(points,t),target=p(Math.max(x-33*scale,Math.min(x+33*scale,root.x+side*(6-j)*scale)),Math.min(tree.height-origin-2,root.y+(8-j)*scale));
   const fork={id:parent.id+'-fork-'+j,parent:parent.id,points:[root,p(root.x+side*1.8*scale,root.y+3*scale),p(target.x,target.y-2*scale),target],width:(.52-j*.1)*scale,tipWidth:.07,side,back};plans.push(fork);
   const twigRoot=curvePoint(fork.points,.62),tip=p(Math.max(x-34*scale,Math.min(x+34*scale,twigRoot.x-side*2.4*scale)),Math.min(tree.height-origin-1,twigRoot.y+3.5*scale));
   plans.push({id:fork.id+'-twig',parent:fork.id,points:[twigRoot,p(twigRoot.x,twigRoot.y+1.2*scale),p(tip.x,tip.y-1.2*scale),tip],width:.16*scale,tipWidth:.06,side,back});
  }
 }
 return plans;
}
export function revision9OakBranchPlan(tree=CURRENT_OAK,origin=32){
 const plans=previousOakBranchPlan(tree,origin),k=tree.height/75;
 // Each scaffold carries a different fan: some forks sweep horizontally,
 // others turn sharply upward. Broad collars merge into their parent limbs.
 for(const [i,b] of plans.entries()){
  if(!b.parent){b.width*=1.45;continue;}
  const parent=plans.find(p=>p.id===b.parent),twig=b.id.endsWith('twig'),t=twig?.57:b.id.endsWith('0')?.38:.72;
  const root=curvePoint(parent.points,t),old=b.points[0],dx=root.x-old.x,dy=root.y-old.y;
  b.points=b.points.map(p=>({x:p.x+dx,y:p.y+dy}));
  const side=b.side,spread=twig?(i%3-1)*1.5:((i%4)*1.25-1.4);
  b.points[2].x+=side*spread*k;b.points[3].x+=side*spread*k;
  b.points[2].y-=(i%3)*.7*k;b.points[3].y-=(i%3)*.6*k;
  b.points[0]=root;b.width=twig?.24*k:parent.width*(b.id.endsWith('0')?.39:.24);
 }
 return plans;
}
/** Real connected limbs grow around the large rig's swept volume. Keep the
 * original scaffold identities separate from their new attachment parents. */
export function oakBranchPlan(tree=CURRENT_OAK,origin=32){
 const original=revision9OakBranchPlan(tree,origin),plans=structuredClone(original),byId=new Map(plans.map(b=>[b.id,b])),oldById=new Map(original.map(b=>[b.id,b])),changed=new Set(),k=tree.height/75;
 const at=(x,h)=>p(tree.trunkX+(x+8)*k,h*k-origin),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),localWidth=(b,t)=>mix(b.width,b.tipWidth,t**.85);
 const set=(id,points,width,parent)=>{const b=byId.get(id);b.points=points;if(width!==undefined)b.width=width;if(parent)b.parent=parent;changed.add(id);return b;};
 // A broad low limb passes below the academy and turns upward outside the
 // Elephant's ascent, rather than laying a solid roof across the moving beam.
 const stem=set('oak-limb-west-low',[at(-8,28),at(-25,22),at(-40,35),at(-40,60)]);
 for(const [id,t,c1,c2,end]of[
  ['west-middle',.46,[-32,36],[-42,44],[-42,53]],
  ['west-high',.60,[-34,44],[-40,57],[-38,66]],
  ['west-crown',.72,[-39,51],[-37,65],[-29,72]]
 ])set('oak-limb-'+id,[curvePoint(stem.points,t),at(...c1),at(...c2),at(...end)],localWidth(stem,t)*.87,stem.id);
 const east=set('oak-limb-east-high',[at(-8,64),at(2,70),at(15,69),at(26,66)]);
 set('oak-limb-leader',[curvePoint(east.points,.35),at(3,70),at(0,72),at(-2,73)],localWidth(east,.35)*.9,east.id);
 // Every smaller fork and its foliage follow the actual changed parent.
 for(const b of plans){
  const old=oldById.get(b.id);if(!old.parent||!changed.has(old.parent))continue;
  const parent=byId.get(old.parent),oldParent=oldById.get(old.parent),twig=b.id.endsWith('twig'),t=twig?.57:b.id.endsWith('0')?.38:.72,root=curvePoint(parent.points,t),oldRoot=curvePoint(oldParent.points,t),dx=root.x-oldRoot.x,dy=root.y-oldRoot.y;
  b.points=old.points.map(v=>p(clamp(v.x+dx,tree.trunkX-tree.crownRadius+.5*k,tree.trunkX+tree.crownRadius-.5*k),Math.min(v.y+dy,tree.height-origin-(twig?1:2)*k)));b.points[0]=root;
  b.width=twig?Math.min(old.width,localWidth(parent,t)*.8):parent.width*(b.id.endsWith('0')?.39:.24);changed.add(b.id);
 }
 return plans;
}
export function naturalOakObjects(previous,makeEnemy,revision=10){
 const origin=previous.launch.y,tree=CURRENT_OAK,objects=[];
 const polygon=(id,name,points,{material='wood',collision=true,layer='world',bounce=.38,...extra}={})=>{const o={id,name,type:'polygon',points,material,collision,layer,bounce,...extra};objects.push(o);return o;};
 // The academy's level loading face is a real lower scaffold; keep its exact
 // contacts rather than moving the launcher or inventing collision surfaces.
 objects.push(structuredClone(previous.objects.find(o=>o.id==='launch-bough')));
 const original=revision===8?previousOakBranchPlan(tree,origin):revision9OakBranchPlan(tree,origin),primaryIds=new Set(original.filter(b=>!b.parent).map(b=>b.id)),plans=revision>=10?oakBranchPlan(tree,origin):original;
 for(const branch of plans){polygon(branch.id,'Oak '+branch.id.slice(9).replaceAll('-',' '),curvedBranch(branch.points,branch.width,branch.tipWidth),{collision:!branch.back,layer:branch.back?'back':'world'});
  if(!primaryIds.has(branch.id)){const end=branch.points[3],ry=branch.id.endsWith('twig')?1.3:2.0,rx=branch.id.endsWith('twig')?2.4:3.6;polygon(branch.id+'-leaves','Oak foliage',ellipse(Math.max(tree.trunkX-tree.crownRadius+rx,Math.min(tree.trunkX+tree.crownRadius-rx,end.x)),Math.min(tree.height-origin-ry,end.y+.7),rx,ry),{material:'foliage',collision:false,layer:'back',bounce:0,density:.5});}
 }
 // Rooted tropical trees, each with an explicitly bounded 25–30 m canopy.
 // Their limbs attach to the trunk and fork; no detached staircase platforms.
 const positions=[-49,-33,14,46,65,87,112,...Array.from({length:20},(_,i)=>145+i*29)];
 for(const [i,x]of positions.entries()){
  const height=25+(i*7%11)*.5,diameter=.65+(i%4)*.13,depth=7+(i%3)*.6,radius=4.5+(i%4)*.45,top=height-origin,floor=-origin;
  polygon(`amazon-tree-${i}-trunk`,`Jungle tree · ${height} m`,[p(x-diameter*.65,floor),p(x+diameter*.65,floor),p(x+diameter*.10,top-2),p(x-diameter*.10,top-2)],{collision:false,layer:'back',bounce:0});
  polygon(`amazon-tree-${i}-crown`,'Jungle canopy · 25–30 m',ellipse(x,top-depth/2,radius,depth/2),{material:'foliage',collision:false,layer:'back',bounce:0,density:.5});
  for(let row=0;row<3;row++){
   const side=(row+i)%2?-1:1,h=height-depth-3+row*2.5,a=p(x,h-origin),b=p(x+side*(3.6+row*.7),h+1.5+row*.3-origin),controls=[a,p(x+side*1.1,a.y+.1),p(b.x-side,b.y-.2),b],id=`jungle-limb-${i}-${row}`;
   polygon(id,'Connected jungle bough',curvedBranch(controls,.42-row*.08,.07),{bounce:.48});
   const root=curvePoint(controls,.66),end=p(b.x-side*.8,b.y+1.5);
   polygon(id+'-fork','Jungle branch fork',curvedBranch([root,p(root.x,root.y+.6),p(end.x,end.y-.5),end],.14,.06),{bounce:.48});
   if(row===1&&i%2===0)objects.push(makeEnemy(`jungle-friend-${i}`,['beetle','hopper','skid'][i%3],b.x,b.y+.15));
  }
 }
 // Keep low ground details and canonical encounter sizes. High sky encounters
 // remain sky encounters; forest inhabitants move onto the new real branches.
 for(const o of previous.objects)if(/^(floor-|route-floor-|small-floor-|star-|ring-)/.test(o.id)||['cloud-one','cloud-two','sky-gust','floor-fungus'].includes(o.id))objects.push(structuredClone(o));
 for(const [i,b]of plans.filter(b=>primaryIds.has(b.id)&&!b.back).entries()){const q=curvePoint(b.points,.72);objects.push(makeEnemy('oak-friend-'+i,i%2?'hopper':'beetle',q.x,q.y+.3));}
 return objects;
}
