import {TUNING,part,validateBuild} from './build-catalog.js?v=70';
const SLOT_KEYS=Object.freeze({frame:['pivotHeight','frameGrams'],ballast:['counterGrams'],sling:['pouchWidth','slingLength']});
const LABELS={pivotHeight:'Frame axle height',frameGrams:'Frame mass',counterGrams:'Counterweight mass',pouchWidth:'Pouch opening',slingLength:'Cord length'};
const format=n=>Number(n.toFixed(3)).toLocaleString('en-US');
export function capacityFields(build,slot){
 return (SLOT_KEYS[slot]??[]).map(key=>{
  const [,title,unit,min,max,step]=TUNING.find(row=>row[0]===key);
  const limit=key==='pivotHeight'?part(build.frame).maxHeight:key==='frameGrams'?part(build.frame).maxMass:key==='counterGrams'?part(build.ballast).maxMass:key==='pouchWidth'?part(build.sling).width:part(build.sling).maxLength;
  return{key,label:LABELS[key]??title,unit,min,max:Math.min(max,limit),step,value:build[key]};
 });
}
/** Only explicitly entered capacity fields can change. Selection alone never
 * calls this helper, and the original recipe is never mutated. */
export function capacityAdjustedBuild(build,slot,values){
 const fields=capacityFields(build,slot),allowed=new Set(fields.map(f=>f.key));
 if(!fields.length)throw Error('This part has no capacity controls.');
 if(Object.keys(values).some(k=>!allowed.has(k)))throw Error('Only this part’s capacity settings can be adjusted here.');
 const next={...build};
 for(const f of fields){
  const value=values[f.key];
  if(!Number.isFinite(value)||value<f.min||value>f.max)throw Error(f.label+' must be '+format(f.min)+'–'+format(f.max)+' '+f.unit+'.');
  next[f.key]=value;
 }
 return validateBuild(next);
}
/** Real DOM controls, shared with handler tests. Preview is reversible; only the
 * explicit apply callback may rebuild/persist the equipped machine. */
export function createCapacityControls({document,slot,getBuild,onPreview,onApply}){
 const fields=capacityFields(getBuild(),slot);if(!fields.length)return null;
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const element=make('section',undefined,'capacity-adjustment');element.dataset.capacitySlot=slot;
 element.setAttribute('aria-label',slot==='frame'?'Adjust fitted frame':slot==='sling'?'Adjust fitted sling':'Adjust fitted counterweight');
 element.append(make('strong',slot==='frame'?'Use your frame capacity':slot==='sling'?'Size the pouch and cords':'Set your counterweight mass'));
 element.append(make('p','Your chosen values stay as they are until you adjust them. Preview changes below, then apply.'));
 const inputs=new Map(),limits=new Map();
 for(const f of fields){
  const row=make('label',undefined,'capacity-row'),label=make('span',f.label+' · '+f.unit),input=make('input'),limit=make('small');
  input.type='number';input.id='capacity-'+f.key;input.min=f.min;input.max=f.max;input.step=f.step;input.value=f.value;input.dataset.capacityKey=f.key;input.setAttribute('aria-label',f.label+' ('+f.unit+')');
  input.addEventListener('input',preview);row.append(label,input,limit);inputs.set(f.key,input);limits.set(f.key,limit);element.append(row);
 }
 const status=make('p','Current settings · edit to preview a change.','capacity-status');status.setAttribute('role','status');
 const button=make('button','Apply adjustments & rebuild','secondary capacity-apply');button.type='button';button.dataset.applyCapacity=slot;
 button.addEventListener('click',()=>{
  try{const next=candidate();onApply(next);status.textContent='Adjustment applied.';}
  catch(error){status.textContent=error.message;button.disabled=true;}
 });
 element.append(status,button);
 function candidate(){return capacityAdjustedBuild(getBuild(),slot,Object.fromEntries([...inputs].map(([key,input])=>[key,input.valueAsNumber])));}
 function preview(){
  try{const next=candidate();onPreview(next);status.textContent='Preview only · apply to rebuild.';button.disabled=false;}
  catch(error){status.textContent=error.message;button.disabled=true;}
 }
 function sync(build){
  for(const f of capacityFields(build,slot)){
   const input=inputs.get(f.key);input.min=f.min;input.max=f.max;input.step=f.step;
   if(document.activeElement!==input)input.value=Number.isFinite(f.value)?f.value:'';
   limits.get(f.key).textContent='Fitted limit: '+format(f.max)+' '+f.unit;
  }
  try{candidate();button.disabled=false;}catch{button.disabled=true;}
 }
 sync(getBuild());return{element,sync};
}
