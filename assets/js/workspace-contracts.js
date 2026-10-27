const root=document.querySelector('[data-workspace-contracts]');
if(root) {
  const workspace=document.body.dataset.client;
  if(!['kat-kai','philip-aram'].includes(workspace))throw new Error('Unknown workspace.');
  const endpoint=`/${workspace}/api/contracts`, list=root.querySelector('[data-contract-list]');
  const status=root.querySelector('[data-contract-status]'), retry=root.querySelector('[data-contract-retry]');
  const more=root.querySelector('[data-contract-more]');
  const shown=new Set();let cursor=null;
  function add(item) {
    if(shown.has(item.id))return;
    const url=new URL(item.url,location.origin);
    if(url.origin!==location.origin || !new RegExp(`^/${workspace}/api/contracts/[a-f0-9]{64}$`).test(url.pathname))return;
    shown.add(item.id);
    const card=document.createElement('li');card.className='contract-card';
    const heading=document.createElement('h2');heading.textContent=item.title;
    const details=document.createElement('p');details.className='contract-details';
    details.textContent=`PDF · ${Math.max(1,Math.round(item.size/1024))} KB`;
    const actions=document.createElement('div');actions.className='contract-actions';
    const open=document.createElement('a');open.href=url.pathname;open.target='_blank';open.rel='noopener';open.textContent='Open PDF';open.setAttribute('aria-label',`Open ${item.title} PDF in a new tab`);
    const download=document.createElement('a');download.href=url.pathname+'?download=1';download.textContent='Download';download.setAttribute('aria-label',`Download ${item.title} PDF`);
    actions.append(open,download);card.append(heading,details,actions);list.append(card);
  }
  async function load(next=false) {
    status.textContent='Loading contracts…';retry.hidden=true;more.hidden=true;root.setAttribute('aria-busy','true');
    try {
      const response=await fetch(endpoint+(next&&cursor?'?cursor='+encodeURIComponent(cursor):''),{credentials:'same-origin',cache:'no-store',redirect:'error'});
      if(!response.ok)throw new Error('unavailable');
      const data=await response.json();if(!Array.isArray(data.documents))throw new Error('invalid');
      if(!next){list.replaceChildren();shown.clear();}
      for(const item of data.documents)add(item);
      cursor=typeof data.cursor==='string'?data.cursor:null;more.hidden=!cursor;
      status.textContent=shown.size?'':'No contracts have been added to this workspace yet.';
    } catch {
      status.textContent='Contracts could not load. Check your connection and workspace access, then try again.';retry.hidden=false;
    } finally {root.setAttribute('aria-busy','false');}
  }
  retry.addEventListener('click',()=>load());more.addEventListener('click',()=>load(true));load();
}
