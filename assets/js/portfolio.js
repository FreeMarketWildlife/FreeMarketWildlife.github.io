const grid=document.querySelector('[data-portfolio-grid]');
const more=document.querySelector('[data-portfolio-more]');
const status=document.querySelector('[data-portfolio-status]');
const batchSize=20; // Four columns, five rows before loading another batch.
let entries=[],shown=0,observer;
function renderNext() {
  const batch=entries.slice(shown,shown+batchSize);
  for(const entry of batch) {
    const card=document.createElement(entry.href?'a':'article');card.className='portfolio-card';
    if(entry.href)card.href=entry.href;
    const header=document.createElement('div');header.className='portfolio-card-heading';
    const title=document.createElement('h2');title.textContent=entry.title;header.append(title);
    const thumbnail=document.createElement('div');thumbnail.className='portfolio-thumbnail';
    if(entry.thumbnail) {
      const img=document.createElement('img');img.src=entry.thumbnail;img.alt='';img.width=400;img.height=400;img.loading='lazy';thumbnail.append(img);
    }
    if(!entry.href){const pending=document.createElement('span');pending.className='portfolio-pending';pending.textContent='Link coming soon';thumbnail.append(pending);}
    card.append(header,thumbnail);grid.append(card);
  }
  shown+=batch.length;more.hidden=shown>=entries.length;
  if(more.hidden)observer?.disconnect();
}
more.addEventListener('click',renderNext);
try {
  const result=await fetch('/assets/data/portfolio.json');if(!result.ok)throw Error();
  entries=await result.json();renderNext();
  // Keep the manual button available for keyboard users and browsers without observers.
  if(!more.hidden && 'IntersectionObserver' in window) {
    observer=new IntersectionObserver(items=>{if(items.some(item=>item.isIntersecting))renderNext();});
    observer.observe(document.querySelector('[data-portfolio-sentinel]'));
  }
}catch {status.textContent='Unable to load the portfolio. Please refresh to try again.';}
