// Browser-local sermon workshop. No network requests, credentials or AI integration.
export const workshopStorageKey = 'fmw:philip-aram:sermon-workshops:v2';
export const MAX_TEXT = 50000;
const copy = value => JSON.parse(JSON.stringify(value));
const id = () => globalThis.crypto.randomUUID();
const now = () => new Date().toISOString();
const fingerprint = text => { let h=2166136261; for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619); return (h>>>0).toString(36); };
function requireText(value,limit=MAX_TEXT,nonempty=false) { if(typeof value!=='string'||value.length>limit||(nonempty&&!value.trim()))throw Error('Invalid or oversized text.'); }
function requireId(value) { if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{1,160}$/.test(value))throw Error('Invalid identifier.'); }
function requireTime(value) { if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))throw Error('Invalid timestamp.'); }
export function validateWorkshop(value) {
  if(!value||value.schemaVersion!==2||value.workspace!=='philip-aram'||value.kind!=='sermon-workshop')throw Error('Not a Philip Aram workshop packet.');
  requireId(value.sermonId); if(!value.meta||!value.draft)throw Error('Missing draft metadata.');
  for(const key of ['title','speaker','passages','date'])requireText(value.meta[key],key==='passages'?1000:200);
  requireText(value.draft.text); requireTime(value.draft.updatedAt); requireId(value.draft.baseRevisionId);
  for(const [key,limit] of [['revisions',200],['comments',1000],['sources',30]])if(!Array.isArray(value[key])||value[key].length>limit)throw Error('Workshop limit exceeded.');
  if(!value.revisions.length)throw Error('Missing revision history.');
  const revisions=new Map();
  for(const r of value.revisions){requireId(r.id);if(revisions.has(r.id))throw Error('Duplicate revision.');requireText(r.text);requireText(r.label,200);requireTime(r.createdAt);if(r.parentId!==null)requireId(r.parentId);revisions.set(r.id,r);}
  for(const r of value.revisions)if(r.parentId!==null&&!revisions.has(r.parentId))throw Error('Missing parent revision.');
  for(const r of value.revisions){const seen=new Set();let node=r;while(node){if(seen.has(node.id))throw Error('Cyclic revision history.');seen.add(node.id);node=revisions.get(node.parentId);}}
  if(!revisions.has(value.draft.baseRevisionId))throw Error('Missing draft base revision.');
  const comments=new Set();for(const c of value.comments){requireId(c.id);if(comments.has(c.id))throw Error('Duplicate comment.');comments.add(c.id);requireText(c.body,10000,true);requireTime(c.createdAt);requireTime(c.updatedAt);if(!['open','resolved'].includes(c.status)||!['general','section','passage'].includes(c.scope))throw Error('Invalid comment.');
    if(c.scope!=='general'){const a=c.anchor;if(!a)throw Error('Missing comment anchor.');requireText(a.quote,MAX_TEXT,true);requireText(a.prefix,48);requireText(a.suffix,48);requireId(a.revisionId);if(!revisions.has(a.revisionId)||!Number.isInteger(a.start)||!Number.isInteger(a.end)||a.start<0||a.end<=a.start||a.end-a.start!==a.quote.length)throw Error('Invalid comment anchor.');}
  }
  const sources=new Set();for(const s of value.sources){requireId(s.id);if(sources.has(s.id))throw Error('Duplicate source.');sources.add(s.id);requireText(s.name,200,true);requireText(s.text,500000);requireTime(s.addedAt);if(s.history!==undefined){if(!Array.isArray(s.history)||s.history.length>50)throw Error('Invalid source history.');let previous='';for(const h of s.history){requireText(h.text,500000);requireTime(h.addedAt);if(!s.text.startsWith(h.text)||!h.text.startsWith(previous))throw Error('Source history must preserve appended text.');previous=h.text;}}}
  if(value.creationWeek!==undefined)validateCreationWeek(value.creationWeek);
  if(JSON.stringify(value).length>8000000)throw Error('Workshop packet too large.');
  return value;
}
export function createWorkshop(entry, revisionId=id(), timestamp=now()) {
  const result={schemaVersion:2,workspace:'philip-aram',kind:'sermon-workshop',sermonId:entry.id,meta:{title:entry.title||'Sermon notes',speaker:entry.speaker,passages:entry.passages,date:entry.date},draft:{text:entry.notes,updatedAt:timestamp,baseRevisionId:revisionId},revisions:[{id:revisionId,parentId:null,label:'Original notebook snapshot',text:entry.notes,createdAt:timestamp}],comments:[],sources:[]};
  return validateWorkshop(result);
}
export function createAnchor(text,start,end,revisionId) {
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>text.length||end<=start)throw Error('Select a passage in the draft first.');
  return {quote:text.slice(start,end),prefix:text.slice(Math.max(0,start-48),start),suffix:text.slice(end,end+48),start,end,revisionId};
}
export function locateAnchor(text,a) {
  const positions=[];let offset=0;
  while(offset<=text.length){const pos=text.indexOf(a.quote,offset);if(pos<0)break;positions.push(pos);offset=pos+1;}
  if(!positions.length)return {status:'stale',reason:'The quoted text was changed or removed.'};
  if(positions.length===1)return {status:'attached',start:positions[0],end:positions[0]+a.quote.length,moved:positions[0]!==a.start};
  const scored=positions.map(start=>({start,score:(a.prefix&&text.slice(Math.max(0,start-a.prefix.length),start)===a.prefix?1:0)+(a.suffix&&text.slice(start+a.quote.length,start+a.quote.length+a.suffix.length)===a.suffix?1:0)})).sort((a,b)=>b.score-a.score);
  if(scored[0].score>0&&scored[0].score>(scored[1]?.score||0))return {status:'attached',start:scored[0].start,end:scored[0].start+a.quote.length,moved:scored[0].start!==a.start};
  return {status:'stale',reason:'The quote occurs more than once; reattach it explicitly.'};
}
export function sectionAnchors(text,revisionId) {
  const found=[...text.matchAll(/^##\s+(.+)$/gm)];
  return found.map(m=>({name:m[1],anchor:createAnchor(text,m.index,m.index+m[0].length,revisionId)}));
}
export function saveRevision(workshop,label,revisionId=id(),timestamp=now()) {
  const next=copy(validateWorkshop(workshop));requireText(label,200,true);
  if(next.revisions.some(r=>r.id===revisionId))throw Error('Revision ID already exists.');
  next.revisions.push({id:revisionId,parentId:next.draft.baseRevisionId,label,text:next.draft.text,createdAt:timestamp});next.draft.baseRevisionId=revisionId;next.draft.updatedAt=timestamp;return validateWorkshop(next);
}
export function addComment(workshop,{body,scope='general',anchor=null},commentId=id(),timestamp=now()) {
  const next=copy(validateWorkshop(workshop));next.comments.push({id:commentId,body,scope,anchor:scope==='general'?null:anchor,status:'open',createdAt:timestamp,updatedAt:timestamp});return validateWorkshop(next);
}
export function setCommentStatus(workshop,commentId,status,timestamp=now()) {
  const next=copy(validateWorkshop(workshop));const c=next.comments.find(c=>c.id===commentId);if(!c)throw Error('Comment not found.');c.status=status;c.updatedAt=timestamp;return validateWorkshop(next);
}
export function packetMarkdown(workshop) {
  validateWorkshop(workshop);
  const notes=workshop.comments.map(c=>`- [${c.status}] ${c.id} (${c.scope}) ${c.body}\n${c.anchor?`  Quote: ${JSON.stringify(c.anchor.quote)}; anchor: ${locateAnchor(workshop.draft.text,c.anchor).status}`:''}`).join('\n');
  return `# Revision packet: ${workshop.meta.title}\n\nAttach this file to your chat with Dot. This has NOT been sent automatically. It includes the draft, comments, history and original source attachments.\n\n## Working draft\n\n${workshop.draft.text}\n\n## Workshop comments\n\n${notes||'No comments yet.'}\n\n${workshop.creationWeek?'## Creation Week annotations\n\n'+workshop.creationWeek.days.map(d=>'### Day '+d.number+': '+d.title+'\n'+d.verse_reference+'\n'+(d.annotation||'No annotations yet.')).join('\n\n')+'\n\n':''}## Structured revision packet (keep intact for import)\n\n\`\`\`sermon-workshop-json\n${JSON.stringify(workshop)}\n\`\`\`\n`;
}
export function parsePacket(raw) {
  requireText(raw,8000000);let json=raw.trim();
  if(!json.startsWith('{')){const match=/^```sermon-workshop-json\r?\n([^\r\n]+)\r?\n```/m.exec(raw);if(!match)throw Error('No structured revision packet found. Import a packet, or use New draft from Markdown.');json=match[1];}
  return validateWorkshop(JSON.parse(json));
}
// Merge history and notes without overwriting any local content. Imported draft is optional.
export function mergePacket(local,incoming,adopt=false,newId=id(),timestamp=now()) {
  validateWorkshop(local);validateWorkshop(incoming);if(local.sermonId!==incoming.sermonId)throw Error('Packet belongs to a different sermon.');
  const next=copy(local);
  for(const r of incoming.revisions){const old=next.revisions.find(v=>v.id===r.id);if(old&&JSON.stringify(old)!==JSON.stringify(r))throw Error('Revision ID collision. No changes imported.');if(!old)next.revisions.push(copy(r));}
  for(const key of ['comments','sources'])for(const item of incoming[key]){
    const old=next[key].find(v=>v.id===item.id);
    if(!old)next[key].push(copy(item));
    else if(JSON.stringify(old)!==JSON.stringify(item)){
      // A source may grow only by appending, with the exact previous snapshot retained.
      const expectedHistory=[...(old.history||[]),{text:old.text,addedAt:old.addedAt}];
      if(key==='sources'&&item.name===old.name&&item.text.length>old.text.length&&item.text.startsWith(old.text)&&JSON.stringify(item.history)===JSON.stringify(expectedHistory)){
        next.sources[next.sources.findIndex(s=>s.id===item.id)]=copy(item);continue;
      }
      const candidate={...copy(item),id:item.id+'_import_'+fingerprint(JSON.stringify(item))};
      if(key==='comments')candidate.body='[Imported conflicting note; local note preserved]\n'+candidate.body;
      const existing=next[key].find(v=>v.id===candidate.id);if(existing&&JSON.stringify(existing)!==JSON.stringify(candidate))throw Error('Import conflict ID collision.');if(!existing)next[key].push(candidate);
    }
  }
  if(incoming.creationWeek){
    if(!next.creationWeek)next.creationWeek=copy(incoming.creationWeek);
    else {
      for(const v of incoming.creationWeek.history){const old=next.creationWeek.history.find(r=>r.id===v.id);if(old&&JSON.stringify(old)!==JSON.stringify(v))throw Error('Creation Week version collision.');if(!old)next.creationWeek.history.push(copy(v));}
      for(const d of incoming.creationWeek.days){const localDay=next.creationWeek.days.find(n=>n.id===d.id);if(localDay.annotation!==d.annotation&&d.annotation){const vid='import_day_'+fingerprint(d.id+d.annotation);if(!next.creationWeek.history.some(r=>r.id===vid))next.creationWeek.history.push({id:vid,dayId:d.id,text:d.annotation,createdAt:timestamp});}}
      const before=JSON.stringify({...next.creationWeek,history:[]}),after=JSON.stringify({...incoming.creationWeek,history:[]});
      if(before!==after){const sid='import_week_'+fingerprint(after);if(!next.sources.some(s=>s.id===sid))next.sources.push({id:sid,name:'Imported Creation Week context (local notes retained)',text:after,addedAt:timestamp});}
    }
  }
  if(adopt){
    // Preserve unsnapshotted local working text before adopting the returned draft.
    const base=next.revisions.find(r=>r.id===next.draft.baseRevisionId);
    if(base.text!==next.draft.text){next.revisions.push({id:newId+'_local',parentId:next.draft.baseRevisionId,label:'Working draft before import',text:next.draft.text,createdAt:timestamp});}
    next.revisions.push({id:newId,parentId:incoming.draft.baseRevisionId,label:'Imported draft',text:incoming.draft.text,createdAt:timestamp});next.draft={text:incoming.draft.text,baseRevisionId:newId,updatedAt:timestamp};
  }
  return validateWorkshop(next);
}
export function compareLines(before,after) {
  const a=before.split('\n'),b=after.split('\n');
  if(a.length*b.length>1000000)return [{kind:'removed',text:before},{kind:'added',text:after}];
  const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const rows=[];let i=0,j=0;while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){rows.push({kind:'same',text:a[i++]});j++;}else if(j<b.length&&(i===a.length||dp[i][j+1]>=dp[i+1][j]))rows.push({kind:'added',text:b[j++]});else rows.push({kind:'removed',text:a[i++]});}return rows;
}
export function validateStore(store) {
  if(!store||store.schemaVersion!==2||store.workspace!=='philip-aram'||!Array.isArray(store.workshops)||store.workshops.length>500)throw Error('Invalid workshop storage.');
  const ids=new Set();for(const w of store.workshops){validateWorkshop(w);if(ids.has(w.sermonId))throw Error('Duplicate sermon workshop.');ids.add(w.sermonId);}return store;
}
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function button(text,action){const b=el('button',text);b.type='button';b.addEventListener('click',action);return b;}
function field(parent,label,tag='textarea'){const l=el('label',label),n=el(tag);n.setAttribute('aria-label',label);if(tag==='textarea')n.rows=4;l.append(n);parent.append(l);return n;}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function mountWorkshop(root,entry) {
  if(root.dataset.mounted)return;root.dataset.mounted='true';root.classList.add('sermon-workshop');
  const notice=el('p','','workshop-notice');notice.setAttribute('role','status');root.append(el('h4','Draft workshop'),el('p','Saved only in this browser. Dot cannot automatically see your annotations. Export a revision packet and attach it in chat; import the returned packet or Markdown draft.','workshop-visibility'),notice);
  let store,workshop,blocked=false,storageRaw=null;
  try{storageRaw=localStorage.getItem(workshopStorageKey);store=storageRaw?validateStore(JSON.parse(storageRaw)):{schemaVersion:2,workspace:'philip-aram',workshops:[]};workshop=store.workshops.find(w=>w.sermonId===entry.id);if(!workshop){workshop=createWorkshop(entry);store.workshops.push(workshop);localStorage.setItem(workshopStorageKey,JSON.stringify(store));storageRaw=JSON.stringify(store);}}
  catch{blocked=true;notice.textContent='Workshop storage could not be read or written. Editing is paused. Original notebook notes are intact. Export recovery data before retrying.';root.append(button('Export workshop recovery data',()=>{try{download('sermon-workshop-recovery.txt',localStorage.getItem(workshopStorageKey)||'No stored workshop data.','text/plain');}catch{notice.textContent='Could not read storage for recovery.';}}));return;}
  function persist(next,success='Saved locally. Not sent to Dot.') {
    try{validateWorkshop(next);const latest=localStorage.getItem(workshopStorageKey);if(latest!==storageRaw)throw Error('Another tab changed workshop storage. Export your current work, then reload to merge safely.');const nextStore={...store,workshops:store.workshops.map(w=>w.sermonId===next.sermonId?next:w)};const raw=JSON.stringify(nextStore);localStorage.setItem(workshopStorageKey,raw);storageRaw=raw;store=nextStore;workshop=next;notice.textContent=success;return true;}catch(error){notice.textContent='Could not save: '+error.message+' Your on-screen draft is kept. Export it before leaving.';return false;}
  }
  const grid=el('div',undefined,'workshop-grid'),left=el('div'),right=el('div');grid.append(left,right);root.append(grid);
  const draft=field(left,'Speaking draft');draft.rows=24;draft.maxLength=MAX_TEXT;draft.value=workshop.draft.text;
  const counter=el('p','','workshop-counter');left.append(counter);
  const label=field(left,'Version label','input');label.maxLength=200;label.placeholder='e.g. Revision after discussion';
  left.append(button('Save immutable version',()=>{try{let next={...workshop,draft:{...workshop.draft,text:draft.value,updatedAt:now()}};next=saveRevision(next,label.value.trim()||'Saved revision');if(persist(next,'Version saved. Older versions are unchanged.')){label.value='';renderHistory();renderComments();}}catch(e){notice.textContent=e.message;}}));
  function count(){counter.textContent=draft.value.trim().split(/\s+/).filter(Boolean).length+' words · '+draft.value.length+'/'+MAX_TEXT+' characters';}
  draft.addEventListener('input',()=>{count();const next={...workshop,draft:{...workshop.draft,text:draft.value,updatedAt:now()}};persist(next);renderSections();renderComments();});count();
  right.append(el('h5','Annotations'));
  const scope=field(right,'Comment scope','select');for(const [value,text]of [['passage','Selected passage'],['section','Section'],['general','Whole sermon']]){const o=el('option',text);o.value=value;scope.append(o);}
  const section=field(right,'Section to comment on','select');
  const help=el('p','Select text in the Speaking draft, then add a passage note. Quotes are checked after edits; changed or ambiguous passages are flagged for reattachment.','workshop-help');right.append(help);
  const body=field(right,'Your workshop note');body.maxLength=10000;
  right.append(button('Add annotation',()=>{try{let anchor=null;if(scope.value==='passage')anchor=createAnchor(draft.value,draft.selectionStart,draft.selectionEnd,workshop.draft.baseRevisionId);if(scope.value==='section'){const a=sectionAnchors(draft.value,workshop.draft.baseRevisionId)[Number(section.value)];if(!a)throw Error('No section heading available.');anchor=a.anchor;}const next=addComment(workshop,{body:body.value.trim(),scope:scope.value,anchor});if(persist(next)){body.value='';renderComments();}}catch(e){notice.textContent=e.message;}}));
  const filter=field(right,'Show annotations','select');for(const [value,text]of [['all','All notes'],['open','Open notes'],['resolved','Resolved notes'],['stale','Stale anchors']]){const o=el('option',text);o.value=value;filter.append(o);}const comments=el('div',undefined,'workshop-comments');right.append(comments);filter.addEventListener('change',renderComments);
  function renderSections(){const old=section.value;section.replaceChildren();sectionAnchors(draft.value,workshop.draft.baseRevisionId).forEach((s,i)=>{const o=el('option',s.name);o.value=String(i);section.append(o);});if([...section.options].some(o=>o.value===old))section.value=old;}
  function renderComments(){comments.replaceChildren();for(const c of workshop.comments){const located=c.anchor?locateAnchor(draft.value,c.anchor):null;if(filter.value==='stale'&&located?.status!=='stale'||['open','resolved'].includes(filter.value)&&filter.value!==c.status)continue;const box=el('article',undefined,'workshop-comment');box.dataset.commentId=c.id;box.append(el('p',`${c.scope} · ${c.status} · ${c.id}`,'workshop-comment-meta'));if(c.anchor){box.append(el('blockquote',c.anchor.quote));box.append(el('p',located.status==='stale'?'Stale anchor: '+located.reason:located.moved?'Attached: passage moved.':'Attached to current draft.',located.status==='stale'?'anchor-stale':'anchor-attached'));if(located.status==='attached')box.append(button('Find quoted passage',()=>{draft.focus();draft.setSelectionRange(located.start,located.end);}));box.append(button('Reattach to selected text',()=>{try{const next=copy(workshop),target=next.comments.find(n=>n.id===c.id);target.anchor=createAnchor(draft.value,draft.selectionStart,draft.selectionEnd,workshop.draft.baseRevisionId);target.updatedAt=now();if(persist(next))renderComments();}catch(e){notice.textContent=e.message;}}));}box.append(el('p',c.body,'workshop-comment-body'));box.append(button(c.status==='open'?'Resolve note':'Reopen note',()=>{if(persist(setCommentStatus(workshop,c.id,c.status==='open'?'resolved':'open')))renderComments();}));comments.append(box);}if(!comments.children.length)comments.append(el('p','No annotations in this view.'));}
  const history=el('details'),hs=el('summary','Version history and comparison');history.append(hs);root.append(history);
  const versions=field(history,'Compare saved version','select'),comparison=el('pre',undefined,'workshop-diff');history.append(button('Compare with working draft',()=>{comparison.replaceChildren();const r=workshop.revisions.find(r=>r.id===versions.value);if(!r)return;for(const line of compareLines(r.text,draft.value)){const n=el('span',(line.kind==='added'?'+ ':line.kind==='removed'?'- ':'  ')+line.text+'\n','diff-'+line.kind);comparison.append(n);}}));
  const snapshot=field(history,'Read-only saved version');snapshot.readOnly=true;snapshot.rows=10;
  versions.addEventListener('change',()=>{snapshot.value=workshop.revisions.find(r=>r.id===versions.value)?.text||'';});
  history.append(button('Use saved version as working draft',()=>{const r=workshop.revisions.find(r=>r.id===versions.value);if(!r)return;try{let next={...workshop,draft:{...workshop.draft,text:draft.value,updatedAt:now()}};if(next.revisions.find(r=>r.id===next.draft.baseRevisionId).text!==draft.value)next=saveRevision(next,'Working draft before restoring a version');next={...next,draft:{text:r.text,baseRevisionId:r.id,updatedAt:now()}};if(persist(next)){draft.value=r.text;count();renderSections();renderComments();renderHistory();}}catch(e){notice.textContent=e.message;}}));history.append(snapshot,comparison);
  function renderHistory(){versions.replaceChildren();for(const r of [...workshop.revisions].reverse()){const o=el('option',r.label+' · '+new Date(r.createdAt).toLocaleString()+' · '+r.id);o.value=r.id;versions.append(o);}snapshot.value=workshop.revisions.find(r=>r.id===versions.value)?.text||'';}
  const sources=el('details');sources.append(el('summary','Original source notes (preserved separately)'));const sourceName=field(sources,'Source filename','input'),sourceText=field(sources,'Original source text');sourceName.maxLength=200;sourceText.maxLength=500000;sources.append(el('p','Attach original notes here. Saved attachments are read-only and travel in revision packets. They are never inserted into the speaking draft automatically.'));
  const sourceList=el('div');sources.append(button('Preserve source attachment',()=>{try{const next=copy(workshop);next.sources.push({id:id(),name:sourceName.value.trim(),text:sourceText.value,addedAt:now()});if(persist(next)){sourceName.value='';sourceText.value='';renderSources();}}catch(e){notice.textContent=e.message;}}),sourceList);root.append(sources);
  function renderSources(){sourceList.replaceChildren();for(const s of workshop.sources){const d=el('details');d.append(el('summary',s.name+' · '+s.text.length+' characters'),el('pre',s.text,'workshop-source'));for(const [i,h]of (s.history||[]).entries()){const previous=el('details');previous.append(el('summary','Preserved source version '+(i+1)+' · '+h.addedAt),el('pre',h.text,'workshop-source'));d.append(previous);}sourceList.append(d);}}
  const refreshWeek=mountCreationWeek(root,()=>workshop,next=>persist(next));
  const handoff=el('details');handoff.append(el('summary','Export / import revision handoff'),el('p','1. Add notes and save a version. 2. Export a Markdown packet or structured JSON. 3. Attach it in your chat with Dot and request the next draft. 4. Import the returned packet, or paste a new Markdown draft. Export includes source attachments and all notes; share only where you intend. Nothing is sent automatically.'));
  function livePacket(){return validateWorkshop({...workshop,draft:{...workshop.draft,text:draft.value,updatedAt:workshop.draft.updatedAt}});}
  handoff.append(button('Export Markdown revision packet',()=>download('sermon-revision-packet.md',packetMarkdown(livePacket()),'text/markdown')),button('Export JSON revision packet',()=>download('sermon-revision-packet.json',JSON.stringify(livePacket(),null,2),'application/json')));
  const packetInput=field(handoff,'Paste revision packet');packetInput.maxLength=8000000;
  handoff.append(button('Prepare copyable packet',()=>{packetInput.value=JSON.stringify(livePacket(),null,2);notice.textContent='Packet text prepared. Copy it to your chat or download it; nothing was sent.';}));
  const fileLabel=el('label','Read packet file'),file=el('input');file.type='file';file.accept='.md,.json,.txt';file.setAttribute('aria-label','Read packet file');fileLabel.append(file);handoff.append(fileLabel);
  file.addEventListener('change',async()=>{try{const f=file.files[0];if(!f)return;if(f.size>16000000)throw Error('Packet file too large.');packetInput.value=await f.text();notice.textContent='File loaded for review. Import it explicitly below.';}catch(e){notice.textContent=e.message;}file.value='';});
  const mode=field(handoff,'Packet import mode','select');for(const [value,text]of [['notes','Merge history and notes; keep my working draft'],['draft','Import returned draft as a new version']]){const o=el('option',text);o.value=value;mode.append(o);}
  handoff.append(button('Import revision packet',()=>{try{const incoming=parsePacket(packetInput.value);const next=mergePacket(livePacket(),incoming,mode.value==='draft');if(persist(next,'Packet imported locally. Existing versions and notes preserved.')){draft.value=workshop.draft.text;count();renderSections();renderComments();renderHistory();renderSources();refreshWeek();packetInput.value='';}}catch(e){notice.textContent='Import stopped: '+e.message;}}));
  const incomingDraft=field(handoff,'New draft from Markdown');incomingDraft.maxLength=MAX_TEXT;
  handoff.append(button('Import Markdown as new version',()=>{try{requireText(incomingDraft.value,MAX_TEXT,true);let next=livePacket();if(next.revisions.find(r=>r.id===next.draft.baseRevisionId).text!==next.draft.text)next=saveRevision(next,'Working draft before Markdown import');next={...next,draft:{...next.draft,text:incomingDraft.value,updatedAt:now()}};next=saveRevision(next,'Imported Markdown draft');if(persist(next)){draft.value=workshop.draft.text;incomingDraft.value='';count();renderSections();renderComments();renderHistory();}}catch(e){notice.textContent=e.message;}}));root.append(handoff);
  renderSections();renderComments();renderHistory();renderSources();notice.textContent='Workshop ready. Local only; export your notes to share them with Dot.';
}

