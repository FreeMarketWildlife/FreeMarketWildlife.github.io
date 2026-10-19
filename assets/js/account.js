// Enabled only by the protected Worker asset build. Never authorizes browser access itself.
const config = await fetch('/assets/data/workspace-auth.json').then(r=>r.ok?r.json():null).catch(()=>null);
if(config?.enabled) {
  const dialog=document.querySelector('#access-dialog');
  const panel=dialog?.querySelector('.dialog-panel');
  const buttons=[...document.querySelectorAll('[data-open-access]')];
  const status=document.createElement('p');status.setAttribute('role','status');
  let account;
  function element(tag,text) {const el=document.createElement(tag);if(text)el.textContent=text;return el;}
  function link(text,href) {const el=element('a',text);el.href=href;return el;}
  if(panel) {
    panel.replaceChildren();
    const close=element('button','×');close.type='button';close.className='close-button';close.setAttribute('aria-label','Close sign in');close.onclick=()=>dialog.close();
    const title=element('h2','Sign in');title.id='access-title';
    const body=element('div');panel.append(close,title,body,status);
    const showError=()=>{status.textContent='Unable to load your account. Please try again.';};
    async function load() {
      try {
        const result=await fetch('/api/account',{cache:'no-store'});if(!result.ok)throw Error();
        account=await result.json();body.replaceChildren();status.textContent='';
        for(const button of buttons) {
          const label=account.user?'Workspaces':'Sign in';
          button.setAttribute('aria-label',label);
          button.querySelector('span')?.replaceChildren(document.createTextNode(label));
        }
        title.textContent=account.user?'Your workspaces':'Sign in';
        if(!account.user) {
          const google=link('Continue with Google','/auth/start');google.className='google-sign-in';body.append(google);
        } else {
          body.append(element('p',account.user.email));
          const nav=element('nav');nav.setAttribute('aria-label','Your workspaces');const list=element('ul');
          for(const workspace of account.workspaces){const li=element('li');li.append(link(workspace.name,workspace.path));list.append(li);}
          nav.append(list);body.append(nav);
          if(!account.workspaces.length)body.append(link('Build a Business','/build-a-business/'));
          if(account.owner)body.append(link('Manage access','/account/'));
          body.append(link('Switch account','/auth/start'));
          const form=element('form');form.method='post';form.action='/auth/logout';const logout=element('button','Sign out');logout.type='submit';form.append(logout);body.append(form);
        }
      }catch{showError();}
    }
    // app.js still opens/closes the shared dialog. Refresh permissions every time it opens.
    for(const button of buttons)button.addEventListener('click',async()=>{
      await load();
    });
    await load();
    const query=new URLSearchParams(location.search);
    if(query.has('workspaces')||query.has('signin')) {
      dialog.showModal();
      if(query.get('signin')==='failed')status.textContent='Sign-in failed. Please try again with a Gmail or Google Workspace account.';
      if(query.get('signin')==='cancelled')status.textContent='Sign-in cancelled.';
      history.replaceState(null,'',location.pathname+location.hash);
    }
  }
  const manager=document.querySelector('[data-access-manager]');
  if(manager) {
    const form=manager.querySelector('form'), list=manager.querySelector('[data-memberships]'), notice=manager.querySelector('[role=status]');
    async function refresh(){
      const r=await fetch('/api/account/memberships',{cache:'no-store'});if(!r.ok)throw Error();
      list.replaceChildren();
      for(const row of await r.json()){
        const li=element('li',`${row.email} — ${row.workspace} `), remove=element('button','Revoke');remove.type='button';
        remove.onclick=async()=>{try{const result=await fetch('/api/account/memberships',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify(row)});if(!result.ok)throw Error();await refresh();notice.textContent='Access revoked.';}catch{notice.textContent='Unable to revoke access.';}};
        li.append(remove);list.append(li);
      }
    }
    form.addEventListener('submit',async event=>{event.preventDefault();try{
      const data=Object.fromEntries(new FormData(form));
      const r=await fetch('/api/account/memberships',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(!r.ok)throw Error();
      await refresh();notice.textContent='Access granted.';
    }catch{notice.textContent='Unable to grant access.';}});
    refresh().catch(()=>{notice.textContent='Unable to load access permissions.';});
  }
}
