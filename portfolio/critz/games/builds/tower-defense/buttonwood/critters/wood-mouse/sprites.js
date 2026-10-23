/* Native unclothed wood mouse Worker; integer pixels, shared palette, no game state. */
(() => {
 'use strict';
 const A=window.ButtonwoodArt, P=A.palette, cache=new Map();
 const motions=Object.freeze({idle:{frames:4,ms:280},walk:{frames:8,ms:110},sprint:{frames:8,ms:70},mine:{frames:8,ms:110},use:{frames:8,ms:130},yay:{frames:10,ms:100},pet:{frames:10,ms:150}});
 const colors={o:P.outline,i:P.ink,b:P.woodShade,f:P.wood,h:P.woodLight,c:P.cream,s:P.creamShade,l:P.creamLight,p:P.skin,r:P.coral,k:P.skinShade};
 function stamp(g,x,y,rows){rows.forEach((row,dy)=>[...row].forEach((v,dx)=>{if(colors[v]){g.fillStyle=colors[v];g.fillRect(x+dx,y+dy,1,1);}}));}
 function line(g,x,y,xx,yy,color){g.fillStyle=color;let dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1,e=dx+dy;while(true){g.fillRect(x,y,1,1);if(x===xx&&y===yy)break;const ee=2*e;if(ee>=dy){e+=dy;x+=sx;}if(ee<=dx){e+=dx;y+=sy;}}}
 const head=[
 '...oooo....oooo...',
 '..ohhhpo..ohhhpo..',
 '.ohpppko.ohpppko..',
 '.ohpprko.ohprrko..',
 '.ohpprko.ohprkfo..',
 '..ofkkfoohfkkfo...',
 '...offhhhhhhfo....',
 '..ofhhhhhhhhhfo...',
 '..ofhhhhhhhhhhfo..',
 '..ofhhhiiihhhhhfo.',
 '..ofhhhili hhfffpo',
 '..ofhhhiii hcccrro',
 '...ofhhhhhccccco..',
 '....offhccccco....',
 '.....obbsssoo.....'];
 const front=[
 '..oooo......oooo..',
 '.ohhhpo....ophhho.',
 'ohpppko....okpppho',
 'ohpprko....okrppho',
 '.ofkkfoo ooffkfo..',
 '..ofhhhhhhhhhfo..',
 '..ofhhhhhhhhhfo..',
 '..ofhiiihiiihfo..',
 '..ofhilihilihfo..',
 '..ofhiiihiiihfo..',
 '...ohhccrcc hho..',
 '...ofcccccccfo...',
 '....ofccsccfo....',
 '.....ooooooo.....'];
 function paw(g,x,y){stamp(g,x,y,['.oo.','ohpo','opko','.oo.']);}
 function foot(g,x,y){stamp(g,x,y,['.ooo..','ofppo.','oppkpo','oooooo']);}
 function draw(g,state,f){
  const sprint=state==='sprint', locomotion=sprint||state==='walk';
  const bounce=locomotion?[0,-1,-1,0,0,-1,-1,0][f]:0;
  const jump=state==='yay'?[0,1,0,-1,-2,-2,-1,0,1,0][f]:0;
  const lean=sprint?2:state==='mine'&&f>=3&&f<=5?1:0;
  const y=bounce+jump, x=lean;
  // Tail is redrawn as stepped segments for each pose, not resampled or rotated.
  const wag=locomotion?[0,-1,-2,-1,0,1,2,1][f]:state==='pet'?[0,0,1,2,1,0,-1,-1,0,0][f]:0;
  const tail=[[13+x,25+y],[9,26+y],[5,24+y+wag],[3,20+y+wag],[3,18+y+wag],[5,17+y+wag],[7,18+y+wag]];
  for(let n=1;n<tail.length;n++){const [a,b]=tail[n-1],[c,d]=tail[n];line(g,a,b+1,c,d+1,P.outline);line(g,a,b,c,d,P.skin);}
  // Feet have different planted, passing, and flight poses.
  const stride=locomotion?(sprint?[-3,-1,2,4,3,1,-2,-4]:[-2,-1,0,2,2,1,0,-2])[f]:0;
  const lift=locomotion?[0,-1,-2,-1,0,0,0,0][f]:0;
  foot(g,12+stride+x,Math.min(28,28+y+lift));foot(g,20-stride+x,Math.min(28,28+y+(locomotion?[0,0,0,0,0,-1,-2,-1][f]:0)));
  stamp(g,11+x,18+y,['...ooooooo...','..ofhhhhffo..','.ofhhccccffo.','ofhhccclccffo','ofhhccccccffo','ofhhcccccsffo','ofhhcccsssffo','.offfsssfffo.','..offfffffo..','...ooo.ooo...']);
  const facing=state==='pet'&&f>=2;
  const petTilt=state==='pet'&&f>=4&&f<=7?1:0;
  stamp(g,12+x+(sprint?2:0),3+y+petTilt,facing?front:head);
  if(state==='idle'&&f===3){stamp(g,19+x,12+y,['hhh','iii','hhh']);}
  if(facing){
   if(f>=4&&f<=7){stamp(g,17+x,10+y+petTilt,['hhh.hhh','iii.iii','hhh.hhh']);}
   stamp(g,19+x,15+y+petTilt,['i...i','.iii.']);
  }
  if(state==='yay'&&f>=3&&f<=6){stamp(g,19+x,12+y,['hhh','iii','hhh']);stamp(g,24+x,16+y,['i.i','.i.']);}
  let back=[12+x,21+y], near=[23+x,21+y];
  if(locomotion){const swing=[0,-1,-2,-1,0,1,2,1][f];back=[12+x-swing,21+y];near=[23+x+swing,21+y+(sprint?-1:0)];}
  if(state==='use'){back=[21+x,21+y+[0,-1,-2,-1,0,1,0,0][f]];near=[25+x+[0,0,1,1,0,-1,-1,0][f],22+y+[0,1,0,-1,-2,-1,0,0][f]];}
  if(state==='yay'){back=[10+x,21+y-(f>=2&&f<=7?5:0)];near=[26+x,21+y-(f>=2&&f<=7?6:0)];}
  if(state==='pet'){back=[12+x,22+y];near=[23+x,22+y];}
  if(state==='mine'){
   // Hand/tool contact points are authored together; impact is frame 4.
   const handles=[[25,22,29,15],[24,18,29,10],[24,16,29,6],[25,17,32,11],[25,23,34,25],[25,24,34,26],[25,23,32,20],[25,22,29,16]];
   const [a,b,c,d]=handles[f];line(g,a,b+1,c,d+1,P.woodShade);line(g,a,b,c,d,P.woodLight);
   const heads=[[[26,14],[29,13],[33,15]],[[26,9],[29,8],[33,10]],[[26,5],[29,4],[33,6]],[[29,10],[32,9],[35,12]],[[34,21],[35,25],[33,29]],[[34,22],[35,26],[33,30]],[[31,17],[33,20],[32,24]],[[27,15],[30,14],[34,17]]];
   const q=heads[f];for(let n=1;n<q.length;n++){line(g,q[n-1][0],q[n-1][1],q[n][0],q[n][1],P.ink);line(g,q[n-1][0]-1,q[n-1][1],q[n][0]-1,q[n][1],P.stoneLight);}
   back=[a-4,b-3];near=[a-1,b-1];
  }
  line(g,15+x,21+y,back[0]+1,back[1]+1,P.woodShade);line(g,23+x,21+y,near[0]+1,near[1]+1,P.woodShade);
  paw(g,...back);paw(g,...near);
 }
 A.woodMouse=Object.freeze({width:40,height:32,anchor:Object.freeze({x:18,y:31}),motions,
  jumpOffset: Object.freeze([0,0,0,-2,-5,-5,-3,-1,0,0]),
  frameAt(state,ms){const m=motions[state]||motions.idle;return Math.floor(Math.max(0,ms)/m.ms)%m.frames;},
  sprite({state='idle',frame=0,direction=1}={}){if(!Object.hasOwn(motions,state))state='idle';frame=((Math.floor(frame)||0)%motions[state].frames+motions[state].frames)%motions[state].frames;const dir=direction<0?-1:1,key=`${state}:${frame}:${dir}`;if(cache.has(key))return cache.get(key);const c=document.createElement('canvas');c.width=40;c.height=32;const g=c.getContext('2d');g.imageSmoothingEnabled=false;if(dir<0){g.translate(36,0);g.scale(-1,1);}draw(g,state,frame);cache.set(key,c);return c;}
 });
})();
