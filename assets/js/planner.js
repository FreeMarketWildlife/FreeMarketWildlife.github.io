const DAY=86400000;
export const metricNames={subscribers:'Subscribers',monthlyViews:'Monthly views',views:'Total channel views',videos:'Public videos'};
export function monthKey(at) {
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit'}).formatToParts(new Date(at));
  return `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}`;
}
export function recentRows(data,now=Date.now()) {
  return (Array.isArray(data?.snapshots)?data.snapshots:[]).filter(r=>Number.isFinite(Date.parse(r.observedAt)) && Date.parse(r.observedAt)<=now && Date.parse(r.observedAt)>=now-27*DAY).sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
}
const count=v=>typeof v==='number' && Number.isFinite(v) && v>=0;
export function measure(data,metric,now=Date.now()) {
  const rows=recentRows(data,now),last=rows.at(-1);
  if(!last)return {value:null,note:'Waiting for a successful channel collection.',stale:true};
  const stale=data.status!=='ok' || now-Date.parse(last.observedAt)>36*3600000;
  if(metric==='monthlyViews') {
    const month=monthKey(now),period=rows.filter(r=>monthKey(r.observedAt)===month && count(r.views));
    if(period.length<2)return {value:null,observedAt:last.observedAt,stale,partial:true,note:'Waiting for two observations this month. Exact monthly views need owner-authorized Analytics.'};
    const first=period[0],latest=period.at(-1),value=latest.views-first.views;
    if(value<0)return {value:null,observedAt:last.observedAt,stale,partial:true,note:'Channel totals decreased. Monthly growth cannot be measured reliably from these observations.'};
    return {value,stale,partial:true,observedAt:latest.observedAt,startAt:first.observedAt,note:`Observed channel view growth, ${first.observedAt.slice(0,10)}–${latest.observedAt.slice(0,10)}. Partial month; this is a change in public totals, not an exact Analytics monthly view count.`};
  }
  return {value:count(last[metric])?last[metric]:null,observedAt:last.observedAt,stale,note:metric==='subscribers'?'YouTube rounds public subscriber counts.': 'From the latest public channel total.'};
}
export function goalProgress(goal,data,now=Date.now()) {
  const result=measure(data,goal.metric,now);
  return {...result,percent:result.value===null?null:Math.min(100,result.value/goal.target*100),remaining:result.value===null?null:Math.max(0,goal.target-result.value),state:result.value===null?'Waiting for data':result.stale?'Update overdue':result.partial?'Observed progress':result.value>=goal.target?'Target observed':'In progress'};
}
export function defaultPlan(){return {version:1,strategy:'',links:'',goals:[{id:'monthly-views',title:'100,000 views a month',metric:'monthlyViews',target:100000,due:''},{id:'subscribers',title:'1,000,000 subscribers',metric:'subscribers',target:1000000,due:''}]};}
export function validatePlan(value) {
  if(!value || value.version!==1 || typeof value.strategy!=='string' || value.strategy.length>5000 || typeof value.links!=='string' || value.links.length>5000 || !Array.isArray(value.goals) || value.goals.length>100)throw Error('Invalid planning backup.');
  const ids=new Set();
  for(const g of value.goals){if(!g || typeof g.id!=='string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(g.id) || ids.has(g.id) || typeof g.title!=='string' || !g.title.trim() || g.title.length>120 || !Object.hasOwn(metricNames,g.metric) || !Number.isSafeInteger(g.target) || g.target<=0 || typeof g.due!=='string' || (g.due && (!/^\d{4}-\d{2}-\d{2}$/.test(g.due) || !Number.isFinite(Date.parse(g.due+'T12:00:00Z')) || new Date(g.due+'T12:00:00Z').toISOString().slice(0,10)!==g.due)))throw Error('A goal is invalid.');ids.add(g.id);}
  return value;
}
if(typeof document!=='undefined')for(const root of document.querySelectorAll('[data-planner]'))mountPlanner(root);
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function mountPlanner(root) {
  const workspace=root.dataset.planner,source=root.dataset.source,title=root.dataset.title;
  const key=`fmw:planner:${workspace}:v1`;let plan=defaultPlan(),blocked=false,data=null,active=root.dataset.start || 'roadmap',busy=false;
  const status=el('p','','planner-status');status.setAttribute('role','status');
  try{const saved=localStorage.getItem(key);if(saved)plan=validatePlan(JSON.parse(saved));}catch{blocked=true;status.textContent='Saved planning data could not be read. Saving is paused to protect it.';}
  const tabs=el('nav',undefined,'planner-tabs');tabs.setAttribute('aria-label',`${title} sections`);
  const content=el('div');root.append(tabs,status,content);
  const label=el('p','Strategy and goals save in this browser. Live progress refreshes from the daily channel collection.','planner-note');root.append(label);
  if(root.dataset.embedded==='true')for(const name of ['statistics','links','strategy','roadmap']){const button=el('button',name[0].toUpperCase()+name.slice(1));button.type='button';button.addEventListener('click',()=>{active=name;render();});button.dataset.view=name;tabs.append(button);}
  function save(next=plan){try{if(blocked)throw Error('Saved data needs recovery.');validatePlan(next);localStorage.setItem(key,JSON.stringify(next));plan=next;status.textContent='Saved on this device.';return true;}catch{status.textContent='Could not save. Export a backup before leaving.';return false;}}
  function toolbar(){const bar=el('div',undefined,'planner-toolbar');const exportButton=el('button','Export plan');exportButton.type='button';exportButton.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({workspace,...plan},null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download=`${workspace}-plan.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});const importLabel=el('label','Import plan','planner-import');const input=el('input');input.type='file';input.accept='.json,application/json';input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;try{if(file.size>1000000)throw Error('Backup too large.');const parsed=JSON.parse(await file.text());if(parsed.workspace!==workspace)throw Error('This backup belongs to another workspace.');const imported=validatePlan(parsed);const next={...plan,strategy:plan.strategy || imported.strategy,links:plan.links || imported.links,goals:[...plan.goals,...imported.goals.filter(g=>!plan.goals.some(old=>old.id===g.id))]};if(save(next))render();}catch(error){status.textContent=`Import stopped: ${error.message}`;}input.value='';});importLabel.append(input);bar.append(exportButton,importLabel);return bar;}
  function metricLine(){const p=el('p',undefined,'planner-note');const rows=recentRows(data),latest=rows.at(-1);if(!source)p.textContent='Channel not connected yet.';else if(!latest)p.textContent='Waiting for the first successful channel collection.';else{p.textContent=`${data.channelTitle || title} · Last observation: ${new Date(latest.observedAt).toLocaleString()}.`;if(data.status!=='ok' || Date.now()-Date.parse(latest.observedAt)>36*3600000)p.textContent+=' Update overdue or collection incomplete.';}return p;}
  function render(){
    content.replaceChildren();for(const button of tabs.children)button.setAttribute('aria-pressed',String(button.dataset.view===active));
    if(root.dataset.embedded==='true')content.append(el('h2',`${title} / ${active[0].toUpperCase()+active.slice(1)}`));
    if(active==='strategy'){
      content.append(el('p','Write the direction, audience, content priorities, and experiments that will support your goals.'));
      const field=el('textarea');field.maxLength=5000;field.rows=14;field.value=plan.strategy;field.setAttribute('aria-label',`${title} strategy`);field.placeholder='Your strategy…';const counter=el('p',`${field.value.length} / 5,000`,'planner-note');field.addEventListener('input',()=>{plan.strategy=field.value;counter.textContent=`${field.value.length} / 5,000`;save();});content.append(field,counter,toolbar());return;
    }
    if(active==='links'){
      if(root.dataset.channelUrl){const a=el('a','YouTube channel');a.href=root.dataset.channelUrl;a.target='_blank';a.rel='noopener noreferrer';content.append(a);}
      const field=el('textarea');field.rows=8;field.maxLength=5000;field.setAttribute('aria-label',`${title} links`);field.placeholder='Add your links and notes here…';field.value=plan.links;field.addEventListener('input',()=>{plan.links=field.value;save();});content.append(field,toolbar());return;
    }
    content.append(metricLine());const refresh=el('button',busy?'Refreshing…':'Refresh statistics');refresh.type='button';refresh.disabled=busy || !source;refresh.addEventListener('click',load);content.append(refresh);
    if(active==='statistics'){
      const grid=el('div',undefined,'goal-grid');for(const metric of ['subscribers','views','videos','monthlyViews']){const result=measure(data,metric),card=el('article',undefined,'goal-card');card.append(el('h3',metricNames[metric]),el('p',result.value===null?'Awaiting data':result.value.toLocaleString(),'metric-total'),el('p',result.note,'planner-note'));grid.append(card);}content.append(grid);return;
    }
    content.append(el('p','Starter targets are editable. Progress updates automatically when new channel observations are published.','planner-note'));
    const grid=el('div',undefined,'goal-grid');
    for(const goal of plan.goals){const result=goalProgress(goal,data),card=el('article',undefined,'goal-card');card.append(el('p',result.state,'goal-state'),el('h3',goal.title));
      card.append(el('p',`${result.value===null?'—':result.value.toLocaleString()} / ${goal.target.toLocaleString()}`,'metric-total'));
      if(result.percent!==null){const progress=el('progress');progress.max=100;progress.value=result.percent;progress.setAttribute('aria-label',`${goal.title}: ${result.percent.toFixed(1)}%${result.partial?' observed growth':''}`);card.append(progress);card.append(el('p',`${result.percent.toFixed(1)}%${result.partial?' observed':' of target'} · ${result.remaining.toLocaleString()} remaining${result.partial?' against observed growth':''}`,'planner-note'));}
      card.append(el('p',result.note,'planner-note'));if(goal.due)card.append(el('p',`Target date: ${goal.due}`,'planner-note'));
      const details=el('details'),summary=el('summary','Edit goal');details.append(summary,goalForm(goal));card.append(details);grid.append(card);
    }
    content.append(grid);const add=el('details'),summary=el('summary','Add a goal');add.append(summary,goalForm());content.append(add,toolbar());
  }
  function goalForm(existing){const form=el('form',undefined,'goal-form');const fields={};for(const [name,text,type] of [['title','Goal name','text'],['metric','Track','select'],['target','Target','number'],['due','Target date (optional)','date']]){const label=el('label',text);const input=el(type==='select'?'select':'input');if(type!=='select')input.type=type;input.name=name;input.value=existing?.[name] || '';if(name==='metric'){for(const [value,title] of Object.entries(metricNames)){const option=el('option',title);option.value=value;input.append(option);}input.value=existing?.metric || 'subscribers';}if(name!=='due')input.required=true;if(name==='target'){input.min=1;input.step=1;}if(name==='title')input.maxLength=120;label.append(input);fields[name]=input;form.append(label);}const button=el('button',existing?'Save goal':'Add goal');button.type='submit';form.append(button);form.addEventListener('submit',event=>{event.preventDefault();const goal={id:existing?.id || crypto.randomUUID(),title:fields.title.value.trim(),metric:fields.metric.value,target:Number(fields.target.value),due:fields.due.value};const next={...plan,goals:existing?plan.goals.map(g=>g.id===goal.id?goal:g):[...plan.goals,goal]};if(save(next))render();});return form;}
  function refreshView(){if(!root.contains(document.activeElement) || !document.activeElement.closest('.goal-form'))render();}
  async function load(){if(busy || !source)return;busy=true;refreshView();try{const response=await fetch(`/assets/data/${encodeURIComponent(source)}.json`,{cache:'no-store'});if(!response.ok)throw Error('No published data');const next=await response.json();if(!Array.isArray(next.snapshots))throw Error('Invalid channel data');data=next;if(!blocked)status.textContent='Statistics refreshed.';}catch{status.textContent='Could not refresh statistics. Any saved observations are shown below.';if(data)data={...data,status:'update_failed'};}finally{busy=false;refreshView();}}
  render();if(source)load();setInterval(()=>{if(document.visibilityState==='visible')load();},300000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load();});
}
