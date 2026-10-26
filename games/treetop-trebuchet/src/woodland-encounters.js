// Original Grimroot encounters. Paths are offsets from the placed anchor so
// moving/copying a creature carries its complete route in one undo operation.
export const WOODLAND_ENEMIES=[
 {kind:'lantern-moth',name:'Lantern moth',color:'#b9b8e4',radius:.22,effect:'updraft',motion:'patrol',description:'Follows a moonlit route; a soft touch lifts you.'},
 {kind:'acorn-beetle',name:'Acorn porter',color:'#b98850',radius:.19,effect:'spin',motion:'walk',description:'Paces between two markers; its round shell rolls you onward.'},
 {kind:'puddle-frog',name:'Puddle skipper',color:'#83b582',radius:.18,effect:'updraft',motion:'bounce',description:'Hops in a steady arc; catch a hop for a lift.'},
 {kind:'spring-cap',name:'Bellcap spring',color:'#db9b85',radius:.3,effect:'updraft',motion:'still',description:'A striped springcap; its warm rim marks a strong upward pop.'},
 {kind:'gust-bloom',name:'Gust bloom',color:'#8abec2',radius:.26,effect:'gust',motion:'still',description:'A curled seed fan nudges you along the arrow. Reverse its strength to blow left.'},
 {kind:'thorn-cushion',name:'Bramble cushion',color:'#a5ad73',radius:.28,effect:'snare',motion:'still',description:'Soft hooked vines brake speed gently. No damage or instant failure.'}
].map(o=>Object.freeze({...o,id:o.kind,biome:'jungleCanopy',shape:'oval'}));
export const woodlandRecipe=kind=>WOODLAND_ENEMIES.find(o=>o.kind===kind);
export function defaultEncounterSettings(kind){const r=woodlandRecipe(kind);return{motion:r?.motion??'still',speed:r?.motion==='walk'?.3:.6,dx:r?.motion==='still'?0:2,dy:r?.motion==='patrol'?.7:0,height:.8,strength:1};}
export function validateEncounterSettings(v,kind){
 if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Encounter settings must be an object.');
 const d=defaultEncounterSettings(kind),n={...d,...v};
 if(!['still','patrol','walk','bounce'].includes(n.motion)||!Number.isFinite(n.speed)||n.speed<0||n.speed>5||!Number.isFinite(n.dx)||Math.abs(n.dx)>30||!Number.isFinite(n.dy)||Math.abs(n.dy)>30||!Number.isFinite(n.height)||n.height<0||n.height>8||!Number.isFinite(n.strength)||n.strength< -2||n.strength>2)throw Error('Encounter settings: speed 0–5 m/s, route ±30 m, hop 0–8 m, power −2…2.');
 return Object.fromEntries(['motion','speed','dx','dy','height','strength'].map(k=>[k,n[k]]));
}
/** Distance-based cosine shuttle eases at both ends. Pure simulation time
 * means pause freezes routes and every new run starts at the same anchor. */
