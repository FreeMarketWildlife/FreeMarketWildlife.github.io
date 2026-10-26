import {BusinessScene} from './business-scene.js?v=5';
import {SKILLS, INTERESTS, LIMIT, cleanSelections, recommend} from './business-model.js?v=5';
const root=document.querySelector('#business-game');
const KEY='fmw-business-adventure-v1';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,fn,cls='outline-button')=>{const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;};
let state={stage:0,skills:[],interests:[],chosen:'',name:'',notes:'',consent:false,requestId:crypto.randomUUID(),receipt:null};
try {const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.version===1 && Date.now()-saved.savedAt<30*86400000){state={...state,...saved,skills:cleanSelections(saved.skills),interests:cleanSelections(saved.interests)};state.stage=Math.max(0,Math.min(4,Number(state.stage)||0));if(state.stage>0&&!state.skills.length)state.stage=0;if(state.stage>1&&!state.interests.length)state.stage=1;if(state.stage===4&&!state.receipt)state.stage=3;}}catch{}
let scene=null,victoryTimer;
let paused=matchMedia('(prefers-reduced-motion:reduce)').matches, account=null,config={},accountFailed=false,notice;
function save(){try{localStorage.setItem(KEY,JSON.stringify({...state,version:1,savedAt:Date.now()}));}catch{if(notice)notice.textContent='Browser saving is unavailable. Keep this tab open to retain your progress.';}}
async function api(path,body){const r=await fetch(path,{cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const data=await r.json().catch(()=>({error:'Unable to reach the server. Please try again.'}));if(!r.ok)throw Error(data.error||'Unable to complete this request. Please try again.');return data;}
async function loadAccount(){try{account=await api('/api/account');accountFailed=false;}catch{accountFailed=true;}}
function setStage(stage){state.stage=stage;save();render();root.querySelector('h1')?.focus();window.scrollTo({top:0,behavior:'instant'});}
function status(text){if(notice)notice.textContent=text;}
function heading(text){const h=el('h1',text,'business-title');h.tabIndex=-1;return h;}
function top(){const bar=el('div',null,'business-topline');bar.append(el('span',`BUILD A BUSINESS / ${['01 · SKILLS','02 · INTERESTS','03 · YOUR OPTIONS','04 · LET’S TALK','05 · YOU’RE IN'][state.stage]}`));const nav=el('nav');nav.setAttribute('aria-label','Adventure controls');if(state.stage>0&&state.stage<4)nav.append(button('← Back',()=>setStage(state.stage-1),'quiet-button'));if(state.stage<2){const b=button(paused?'Resume motion':'Pause motion',()=>{paused=!paused;root.classList.toggle('paused',paused);b.textContent=paused?'Resume motion':'Pause motion';b.setAttribute('aria-pressed',String(paused));},'quiet-button');b.setAttribute('aria-pressed',String(paused));nav.append(b);}nav.append(button('Start over',()=>{if(root.querySelector('.restart-confirm'))return;const confirm=el('div',null,'restart-confirm');confirm.append(el('span','Clear your saved adventure?'),button('Yes, start over',()=>{state={stage:0,skills:[],interests:[],chosen:'',name:'',notes:'',consent:false,requestId:crypto.randomUUID(),receipt:null};save();render();},'quiet-button'),button('Keep playing',()=>confirm.remove(),'quiet-button'));bar.after(confirm);},'quiet-button'));bar.append(nav);return bar;}
function burst(target,asteroid){if(paused)return;const r=target.getBoundingClientRect();
 if(!asteroid){const ring=el('i',null,'skill-target pop-ring');ring.style.left=r.x+'px';ring.style.top=r.y+'px';ring.style.width=r.width+'px';ring.style.height=r.height+'px';document.body.append(ring);setTimeout(()=>ring.remove(),260);}
 for(let i=0;i<(asteroid?18:10);i++){const p=el('i',null,'pixel-particle');p.style.left=r.x+r.width/2+'px';p.style.top=r.y+r.height/2+'px';p.style.setProperty('--dx',(Math.random()-.5)*(asteroid?200:130)+'px');p.style.setProperty('--dy',(Math.random()-.5)*150+'px');document.body.append(p);p.addEventListener('animationend',()=>p.remove(),{once:true});setTimeout(()=>p.remove(),700);}}
function play(){
 const interests=state.stage===1,key=interests?'interests':'skills',tree=interests?INTERESTS:SKILLS;
 root.append(heading(interests?'What do you ENJOY doing?':'What are you GOOD at?'));
 const arena=el('div',null,`game-arena ${key}`);arena.setAttribute('role','group');arena.setAttribute('aria-label',interests?'Interest asteroids':'Skill bubbles');root.append(arena);
 let targetCount=matchMedia('(max-width:680px)').matches?4:6;
 let pool=[],rotation=0,won=false;const flatten=(nodes,depth=0)=>nodes.flatMap(n=>[{...n,depth},...flatten(n.children,depth+1)]);
 const all=flatten(tree);let targets=[];
 const browseButton=button('All choices',()=>{
  const dialog=el('dialog',null,'choice-browser');dialog.setAttribute('aria-labelledby','choice-browser-title');
  const bar=el('div',null,'choice-browser-header');const title=el('h2',interests?'Your interests':'Your skills');title.id='choice-browser-title';
  bar.append(title,button('Close',()=>dialog.close(),'quiet-button'));
  const search=el('input');search.type='search';search.placeholder='Search choices';search.setAttribute('aria-label',interests?'Find an interest':'Find a skill');
  const list=el('div',null,'choice-browser-list');
  const unique=all.filter((n,i)=>all.findIndex(a=>a.label===n.label)===i);
  const draw=()=>{list.replaceChildren();const query=search.value.trim().toLowerCase();
   for(const n of unique.filter(n=>n.label.toLowerCase().includes(query))){const selected=state[key].includes(n.label);const choice=button(n.label,()=>{if(state[key].includes(n.label))return;select(n);draw();},'choice-option');choice.setAttribute('aria-pressed',String(selected));choice.disabled=selected||state[key].length>=LIMIT;list.append(choice);}
   if(!list.children.length)list.append(el('p','No choices found. Try another word.'));
  };
  search.oninput=draw;dialog.append(bar,search,list);root.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});draw();dialog.showModal();search.focus();
 },'quiet-button');
 root.querySelector('.business-topline nav').prepend(browseButton);
 function available(n){return !state[key].some(s=>s.toLowerCase()===n.label.toLowerCase());}
 function replenish(){const candidates=[...pool,...tree.map(n=>({...n,depth:0})),...all];for(const n of candidates){if(targets.length>=targetCount)break;if(available(n)&&!targets.some(t=>t.label===n.label))targets.push(n);}pool=pool.filter(n=>available(n)&&!targets.some(t=>t.label===n.label));}
 function targetsView(origin){scene.sync(targets,origin);scene.setDisabled(state[key].length>=LIMIT);}
 function select(n,target,origin){
  if(won||state[key].length>=LIMIT)return;
  const keyboard=target?.matches(':focus-visible');if(target)burst(target,interests);
  state[key]=cleanSelections([...state[key],n.label]);state.chosen='';state.requestId=crypto.randomUUID();state.receipt=null;
  const children=n.children.map(child=>({...child,depth:(n.depth||0)+1})).filter(available);
  targets=targets.filter(t=>t.label!==n.label);
  if(interests){targets=[...children,...targets].filter((n,i,all)=>all.findIndex(t=>t.label===n.label)===i).slice(0,targetCount);}
  else pool=[...children,...pool];
  replenish();save();targetsView(origin);dockView();status(`${n.label} added.`);
  if(state[key].length===LIMIT){won=true;scene.setDisabled(true);const victory=el('div','VICTORY','game-victory');victory.setAttribute('role','status');root.append(victory);const nextStage=state.stage+1;victoryTimer=setTimeout(()=>setStage(nextStage),1200);}
  if(keyboard)arena.querySelector('button:not(:disabled)')?.focus();
 }
 scene=new BusinessScene(arena,{interests,isPaused:()=>paused,onPick:select});
 const dock=el('div',null,'selection-dock');
 function dockView(){dock.replaceChildren();root.style.setProperty('--growth',state[key].length);const selections=el('div');const label=el('div',null,'selection-label');label.append(el('span',interests?'YOUR INTERESTS':'YOUR SKILLS'),el('small',`${state[key].length} / ${LIMIT}`));const list=el('ul',null,'selection-list');list.setAttribute('aria-label',interests?'Selected interests':'Selected skills');if(!state[key].length)list.append(el('li','—','selection-empty'));for(const value of state[key]){const chip=el('li',null,'selection-chip');chip.append(el('span',value));const remove=button('×',()=>{const idx=state[key].indexOf(value);state[key]=state[key].filter(v=>v!==value);state.chosen='';state.requestId=crypto.randomUUID();save();dockView();replenish();targetsView();status(value+' removed.');const next=dock.querySelectorAll('.selection-chip button')[Math.max(0,idx-1)];next?.focus();},'');remove.setAttribute('aria-label','Remove '+value);chip.append(remove);list.append(chip);}selections.append(label,list);const next=button('Continue →',()=>setStage(state.stage+1),'continue-button');next.disabled=!state[key].length;next.setAttribute('aria-label',interests?'Continue to three business ideas':'Continue to interests');dock.append(selections,next);}
 replenish();targetsView();dockView();root.append(arena,dock);scene.resize();
 window.addEventListener('resize',()=>{targetCount=matchMedia('(max-width:680px)').matches?4:6;targets=targets.slice(0,targetCount);replenish();targetsView();},{signal:scene.events.signal});
}
function ideas(){
 root.append(heading('What do you want to do?'));
 const matches=recommend(state.skills,state.interests);
 if(matches.length<3){
  const text=matches.length?`We found ${matches.length} strong ${matches.length===1?'match':'matches'}. Add more specific skills or interests for more options.`:'No strong matches yet. Go back and choose more specific skills and interests you actually have.';
  root.append(el('p',text,'business-help'),button('Refine my answers',()=>setStage(0),'outline-button'));
 }
 const grid=el('div',null,'business-cards');
 for(const [index,b] of matches.entries()){
  const card=el('article',null,'business-card');
  const title=el('h2',b.title);title.id='idea-'+b.id;card.setAttribute('aria-labelledby',title.id);
  card.append(el('span',`0${index+1} / YOUR OPTIONS`,'card-number'),title,el('p',b.service),el('p','For '+b.customer,'card-customer'));
  const detail=el('div',null,'card-details');
  detail.append(el('h3','WHY YOU'),el('p',`Your skills: ${b.skillMatches.join(', ')}. Your interests: ${b.interestMatches.join(', ')}.`));
  detail.append(el('h3','START SMALL'),el('p',b.first));
  const ratings=el('dl',null,'business-ratings');
  for(const [label,value] of [['Startup',b.ratings.startup],['Learning',b.ratings.learning],['Growth',b.ratings.growth]])ratings.append(el('dt',label),el('dd',value));
  detail.append(ratings);
  const work=button('GET TO WORK',()=>{if(state.chosen!==b.id||state.receipt){state.requestId=crypto.randomUUID();state.receipt=null;}state.chosen=b.id;setStage(3);},'choose-business');
  card.append(detail,work);grid.append(card);
 }
 root.append(grid);
 if(matches.length)root.append(el('p','Ratings are editorial guidance. Growth describes how the work can scale; results depend on you and your market.','ratings-note'));
}

