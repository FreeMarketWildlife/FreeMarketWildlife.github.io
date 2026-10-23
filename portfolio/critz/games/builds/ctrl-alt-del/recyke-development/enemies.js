/* Shared enemy catalogue and canonical native sprite exports. */
(() => {
  'use strict';
  const CADEnemyMechs=typeof module==='object'?require('./enemy-mechs.js'):window.CADEnemyMechs;
  const CADEnemyDrones=typeof module==='object'?require('./enemy-drones.js'):window.CADEnemyDrones;
  const entries=[
  {
    "id": "sentinel",
    "name": "Nexus Security Robot",
    "group": "Mechs",
    "role": "Baseline proposal",
    "description": "Human-sized robot carrying a stock-equipped gun with trigger and support hands.",
    "spanLabel": "32px standing height",
    "provisional": true,
    "category": "security-robot",
    "prototypeVariant": false
  },
  {
    "id": "bastion",
    "name": "Nexus Security Robot \u00b7 Bastion prototype",
    "group": "Mechs",
    "role": "Armored prototype",
    "description": "Human-sized armored variant with a compact forearm shield and carried gun.",
    "spanLabel": "32px standing height",
    "provisional": true,
    "category": "security-robot",
    "prototypeVariant": true
  },
  {
    "id": "scrapper",
    "name": "Nexus Security Robot \u00b7 Scrapper prototype",
    "group": "Mechs",
    "role": "Utility prototype",
    "description": "Human-sized utility variant with a rear tool pack and carried gun.",
    "spanLabel": "32px standing height",
    "provisional": true,
    "category": "security-robot",
    "prototypeVariant": true
  },
  {
    "id": "watcher",
    "name": "Nexus Gun Drone",
    "group": "Drones",
    "role": "Baseline proposal",
    "description": "Open four-rotor frame, separate landing struts and a gun on an underside gimbal.",
    "spanLabel": "32px neutral rotor span",
    "provisional": true,
    "category": "gun-drone",
    "prototypeVariant": false
  },
  {
    "id": "manta",
    "name": "Nexus Gun Drone \u00b7 Manta prototype",
    "group": "Drones",
    "role": "Interceptor prototype",
    "description": "Compact multirotor variant with a wider battery housing and underside gun.",
    "spanLabel": "32px neutral rotor span",
    "provisional": true,
    "category": "gun-drone",
    "prototypeVariant": true
  },
  {
    "id": "collector",
    "name": "Nexus Gun Drone \u00b7 Collector prototype",
    "group": "Drones",
    "role": "Recovery prototype",
    "description": "Multirotor variant with a stowed rear retrieval tool and visible underside gun.",
    "spanLabel": "32px neutral rotor span",
    "provisional": true,
    "category": "gun-drone",
    "prototypeVariant": true
  }
];
  const specs={mini:{width:48,height:48,anchor:[20,40]}};
  const columns=12;
  const entry=id=>entries.find(e=>e.id===id)||entries[0];
  const model=id=>entry(id).group==='Drones'?CADEnemyDrones:CADEnemyMechs;
  const states=id=>model(id).states;
  const durations=id=>model(id).durations;
  const palette=id=>model(id).palettes[entry(id).id];
  const frameAt=(id,state,time)=>model(id).frameAt(state,time);
  const draw=(c,id,size,x,y,options)=>model(id).draw(c,entry(id).id,size,x,y,options);
  const muzzle=(id,options)=>model(id).muzzle(id,options);
  // Angle in local facing coordinates; the native gun pivots with the same value.
  const aimAngle=e=>Math.atan2((e.aimY??e.y-21)-(e.y+(model(e.id)===CADEnemyDrones?-13:-23)),Math.max(1,(e.facing||1)*((e.aimX??e.x+100)-e.x)));
  function sheet(id,size='mini') {
    const s=specs[size],rows=states(id),canvas=document.createElement('canvas');
    canvas.width=s.width*columns;canvas.height=s.height*rows.length;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
    rows.forEach((state,row)=>{for(let f=0;f<columns;f++)draw(c,id,size,f*s.width+s.anchor[0],row*s.height+s.anchor[1],{state,frame:Math.min(f,durations(id)[state].length-1)});});
    return canvas;
  }
  function metadata(id) {
    const e=entry(id),m=model(id),timingMs=durations(id),rows=states(id),motion=m.metadata(e.id);
    return {id:e.id,name:e.name,group:e.group,category:e.category,provisional:true,prototypeVariant:e.prototypeVariant,sourcePixelWorldUnits:1,sizes:specs,
      palette:palette(id),columns,rows,timingMs,frameCounts:Object.fromEntries(rows.map(s=>[s,timingMs[s].length])),
      loops:motion.loops||Object.fromEntries(rows.map(s=>[s,['idle','walk','run','run-fire','patrol','rush'].includes(s)])),
      framePadding:'Repeat final authored pose to fill 12 columns',attachments:{space:'feet-relative, facing right, native pixels',aimAngleUnit:'radians',muzzle:Object.fromEntries(rows.map(state=>[state,timingMs[state].map((_,frame)=>muzzle(id,{state,frame}))]))},motion};
  }
  const cache={};
  function adapter(id) {
    id=entry(id).id;
    return cache[id]||(cache[id]={specs,states:states(id),durations:durations(id),palette:palette(id),columns,
      frameAt:(state,time)=>frameAt(id,state,time),draw:(c,size,x,y,o)=>draw(c,id,size,x,y,o),sheet:size=>sheet(id,size),metadata:()=>metadata(id)});
  }
  const api={entries,specs,columns,states,durations,palette,frameAt,draw,sheet,metadata,adapter,muzzle,aimAngle};if(typeof window!=='undefined')window.CADEnemies=api;if(typeof module==='object')module.exports=api;
})();
