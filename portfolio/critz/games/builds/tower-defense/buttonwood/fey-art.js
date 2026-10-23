// ART-BIBLE §§3–4, 6, 9–10: tiny native wings, restrained magic and intact defeat poses.
(()=>{'use strict';const A=ButtonwoodArt,P=A.palette,cache=new Map(),base=A.worker;
A.worker=function(options={}){const key=JSON.stringify(options);if(cache.has(key))return cache.get(key);const c=document.createElement('canvas');c.width=40;c.height=32;const g=c.getContext('2d'),d=options.dir<0?-1:1;if(d<0){g.translate(36,0);g.scale(-1,1)}const r=(x,y,w,h,k)=>{g.fillStyle=P[k];g.fillRect(x,y,w,h)},lift=(options.frame||0)%3===1?1:0;
// Four tapered lobes join at the shoulder blades; veins run toward the root.
for(const [side,k]of [[-1,'mintLight'],[1,'creamLight']]){const root=side<0?14:24,px=(u)=>root+side*u;
for(const [y,lo,hi]of [[13,9,11],[14,7,12],[15,5,13],[16,4,13],[17,3,12],[18,2,11],[19,1,9],[20,0,7],[21,0,5],[22,0,7],[23,1,9],[24,2,10],[25,3,9],[26,5,8]])for(let u=lo;u<=hi;u++)r(px(u),y,1,1,u===lo||u===hi?'mintShade':k);
for(let u=1;u<11;u++)r(px(u),21-Math.floor(u*.55),1,1,'mint');for(let u=1;u<8;u++)r(px(u),22+Math.floor(u*.4),1,1,'mint');r(px(0),21,1,3,'mintShade');r(px(8),15,1,2,'creamLight')}

g.setTransform(1,0,0,1,0,0);g.drawImage(base(options),0,0);cache.set(key,c);return c};
A.workerIcon=()=>A.fairyIcon();
A.liquidColors.taintedWater=[P.deepLight,P.coralLight,P.deepShade];
A.taintedBucketIcon=()=>{if(cache.has('bucket'))return cache.get('bucket');const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=(x,y,w,h,k)=>{g.fillStyle=P[k];g.fillRect(x,y,w,h)};r(7,4,18,2,'outline');r(5,6,2,13,'outline');r(25,6,2,13,'outline');r(4,13,24,3,'ink');r(7,16,18,13,'outline');r(8,16,16,11,'stoneLight');r(9,16,14,5,'deepLight');r(10,16,5,1,'coralLight');r(12,8,1,5,'gold');r(10,10,5,1,'creamLight');cache.set('bucket',c);return c};
A.paintFeySpark=function(g,x,y,frame){const points=[[0,-26],[18,-15],[-17,-10]];for(let i=0;i<points.length;i++){const p=points[(i+frame)%3],n=(frame+i)%4;g.fillStyle=P[n<2?'creamLight':'gold'];g.fillRect(Math.round(x+p[0]),Math.round(y+p[1]-n),1,1);if(n===1){g.fillRect(Math.round(x+p[0]-1),Math.round(y+p[1]),3,1);g.fillRect(Math.round(x+p[0]),Math.round(y+p[1]-1),1,3)}}};
A.paintFairyDefeat=function(g,method,frame){const r=(x,y,w,h,k)=>{g.fillStyle=P[k];g.fillRect(x,y,w,h)},hit=frame>=2;
const x=method==='stab'?(hit?-1:12-frame*5):12-frame*6,y=method==='stab'?-10:-13;r(x,y,10,2,'stoneLight');r(x,y+2,9,1,'stoneShade');r(x+10,y-1,2,5,'goldShade');r(x+12,y,5,2,'woodShade');
if(hit){r(method==='stab'?0:-2,method==='stab'?-10:-13,5,3,'bloodShade');r(1,-8,3,7,'blood');for(let i=0;i<7;i++){const dx=(i-3)*(frame+2),dy=(method==='slice'?-14:-10)-Math.abs(i-3)*2+frame;r(dx,dy,3,2,'blood');r(dx+1,dy,1,1,'bloodLight')}}};
A.paintFairyBody=function(g,d,age){const frame=Math.min(3,Math.floor(age/150));if(age<300){g.drawImage(d.sprite,-18,-31);A.paintFairyDefeat(g,d.method,frame);return}
// Physics may rotate the falling body; every source pixel keeps its native size.
const fall=Math.min(1,(age-300)/500);if(d.method==='slice'){g.save();g.translate(-fall*19,-18+fall*6);g.rotate(-fall*1.1);g.drawImage(d.sprite,0,0,40,18,-18,-13,40,18);g.restore();g.save();g.translate(0,-fall*8);g.rotate(fall*1.5);g.drawImage(d.sprite,0,18,40,14,-18,-13,40,14);g.fillStyle=P.blood;g.fillRect(-5,-13,8,3);g.restore()}else{g.save();g.translate(0,-fall*8);g.rotate(fall*1.5);g.drawImage(d.sprite,-18,-31);g.fillStyle=P.bloodShade;g.fillRect(-3,-12,7,4);g.fillStyle=P.blood;g.fillRect(-1,-9,4,8);g.restore()}if(age<600)A.paintFairyDefeat(g,d.method,3)};
})();
