const focuses={
 find:'<strong>Our CURRENT Focus: Discover Our Audience by Consistently Releasing Engaging Content That Fits the Kat &amp; Kai Brand</strong><span class="focus-workflow">First 90 days: sustainable work and every planned upload. An overwhelming workload or a missed upload means we’re missing our goal. Views are secondary.</span>',
 improve:'<strong>Improve Content</strong><span class="focus-workflow">Keep the same release rhythm. Learn from our audience and improve the stories, editing, and moments that connect.</span>',
 nurture:'<strong>Nurture Community</strong><span class="focus-workflow">Two long-form releases each week: Saturday and Wednesday. Keep the daily Shorts Sunday–Friday, pointing viewers to the full stories.</span>'
};
const backlog='<span class="backlog-goal"><strong>Stay 2 weeks ahead.</strong> Keep two weeks of long-form videos and Shorts finished and scheduled to publish, so sickness or a break won’t interrupt releases. Rare exceptions: time-sensitive Christmas, Halloween, and other holiday videos.</span>';
for(const button of document.querySelectorAll('[data-stage]'))button.addEventListener('click',()=>{
 const stage=button.dataset.stage;
 document.body.dataset.strategyStage=stage;
 for(const tab of document.querySelectorAll('[data-stage]'))tab.setAttribute('aria-pressed',String(tab===button));
 document.querySelector('#stage-focus').innerHTML=focuses[stage]+backlog;
 const days=[...document.querySelectorAll('.release-day')];let short=0;
 days.forEach((day,i)=>{day.querySelector('.extra-short')?.remove();const long=i===0 || stage==='nurture' && i===4;day.classList.toggle('long-release',long);day.classList.toggle('short-release',!long);if(i>0)short++;day.querySelector('strong').textContent=long?'Long-form':`Short ${short}`;if(long && i>0){const extra=document.createElement('strong');extra.className='extra-short';extra.textContent=`Short ${short}`;day.querySelector('strong').after(extra);}day.querySelector('.calendar-type').textContent=long?'WEEKLY VIDEO':'DAILY SHORT';day.querySelector('.release-purpose').textContent=long?'Full story':`↖ ${stage==='nurture' && i>4?'Wednesday':'Saturday'}’s video`;});
});
