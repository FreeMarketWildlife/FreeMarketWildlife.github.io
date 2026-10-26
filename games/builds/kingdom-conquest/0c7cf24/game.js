'use strict';
const canvas=document.getElementById('game'),mini=document.getElementById('minimap'),mc=mini.getContext('2d');
let ctx=canvas.getContext('2d');
const MAP=window.KINGDOM_MAP||null;
const W=MAP?.width||3200,H=MAP?.height||3200,TAU=Math.PI*2;
const kits=[
 {name:'Aurek',species:'Lion · Vanguard',icon:'🦁',color:'#dfad58',range:100,hp:1400,damage:65,skills:['Royal Roar','Lion Sweep','Pounce','King’s Wrath']},
 {name:'Vesper',species:'Red fox · Spellweaver',icon:'🦊',color:'#ec8d61',range:260,hp:900,damage:49,skills:['Ember Burst','Foxfire','Quickstep','Wildfire']},
 {name:'Mossback',species:'Tortoise · Guardian',icon:'🐢',color:'#92b767',range:110,hp:1900,damage:44,skills:['Shell Slam','Bramble Ring','Regrowth','Ancient Grove']},
 {name:'Skyrend',species:'Eagle · Marksman',icon:'🦅',color:'#ddd1aa',range:330,hp:950,damage:57,skills:['Feather Shot','Gale','Soar','Skyfall']},
 {name:'Riptide',species:'Spinosaurus · Skirmisher',icon:'🦖',color:'#65bfc0',range:145,hp:1250,damage:60,skills:['River Fang','Tidal Sweep','Surge','Maelstrom']}
];
const lanes=MAP?.lanes||[[[350,2850],[350,500],[700,350],[2850,350]],[[350,2850],[1600,1600],[2850,350]],[[350,2850],[2700,2850],[2850,2500],[2850,350]]];
let units=[],effects=[],projectiles=[],trees=[],rocks=[],clock=0,nextWave=4,selected=null,paused=false,speed=1,winner=null,follow=true,kills=[0,0],uid=0,last=0,uiTimer=0;
const camera={x:1100,y:850,zoom:.58},mouse={x:1100,y:850},keys=new Set();
const rand=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let pointOnLane,init,nearLane,spawnWave,nearestProgress,move,hurt,attack,cast,update,terrain,animal,drawUnit,drawMini,draw,renderRoster,updateUI;
function add(o){o.id=++uid;o.maxHp=o.hp;o.radius=o.radius||16;o.cd=rand(0,.8);o.dead=0;units.push(o);return o}
function message(s){const el=document.createElement('div');el.textContent=s;document.getElementById('feed').prepend(el);while(document.getElementById('feed').children.length>5)document.getElementById('feed').lastChild.remove()}
function segmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy),0,1);return Math.hypot(p.x-a[0]-dx*t,p.y-a[1]-dy*t)}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill()}
function path(points,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke()}
function text(s,x,y,size,color='#f2e9c6'){ctx.font=`600 ${size}px "DM Sans",sans-serif`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(s,x,y)}
