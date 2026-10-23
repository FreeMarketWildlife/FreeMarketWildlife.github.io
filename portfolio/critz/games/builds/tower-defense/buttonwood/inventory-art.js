// ART-BIBLE §§3–4, 9–10: native equipment, category miniatures and contact poses.
(()=>{'use strict';const A=ButtonwoodArt,P=A.palette,cache=new Map();
const canvas=()=>{const c=document.createElement('canvas');c.width=c.height=32;return c};
const painter=g=>(x,y,w,h,k)=>{g.fillStyle=P[k];g.fillRect(x,y,w,h)};
A.inventoryIcon=function(kind){if(cache.has(kind))return cache.get(kind);const c=canvas(),g=c.getContext('2d'),r=painter(g);
 if(kind==='nails'){
  // Three slender steel nails, each with a broad head and a stepped point.
  for(const [x,y]of [[5,7],[14,4],[16,15]]){r(x,y,9,3,'outline');r(x+1,y,7,1,'creamLight');r(x+3,y+3,3,2,'outline');for(let n=0;n<10;n++){r(x+3+Math.floor(n/3),y+5+n,3,1,'outline');r(x+4+Math.floor(n/3),y+5+n,1,1,n<6?'stoneLight':'stone')}r(x+6,y+15,1,2,'outline');}
 }else if(kind==='ladder'){r(6,3,5,26,'outline');r(21,3,5,26,'outline');r(7,4,3,24,'wood');r(22,4,3,24,'wood');r(7,4,1,24,'creamShade');r(22,4,1,24,'creamShade');for(const y of [7,14,21]){r(10,y,12,4,'outline');r(10,y,12,2,'woodLight');}}
 else if(kind==='search'){for(let y=4;y<23;y++)for(let x=4;x<23;x++){const d=(x-13)**2+(y-13)**2;if(d<90&&d>44)r(x,y,1,1,d>65?'outline':'woodLight')}for(let n=0;n<8;n++){r(20+n,20+n,4,3,'outline');r(21+n,20+n,2,1,'wood')}}
 else if(kind==='all'){for(let y=0;y<3;y++)for(let x=0;x<3;x++){r(4+x*9,4+y*9,7,7,'outline');r(5+x*9,5+y*9,5,5,(x+y)%2?'mint':'creamShade')}}
 else if(['ironIngot','copperIngot'].includes(kind)){const metal=kind==='ironIngot'?'stoneLight':'coral',shade=kind==='ironIngot'?'stoneShade':'coralShade';r(4,15,24,11,'outline');r(8,10,17,6,'outline');r(9,11,15,4,metal);r(5,16,21,8,shade);r(6,16,20,3,metal);r(9,11,14,1,'creamLight');r(6,16,18,1,'creamLight');}
 else if(['coal','ironOre','copperOre'].includes(kind)){r(6,7,18,21,'outline');r(3,14,26,9,'outline');r(7,8,16,18,kind==='coal'?'deep':'stoneShade');r(4,15,24,6,kind==='coal'?'ink':'stone');for(const [x,y]of [[9,10],[19,16],[11,22]]){r(x,y,5,3,kind==='coal'?'deepLight':kind==='ironOre'?'coralLight':'coralShade');r(x,y,3,1,kind==='coal'?'stoneShade':'creamShade')}}
 else if(kind==='goldOre'||kind==='goldIngot')g.drawImage(A.hudIcon(kind),0,0);
 else if(kind==='flowers')g.drawImage(A.flowerIcon(),0,0);
 else g.drawImage(A.uiIcon(kind),0,0);
 cache.set(kind,c);return c;
};
A.inventoryCategoryIcon=function(kind){return kind==='blocks'?A.uiIcon('wood'):kind==='nature'?A.flowerIcon():kind==='materials'?A.hudIcon('goldOre'):kind==='tools'?A.inventoryIcon('nails'):kind==='buildings'?A.buildingIcon('workshop'):kind==='animals'?A.workerIcon():A.inventoryIcon('all')};
A.paintNailStrike=function(g,frame){const r=painter(g),poses=[[-12,-24],[-7,-17],[-2,-8],[-9,-18]],p=poses[Math.min(3,frame)];r(p[0]+2,p[1]+5,3,15,'outline');r(p[0]+3,p[1]+6,1,13,'wood');r(p[0]-3,p[1],12,6,'outline');r(p[0]-2,p[1]+1,10,4,'stone');r(p[0]-2,p[1]+1,10,1,'creamLight');if(frame===2){r(-7,-3,3,1,'creamLight');r(6,-6,1,3,'gold');r(-3,6,1,3,'gold')}};
})();