export function emptyCreationWeek() {
  const titles=['Light and darkness','Waters and expanse','Land and vegetation','Lights and appointed times','Sea creatures and birds','Land animals and humanity','Completion and rest'];
  const refs=['Genesis 1:1–5','Genesis 1:6–8','Genesis 1:9–13','Genesis 1:14–19','Genesis 1:20–23','Genesis 1:24–31','Genesis 2:1–3'];
  return {title:'Creation Week',status:'Working notes, separate from the speaking draft',layout:{pairs:[{days:[1,4],label:'Light and darkness → lights that govern'},{days:[2,5],label:'Waters and sky → sea creatures and birds'},{days:[3,6],label:'Land and vegetation → land animals and humanity'}],culmination_day:7,pairing_caution:'Thematic correspondences do not by themselves prove or disprove a chronological interpretation. The gathered seas are named on day three.'},days:titles.map((title,i)=>({id:'day-'+(i+1),number:i+1,title,verse_reference:refs[i],source_url:'https://www.esv.org/Genesis+'+(i===6?'2':'1')+'/',text_summary:'Read the passage in context.',phil_observations:[],open_questions:[],editorial_cautions:[],cross_references:[],annotation:''})),history:[]};
}
export function validateCreationWeek(week) {
  if(!week||!Array.isArray(week.days)||week.days.length!==7||!week.layout||!Array.isArray(week.layout.pairs)||!Array.isArray(week.history)||week.history.length>500)throw Error('Invalid Creation Week data.');
  requireText(week.title,200);requireText(week.status,500);requireText(week.layout.pairing_caution,2000);
  if(JSON.stringify(week.layout.pairs.map(p=>p.days))!=='[[1,4],[2,5],[3,6]]'||week.layout.culmination_day!==7)throw Error('Invalid creation-day pairings.');
  for(const pair of week.layout.pairs)requireText(pair.label,300);
  const days=new Set();for(const d of week.days){if(!Number.isInteger(d.number)||d.number<1||d.number>7||d.id!=='day-'+d.number||days.has(d.id))throw Error('Invalid creation day.');days.add(d.id);for(const field of ['title','verse_reference','text_summary','annotation'])requireText(d[field],field==='annotation'?10000:2000);requireText(d.source_url,2000);let u;try{u=new URL(d.source_url);}catch{throw Error('Invalid passage URL.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Unsafe passage URL.');for(const field of ['phil_observations','open_questions','editorial_cautions','cross_references']){if(!Array.isArray(d[field])||d[field].length>100)throw Error('Invalid day notes.');for(const text of d[field])requireText(text,5000);}}
  const versions=new Set();for(const v of week.history){requireId(v.id);if(versions.has(v.id)||!days.has(v.dayId))throw Error('Invalid day-note version.');versions.add(v.id);requireTime(v.createdAt);requireText(v.text,10000);}
  return week;
}
export function saveDayVersion(workshop,dayId,text,versionId=id(),timestamp=now()) {
  const next=copy(validateWorkshop(workshop));next.creationWeek=next.creationWeek||emptyCreationWeek();const day=next.creationWeek.days.find(d=>d.id===dayId);if(!day)throw Error('Unknown creation day.');day.annotation=text;next.creationWeek.history.push({id:versionId,dayId,text,createdAt:timestamp});return validateWorkshop(next);
}
function mountCreationWeek(root,getWorkshop,save) {
  const panel=el('details',undefined,'creation-week');panel.append(el('summary','Creation Week — paired days and day notes'),el('p','Explore Scripture, observations, and open questions separately. Day notes do not change the speaking draft. Export a revision packet to share them with Dot.'));
  const error=el('p');error.setAttribute('role','status');panel.append(error);
  const data=()=>getWorkshop().creationWeek||emptyCreationWeek();
  const grid=el('div',undefined,'creation-week-grid'),detail=el('div',undefined,'creation-day-panel');panel.append(grid,detail);root.insertBefore(panel,root.querySelector('.workshop-grid'));
  let active=1;
  function openDay(number){active=number;const day=data().days.find(d=>d.number===number);detail.replaceChildren();for(const b of grid.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.day===String(number)));detail.append(el('h5','Day '+day.number+': '+day.title));const a=el('a',day.verse_reference);a.href=day.source_url;a.target='_blank';a.rel='noopener noreferrer';detail.append(a,el('p',day.text_summary));for(const [key,title]of [['phil_observations','Phil’s observations'],['open_questions','Open questions'],['editorial_cautions','Editorial cautions'],['cross_references','Compare passages']]){detail.append(el('h6',title));if(!day[key].length)detail.append(el('p',key==='phil_observations'?'No personal observations supplied yet.':'No notes supplied in this category.'));else{const ul=el('ul');for(const line of day[key])ul.append(el('li',line));detail.append(ul);}}
    const input=field(detail,'Day '+number+' workshop notes');input.maxLength=10000;input.value=day.annotation;input.placeholder='KEEP / REWRITE / QUESTION / VERIFY / MOVE / CUT';input.addEventListener('input',()=>{const next=copy(getWorkshop());next.creationWeek=next.creationWeek||emptyCreationWeek();next.creationWeek.days.find(d=>d.number===number).annotation=input.value;save(next);});
    detail.append(button('Save day '+number+' note version',()=>{try{if(save(saveDayVersion(getWorkshop(),day.id,input.value)))openDay(number);}catch(e){error.textContent=e.message;}}));
    const versions=data().history.filter(v=>v.dayId===day.id),history=el('details');history.append(el('summary','Saved day-note versions ('+versions.length+')'));for(const v of [...versions].reverse()){const row=el('article');row.append(el('p',new Date(v.createdAt).toLocaleString()+' · '+v.id),el('pre',v.text,'workshop-source'),button('Restore this day-note version',()=>{try{let next=saveDayVersion(getWorkshop(),day.id,input.value);next=saveDayVersion(next,day.id,v.text);if(save(next))openDay(number);}catch(e){error.textContent=e.message;}}));history.append(row);}detail.append(history);}
  function refresh(){const w=data();grid.replaceChildren();for(const pair of w.layout.pairs){grid.append(el('p',pair.label,'creation-pair-label'));for(const n of pair.days){const day=w.days.find(d=>d.number===n),b=button('Day '+n+' · '+day.title,()=>openDay(n));b.dataset.day=String(n);b.setAttribute('aria-pressed','false');grid.append(b);}}const rest=button('Day 7 · Completion and rest',()=>openDay(7));rest.dataset.day='7';rest.className='creation-rest';rest.setAttribute('aria-pressed','false');grid.append(rest,el('p',w.layout.pairing_caution,'creation-pair-label'));openDay(active);}
  refresh();return refresh;
}
