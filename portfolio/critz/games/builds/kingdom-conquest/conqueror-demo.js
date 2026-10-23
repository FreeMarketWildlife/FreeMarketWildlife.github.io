/* Playable asset demo. These numerical moves are temporary demo controls;
 * they do not resolve the paused Lincoln kit interview or Theodore's kit. */
window.CONQUEROR_MODELS=[
 {id:'hero:lincoln',model:'assets/conquerors/lincoln.glb',worldHeight:220},
 {id:'hero:theodore',model:'assets/conquerors/theodore.glb',worldHeight:145}
];
const CONQUERORS=[
 {id:'lincoln',name:'Lincoln',species:'Gorilla · the Iron Fist',icon:'🦍',color:'#79b4ac',hp:1800,damage:95,range:105,speed:195,radius:32,worldHeight:220,cooldown:.95},
 {id:'theodore',name:'Theodore',species:'Opossum · Theo',icon:'🐾',color:'#c8ac83',hp:1250,damage:75,range:100,speed:235,radius:26,worldHeight:145,cooldown:.78}
];
for(const c of CONQUERORS){c.kit=kits.length;kits.push({...c,skills:['Heavy strike','Ground slam','Move burst','Rally']})}
let demoChoice='lincoln',demoRound={},firstConquerorBoot=true;
window.ConquerorDemo={select:id=>{if(!CONQUERORS.some(c=>c.id===id))return;demoChoice=id;init()},state:()=>({...demoRound}),definitions:CONQUERORS};
const baseInit=init,baseUpdate=update,baseUnitUpdate=updateUnit,baseAttack=attack,baseRelease=releaseAttack,baseCast=cast,baseChooseTarget=chooseEnemyTarget,baseUI=updateUI,baseDraw=draw,baseDescription=skillDescription;
function roundHero(team){return units.find(u=>u.kind==='hero'&&u.conqueror&&u.team===team)}
function startConquerorRound(begin){
 units=units.filter(u=>u.kind!=='hero');resetTargeting();
 const player=CONQUERORS.find(c=>c.id===demoChoice),enemy=CONQUERORS.find(c=>c!==player);
 for(const [team,c] of [[0,player],[1,enemy]]){
  const p=pointOnLane(1,team?.56:.44);
  add({...p,team,kind:'hero',conqueror:c.id,kit:c.kit,name:c.name,hp:c.hp,damage:c.damage,range:c.range,radius:c.radius,speed:c.speed,lane:1,progress:team?.56:.44,bells:0,cs:0,level:1,xp:0,mana:450,maxMana:450,skills:[0,0,0,0],respawn:0,shield:0,facing:team?2.35:-.78,overhead:c.worldHeight*.672+22,pickHeight:c.worldHeight*.672,pickWidth:c.id==='lincoln'?62:37});
 }
 selected=roundHero(0);camera.x=selected.x;camera.y=selected.y;camera.zoom=canvas.clientWidth<700?.72:1.1;follow=true;paused=!begin;
 mouse.x=roundHero(1).x;mouse.y=roundHero(1).y;
 demoRound={player:player.id,opponent:enemy.id,outcome:null,winner:null};
 document.getElementById('duel-result').hidden=true;
 document.getElementById('feed').innerHTML='';message(begin?`${player.name} vs ${enemy.name}. Right-click the rival to attack.`:'Choose Lincoln or Theodore to begin. Both use their existing 3D rigs.');
 document.getElementById('pause').textContent=paused?'Resume':'Pause';
 if(!begin)document.body.classList.add('roster-open');else document.body.classList.remove('roster-open');
 renderRoster();updateUI()
}
init=function(){baseInit();startConquerorRound(!firstConquerorBoot);firstConquerorBoot=false};
renderRoster=function(){
 document.getElementById('roster').innerHTML=CONQUERORS.map(c=>`<button class="pick ${selected?.conqueror===c.id?'active':''}" data-conqueror="${c.id}"><span class="portrait">${c.icon}</span><span><strong>${c.name}</strong><small>${c.species}</small><small>${c.hp} HP · ${c.id==='lincoln'?'Heavy brawler':'Quick-footed fighter'}</small></span></button>`).join('');
 document.querySelectorAll('[data-conqueror]').forEach(b=>b.onclick=()=>ConquerorDemo.select(b.dataset.conqueror))
};
chooseEnemyTarget=function(u){
 if(u.conqueror){const rival=roundHero(1-u.team);if(rival?.hp>0&&dist(u,rival)<680)return rival}
 return baseChooseTarget(u)
};
updateUnit=function(u,dt){
 if(u.conqueror){u.demoAnimLeft=Math.max(0,(u.demoAnimLeft||0)-dt);if(u.demoAnimLeft<=0)u.demoAnimation=null}
 baseUnitUpdate(u,dt)
};
attack=function(u,t){
 const wasPending=!!u.pending;baseAttack(u,t);
 if(u.conqueror&&!wasPending&&u.pending){u.cd=CONQUERORS.find(c=>c.id===u.conqueror).cooldown;u.pending.time=.32;u.attackAnim=.65;u.demoAnimation='attack';u.demoAnimLeft=.65;u.attackSequence=(u.attackSequence||0)+1}
};
releaseAttack=function(u,t){
 if(u.conqueror&&u.pending?.heavy){if(t.hp>0&&dist(u,t)<=u.range+t.radius+55){hurt(t,u.damage*1.7,u);fx(t.x,t.y,40,kits[u.kit].color,'blast',.3);tone(90,.14,'triangle',.045)}return}
 baseRelease(u,t)
};
cast=function(u,i,p){
 if(!u?.conqueror)return baseCast(u,i,p);
 if(u!==selected||u.hp<=0||demoRound.outcome||u.skills[i]>0)return;
 if(i===2){baseCast(u,i,p);u.attackAnim=0;return}
 const cost=[35,55,45,100][i];if(u.mana<cost)return;
 let target=null;
 if(i===0){target=u.order?.target?.hp>0?u.order.target:chooseEnemyTarget(u);if(!target||dist(u,target)>u.range+target.radius+30){floating(u.x,u.y-80,'Move closer to strike','#e3d5af',15);return}if(u.pending)return}
 u.mana-=cost;u.skills[i]=[4,7,9,22][i];u.recall=0;
 if(i===0){attack(u,target);u.pending.heavy=true}
 if(i===1){u.pending=null;u.demoAnimation='slam';u.demoAnimLeft=.9;u.attackAnim=.9;effects.push({x:u.x,y:u.y,r:145,life:.45,max:.45,color:kits[u.kit].color,type:'telegraph',source:u,damage:140});tone(100,.12,'triangle',.04)}
 if(i===3){u.buff=5;u.demoAnimation='rally';u.demoAnimLeft=.9;u.attackAnim=0;fx(u.x,u.y,80,kits[u.kit].color,'ring',.8);tone(130,.2,'triangle',.035)}
};
skillDescription=function(k,i){return k>=5?['Demo: 1.7× melee strike · 4s cooldown','Demo: 140 nearby damage · 7s cooldown','Demo: short terrain-blocked burst · 9s cooldown','Demo: 5s damage rally · 22s cooldown'][i]:baseDescription(k,i)};
update=function(dt){
 if(demoRound.outcome)return;
 baseUpdate(dt);
 const player=roundHero(0),enemy=roundHero(1);
 if(player&&enemy&&(player.hp<=0||enemy.hp<=0)){
  demoRound.outcome=player.hp<=0?'defeat':'victory';demoRound.winner=player.hp>0?player.name:enemy.name;
  for(const u of [player,enemy]){u.pending=null;u.attackAnim=0;u.demoAnimation=null;u.demoAnimLeft=0;u.flash=0;u.dash=null;u.moving=false}
  const panel=document.getElementById('duel-result');panel.hidden=false;panel.innerHTML=`<small>CONQUEROR DEMO</small><h2>${demoRound.winner} wins</h2><p>${demoRound.outcome==='victory'?'Your rival is defeated.':'Your Conqueror is defeated.'} Rematch or try the other character.</p><button id="duel-rematch">Rematch</button><button id="duel-switch">Switch Conqueror</button>`;
  document.getElementById('duel-rematch').onclick=()=>init();document.getElementById('duel-switch').onclick=()=>ConquerorDemo.select(CONQUERORS.find(c=>c.id!==demoChoice).id)
 }
};
updateUI=function(){baseUI();if(!demoRound.player)return;
 if(window.Minion3D)document.getElementById('status').textContent+=` · Conquerors ${window.Minion3D.heroReady}/2`;const enemy=roundHero(1);document.getElementById('hint').textContent=demoRound.outcome?'Round complete · Rematch to fight again':paused?'Choose a Conqueror to begin · right-click move / attack':'Right-click your rival to fight · Q strike · W slam · E burst · R rally';
 if(canvas.clientWidth<600&&window.Minion3D)document.getElementById('status').textContent=`${selected?.name||'Spectating'} · 3D ${window.Minion3D.ready+window.Minion3D.heroReady}/20`;const el=document.getElementById('duel-rival');el.textContent=enemy?`RIVAL · ${enemy.name} · ${Math.ceil(enemy.hp)} / ${enemy.maxHp} HP`:'';if(demoRound.outcome)document.getElementById('status').textContent='Round complete · '+demoRound.winner+' wins';
};
draw=function(){const player=selected;if(player?.hp<=0)selected=null;baseDraw();selected=player};
init();
