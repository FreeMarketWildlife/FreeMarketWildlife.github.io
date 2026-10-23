/* Native MINI security robots. Variant construction and colors are proposals. */
(() => {
  'use strict';
  const M=typeof module==='object'?require('./enemy-mech-motion.js'):window.CADEnemyMechMotion;
  const ids=['sentinel','bastion','scrapper'];
  const specs={mini:{width:48,height:48,anchor:[20,40],heightPx:32}};
  const palettes={
    sentinel:['#101620','#1d2634','#29364d','#42536a','#72838e','#273e47','#365966','#53858b','#8cb8b0','#bdcfc0','#413342','#733b50','#b95266','#ef8b87','#f4c9a4','#d4ccad'],
    bastion:['#101620','#1d2634','#29364d','#42536a','#72838e','#3b3d34','#5e604b','#929077','#c4ba94','#e0d6b4','#493a36','#87523f','#c27946','#efb35d','#f9d991','#d4ccad'],
    scrapper:['#101620','#1d2634','#29364d','#42536a','#72838e','#4c3234','#80483c','#b66f49','#dfa76a','#e7c799','#243e45','#356976','#61a8a6','#99d4c5','#d6ece0','#d4ccad']
  };
  const states=['idle','walk','run','charge','fire','run-fire','melee','jump','hurt','death'];
  const durations=M.timings,columns=12,loop=(f,n)=>((Math.trunc(f)||0)%n+n)%n;
  function frameAt(state,time){const t=durations[state]||durations.idle,total=t.reduce((a,b)=>a+b,0);let ms=((time*1000)%total+total)%total;for(let f=0;f<t.length;f++){if(ms<t[f])return f;ms-=t[f];}return 0;}
  function raster(c,palette){
    const r=(color,x,y,w=1,h=1)=>{if(w<=0||h<=0)return;c.fillStyle=palette[parseInt(color,16)]||color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
    const p=(color,points)=>{const q=points.map(([x,y])=>[Math.round(x),Math.round(y)]),lo=Math.min(...q.map(a=>a[1])),hi=Math.max(...q.map(a=>a[1]));for(let y=lo;y<hi;y++){const hits=[];for(let i=0;i<q.length;i++){const a=q[i],b=q[(i+1)%q.length],scan=y+.5;if((a[1]<=scan&&b[1]>scan)||(b[1]<=scan&&a[1]>scan))hits.push(a[0]+(scan-a[1])*(b[0]-a[0])/(b[1]-a[1]));}hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2){const x=Math.ceil(hits[i]-.5),end=Math.ceil(hits[i+1]-.5);r(color,x,y,end-x,1);}}};
    const disk=(color,x,y,radius)=>{for(let dy=-radius;dy<=radius;dy++){const span=Math.floor(Math.sqrt(radius*radius-dy*dy));r(color,x-span,y+dy,span*2+1,1);}};
    return {r,p,disk};
  }
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const normal=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;return[-dy/d,dx/d];};
  const offset=(a,n,w)=>[a[0]+n[0]*w,a[1]+n[1]*w];
  function band(p,color,a,b,wa,wb){const n=normal(a,b);p(color,[offset(a,n,wa),offset(b,n,wb),offset(b,n,-wb),offset(a,n,-wa)]);}
  function panel(p,color,a,b,t0,t1,left,right){const n=normal(a,b),u=mix(a,b,t0),v=mix(a,b,t1);p(color,[offset(u,n,left),offset(v,n,left),offset(v,n,right),offset(u,n,right)]);}
  function elbow(s,h,a,b){const dx=h[0]-s[0],dy=h[1]-s[1],distance=Math.hypot(dx,dy)||.001,d=Math.min(a+b-.01,distance),along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));return [s[0]+dx/distance*along-dy/distance*height,s[1]+dy/distance*along+dx/distance*height];}
  function bodyRaster(raster,pose,size){
    const hip=M.dimensions[size].hipY,co=Math.cos(pose.angle),si=Math.sin(pose.angle);
    const point=(x,y)=>{const u=x+pose.lean*Math.max(0,Math.min(1,(hip-y)/32)),v=y-hip;return [pose.shift+u*co-v*si,hip+pose.bob+u*si+v*co];};
    const p=(color,pts)=>raster.p(color,pts.map(q=>point(...q)));
    const r=(color,x,y,w=1,h=1)=>p(color,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
    const disk=(color,x,y,radius)=>{for(let dy=-radius;dy<=radius;dy++){const span=Math.floor(Math.sqrt(radius*radius-dy*dy));r(color,x-span,y+dy,span*2+1,1);}};
    return {p,r,disk,point};
  }
  function pivotRaster(B,x,y,angle){
    const co=Math.cos(angle),si=Math.sin(angle),p=(color,pts)=>B.p(color,pts.map(([u,v])=>[x+(u-x)*co-(v-y)*si,y+(u-x)*si+(v-y)*co]));
    const r=(color,u,v,w=1,h=1)=>p(color,[[u,v],[u+w,v],[u+w,v+h],[u,v+h]]);return {p,r};
  }
  function mechanicalLegs(R,pose,id,small){
    const {p,disk}=R,wide=id==='bastion',industrial=id==='scrapper';
    function leg(j,back){const h=j.hip,k=j.knee,a=j.ankle,thigh=small?(wide?2.7:2.2):(wide?7:industrial?6:4.5),calf=small?(wide?2:1.7):(wide?5.5:industrial?4.5:3.5);
      band(p,'0',h,k,thigh,thigh-1);band(p,back?'1':'2',h,k,thigh-1,thigh-2);band(p,'0',k,a,calf,calf-1);band(p,back?'2':'3',k,a,calf-1,calf-1.7);
      panel(p,back?'5':'6',h,k,.08,.65,-thigh+1,thigh-1);panel(p,back?'6':'7',h,k,.12,.5,1,thigh-1);panel(p,back?'3':'4',k,a,.23,.76,0,calf-1);
      disk('0',k[0],k[1],small?2:5);disk(back?'2':'3',k[0],k[1],small?1:3);if(!small){disk(back?'3':'4',k[0],k[1],1);panel(p,back?'6':'8',h,k,.15,.21,-thigh+2,thigh-2);}
      if(industrial&&!small){const n=normal(k,a),u=offset(mix(k,a,.08),n,-4),v=offset(mix(k,a,.82),n,-4);band(p,'0',u,v,2,2);band(p,'4',u,v,1,1);panel(p,'1',u,v,.1,.35,-1,1);}
      const co=Math.cos(j.pitch),si=Math.sin(j.pitch),local=pts=>pts.map(([x,y])=>[a[0]+x*co-y*si,a[1]+x*si+y*co]);
      if(small){p('0',local([[-2,-3],[1,-3],[2,0],[4,1],[4,3],[-2,3]]));p(back?'5':'7',local([[-1,-2],[1,-2],[1,1],[3,1],[3,2],[-1,2]]));p(back?'3':'9',local([[-1,1],[3,1],[3,2],[-1,2]]));}
      else{p('0',local([[-4,-8],[3,-8],[4,-2],[10,0],[12,2],[12,5],[-5,5],[-5,-2]]));p(back?'5':'6',local([[-3,-7],[2,-7],[3,-1],[9,1],[10,3],[-3,3]]));p(back?'6':'7',local([[-3,-6],[1,-6],[1,-1],[-3,1]]));p(back?'3':'4',local([[-4,3],[11,3],[11,4],[-4,4]]));p(back?'7':'8',local([[4,0],[8,1],[9,2],[3,2]]));}
    }
    leg(pose.far,true);leg(pose.near,false);
  }
  function arm(B,s,h,back,id,small,knownElbow){const {p,disk}=B,e=knownElbow||elbow(s,h,small?5:17,small?5:19),width=small?(id==='sentinel'?1.5:2):(id==='sentinel'?3.5:5);
    band(p,'0',s,e,width+1,width);band(p,'0',e,h,width,width-.5);band(p,back?'2':'3',s,e,width-1,width-1);band(p,back?'5':'6',e,h,width-1,width-1.5);disk('0',e[0],e[1],small?2:4);disk(back?'3':'4',e[0],e[1],small?1:2);panel(p,back?'6':'7',s,e,.03,.63,-width+1,width-1);panel(p,back?'7':'8',s,e,.1,.23,-width+1,width-1);disk('0',s[0],s[1],small?2:6);disk(back?'5':'6',s[0],s[1],small?1:4);if(!small)disk(back?'6':'8',s[0]-1,s[1]-1,2);
  }
  const strike=f=>[0,-7,12,11,4,0][f];
  const alive=(state,f)=>state!=='death'||f<6;
  // One carried weapon, two articulated hands. Gun coordinates are shared with
  // muzzle queries; game aim rotates native polygons, never a rendered bitmap.
  function weapon(state,f,aimAngle=0) {
    const pose=M.sample('mini',state,f),fire=state==='fire',shot=fire?(f===1||f===2):state==='run-fire'&&f%3===1;
    const ready=['charge','fire','run-fire'].includes(state);
    const lift=state==='charge'?[3,2,1,0,0,0][f]:ready?0:2;
    const bash=state==='melee'?[0,-2,3,3,1,0][f]:0;
    const x=(shot?-1:0)+bash,y=-23+lift;
    const angle=state==='death'?-.25:aimAngle-pose.angle;
    const co=Math.cos(angle),si=Math.sin(angle);
    const point=(u,v)=>[x+u*co-v*si,y+u*si+v*co];
    return {pose,shot,point};
  }
  function muzzle(id,{state='idle',frame=null,time=0,facing=1,aimAngle=0}={}) {
    if(!durations[state])state='idle';
    const f=frame==null?frameAt(state,time):loop(frame,durations[state].length),w=weapon(state,f,aimAngle);
    const B=bodyRaster({p(){}},w.pose,'mini'),pt=B.point(...w.point(15,0));
    return {x:Math.round(pt[0])*(facing<0?-1:1),y:Math.round(pt[1])};
  }
  function mini(c,id,state,f,aimAngle=0){
    const R=raster(c,palettes[id]),w=weapon(state,f,aimAngle),pose=w.pose,B=bodyRaster(R,pose,'mini'),{p,r}=B,lit=alive(state,f),heavy=id==='bastion',utility=id==='scrapper';
    mechanicalLegs(R,pose,id,true);
    // Pelvis and narrow waist keep a person-sized torso above the fixed legs.
    r('0',-4,-18,8,5);r('2',-3,-17,6,3);r('4',-2,-17,2,1);
    if(utility){r('0',-7,-27,3,9);r('6',-6,-26,2,7);r('4',-6,-25,1,4);}
    arm(B,[3,-25],w.point(9,2),true,id,true);
    p('0',[[-5,-28],[2,-28],[5,-25],[4,-20],[2,-17],[-3,-17],[-5,-22]]);
    p('6',[[-4,-27],[1,-27],[4,-25],[3,-21],[1,-18],[-2,-18],[-4,-22]]);
    p('7',[[-4,-27],[0,-27],[2,-24],[-3,-23]]);r('8',-3,-27,3,1);
    r('1',-2,-21,4,3);r('4',-1,-20,2,1);r(lit?'c':'a',1,-24,2,1);
    if(heavy){r('0',-6,-28,3,5);r('7',-5,-27,2,3);r('8',-5,-27,2,1);}
    r('0',0,-29,2,3);
    p('0',[[-2,-32],[3,-32],[5,-30],[5,-27],[2,-25],[-2,-27],[-3,-29]]);
    p('6',[[-1,-31],[2,-31],[4,-29],[3,-27],[0,-27],[-2,-29]]);
    r('8',-1,-31,3,1);r('0',1,-30,4,2);r(lit?'d':'3',2,-29,2,1);
    if(state==='idle')r('e',2+(f>3?1:0),-29,1,1);
    // Trigger hand is distinct from the receiver, support hand under fore-end.
    arm(B,[-3,-25],w.point(3,3),false,id,true);
    const gp=(color,pts)=>p(color,pts.map(q=>w.point(...q)));
    const gr=(color,x,y,width=1,height=1)=>gp(color,[[x,y],[x+width,y],[x+width,y+height],[x,y+height]]);
    // Stock, receiver, magazine, fore-end, and exposed barrel with a dark bore.
    gp('0',[[-3,-2],[1,-2],[1,-3],[10,-3],[10,-2],[15,-2],[15,1],[10,1],[10,2],[6,2],[6,5],[3,5],[3,2],[-3,1]]);
    gr('3',1,-2,9,3);gr('4',2,-2,7,1);gr('2',-2,-1,3,1);
    gr('7',5,-1,3,1);gr('4',10,-1,4,1);gr('1',4,3,1,2);
    gr('8',2,1,2,2);gr('0',2,3,2,1);gr('8',8,1,3,1);gr('4',9,2,2,1);
    if(heavy){ // Compact forearm shield leaves the carried gun and both grips clear.
      p('0',[[-5,-23],[-1,-23],[2,-20],[1,-15],[-3,-15],[-5,-18]]);
      p('5',[[-4,-22],[-1,-22],[1,-20],[0,-16],[-2,-16],[-4,-18]]);r('8',-3,-21,1,4);
    }
    if(utility){r('4',-5,-24,2,2);r('8',-5,-24,1,1);}
    if(w.shot){gr('d',15,-2,2,3);gr('e',15,-1,4,1);}
  }
  function draw(c,id,size,x,y,{state='idle',frame=null,time=0,facing=1,aimAngle=0}={}){if(size!=='mini')throw new RangeError('Large models are archived.');if(!ids.includes(id))id='sentinel';if(!durations[state])state='idle';const f=frame==null?frameAt(state,time):loop(frame,durations[state].length);c.save();c.translate(Math.round(x),Math.round(y));c.scale(facing<0?-1:1,1);mini(c,id,state,f,aimAngle);c.restore();}
  function metadata(id){return {name:id[0].toUpperCase()+id.slice(1),id,sourcePixelWorldUnits:1,framePadding:'Repeat final authored pose to fill 12 columns',palette:palettes[id],sizes:specs,columns,rows:states,timingMs:durations,frameCounts:Object.fromEntries(states.map(s=>[s,durations[s].length])),loops:M.loops,contactFrames:M.contactFrames,phases:Object.fromEntries(states.map(s=>[s,durations[s].map((_,f)=>M.sample('mini',s,f).phase)])),motion:{dimensions:M.dimensions,poses:Object.fromEntries(['mini'].map(size=>[size,Object.fromEntries(states.map(s=>[s,durations[s].map((_,f)=>M.sample(size,s,f))]))]))}};}
  const api={ids,specs,palettes,states,durations,columns,frameAt,draw,metadata,muzzle};if(typeof window!=='undefined')window.CADEnemyMechs=api;if(typeof module==='object')module.exports=api;
})();
