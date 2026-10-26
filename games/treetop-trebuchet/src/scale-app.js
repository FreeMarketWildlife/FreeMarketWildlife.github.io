import {scaleInventory,comparisonPanels,scalePanelSVG,authoredMapSVG,formatMetres} from './world-scale.js?v=66';
import {SCALE_BUILDS,scaleBuildFacts} from './scale-builds.js?v=66';
const $=id=>document.getElementById(id),el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
const inventory=scaleInventory();
const forestTrees=inventory.filter(e=>e.category==='Trees'&&e.id!=='grandfather-oak'),ordinary=forestTrees.filter(e=>e.height<=60),rare=forestTrees.filter(e=>e.height>60);
if(ordinary.length){const range=[Math.min(...ordinary.map(e=>e.height)),Math.max(...ordinary.map(e=>e.height))];$('forestScaleStat').replaceChildren(el('b',`${range[0]}–${range[1]} m`),document.createTextNode(' forest'+(rare.length?` · rare to ${formatMetres(Math.max(...rare.map(e=>e.height)))}`:'')));}
$('mapArt').innerHTML=authoredMapSVG();
for(const panel of comparisonPanels(inventory)){
 const section=el('section');section.id=panel.id;const wrap=el('div');wrap.className='art-wrap';wrap.tabIndex=0;wrap.setAttribute('aria-label',panel.title+'. Scroll sideways for the full comparison.');wrap.innerHTML=scalePanelSVG(panel.entries,{title:panel.title,subtitle:panel.subtitle,height:panel.height});section.append(wrap);$('panels').append(section);
 const link=el('a',panel.id==='small'?'Small volunteers':panel.id==='large'?'Animals & machines':panel.id==='world'?'Whole grove':'Props & encounters');link.href='#'+panel.id;$('panelNav').append(link);
}
for(const recipe of SCALE_BUILDS){
 const f=scaleBuildFacts(recipe.build),card=el('article');card.className='build-card';card.append(el('h3',recipe.name),el('p',`${formatMetres(f.axleHeight)} axle · ${formatMetres(f.beamLength)} beam · ${formatMetres(f.feetWidth)} feet`));
 const list=el('ul');for(const text of[`${f.pouchOpening} m pouch opening · ${(f.pouchCapacityGrams/1000).toLocaleString()} kg capacity`,`${(f.volunteerGrams/1000).toLocaleString()} kg volunteer · ${(f.counterGrams/1000).toLocaleString()} kg chosen ballast`,`${f.cordLength} m cords · ${f.stationaryWidth.toFixed(1)} m stationary workspace`])list.append(el('li',text));card.append(list);
 const detail=el('details'),summary=el('summary','Every fitted part'),parts=el('ul');for(const p of f.parts)parts.append(el('li',`${p.label}: ${p.name}`));detail.append(summary,parts);card.append(detail,el('p',`Calibrated from ${Math.round(f.minimumDraw*100)}% draw. Lower draws keep the ratchet engaged. Let a partial stop settle; custom geometry and terrain still need testing.`));
 const link=el('a','Try this build in Creative');link.href='index.html?qa=1&creative=1&scaleBuild='+encodeURIComponent(recipe.id);link.className='trial';card.append(link);$('buildCards').append(card);
}
for(const category of [...new Set(inventory.map(e=>e.category))].sort()){const option=el('option',category);option.value=category;$('category').append(option);}
function inspect(entry){$('selection').hidden=false;$('selectionTitle').textContent=entry.name;$('selectionNote').textContent=entry.measure+'. '+entry.notes;$('selectionArt').innerHTML=scalePanelSVG([entry],{width:1000,height:420,title:entry.name,subtitle:'Detail zoom · same metre geometry as the overview'});$('selection').scrollIntoView({behavior:'smooth',block:'start'});}
function render(){
 const term=$('search').value.toLowerCase().trim(),category=$('category').value,rows=inventory.filter(e=>(!category||e.category===category)&&(!term||[e.name,e.measure,e.representative,e.objectId,e.recipeId].join(' ').toLowerCase().includes(term)));
 $('inventoryCount').textContent=`${rows.length} of ${inventory.length} entries · sorted by longest game-envelope dimension. Every canonical map object is included.`;
 $('inventory').replaceChildren(...rows.map(entry=>{const row=el('tr'),name=el('td',entry.name);if(entry.representative)name.append(el('small',entry.representative));const role=el('td',entry.measure);if(entry.sourceURL){const link=el('a',' Biological reference');link.href=entry.sourceURL;link.target='_blank';link.rel='noreferrer';role.append(link);}const inspectCell=el('td'),button=el('button','See shape');button.setAttribute('aria-label','Inspect '+entry.name+' dimensions');button.onclick=()=>inspect(entry);inspectCell.append(button);row.append(name,el('td',entry.category),el('td',`${formatMetres(entry.width)} × ${formatMetres(entry.height)}`),role,inspectCell);return row;}));
}
$('search').addEventListener('input',render);$('category').addEventListener('change',render);render();

if(['local','explicit'].includes(document.documentElement.dataset.authorTools)&&new URLSearchParams(location.search).get('author')==='1')$('authorWorkshopLink').hidden=false;
