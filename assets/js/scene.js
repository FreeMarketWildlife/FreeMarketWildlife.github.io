import { loadSceneSprites } from './scene-sprites.js';
/** One-bit siege on a quarter-size grid; nature retains the original page grid. */
const stage = document.querySelector('[data-pixel-scene]');
if (stage) {
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 240, height = 94, pixel = 2, time = 0, last = 0, frame;
  let soldiers = [], shots = [], debris = [], nextSpawn = 0, nextShot = 2;
  let castleHP=600, engineHP=120, nextArrow=0, nextDefender=5;
  const ground = () => height - 10;
  const castle = () => width - 64;
  const rect = (x,y,w,h,color='#fff') => { ctx.fillStyle=color; ctx.fillRect(Math.round(x),Math.round(y),w,h); };
  function line(x,y,xx,yy) {
    x=Math.round(x); y=Math.round(y); xx=Math.round(xx); yy=Math.round(yy);
    const dx=Math.abs(xx-x),dy=-Math.abs(yy-y),sx=x<xx?1:-1,sy=y<yy?1:-1;let error=dx+dy;
    for (;;) { rect(x,y,1,1); if(x===xx&&y===yy)break; const e=2*error;if(e>=dy){error+=dy;x+=sx;}if(e<=dx){error+=dx;y+=sy;} }
  }
  function resize() {
    pixel=(parseInt(getComputedStyle(document.body).getPropertyValue('--pixel'),10)||2)/4;
    width=Math.floor(Math.min(innerWidth-32,innerWidth*(innerWidth<681?.9:.38))/pixel);
    height=100;
    canvas.width=width;canvas.height=height;canvas.style.width=`${width*pixel}px`;canvas.style.height=`${height*pixel}px`;
    ctx.imageSmoothingEnabled=false;stage.dataset.ready='true';stage.dataset.grid=`${width}x${height}`;draw();
  }
  function burst(x,y) { for(let i=0;i<12;i++)debris.push({x,y,vx:(Math.random()-.5)*35,vy:-Math.random()*30,life:1}); }
  function soldier(s) {
    ctx.save();
    if(s.kind==='giant'){ctx.translate(Math.round(s.x),ground()-s.lane);ctx.scale(2,2);ctx.translate(-Math.round(s.x),-ground()+s.lane);}
    if(s.kind==='horse'&&!s.dead){const y=ground()-s.lane;rect(s.x-7,y-8,13,5);rect(s.x-9,y-12,4,6);line(s.x-6,y-3,s.x-8,y+2);line(s.x+5,y-3,s.x+7,y+2);}

    const x=Math.round(s.x),y=ground()-s.lane, step=Math.floor(time*7+s.seed)%2;
    if(s.dead){line(x-3,y-1,x+4,y-1);rect(x+4,y-3,2,2);ctx.restore();return;}
    rect(x-1,y-10,3,3);rect(x-2,y-7,4,4);rect(x-3,y-10,5,1);
    line(x,y-3,x-2-step,y);line(x+1,y-3,x+2+step,y);
    if(s.side===1){rect(x+3,y-7,2,5);line(x-2,y-5,x-5,y-12);}
    else{rect(x-4,y-7,2,5);line(x+2,y-5,x+5,y-11);}
    ctx.restore();
  }
  function draw() {
    ctx.clearRect(0,0,width,height);const g=ground(),c=castle();
    // Broken terrain and a compact crenellated keep.
    line(4,g+1,width-5,g+1);for(let x=8;x<width-8;x+=19)rect(x,g+4+(x%3),3,1);
    if(castleHP>0){
    rect(c,g-36,53,36);rect(c-4,g-45,17,45);rect(c+40,g-45,17,45);
    for(const x of [c-4,c+40])for(let i=0;i<3;i++)rect(x+i*6,g-50,4,5);
    for(let i=0;i<5;i++)rect(c+14+i*5,g-40,3,4);
    for(const x of [c+2,c+46]){rect(x,g-36,3,8,'#000');rect(x,g-20,3,6,'#000');}
    rect(c+21,g-16,12,16,'#000');rect(c+23,g-19,8,3,'#000');
    for(let row=0;row<3;row++)for(let col=0;col<4;col++)rect(c+15+col*6+(row%2)*2,g-29+row*7,3,1,'#000');
    line(c+46,g-50,c+46,g-65);rect(c+47,g-65,12,6);rect(c+55,g-62,4,3,'#000');
    for(let i=0;i<Math.floor((600-castleHP)/35);i++){const x=c+15+(i*11)%25,y=g-34+(i*7)%19;rect(x,y,3,2,'#000');rect(x+2,y+2,2,3,'#000');}
    for(const x of [c+3,c+47]){rect(x,g-58,3,3);rect(x,g-55,2,5);line(x-2,g-54,x-5,g-50);line(x-5,g-50,x-5,g-57);}
    }else{for(let i=0;i<22;i++)rect(c-4+(i*13)%62,g-1-(i*7)%8,3+(i%4),2+(i%3));}
    // Trebuchet rolls in, then periodically winds and releases its throwing arm.
    const tx=Math.min(37,-20+time*7),ty=g-2;
    if(engineHP>0){
    rect(tx-13,ty-3,28,3);rect(tx-10,ty,5,3);rect(tx+7,ty,5,3);
    line(tx-9,ty-3,tx,ty-24);line(tx+10,ty-3,tx,ty-24);line(tx-5,ty-14,tx+5,ty-14);
    const angle=time<7?-.9:Math.sin((time%4)/4*Math.PI*2)*.9-.6;
    const ax=tx+Math.cos(angle)*21,ay=ty-22+Math.sin(angle)*21;
    line(tx-Math.cos(angle)*9,ty-22-Math.sin(angle)*9,ax,ay);
    rect(tx-Math.cos(angle)*9-3,ty-22-Math.sin(angle)*9,6,6);line(ax,ay,ax+3,ay+7);
    if(engineHP<90)rect(tx-6,ty-9,3,2,'#000');
    if(engineHP<45)rect(tx+2,ty-16,3,3,'#000');
    }else{line(22,g,48,g-3);line(25,g-5,42,g);rect(28,g-2,5,2);}
    soldiers.forEach(soldier);
    for(const shot of shots){const p=shot.age/shot.duration;const x=shot.start+(shot.end-shot.start)*p,y=shot.y+(shot.targetY-shot.y)*p-Math.sin(p*Math.PI)*shot.arc;if(shot.arrow)line(x,y,x+4,y+1);else rect(x,y,3,3);}
    for(const d of debris)rect(d.x,d.y,1,1);
  }
  function update(dt) {
    time+=dt;
    if(time>nextSpawn){nextSpawn=time+8+Math.random()*7;spawn(1);}
    if(castleHP>0&&time>nextDefender){nextDefender=time+11+Math.random()*7;spawn(-1);}
    for(const s of soldiers){
      if(s.dead){s.dead-=dt;continue;}
      s.cooldown=Math.max(0,(s.cooldown||0)-dt);
      const enemy=soldiers.find(e=>!e.dead&&e.side!==s.side&&Math.abs(e.x-s.x)<(s.kind==='giant'?15:9));
      if(enemy){if(!s.cooldown){enemy.hp-=s.power;s.cooldown=1.2;if(enemy.hp<=0){enemy.dead=2;burst(enemy.x,ground()-5);}}}
      else if(s.side===1&&s.x>=castle()-8&&castleHP>0){if(!s.cooldown){hurtCastle(s.power);s.cooldown=1.8;}}
      else if(s.side===-1&&s.x<=54&&engineHP>0){if(!s.cooldown){engineHP=Math.max(0,engineHP-s.power);s.cooldown=1.8;}}
      else s.x+=s.side*dt*(s.kind==='horse'?18:4);
    }
    soldiers=soldiers.filter(s=>s.dead>=0&&s.x>-20&&s.x<width+20);
    if(time>nextShot&&time>7&&engineHP>0&&castleHP>0){nextShot=time+12;shots.push({age:0,start:43,end:castle()+26,y:ground()-27,targetY:ground()-27,duration:3.5,arc:48});}
    if(time>nextArrow&&castleHP>0){nextArrow=time+3;const target=soldiers.find(s=>s.side===1&&!s.dead&&s.x>castle()-180);if(target)for(const offset of [3,47])shots.push({age:0,start:castle()+offset,end:target.x,y:ground()-56,targetY:ground()-6,duration:1.5,arc:12,arrow:true,target});}
    for(const shot of shots){shot.age+=dt;if(shot.age>=shot.duration){if(shot.arrow){if(!shot.target.dead){shot.target.hp-=10;if(shot.target.hp<=0)shot.target.dead=2;}}else hurtCastle(8);burst(shot.end,shot.targetY);}}
    shots=shots.filter(s=>s.age<s.duration);
    for(const d of debris){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=65*dt;d.life-=dt;}debris=debris.filter(d=>d.life>0);

  }
  function tick(now){frame=0;if(document.hidden||reduced.matches)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;update(dt);draw();frame=requestAnimationFrame(tick);}
  function resume(){cancelAnimationFrame(frame);last=0;if(!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);else draw();}
  function hurtCastle(amount){if(castleHP<=0)return;castleHP=Math.max(0,castleHP-amount);if(!castleHP)burst(castle()+26,ground()-22);}
  function spawn(side){const rare=Math.random()<.01,kind=rare?(side===1?'giant':'horse'):'foot';soldiers.push({x:side===1?-5:castle()+26,side,kind,hp:rare?180:25,power:rare?45:5,lane:Math.floor(Math.random()*3)*3,seed:Math.random()*10,dead:0});}
  canvas.addEventListener('pointerdown',event=>{
    const bounds=canvas.getBoundingClientRect(),x=(event.clientX-bounds.left)/pixel,y=(event.clientY-bounds.top)/pixel;
    const target=soldiers.filter(s=>!s.dead&&Math.abs(s.x-x)<(s.kind==='giant'?16:10)&&Math.abs(ground()-s.lane-5-y)<16).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];
    if(target){target.dead=2;burst(target.x,ground()-5);}
    else if(x>castle()-8&&x<castle()+60&&y>ground()-65){hurtCastle(35);burst(x,y);}
    else if(x>12&&x<65&&y>ground()-47){engineHP=Math.max(0,engineHP-25);burst(x,y);}
    draw();
  });
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);new ResizeObserver(resize).observe(document.body);
  spawn(1);spawn(-1);resize();resume();
}

