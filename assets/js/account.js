// Enabled only by the protected Worker asset build. Never authorizes browser access itself.
const config = await fetch('/assets/data/workspace-auth.json').then(r=>r.ok?r.json():null).catch(()=>null);
if(config?.enabled) {
  const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='/assets/css/account.css?v=4';document.head.append(stylesheet);
  let dialog=document.querySelector('#access-dialog');
  if(!dialog && document.body.dataset.client) {
    dialog=document.createElement('dialog');dialog.id='access-dialog';dialog.className='access-dialog';
    dialog.setAttribute('aria-labelledby','access-title');
    const shell=document.createElement('div');shell.className='dialog-panel';dialog.append(shell);document.body.append(dialog);
  }
  const panel=dialog?.querySelector('.dialog-panel');
  const buttons=[...document.querySelectorAll('[data-open-access]')];
  const status=document.createElement('p');status.setAttribute('role','status');
  let account;
  function element(tag,text) {const el=document.createElement(tag);if(text)el.textContent=text;return el;}
  function link(text,href) {const el=element('a',text);el.href=href;return el;}
  function renderSwitcher() {
    document.querySelector('.workspace-switcher')?.remove();
    if(!document.body.dataset.client)return;
    const header=document.querySelector('#workspace-content header') || document.querySelector('header');
    if(!header)return;
    const menu=element('details');menu.className='workspace-switcher';
    const current=account.workspaces.find(w=>w.id===document.body.dataset.client);
    const summary=element('summary',current?.name || 'Workspaces');menu.append(summary);
    const content=element('div');content.className='workspace-switcher-menu';
    content.append(element('p',account.user.email));
    const nav=element('nav');nav.setAttribute('aria-label','Switch workspace');
    for(const workspace of account.workspaces) {
      const item=link(workspace.name+(workspace.id===account.primaryWorkspace?.id?' (Primary)':''),workspace.path);
      if(workspace.id===current?.id)item.setAttribute('aria-current','page');
      nav.append(item);
    }
    content.append(nav);
    if(account.owner)content.append(link('Manage access','/account/'));
    content.append(link('Switch account','/auth/start'));
    const form=element('form');form.method='post';form.action='/auth/logout';
    const logout=element('button','Sign out');logout.type='submit';form.append(logout);content.append(form);
    menu.append(content);header.append(menu);
    document.addEventListener('click',event=>{if(!menu.contains(event.target))menu.open=false;});
    menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;summary.focus();}});
  }
  if(panel) {
    panel.replaceChildren();
    const close=element('button','×');close.type='button';close.className='close-button';close.setAttribute('aria-label','Close sign in');close.onclick=()=>dialog.close();
    const title=element('h2','Sign in or create an account');title.id='access-title';
    const body=element('div');panel.append(close,title,body,status);
    const showError=()=>{status.textContent='Unable to load your account. Please try again.';};
    async function load() {
      try {
        const result=await fetch('/api/account',{cache:'no-store'});if(!result.ok)throw Error();
        account=await result.json();body.replaceChildren();status.textContent='';
        dialog.classList.toggle('account-dialog',!!account.user);
        dialog.classList.toggle('signup-dialog',!account.user);
        if(account.user) {
          if(document.querySelector('[data-access-manager]'))document.body.classList.add('account-page');
          renderSwitcher();
        }
        for(const button of buttons) {
          const label=account.user?'Workspaces':'Sign in';
          button.setAttribute('aria-label',label);
          button.querySelector('span')?.replaceChildren(document.createTextNode(label));
        }
        title.textContent=account.user?'Your workspaces':'Sign in or create an account';
        if(!account.user) {
          title.textContent='Create your account';
          const brand=element('p','FREE MARKET WILDLIFE');brand.className='signup-brand';
          const intro=element('p','One account. Your workspaces.');intro.className='signup-intro';
          body.append(brand,intro);
          const provider=(name,icon,available)=>{
            const control=available?link('', '/auth/start'):element('button');
            control.className='signup-provider'+(available?' google-sign-in':'');
            if(!available){control.type='button';control.disabled=true;}
            const mark=element('span',icon);mark.className='provider-icon';mark.setAttribute('aria-hidden','true');
            control.append(mark,element('span','Continue with '+name));
            if(!available){const badge=element('span','Not connected');badge.className='provider-badge';control.append(badge);}
            return control;
          };
          const google=provider('Google','G',true);
          google.querySelector('.provider-icon').innerHTML='<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.89 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59a14.41 14.41 0 0 1 0-9.18l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>';
          body.append(google,provider('Apple','\uF8FF',false));
          const divider=element('div','or');divider.className='signup-divider';body.append(divider);
          const emailButton=provider('email','✉',false);
          if(account.providers?.email){
            emailButton.disabled=false;emailButton.querySelector('.provider-badge').remove();
            emailButton.onclick=()=>showEmail();
          }
          body.append(emailButton);
          function showEmail(){
            title.textContent='Continue with email';body.replaceChildren(brand);status.textContent='';
            const help=element('p','We’ll send you a sign-in code.');help.className='signup-intro';body.append(help);
            const form=element('form');form.className='signup-email-form';
            const label=element('label','Email address');label.htmlFor='signin-email';
            const input=element('input');input.id='signin-email';input.name='email';input.type='email';input.autocomplete='email';input.required=true;input.maxLength=254;
            const submit=element('button','Send code');submit.type='submit';submit.className='signup-provider email-submit';
            const back=element('button','Back');back.type='button';back.className='signup-back';back.onclick=()=>load();
            form.append(label,input,submit);body.append(form,back);input.focus();
            let verifying=false;
            form.onsubmit=async event=>{
              event.preventDefault();submit.disabled=true;status.textContent='';
              const endpoint=verifying?'verify':'start';
              try{
                const response=await fetch('/auth/email/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(verifying?{code:input.value}:{email:input.value})});
                const result=await response.json();if(!response.ok)throw Error(result.error||'Unable to sign in. Please try again.');
                if(verifying){location.assign(result.redirect);return;}
                const email=input.value;verifying=true;title.textContent='Check your email';help.textContent='Enter the code sent to '+email+'. It expires in 10 minutes.';
                label.textContent='8-digit code';input.type='text';input.name='code';input.inputMode='numeric';input.autocomplete='one-time-code';input.pattern='[0-9]{8}';input.minLength=8;input.maxLength=8;input.value='';submit.textContent='Verify and continue';
                back.textContent='Use a different email or request a new code';back.onclick=showEmail;input.focus();
              }catch(error){status.textContent=error.message;}finally{submit.disabled=false;}
            };
          }
          const note=element('p',account.providers?.email?'Sign in or create an account. No password needed.':'Your first Google sign-in creates your account. Use Gmail or your Google Workspace email.');note.className='signup-note';body.append(note);
          const existing=element('p','Already have an account? ');existing.className='signup-existing';
          existing.append(link('Sign in','/auth/start'));body.append(existing);
          const footer=element('p');footer.className='signup-footer';footer.append(link('Privacy policy','/privacy/'));body.append(footer);
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
      if(account?.primaryWorkspace && !document.body.dataset.client)location.assign(account.primaryWorkspace.path);
    });
    await load();
    const query=new URLSearchParams(location.search);
    if(query.has('workspaces')||query.has('signin')) {
      if(query.has('workspaces') && account?.primaryWorkspace){location.replace(account.primaryWorkspace.path);}
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
