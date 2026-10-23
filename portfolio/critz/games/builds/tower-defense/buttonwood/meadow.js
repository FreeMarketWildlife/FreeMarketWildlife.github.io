// ART-BIBLE §§3–4, 8, 9: native meadow flowers and separately authored 32px icons.
(()=>{'use strict';const A=ButtonwoodArt,P=A.palette,cache=new Map();
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
function flower(g,x,y,t){const r=(a,b,w,h,k)=>{g.fillStyle=P[k];g.fillRect(x+a,y+b,w,h)};r(5,5,1,7,'grassShade');r(2,8,3,1,'grass');r(3,9,2,1,'grassShade');r(6,7,3,1,'grassLight');r(6,8,2,1,'grass');const k=['creamLight','coralLight','gold'][t%3];r(4,1,3,2,k);r(2,3,3,2,k);r(6,3,3,2,k);r(4,5,3,2,k);r(4,3,3,2,'goldShade');r(5,3,1,1,'gold')}
A.flowerSprite=t=>{const k='flower:'+t;if(!cache.has(k)){const c=canvas(12,12);flower(c.getContext('2d'),0,0,t);cache.set(k,c)}return cache.get(k)};
A.flowerIcon=()=>{if(!cache.has('flowers')){const c=canvas(32,32),g=c.getContext('2d');flower(g,3,8,0);flower(g,11,4,1);flower(g,17,11,2);g.fillStyle=P.woodShade;g.fillRect(11,24,11,2);g.fillStyle=P.gold;g.fillRect(14,24,3,2);cache.set('flowers',c)}return cache.get('flowers')};
// Portrait miniatures are drawn directly, never resized from world sprites.
const oldIcon=A.wildlifeIcon,oldBucket=A.wildlifeBucketIcon;
const extras=new Map(A.critterIdles.roster.map(s=>[s.id,s]));
const oldSprite=A.wildlifeSprite;
A.wildlifeSprite=(id,options={})=>extras.has(id)?A.critterIdles.sprite(id,options):oldSprite(id,options);
A.wildlifeSizes={...A.wildlifeSizes,...Object.fromEntries([...extras].map(([id,s])=>[id,{width:s.width,height:s.height}]))};
A.wildlifeFrameMs={...A.wildlifeFrameMs,...Object.fromEntries([...extras.keys()].map(id=>[id,220]))};
function mini(g,id,x,y){const r=(a,b,w,h,k)=>{g.fillStyle=P[k];g.fillRect(x+a,y+b,w,h)},reptile=/lizard|anole|newt|salamander|gecko|frog|toad/.test(id),color=reptile?'mint':'woodLight';r(2,4,12,6,'outline');r(1,6,15,3,'outline');r(3,4,9,1,color);r(2,5,12,4,color);r(4,9,2,2,'woodShade');r(11,9,2,2,'woodShade');r(13,5,4,4,color);r(15,5,1,1,'ink');r(17,7,2,1,'coral');if(!reptile){r(12,1,3,4,'outline');r(13,2,1,2,'coralLight')}else{r(0,7,3,1,'mintShade');r(-2,8,3,1,'mintShade')}if(id==='box-turtle'){r(4,3,8,5,'goldShade');r(6,3,3,2,'gold')}if(/skunk/.test(id))r(4,5,8,2,'cream');if(/porcupine|hedgehog|tenrec/.test(id)){r(3,2,1,3,'cream');r(6,1,1,3,'cream');r(9,2,1,3,'cream')}if(/squirrel|chipmunk|dormouse/.test(id)){r(0,0,3,7,'wood');r(1,-1,4,3,'woodLight')}if(/rabbit|jerboa/.test(id)){r(12,-3,2,7,'woodLight');r(15,-2,2,6,'woodLight')}}
function icon(id,bucket){const key=id+':'+bucket;if(!cache.has(key)){const c=canvas(32,32),g=c.getContext('2d');if(bucket){g.fillStyle=P.ink;g.fillRect(4,12,24,3);g.fillRect(7,15,18,14);g.fillStyle=P.stoneLight;g.fillRect(8,16,16,11);g.fillStyle=P.stoneShade;g.fillRect(21,16,3,11);mini(g,id,8,6)}else mini(g,id,7,12);cache.set(key,c)}return cache.get(key)}
A.wildlifeIcon=id=>extras.has(id)?icon(id,false):oldIcon(id);
A.wildlifeBucketIcon=id=>extras.has(id)?icon(id,true):oldBucket(id);
})();
