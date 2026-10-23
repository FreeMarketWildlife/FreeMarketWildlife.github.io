/* Episode I isolated adaptation of Recyke / Sorting Row. Original, separately authored big and mini routes.
 * Pure simulation: coordinates are native art pixels; player/enemy y means feet
 * (drones retain the sprite's ground anchor). Shared native weapon geometry; no DOM dependency. */
(() => {
  'use strict';
  const enemyArt=typeof module==='object'?require('../../recyke-development/enemies.js'):window.CADEnemies;
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const DRONES = new Set(['watcher','collector','manta']);
  const configs = {
    mini: {
      size:'mini', title:'Sorting Row', subtitle:'Recyke · Lower service lane', width:480, height:270,
      worldWidth:2112, floor:222, safeUntilX:120, spawn:{x:44,y:222}, playerWidth:10, playerHeight:30, crouchHeight:16, crouchSpeed:25, crouchMuzzleX:18, crouchMuzzleY:9,
      speed:90, acceleration:900, gravity:600, jumpSpeed:245, maxFallSpeed:400,
      muzzleX:14, muzzleY:23, shotSpeed:370, shotRange:320, enemyShotSpeed:115,
      enemyRange:205, droneOffset:21, enemyWidth:12, enemyHeight:30, droneWidth:16, droneHeight:14,
      meleeReach:24, pickupRadius:13, maxHp:6, checkpoint:{x:1090,y:222}, exit:{x:2036,y:222},
      platforms:[
        {x:0,y:222,w:2112,h:48,kind:'ground'},
        {x:334,y:206,w:24,h:16,kind:'crate'}, {x:386,y:190,w:24,h:32,kind:'crate'},
        {x:430,y:178,w:150,h:6,kind:'platform',oneWay:true},
        {x:624,y:214,w:140,h:8,kind:'belt'},
        {x:810,y:206,w:24,h:16,kind:'crate'}, {x:856,y:190,w:24,h:32,kind:'crate'},
        {x:912,y:177,w:142,h:6,kind:'platform',oneWay:true},
        {x:1240,y:206,w:24,h:16,kind:'crate'},
        {x:1342,y:193,w:112,h:6,kind:'platform',oneWay:true},
        {x:1504,y:214,w:176,h:8,kind:'belt'},
        {x:1740,y:206,w:24,h:16,kind:'crate'}
      ],
      enemies:[
        {id:'sentinel',x:250,y:222,left:220,right:280,hp:3},
        {id:'watcher',x:610,y:222,left:585,right:645,hp:3},
        {id:'scrapper',x:722,y:214,left:668,right:748,hp:4},
        {id:'manta',x:990,y:194,left:922,right:1032,hp:3,optional:true},
        {id:'collector',x:1310,y:220,left:1284,right:1330,hp:3},
        {id:'sentinel',x:1490,y:222,left:1472,right:1500,hp:3},
        {id:'scrapper',x:1630,y:214,left:1560,right:1666,hp:4},
        {id:'bastion',x:1898,y:222,left:1850,right:1940,hp:8,gate:true}
      ],
      pickups:[{x:506,y:174,kind:'health'},{x:700,y:210,kind:'scrap'},
        {x:940,y:173,kind:'scrap'},{x:1026,y:173,kind:'scrap'},
        {x:1160,y:218,kind:'health'},{x:1400,y:189,kind:'scrap'},{x:1788,y:218,kind:'health'}],
      zones:[
        {x:0,name:'Sorting Row',hint:'Move through the yard. Hold fire to clear the patrol.'},
        {x:324,name:'Conveyor Crossing',hint:'Jump onto the crates. The upper bridge holds a repair kit.'},
        {x:792,name:'Scrap Route',hint:'Climb the optional salvage walk, or continue along the floor.'},
        {x:1072,name:'Repair Station',hint:'Reach the blue beacon to save your progress and repair.'},
        {x:1464,name:'Rail Approach',hint:'The Bastion guards the depot. Its amber charge warns before a shot.'}
      ]
    }
  };
  function deepFreeze(value) { Object.values(value).forEach(v=>{if(v&&typeof v==='object')deepFreeze(v);}); return Object.freeze(value); }
  deepFreeze(configs);
  function segmentRect(x1,y1,x2,y2,r,pad=0) {
    let t0=0,t1=1; const dx=x2-x1,dy=y2-y1;
    for(const [p,q] of [[-dx,x1-r.x+pad],[dx,r.x+r.w+pad-x1],[-dy,y1-r.y+pad],[dy,r.y+r.h+pad-y1]]) {
      if(p===0) { if(q<0)return null; }
      else { const t=q/p; if(p<0){if(t>t1)return null;t0=Math.max(t0,t);}else{if(t<t0)return null;t1=Math.min(t1,t);} }
    }
    return t0;
  }
  const overlaps = (a,b) => a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function create({size='mini',hero='jessie',random=Math.random,level=null}={}) {
    size='mini'; let selectedHero=hero==='jane'?'jane':'jessie';
    const c=level?deepFreeze({...clone(configs.mini),...clone(level)}):configs[size], tiny=size==='mini'; let data,uid=0,previous={jump:false,swap:false},jumpBuffer=0,coyote=0;
    let checkpointReached=false, killed=new Set(),collected=new Set();
    const playerHeight = () => data.player.crouching?c.crouchHeight:c.playerHeight;
    const rectPlayer = () => ({x:data.player.x-c.playerWidth/2,y:data.player.y-playerHeight(),w:c.playerWidth,h:playerHeight()});
    const standingRect = () => ({x:data.player.x-c.playerWidth/2,y:data.player.y-c.playerHeight,w:c.playerWidth,h:c.playerHeight});
    // Feet never move when the collider changes. Solid headroom alone can hold
    // the crouch after Down is released; one-way platforms do not trap the head.
    function updateCrouch(down){
      const p=data.player,wants=!!down&&p.onGround;
      p.crouching=wants||(p.crouching&&solids().some(b=>overlaps(standingRect(),b)));
      if(p.crouching){p.attackTime=0;if(down)jumpBuffer=0;}
    }
    const rectEnemy = e => e.drone ? {x:e.x-c.droneWidth/2,y:e.y-c.droneOffset-c.droneHeight/2,w:c.droneWidth,h:c.droneHeight} : {x:e.x-c.enemyWidth/2,y:e.y-c.enemyHeight,w:c.enemyWidth,h:c.enemyHeight};
    // Discharge sockets come from the same native geometry used by the renderer.
    const solids = () => data.platforms.filter(p=>!p.oneWay);
    const clearRay = (x1,y1,x2,y2) => !solids().some(p=>segmentRect(x1,y1,x2,y2,p)!==null);
    function setState(actor,state) {if(actor.state!==state){actor.state=state;actor.stateTime=0;}}
    function reset({checkpoint=false,hero}={}) {
      if(hero)selectedHero=hero==='jane'?'jane':'jessie';
      const resume=!!(checkpoint&&checkpointReached);
      if(!resume){checkpointReached=false;killed=new Set();collected=new Set();}
      uid=0;previous={jump:false,swap:false};jumpBuffer=0;coyote=.12;
      const spawn=resume?{x:c.checkpoint.x+ (tiny?14:35),y:c.checkpoint.y}:c.spawn;
      data={size,view:{width:c.width,height:c.height},config:c,
        player:{...spawn,vx:0,vy:0,hp:c.maxHp,maxHp:c.maxHp,hero:selectedHero,facing:1,onGround:true,crouching:false,state:'idle',stateTime:0,runTime:0,crouchTime:0,invulnerable:resume?1.4:0,fireCooldown:0,meleeCooldown:0,attackTime:0,hurtTime:0},
        enemies:c.enemies.map((e,i)=>({...e,uid:e.uid||'enemy-'+i,spawnX:e.x,spawnY:e.y,drone:DRONES.has(e.id),maxHp:e.hp,hp:killed.has(e.uid||'enemy-'+i)?0:e.hp,facing:e.facing||-1,state:killed.has(e.uid||'enemy-'+i)?'death':'idle',stateTime:killed.has(e.uid||'enemy-'+i)?2:0,dead:killed.has(e.uid||'enemy-'+i),cooldown:.7+i*.17,mode:'patrol',modeTime:0,aimX:0,aimY:0,shotReleased:false,patrolPhase:random()*Math.PI*2})),
        shots:clone(c.shots||[]),pickups:c.pickups.map((p,i)=>({...p,uid:'pickup-'+i,collected:collected.has('pickup-'+i)})),platforms:clone(c.platforms),
        checkpoint:{...c.checkpoint,active:resume},exit:{...c.exit,open:false},zones:clone(c.zones),time:0,camera:0,paused:false,won:false,dead:false,kills:killed.size,scrap:c.pickups.filter((p,i)=>p.kind==='scrap'&&collected.has('pickup-'+i)).length,
        notice:resume?'Repair station restored. Continue to the rail depot.':'Sorting Row. Reach the rail depot.',noticeTime:3,progress:spawn.x/c.exit.x,zone:clone(c.zones[0]),effects:[]};
      updateCamera(1); return snapshot();
    }
    function damageEnemy(e,amount,impactX,impactY) {
      if(e.dead||e.enabled===false)return;
      if(e.backstab&&(!(data.player.attackTime>0)||(data.player.x-e.x)*e.facing>=0))return;
      e.hp=Math.max(0,e.hp-amount);
      data.effects.push({uid:++uid,x:impactX,y:impactY,kind:'spark',life:.16,maxLife:.16});
      if(e.hp===0){e.dead=true;e.mode='dead';setState(e,'death');data.kills++;killed.add(e.uid);data.notice=e.gate?'Depot lock released. Reach the exit.':e.id==='manta'?'Salvage walk cleared.':'Unit disabled.';data.noticeTime=e.gate?4:1.4;}
      else{e.hurtTime=.15;setState(e,'hurt');}
    }
    function damagePlayer(amount,facing) {
      const p=data.player;if(p.invulnerable>0||data.dead||data.won)return;
      p.hp=Math.max(0,p.hp-amount);p.invulnerable=1.2;p.hurtTime=.22;p.vx=(facing||-p.facing)*(tiny?35:75);if(!p.crouching)setState(p,'hurt');
      data.effects.push({uid:++uid,x:p.x,y:p.y-playerHeight()*.55,kind:'hit',life:.2,maxLife:.2});
      if(p.hp===0){data.dead=true;p.vx=0;p.vy=0;data.notice=data.checkpoint.active?'Suit disabled. Retry from the repair station.':'Suit disabled. Retry Sorting Row.';data.noticeTime=100;}
    }
    function projectile(x,y,vx,vy,hostile,damage=1) {
      data.shots.push({uid:++uid,x,y,previousX:x,previousY:y,vx,vy,hostile,damage,life:hostile?4:c.shotRange/c.shotSpeed,age:0,radius:tiny?1:2});
    }
    function shootPlayer() {
      const p=data.player, sx=p.x+p.facing*(p.crouching?c.crouchMuzzleX:c.muzzleX),sy=p.y-(p.crouching?c.crouchMuzzleY:c.muzzleY);
      // The entire barrel-to-muzzle segment is checked: a long native weapon
      // cannot place a projectile through the far side of a crate.
      if(!clearRay(p.x,sy,sx,sy)){p.fireCooldown=.22;return;}
      let best=null,bestDistance=Infinity;
      for(const e of data.enemies){if(e.dead||e.enabled===false)continue;const r=rectEnemy(e),tx=e.x,ty=r.y+r.h*.5,dx=tx-sx,dy=ty-sy;
        if(dx*p.facing<=0||Math.abs(dx)>c.shotRange||Math.abs(dy)>Math.abs(dx)*.38+ (tiny?4:10)||!clearRay(sx,sy,tx,ty))continue;
        if(Math.hypot(dx,dy)<bestDistance){bestDistance=Math.hypot(dx,dy);best={dx,dy};}}
      const angle=best?Math.atan2(best.dy,Math.abs(best.dx)):0;
      projectile(sx,sy,p.facing*Math.cos(angle)*c.shotSpeed,Math.sin(angle)*c.shotSpeed,false,p.damageMultiplier||1);p.fireCooldown=.22;p.firing=.16;
      if(Number.isFinite(p.ammo))p.ammo=Math.max(0,p.ammo-1);
      if(p.hero==='jessie'){if(!p.burstRemaining)p.burstRemaining=3;p.burstRemaining--;p.fireCooldown=p.burstRemaining?.08:.42;}
      if(p.state==='fire'||p.state==='crouch-fire')p.stateTime=0; // Restart standing recoil; run phase stays continuous.
    }
    function meleePlayer() {
      const p=data.player;p.meleeCooldown=.56;p.attackTime=.44;setState(p,'jab');
      const attack={x:p.facing>0?p.x:p.x-c.meleeReach,y:p.y-c.playerHeight*.87,w:c.meleeReach,h:c.playerHeight*.77};
      for(const e of data.enemies)if(!e.dead&&overlaps(attack,rectEnemy(e))&&clearRay(p.x,p.y-c.muzzleY,e.x,rectEnemy(e).y+rectEnemy(e).h/2))damageEnemy(e,3,e.x,p.y-c.muzzleY);
    }
    function movePlayer(dt,input) {
      const p=data.player,wasOnGround=p.onGround;
      updateCrouch(input.down||input.crouch);
      for(const timer of ['fireCooldown','meleeCooldown','attackTime','hurtTime','invulnerable','firing'])p[timer]=Math.max(0,(p[timer]||0)-dt);
      jumpBuffer=Math.max(0,jumpBuffer-dt);coyote=p.onGround?.12:Math.max(0,coyote-dt);
      let direction=(input.right?1:0)-(input.left?1:0);if(direction)p.facing=direction;
      const target=direction*(p.crouching?c.crouchSpeed:c.speed),change=c.acceleration*dt;p.vx+=clamp(target-p.vx,-change,change);
      if(jumpBuffer>0&&coyote>0&&!p.crouching){p.vy=-c.jumpSpeed;p.onGround=false;jumpBuffer=0;coyote=0;p.jumpTime=0;}
      const oldX=p.x;p.x=clamp(p.x+p.vx*dt,c.playerWidth/2,c.worldWidth-c.playerWidth/2);
      let body=rectPlayer();
      for(const platform of solids())if(overlaps(body,platform)){
        if(oldX+c.playerWidth/2<=platform.x+.01){p.x=platform.x-c.playerWidth/2;p.vx=0;}
        else if(oldX-c.playerWidth/2>=platform.x+platform.w-.01){p.x=platform.x+platform.w+c.playerWidth/2;p.vx=0;}
        body=rectPlayer();
      }
      const oldY=p.y;p.vy=Math.min(c.maxFallSpeed,p.vy+c.gravity*dt);p.y+=p.vy*dt;p.onGround=false;body=rectPlayer();
      for(const platform of data.platforms) {
        if(body.x+body.w<=platform.x||body.x>=platform.x+platform.w)continue;
        if(p.vy>=0&&oldY<=platform.y+.02&&p.y>=platform.y){p.y=platform.y;p.vy=0;p.onGround=true;body=rectPlayer();}
        else if(!platform.oneWay&&p.vy<0&&oldY-playerHeight()>=platform.y+platform.h-.02&&p.y-playerHeight()<=platform.y+platform.h){p.y=platform.y+platform.h+playerHeight();p.vy=0;body=rectPlayer();}
      }
      if(p.y>(c.killY||c.height)+c.playerHeight){damagePlayer(c.maxHp,0);}
      updateCrouch(input.down||input.crouch); // Landing with Down is crouched before projectiles resolve.
      if(input.melee&&!p.crouching&&p.meleeCooldown<=0)meleePlayer();
      if((input.fire||input.autoFire||p.burstRemaining>0)&&p.fireCooldown<=0&&p.attackTime<=0&&(p.ammo===undefined||p.ammo>0))shootPlayer();
      p.runTime+=Math.abs(p.vx)>4?dt:0;
      if(p.crouching&&Math.abs(p.vx)>4)p.crouchTime+=dt;
      // Holding the trigger keeps the weapon braced through the gap between
      // projectiles. A short release tail finishes recoil without arm popping.
      const armed=!!(input.fire||input.autoFire||p.firing>0);
      if(p.crouching)setState(p,Math.abs(p.vx)>4?(armed?'crouch-walk-fire':'crouch-walk'):(armed?'crouch-fire':'crouch-idle'));else if(p.hurtTime>0)setState(p,'hurt');else if(p.attackTime>0)setState(p,'jab');else if(!p.onGround)setState(p,armed?'jump-fire':'jump');else if(Math.abs(p.vx)>4)setState(p,armed?'run-fire':'run');else setState(p,armed?'fire':'idle');
      p.stateTime+=dt;
      if(p.state.startsWith('run'))p.stateTime=p.runTime;
      if(p.state.startsWith('crouch-walk'))p.stateTime=p.crouchTime;
      // A new ledge fall must not reuse the previous jump's completed visual clock.
      if(!p.onGround)p.jumpTime=(wasOnGround?0:(p.jumpTime||0))+dt;
    }
    function updateEnemies(dt) {
      const p=data.player;
      for(const e of data.enemies) {
        if(e.enabled===false)continue;
        if(e.stunned>0){e.stunned-=dt;setState(e,'idle');continue;}
        if(e.dead){e.stateTime=Math.min(2,e.stateTime+dt);continue;}
        e.cooldown=Math.max(0,e.cooldown-dt);e.modeTime+=dt;e.hurtTime=Math.max(0,(e.hurtTime||0)-dt);
        if(e.drone)e.y=e.spawnY+Math.sin(data.time*1.7+e.patrolPhase)*(tiny?2:5);
        const r=rectEnemy(e), ey=e.drone?e.y-c.droneOffset:e.y-c.muzzleY,dx=p.x-e.x,dist=Math.abs(dx),targetY=p.y-c.playerHeight*.6;
        const visible=!c.stealth&&p.x>=c.safeUntilX&&dist<c.enemyRange&&Math.abs(p.y-e.y)<(tiny?75:180)&&clearRay(e.x,ey,p.x,targetY);
        if(e.mode==='charge') {
          // Lock a deliberate shot direction late in the telegraph, then allow
          // the player to move out of that line before discharge.
          if(e.modeTime<.48){e.aimX=p.x;e.aimY=targetY;e.facing=dx<0?-1:1;}
          if(e.modeTime>=.72){e.mode='fire';e.modeTime=0;e.shotReleased=false;setState(e,'fire');}
        } else if(e.mode==='fire') {
          if(!e.shotReleased&&e.modeTime>=.10){e.shotReleased=true;const shotState=e.hurtTime>0?'hurt':'fire',shotTime=(e.state===shotState?e.stateTime:0)+dt,muzzle=enemyArt.muzzle(e.id,{state:shotState,time:shotTime,facing:e.facing,aimAngle:shotState==='fire'?enemyArt.aimAngle(e):0}),sx=Math.round(e.x)+muzzle.x,sy=Math.round(e.y)+muzzle.y;
            if(clearRay(e.x,ey,sx,sy)&&clearRay(sx,sy,e.aimX,e.aimY)){
              const dxShot=e.aimX-sx,dyShot=e.aimY-sy,d=Math.hypot(dxShot,dyShot)||1;projectile(sx,sy,dxShot/d*c.enemyShotSpeed,dyShot/d*c.enemyShotSpeed,true);
            }}
          if(e.modeTime>=.56){e.mode='patrol';e.modeTime=0;e.cooldown=e.gate?1.3:1.9;}
        } else if(e.mode==='melee') {
          if(!e.shotReleased&&e.modeTime>=.30){e.shotReleased=true;
            if(Math.abs(p.x-e.x)<(tiny?25:72)&&Math.abs(p.y-e.y)<c.playerHeight*.7&&clearRay(e.x,ey,p.x,targetY))damagePlayer(1,e.facing);}
          if(e.modeTime>=.68){e.mode='patrol';e.modeTime=0;e.cooldown=1.3;}
        } else {
          if(visible)e.facing=dx<0?-1:1;
          if(visible&&e.cooldown<=0){e.mode=dist<(tiny?20:55)&&!e.drone?'melee':'charge';e.modeTime=0;e.shotReleased=false;e.aimX=p.x;e.aimY=targetY;setState(e,e.mode);}
          else if(dist> (tiny?45:115)||!visible){
            const speed=e.id==='scrapper'?(tiny?18:32):e.drone?(tiny?13:26):(tiny?9:18);
            if(e.x<=e.left)e.patrolDirection=1;if(e.x>=e.right)e.patrolDirection=-1;
            e.patrolDirection=e.patrolDirection||-1;const next=clamp(e.x+e.patrolDirection*speed*dt,e.left,e.right);
            // Arena bounds are authored on one support surface. Ground units
            // remain on that surface and never walk through a solid crate.
            const er=rectEnemy(e);er.x=next-er.w/2;
            if(e.drone||!solids().some(b=>overlaps(er,b))){e.x=next;e.facing=e.patrolDirection;}else e.patrolDirection*=-1;
            setState(e,e.drone?'patrol':'walk');
          }else setState(e,'idle');
        }
        if(e.hurtTime>0)setState(e,'hurt');else if(e.mode==='charge'||e.mode==='fire'||e.mode==='melee')setState(e,e.mode);
        e.stateTime+=e.state==='walk'?dt*(e.id==='scrapper'?18:9)/25:dt;
      }
    }
    function updateShots(dt) {
      for(const shot of data.shots){shot.previousX=shot.x;shot.previousY=shot.y;shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;shot.age+=dt;
        let hit=null,closest=Infinity;
        for(const b of solids()){const t=segmentRect(shot.previousX,shot.previousY,shot.x,shot.y,b,shot.radius);if(t!==null&&t<closest){closest=t;hit={kind:'wall'};}}
        if(shot.hostile){const t=segmentRect(shot.previousX,shot.previousY,shot.x,shot.y,rectPlayer(),shot.radius);if(t!==null&&t<closest){closest=t;hit={kind:'player'};}}
        else for(const e of data.enemies){if(e.dead||e.enabled===false)continue;const t=segmentRect(shot.previousX,shot.previousY,shot.x,shot.y,rectEnemy(e),shot.radius);if(t!==null&&t<closest){closest=t;hit={kind:'enemy',enemy:e};}}
        if(hit){const ix=shot.previousX+(shot.x-shot.previousX)*closest,iy=shot.previousY+(shot.y-shot.previousY)*closest;shot.life=0;
          if(hit.kind==='enemy')damageEnemy(hit.enemy,shot.damage,ix,iy);else if(hit.kind==='player')damagePlayer(shot.damage,Math.sign(shot.vx));else data.effects.push({uid:++uid,x:ix,y:iy,kind:'spark',life:.12,maxLife:.12});}
      }
      data.shots=data.shots.filter(s=>s.life>0&&s.x>=0&&s.x<=c.worldWidth&&s.y>-100&&s.y<(c.killY||c.height)+50);
    }
    function updateWorld(dt) {
      data.effects.forEach(e=>{e.life-=dt;});data.effects=data.effects.filter(e=>e.life>0);
      data.noticeTime=Math.max(0,data.noticeTime-dt);
    }
    function updateCamera(dt) {const target=clamp(data.player.x-c.width*.36,0,c.worldWidth-c.width);data.camera+= (target-data.camera)*Math.min(1,dt*8);}
    function update(dt,input={}) {
      if(data.paused||data.won||data.dead)return snapshot();
      dt=clamp(Number(dt)||0,0,.1);
      if(input.swap&&!previous.swap)setHero(data.player.hero==='jessie'?'jane':'jessie');
      if(input.jump&&!previous.jump)jumpBuffer=.14;
      previous={jump:!!input.jump,swap:!!input.swap};
      let remaining=dt;
      while(remaining>0&&!data.dead&&!data.won){const step=Math.min(1/120,remaining);data.time+=step;movePlayer(step,input);updateEnemies(step);updateShots(step);updateWorld(step);updateCamera(step);remaining-=step;}
      return snapshot();
    }
    function snapshot() {
      const s=clone(data);s.player.hitbox=rectPlayer();s.enemies.forEach(e=>{e.hitbox=rectEnemy(e);});return s;
    }
    function setHero(next) {selectedHero=next==='jane'?'jane':'jessie';if(data.player.hero!==selectedHero)data.player.burstRemaining=0;data.player.hero=selectedHero;return snapshot();}
    function setPaused(paused) {data.paused=!!paused;return snapshot();}
    reset();return {update,snapshot,reset,setHero,setPaused,raw:()=>data,damageEnemy,damagePlayer,clearRay,rectEnemy,rectPlayer,restore(saved){data=clone(saved);previous={};jumpBuffer=0;coyote=.12;return snapshot();}};
  }
  const api={create,configs};if(typeof window!=='undefined')window.EP1Ground=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
