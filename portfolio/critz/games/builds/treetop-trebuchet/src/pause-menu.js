// Relocate existing controls rather than duplicating their state or handlers.
export function installPauseMenu({open,resume}){
 const $=id=>document.getElementById(id),dialog=document.createElement('dialog');dialog.id='pauseMenu';
 dialog.innerHTML='<h2>Paused</h2><button id="resumeGame" class="primary wide">Resume</button><div class="pause-workshop"></div><details><summary>Options</summary><div class="pause-options"></div></details>';
 document.body.append(dialog);
 const options=dialog.querySelector('.pause-options');
 for(const selector of ['.mode-switch','.field-controls','.hud-right','.game-logo']){const node=document.querySelector(selector);if(node)options.append(node);}
 const pause=$('pause');document.querySelector('.game').append(pause);pause.className='pause-button';pause.textContent='Ⅱ';pause.setAttribute('aria-label','Pause');
 dialog.querySelector('.pause-workshop').append(document.querySelector('.game-dock'));
 pause.onclick=()=>{if(!dialog.open){open();dialog.showModal();}};
 $('resumeGame').onclick=()=>dialog.close();dialog.addEventListener('close',resume);
 $('reset').addEventListener('click',()=>dialog.close());
 return {open(){pause.click();},get isOpen(){return dialog.open;}};
}
