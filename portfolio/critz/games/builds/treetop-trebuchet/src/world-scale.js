import {critterScaleMarkup} from './critter-scale-art.js?v=49';
import {CRITTERS,part} from './build-catalog.js?v=49';
import {critterBodyProfile} from './critter-body.js?v=49';
import {BuildSimulation} from './build-physics.js?v=49';
import {createGroveMap,ENEMIES,objectBounds} from './grove-map.js?v=49';
import {SCALE_BUILDS,scaleBuildFacts} from './scale-builds.js?v=49';
import {critterScale} from './critter-scale.js?v=49';
import {oakCrownCommands,oakTrunkCommands,oakRootCommands} from './grove-tree-art.js?v=49';
import {ordinaryLeafHalfLength} from './grove-nature.js?v=49';
const color={wood:'#966b43',leaf:'#69875b',foliage:'#6c8d5b',stone:'#8b958b',sap:'#d9aa45',bumper:'#d7a56d',frame:'#738a76',arm:'#9e7048',counter:'#758b91',pouch:'#b7a277',shot:'#97aba6'};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const n=value=>Number(value.toFixed(5));
export const formatMetres=value=>value<1?`${Number((value*100).toFixed(1))} cm`:`${Number(value.toFixed(2))} m`;
export function shapeBounds(shapes){
 const points=shapes.flatMap(s=>s.kind==='circle'?[{x:s.x-s.radius,y:s.y-s.radius},{x:s.x+s.radius,y:s.y+s.radius}]:s.kind==='path'?s.bounds:s.points);
 if(!points.length)throw Error('A scale object needs visible physical geometry.');
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 return{minX,maxX,minY,maxY,width:maxX-minX,height:maxY-minY};
}
const polygon=(points,fill,extra={})=>({kind:'polygon',points:points.map(p=>({x:p.x,y:p.y})),fill,...extra});
const circle=(x,y,radius,fill)=>({kind:'circle',x,y,radius,fill});
function animalShapes(animal){return critterBodyProfile(animal).map(p=>polygon(Array.from({length:8},(_,i)=>({x:(p.x+Math.cos(i*Math.PI/4)*p.rx)*animal.length,y:(p.y+Math.sin(i*Math.PI/4)*p.ry)*animal.width})),animal.color));}
/** Real fixture geometry at a latched draw, with the solver's similarity units
 * converted back to metres. Never step, purchase or persist a comparison rig. */
export function rigScaleShapes(build){
 const sim=new BuildSimulation(build),shapes=[];
 for(const body of sim.moving){const role=body.getUserData()?.role??'frame';for(let f=body.getFixtureList();f;f=f.getNext()){
  const shape=f.getShape(),fill=role==='arm'?part(build.arm).color:color[role]??color.frame;
  if(shape.getType()==='polygon')shapes.push(polygon(shape.m_vertices.map(v=>{const p=body.getWorldPoint(v);return{x:p.x*sim.L,y:p.y*sim.L};}),fill));
  else if(shape.getType()==='circle'){const p=body.getWorldPoint(shape.getCenter());shapes.push(circle(p.x*sim.L,p.y*sim.L,shape.getRadius()*sim.L,fill));}
 }}
 const tip=sim.tip(),payload=sim.real(sim.shot);shapes.push({kind:'line',points:[tip,payload],fill:'#716a4c'});
 return shapes;
}
function objectShapes(o,origin=0){
 const fill=color[o.material]??color.wood;
 if(o.points)return[polygon(o.points.map(p=>({x:p.x,y:p.y+origin})),fill,{open:o.type==='chain',opacity:o.collision&&!['foliage','sap'].includes(o.material)?1:.65})];
 return[circle(o.x,o.y+origin,o.radius,fill)];
}
function entry(value){const bounds=value.envelope??shapeBounds(value.shapes);return{...value,bounds,width:bounds.width,height:bounds.height,extent:Math.max(bounds.width,bounds.height)};}
function oakEntry(map){
 const t=map.tree,bounds=[{x:t.trunkX-t.crownRadius,y:0},{x:t.trunkX+t.crownRadius,y:t.height}],path=(commands,fill)=>({kind:'path',commands,fill,bounds});
 const shapes=[path(oakCrownCommands(t),'#668459'),...oakRootCommands(t).map(commands=>path(commands,'#8b6847')),path(oakTrunkCommands(t),'#97734c')];
 for(const o of map.objects.filter(o=>/^oak-(scaffold|twig|limb)-/.test(o.id)))shapes.push(...objectShapes(o,map.launch.y));
 return entry({id:'grandfather-oak',name:'Grandfather oak',category:'Trees',measure:`${formatMetres(t.height)} total height · ${formatMetres(t.trunkWidth)} basal trunk · ${formatMetres(t.crownRadius*2)} crown`,notes:'Fantasy oak shape at a massive redwood’s height. Crown and major limbs are authored fantasy proportions.',shapes});
}
/** Every authored object is inventoried, not just a sample. Group views below
 * pick representatives, while the full sorted table retains every individual. */