function chosen(){return recommend(state.skills,state.interests).find(b=>b.id===state.chosen);}
function invitation(){const b=chosen();if(!b){state.stage=2;save();render();return;}const section=el('section',null,'invitation');section.append(el('p','YOUR CHOICE / '+b.title,'chosen-business'),heading('If what you’ve told me is true… then I know you can do this. Let’s get in touch.'));
 const form=el('form',null,'business-form');const label=el('label','Your name');const name=el('input');name.name='name';name.required=true;name.maxLength=100;name.autocomplete='name';name.value=state.name;name.oninput=()=>{state.name=name.value;save();};label.append(name);const message=el('label','Anything else you wanna share with me?');const notes=el('textarea');notes.name='notes';notes.maxLength=4000;notes.placeholder='Your experience, your questions, what’s holding you back…';notes.value=state.notes;notes.oninput=()=>{state.notes=notes.value;save();};message.append(notes);form.append(label,message);
 const consentLabel=el('label',null,'consent');const consent=el('input');consent.type='checkbox';consent.required=true;consent.checked=state.consent;consent.onchange=()=>{state.consent=consent.checked;save();};consentLabel.append(consent,el('span','Share my name, verified email, skills, interests, recommendations, chosen business, and message with Free Market Wildlife so we can talk about my business.'));form.append(consentLabel);const privacy=el('p',null,'small-print');const link=el('a','Privacy and data removal');link.href='/privacy/';privacy.append(link);form.append(privacy);
 const auth=el('section',null,'business-auth');auth.setAttribute('aria-label','Account verification');
 if(account?.user){auth.append(el('p','Signed in as '+account.user.email));const change=el('a','Use a different account','quiet-button');change.href='/auth/start?returnTo='+encodeURIComponent('/build-a-business/');change.onclick=()=>save();auth.append(change);}else{auth.append(el('h2','Create your account or sign in'),el('p','Your progress stays here while you verify your email. Then send your details below.'));const google=el('a','Continue with Google','outline-button');google.href='/auth/start?returnTo='+encodeURIComponent('/build-a-business/');google.onclick=()=>save();auth.append(google);const emailForm=el('form');const emailLabel=el('label','Or use your email');const email=el('input');email.type='email';email.required=true;email.maxLength=254;email.autocomplete='email';emailLabel.append(email);const send=el('button','Send sign-in code','outline-button');send.type='submit';emailForm.append(emailLabel,send);const authNotice=el('p');authNotice.setAttribute('role','status');let verifying=false;
 emailForm.onsubmit=async e=>{e.preventDefault();send.disabled=true;authNotice.textContent='';try{if(!verifying){await api('/auth/email/start?returnTo='+encodeURIComponent('/build-a-business/'),{email:email.value});verifying=true;email.readOnly=true;const codeLabel=el('label','8-digit code from your email');const code=el('input');code.name='code';code.inputMode='numeric';code.autocomplete='one-time-code';code.pattern='[0-9]{8}';code.maxLength=8;code.required=true;codeLabel.append(code);emailForm.insertBefore(codeLabel,send);send.textContent='Verify email';authNotice.textContent='Code sent. Check your inbox and spam folder.';const reset=button('Use another email / request a new code',()=>{verifying=false;email.readOnly=false;codeLabel.remove();reset.remove();send.textContent='Send sign-in code';authNotice.textContent='You can request another code after one minute.';},'quiet-button');emailForm.append(reset);code.focus();}else{await api('/auth/email/verify',{code:emailForm.elements.code.value});await loadAccount();if(!account?.user)throw Error('Email verified. Reload this page to finish sending your details.');render();status('Email verified. Review your details, then send your business plan.');}}catch(e){authNotice.textContent=e.message;}finally{send.disabled=false;}};
 if(accountFailed)auth.append(el('p','Account status could not load. You can retry signing in.'));if(account?.providers?.email!==false)auth.append(emailForm);auth.append(authNotice);}
 const submit=el('button',account?.user?'Send my business plan →':'Verify your account above to send','choose-business');submit.type='submit';submit.disabled=!account?.user;form.append(submit);form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;status('Saving your business plan…');try{const result=await api('/api/business/inquiries',{requestId:state.requestId,name:state.name,notes:state.notes,consent:state.consent,skills:state.skills,interests:state.interests,chosen:state.chosen});state.receipt={id:result.id,notification:result.notification};state.stage=4;save();render();}catch(e){status(e.message);submit.disabled=false;}};
 section.append(auth,form);root.append(section);
}
function success(){const section=el('section',null,'invitation');section.append(heading('You’re in. Let’s talk about your business.'),el('p','Your business plan has been saved privately for Free Market Wildlife.','business-help'));if(state.receipt?.notification==='pending')section.append(el('p','Your plan is saved. Email delivery is pending; your inquiry is already in the private inbox.','game-notice'));const b=chosen();if(b)section.append(el('p',b.title,'chosen-business'));if(config.bookingUrl){const link=el('a','Choose a time for our conversation →','choose-business');link.href=config.bookingUrl;link.target='_blank';link.rel='noopener noreferrer';section.append(link);const frame=el('iframe',null,'booking-frame');const url=new URL(config.bookingUrl);url.searchParams.set('embed_domain',location.hostname);url.searchParams.set('embed_type','Inline');frame.src=url.href;frame.title='Schedule a business conversation';frame.loading='lazy';section.append(frame);section.append(el('p','Meeting details and availability appear in the scheduler. You can also book later.','business-help'));}else{section.append(el('p','Want to arrange a Zoom conversation? Send me a note and we’ll find a time.','business-help'));const email=el('a','Arrange a conversation by email →','choose-business');email.href='mailto:freemarketwildlife@gmail.com?subject='+encodeURIComponent('Let’s talk: '+(b?.title||'my business'))+'&body='+encodeURIComponent('Hi! I submitted business plan '+(state.receipt?.id||'')+'. Here are some times that work for me:\n\n');section.append(email);}const actions=el('div',null,'success-actions');const home=el('a','Explore the portfolio','quiet-button');home.href='/portfolio/';actions.append(home,button('Review my options',()=>setStage(2),'quiet-button'));section.append(actions);root.append(section);}
function render(){clearTimeout(victoryTimer);document.body.classList.toggle('business-playing',state.stage<2);document.body.classList.toggle('business-options',state.stage===2);root.classList.toggle('game-playing',state.stage<2);scene?.dispose();scene=null;root.replaceChildren();root.classList.toggle('paused',paused);root.append(top());notice=el('p',null,'game-notice');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');if(state.stage<2)play();else if(state.stage===2)ideas();else if(state.stage===3)invitation();else success();root.append(notice);}
render();
await Promise.allSettled([loadAccount(),api('/api/business/config').then(c=>config=c)]);
if(state.stage>=3)render();
const query=new URLSearchParams(location.search);if(query.has('signin')&&state.stage===3)status(query.get('signin')==='cancelled'?'Sign-in cancelled. Your selections are saved.':'Sign-in failed. Please try again.');
window.addEventListener('pageshow',async event=>{if(event.persisted){await loadAccount();if(state.stage===3)render();}});
