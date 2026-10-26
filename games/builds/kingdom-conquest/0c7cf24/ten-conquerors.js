/* Ten established Conquerors on the original battlefield. Numerical kits below
 * are playable prototype interpretations, not final canon/balance decisions.
 * Loaded only by ten.html. Classic battlefield and original asset duel remain intact. */
const TEN_ROSTER=[
 {id:'grizzly',name:'Grizzly',species:'Grizzly bear · Tank',icon:'🐻',color:'#cf9b62',hp:1950,damage:71,range:100,speed:205,radius:28,worldHeight:135,cooldown:.95,role:'tank',castAnimations:['attack','rally','rally','slam'],skills:['Lightning claws','Thunder guard','Speed burst','Thunder maul'],desc:['180 melee damage · 4s','Shield for 3s · nearby slow · 7s','Move 50% faster for 3s · 9s','320 melee area damage · stun · 22s']},
 {id:'eagle',name:'Eagle',species:'Eagle · Wind support',icon:'🦅',color:'#e7d9af',hp:1000,damage:72,range:115,speed:255,radius:22,worldHeight:145,cooldown:.75,role:'support',castAnimations:['attack','rally','walk','slam'],skills:['Tornado','Tailwind','Soar','Tempest'],desc:['165 aimed wind damage · slow · 4s','Nearby allies gain speed and shields · 7s','Terrain-blocked flight burst · 9s','260 delayed area damage · slow · 22s']},
 {id:'jon-author',name:'Jon Author',species:'Aardvark · Cleric',icon:'📖',color:'#b1b8e0',hp:1250,damage:62,range:100,speed:220,radius:23,worldHeight:155,cooldown:.85,role:'support',castAnimations:['attack','slam','rally','rally'],skills:['Expository Teaching','Bible Bump','Laying on of Hands','Excommunication'],desc:['150 aimed damage · weakens enemy · 4s','190 close book strike · stun · 7s','Heal most injured nearby ally for 25% HP · short range · 9s','240 delayed area damage · weakens enemies · 22s']},
 {id:'hyena',name:'Hyena',species:'Hyena · Pack fighter',icon:'🐾',color:'#d3ac63',hp:1300,damage:68,range:105,speed:245,radius:23,worldHeight:120,cooldown:.74,role:'fighter',castAnimations:['attack','rally','walk','rally'],skills:['Snap','Pack call','Pursuit','Pack frenzy'],desc:['170 close damage · 4s','Nearby allies empowered for 4s · 7s','Short pursuit dash · 9s','Nearby allies empowered and shielded for 6s · 22s']},
 {id:'wolf',name:'Dire Wolf',species:'Dire wolf · Assassin',icon:'🐺',color:'#97b9ce',hp:1100,damage:83,range:105,speed:275,radius:23,worldHeight:135,cooldown:.65,role:'assassin',castAnimations:['attack','rally','attack','attack'],skills:['Rending bite','Predator howl','Lunge','Relentless hunt'],desc:['210 close bite · 4s','Move faster and empower attacks for 3s · 7s','Terrain-blocked lunge · 9s','360 close damage · heal 120 · 22s']},
 {id:'tortoise',name:'Ancient Tortoise',species:'Galápagos tortoise · Psychic tank',icon:'🐢',color:'#acbe84',hp:2200,damage:52,range:105,speed:170,radius:30,worldHeight:100,cooldown:1.1,role:'tank',castAnimations:['attack','rally','rally','slam'],skills:['Psychic pulse','Shell ward','Meditate','Psychic field'],desc:['180 ranged psychic area damage · 4s','Shield nearby allies for 4s · 7s','Heal 280 and shield self · 9s','310 delayed psychic field · roots enemies · 22s']},
 {id:'spinosaurus',name:'Spinosaurus',species:'Spinosaurus · River skirmisher',icon:'🦖',color:'#63c4bb',hp:1500,damage:76,range:145,speed:225,radius:28,worldHeight:180,cooldown:.85,role:'fighter',castAnimations:['attack','slam','walk','slam'],skills:['River fang','Tidal sweep','Surge','Maelstrom'],desc:['180 aimed water damage · slow · 4s','160 nearby sweep damage · 7s','Terrain-blocked dash · 9s','310 delayed water area damage · slow · 22s']},
 {id:'theodore',name:'Theodore',species:'Opossum · Trickster',icon:'🐾',color:'#ceb393',hp:1150,damage:63,range:275,speed:240,radius:24,worldHeight:145,cooldown:.83,role:'ranged',castAnimations:['attack','rally','walk','slam'],skills:['Trick shot','Distraction','Scramble','Wild surprise'],desc:['160 aimed projectile · 4s','Nearby enemies weakened for 3s · 7s','Short escape dash · 9s','290 delayed area damage · slow · 22s']},
 {id:'ram',name:'Ram',species:'Ram · Disruptor',icon:'🐏',color:'#d1c8ab',hp:1700,damage:73,range:105,speed:220,radius:26,worldHeight:140,cooldown:.9,role:'tank',castAnimations:['attack','rally','walk','slam'],skills:['Headbutt','Brace','Charge','Crushing impact'],desc:['190 close damage · knockback · 4s','Shield for 4s · 7s','Terrain-blocked damaging charge · 9s','330 nearby damage · stun · 22s']},
 {id:'lincoln',name:'Lincoln',species:'Gorilla · The Iron Fist',icon:'🦍',color:'#79b4ac',hp:1800,damage:92,range:105,speed:200,radius:32,worldHeight:195,cooldown:.98,role:'fighter',castAnimations:['attack','rally','slam','rally'],skills:['Grab and punch','Movement burst','Leap and slam','Wrath'],desc:['Close grapple with repeated punches · 4s','Move 50% faster for 3s · 7s','Terrain-blocked leap; slows · extra grapple damage · 9s','Empowers attacks and abilities for 6s · 22s']}
];
if(MAP){const speeds=[330,360,335,350,380,300,345,345,335,330];for(let i=0;i<TEN_ROSTER.length;i++){const c=TEN_ROSTER[i];c.speed=speeds[i];c.radius=Math.round(c.radius*1.7);c.range=c.id==='theodore'?550:c.id==='spinosaurus'?225:175}}
const UPGRADED_CONQUERORS=new Set(['wolf','grizzly','eagle','hyena','ram','tortoise','spinosaurus','jon-author']);
window.CONQUEROR_MODELS=TEN_ROSTER.map(c=>({id:'hero:'+c.id,model:UPGRADED_CONQUERORS.has(c.id)?`assets/conquerors/upgrades/${c.id}.glb`:`assets/conquerors/${c.id}.glb`,...(UPGRADED_CONQUERORS.has(c.id)?{fallbackModel:`assets/conquerors/${c.id}.glb`}:{}),worldHeight:c.worldHeight}));
for(const c of TEN_ROSTER){c.kit=kits.length;kits.push(c)}
const tenById=new Map(TEN_ROSTER.map(c=>[c.id,c]));
const tenBase={init,update,updateUnit,cast,attack,releaseAttack,hurt,move,chooseEnemyTarget,skillDescription,updateUI,animal};
let tenControlled=new Set(),tenChoice='grizzly';
const tenMetrics={casts:{},attacks:{},botCasts:0,decisions:0,objectiveOrders:0};
function tenDef(u){return tenById.get(u.conqueror)}
function tenHero(c,team,lane,pos){return add({...pos,kind:'hero',conqueror:c.id,kit:c.kit,name:c.name,team,lane,progress:team?.58:.42,hp:c.hp,damage:c.damage,range:c.range,speed:c.speed,baseSpeed:c.speed,radius:c.radius,bells:0,cs:0,level:1,xp:0,mana:450,maxMana:450,skills:[0,0,0,0],respawn:0,shield:0,facing:team?2.35:-.78,overhead:({tortoise:145,wolf:165,spinosaurus:210,eagle:155}[c.id]||c.worldHeight*.72+24),pickHeight:c.worldHeight*.9,pickWidth:Math.max(32,c.worldHeight*.35),passiveHits:0})}
init=function(){
 tenBase.init();units=units.filter(u=>u.kind!=='hero');resetTargeting();tenControlled.clear();
 for(let i=0;i<10;i++){const team=i<5?0:1,slot=i%5,lane=[0,1,1,2,2][slot],p=MAP?{x:MAP.fountains[team].x+(slot%3)*110,y:MAP.fountains[team].y+Math.floor(slot/3)*(team?110:-110)}:pointOnLane(lane,team?.58:.42);if(!MAP){p.x+=(slot%2)*45;p.y+=(slot%2)*45;}tenHero(TEN_ROSTER[i],team,lane,walkablePoint(p))}
 selected=units.find(u=>u.conqueror===tenChoice)||units.find(u=>u.conqueror);if(selected.team!==0)tenSwap(selected,units.find(u=>u.kind==='hero'&&u.team===0));
 follow=true;camera.x=selected.x;camera.y=selected.y;camera.zoom=MAP?.48:1;mouse.x=selected.x+150;mouse.y=selected.y-150;
 document.getElementById('feed').innerHTML='';message('Ten Conquerors · local 5v5 bots. Destroy the enemy Castle.');renderRoster();updateUI();
};
function tenSwap(a,b){const team=a.team;a.team=b.team;b.team=team;const lane=a.lane;a.lane=b.lane;b.lane=lane;const p={x:a.x,y:a.y};a.x=b.x;a.y=b.y;b.x=p.x;b.y=p.y;for(const u of [a,b]){u.order=null;u.path=[];u.navDest=null;u.pending=null;u.dash=null}for(const u of units){if(u.order?.target?.team===u.team)u.order=null;if(u.pending?.target?.team===u.team)u.pending=null}projectiles=projectiles.filter(p=>p.target.team!==p.source.team);resetTargeting()}
function tenSelect(id){const target=units.find(u=>u.conqueror===id);if(!target)return false;closeShop();if(target.team!==0){const other=selected?.team===0?selected:units.find(u=>u.kind==='hero'&&u.team===0);tenSwap(target,other)}selected=target;tenChoice=id;follow=true;camera.x=target.x;camera.y=target.y;document.body.classList.remove('roster-open');renderRoster();updateUI();return true}
renderRoster=function(){document.getElementById('roster').innerHTML=TEN_ROSTER.map(c=>{const u=units.find(u=>u.conqueror===c.id);return `<button class="pick ${selected?.conqueror===c.id?'active':''}" data-conqueror="${c.id}"><span class="portrait">${c.icon}</span><span><strong>${c.name}</strong><small>${c.species}</small><small>${u?.team===0?'Verdant':'Crimson'} · ${c.role}</small></span></button>`}).join('');document.querySelectorAll('[data-conqueror]').forEach(b=>b.onclick=()=>tenSelect(b.dataset.conqueror))};
chooseHero=function(i){const c=TEN_ROSTER.find(c=>c.kit===i);if(c)tenSelect(c.id)};
skillDescription=function(k,i){return kits[k]?.desc?.[i]||tenBase.skillDescription(k,i)};
animal=function(u){if(!u.conqueror)return tenBase.animal(u);const c=tenDef(u);ellipse(u.x,u.y,25,17,c.color);text(c.icon,u.x,u.y-14,32);};
function tenTargets(u,center,r){return units.filter(t=>t.hp>0&&t.team!==u.team&&dist(t,center)<r+t.radius)}
function tenAllies(u,r){return units.filter(t=>t.kind==='hero'&&t.hp>0&&t.team===u.team&&dist(u,t)<=r)}
function tenHit(u,t,damage,status={}){if(!t||t.hp<=0)return;hurt(t,damage*(u.wrath>0?1.3:1),u);if(t.hp>0&&!['castle','barracks','tower'].includes(t.kind))for(const [key,v]of Object.entries(status))t[key]=Math.max(t[key]||0,v);fx(t.x,t.y,35,tenDef(u).color,'blast',.3)}
function tenArea(u,center,r,damage,status={},delay=0){effects.push({x:center.x,y:center.y,r,life:delay||.18,max:delay||.18,color:tenDef(u).color,type:delay?'telegraph':'ring',...(delay?{source:u,damage:damage*(u.wrath>0?1.3:1),tenStatus:status}:{})});if(!delay)for(const t of tenTargets(u,center,r))tenHit(u,t,damage,status)}
function tenDash(u,p,left,impact){const a=Math.atan2(p.y-u.y,p.x-u.x);u.pending=null;u.order=null;u.path=[];u.navDest=null;u.dash={x:Math.cos(a),y:Math.sin(a),left:Math.min(left,dist(u,p))};u.tenLanding=impact;u.demoAnimation=u.conqueror==='wolf'?'attack':'slam';u.demoAnimLeft=.9}
function tenShot(u,p,damage,kind){const a=Math.atan2(p.y-u.y,p.x-u.x);skillshots.push({x:u.x,y:u.y,dx:Math.cos(a),dy:Math.sin(a),speed:720,left:630,source:u,damage:damage*(u.wrath>0?1.3:1),radius:17,color:tenDef(u).color,trail:[],tenKind:kind})}
function tenClose(u,p,r){return tenTargets(u,u,r).sort((a,b)=>dist(a,p)-dist(b,p))[0]}
function tenPush(u,t,amount){if(!t||!['hero','minion','siege'].includes(t.kind))return;const d=dist(u,t)||1,q={x:t.x+(t.x-u.x)/d*amount,y:t.y+(t.y-u.y)/d*amount};if(lineClear(t,q,t.radius*.8)){Object.assign(t,q);t.path=[];t.navTimer=0}}
cast=function(u,i,p){
 if(!u?.conqueror)return tenBase.cast(u,i,p);
 if(!Number.isInteger(i)||i<0||i>3||!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||u.hp<=0||u.stun>0||u.skills[i]>0||winner!==null)return false;
 const id=u.conqueror,c=tenDef(u),cost=[35,55,45,100][i];if(u.mana<cost)return false;
 const close=(id==='lincoln'&&i===0)||(id==='wolf'&&[0,3].includes(i))||(id==='grizzly'&&[0,3].includes(i))||(id==='ram'&&i===0)||(id==='hyena'&&i===0)||(id==='jon-author'&&i===1);
 const target=close?tenClose(u,p,i===3?165:135):null;if(close&&!target){if(u===selected)floating(u.x,u.y-65,'Move closer',c.color,14);return false}
 if(id==='jon-author'&&i===2&&!tenAllies(u,MAP?250:150).some(t=>t.hp<t.maxHp))return false;
 u.mana-=cost;u.skills[i]=[4,7,9,22][i];u.recall=0;u.facing=Math.atan2(p.y-u.y,p.x-u.x);u.demoAnimation=c.castAnimations?.[i]||(i===3?'rally':i===1?'slam':'attack');u.demoAnimLeft=.75;u.attackAnim=u.demoAnimation==='rally'?0:.6;tenMetrics.casts[id+':'+i]=(tenMetrics.casts[id+':'+i]||0)+1;
 const aim={x:u.x+Math.cos(u.facing)*Math.min(450,dist(u,p)),y:u.y+Math.sin(u.facing)*Math.min(450,dist(u,p))};
 if(u===selected)tone(i===3?130:330,.15,'triangle',.035);
 if(id==='grizzly'){
  if(i===0)tenHit(u,target,180,{slow:1});if(i===1){u.shield=3;tenArea(u,u,140,50,{slow:2})}if(i===2)u.haste=3;if(i===3)tenArea(u,u,165,320,{stun:.8});
 }else if(id==='eagle'){
  if(i===0)tenShot(u,p,165,'wind');if(i===1)for(const t of tenAllies(u,280)){t.haste=3;t.shield=1.8;fx(t.x,t.y,45,c.color)}if(i===2)tenDash(u,p,250);if(i===3)tenArea(u,aim,230,260,{slow:2.5},.7);
 }else if(id==='jon-author'){
  if(i===0)tenShot(u,p,150,'doctrine');if(i===1)tenHit(u,target,190,{stun:.6});if(i===2){const t=tenAllies(u,MAP?250:150).filter(t=>t.hp<t.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];t.hp=Math.min(t.maxHp,t.hp+t.maxHp*.25);fx(t.x,t.y,80,c.color,'heal',.65)}if(i===3)tenArea(u,aim,230,240,{weaken:4},.65);
 }else if(id==='hyena'){
  if(i===0)tenHit(u,target,170);if(i===1||i===3)for(const t of tenAllies(u,i===3?340:260)){t.empower=i===3?6:4;if(i===3)t.shield=2;fx(t.x,t.y,70,c.color)}if(i===2)tenDash(u,p,210);
 }else if(id==='wolf'){
  if(i===0)tenHit(u,target,210);if(i===1){u.haste=3;u.empower=3;fx(u.x,u.y,100,c.color)}if(i===2)tenDash(u,p,270);if(i===3){tenHit(u,target,360,{slow:2});u.hp=Math.min(u.maxHp,u.hp+120)}
 }else if(id==='tortoise'){
  if(i===0)tenArea(u,aim,115,180,{slow:1},.35);if(i===1)for(const t of tenAllies(u,250)){t.shield=4;fx(t.x,t.y,65,c.color)}if(i===2){u.hp=Math.min(u.maxHp,u.hp+280);u.shield=2;fx(u.x,u.y,100,c.color,'heal',.8)}if(i===3)tenArea(u,aim,235,310,{rooted:1.3},.8);
 }else if(id==='spinosaurus'){
  if(i===0)tenShot(u,p,180,'water');if(i===1)tenArea(u,u,170,160,{slow:1.5});if(i===2)tenDash(u,p,230);if(i===3)tenArea(u,aim,230,310,{slow:3},.7);
 }else if(id==='theodore'){
  if(i===0)tenShot(u,p,160,'trick');if(i===1)tenArea(u,u,220,70,{weaken:3});if(i===2)tenDash(u,p,240);if(i===3)tenArea(u,aim,230,290,{slow:2},.65);
 }else if(id==='ram'){
  if(i===0){tenHit(u,target,190,{stun:.3});tenPush(u,target,60)}if(i===1){u.shield=4;fx(u.x,u.y,65,c.color)}if(i===2)tenDash(u,p,290,{r:130,damage:170,status:{stun:.6}});if(i===3)tenArea(u,u,190,330,{stun:1});
 }else if(id==='lincoln'){
  if(i===0){u.grapple={target,left:1.2,tick:0};target.rooted=1.2;tenHit(u,target,70)}if(i===1)u.haste=3;if(i===2){const carried=u.grapple?.target;u.grapple=null;tenDash(u,p,220,{r:170,damage:carried?260:170,status:{slow:2},carried})}if(i===3){u.wrath=6;fx(u.x,u.y,100,c.color,'blast',.7)}
 }
 burst(u.x,u.y,c.color,12);return true;
};
hurt=function(t,amount,s){if(t.weaken>0)amount*=1.15;if(s?.weaken>0)amount*=.75;if(s?.empower>0)amount*=1.2;if(s?.conqueror==='hyena'&&tenAllies(s,350).some(a=>a!==s))amount*=1.15;const alive=t.hp>0;tenBase.hurt(t,amount,s);if(alive&&t.hp<=0&&t.conqueror){t.stun=t.rooted=t.haste=t.empower=t.wrath=0;t.grapple=null;t.tenLanding=null;t.minionDot=null;t.demoAnimation=null;t.demoAnimLeft=0;t.passiveHits=0}};
attack=function(u,t){if(u.conqueror&&u.stun>0)return;const pending=u.pending;tenBase.attack(u,t);if(u.conqueror&&!pending&&u.pending){u.cd=tenDef(u).cooldown;u.pending.time=.26;u.attackAnim=.6;u.demoAnimation='attack';u.demoAnimLeft=.6;tenMetrics.attacks[u.conqueror]=(tenMetrics.attacks[u.conqueror]||0)+1}};
releaseAttack=function(u,t){if(!u.conqueror)return tenBase.releaseAttack(u,t);if(!t||t.hp<=0||dist(u,t)>u.range+t.radius+55)return;const damage=u.damage*(u.wrath>0?1.3:1)*(u.buff>0?1.3:1);if(u.conqueror==='theodore'){projectiles.push({x:u.x,y:u.y,target:t,source:u,damage,speed:650,color:tenDef(u).color,kind:'stone',distance:dist(u,t),trail:[]});return}hurt(t,damage,u);effects.push({x:u.x,y:u.y,r:u.range+10,angle:u.facing,life:.25,max:.25,color:tenDef(u).color,type:'slash'});if(u.conqueror==='lincoln'&&++u.passiveHits%3===0)tenArea(u,t,85,damage*.4);};
move=function(u,p,dt,mult=1){if(!u.conqueror)return tenBase.move(u,p,dt,mult);if(u.rooted>0||u.stun>0)return;const speed=u.speed;u.speed*=u.haste>0?1.5:1;if(u.conqueror==='spinosaurus'&&river.slice(1).some((v,i)=>segmentDistance(u,river[i],v)<100))u.speed*=1.25;tenBase.move(u,p,dt,mult);u.speed=speed};
function tenBot(u,dt){
 u.aiClock=(u.aiClock||0)-dt;if(u.aiClock>0)return;u.aiClock=.25+(u.id%4)*.03;tenMetrics.decisions++;
 if(u.recall>0)return;
 if(u.hp<u.maxHp*.23){u.order={point:{x:(MAP?.fountains||bases)[u.team].x+80,y:(MAP?.fountains||bases)[u.team].y-80}};if(dist(u,bases[u.team])>700&&clock-(u.lastHit||0)>3)u.recall=4;return}
 let target=chooseEnemyTarget(u);
 // Commit to an exposed Castle while our wave tanks it, rather than perpetually
 // switching to closer fresh minions. Original Barracks protection still applies.
 const castle=units.find(t=>t.kind==='castle'&&t.team===1-u.team&&t.hp>0);
 if(castle&&dist(u,castle)<(MAP?1200:650)&&units.some(t=>t.kind==='barracks'&&t.team===castle.team&&t.hp<=0)&&units.some(a=>a.hp>0&&a.team===u.team&&['minion','siege'].includes(a.kind)&&dist(a,castle)<castle.range+80))target=castle;
 // Stage just beyond an attacking structure's reach. Retreating to a fixed lane
 // midpoint sent bots thousands of units away and missed each arriving wave.
 if(target&&['tower','castle'].includes(target.kind)&&!units.some(a=>a.hp>0&&a.team===u.team&&['minion','siege'].includes(a.kind)&&dist(a,target)<target.range+80)){
  const d=dist(u,target)||1,r=target.range+u.radius+55;
  u.order={point:walkablePoint({x:target.x+(u.x-target.x)/d*r,y:target.y+(u.y-target.y)/d*r})};return;
 }
 if(target){u.order={target};const d=dist(u,target),near=d<(MAP?250:195);const injured=tenAllies(u,MAP?250:150).some(t=>t.hp<t.maxHp*.75);
  const candidates=[];
  if(u.conqueror==='jon-author'&&injured)candidates.push(2);
  if(['grizzly','ram','tortoise','hyena','wolf','eagle'].includes(u.conqueror)&&(near||u.hp<u.maxHp*.65))candidates.push(1);
  if(u.conqueror==='tortoise'&&u.hp<u.maxHp*.7)candidates.push(2);
  if(['wolf','ram','lincoln','hyena','grizzly','eagle','spinosaurus','theodore'].includes(u.conqueror)&&d>u.range+40&&d<(MAP?650:400))candidates.push(u.conqueror==='lincoln'?1:2);
  if(near&&['spinosaurus','theodore'].includes(u.conqueror))candidates.push(1);
  if(near||['eagle','jon-author','tortoise','theodore','spinosaurus'].includes(u.conqueror))candidates.push(0);
  if(target.kind==='hero'&&(near||['eagle','jon-author','tortoise','theodore','spinosaurus','lincoln','hyena'].includes(u.conqueror)))candidates.push(3);
  if(u.conqueror==='lincoln'&&(u.grapple||near))candidates.push(2);
  for(const i of candidates)if(cast(u,i,target)){tenMetrics.botCasts++;break}
  return;
 }
 // Push behind the advancing wave instead of stopping at the river forever.
 const enemies=units.filter(t=>t.hp>0&&t.team===1-u.team&&t.lane===u.lane&&['tower','barracks'].includes(t.kind)).sort((a,b)=>dist(a,bases[u.team])-dist(b,bases[u.team]));
 const objective=enemies[0]||units.find(t=>t.kind==='castle'&&t.team===1-u.team);
 const allies=units.filter(t=>t.hp>0&&t.team===u.team&&['minion','siege'].includes(t.kind)&&t.lane===u.lane);
 if(objective&&allies.some(a=>dist(a,objective)<(MAP?1000:600))){u.order={target:objective};tenMetrics.objectiveOrders++}
 else{const progress=nearestProgress(u,u.lane),next=clamp(progress+(u.team?-.035:.035),.08,.92);u.order={point:pointOnLane(u.lane,next),attack:true}}
}
updateUnit=function(u,dt){
 if(!u.conqueror){u.stun=Math.max(0,(u.stun||0)-dt);u.rooted=Math.max(0,(u.rooted||0)-dt);const speed=u.speed;if(u.stun>0){u.pending=null;u.cd=Math.max(u.cd,.1);u.speed=0}if(u.rooted>0)u.speed=0;tenBase.updateUnit(u,dt);u.speed=speed;return}
 const c=tenDef(u);for(const key of ['stun','rooted','haste','empower','wrath','demoAnimLeft'])u[key]=Math.max(0,(u[key]||0)-dt);if(!u.demoAnimLeft)u.demoAnimation=null;
 if(u.hp>0){
  if(u.grapple){const g=u.grapple;g.left-=dt;g.tick-=dt;if(g.target.hp<=0||g.left<=0||dist(u,g.target)>250)u.grapple=null;else if(g.tick<=0){g.tick+=.35;tenHit(u,g.target,65);u.demoAnimation='attack';u.demoAnimLeft=.4}}
  if(u.tenLanding&&!u.dash){const impact=u.tenLanding;u.tenLanding=null;if(impact.carried?.hp>0){const q=walkablePoint({x:u.x+35,y:u.y});Object.assign(impact.carried,q);impact.carried.rooted=0}tenArea(u,u,impact.r,impact.damage,impact.status)}
  if(u!==selected&&!tenControlled.has(u.id))tenBot(u,dt);
 }
 const current=selected;selected=u;
 const oldSpeed=u.speed;if(u.stun>0){u.pending=null;u.cd=Math.max(u.cd,.1);u.speed=0}if(u.rooted>0)u.speed=0;
 tenBase.updateUnit(u,dt);u.speed=oldSpeed;selected=current;
};
update=function(dt){
 // Apply telegraph secondary status and projectile debuffs at the same impact as damage.
 for(const e of effects)if(e.tenStatus&&e.life<=dt)for(const t of tenTargets(e.source,e,e.r))if(!['castle','tower','barracks'].includes(t.kind))for(const [k,v]of Object.entries(e.tenStatus))t[k]=Math.max(t[k]||0,v);
 for(const p of skillshots)if(p.tenKind){const hit=units.find(t=>t.hp>0&&t.team!==p.source.team&&Math.hypot(t.x-p.x-p.dx*p.speed*dt,t.y-p.y-p.dy*p.speed*dt)<t.radius+p.radius);if(hit&&p.tenKind==='doctrine')hit.weaken=3}
 tenBase.update(dt);
};
updateUI=function(){tenBase.updateUI();const api=window.Minion3D;if(api)document.getElementById('status').textContent+=` · Conquerors ${api.heroReady}/10`;};
function tenInput(id,input){const u=units.find(t=>t.id===id&&t.conqueror);if(!u||u.hp<=0||!input||winner!==null)return false;const p={x:clamp(Number.isFinite(input.x)?input.x:u.x,80,W-80),y:clamp(Number.isFinite(input.y)?input.y:u.y,80,H-80)};if(input.type==='cast')return cast(u,input.slot,p);if(input.type==='stop'){u.order=null;u.pending=null;u.recall=0;return true}if(input.type==='recall'){u.order=null;u.pending=null;u.dash=null;u.recall=4;return true}if(input.type==='flash'){if((u.flashCooldown||0)>clock)return false;Object.assign(u,walkablePoint({x:u.x+Math.cos(Math.atan2(p.y-u.y,p.x-u.x))*Math.min(250,dist(u,p)),y:u.y+Math.sin(Math.atan2(p.y-u.y,p.x-u.x))*Math.min(250,dist(u,p))}));u.flashCooldown=clock+25;u.order=null;u.pending=null;u.path=[];u.navDest=null;u.recall=0;return true}if(input.type==='attack'){const t=units.find(t=>t.id===input.targetId&&t.team!==u.team&&t.hp>0);if(!t)return false;u.order={target:t}}else if(input.type==='move')u.order={point:walkablePoint(p),attack:!!input.attackMove};else return false;u.recall=0;u.pending=null;u.navTimer=0;return true}
window.TenConquest={roster:TEN_ROSTER,select:tenSelect,reset:()=>init(),state:()=>({clock,winner,kills,paused,units,effects,projectiles,skillshots}),input:tenInput,setControlled:ids=>{tenControlled=new Set(ids)},metrics:tenMetrics};
init();