export function scaleInventory(map=createGroveMap()){
 const rows=CRITTERS.map(a=>{const meta=critterScale(a.id),shapes=animalShapes(a),occupied=shapeBounds(shapes),envelope={...occupied,height:a.width,maxY:occupied.minY+a.width};return entry({envelope,showEnvelope:true,id:'animal-'+a.id,name:a.name,category:'Animals',measure:`${formatMetres(a.length)} × ${formatMetres(a.width)} game envelope · ${(a.grams/1000).toLocaleString()} kg`,notes:meta.notes,sourceURL:meta.sourceURL,representative:meta.representativeName,animalId:a.id,shapes});});
 for(const e of ENEMIES)rows.push(entry({id:'encounter-'+e.id,name:e.name,category:'Encounters',measure:`${formatMetres(e.radius*2)} contact diameter`,notes:'Fantasy encounter. Its drawn contact circle has the same physical diameter in the game.',shapes:[circle(0,e.radius,e.radius,e.color)]}));
 for(const recipe of SCALE_BUILDS){const facts=scaleBuildFacts(recipe.build);rows.push(entry({id:'rig-'+recipe.id,name:recipe.name,category:'Trebuchets',measure:`${formatMetres(facts.axleHeight)} axle · ${formatMetres(facts.feetWidth)} feet · ${formatMetres(facts.beamLength)} beam`,notes:'Latched physical fixture silhouette. Full sweep needs additional clearance. Fantasy engineering; no real construction or animal-safety certification.',recipeId:recipe.id,facts,shapes:rigScaleShapes(recipe.build)}));}
 for(const o of map.objects){const field=o.collision&&['foliage','sap'].includes(o.material);rows.push(entry({id:'object-'+o.id,name:o.name,category:!o.collision?'World scenery':field?'World fields':'World solids',measure:`${!o.collision?'Scenery':field?'Pass-through field':'Physical'} ${o.type} · ${o.material}`,notes:!o.collision?'Background/foreground illustration; no collision.':field?'Uses this exact editable resistance field; it slows passage without a rigid landing face.':'Uses this exact editor-authored collision geometry.',objectId:o.id,shapes:objectShapes(o)}));}
 if(map.version===4){rows.push(oakEntry(map));for(const trunk of map.objects.filter(o=>/^amazon-tree-\d+-trunk$/.test(o.id))){const prefix=trunk.id.replace(/-trunk$/,''),crown=map.objects.find(o=>o.id===prefix+'-crown'),height=Math.max(objectBounds(trunk).maxY,crown?objectBounds(crown).maxY:-Infinity)+map.launch.y;if(!crown)continue;rows.push(entry({id:'tree-'+prefix,name:height>60?'Rare Amazon emergent':height>=50?'Forest emergent':'Jungle canopy tree',category:'Trees',measure:`${formatMetres(height)} total height`,...(height>60?{sourceURL:'https://www.botanic.cam.ac.uk/expedition-finds-the-tallest-tree-in-the-amazon/'}:{}),notes:'Whole authored tree: trunk and crown from the canonical map. '+(height>60?'Exceptional height is anchored to the reported 88.5 m Dinizia excelsa. Crown, diameter and branches are authored geometry, not measurements of that specimen.':'Surrounding forest dimensions are design representatives, not a claim about every Amazon tree.'),shapes:[...objectShapes(trunk,map.launch.y),...objectShapes(crown,map.launch.y)]}));}}
 const leafLength=ordinaryLeafHalfLength(0)*2;rows.push(entry({id:'ordinary-leaf',name:'Ordinary leaf',category:'Props',measure:`${formatMetres(leafLength)} leaf length`,notes:'Same local leaf-length policy as the renderer; a canopy clump contains many small leaves.',shapes:[polygon([{x:0,y:0},{x:leafLength*.48,y:leafLength*.18},{x:leafLength,y:0},{x:leafLength*.5,y:-leafLength*.18}],color.leaf)]}));
 rows.push(entry({id:'academy-door',name:'Academy doorway',category:'Props',measure:'7.2 cm width × 10 cm height',notes:'The current starter critter door, in the same metres as the ruler.',shapes:[polygon([{x:0,y:0},{x:.072,y:0},{x:.072,y:.064},{x:.061,y:.09},{x:.036,y:.1},{x:.011,y:.09},{x:0,y:.064}],'#7b694a')]}));
 return rows.sort((a,b)=>a.extent-b.extent||a.name.localeCompare(b.name));
}
function pathData(commands){return commands.map(([c,...values])=>c+values.map(n).join(' ')).join(' ');}
export function shapeSVG(shape,screenScale=1){
 const attrs=`fill="${escape(shape.fill??'#7a8b65')}" stroke="#33473c" stroke-width="${n(.7/screenScale)}"${shape.opacity?` opacity="${shape.opacity}"`:''}`;
 if(shape.kind==='path')return`<path d="${pathData(shape.commands)}" ${attrs}/>`;
 if(shape.kind==='circle')return`<circle cx="${n(shape.x)}" cy="${n(shape.y)}" r="${n(shape.radius)}" ${attrs}/>`;
 const points=shape.points.map(p=>`${n(p.x)},${n(p.y)}`).join(' ');
 return shape.kind==='line'||shape.open?`<polyline points="${points}" fill="none" stroke="${escape(shape.fill)}" stroke-width="${n(1.2/screenScale)}"/>`:`<polygon points="${points}" ${attrs}/>`;
}
const niceStep=span=>{const raw=span/10,power=10**Math.floor(Math.log10(raw));return[1,2,5,10].map(x=>x*power).find(x=>x>=raw)??power*10;};
/** Single linear metre transform within a panel; label spacing never changes
 * object size. A subpixel creature is intentionally tiny in the world panel. */
