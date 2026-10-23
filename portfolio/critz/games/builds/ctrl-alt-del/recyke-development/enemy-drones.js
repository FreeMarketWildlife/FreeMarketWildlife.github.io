/* Native MINI multirotor gun drones; variant hardware is proposed.
 * All rotation is rasterized into opaque native pixels before scene presentation.
 * x/y is the shared ground anchor; hover motion lives inside each native cell.
 */
(() => {
  'use strict';
  const ids = ['watcher', 'manta', 'collector'];
  const specs = {
    mini: {width:48, height:48, anchor:[20,40], spanPx:32}
  };
  const palettes = {
    watcher:['#101620','#1d2634','#29364d','#42536a','#72838e','#b4bfc2','#5d465a','#9a687b','#482c51','#86416c','#cc7197','#f0a4b8','#354f57','#77a5aa','#eba77d','#d4ccad'],
    manta:['#101620','#1d2634','#29364d','#42536a','#72838e','#b4bfc2','#453656','#756184','#303b62','#536a95','#829abd','#acd0d3','#315557','#6ca9a0','#eba77d','#d4ccad'],
    collector:['#101620','#1d2634','#29364d','#42536a','#72838e','#b4bfc2','#614338','#9b654a','#524131','#8c704a','#c29b65','#edbd80','#364d4c','#6c8c7a','#db8766','#d4ccad']
  };
  const states = ['idle','patrol','rush','charge','fire','hurt','death'];
  const durations = {
    idle:Array(8).fill(130), patrol:Array(12).fill(90), rush:Array(12).fill(60),
    charge:[100,100,90,80,70,160], fire:[45,60,65,85,100,150],
    hurt:[65,85,110,150], death:[70,75,85,90,100,120,150,500]
  };
  const loops = Object.fromEntries(states.map(s=>[s,['idle','patrol','rush'].includes(s)]));
  const loop = (f,n)=>((Math.trunc(f)||0)%n+n)%n;
  function frameAt(state,time) {
    const ts=durations[state]||durations.idle, total=ts.reduce((a,b)=>a+b,0);
    let ms=((time*1000)%total+total)%total;
    for(let f=0;f<ts.length;f++){if(ms<ts[f])return f;ms-=ts[f];}return 0;
  }
  function sample(size,state,frame) {
    const small=size==='mini', f=loop(frame,durations[state].length);
    const drift=[0,-1,-2,-2,-1,0,1,2,2,1,0,0];
    const bob=state==='idle'?[0,0,-1,-1,0,0,1,1][f]:state==='patrol'?drift[f]:state==='rush'?[0,0,-1,-1,0,1,1,0,-1,-1,0,1][f]:0;
    const death=state==='death', hurt=state==='hurt';
    const dy=death?(small?[0,0,1,4,7,10,12,12]:[0,0,4,12,22,32,38,38])[f]:0;
    const recoil=state==='fire'?(small?[-1,-1,0,0,0,0]:[-3,-2,-1,0,0,0])[f]:hurt?(small?[-1,-1,0,0]:[-3,-2,-1,0])[f]:0;
    const angle=death?[0,-.08,.12,.26,.36,.22,.20,.20][f]:hurt?[-.14,-.08,.04,0][f]:state==='rush'?.06:state==='patrol'?[0,-.02,-.04,-.04,-.02,0,.02,.04,.04,.02,0,0][f]:0;
    return {f,state,x:recoil,y:(small?-21:-64)+(small?Math.round(bob/2):bob)+dy,angle,
      rotor:death&&f>3?0:f%4, disabled:death&&f>1,
      charge:state==='charge'?f:0, fire:state==='fire'&&(f===1||f===2),
      fold:death?Math.min(1,f/4):0,
      phase:state==='charge'?['acquire','focus','focus','arm','arm','warning'][f]:state==='fire'?['aim','discharge','recoil','recover','recover','ready'][f]:death?['impact','short','drop','drop','crash','settle','wreck','wreck'][f]:state};
  }
  function raster(c,colors,pose) {
    const co=Math.cos(pose.angle), si=Math.sin(pose.angle);
    const point=([x,y])=>[Math.round(pose.x+x*co-y*si),Math.round(pose.y+x*si+y*co)];
    const ink=(index,x,y,w,h)=>{if(w<1||h<1)return;c.fillStyle=colors[index];c.fillRect(x,y,w,h);};
    function poly(index,vertices) {
      const pts=vertices.map(point), lo=Math.min(...pts.map(p=>p[1])), hi=Math.max(...pts.map(p=>p[1]));
      for(let y=lo;y<hi;y++) {
        const intersections=[], scan=y+.5;
        for(let i=0;i<pts.length;i++) {
          const a=pts[i],b=pts[(i+1)%pts.length];
          if((a[1]<=scan&&b[1]>scan)||(b[1]<=scan&&a[1]>scan))intersections.push(a[0]+(scan-a[1])*(b[0]-a[0])/(b[1]-a[1]));
        }
        intersections.sort((a,b)=>a-b);
        for(let i=0;i+1<intersections.length;i+=2){const x=Math.ceil(intersections[i]-.5),end=Math.ceil(intersections[i+1]-.5);ink(index,x,y,end-x,1);}
      }
    }
    const rect=(index,x,y,w=1,h=1)=>poly(index,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
    const band=(index,a,b,width)=>{const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,n=[-dy/d*width,dx/d*width];poly(index,[[a[0]+n[0],a[1]+n[1]],[b[0]+n[0],b[1]+n[1]],[b[0]-n[0],b[1]-n[1]],[a[0]-n[0],a[1]-n[1]]]);};
    return {p:poly,r:rect,band};
  }
  function rotor(R,x,y,pose,back=false) {
    const {r}=R,span=back?4:5;
    // Constant swept envelope, with blade phase inside it: no pulsing wingspan.
    r(0,x-span,y,span*2,1);r(back?3:4,x-span+1,y,span*2-2,1);
    const blade=pose.disabled?2:[span,2,span-1,3][pose.rotor];
    r(5,x-blade,y,blade,1);r(0,x-1,y-1,2,4);r(back?2:3,x,y,1,2);
    r(4,x-1,y+1,1,1);
  }
  function weaponRaster(R,pose,aimAngle=0){
    // Counter-rotate the gimbal so bank and recoil cannot bend the shot origin.
    const angle=aimAngle-pose.angle,co=Math.cos(angle),si=Math.sin(angle);
    const point=([x,y])=>[1+x*co-y*si,8+x*si+y*co];
    const p=(color,pts)=>R.p(color,pts.map(point));
    const r=(color,x,y,w=1,h=1)=>p(color,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
    return {p,r,point};
  }
  function muzzle(id,{state='idle',frame=null,time=0,facing=1,aimAngle=0}={}){
    if(!durations[state])state='idle';
    const f=frame==null?frameAt(state,time):loop(frame,durations[state].length),pose=sample('mini',state,f),W=weaponRaster({},pose,aimAngle),q=W.point([12,0]);
    return {x:Math.round(pose.x+q[0]*Math.cos(pose.angle)-q[1]*Math.sin(pose.angle))*(facing<0?-1:1),y:Math.round(pose.y+q[0]*Math.sin(pose.angle)+q[1]*Math.cos(pose.angle))};
  }
  function droneMini(R,pose,id,aimAngle=0){
    const {p,r,band}=R,utility=id==='collector',racer=id==='manta',accent=utility?7:racer?9:3;
    // Rear pair is visibly higher and inboard; all four motor pods are distinct.
    band(0,[-8,-5],[0,1],1);band(3,[-8,-5],[0,1],.5);
    band(0,[8,-5],[0,1],1);band(3,[8,-5],[0,1],.5);
    rotor(R,-8,-6,pose,true);rotor(R,8,-6,pose,true);
    band(0,[-11,-1],[0,2],1.5);band(accent,[-11,-1],[0,2],.5);
    band(0,[11,-1],[0,2],1.5);band(accent,[11,-1],[0,2],.5);
    rotor(R,-11,-2,pose);rotor(R,11,-2,pose);
    const width=racer?6:4;
    p(0,[[-width,-3],[width-1,-3],[width+1,0],[width,4],[-width,4],[-width-1,0]]);
    r(accent,-width+1,-2,width*2-2,5);r(4,-width+1,-2,width,1);
    r(0,2,-1,4,3);r(pose.disabled?3:10,3,0,2,1);r(pose.disabled?3:11,4,0,1,1);
    // Two landing struts surround a clear open space above the suspended gun.
    r(0,-5,3,1,7);r(3,-5,9,4,1);r(0,6,3,1,3);
    if(utility){ // Retain recovery identity as a folded rear tool, away from muzzle.
      r(0,-8,3,2,7);r(7,-7,4,1,5);r(0,-10,9,4,2);r(10,-10,10,1,2);r(10,-7,10,1,2);
    }
    r(0,0,4,3,4);r(4,1,5,1,2); // visible gimbal mount
    const W=weaponRaster(R,pose,aimAngle);
    W.p(0,[[-3,-2],[7,-2],[7,-1],[12,-1],[12,2],[7,2],[7,3],[-3,3]]);
    W.r(3,-2,-1,8,3);W.r(4,-2,-1,8,1);W.r(4,7,0,4,1);
    W.r(pose.disabled?2:10,0,1,3,1);
    if(pose.state==='charge')W.r(pose.f>3?11:10,5,-1,1,1);
    if(pose.fire){W.r(10,12,-2,2,4);W.r(15,12,0,pose.f===1?4:2,1);}
  }
  function draw(c,id,size,x,y,{state='idle',frame=null,time=0,facing=1,aimAngle=0}={}) {
    if(!ids.includes(id))id='watcher';if(!durations[state])state='idle';if(size!=='mini')throw new RangeError('Large models are archived.');
    const f=frame==null?frameAt(state,time):loop(frame,durations[state].length), pose=sample(size,state,f);
    c.save();c.translate(Math.round(x),Math.round(y));c.scale(facing<0?-1:1,1);
    const R=raster(c,palettes[id],pose);droneMini(R,pose,id,aimAngle);
    if((state==='hurt'||state==='death')&&f<3) {
      const small=size==='mini', d=small?5:17;
      R.r(14,-d,-d,small?1:3,small?2:4);R.r(15,-d+1,-d-1,1,small?1:2);
      R.r(14,d-2,-d+4,small?1:3,small?1:2);
    }
    c.restore();
  }
  function metadata(id) {
    return {id,kind:'aerial',standingMeasurement:'neutral rotor span',spanPx:{mini:32},
      groundAnchor:true,hoverCenter:{mini:-21},loops,
      phases:Object.fromEntries(states.map(state=>[state,durations[state].map((_,f)=>sample('mini',state,f).phase)])),
      poses:Object.fromEntries(['mini'].map(size=>[size,Object.fromEntries(states.map(state=>[state,durations[state].map((_,f)=>sample(size,state,f))]))]))};
  }
  const api={ids,specs,palettes,states,durations,columns:12,loops,frameAt,sample,draw,metadata,muzzle};if(typeof window!=='undefined')window.CADEnemyDrones=api;if(typeof module==='object')module.exports=api;
})();
