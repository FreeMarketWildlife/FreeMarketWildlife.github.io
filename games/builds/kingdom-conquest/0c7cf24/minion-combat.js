const MINION_BY_ID=new Map(MINION_SPECIES.map(s=>[s.id,s]));
const MINION_COLORS={arrow:'#d4b784',bolt:'#b8c9cf',stone:'#b3a596',javelin:'#d8c9a3',dart:'#a1dc73',water:'#66d8ef',fire:'#ff9d4c',heal:'#b4e28a',air:'#d0ecf3',illusion:'#c599f4',earth:'#d6b565'};
function tryMinionHeal(u){
 const injured=units.filter(t=>t.hp>0&&t.team===u.team&&['minion','hero','siege'].includes(t.kind)&&t.hp<t.maxHp*.82&&dist(u,t)<u.range).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp||a.id-b.id)[0];
 if(!injured)return false;attack(u,injured);return true;
}
function releaseMinionAttack(u,t){
 if(!u.species)return false;
 const s=MINION_BY_ID.get(u.species);
 if(t.hp<=0||dist(u,t)>u.range+t.radius+55)return true;
 if(s.role==='melee'){
  hurt(t,u.damage*(u.weaken>0?.7:1),u);
  effects.push({x:u.x,y:u.y,r:u.range+10,angle:u.facing,life:.22,max:.22,color:'#ead19c',type:'slash'});
  if(s.weapon==='shield'){u.shield=.4;fx(u.x,u.y,24,'#d7ba70','ring',.3)}
 }else{
  const healing=s.weapon==='heal'&&t.team===u.team;
  projectiles.push({x:u.x,y:u.y-8,target:t,source:u,damage:u.damage*(u.weaken>0?.7:1),healing,kind:s.projectile,color:MINION_COLORS[s.projectile],speed:s.weapon==='blowpipe'?800:s.weapon==='sling'?440:570,origin:{x:u.x,y:u.y-8},distance:dist(u,t),trail:[]});
 }
 return true;
}
function minionImpact(p){
 const t=p.target;
 if(p.healing){t.hp=Math.min(t.maxHp,t.hp+38);fx(t.x,t.y,38,MINION_COLORS.heal,'heal',.5);burst(t.x,t.y,MINION_COLORS.heal,6);return}
 hurt(t,p.damage,p.source);
 if(p.kind==='water'){t.slow=Math.max(t.slow||0,.65);fx(t.x,t.y,38,p.color,'ring',.45)}
 if(p.kind==='fire'||p.kind==='dart'){t.minionDot={left:1.5,tick:.5,damage:p.kind==='fire'?4:2,source:p.source,color:p.color}}
 if(p.kind==='air'&&t.hp>0&&['minion','hero','siege'].includes(t.kind)){
  const d=dist(p.source,t)||1,xx=t.x+(t.x-p.source.x)/d*22,yy=t.y+(t.y-p.source.y)/d*22;
  if(!blocked(xx,yy,t.radius*.8)){t.x=xx;t.y=yy;t.navTimer=0}
  fx(t.x,t.y,34,p.color,'ring',.35)
 }
 if(p.kind==='illusion'){t.weaken=1.5;fx(t.x,t.y,32,p.color,'ring',.6)}
 if(p.kind==='earth'){
  t.slow=Math.max(t.slow||0,.8);fx(t.x,t.y,52,p.color,'blast',.45);
  for(const other of units)if(other!==t&&other.hp>0&&other.team!==p.source.team&&other.team!==2&&dist(other,t)<52)hurt(other,p.damage*.4,p.source)
 }
 if(p.kind&&p.kind!=='structure-orb')burst(t.x,t.y,p.color,4);
}
function tickMinionEffects(u,dt){
 u.weaken=Math.max(0,(u.weaken||0)-dt);
 if(u.hp<=0){u.dead=(u.dead||0)+dt;return}
 const dot=u.minionDot;if(!dot)return;dot.left-=dt;dot.tick-=dt;
 if(dot.tick<=0){dot.tick+=.5;hurt(u,dot.damage,dot.source);burst(u.x,u.y,dot.color,2)}
 if(dot.left<=0)u.minionDot=null;
}
function drawMinionFallback(u){
 const s=MINION_BY_ID.get(u.species),walk=u.moving?Math.sin((u.walk||0)*2)*3:0;
 ellipse(u.x,u.y+4,14,7,'#08252f80');ctx.save();ctx.translate(u.x,u.y-4-Math.abs(walk)*.4);ctx.rotate((u.facing||0)+Math.PI/2);
 const fur=s.fur;path([[0,8],[8,20],[11,24]],['red-squirrel','dormouse','chipmunk'].includes(s.id)?9:3,fur);
 ellipse(-6,10+walk,4,6,fur);ellipse(6,10-walk,4,6,fur);ellipse(0,1,12,14,s.cloth);
 if(s.id==='hedgehog')for(let a=0;a<TAU;a+=.6)polygon([[Math.cos(a)*11,Math.sin(a)*13],[Math.cos(a+.1)*20,Math.sin(a+.1)*20],[Math.cos(a+.3)*11,Math.sin(a+.3)*13]],fur);
 if(s.id==='box-turtle')ellipse(0,3,15,17,'#af924a');
 ellipse(0,-11,10,10,fur);
 if(!['box-turtle','tree-frog','newt','toad','gecko','chameleon','sparrow','pygmy-owl'].includes(s.id))for(const side of [-1,1])ellipse(side*8,-19,s.id==='jerboa'?4:5,s.id==='jerboa'?13:6,fur);
 circle(-4,-13,2,'#131d18');circle(4,-13,2,'#131d18');
 const swing=Math.sin((u.attackAnim||0)/.38*Math.PI)*8;
 path([[12,3],[17,-20-swing]],3,s.role==='melee'?'#bcc4c0':'#815d35');
 if(s.role==='mage')circle(17,-22-swing,5,MINION_COLORS[s.weapon]);
 if(s.weapon==='bow'||s.weapon==='crossbow')path([[11,-17],[21,-10],[13,0]],2,'#c4a065');
 ellipse(-11,4,5,7,u.team?'#c87860':'#69c6bc');ctx.restore();
}
function drawMinionProjectile(p){
 if(!p.kind)return false;
 const a=Math.atan2(p.target.y-p.y,p.target.x-p.x),remaining=dist(p,p.target)/(p.distance||1),arc=p.kind==='stone'||p.kind==='javelin'?Math.sin(clamp(remaining,0,1)*Math.PI)*28:0;
 ctx.save();ctx.translate(p.x,p.y-arc);ctx.rotate(a);
 if(['arrow','bolt','dart','javelin'].includes(p.kind)){
  const length=p.kind==='javelin'?22:13;path([[-length,0],[4,0]],p.kind==='javelin'?3:2,p.color);polygon([[5,0],[-1,-3],[-1,3]],'#e5e4ce');
 }else if(p.kind==='stone'){ellipse(0,0,5,4,p.color)}
 else{
  ellipse(0,0,p.kind==='earth'?7:6,p.kind==='air'?3:6,p.color);circle(0,0,3,'#fff2c5');
  if(p.kind==='heal'){path([[-4,0],[4,0]],2,'#f3ffca');path([[0,-4],[0,4]],2,'#f3ffca')}
 }
 ctx.restore();return true;
}
