import { measure } from './planner.js?v=4';
const focuses={
 find:'<strong>Our CURRENT Focus: Discover Our Audience by Consistently Releasing Engaging Content That Fits the Kat &amp; Kai Brand</strong><span class="focus-workflow">First 90 days: sustainable work and every planned upload. An overwhelming workload or a missed upload means we’re missing our goal. Views are secondary.</span>',
 improve:'<strong>Improve Content</strong><span class="focus-workflow">Keep the same release rhythm. Learn from our audience and improve the stories, editing, and moments that connect.</span>',
 nurture:'<strong>Nurture Community</strong><span class="focus-workflow">Two long-form releases each week: Saturday and Wednesday. Keep the daily Shorts Sunday–Friday, pointing viewers to the full stories.</span>'
};
const backlog='<span class="backlog-goal"><strong>Stay 2 weeks ahead.</strong> Keep two weeks of long-form videos and Shorts finished and scheduled to publish, so sickness or a break won’t interrupt releases. Rare exceptions: time-sensitive Christmas, Halloween, and other holiday videos.</span>';
for(const button of document.querySelectorAll('[data-stage]'))button.addEventListener('click',()=>{
 const stage=button.dataset.stage;
 document.body.dataset.strategyStage=stage;
 document.querySelector('#audience-goals').hidden=stage!=='find';
 for(const tab of document.querySelectorAll('[data-stage]'))tab.setAttribute('aria-pressed',String(tab===button));
 document.querySelector('#stage-focus').innerHTML=focuses[stage]+backlog;
 const days=[...document.querySelectorAll('.release-day')];let short=0;
 days.forEach((day,i)=>{day.querySelector('.extra-short')?.remove();const long=i===0 || stage==='nurture' && i===4;day.classList.toggle('long-release',long);day.classList.toggle('short-release',!long);if(i>0)short++;day.querySelector('strong').textContent=long?'Long-form':`Short ${short}`;if(long && i>0){const extra=document.createElement('strong');extra.className='extra-short';extra.textContent=`Short ${short}`;day.querySelector('strong').after(extra);}day.querySelector('.calendar-type').textContent=long?'WEEKLY VIDEO':'DAILY SHORT';day.querySelector('.release-purpose').textContent=long?'Full story':`↖ ${stage==='nurture' && i>4?'Wednesday':'Saturday'}’s video`;});
});

export function subscriberPosition(value){
 if(!Number.isFinite(value)||value<0)return null;
 const milestones=[0,1000,5000,10000];
 if(value>=10000)return 100;
 const part=milestones.findIndex((end,i)=>i>0 && value<end)-1;
 return (part+(value-milestones[part])/(milestones[part+1]-milestones[part]))/3*100;
}
export function updateChannelProgress({subscribers=null,validPublicWatchHoursLast12Months=null}={}){
 function draw(id,labelId,value,max,position,unit){
  const track=document.querySelector(id),label=document.querySelector(labelId);
  if(!Number.isFinite(value)||value<0 || position===null){track.classList.add('unknown');track.removeAttribute('aria-valuenow');track.removeAttribute('aria-valuetext');track.querySelector('.milestone-fill').style.width='0%';label.textContent='Awaiting data';track.setAttribute('aria-label',unit+': awaiting data');return;}
  track.classList.remove('unknown');track.setAttribute('aria-valuenow',Math.min(max,value));track.setAttribute('aria-valuetext',`${value.toLocaleString()} / ${max.toLocaleString()} ${unit}`);track.setAttribute('aria-label',unit);track.querySelector('.milestone-fill').style.width=Math.min(100,position)+'%';label.textContent=`${value.toLocaleString()} / ${max.toLocaleString()}`;
 }
 draw('#subscriber-progress','#subscriber-total',subscribers,10000,subscriberPosition(subscribers),'subscribers');
 draw('#watch-hours-progress','#watch-hours-total',validPublicWatchHoursLast12Months,4000,validPublicWatchHoursLast12Months/4000*100,'qualified public watch hours in the last 12 months');
}
// Public totals can populate subscribers now. Qualified watch hours await the private integration.
fetch('/assets/data/kat-kai-youtube.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>updateChannelProgress({subscribers:measure(data,'subscribers').value})).catch(()=>updateChannelProgress());
