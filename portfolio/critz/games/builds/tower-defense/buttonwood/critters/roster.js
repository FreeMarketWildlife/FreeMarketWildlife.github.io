/* Clothing-free Critz Workers. Shapes are authored in native world pixels. */
(() => {
 'use strict';
 const A=window.ButtonwoodArt,P=A.palette;
 const roster=[
  {id:'wood-mouse',name:'Wood mouse',family:'mouse',cue:'Round ears, pink paws, curling thin tail'},
  {id:'sand-lizard',name:'Sand lizard',family:'reptile',fur:'grass',light:'grassLight',shade:'grassShade',belly:'creamShade',ear:'none',tail:'taper',pattern:'scales',head:[17,10],body:[12,12],cue:'Green scales, long tapering tail'},
  {id:'fire-salamander',name:'Fire salamander',family:'amphibian',fur:'deepShade',light:'deep',shade:'ink',belly:'gold',ear:'none',tail:'thick',pattern:'gold-spots',head:[17,10],body:[13,12],cue:'Rounded dark head and gold spots'},
  {id:'brush-tailed-porcupine',name:'African brush-tailed porcupine',family:'spiny',fur:'wood',light:'woodLight',shade:'woodShade',belly:'creamShade',ear:'small',tail:'brush',quills:'long',head:[13,11],body:[14,12],snout:3,cue:'Long cream quills and bristly tail'},
  {id:'box-turtle',name:'Box turtle',family:'turtle',fur:'grass',light:'mintLight',shade:'grassShade',belly:'creamShade',ear:'none',tail:'stub',shell:true,head:[14,10],body:[13,12],cue:'Domed patterned shell and green limbs'},
  {id:'european-mole',name:'European mole',family:'burrower',fur:'deep',light:'deepLight',shade:'deepShade',belly:'deep',ear:'none',tail:'short',head:[15,11],body:[16,12],snout:4,eyes:'tiny',paws:'dig',cue:'Tiny eyes, broad pink digging paws'},
  {id:'hedgehog',name:'Hedgehog',family:'spiny',fur:'woodLight',light:'creamShade',shade:'wood',belly:'cream',ear:'small',tail:'none',quills:'round',head:[12,11],body:[15,12],snout:4,cue:'Round spine mantle and pointed muzzle'},
  {id:'chipmunk',name:'Chipmunk',family:'rodent',fur:'wood',light:'woodLight',shade:'woodShade',belly:'cream',ear:'point',tail:'small-bush',pattern:'chip-stripes',head:[14,12],body:[12,12],cue:'Face/back stripes and upright tail'},
  {id:'red-squirrel',name:'Red squirrel',family:'rodent',fur:'coralShade',light:'coral',shade:'hair',belly:'cream',ear:'tuft',tail:'curl-bush',headY:12,head:[13,12],body:[11,12],cue:'Ear tufts and large curled russet tail'},
  {id:'field-vole',name:'Field vole',family:'rodent',fur:'dirtLight',light:'soilRoot',shade:'dirt',belly:'creamShade',ear:'small',tail:'short',head:[15,12],body:[14,12],cue:'Round body, small ears, short tail'},
  {id:'shrew',name:'Shrew',family:'burrower',fur:'deep',light:'deepLight',shade:'deepShade',belly:'stoneShade',ear:'small',tail:'thin',head:[11,10],body:[10,11],snout:6,eyes:'tiny',cue:'Long narrow pointed nose'},
  {id:'least-weasel',name:'Least weasel',family:'mustelid',fur:'wood',light:'woodLight',shade:'woodShade',belly:'cream',ear:'round',tail:'low',head:[12,10],body:[9,14],cue:'Slender long body and short cinnamon tail'},
  {id:'stoat',name:'Stoat',family:'mustelid',fur:'hairLight',light:'woodLight',shade:'hair',belly:'creamLight',ear:'round',tail:'black-tip',head:[13,10],body:[10,14],cue:'Long neck and black-tipped tail'},
  {id:'striped-skunk',name:'Striped skunk',family:'mustelid',fur:'deepShade',light:'deep',shade:'ink',belly:'deepLight',ear:'small',tail:'skunk',pattern:'skunk-stripe',head:[13,10],body:[13,12],snout:3,cue:'Cream stripe and raised plume tail'},
  {id:'pygmy-spotted-skunk',name:'Pygmy spotted skunk',family:'mustelid',fur:'deepShade',light:'deep',shade:'ink',belly:'deepLight',ear:'round',tail:'spotted-bush',pattern:'cream-spots',head:[12,10],body:[12,11],snout:3,cue:'Broken cream spots and smaller bushy tail'},
  {id:'cottontail-rabbit',name:'Cottontail rabbit',family:'rabbit',fur:'woodLight',light:'creamShade',shade:'wood',belly:'cream',ear:'long',tail:'cotton',head:[13,11],body:[14,12],headY:15,paws:'long-foot',cue:'Long ears and cream cotton tail'},
  {id:'pika',name:'Pika',family:'rabbit',fur:'soilRoot',light:'creamShade',shade:'dirtLight',belly:'cream',ear:'round-big',tail:'none',head:[15,11],body:[14,12],cue:'Round ears, squat body, no visible tail'},
  {id:'jerboa',name:'Jerboa',family:'rodent',fur:'woodLight',light:'creamShade',shade:'wood',belly:'cream',ear:'long-wide',tail:'tuft-tip',head:[12,10],body:[9,10],headY:15,paws:'long-foot',cue:'Huge ears, long feet and tufted thin tail'},
  {id:'dormouse',name:'Dormouse',family:'rodent',fur:'goldShade',light:'gold',shade:'wood',belly:'cream',ear:'round',tail:'small-curl',head:[14,12],body:[13,12],cue:'Golden coat and fluffy curling tail'},
  {id:'lesser-tenrec',name:'Lesser tenrec',family:'spiny',fur:'woodLight',light:'gold',shade:'woodShade',belly:'creamShade',ear:'small',tail:'none',quills:'crest',head:[11,10],body:[11,12],snout:5,cue:'Narrow spine crest and long snout'},
  {id:'tree-frog',name:'Tree frog',family:'frog',fur:'mint',light:'mintLight',shade:'mintShade',belly:'cream',ear:'none',tail:'none',head:[17,10],body:[12,10],eyes:'frog',paws:'pads',cue:'Large gold eyes and sticky toe pads'},
  {id:'natterjack-toad',name:'Natterjack toad',family:'frog',fur:'grassShade',light:'grass',shade:'mintShade',belly:'creamShade',ear:'none',tail:'none',head:[18,10],body:[16,12],eyes:'frog',paws:'pads',pattern:'toad',cue:'Stocky olive body and gold dorsal stripe'},
  {id:'crested-newt',name:'Crested newt',family:'amphibian',fur:'deepShade',light:'deep',shade:'ink',belly:'coral',ear:'none',tail:'fin',crest:true,head:[14,10],body:[11,12],cue:'Jagged dark crest, coral belly, flat tail'},
  {id:'leopard-gecko',name:'Leopard gecko',family:'reptile',fur:'gold',light:'creamShade',shade:'goldShade',belly:'cream',ear:'none',tail:'fat',pattern:'leopard',head:[16,10],body:[12,12],eyes:'gecko',cue:'Gold spots and thick segmented tail'},
  {id:'brown-anole',name:'Brown anole',family:'reptile',fur:'wood',light:'woodLight',shade:'woodShade',belly:'creamShade',ear:'none',tail:'taper',dewlap:true,head:[13,9],body:[9,12],snout:3,cue:'Slender brown body and coral throat fan'}
 ].map(s=>Object.freeze(s));
 const motions=A.woodMouse.motions,jumpOffset=A.woodMouse.jumpOffset,cache=new Map();
 const byId=new Map(roster.map(s=>[s.id,s]));
 function rect(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
 function ellipse(g,cx,cy,rx,ry,c){g.fillStyle=c;for(let y=-ry;y<=ry;y++){const span=Math.floor(rx*Math.sqrt(Math.max(0,1-y*y/(ry*ry||1))));g.fillRect(cx-span,cy+y,span*2+1,1);}}
 function oval(g,cx,cy,rx,ry,base,light,shade){ellipse(g,cx,cy,rx,ry,P.outline);ellipse(g,cx,cy,rx-1,ry-1,base);ellipse(g,cx-1,cy-1,Math.max(1,rx-3),Math.max(1,ry-3),light);rect(g,cx-1,cy+ry-2,Math.max(1,rx-2),1,shade);}
 function line(g,x,y,xx,yy,c){g.fillStyle=c;let dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1,e=dx+dy;while(true){g.fillRect(x,y,1,1);if(x===xx&&y===yy)break;const ee=2*e;if(ee>=dy){e+=dy;x+=sx;}if(ee<=dx){e+=dx;y+=sy;}}}
 function path(g,pts,c){for(let i=1;i<pts.length;i++)line(g,...pts[i-1],...pts[i],c);}
 function triangle(g,x,y,w,h,c){for(let n=0;n<h;n++){const span=Math.floor((w*n)/h);rect(g,x-span,y+n,span*2+1,1,c);}}
 function paw(g,x,y,s){const dig=s.paws==='dig',pads=s.paws==='pads';oval(g,x+1,y+1,dig?3:2,2,dig?P.skin:P[s.fur],dig?P.skinLight:P[s.light],P[s.shade]);if(dig){rect(g,x-1,y+2,1,1,P.cream);rect(g,x+1,y+2,1,1,P.cream);rect(g,x+3,y+2,1,1,P.cream);}if(pads){rect(g,x-1,y+2,1,1,P[s.light]);rect(g,x+1,y+3,1,1,P[s.light]);rect(g,x+3,y+2,1,1,P[s.light]);}}
 function feet(g,x,y,s){const wide=s.paws==='long-foot'?4:s.paws==='pads'?3:2;oval(g,x,y,wide,1,P[s.fur],s.family==='rodent'||s.family==='burrower'?P.skin:P[s.light],P[s.shade]);if(s.paws==='pads')for(const dx of [-2,0,2])rect(g,x+dx,y+1,1,1,P[s.light]);}
 function tail(g,s,x,y,wag){
  const base=P[s.fur],light=P[s.light],shade=P[s.shade],t=s.tail;
  if(t==='none')return;
  if(t==='cotton'){oval(g,11+x,24+y,3,3,P.cream,P.creamLight,P.creamShade);return;}
  if(t==='stub'||t==='short'){path(g,[[12+x,25+y],[8+x,26+y],[6+x,24+y]],P.outline);path(g,[[12+x,24+y],[8+x,25+y],[6+x,24+y]],t==='short'?P.skin:base);return;}
  if(['curl-bush','small-bush','skunk','spotted-bush','small-curl'].includes(t)){
   const big=t==='curl-bush'||t==='skunk',cx=7+x,cy=(big?16:20)+y+wag;
   oval(g,cx,cy,big?5:4,big?8:6,base,light,shade);oval(g,cx+1,cy-(big?5:3),3,3,base,light,shade);
   path(g,[[12+x,26+y],[8+x,24+y],[cx,cy+3]],shade);
   if(t==='skunk'){path(g,[[cx+2,cy-6],[cx-1,cy-3],[cx+1,cy],[cx+2,cy+4]],P.cream);path(g,[[cx+3,cy-6],[cx,cy-3],[cx+2,cy],[cx+3,cy+4]],P.creamShade);}
   if(t==='spotted-bush')for(const[a,b]of [[-1,-3],[2,0],[-1,3]])rect(g,cx+a,cy+b,2,2,P.cream);
   if(s.pattern==='chip-stripes')path(g,[[cx,cy-4],[cx-1,cy],[cx,cy+4]],P.cream);
   return;
  }
  if(t==='low'||t==='black-tip'){oval(g,7+x,27+y,5,2,base,light,shade);if(t==='black-tip')oval(g,3+x,27+y,2,2,P.deepShade,P.deep,P.ink);return;}
  if(t==='fat'){oval(g,7+x,25+y+wag,5,3,base,light,shade);for(const dx of [-3,0,3])rect(g,7+x+dx,24+y+wag,1,3,P.deep);return;}
  if(t==='brush'){path(g,[[12+x,25+y],[6+x,28+y],[3+x,26+y]],shade);for(let n=0;n<4;n++)path(g,[[6+x,27+y],[2+x+n,25+y-n]],P.creamShade);return;}
  if(t==='thin'||t==='tuft-tip'){const pts=[[12+x,25+y],[8+x,27+y],[4+x,24+y+wag],[3+x,19+y+wag],[5+x,17+y+wag]];path(g,pts,P.outline);path(g,pts.map(([a,b])=>[a,b-1]),P.skin);if(t==='tuft-tip')oval(g,5+x,17+y+wag,2,3,P.deepShade,P.deep,P.ink);return;}
  const thick=t==='thick'||t==='fin';for(let n=0;n<(thick?4:2);n++)path(g,[[13+x,25+y+n],[8+x,27+y+n],[3+x,25+y+wag+n],[2+x,22+y+wag+n]],n===0?shade:base);
  if(t==='fin'){for(let n=0;n<3;n++)triangle(g,5+x+n*3,22+y+wag-n,1,3,P.deepShade);path(g,[[12+x,26+y],[6+x,27+y],[2+x,24+y+wag]],P.coral);}
  if(s.pattern==='gold-spots')rect(g,7+x,26+y,2,1,P.gold);
 }
 function back(g,s,x,y){
  if(s.quills){const long=s.quills==='long',crest=s.quills==='crest';oval(g,crest?13+x:12+x,21+y,crest?4:7,crest?7:8,P[s.shade],P[s.fur],P[s.shade]);const tips=crest?[[10,11],[8,13],[7,16],[6,19],[6,22]]:long?[[8,8],[5,10],[3,13],[2,17],[2,21],[4,25]]:[[9,11],[6,13],[5,16],[4,20],[5,24]];for(let n=0;n<tips.length;n++){const[a,b]=tips[n];path(g,[[13+x,19+y+n],[a+x,b+y]],P[s.shade]);path(g,[[12+x,19+y+n],[a+x,b+y-1]],P.creamShade);}}
  if(s.shell){oval(g,11+x,21+y,6,9,P.woodShade,P.goldShade,P.wood);for(const[a,b]of [[-2,-4],[1,-2],[-2,1],[2,4],[-2,5]]){rect(g,11+x+a,21+y+b,3,2,P.gold);rect(g,12+x+a,21+y+b-1,1,1,P.gold);}path(g,[[13+x,14+y],[16+x,20+y],[14+x,28+y]],P.creamShade);}
  if(s.crest){for(const[a,b]of [[12,6],[10,9],[9,12],[10,16],[10,20]])triangle(g,a+x,b+y,2,4,P.deepShade);}
 }
 function ear(g,s,cx,cy){const c=P[s.fur],l=P[s.light],d=P[s.shade];if(s.ear==='none')return;
  if(s.ear==='long'||s.ear==='long-wide'){oval(g,cx,cy-5,s.ear==='long-wide'?3:2,5,c,l,d);ellipse(g,cx,cy-5,1,3,P.skin);}
  else if(s.ear==='point'||s.ear==='tuft'){triangle(g,cx,cy-5,3,6,P.outline);triangle(g,cx,cy-4,2,5,c);rect(g,cx,cy-2,1,2,P.skin);if(s.ear==='tuft')rect(g,cx,cy-6,1,2,P[s.shade]);}
  else {const r=s.ear==='round-big'?3:s.ear==='small'?1:2;oval(g,cx,cy-2,r,r+1,c,l,d);ellipse(g,cx,cy-2,Math.max(0,r-1),r-1,P.skin);}
 }
 function eyes(g,x,y,s,closed){const frog=s.eyes==='frog',gecko=s.eyes==='gecko';if(frog)oval(g,x,y,3,3,P.gold,P.gold,P[s.shade]);else if(gecko)ellipse(g,x,y,2,3,P.creamShade);
  if(closed){line(g,x-1,y,x+1,y,P.ink);return;}
  if(s.eyes==='tiny'){rect(g,x,y,1,1,P.ink);return;}
  ellipse(g,x,y,1,2,P.ink);rect(g,x,y-1,1,1,P.creamLight);
 }
 function head(g,s,x,y,front,closed,happy){
  const w=s.head[0],h=s.head[1],hx=20+x,hy=(s.headY||11)+y,rx=Math.floor(w/2),ry=Math.floor(h/2);
  ear(g,s,hx-(front?5:4),hy-ry+2);ear(g,s,hx+(front?5:3),hy-ry+1);
  oval(g,hx,hy,rx,ry,P[s.fur],P[s.light],P[s.shade]);
  if(front){ellipse(g,hx,hy+2,Math.max(2,rx-2),2,P[s.belly]);rect(g,hx,hy+1,2,1,s.family==='reptile'||s.family==='amphibian'||s.family==='frog'?P[s.shade]:P.skin);eyes(g,hx-3,hy-1,s,closed);eyes(g,hx+3,hy-1,s,closed);if(happy){path(g,[[hx-2,hy+3],[hx,hy+4],[hx+2,hy+3]],P.ink);}}
  else {
   const sn=s.snout||2;for(let n=0;n<sn;n++)rect(g,hx+rx-3+n,hy+1,3,Math.max(1,3-Math.floor(n/2)),P[s.belly]);rect(g,hx+rx+sn-2,hy+1,1,1,s.family==='reptile'||s.family==='frog'||s.family==='amphibian'?P[s.shade]:P.skin);
   eyes(g,hx+2,hy-1,s,closed);line(g,hx+rx-2,hy+3,hx+rx,hy+3,P.woodShade);
  }
  if(s.pattern==='chip-stripes'){path(g,[[hx-4,hy-2],[hx-2,hy],[hx+1,hy+1]],P.cream);path(g,[[hx-4,hy],[hx-1,hy+2],[hx+2,hy+2]],P.woodShade);}
  if(s.pattern==='skunk-stripe'){path(g,[[hx-4,hy-ry+1],[hx-1,hy-2],[hx+1,hy-ry+1]],P.cream);}
  if(s.pattern==='gold-spots'){rect(g,hx-4,hy-2,2,2,P.gold);rect(g,hx+3,hy-4,2,1,P.gold);}
  if(s.pattern==='cream-spots'){rect(g,hx-4,hy-3,2,2,P.cream);rect(g,hx+2,hy-ry+1,2,1,P.cream);}
  if(s.pattern==='leopard'){for(const[a,b]of [[-4,-2],[-1,-4],[4,-3]])rect(g,hx+a,hy+b,2,1,P.deepShade);}
  if(s.pattern==='scales'){rect(g,hx-3,hy-3,2,1,P[s.shade]);rect(g,hx-5,hy,2,1,P[s.light]);}
  if(s.pattern==='toad'){rect(g,hx-4,hy-3,2,1,P.gold);rect(g,hx-6,hy,2,1,P[s.light]);}
  if(s.dewlap){triangle(g,hx+3,hy+ry-1,3,5,P.coralShade);triangle(g,hx+3,hy+ry,2,3,P.coral);}
 }
 function normalize(options={}){const species=options.species||'wood-mouse',s=byId.get(species);if(!s)return null;let state=Object.hasOwn(motions,options.state)?options.state:'idle';const n=motions[state].frames,frame=((Number.isFinite(options.frame)?Math.floor(options.frame):0)%n+n)%n;return {s,state,frame,direction:options.direction<0?-1:1};}
 function draw(g,{s,state,frame:f}){
  const moving=state==='walk'||state==='sprint',sprint=state==='sprint',front=state==='pet'&&f>=2,closed=(state==='pet'&&f>=4&&f<=7)||(state==='idle'&&f===3)||(state==='yay'&&f>=3&&f<=6);
  const lightStep=s.family==='frog'?1:s.family==='turtle'?0:1;
  const y=moving?[0,-lightStep,-lightStep,0,0,-lightStep,-lightStep,0][f]:state==='yay'&&[1,8].includes(f)?1:0;
  const x=sprint?1:state==='mine'&&f>=3&&f<=5?1:0;
  const wag=moving?[0,-1,-1,0,0,1,1,0][f]:state==='pet'?[0,0,1,1,0,-1,-1,0,0,0][f]:0;
  tail(g,s,x,y,wag);
  const span=s.paws==='long-foot'?3:s.family==='turtle'?1:2;
  const stride=moving?(sprint?[-span,-1,span,span+1,span,1,-span,-span-1]:[-1,0,1,span,1,0,-1,-span])[f]:0;
  const lift=moving?[0,-1,-2,-1,0,0,0,0][f]:0;
  const farFoot=[14+stride+x,30+lift],nearFoot=[22-stride+x,30+(moving?[0,0,0,0,0,-1,-2,-1][f]:0)];
  // Thighs and shins attach the hip to each planted or lifted bare foot.
  for(const [hip,foot]of [[15+x,farFoot],[21+x,nearFoot]]){for(const dx of [-1,0,1])line(g,hip+dx,25+y,foot[0]+dx,foot[1]-1,P.outline);line(g,hip,25+y,foot[0],foot[1]-1,P[s.fur]);}
  feet(g,...farFoot,s);feet(g,...nearFoot,s);
  const bw=Math.floor(s.body[0]/2),bh=Math.floor(s.body[1]/2),by=27-bh+y;
  oval(g,18+x,by,bw,bh,P[s.fur],P[s.light],P[s.shade]);ellipse(g,20+x,by+1,Math.max(2,bw-2),Math.max(2,bh-2),P[s.belly]);
  if(s.family==='mustelid'&&s.body[0]<11)rect(g,18+x,13+y,4,8,P[s.belly]);
  if(s.pattern==='chip-stripes'){path(g,[[14+x,17+y],[13+x,21+y],[14+x,25+y]],P.cream);}
  if(s.pattern==='cream-spots')for(const[a,b]of [[13,19],[15,24],[19,17]])rect(g,a+x,b+y,2,2,P.cream);
  if(s.pattern==='gold-spots')for(const[a,b]of [[13,19],[16,25],[20,18]])rect(g,a+x,b+y,2,2,P.gold);
  if(s.pattern==='toad')path(g,[[13+x,17+y],[12+x,22+y],[14+x,26+y]],P.gold);
  if(s.pattern==='leopard')for(const[a,b]of [[14,19],[15,25],[19,17]])rect(g,a+x,b+y,2,2,P.deepShade);
  back(g,s,x,y);head(g,s,x+(sprint?2:0)+(state==='pet'&&f===8?-1:0),y+(state==='pet'&&f>=4&&f<=7?1:0),front,closed,state==='pet'||state==='yay');
  let far=[12+x,21+y],near=[24+x,21+y];
  if(moving){const swing=[0,-1,-2,-1,0,1,2,1][f];far=[12+x-swing,21+y];near=[24+x+swing,21+y+(sprint?-1:0)];}
  if(state==='use'){far=[21+x,21+y+[0,-1,-2,-1,0,1,0,0][f]];near=[26+x+[0,0,1,1,0,-1,-1,0][f],22+y+[0,1,0,-1,-2,-1,0,0][f]];}
  if(state==='yay'){far=[10+x,21+y-(f>=2&&f<=7?5:0)];near=[26+x,21+y-(f>=2&&f<=7?6:0)];}
  if(state==='pet'){far=[12+x,22+y];near=[24+x,22+y];}
  if(state==='mine'){
   const handles=[[25,22,29,15],[24,18,29,10],[24,16,29,6],[25,17,32,11],[25,23,34,25],[25,24,34,26],[25,23,32,20],[25,22,29,16]],heads=[[[26,14],[29,13],[33,15]],[[26,9],[29,8],[33,10]],[[26,5],[29,4],[33,6]],[[29,10],[32,9],[35,12]],[[34,21],[35,25],[33,29]],[[34,22],[35,26],[33,30]],[[31,17],[33,20],[32,24]],[[27,15],[30,14],[34,17]]];
   const[a,b,c,d]=handles[f];line(g,a,b+1,c,d+1,P.woodShade);line(g,a,b,c,d,P.woodLight);const h=heads[f];path(g,h,P.ink);path(g,h.map(([a,b])=>[a-1,b]),P.stoneLight);far=[a-4,b-3];near=[a-1,b-1];
  }
  line(g,14+x,21+y,far[0]+1,far[1]+1,P[s.shade]);line(g,23+x,21+y,near[0]+1,near[1]+1,P[s.shade]);paw(g,...far,s);paw(g,...near,s);
 }
 A.critters=Object.freeze({roster:Object.freeze(roster),motions,jumpOffset,width:40,height:32,anchor:A.woodMouse.anchor,
  frameAt:(state,time)=>A.woodMouse.frameAt(state,time),
  drawInto(g,options){const q=normalize(options);if(!q)return false;if(q.s.id==='wood-mouse'){g.drawImage(A.woodMouse.sprite({state:q.state,frame:q.frame,direction:q.direction}),0,0);return true;}g.save();if(q.direction<0){g.translate(36,0);g.scale(-1,1);}draw(g,q);g.restore();return true;},
  sprite(options){const q=normalize(options);if(!q)return null;if(q.s.id==='wood-mouse')return A.woodMouse.sprite({state:q.state,frame:q.frame,direction:q.direction});const key=`${q.s.id}:${q.state}:${q.frame}:${q.direction}`;if(cache.has(key))return cache.get(key);const c=document.createElement('canvas');c.width=40;c.height=32;const g=c.getContext('2d');g.imageSmoothingEnabled=false;this.drawInto(g,options);cache.set(key,c);return c;}
 });
})();
