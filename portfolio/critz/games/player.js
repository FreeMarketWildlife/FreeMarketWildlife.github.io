const game={id:document.body.dataset.game,title:document.querySelector('h1').textContent,src:document.querySelector('#direct').getAttribute('href')};
const player=document.querySelector('#player'),screen=document.querySelector('#screen'),status=document.querySelector('#status'),launch=document.querySelector('#launch'),expand=document.querySelector('#expand'),exit=document.querySelector('#exit'),viewport=document.querySelector('#viewport-expand');
let iframe,timer,monitor;
function load(){
 clearTimeout(timer);clearInterval(monitor);status.textContent='Loading game…';launch.disabled=true;
 iframe?.remove();iframe=document.createElement('iframe');iframe.title=game.title+' playable game';iframe.allow='fullscreen; autoplay; gamepad';iframe.allowFullscreen=true;const url=new URL(game.src,location.href);url.searchParams.set('arcade-load',Date.now().toString());iframe.src=url.href;
 iframe.addEventListener('load',()=>{
  clearTimeout(timer);
  try{const doc=iframe.contentDocument;if(!doc||!doc.querySelector('canvas, #game, .game'))throw Error('Game document unavailable');monitor=setInterval(()=>{const loading=doc.querySelector('#loading');const failure=loading&&!loading.hidden&&/^Unable to load/i.test(loading.textContent)?loading.textContent:doc.querySelector('#panel-title')?.textContent==='Artwork could not load'?'Game artwork could not load.':null;if(failure){status.textContent=failure+' Try Reload game or Open game directly.';launch.disabled=false;clearInterval(monitor);}},500);doc.addEventListener('keydown',e=>{if(e.key==='Escape'&&player.classList.contains('is-expanded')&&!document.fullscreenElement)leave();});status.textContent='Game loaded. Click or tap inside to play. If it stalls, reload or open directly.';iframe.contentWindow.focus();}
  catch{status.textContent='Could not confirm the game loaded. Try Reload game or Open game directly.';launch.disabled=false;}
 });iframe.addEventListener('error',()=>{clearTimeout(timer);status.textContent='Unable to load this game. Try Reload game or Open game directly.';launch.disabled=false;});screen.replaceChildren(iframe);
 timer=setTimeout(()=>{status.textContent='This game is taking longer to load. Try Reload game or Open game directly.';launch.disabled=false;},20000);
}
function sync(){const active=player.classList.contains('is-expanded')||Boolean(document.fullscreenElement);exit.hidden=!active;expand.hidden=active||!document.fullscreenEnabled;viewport.hidden=active;document.body.classList.toggle('expanded',active);}
async function enter(native=true){player.classList.add('is-expanded');sync();if(native&&player.requestFullscreen&&document.fullscreenEnabled){try{await player.requestFullscreen();status.textContent='Fullscreen. Use Exit expanded view or Escape to return.';}catch{status.textContent='Expanded to the browser viewport. Use Exit expanded view to return.';}}else status.textContent='Expanded to the browser viewport. Browser bars may remain visible.';}
async function leave(){if(document.fullscreenElement){try{await document.exitFullscreen();}catch{}}player.classList.remove('is-expanded');sync();status.textContent=iframe?'Game loaded. Click or tap inside to play.':'Select Play to load the game.';expand.focus();}
launch.addEventListener('click',load);document.querySelector('#restart').addEventListener('click',load);expand.addEventListener('click',()=>enter(true));viewport.addEventListener('click',()=>enter(false));exit.addEventListener('click',leave);
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)player.classList.remove('is-expanded');sync();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.fullscreenElement)leave();});
window.addEventListener('message',e=>{if(e.source===iframe?.contentWindow&&e.origin===location.origin&&e.data==='arcade-exit')leave();});

sync();
