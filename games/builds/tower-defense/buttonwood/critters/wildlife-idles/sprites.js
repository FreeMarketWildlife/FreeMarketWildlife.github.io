/* Critz idle animals. ART-BIBLE §§3–4, 8: native wildlife clusters and tiny eyes.
 * Authored at wildlife scale; no resampled concept artwork or humanoid rig. */
(()=>{
'use strict';
const A=window.ButtonwoodArt,P=A.palette,cache=new Map();
const entries=[
 ['wood-mouse','Wood mouse',26,18,'Round ears and thin pink tail'],
 ['sand-lizard','Sand lizard',30,14,'Low green body and tapering tail'],
 ['fire-salamander','Fire salamander',30,14,'Dark body with gold patches'],
 ['brush-tailed-porcupine','African brush-tailed porcupine',30,22,'Long cream quills and brush tail'],
 ['box-turtle','Box turtle',26,18,'Amber shell with broad scutes'],
 ['european-mole','European mole',24,16,'Original wildlife mole'],
 ['hedgehog','Hedgehog',26,18,'Compact spine dome and pointed face'],
 ['chipmunk','Chipmunk',26,20,'Cream back stripes and small raised tail'],
 ['red-squirrel','Red squirrel',28,26,'Large curled tail and ear tufts'],
 ['field-vole','Field vole',24,16,'Round low body and short tail'],
 ['shrew','Shrew',26,14,'Long pointed snout and tiny ears'],
 ['least-weasel','Least weasel',32,16,'Long cinnamon body and cream underside'],
 ['stoat','Stoat',32,18,'Long neck and black tail tip'],
 ['striped-skunk','Striped skunk',30,24,'Raised plume and continuous cream stripe'],
 ['pygmy-spotted-skunk','Pygmy spotted skunk',26,20,'Broken cream markings and short plume'],
 ['cottontail-rabbit','Cottontail rabbit',24,24,'Original rabbit silhouette, warm brown coat'],
 ['pika','Pika',24,18,'Round ears, squat body, no tail'],
 ['jerboa','Jerboa',30,26,'Long ears, long hindfeet and tufted tail'],
 ['dormouse','Dormouse',26,20,'Golden fur and curled furry tail'],
 ['lesser-tenrec','Lesser tenrec',26,18,'Narrow spine crest and long muzzle'],
 ['tree-frog','Tree frog',22,16,'Mint body, raised eyes and spread toe pads'],
 ['natterjack-toad','Natterjack toad',26,16,'Broad olive body and gold back stripe'],
 ['crested-newt','Crested newt',30,18,'Stepped crest and coral underside'],
 ['leopard-gecko','Leopard gecko',30,16,'Gold body, dark spots and thick tail'],
 ['brown-anole','Brown anole',30,16,'Slender brown body and coral throat']
];
const roster=Object.freeze(entries.map(([id,name,width,height,cue])=>Object.freeze({id,name,width,height,cue,anchor:Object.freeze({x:Math.floor(width/2),y:height-1})})));
const byId=new Map(roster.map(s=>[s.id,s]));
function r(g,c,x,y,w,h){g.fillStyle=P[c]||c;g.fillRect(x,y,w,h)}
function poly(g,c,pts){for(let y=Math.min(...pts.map(p=>p[1]));y<Math.max(...pts.map(p=>p[1]));y++){const cuts=[];for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[j],b=pts[i],s=y+.5;if((a[1]<=s&&b[1]>s)||(b[1]<=s&&a[1]>s))cuts.push(a[0]+(s-a[1])*(b[0]-a[0])/(b[1]-a[1]))}cuts.sort((a,b)=>a-b);for(let i=0;i+1<cuts.length;i+=2){const x=Math.ceil(cuts[i]-.5);r(g,c,x,y,Math.ceil(cuts[i+1]-.5)-x,1)}}}
function oct(g,c,x,y,w,h,k=2){poly(g,c,[[x+k,y],[x+w-k,y],[x+w,y+k],[x+w,y+h-k],[x+w-k,y+h],[x+k,y+h],[x,y+h-k],[x,y+k]])}
function mass(g,x,y,w,h,base,light,k=2){oct(g,'outline',x,y,w,h,k);oct(g,base,x+1,y+1,w-2,h-2,Math.max(1,k-1));poly(g,light,[[x+3,y+2],[x+w-5,y+1],[x+w-3,y+3],[x+w-5,y+4],[x+3,y+4],[x+2,y+5]])}
function line(g,c,points){for(let n=1;n<points.length;n++){let[x,y]=points[n-1];const[xx,yy]=points[n],dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1;let e=dx+dy;while(true){r(g,c,x,y,1,1);if(x===xx&&y===yy)break;const a=2*e;if(a>=dy){e+=dy;x+=sx}if(a<=dx){e+=dx;y+=sy}}}}
function feet(g,x,y,front=18,color='skin'){r(g,'outline',x,y,5,3);r(g,color,x+1,y,3,2);r(g,'outline',front,y,5,3);r(g,color,front+1,y,3,2)}
function face(g,x,y,w,h,base,light,nose='coral'){mass(g,x,y,w,h,base,light,2);r(g,'ink',x+w-4,y+2,1,1);r(g,nose,x+w-1,y+4,2,1)}
function ear(g,x,y,base,inside='coralLight',w=4,h=5){oct(g,'outline',x,y,w,h,1);r(g,base,x+1,y+1,w-2,h-2);r(g,inside,x+1,y+2,Math.max(1,w-3),Math.max(1,h-3))}
function tail(g,c,pts){line(g,'outline',pts);line(g,c,pts.map(([x,y])=>[x,y-1]))}
function rodent(g,kind){
 if(kind==='mouse'){tail(g,'coralLight',[[8,15],[3,14],[1,10],[2,7],[4,7]]);mass(g,6,7,14,9,'wood','woodLight',3);ear(g,15,1,'woodLight','coralLight',5,7);ear(g,20,3,'wood','coral',3,4);face(g,15,6,9,8,'woodLight','gold');r(g,'cream',20,11,3,2);feet(g,8,14,18);}
 if(kind==='vole'){tail(g,'skin',[[6,13],[2,13],[1,11]]);mass(g,4,4,16,10,'dirtLight','soilRoot',3);ear(g,16,2,'dirtLight','skin',3,4);face(g,15,6,7,7,'dirtLight','creamShade');feet(g,6,12,16);}
 if(kind==='chipmunk'){mass(g,1,4,7,12,'wood','woodLight',2);mass(g,6,9,14,9,'wood','woodLight',3);r(g,'woodShade',7,11,9,1);r(g,'cream',7,12,9,1);r(g,'woodShade',7,13,9,1);ear(g,17,4,'wood','skin',3,4);face(g,15,8,9,8,'woodLight','goldShade');r(g,'cream',16,10,4,1);r(g,'woodShade',16,12,4,1);feet(g,8,16,18);}
 if(kind==='squirrel'){poly(g,'outline',[[7,22],[2,17],[1,8],[3,2],[8,1],[13,4],[13,9],[10,12],[7,9],[7,6],[5,7],[5,13],[10,18]]);poly(g,'coralShade',[[6,20],[3,16],[2,8],[4,3],[8,2],[12,5],[12,8],[10,10],[8,8],[8,5],[5,5],[4,8],[5,14],[9,18]]);r(g,'coral',4,4,3,5);mass(g,9,14,12,10,'coralShade','coral',3);ear(g,18,7,'coral','skin',3,5);r(g,'hair',19,5,1,3);face(g,17,12,9,8,'coral','coralLight');r(g,'cream',20,18,3,4);feet(g,11,22,20,'coralLight');}
 if(kind==='dormouse'){mass(g,1,7,8,11,'goldShade','gold',2);mass(g,7,9,14,9,'goldShade','gold',3);ear(g,16,3,'gold','skin',5,6);face(g,16,8,8,8,'gold','creamShade');r(g,'cream',18,13,4,2);feet(g,9,16,18);}
 if(kind==='pika'){mass(g,3,7,16,9,'soilRoot','creamShade',3);ear(g,14,1,'soilRoot','skin',5,6);ear(g,19,3,'soilRoot','skin',3,4);face(g,14,7,9,8,'soilRoot','creamShade');r(g,'cream',17,12,4,2);feet(g,6,14,16,'creamShade');}
 if(kind==='jerboa'){tail(g,'skin',[[12,23],[6,23],[2,18],[1,13],[3,11]]);oct(g,'deepShade',1,8,4,5,1);mass(g,12,15,11,8,'woodLight','creamShade',3);ear(g,17,1,'woodLight','coralLight',4,12);ear(g,23,3,'woodLight','coralLight',3,10);face(g,18,12,9,8,'woodLight','creamShade');r(g,'cream',19,19,3,3);r(g,'outline',13,23,9,2);r(g,'skin',14,23,7,1);r(g,'outline',23,22,5,3);r(g,'skin',24,22,3,2);}
}
function reptile(g,kind){
 const newt=kind==='newt',anole=kind==='anole',gecko=kind==='gecko',salamander=kind==='salamander';
 const base=salamander||newt?'deepShade':anole?'wood':gecko?'gold':'grass';
 const light=salamander||newt?'deep':anole?'woodLight':gecko?'creamShade':'grassLight';
 const y=newt?9:gecko?7:anole?7:6;
 poly(g,'outline',[[1,y+4],[5,y+1],[13,y+1],[14,y+5],[8,y+6],[3,y+6]]);
 poly(g,base,[[2,y+4],[6,y+2],[13,y+2],[12,y+4],[7,y+5],[3,y+5]]);
 mass(g,10,y,12,7,base,light,2);face(g,20,y-1,8,7,base,light,anole?'woodShade':'outline');
 feet(g,11,y+5,22,base);r(g,newt?'coral':'creamShade',15,y+5,7,1);
 if(gecko){oct(g,'outline',1,8,10,5,2);oct(g,'goldShade',2,9,8,3,1);for(const[x,yy]of [[3,9],[6,10],[13,8],[16,10],[21,7]])r(g,'deepShade',x,yy,2,1);}
 if(salamander){for(const[x,yy]of [[5,9],[12,7],[16,8],[21,6]])r(g,'gold',x,yy,3,2)}
 if(newt){poly(g,'outline',[[4,10],[6,7],[8,9],[10,5],[12,8],[14,4],[16,7],[18,6],[20,9]]);line(g,'deepLight',[[7,9],[10,8],[14,7],[18,8]]);r(g,'coral',4,13,6,1)}
 if(anole){poly(g,'outline',[[23,11],[26,11],[25,14],[23,14]]);r(g,'coral',24,11,1,2);r(g,'woodShade',12,9,8,1)}
}
function spiny(g,kind){const porcupine=kind==='porcupine',tenrec=kind==='tenrec',y=porcupine?6:4;
 if(porcupine){tail(g,'woodShade',[[7,18],[2,18],[1,15]]);for(let n=0;n<3;n++)line(g,'creamShade',[[2,16],[1+n,12-n]])}
 mass(g,porcupine?6:2,y,porcupine?18:17,porcupine?13:11,'woodShade','wood',3);
 const tips=porcupine?[[6,4],[9,1],[12,3],[15,1],[18,3],[21,4]]:tenrec?[[4,5],[6,2],[8,4],[10,1],[12,4],[14,3]]:[[3,6],[5,3],[8,2],[11,3],[14,2],[17,5]];
 for(const[x,yy]of tips)line(g,'creamShade',[[x+2,y+8],[x,yy]]);
 for(const[x,yy]of (tenrec?[[5,8],[9,7],[12,9]]:[[6,y+4],[10,y+2],[14,y+5],[17,y+3]]))r(g,'woodLight',x,yy,2,1);
 poly(g,'outline',[[porcupine?20:15,y+4],[porcupine?25:20,y+5],[porcupine?29:25,y+8],[porcupine?26:22,y+11],[porcupine?20:15,y+11]]);
 poly(g,'woodLight',[[porcupine?21:16,y+5],[porcupine?25:20,y+6],[porcupine?28:24,y+8],[porcupine?25:21,y+10],[porcupine?21:16,y+10]]);
 r(g,'ink',porcupine?24:20,y+6,1,1);r(g,'coral',porcupine?28:24,y+8,1,1);feet(g,porcupine?8:5,porcupine?19:14,porcupine?22:18,'skinShade');}
function mustelid(g,kind){const stoat=kind==='stoat',skunk=kind==='skunk',spotted=kind==='spotted',y=skunk?13:spotted?10:stoat?8:6;
 const base=skunk||spotted?'deepShade':'wood',light=skunk||spotted?'deep':'woodLight';
 if(skunk||spotted){mass(g,1,2,skunk?10:8,skunk?17:13,base,light,3);if(skunk){line(g,'cream',[[4,4],[6,5],[5,10],[7,14],[8,17]]);line(g,'creamShade',[[5,4],[7,5],[6,10],[8,14]])}else{r(g,'cream',3,4,3,2);r(g,'cream',5,9,2,2)}}
 else {tail(g,base,[[12,y+5],[6,y+6],[2,y+4],[1,y+2]]);if(stoat){r(g,'deepShade',1,y+1,3,3)}}
 mass(g,skunk||spotted?8:8,y,skunk?16:spotted?13:17,8,base,light,3);
 r(g,skunk||spotted?'deepLight':'cream',11,y+6,11,1);
 ear(g,skunk?24:spotted?20:24,y-2,base,'skin',3,4);
 face(g,skunk?23:spotted?19:23,y,skunk?6:spotted?6:7,7,base,light);
 if(skunk)line(g,'cream',[[10,y+2],[17,y+1],[24,y+1],[26,y+3]]);
 if(spotted){r(g,'cream',9,y+2,4,1);r(g,'cream',15,y+4,3,2);r(g,'cream',20,y+1,2,1)}
 feet(g,11,y+6,skunk?23:spotted?19:23,skunk||spotted?'deep':'woodShade');}
function frog(g,toad){const base=toad?'grassShade':'mint',light=toad?'grass':'mintLight';mass(g,2,6,toad?18:13,8,base,light,3);mass(g,toad?16:12,5,8,8,base,light,2);oct(g,'outline',toad?18:14,2,5,5,1);r(g,'gold',toad?19:15,3,3,3);r(g,'ink',toad?21:17,3,1,2);r(g,'cream',toad?19:15,11,4,1);oct(g,'outline',3,10,8,5,2);r(g,base,4,11,6,3);r(g,light,3,14,2,1);r(g,light,6,14,2,1);r(g,'outline',toad?19:15,12,5,3);r(g,light,toad?20:16,13,3,1);if(toad){r(g,'gold',5,7,12,1);for(const[x,y]of [[5,10],[10,9],[14,11]])r(g,'mintShade',x,y,2,1)}}
function paint(g,id){switch(id){
case 'wood-mouse':rodent(g,'mouse');break;
case 'sand-lizard':reptile(g,'lizard');break;
case 'fire-salamander':reptile(g,'salamander');break;
case 'brush-tailed-porcupine':spiny(g,'porcupine');break;
case 'box-turtle':
 feet(g,6,14,18,'grass');poly(g,'outline',[[2,12],[5,6],[9,3],[15,3],[19,6],[21,12],[19,15],[4,15]]);poly(g,'woodShade',[[3,12],[6,7],[10,4],[14,4],[18,7],[20,12],[18,14],[4,14]]);poly(g,'goldShade',[[6,7],[10,5],[14,5],[17,8],[18,11],[6,11]]);r(g,'gold',9,6,5,3);r(g,'wood',8,10,1,3);r(g,'wood',15,9,1,4);r(g,'creamShade',4,13,15,1);face(g,19,9,6,6,'grass','grassLight','grassShade');break;
case 'european-mole':g.drawImage(A.wildlifeSprite('mole',{frame:0}),0,0);break;
case 'hedgehog':spiny(g,'hedgehog');break;
case 'chipmunk':rodent(g,'chipmunk');break;
case 'red-squirrel':rodent(g,'squirrel');break;
case 'field-vole':rodent(g,'vole');break;
case 'shrew':tail(g,'skinShade',[[7,11],[2,11],[1,9]]);mass(g,5,4,14,8,'deep','deepLight',3);poly(g,'outline',[[16,5],[21,6],[25,9],[22,11],[16,11]]);poly(g,'deepLight',[[17,6],[21,7],[24,9],[21,10],[17,10]]);r(g,'ink',20,7,1,1);r(g,'coral',24,9,1,1);feet(g,7,10,17,'skinShade');break;
case 'least-weasel':mustelid(g,'weasel');break;
case 'stoat':mustelid(g,'stoat');break;
case 'striped-skunk':mustelid(g,'skunk');break;
case 'pygmy-spotted-skunk':mustelid(g,'spotted');break;
case 'cottontail-rabbit':{
 const c=A.wildlifeSprite('rabbit',{frame:0});g.drawImage(c,0,0);const pixels=g.getImageData(0,0,24,24),map=new Map([[P.cream,P.woodLight],[P.creamShade,P.wood],[P.creamLight,P.creamShade]].map(([a,b])=>[a.slice(1),b.slice(1)]));for(let i=0;i<pixels.data.length;i+=4){const key=Array.from(pixels.data.slice(i,i+3)).map(v=>v.toString(16).padStart(2,'0')).join(''),v=map.get(key);if(v)for(let k=0;k<3;k++)pixels.data[i+k]=parseInt(v.slice(k*2,k*2+2),16)}g.putImageData(pixels,0,0);r(g,'creamLight',2,15,3,3);break;}
case 'pika':rodent(g,'pika');break;
case 'jerboa':rodent(g,'jerboa');break;
case 'dormouse':rodent(g,'dormouse');break;
case 'lesser-tenrec':spiny(g,'tenrec');break;
case 'tree-frog':frog(g,false);break;
case 'natterjack-toad':frog(g,true);break;
case 'crested-newt':reptile(g,'newt');break;
case 'leopard-gecko':reptile(g,'gecko');break;
case 'brown-anole':reptile(g,'anole');break;
}}
A.critterIdles=Object.freeze({roster,sprite(id,options={}){const s=byId.get(id);if(!s)return null;const dir=options.direction<0?-1:1,key=id+':'+dir;if(cache.has(key))return cache.get(key);const c=document.createElement('canvas');c.width=s.width;c.height=s.height;const g=c.getContext('2d');g.imageSmoothingEnabled=false;if(dir<0){g.translate(s.width,0);g.scale(-1,1);g.drawImage(A.critterIdles.sprite(id),0,0)}else paint(g,id);cache.set(key,c);return c}});
})();