export function encounterPose(o,time=0){
 const s=o.encounter;if(!s||s.motion==='still'||!s.speed)return{x:o.x,y:o.y,vx:0,vy:0};
 const dy=s.motion==='walk'?0:s.dy,len=Math.hypot(s.dx,dy),omega=Math.min(3,len>.001?s.speed*2/len:Math.PI*s.speed);
 const a=Math.max(0,time)*omega,u=(1-Math.cos(a))/2,du=Math.sin(a)*omega/2;
 const hop=s.motion==='bounce'?s.height*Math.sin(a)**2:0,hopV=s.motion==='bounce'?s.height*Math.sin(2*a)*omega:0;
 return{x:o.x+s.dx*u,y:o.y+dy*u+hop,vx:s.dx*du,vy:dy*du+hopV};
}
export function drawWoodlandCreature(c,kind,time=0,settings=null){
 if(!woodlandRecipe(kind))return false;
 const ink='#34473b',tau=Math.PI*2;
 const oval=(x,y,rx,ry,color)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,tau);c.fillStyle=color;c.fill();c.strokeStyle=ink;c.lineWidth=2.5;c.stroke();};
 const stroke=(pts,color=ink,w=3)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=w;c.stroke();};
 const eyes=(y=-8)=>{for(const x of[-8,8]){oval(x,y,4,5,'#fff2cd');oval(x+1,y,1.5,2.6,ink);}stroke([[-4,y+12],[0,y+14],[5,y+11]],ink,2);};
 const wave=Math.sin(time*9);
 if(kind==='lantern-moth'){
  for(const side of[-1,1]){c.save();c.scale(side,1);c.rotate(wave*.08);oval(24,-13,23,26,'#b7b9df');oval(25,15,19,16,'#ded3df');oval(30,-15,8,10,'#f5d98d');oval(30,-15,3,4,'#6d718f');stroke([[8,-4],[35,-34]],'#e9e6ee',2);c.restore();}
  oval(0,1,10,28,'#a694b6');oval(0,21,7,9,'#f9de8d');stroke([[-4,-23],[-12,-38],[-20,-40]]);stroke([[4,-23],[12,-38],[20,-40]]);eyes(-12);
 }else if(kind==='acorn-beetle'){
  for(const side of[-1,1])for(let i=0;i<3;i++)stroke([[side*17,-5+i*14],[side*33,-12+i*14],[side*42,-5+i*14+wave*3]]);
  oval(0,8,30,31,'#b58250');oval(-8,4,12,23,'#d5a768');stroke([[0,-20],[0,38]],'#725d3e',3);oval(0,-20,23,15,'#789876');stroke([[-24,-18],[24,-18]],'#e0bd7a',4);eyes(-23);
 }else if(kind==='puddle-frog'){
  stroke([[-16,13],[-35,25+wave*2],[-45,18]],ink,6);stroke([[16,13],[35,25+wave*2],[45,18]],ink,6);oval(0,6,29,25,'#74a57e');oval(0,15,19,14,'#d9da9f');for(const x of[-14,14])oval(x,-15,12,13,'#8dbb8a');eyes(-16);for(const x of[-22,23])oval(x,2,4,3,'#c6d49a');
 }else if(kind==='spring-cap'){
  stroke([[-13,29],[12,22],[-12,15],[12,8],[-10,1]],'#dec58c',6);oval(0,35,25,6,'#849466');oval(0,-4,43,17,'#f5d798');c.beginPath();c.moveTo(-42,-6);c.bezierCurveTo(-35,-52,35,-52,42,-6);c.closePath();c.fillStyle='#ce8176';c.fill();c.strokeStyle=ink;c.lineWidth=3;c.stroke();for(const x of[-21,0,21])oval(x,-19-(x===0?9:0),6,4,'#fff0bf');stroke([[-30,-2],[30,-2]],'#ffe9a3',4);eyes(9);
 }else if(kind==='gust-bloom'){
  for(let i=0;i<5;i++){c.save();c.rotate(i*tau/5+Math.sin(time*2)*.08);oval(0,-24,12,22,i%2?'#c3ddce':'#87b8bb');stroke([[0,-10],[0,-36]],'#e4ecd0',2);c.restore();}oval(0,0,16,16,'#ebcf89');eyes(-5);const dir=(settings?.strength??1)<0?-1:1;c.save();c.scale(dir,1);stroke([[24,31],[44,31],[37,25]],'#deedcd',3);stroke([[44,31],[37,38]],'#deedcd',3);c.restore();
 }else{
  for(let i=0;i<8;i++){const a=i*tau/8;stroke([[Math.cos(a)*20,Math.sin(a)*20],[Math.cos(a)*40,Math.sin(a)*40],[Math.cos(a+.2)*34,Math.sin(a+.2)*34]],'#71835d',5);}oval(0,0,29,27,'#a4ad74');for(let i=0;i<3;i++)stroke([[-23,-12+i*12],[0,-4+i*12],[23,-12+i*12]],'#d0ce8c',2);eyes(-9);
 }
 return true;
}
