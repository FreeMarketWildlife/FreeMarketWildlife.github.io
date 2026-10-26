/* Native humanoid machinery: shared fixed-length legs, articulated collapse,
 * and timed anticipation/recoil. Foot paths continue the approved hero grid. */
(() => {
  'use strict';
  const dimensions={mini:{hipY:-16,thigh:7,shin:7,spread:1,sole:3}};
  const timings={idle:Array(8).fill(160),walk:Array(12).fill(80),run:Array(12).fill(50),charge:[100,100,130,130,160,100],fire:[70,45,65,80,110,160],'run-fire':Array(12).fill(50),melee:[100,160,45,75,110,170],jump:[70,100,160,110,75,90],hurt:[70,90,110,150],death:[90,110,95,80,80,110,170,600]};
  const phases={idle:Array(8).fill('scan'),walk:['contact','down','support','pass','rise','push','contact','down','support','pass','rise','push'],run:['contact','down','support','push','flight','fall','contact','down','support','push','flight','fall'],charge:['notice','brace','windup','aim','lock','ready'],fire:['aim','discharge','recoil','settle','vent','ready'],melee:['guard','windup','strike','impact','retract','recover'],jump:['takeoff','rise','apex','fall','land','recover'],hurt:['impact','recoil','settle','recover'],death:['hit','fail','buckle','fall','impact','settle','power-down','wreck']};
  const paths={
    mini:{walk:[[6,-3,0],[4,-3,0],[2,-3,0],[0,-3,0],[-2,-3,0],[-4,-3,0],[-6,-3,0],[-5,-5,.75],[-3,-7,.45],[0,-8,0],[3,-7,-.2],[5,-5,-.25]],run:[[6,-3,0],[4,-3,0],[1,-3,0],[-3,-5,.9],[-5,-8,1.1],[-4,-11,.8],[-2,-11,.4],[0,-8,0],[3,-6,-.3],[5,-5,-.35],[6,-4,-.3],[6,-4,-.2]],walkBob:[0,1,1,0,-1,0,0,1,1,0,-1,0],runBob:[0,1,0,-1,-1,0,0,1,0,-1,-1,0],jumpNear:[[-1,-5,.6],[3,-7,-.1],[4,-9,-.2],[5,-6,-.2],[5,-3,0],[3,-3,0]],jumpFar:[[-4,-3,0],[-5,-5,.8],[-5,-6,1],[-4,-5,.6],[-3,-3,0],[-3,-3,0]],jumpBob:[0,-1,-1,0,3,1]}
  };
  const loop=(f,n)=>((Math.trunc(f)||0)%n+n)%n;
  function solve(hip,ankle,d,pitch,foldUp=false){const dx=ankle[0]-hip[0],dy=ankle[1]-hip[1],len=Math.hypot(dx,dy)||.001,a=(d.thigh*d.thigh-d.shin*d.shin+len*len)/(2*len),h=Math.sqrt(Math.max(0,d.thigh*d.thigh-a*a));const sign=foldUp&&dx<0?-1:1;return {hip:hip.map(Math.round),knee:[Math.round(hip[0]+dx/len*a+sign*dy/len*h),Math.round(hip[1]+dy/len*a-sign*dx/len*h)],ankle:ankle.map(Math.round),pitch,contact:ankle[1]===-d.sole};}
  function sample(size,state='idle',frame=0){
    const family='mini',small=family==='mini',d=dimensions[family],p=paths[family],action=state==='run-fire'?'run':state,f=loop(frame,(timings[state]||timings.idle).length);
    let bob=0,lean=0,angle=0,shift=0,near=small?[5,-3,0]:[16,-5,0],far=small?[-5,-3,0]:[-16,-5,0];
    if(action==='walk'||action==='run'){near=p[action][f];far=p[action][(f+6)%12];bob=p[`${action}Bob`][f];lean=action==='run'?(small?1:4):0;}
    else if(action==='jump'){near=p.jumpNear[f];far=p.jumpFar[f];bob=p.jumpBob[f];lean=small?1:3;}
    else if(action==='idle'){bob=small?0:[0,0,0,1,1,1,0,0][f];}
    else if(action==='charge'){bob=(small?[0,1,2,2,1,1]:[0,2,5,5,3,2])[f];lean=(small?[0,-1,-1,0,1,1]:[0,-2,-3,0,2,3])[f];}
    else if(action==='fire'){lean=(small?[0,-1,-1,0,0,0]:[0,-3,-2,-1,0,0])[f];bob=small?0:[0,1,1,0,0,0][f];}
    else if(action==='melee'){bob=(small?[0,1,0,0,1,0]:[0,3,0,1,2,0])[f];lean=(small?[0,-1,2,2,1,0]:[0,-4,6,5,2,0])[f];}
    else if(action==='hurt'){bob=(small?[0,1,1,0]:[0,3,1,0])[f];lean=(small?[-2,-2,-1,0]:[-5,-4,-2,0])[f];angle=[-.08,-.12,-.04,0][f];}
    else if(action==='death'){
      bob=(small?[0,1,3,5,8,8,8,8]:[0,2,9,17,25,28,28,28])[f];
      shift=(small?[0,-1,-1,-2,-5,-6,-6,-6]:[0,-2,-3,-5,-13,-18,-18,-18])[f];
      angle=[-.1,-.16,.15,.52,1.16,1.5,1.47,1.47][f];
      near=(small?[[5,-3,0],[5,-3,0],[5,-3,0],[5,-3,0],[4,-3,0],[2,-3,0],[2,-3,0],[2,-3,0]]:[[16,-5,0],[16,-5,0],[16,-5,0],[16,-5,0],[11,-5,0],[5,-5,0],[5,-5,0],[5,-5,0]])[f];
      far=(small?[[-5,-3,0],[-5,-3,0],[-5,-3,0],[-6,-3,0],[-9,-3,0],[-12,-3,0],[-12,-3,0],[-12,-3,0]]:[[-16,-5,0],[-16,-5,0],[-16,-5,0],[-20,-5,0],[-30,-5,0],[-38,-5,0],[-38,-5,0],[-38,-5,0]])[f];
    }
    const nx=shift+d.spread,fx=shift-d.spread,nearAnkle=[near[0]+d.spread,near[1]],farAnkle=[far[0]-d.spread,far[1]];
    let pelvisY=d.hipY+bob;const reach=d.thigh+d.shin;
    for(const [a,hx] of [[nearAnkle,nx],[farAnkle,fx]]){const limit=Math.sqrt(Math.max(0,reach*reach-(a[0]-hx)**2));pelvisY=Math.max(Math.ceil(a[1]-limit),Math.min(Math.floor(a[1]+limit),pelvisY));}
    return {bob:pelvisY-d.hipY,lean,angle,shift,phase:phases[action]?.[f]||action,near:solve([nx,pelvisY],nearAnkle,d,near[2],action==='death'),far:solve([fx,pelvisY],farAnkle,d,far[2],action==='death')};
  }
  const loops=Object.fromEntries(Object.keys(timings).map(s=>[s,['idle','walk','run','run-fire'].includes(s)]));
  const contactFrames={walk:Array.from({length:12},(_,i)=>i),run:[0,1,2,6,7,8],'run-fire':[0,1,2,6,7,8],charge:[0,1,2,3,4,5],fire:[0,1,2,3,4,5],melee:[0,1,2,3,4,5],jump:[4,5],death:[0,1,2,3,4,5,6,7]};
  const api={sample,dimensions,timings,phases,loops,contactFrames};if(typeof window!=='undefined')window.CADEnemyMechMotion=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
