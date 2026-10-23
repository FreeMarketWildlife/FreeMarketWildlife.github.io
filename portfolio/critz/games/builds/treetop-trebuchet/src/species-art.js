/** Original markings follow each physical body. Decorative strokes are clipped to
 * its real silhouette; they neither enlarge colliders nor imply powered abilities. */
import {drawFace} from './scenery.js?v=49';
export const speciesTraits=Object.freeze({
 lizard:'Light • grippy feet • long flexible tail',salamander:'Slippery • broad head • supple tail',mouse:'Light • round ears • fine tail',turtle:'Shell-heavy • compact limbs • short tail',snake:'Seven linked segments • bends and tumbles',chipmunk:'Striped coat • broad tail • balanced limbs',
 'flying-squirrel':'Rare • membrane glide • left flares, right dives',armadillo:'Heaviest • banded shell • small head',
 'small-marsupial':'Pygmy possum • light • long fine tail','tiny-primate':'Pygmy marmoset • upright head • long arms',frog:'Folded hind legs • broad head • low body'
});
export function tracePart(ctx,shape,scale){
 const r=(shape.radius??0)*scale;ctx.beginPath();
 if(shape.type==='circle')ctx.arc(0,0,r,0,Math.PI*2);
 else if(shape.type==='box')ctx.rect(-shape.width*scale/2,-shape.height*scale/2,shape.width*scale,shape.height*scale);
 else{const half=Math.max(0,shape.length/2-shape.radius)*scale;ctx.moveTo(-half,-r);ctx.lineTo(half,-r);ctx.arc(half,0,r,-Math.PI/2,Math.PI/2);ctx.lineTo(-half,r);ctx.arc(-half,0,r,Math.PI/2,Math.PI*1.5);ctx.closePath();}
}
export function drawSpeciesMarkings(ctx,{species,part,shape,x=0,y=0,angle=0,scale=42}){
 if(!ctx||!shape||![x,y,angle,scale].every(Number.isFinite)||scale<=0)return;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);tracePart(ctx,shape,scale);ctx.clip();
 const w=(shape.length??shape.width??shape.radius*2)*scale,h=(shape.height??shape.radius*2)*scale;
 const stroke=(color,points,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.stroke();};
 if(species==='turtle'&&part==='torso'){
  ctx.fillStyle='#456d4f';ctx.fillRect(-w/2,-h/2,w,h);ctx.strokeStyle='#b8cc80';ctx.lineWidth=Math.max(.8,scale*.018);ctx.beginPath();ctx.ellipse(0,0,w*.37,h*.37,0,0,Math.PI*2);ctx.stroke();
  stroke('#b8cc80',[[-w*.3,-h*.28],[0,-h*.13],[w*.3,-h*.28]]);stroke('#b8cc80',[[0,-h*.13],[0,h*.34]]);stroke('#b8cc80',[[-w*.36,h*.12],[0,-h*.13],[w*.36,h*.12]]);
 }else if(species==='armadillo'&&part==='torso'){
  for(const t of [-.3,-.1,.1,.3])stroke('#514f48',[[w*t-h*.15,-h*.6],[w*t+h*.15,h*.6]],Math.max(.8,scale*.022));
 }else if(species==='snake'&&part.startsWith('segment')){
  const i=Number(part.split('-')[1]);ctx.fillStyle=i%2?'#c9d987':'#508b78';ctx.fillRect(-w*.15,-h*.6,w*.24,h*1.2);stroke('#2f6256',[[-w*.42,h*.25],[w*.42,h*.25]],Math.max(.7,scale*.014));
 }else if(species==='flying-squirrel'&&part.includes('membrane')){
  ctx.fillStyle='#e9c78c';ctx.fillRect(-w/2,-h/2,w,h);stroke('#805e40',[[-w*.4,0],[w*.4,0]],Math.max(.8,scale*.012));
 }else if(species==='chipmunk'&&part==='torso'){
  stroke('#5e4834',[[-w*.45,-h*.2],[w*.45,-h*.2]],Math.max(1,scale*.04));stroke('#f9e0af',[[-w*.45,0],[w*.45,0]],Math.max(.8,scale*.018));
 }else if(species==='salamander'&&(part==='torso'||part==='tail')){
  ctx.fillStyle='#714d53';for(const t of [-.3,0,.3]){ctx.beginPath();ctx.arc(t*w,-h*.15,Math.max(.7,h*.13),0,Math.PI*2);ctx.fill();}
 }else if(species==='lizard'&&part==='tail'){
  for(const t of [-.25,.05,.3])stroke('#496a3e',[[t*w-h*.18,-h*.5],[t*w+h*.18,0],[t*w-h*.18,h*.5]],Math.max(.7,scale*.014));
 }else if((species==='mouse'||species==='small-marsupial')&&part==='tail'){
  ctx.fillStyle=species==='mouse'?'#e2a9a2':'#e5c9b6';ctx.fillRect(-w/2,-h/2,w,h);if(species==='small-marsupial')for(const t of [-.3,0,.3])stroke('#947565',[[t*w,-h/2],[t*w,h/2]],.7);
 }else if(species==='tiny-primate'&&part.includes('leg')){
  ctx.fillStyle='#795b43';ctx.fillRect(w*.18,-h/2,w*.3,h);
 }else if(species==='frog'&&part==='rear-thigh'){
  stroke('#476a43',[[-w*.3,-h*.4],[0,h*.1],[w*.3,-h*.3]],Math.max(.8,scale*.02));
 }else if(species==='flying-squirrel'&&part==='tail')stroke('#ead7b5',[[-w*.4,0],[w*.4,0]],Math.max(.8,scale*.03));
 ctx.restore();
}
/** Static roster portrait from the same authored geometry, not a live prediction. */
export function drawVolunteerPortrait(ctx,rig,width=80,height=36){
 ctx.clearRect(0,0,width,height);const bound=rig.bodies.map(b=>{const s=b.shape;return {minX:b.x-(s.length??s.width??s.radius*2)/2,maxX:b.x+(s.length??s.width??s.radius*2)/2,minY:b.y-(s.height??s.radius*2)/2,maxY:b.y+(s.height??s.radius*2)/2};});
 const minX=Math.min(...bound.map(b=>b.minX)),maxX=Math.max(...bound.map(b=>b.maxX)),minY=Math.min(...bound.map(b=>b.minY)),maxY=Math.max(...bound.map(b=>b.maxY)),scale=Math.min((width-10)/(maxX-minX),(height-10)/(maxY-minY));
 for(const b of rig.bodies){const x=width/2+(b.x-(minX+maxX)/2)*scale,y=height/2-(b.y-(minY+maxY)/2)*scale;ctx.save();ctx.translate(x,y);ctx.rotate(-b.angle);tracePart(ctx,b.shape,scale);ctx.fillStyle=rig.color;ctx.fill();ctx.strokeStyle='#334a39';ctx.lineWidth=.8;ctx.stroke();ctx.restore();drawSpeciesMarkings(ctx,{species:rig.id,part:b.id,shape:b.shape,x,y,angle:-b.angle,scale});if(b.id==='head')drawFace(ctx,{species:rig.id,x,y,angle:-b.angle,size:(b.shape.radius??.1)*scale,color:rig.color});}
}