export function scalePanelSVG(entries,{width=1440,height=520,title='One physical scale',subtitle='',maxHeight}={}){
 if(!entries.length)return'';const declaredHeight=maxHeight??Math.max(...entries.map(e=>e.height)),maxH=declaredHeight>0?declaredHeight:Math.max(1,...entries.map(e=>e.width/3)),pad=50,baseline=height-100,available=baseline-76;
 const sumWidths=entries.reduce((sum,e)=>sum+e.width,0),gap=Math.max(24,Math.min(66,(width-pad*2)/(entries.length+2))),scale=Math.min(available/maxH,(width-pad*2-gap*(entries.length-1))/Math.max(.001,sumWidths));
 if(!(scale>0))throw Error('Too many objects for this comparison panel.');
 let cursor=pad;const pieces=[];
 for(const [i,e]of entries.entries()){
  const w=e.width*scale,x=cursor;cursor+=w+gap;const y=baseline+e.bounds.minY*scale,tx=x-e.bounds.minX*scale,labelX=x+w/2;
  pieces.push(`<g data-id="${escape(e.id)}" data-metres-wide="${e.width}" data-metres-high="${e.height}" transform="translate(${n(tx)} ${n(y)}) scale(${n(scale)} ${n(-scale)})">${e.showEnvelope?`<rect x="${n(e.bounds.minX)}" y="${n(e.bounds.minY)}" width="${n(e.width)}" height="${n(e.height)}" fill="none" stroke="#96a68b" stroke-dasharray="${n(3/scale)} ${n(3/scale)}" stroke-width="${n(.7/scale)}"/>`:''}${e.animalId?critterScaleMarkup(CRITTERS.find(a=>a.id===e.animalId),e.bounds,'scale-'+e.animalId):e.shapes.map(s=>shapeSVG(s,scale)).join('')}</g>`);
  if(Math.max(w,e.height*scale)<2)pieces.push(`<path d="M ${n(labelX)} ${baseline-3} v -18" stroke="#96743d" stroke-width="1"/>`);
  const name=e.name.length>25?e.name.slice(0,23)+'…':e.name;
  pieces.push(`<text x="${n(labelX)}" y="${baseline+19+(i%2)*18}" text-anchor="middle" font-size="11" fill="#244239">${escape(name)}</text><text x="${n(labelX)}" y="${baseline+53+(i%2)*14}" text-anchor="middle" font-size="10" fill="#64745c">${escape(formatMetres(e.width)+' × '+formatMetres(e.height))}</text>`);
 }
 const step=niceStep(maxH);for(let m=0;m<=maxH*1.02;m+=step){const y=baseline-m*scale;pieces.unshift(`<path d="M 39 ${n(y)} H ${width-22}" stroke="#cbd4bd" stroke-width=".7"/><text x="34" y="${n(y+4)}" text-anchor="end" font-size="10" fill="#63745c">${escape(formatMetres(m))}</text>`);}
 return`<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escape(title)}. One linear metre scale; dimensions are game envelopes, not mixed biological axes." width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#f4f2dc;font-family:Arial,sans-serif"><rect width="${width}" height="${height}" rx="18" fill="#f4f2dc"/><text x="24" y="30" font-size="21" font-weight="bold" fill="#244239">${escape(title)}</text><text x="24" y="51" font-size="12" fill="#5e745e">${escape(subtitle||'One shared linear metre scale. Labels do not enlarge tiny objects.')}</text><path d="M39 69 V${baseline} H${width-22}" fill="none" stroke="#647a60" stroke-width="1.2"/>${pieces.join('')}<text x="${width-22}" y="${height-10}" text-anchor="end" font-size="10" fill="#64745c">Uniform linear metre scale · every object uses the same ruler</text></svg>`;
}
export function comparisonPanels(inventory){
 const get=id=>inventory.find(e=>e.id===id),animals=inventory.filter(e=>e.category==='Animals'),rigs=inventory.filter(e=>e.category==='Trebuchets');
 const worldTrees=inventory.filter(e=>e.id==='grandfather-oak'||/^tree-amazon-tree-[0-3]$/.test(e.id)),tallest=inventory.filter(e=>e.category==='Trees'&&e.id!=='grandfather-oak').sort((a,b)=>b.height-a.height)[0];
 if(tallest&&!worldTrees.includes(tallest))worldTrees.push(tallest);
 const forestCaption=tallest?.height>60?`30–60 m forest; rare emergents up to ${formatMetres(tallest.height)}.`:'25–30 m jungle canopy.';
 return[
  {id:'small',title:'Small volunteers · the centimetres matter',subtitle:'Existing ready-pose artwork, with dashed game envelopes. All small animals share the same metre ruler.',entries:animals.filter(e=>e.extent<1),height:400},
  {id:'large',title:'A real increase in machine size',subtitle:'Existing animal art and latched rig fixtures in solver metres. Axle, beam and capacities are listed below.',entries:[...rigs,...animals.filter(e=>e.extent>=1&&e.animalId!=='whale')].sort((a,b)=>a.extent-b.extent),height:490},
  {id:'world',title:'One grove · one scale',subtitle:`${formatMetres(get('grandfather-oak')?.height??0)} fantasy oak; ${forestCaption} Tiny creatures remain tiny—use the detail panel above.`,entries:[get('animal-elephant'),get('rig-elephant'),get('animal-whale'),...worldTrees].filter(Boolean).sort((a,b)=>a.extent-b.extent),height:610},
  {id:'props',title:'Leaves, encounters and the workbench',subtitle:'Fantasy encounters use their real contact diameter; leaf clumps are not individual giant leaves.',entries:[get('ordinary-leaf'),get('animal-frog'),get('animal-mouse'),get('encounter-beetle'),get('encounter-fungus'),get('academy-door'),get('rig-small')].filter(Boolean).sort((a,b)=>a.extent-b.extent),height:400}
 ];
}

