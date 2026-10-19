const DEADLINE = Date.parse('2027-01-01T00:00:00-08:00');
export function requiredPace(subscribers, now=Date.now()) {
  if(!Number.isFinite(subscribers) || subscribers<0)return null;
  const remaining=Math.max(0,10000-subscribers),days=(DEADLINE-now)/86400000;
  return {remaining,days:Math.max(0,days),daily:remaining===0?0:days>0?Math.ceil(remaining/days):null};
}
if(typeof document!=='undefined'){
  const target=document.querySelector('#kat-pace');
  if(target)try{
    const response=await fetch('/assets/data/kat-kai-youtube.json',{cache:'no-store'});
    if(!response.ok)throw Error('Unavailable');
    const data=await response.json(),now=Date.now();
    const latest=data.snapshots.filter(row=>Number.isFinite(row.subscribers) && Date.parse(row.observedAt)<=now && Date.parse(row.observedAt)>=now-27*86400000).sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt))[0];
    if(!latest)throw Error('No observations');
    const pace=requiredPace(latest.subscribers,now);
    const observed=new Date(latest.observedAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric',timeZone:'America/Los_Angeles'});
    target.textContent=`${latest.subscribers.toLocaleString()} subscribers observed ${observed}. ${pace.remaining.toLocaleString()} to go. `+
      (pace.remaining===0?'10,000-subscriber target observed.':pace.daily===null?'The New Year deadline has passed. Review the target date.':`About ${Math.ceil(pace.days)} days remain; reaching the target requires an average of about ${pace.daily.toLocaleString()} net new subscribers per day from now. This is the required pace, not a forecast.`);
    if(data.status!=='ok' || now-Date.parse(latest.observedAt)>36*3600000)target.textContent+=' The latest collection is overdue or incomplete; this calculation uses the last saved total.';
  }catch{target.textContent='Subscriber data is unavailable. The required daily pace will appear after a successful collection.';}
}
