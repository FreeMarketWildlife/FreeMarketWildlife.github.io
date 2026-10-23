// Shared original enemy portraits for the editor and game. Art is clipped to contacts.
export function drawEncounterDetails(ctx,{x,y,size=12,shape='circle',kind='',color='#ad8059',angle=0,motion=0,state='idle'}={}){
 if(!ctx||![x,y,size,angle,motion].every(Number.isFinite)||size<=0)return;
 const s=size;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(s,s);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=.055;ctx.strokeStyle='#243d36';
 const oval=(x,y,rx,ry,c,a=0)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,a,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();};
 const path=(points,c,stroke=true)=>{ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fillStyle=c;ctx.fill();if(stroke)ctx.stroke();};
 const line=(points,c='#294b3e',w=.05)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.stroke();};
 const gradient=ctx.createLinearGradient(-.7,-.8,.7,.9);gradient.addColorStop(0,'#f2e6ad');gradient.addColorStop(.32,color);gradient.addColorStop(1,'#29493f');
 ctx.beginPath();if(shape==='skid'){ctx.moveTo(-.78,-.22);ctx.lineTo(.78,-.22);ctx.arc(.78,0,.22,-Math.PI/2,Math.PI/2);ctx.lineTo(-.78,.22);ctx.arc(-.78,0,.22,Math.PI/2,Math.PI*1.5);ctx.closePath();}else ctx.arc(0,0,1,0,Math.PI*2);
 ctx.fillStyle=gradient;ctx.fill();ctx.stroke();ctx.clip();
 if(shape==='skid'){
  line([[-.9,.13],[.78,.13]],'#ede1a0',.04);for(const dx of [-.25,.18,.6])line([[dx-.12,-.12],[dx,.01],[dx-.12,.1]],'#e7d99b',.035);
  oval(-.65,-.025,.11,.13,'#d8e6af');oval(-.65,-.035,.04,.065,'#243d36');
 }else if(shape==='yokai'){
  path([[-.6,-.4],[-.57,-.9],[-.23,-.58],[.25,-.58],[.58,-.9],[.6,-.1],[.42,.38],[.7,.76],[.2,.64],[0,.94],[-.22,.63],[-.65,.75],[-.4,.22]],'#d9cff0');
  oval(-.39,.08,.16,.1,'#b1a0d1');oval(.39,.08,.16,.1,'#b1a0d1');
 }else if(kind.includes('bird')){
  path([[-.55,.5],[-.9,.45],[-.57,.03]],'#335c77');oval(-.2,.14,.58,.43,'#4c809e',-.3);oval(-.26,.03,.4,.22,'#9dcbd3',-.4);oval(.38,-.27,.35,.36,'#e9e2ba');path([[.61,-.3],[.95,-.12],[.64,-.04]],'#e5ae54');
  path([[-.12,.16],[.39,.16],[.39,.47],[-.12,.47]],'#f5e9c9');line([[-.12,.16],[.14,.34],[.39,.16]],'#ad8059',.025);
 }else if(shape==='wings'){
  const flap=Math.max(-1,Math.min(1,motion))*.13;
  oval(-.43,-.1,.44,.56,'#f4e8eb',-.35-flap);oval(.43,-.1,.44,.56,'#f4e8eb',.35+flap);oval(-.43,.05,.23,.3,'#bd9bce',-.4);oval(.43,.05,.23,.3,'#bd9bce',.4);oval(0,.05,.15,.65,'#e2b672');
 }else if(shape==='leaf'){
  path([[-.72,.56],[-.7,-.23],[-.18,-.77],[.7,-.65],[.67,.11],[.13,.61]],'#b9d47e');line([[-.62,.49],[.55,-.54]],'#527949',.06);line([[-.27,.15],[-.43,-.3],[-.2,-.11],[.32,-.12]],'#6f9656',.035);
 }else if(shape==='cap'){
  oval(0,.42,.23,.47,'#e8d3a2');oval(0,-.17,.88,.54,'#a94d78');oval(-.19,-.34,.61,.27,color);for(const [a,b,r]of [[-.45,-.3,.16],[.13,-.5,.12],[.5,-.2,.13]])oval(a,b,r,r*.7,'#ffe7ce');
 }else if(shape==='pod'){
  oval(0,.02,.7,.83,color);for(const dx of [-.35,0,.35]){ctx.beginPath();ctx.moveTo(dx,-.7);ctx.quadraticCurveTo(dx+.22,0,dx,.72);ctx.strokeStyle='#795934';ctx.lineWidth=.045;ctx.stroke();}path([[-.18,-.7],[0,-.96],[.25,-.67]],'#acc486');
 }else{
  for(const dy of [-.13,.22,.48]){line([[-.38,dy],[-.79,dy-.12],[-.89,dy+.09]],'#394d36',.065);line([[.38,dy],[.79,dy-.12],[.89,dy+.09]],'#394d36',.065);}
  oval(0,.18,.65,.66,'#314e3c');oval(-.28,.14,.3,.59,color,-.1);oval(.28,.14,.3,.59,color,.1);line([[0,-.38],[0,.77]],'#e5c383',.035);oval(0,-.51,.42,.31,'#4b6950');
  line([[-.23,-.65],[-.43,-.91]],'#e9c780',.045);line([[.23,-.65],[.43,-.91]],'#e9c780',.045);
 }
 if(shape!=='skid'){
  const ey=kind.includes('bird')?-.34:shape==='cap'?.35:shape==='pod'?-.1:shape==='leaf'?-.08:-.4;
  const ex=kind.includes('bird')?[.43]:[-.18,.18];for(const dx of ex){if(state==='post')line([[dx-.075,ey],[dx+.075,ey]],'#213d34',.05);else{oval(dx,ey,state==='pre'?.105:.08,.115,'#f9f1d2');oval(dx+.018,ey+.012,.038,.064,'#203c35');}}
 }
 oval(-.36,-.66,.12,.045,'#fff5cf',-.5);ctx.restore();
}