/** A metre-linear plan of the actual opening grove, not a parallel level.
 * Two orbital encounters are outside this lower-world viewport and remain in
 * the full inventory/editor. All other canonical objects keep authored poses. */
export function authoredMapSVG(map=createGroveMap()){
 const width=1920,left=56,top=88,maxY=120,origin=map.launch.y;
 const lower=map.objects.filter(o=>objectBounds(o).minY+origin<=maxY),bounds=lower.map(objectBounds);
 const minX=Math.floor(Math.min(map.tree.trunkX-map.tree.crownRadius,...bounds.map(b=>b.minX))/10)*10-10,maxX=Math.ceil(Math.max(map.tree.trunkX+map.tree.crownRadius,...bounds.map(b=>b.maxX))/10)*10+10;
 const scale=Math.min(6.2,(width-left-60)/(maxX-minX)),height=Math.max(420,Math.ceil(top+maxY*scale+100));
 const x=v=>left+(v-minX)*scale,y=v=>top+(maxY-v)*scale;
 const defs=oakEntry(map).shapes.slice(0,8).map(s=>shapeSVG(s,scale)).join('');
 const paint=o=>`<g data-object-id="${escape(o.id)}">${objectShapes(o,origin).map(s=>shapeSVG(s,scale)).join('')}</g>`;
 const visible=lower,scenery=visible.filter(o=>!o.collision),fields=visible.filter(o=>o.collision&&['foliage','sap'].includes(o.material)),solids=visible.filter(o=>o.collision&&!['foliage','sap'].includes(o.material));
 const group=`<g transform="translate(${x(0)} ${y(0)}) scale(${scale} ${-scale})">${scenery.map(paint).join('')}<g opacity=".45">${defs}</g>${fields.map(paint).join('')}${solids.map(paint).join('')}${rigScaleShapes(SCALE_BUILDS[0].build).map(s=>{const t=structuredClone(s);if(t.points)t.points.forEach(p=>p.y+=origin);else if(t.kind==='circle')t.y+=origin;return shapeSVG(t,scale);}).join('')}</g>`;
 const grid=[];for(let alt=0;alt<=120;alt+=10)grid.push(`<path d="M${left-6} ${y(alt)}H${x(maxX)}" stroke="#bfcab4" stroke-width=".6"/><text x="${left-10}" y="${y(alt)+4}" text-anchor="end" font-size="11" fill="#64745c">${alt} m</text>`);
 for(let v=Math.ceil(minX/50)*50;v<=maxX;v+=50)grid.push(`<text x="${x(v)}" y="${y(0)+20}" text-anchor="middle" font-size="10" fill="#64745c">${v} m</text>`);
 return`<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Actual canonical lower grove, linear metre scale" data-min-x="${minX}" data-max-x="${maxX}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#f4f2dc;font-family:Arial,sans-serif"><rect width="${width}" height="${height}" rx="18" fill="#f4f2dc"/><text x="24" y="32" font-size="22" fill="#244239">The authored grove · actual editor positions</text><text x="24" y="55" font-size="12" fill="#64745c">Metres on both axes. Faint scenery and leaf fields are pass-through; brown/green solid branches have real contact faces.</text>${grid.join('')}${group}<path d="M${x(5)} ${y(32)}H${x(24)}" stroke="#315b4b" stroke-width="1"/><text x="${x(24)+5}" y="${y(32)+4}" font-size="12" fill="#244239">Home branch · ${formatMetres(origin)}</text><text x="24" y="${height-48}" font-size="12" fill="#64745c">${visible.length} of ${map.objects.length} authored objects are in this lower-world viewport; ${map.objects.filter(o=>!visible.includes(o)).map(o=>`${escape(o.name)} at ${(objectBounds(o).minY+objectBounds(o).maxY)/2+origin} m`).join('; ')} are outside this viewport.</text><text x="24" y="${height-25}" font-size="12" fill="#64745c">This is a source-geometry figure, not a gameplay screenshot. The editor and game load this same canonical default.</text></svg>`;
}
