/** A tiny one-bit siege. Coordinates and drawing stay on the shared pixel grid. */
const stage = document.querySelector('[data-pixel-scene]');
if (stage) {
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 240, height = 94, pixel = 2, time = 0, last = 0, frame;
  let soldiers = [], shots = [], debris = [], nextSpawn = 0, nextShot = 2, damage = 0;
  const ground = () => height - 10;
  const castle = () => width - 64;
  const rect = (x,y,w,h,color='#fff') => { ctx.fillStyle=color; ctx.fillRect(Math.round(x),Math.round(y),w,h); };
  function line(x,y,xx,yy) {
    x=Math.round(x); y=Math.round(y); xx=Math.round(xx); yy=Math.round(yy);
    const dx=Math.abs(xx-x),dy=-Math.abs(yy-y),sx=x<xx?1:-1,sy=y<yy?1:-1;let error=dx+dy;
    for (;;) { rect(x,y,1,1); if(x===xx&&y===yy)break; const e=2*error;if(e>=dy){error+=dy;x+=sx;}if(e<=dx){error+=dx;y+=sy;} }
  }
  function resize() {
    pixel=parseInt(getComputedStyle(document.body).getPropertyValue('--pixel'),10)||2;
    width=Math.min(250,Math.floor((innerWidth-32)/pixel));
    height=Math.min(94,Math.max(48,Math.floor((innerHeight-document.querySelector('.landing-nav').getBoundingClientRect().bottom-24)/pixel)));
    canvas.width=width;canvas.height=height;canvas.style.width=`${width*pixel}px`;canvas.style.height=`${height*pixel}px`;
    ctx.imageSmoothingEnabled=false;stage.dataset.ready='true';stage.dataset.grid=`${width}x${height}`;draw();
  }
  function burst(x,y) { for(let i=0;i<12;i++)debris.push({x,y,vx:(Math.random()-.5)*35,vy:-Math.random()*30,life:1}); }
  function soldier(s) {
    const x=Math.round(s.x),y=ground()-s.lane, step=Math.floor(time*7+s.seed)%2;
    if(s.dead){line(x-3,y-1,x+4,y-1);rect(x+4,y-3,2,2);return;}
    rect(x-1,y-10,3,3);rect(x-2,y-7,4,4);rect(x-3,y-10,5,1);
    line(x,y-3,x-2-step,y);line(x+1,y-3,x+2+step,y);
    if(s.side===1){rect(x+3,y-7,2,5);line(x-2,y-5,x-5,y-12);}
    else{rect(x-4,y-7,2,5);line(x+2,y-5,x+5,y-11);}
  }
  function draw() {
    ctx.clearRect(0,0,width,height);const g=ground(),c=castle();
    // Broken terrain and a compact crenellated keep.
    line(4,g+1,width-5,g+1);for(let x=8;x<width-8;x+=19)rect(x,g+4+(x%3),3,1);
    rect(c,g-36,53,36);rect(c-4,g-45,17,45);rect(c+40,g-45,17,45);
    for(const x of [c-4,c+40])for(let i=0;i<3;i++)rect(x+i*6,g-50,4,5);
    for(let i=0;i<5;i++)rect(c+14+i*5,g-40,3,4);
    for(const x of [c+2,c+46]){rect(x,g-36,3,8,'#000');rect(x,g-20,3,6,'#000');}
    rect(c+21,g-16,12,16,'#000');rect(c+23,g-19,8,3,'#000');
    for(let row=0;row<3;row++)for(let col=0;col<4;col++)rect(c+15+col*6+(row%2)*2,g-29+row*7,3,1,'#000');
    line(c+46,g-50,c+46,g-65);rect(c+47,g-65,12,6);rect(c+55,g-62,4,3,'#000');
    for(let i=0;i<damage;i++){const x=c+15+(i*11)%25,y=g-34+(i*7)%19;rect(x,y,3,2,'#000');rect(x+2,y+2,2,3,'#000');}
    // Trebuchet rolls in, then periodically winds and releases its throwing arm.
    const tx=Math.min(37,-20+time*7),ty=g-2;
    rect(tx-13,ty-3,28,3);rect(tx-10,ty,5,3);rect(tx+7,ty,5,3);
    line(tx-9,ty-3,tx,ty-24);line(tx+10,ty-3,tx,ty-24);line(tx-5,ty-14,tx+5,ty-14);
    const angle=time<7?-.9:Math.sin((time%4)/4*Math.PI*2)*.9-.6;
    const ax=tx+Math.cos(angle)*21,ay=ty-22+Math.sin(angle)*21;
    line(tx-Math.cos(angle)*9,ty-22-Math.sin(angle)*9,ax,ay);
    rect(tx-Math.cos(angle)*9-3,ty-22-Math.sin(angle)*9,6,6);line(ax,ay,ax+3,ay+7);
    soldiers.forEach(soldier);
    for(const shot of shots){const p=shot.age/2.1;rect(shot.start+(shot.end-shot.start)*p,g-27- Math.sin(p*Math.PI)*48,3,3);}
    for(const d of debris)rect(d.x,d.y,1,1);
  }
  function update(dt) {
    time+=dt;
    if(time>nextSpawn){nextSpawn=time+.85;const side=Math.random()<.65?1:-1;soldiers.push({x:side===1?-5:castle()+26,side,lane:Math.floor(Math.random()*3)*3,seed:Math.random()*10,dead:0});}
    for(const s of soldiers){if(s.dead){s.dead-=dt;continue;}s.x+=s.side*dt*9;const enemy=soldiers.find(e=>!e.dead&&e.side!==s.side&&Math.abs(e.x-s.x)<7);if(enemy&&Math.random()<dt*1.8){s.dead=2;burst(s.x,ground()-5);}if(s.x>castle()+12&&s.side===1)s.dead=2;}
    soldiers=soldiers.filter(s=>s.dead>=0&&s.x>-15&&s.x<width+10);
    if(time>nextShot&&time>7){nextShot=time+4;shots.push({age:0,start:43,end:castle()+20+Math.random()*20});}
    for(const shot of shots){shot.age+=dt;if(shot.age>=2.1){burst(shot.end,ground()-27);damage=(damage+1)%12;}}
    shots=shots.filter(s=>s.age<2.1);
    for(const d of debris){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=65*dt;d.life-=dt;}debris=debris.filter(d=>d.life>0);
    if(time>90){time=7;nextShot=8;nextSpawn=7;damage=0;}
  }
  function tick(now){frame=0;if(document.hidden||reduced.matches)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;update(dt);draw();frame=requestAnimationFrame(tick);}
  function resume(){cancelAnimationFrame(frame);last=0;if(!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);else draw();}
  canvas.addEventListener('pointerdown',event=>{const bounds=canvas.getBoundingClientRect(),x=(event.clientX-bounds.left)/pixel,y=(event.clientY-bounds.top)/pixel;const target=soldiers.filter(s=>!s.dead&&Math.abs(s.x-x)<8&&Math.abs(ground()-s.lane-5-y)<9).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];if(target){target.dead=2;burst(target.x,ground()-5);draw();}});
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);new ResizeObserver(resize).observe(document.body);
  soldiers=[{x:75,side:1,lane:0,seed:0,dead:0},{x:126,side:-1,lane:3,seed:1,dead:0}];resize();resume();
}
