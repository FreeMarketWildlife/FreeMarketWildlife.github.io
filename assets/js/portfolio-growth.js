const host=document.querySelector('[data-public-growth]');
const number=new Intl.NumberFormat();
const label=value=>new Date(value).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric',timeZone:'America/Los_Angeles'});
const cell=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node;};
try {
  const response=await fetch('/assets/data/tanoshi-youtube.json',{cache:'no-store'});if(!response.ok)throw Error();
  const data=await response.json(),now=Date.now();
  const observations=(data.snapshots || []).filter(row=>{const time=Date.parse(row.observedAt);return time<=now && time>=now-27*86400000;}).sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
  if(!observations.length)throw Error();
  const first=observations[0],last=observations.at(-1);
  const valid=value=>typeof value==='number' && Number.isFinite(value) && value>=0;
  const table=document.createElement('table');table.className='portfolio-growth-table';
  const head=document.createElement('thead'),headRow=document.createElement('tr');
  for(const title of ['Metric','Latest','Observed change']){const th=cell('th',title);th.scope='col';headRow.append(th);}
  head.append(headRow);table.append(head);const body=document.createElement('tbody');
  for(const [key,title] of [['subscribers','Subscribers'],['views','Views'],['videos','Videos']]) {
    const row=document.createElement('tr'),name=cell('th',title);name.scope='row';row.append(name,cell('td',valid(last[key])?number.format(last[key]):'Unavailable'));
    const delta=last[key]-first[key];
    row.append(cell('td',observations.length>1 && valid(first[key]) && valid(last[key])?(delta>0?'+':'')+number.format(delta):'Awaiting observations'));body.append(row);
  }
  table.append(body);host.replaceChildren(table);
  const note=cell('p',`Public observations: ${label(first.observedAt)}–${label(last.observedAt)}. Subscriber counts may be rounded. Changes cover this observed period.`);note.className='portfolio-growth-note';host.append(note);
  if(data.status!=='ok' || now-Date.parse(last.observedAt)>36*3600000){const warning=cell('p','Latest refresh is delayed. Showing the most recent available observations.');warning.className='portfolio-growth-note';host.append(warning);}
}catch {host.replaceChildren(cell('p','Channel growth observations are not available yet.'));}
