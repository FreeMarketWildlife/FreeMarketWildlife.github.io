const section=document.querySelector('.welcome-signin');
const form=section?.querySelector('[data-email-signin]');
if(form) {
  const status=section.querySelector('[role=status]');
  const field=form.querySelector('input');
  const label=form.querySelector('label');
  const submit=form.querySelector('button');
  let verifying=false;
  const back=document.createElement('button');back.type='button';back.className='welcome-back';back.textContent='Use a different email or request a new code';back.hidden=true;
  form.append(back);
  back.onclick=()=>{
    verifying=false;field.type='email';field.name='email';field.autocomplete='email';field.removeAttribute('inputmode');field.removeAttribute('pattern');field.removeAttribute('minlength');field.maxLength=254;field.value='';label.textContent='Email address';submit.textContent='Continue with email';back.hidden=true;status.textContent='';field.focus();
  };
  form.addEventListener('submit',async event=>{
    event.preventDefault();submit.disabled=true;back.disabled=true;status.textContent='';
    try {
      const endpoint=verifying?'verify':'start';
      const response=await fetch('/auth/email/'+endpoint+'?returnTo='+encodeURIComponent(section.dataset.returnTo),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(verifying?{code:field.value}:{email:field.value})});
      const result=await response.json();
      if(!response.ok)throw Error(result.error||'Unable to sign in. Please try again.');
      if(verifying){location.assign(result.redirect);return;}
      status.textContent='Enter the code sent to '+field.value+'. It expires in 10 minutes.';
      verifying=true;label.textContent='8-digit code';field.type='text';field.name='code';field.inputMode='numeric';field.autocomplete='one-time-code';field.pattern='[0-9]{8}';field.minLength=8;field.maxLength=8;field.value='';submit.textContent='Verify and continue';back.hidden=false;field.focus();
    } catch(error) {status.textContent=error.message;}
    finally {submit.disabled=false;back.disabled=false;}
  });
}
