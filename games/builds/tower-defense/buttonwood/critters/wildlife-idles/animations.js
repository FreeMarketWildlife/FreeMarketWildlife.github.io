/* Native wildlife animation vocabulary. ART-BIBLE §§3–4, 6, 8, 10.
 * Original idle pixels stay intact; small limb clusters and tools describe actions. */
(()=>{
'use strict';const A=window.ButtonwoodArt,P=A.palette,cache=new Map();
const motions=Object.freeze({idle:{frames:4,ms:350},walk:{frames:8,ms:110},sprint:{frames:8,ms:70},mine:{frames:8,ms:110},use:{frames:8,ms:130},yay:{frames:8,ms:110},pet:{frames:8,ms:150}});
const extras=['bird','butterfly','worm','mole','rabbit','firefly'].map(id=>({id,name:id[0].toUpperCase()+id.slice(1),...A.wildlifeSizes[id],anchor:{x:A.wildlifeSizes[id].width/2,y:A.wildlifeSizes[id].height},wild:true}));
const roster=Object.freeze([...A.critterIdles.roster,...extras].map(s=>Object.freeze({...s})));
const byId=new Map(roster.map(s=>[s.id,s]));
const flyers=new Set(['bird','butterfly','firefly']),diggers=new Set(['european-mole','mole','shrew','worm','lesser-tenrec']),builders=new Set(['box-turtle','brush-tailed-porcupine','hedgehog','chipmunk','dormouse']),runners=new Set(['red-squirrel','cottontail-rabbit','rabbit','jerboa','least-weasel','stoat','pika']);
const abilities=Object.freeze(Object.fromEntries(roster.map(s=>[s.id,Object.freeze(diggers.has(s.id)?{kind:'dig',name:'Burrow',description:'One extra hit on nearby exposed dirt.',cooldown:15000}:builders.has(s.id)?{kind:'craft',name:'Handy paws',description:'Advance a nearby active building job by 2 seconds.',cooldown:20000}:runners.has(s.id)?{kind:'sprint',name:'Quick feet',description:'Sprint for 4 seconds.',cooldown:12000}:flyers.has(s.id)?{kind:'scout',name:'Scout',description:'Mark the nearest exposed ore within six blocks.',cooldown:15000}:{kind:'scout',name:'Keen senses',description:'Mark the nearest exposed ore within six blocks.',cooldown:15000})])));
function r(g,c,x,y,w=1,h=1){g.fillStyle=P[c];g.fillRect(x,y,w,h)}
function line(g,c,x,y,xx,yy){let dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1,e=dx+dy;while(true){r(g,c,x,y);if(x===xx&&y===yy)break;const ee=2*e;if(ee>=dy){e+=dy;x+=sx}if(ee<=dx){e+=dx;y+=sy}}}
function base(s,f,state){if(!s.wild)return A.critterIdles.sprite(s.id);return A.wildlifeSprite(s.id,{frame:state==='idle'?0:state==='walk'||state==='sprint'?f%4:0})}
function sprite(id,state='idle',frame=0,direction=1){const s=byId.get(id);if(!s)return null;if(!motions[state])state='idle';const f=((Math.floor(frame)||0)%motions[state].frames+motions[state].frames)%motions[state].frames,dir=direction<0?-1:1,key=[id,state,f,dir].join(':');if(cache.has(key))return cache.get(key);
const c=document.createElement('canvas');c.width=40;c.height=32;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
if(dir<0){g.translate(40,0);g.scale(-1,1);g.drawImage(sprite(id,state,f,1),0,0);cache.set(key,c);return c}
const moving=state==='walk'||state==='sprint',flying=flyers.has(id),worm=id==='worm';
const paw=({ 'sand-lizard':'grass','box-turtle':'grass','tree-frog':'mintLight','natterjack-toad':'grass','fire-salamander':'deep','crested-newt':'deep','leopard-gecko':'goldShade','brown-anole':'woodShade','rabbit':'cream','cottontail-rabbit':'woodLight','firefly':'mintLight','bird':'mint','butterfly':'coral'})[id]||'skin';
const lift=state==='idle'?(f===2?1:0):state==='yay'?[0,1,3,4,4,3,1,0][f]:moving&&!flying?(state==='sprint'?[0,1,2,1,0,1,2,1][f]:[0,0,1,1,0,0,1,1][f]):0;
const dx=state==='use'?(f%4===1?1:0):0,x=20-s.anchor.x+dx,y=31-s.anchor.y-lift;
g.drawImage(base(s,f,state),x,y);
// Stance-specific feet: walking alternates planted paw clusters; flyers retain wings.
if(moving&&!flying&&!worm){const foot=29-lift,stride=(state==='sprint'?2:1)*(f<4?1:-1);r(g,'outline',13-stride,foot,4,2);r(g,paw,14-stride,foot,2,1);r(g,'outline',25+stride,foot,4,2);r(g,paw,26+stride,foot,2,1)}
const headX=Math.min(31,Math.round(x+s.width-5)),headY=Math.max(8,Math.round(y+s.height*.55));
if(state==='idle'&&f===3){r(g,'outline',headX,headY,2,1)}
if(state==='mine'){
 const gripX=29,gripY=23,ends=[[31,8],[33,7],[36,11],[37,20],[36,24],[34,23],[31,17],[30,12]][f];
 line(g,'outline',gripX,gripY,ends[0],ends[1]);line(g,'woodLight',gripX-1,gripY,ends[0]-1,ends[1]);
 line(g,'outline',ends[0]-3,ends[1]-1,Math.min(39,ends[0]+2),ends[1]+1);line(g,'stoneLight',ends[0]-3,ends[1],Math.min(39,ends[0]+2),ends[1]+1);
 r(g,flying?'mintLight':paw,28,23,2,2);if(f===4){r(g,'gold',36,28);r(g,'creamLight',38,26)}
}
if(state==='use'){r(g,'outline',29,28,7,3);r(g,'wood',30,28,5,2);r(g,'woodLight',30,28,4,1);const offset=[0,-1,-2,-1,0,1,0,-1][f];r(g,flying?'mintLight':paw,27,26+offset,2,2);r(g,flying?'creamShade':paw,32,25-offset,2,2);if(f===4||f===5)r(g,'gold',31,26)}
if(state==='yay'){r(g,'creamLight',10,Math.max(1,y-2));r(g,'gold',29,Math.max(1,y-1));if(f>=2&&f<=5){r(g,paw,28,21-lift,2,2);r(g,paw,13,23-lift,2,2)}}
if(state==='pet'){
 // Small front-facing face overlay; eyes stay one pixel, never concept-sized.
 const center=Math.min(29,Math.round(x+s.width-6)),fy=Math.max(7,Math.round(y+s.height*.5));
 r(g,'creamShade',center-2,fy+1,5,3);r(g,'ink',center-1,fy,1,1);r(g,'ink',center+2,fy,1,1);r(g,'coral',center+1,fy+2);
 if(f>=3&&f<=6){r(g,'outline',center-2,fy,2,1);r(g,'outline',center+2,fy,2,1)}
 r(g,'skinLight',center-2,fy-3+(f%2),5,1);r(g,'skin',center+2,fy-2+(f%2),2,1);if(f===2||f===5){r(g,'coralLight',center+5,fy-3);r(g,'coral',center+6,fy-4)}
}
cache.set(key,c);return c}
A.animalAnimations=Object.freeze({roster,motions,abilities,width:40,height:32,anchor:Object.freeze({x:20,y:31}),sprite,frameAt:(state,ms)=>Math.floor(Math.max(0,ms)/motions[state].ms)%motions[state].frames});
})();
