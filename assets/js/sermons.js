export const sermonStorageKey = 'fmw:philip-aram:sermons:v1';
export function validateSermons(value) {
  if (!value || value.version !== 1 || value.workspace !== 'philip-aram' || value.kind !== 'sermons' || !Array.isArray(value.entries) || value.entries.length > 500) throw Error('Invalid sermon backup or different workspace.');
  const ids = new Set();
  for (const entry of value.entries) {
    if (!entry || typeof entry.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(entry.id) || ids.has(entry.id)) throw Error('Invalid or duplicate sermon ID.');
    if (typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !Number.isFinite(Date.parse(entry.date+'T12:00:00Z')) || new Date(entry.date+'T12:00:00Z').toISOString().slice(0,10) !== entry.date) throw Error('Invalid sermon date.');
    for (const [field,limit] of [['speaker',200],['passages',1000],['title',200],['theme',300],['notes',50000]]) if (typeof entry[field] !== 'string' || entry[field].length > limit || (['speaker','passages'].includes(field) && !entry[field].trim())) throw Error(`Invalid ${field}.`);
    ids.add(entry.id);
  }
  return value;
}
export function mergeSermons(current, incoming) {
  validateSermons(current);validateSermons(incoming);
  const ids = new Set(current.entries.map(entry=>entry.id));
  return validateSermons({...current,entries:[...current.entries,...incoming.entries.filter(entry=>!ids.has(entry.id))]});
}
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
if(typeof document!=='undefined')for(const root of document.querySelectorAll('[data-sermon-notebook]'))mountSermons(root);
function mountSermons(root) {
  let state={version:1,workspace:'philip-aram',kind:'sermons',entries:[]},blocked=false,editing=null;
  const status=el('p','','planner-status');status.setAttribute('role','status');
  try{const raw=localStorage.getItem(sermonStorageKey);if(raw)state=validateSermons(JSON.parse(raw));}catch{blocked=true;status.textContent='Saved sermons could not be read. Changes are paused to protect them.';}
  root.append(el('p','Saved only in this browser on this device. Export a backup to keep your notes. Private account sync is not connected.','planner-note'),status);
  const searchLabel=el('label','Search sermons'),search=el('input');search.type='search';search.setAttribute('aria-label','Search sermons');search.addEventListener('input',render);searchLabel.append(search);
  const editor=el('details'),summary=el('summary','Add sermon notes'),form=el('form',undefined,'sermon-form'),fields={};
  for(const [name,labelText,type,limit] of [['date','Date','date',10],['speaker','Speaker','text',200],['passages','Passages','text',1000],['title','Title (optional)','text',200],['theme','Theme (optional)','text',300],['notes','Notes','textarea',50000]]) {
    const label=el('label',labelText),input=el(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;else input.rows=12;
    input.name=name;input.maxLength=limit;input.required=['date','speaker','passages'].includes(name);input.setAttribute('aria-label',labelText);label.append(input);fields[name]=input;form.append(label);
  }
  const saveButton=el('button','Save sermon');saveButton.type='submit';const cancel=el('button','Cancel');cancel.type='button';cancel.addEventListener('click',reset);form.append(saveButton,cancel);editor.append(summary,form);
  const list=el('div'),toolbar=el('div',undefined,'planner-toolbar'),exportButton=el('button','Export sermons');exportButton.type='button';
  exportButton.addEventListener('click',()=>{let value;try{value=blocked?localStorage.getItem(sermonStorageKey):JSON.stringify(state,null,2);if(value===null)throw Error();}catch{status.textContent='Could not read the saved notes for export. Nothing was changed.';return;}const url=URL.createObjectURL(new Blob([value],{type:'application/json'})),a=el('a');a.href=url;a.download='philip-aram-sermons.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  const importLabel=el('label','Import sermons','planner-import'),importInput=el('input');importInput.type='file';importInput.accept='.json,application/json';
  importInput.addEventListener('change',async()=>{const file=importInput.files[0];if(!file)return;try{if(file.size>10000000)throw Error('Backup too large.');const next=mergeSermons(state,JSON.parse(await file.text()));if(save(next))render();}catch(error){status.textContent=`Import stopped: ${error.message}`;}importInput.value='';});importLabel.append(importInput);toolbar.append(exportButton,importLabel);root.append(searchLabel,editor,toolbar,list);
  function reset(){form.reset();editing=null;summary.textContent='Add sermon notes';editor.open=false;}
  function save(next){try{if(blocked)throw Error('Saved data needs recovery.');validateSermons(next);localStorage.setItem(sermonStorageKey,JSON.stringify(next));state=next;status.textContent='Saved on this device.';return true;}catch(error){status.textContent=`Could not save: ${error.message} Your form is kept; export a backup before leaving.`;return false;}}
  form.addEventListener('submit',event=>{event.preventDefault();const entry={id:editing||crypto.randomUUID()};for(const [name,field]of Object.entries(fields))entry[name]=field.value.trim();const next={...state,entries:editing?state.entries.map(old=>old.id===editing?entry:old):[...state.entries,entry]};if(save(next)){reset();render();}});
  function render(){list.replaceChildren();const query=search.value.trim().toLowerCase(),entries=state.entries.filter(entry=>[entry.date,entry.speaker,entry.passages,entry.title,entry.theme,entry.notes].join(' ').toLowerCase().includes(query)).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
    if(!entries.length){list.append(el('p',state.entries.length?'No sermons match your search.':'No sermon notes saved yet.'));return;}
    for(const entry of entries){const article=el('article',undefined,'goal-card');article.append(el('h3',entry.title||'Sermon notes'),el('p',`${entry.date} · ${entry.speaker}`),el('p',`Passages: ${entry.passages}`));if(entry.theme)article.append(el('p',`Theme: ${entry.theme}`));article.append(el('p',entry.notes||'No notes added yet.','sermon-notes'));const edit=el('button','Edit sermon');edit.type='button';edit.addEventListener('click',()=>{editing=entry.id;for(const[name,field]of Object.entries(fields))field.value=entry[name];summary.textContent='Edit sermon notes';editor.open=true;fields.date.focus();});article.append(edit);list.append(article);}
  }
  if(blocked){saveButton.disabled=true;importInput.disabled=true;}
  render();
}
