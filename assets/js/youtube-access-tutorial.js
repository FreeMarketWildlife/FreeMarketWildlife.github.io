export const inviteEmail='freemarketwildlife@gmail.com';
export const steps=[
 ['Open Settings','In YouTube Studio, check that you’re on the correct channel. Click Settings at the bottom left.'],
 ['Choose Permissions','In the Settings menu, click Permissions.'],
 ['Click Invite','Look for Invite at the top right of the Permissions panel.'],
 ['Enter our email','Enter freemarketwildlife@gmail.com in the Email field.'],
 ['Click Access','After entering the email in YouTube Studio, click the Access drop-down.'],
 ['Choose Viewer (limited)','Select Viewer (limited) from the Access menu. This is different from Editor (limited).'],
 ['Review and send','Check the email and Viewer (limited) role, then click Done. If Settings shows an available Save button, click Save too.']
];
if(typeof document!=='undefined'){
 const $=s=>document.querySelector(s);let index=0,typingTimer;
 const demo=$('#studio-demo'),status=$('#guide-status');
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 demo.inert=true;
 function button(label,action,cls=''){const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls;b.tabIndex=-1;return b;}
 function next(){if(index<steps.length-1){index++;render();$('#step-title').focus({preventScroll:true});}else{$('#completion-dialog').showModal();}}
 function render(){
  clearTimeout(typingTimer);
  $('#step-title').textContent=steps[index][0];$('#step-description').textContent=steps[index][1];$('#step-count').textContent=`Step ${index+1} of ${steps.length}`;$('#step-progress').value=index+1;$('#previous-step').disabled=index===0;$('#next-step').textContent=index===steps.length-1?'DONE ✓':'NEXT STEP →';status.textContent='';
  demo.innerHTML=`<div class="studio-top"><span class="studio-logo"><span aria-hidden="true">▶</span> Studio</span><span class="studio-search">⌕ &nbsp; Search across your channel</span><span class="avatar" aria-hidden="true">Y</span></div><div class="studio-body"><aside class="studio-sidebar"><div class="channel-icon" aria-hidden="true">Y</div><span>Your channel</span><strong>Your channel</strong><div class="studio-menu"><span>▦ &nbsp; Dashboard</span><span>▣ &nbsp; Content</span><span>▥ &nbsp; Analytics</span><span>♧ &nbsp; Community</span><span>◉ &nbsp; Earn</span><span>♬ &nbsp; Audio library</span></div><div class="settings-target"></div></aside><div class="studio-dashboard"><h3>Channel dashboard</h3><div class="dashboard-panels"><div><h4>Latest video performance</h4><div class="video-placeholder">Your latest video</div></div><div><h4>Channel analytics</h4><p>Current subscribers</p><p class="demo-number">—</p></div></div></div></div>`;
  const settings=button('⚙  Settings',index===0?'advance':null,index===0?'hotspot':'');demo.querySelector('.settings-target').append(settings);
  if(index>0){
   const overlay=document.createElement('div');overlay.className='settings-overlay';overlay.innerHTML=`<div class="studio-settings"><h3>Settings</h3><div class="settings-content"><div class="settings-nav"><span class="${index===1?'selected':''}">General</span><span>Channel</span><span>Upload defaults</span><span>Ad categories</span><div class="permissions-target"></div><span>Community moderation</span><span>Creator demographics</span><span>Promotions</span><span>Agreements</span></div><div class="settings-panel"></div></div><div class="settings-footer"><span>Close</span><span class="disabled-save">Save</span></div></div>`;
   demo.append(overlay);overlay.querySelector('.permissions-target').append(button('Permissions',index===1?'advance':null,index===1?'hotspot':'selected'));
   const panel=overlay.querySelector('.settings-panel');
   if(index===1)panel.innerHTML='<h4>Default units</h4><div class="currency">Currency<br><strong>USD — US Dollar</strong></div>';
   else {
    panel.innerHTML='<div class="permissions-heading"><h4>Permissions for Your channel</h4></div><p class="studio-explanation">Choose who can access your channel.</p><div class="permission-table"><div>Name <span>Role</span></div><div>Your account <span>Owner</span></div></div>';
    panel.querySelector('.permissions-heading').append(button('Invite',index===2?'advance':null,index===2?'studio-pill hotspot':'studio-pill'));
    if(index>=3 && index<=6){
     const invite=document.createElement('div');invite.className='invite-popover';invite.innerHTML=`<div class="studio-field ${index===3?'hotspot':''}"><span>Email</span><span id="demo-email" class="demo-email">${inviteEmail}</span></div><span class="studio-hint">Enter an email address</span><div class="access-target"></div><p class="invite-notice">You are responsible for the actions of people you give channel access to. Channel access includes private videos and playlists. Invitations expire after 30 days.</p><div class="done-target"></div>`;
     panel.append(invite);
     if(index===3 && !reducedMotion.matches){let letters=0;const email=invite.querySelector('#demo-email');email.textContent='';const type=()=>{email.textContent=inviteEmail.slice(0,++letters);if(letters<inviteEmail.length)typingTimer=setTimeout(type,45);};typingTimer=setTimeout(type,300);}
     const access=button(index===6?'Viewer (limited)  ⌄':'Access  ⌄',index===4?'access':null,'access-button '+(index===4?'hotspot':''));access.setAttribute('aria-expanded',String(index===5));invite.querySelector('.access-target').append(access);
     if(index===5){const menu=document.createElement('div');menu.className='roles-menu';menu.setAttribute('aria-label','Access roles');for(const [name,description] of [['Manager','Can edit and manage permissions.'],['Editor','Can edit channel content.'],['Editor (limited)','Can edit; cannot see revenue.'],['Subtitle editor','Can edit subtitles.'],['Viewer','Can view, including revenue.'],['Viewer (limited)','Can view, except revenue. Cannot edit.']]){const option=button('',name==='Viewer (limited)'?'advance':'wrong-role',name==='Viewer (limited)'?'role-option hotspot':'role-option');const title=document.createElement('strong');title.textContent=name;const detail=document.createElement('span');detail.textContent=description;option.append(title,detail);menu.append(option);}invite.append(menu);}
     const done=button('Done',null,'studio-pill '+(index===6?'hotspot':''));invite.querySelector('.done-target').append(done);
    }

   }
  }
  demo.dataset.step=String(index);
  if(!reducedMotion.matches){demo.animate([{opacity:.25},{opacity:1}],{duration:350,easing:'ease-out'});$('.step-copy').animate([{opacity:0},{opacity:1}],{duration:250});}
 }
 $('#next-step').addEventListener('click',next);$('#previous-step').addEventListener('click',()=>{index=Math.max(0,index-1);render();$('#step-title').focus({preventScroll:true});});$('#restart').addEventListener('click',()=>{index=0;render();$('#step-title').focus({preventScroll:true});});
 $('#close-completion').addEventListener('click',()=>$('#completion-dialog').close());
 $('#copy-email').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(inviteEmail);$('#copy-status').textContent='Email copied. Paste it into YouTube Studio’s Email field.';}catch{$('#copy-status').textContent='Select and copy freemarketwildlife@gmail.com above.';}});
 const viewport=demo.parentElement;
 function fitDemo(){const width=viewport.clientWidth,height=viewport.clientHeight,baseWidth=Math.max(600,width),scale=Math.min(width/baseWidth,height/500);demo.style.width=baseWidth+'px';demo.style.height='500px';demo.style.transform=`translate(-50%, -50%) scale(${scale})`;}
 new ResizeObserver(fitDemo).observe(viewport);
 render();fitDemo();
}