const nature=document.querySelector('[data-nature-scene]');
if(nature){
  const ctx=nature.getContext('2d'), reduced=matchMedia('(prefers-reduced-motion: reduce)');let sprites,last=0,t=0,frame;
  function render(){
    if(!sprites)return;const p=parseInt(getComputedStyle(document.body).getPropertyValue('--pixel'),10)||2;
    const w=Math.ceil(innerWidth/p),h=Math.ceil(innerHeight/p);if(nature.width!==w||nature.height!==h){nature.width=w;nature.height=h;}
    nature.style.width=`${w*p}px`;nature.style.height=`${h*p}px`;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,w,h);
    const x=w-263+(innerWidth<681?30:0),y=h-168;
    ctx.drawImage(sprites.landscape,x,y);
    const cycle=t%28,fly=cycle>6&&cycle<23;
    const bx=fly?x+75-(cycle-6)*18:x+75,by=fly?y+94-Math.sin((cycle-6)/17*Math.PI)*60:y+94;
    ctx.drawImage(sprites.bird,Math.round(bx),Math.round(by));
    if(fly){ctx.fillStyle='#000';ctx.fillRect(Math.round(bx+6),Math.round(by+4),8,6);ctx.fillStyle='#fff';const flap=Math.floor(t*7)%2;ctx.fillRect(Math.round(bx+7),Math.round(by+(flap?-3:6)),3,7);}
  }
  function tick(now){if(document.hidden||reduced.matches)return;t+=last?Math.min((now-last)/1000,.05):0;last=now;render();frame=requestAnimationFrame(tick);}
  function resume(){cancelAnimationFrame(frame);last=0;render();if(!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
  loadSceneSprites().then(result=>{sprites=result;resume();});new ResizeObserver(render).observe(document.body);document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
}

// Back/forward cache must start a fresh visit, just like a normal page load.
addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
