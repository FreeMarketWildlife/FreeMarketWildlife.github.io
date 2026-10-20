import { loadSceneSprites } from './scene-sprites.js';
/** One-bit siege on a quarter-size grid; nature retains the original page grid. */
// The independent battlefield spans the footer on every screen size.
function battleLayout() {
  const pagePixel=parseInt(getComputedStyle(document.body).getPropertyValue('--pixel'),10)||2;
  const pixel=Math.max(pagePixel/4,(innerWidth-32)/960);
  return {pagePixel,pixel,width:Math.floor((innerWidth-32)/pixel)};
}
const stage = document.querySelector('[data-pixel-scene]');
if (stage) {
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 240, height = 94, pixel = 2, time = 0, last = 0, frame;
  let soldiers = [], shots = [], debris = [], nextSpawn = 4, nextShot = 2;
  let castleHP=600, engineHP=120, nextArrow=0, nextDefender=18;
  let hoverPoint = null, victory = false;
  let construction = 0; // Completed only by living attackers at the build site.
  const engineX = 48;
  let deliveredWood=0, attackerCount=0;
  let charges=[],craters=[],blasts=[];
  let dragon=null,nextDragon=42,nextCavalry=48,dragonPasses=0,cavalryCharges=0;
  const roadEnd=()=>castle()+60;
  function craterDepth(x){return craters.reduce((depth,crater)=>Math.max(depth,Math.max(0,Math.floor((1-Math.abs(x-crater.x)/crater.radius)*7))),0);}
  const unitGround=s=>ground()+craterDepth(s.x)-s.lane;
  const wallArchers=[{offset:3,flash:0},{offset:26,flash:0},{offset:47,flash:0}];
  const ground = () => height - 10;
  const castle = () => width - 64;
  const rect = (x,y,w,h,color='#fff') => { ctx.fillStyle=color; ctx.fillRect(Math.round(x),Math.round(y),w,h); };
  function line(x,y,xx,yy) {
    x=Math.round(x); y=Math.round(y); xx=Math.round(xx); yy=Math.round(yy);
    const dx=Math.abs(xx-x),dy=-Math.abs(yy-y),sx=x<xx?1:-1,sy=y<yy?1:-1;let error=dx+dy;
    for (;;) { rect(x,y,1,1); if(x===xx&&y===yy)break; const e=2*error;if(e>=dy){error+=dy;x+=sx;}if(e<=dx){error+=dx;y+=sy;} }
  }
  function resize() {
    const oldCastle=castle();
    ({pixel,width}=battleLayout());
    height=140;
    const shift=castle()-oldCastle;
    for(const unit of soldiers)if(unit.side===-1)unit.x+=shift;
    canvas.width=width;canvas.height=height;canvas.style.width=`${width*pixel}px`;canvas.style.height=`${height*pixel}px`;
    ctx.imageSmoothingEnabled=false;stage.dataset.ready='true';stage.dataset.grid=`${width}x${height}`;draw();
  }
  function burst(x,y) { for(let i=0;i<12;i++)debris.push({x,y,vx:(Math.random()-.5)*35,vy:-Math.random()*30,life:1}); }
  function soldier(s) {
    ctx.save();
    if(s.kind==='giant'){ctx.translate(Math.round(s.x),unitGround(s));ctx.scale(2,2);ctx.translate(-Math.round(s.x),-unitGround(s));}
    if(s.kind==='horse'&&!s.dead){
      const x=Math.round(s.x),y=unitGround(s),stride=Math.sin(time*15+s.seed)*3;
      rect(x-8,y-10,16,6);rect(x-10,y-16,5,9);rect(x-13,y-15,6,3);
      line(x+8,y-9,x+12,y-5);line(x-6,y-4,x-8+stride,y+1);line(x+5,y-4,x+7-stride,y+1);
      rect(x-1,y-20,3,3);rect(x-2,y-17,4,7);line(x-1,y-12,x-5,y-7);
      line(x-2,y-15,x-18,y-20);line(x-18,y-20,x-15,y-21);ctx.restore();return;
    }

    const jump=s.celebrating?Math.round(Math.abs(Math.sin(time*5+s.seed))*7):0;
    const x=Math.round(s.x),y=unitGround(s)-jump, step=Math.floor(time*7+s.seed)%2;
    if(s.celebrating){rect(x-1,y-10,3,3);rect(x-1,y-7,3,4);line(x-1,y-6,x-5,y-11);line(x+1,y-6,x+5,y-11);line(x,y-3,x-2,y);line(x+1,y-3,x+3,y);ctx.restore();return;}
    if(s.dead){line(x-3,y-1,x+4,y-1);rect(x+4,y-3,2,2);ctx.restore();return;}
    rect(x-1,y-10,3,3);rect(x-2,y-7,4,4);rect(x-3,y-10,5,1);
    line(x,y-3,x-2-step,y);line(x+1,y-3,x+2+step,y);
    if(s.planting){
      rect(x-3,y-3,6,2);line(x+1,y-5,x+5,y-2);rect(x+5,y-3,4,3);
    }
    else if(s.carryingWood){
      // A long plank above both hands, with a black grain line.
      rect(x-7,y-15,16,3);rect(x-4,y-14,10,1,'#000');
      line(x-2,y-6,x-4,y-12);line(x+2,y-6,x+5,y-12);
    }
    else if(s.building){
      const hammer=Math.floor(time*4+s.seed)%2;
      line(x+1,y-6,x+5,y-8-hammer*3);rect(x+4,y-10-hammer*3,4,2);
    }
    else if(s.role==='sapper'&&!s.chargeUsed){rect(x-4,y-6,5,5);rect(x-3,y-5,3,2,'#000');line(x-2,y-7,x-1,y-9);}
    else if(s.side===1){rect(x+3,y-7,2,5);line(x-2,y-5,x-5,y-12);}
    else{rect(x-4,y-7,2,5);line(x+2,y-5,x+5,y-11);}
    ctx.restore();
  }
  function draw() {
    ctx.clearRect(0,0,width,height);const g=ground(),c=castle();
    // Broken terrain and a compact crenellated keep.
    for(let x=4;x<roadEnd();x++)line(x,g+craterDepth(x)+1,x+1,g+craterDepth(x+1)+1);
    for(let x=8;x<roadEnd();x+=19)rect(x,g+4+craterDepth(x)+(x%3),3,1);
    if(castleHP>0){
    rect(c,g-36,53,36);rect(c-4,g-45,17,45);rect(c+40,g-45,17,45);
    for(const x of [c-4,c+40])for(let i=0;i<3;i++)rect(x+i*6,g-50,4,5);
    for(let i=0;i<5;i++)rect(c+14+i*5,g-40,3,4);
    for(const x of [c+2,c+46]){rect(x,g-36,3,8,'#000');rect(x,g-20,3,6,'#000');}
    rect(c+21,g-16,12,16,'#000');rect(c+23,g-19,8,3,'#000');
    for(let row=0;row<3;row++)for(let col=0;col<4;col++)rect(c+15+col*6+(row%2)*2,g-29+row*7,3,1,'#000');
    line(c+46,g-50,c+46,g-65);rect(c+47,g-65,12,6);rect(c+55,g-62,4,3,'#000');
    for(let i=0;i<Math.floor((600-castleHP)/35);i++){const x=c+15+(i*11)%25,y=g-34+(i*7)%19;rect(x,y,3,2,'#000');rect(x+2,y+2,2,3,'#000');}
    if(time>=18)for(const archer of wallArchers){
      const x=c+archer.offset,y=g-(archer.offset===26?40:50);
      rect(x,y-9,3,3);rect(x,y-6,2,5);line(x,y-2,x-1,y);line(x+1,y-2,x+3,y);
      // A bow facing the approaching army, plus a visible release pose.
      line(x-4,y-8,x-6,y-5);line(x-6,y-5,x-4,y-2);line(x-4,y-8,x-4,y-2);line(x,y-5,x-4,y-5);
      if(archer.flash>0)line(x-8,y-5,x-3,y-5);
    }
    }else{for(let i=0;i<22;i++)rect(c-4+(i*13)%62,g-1-(i*7)%8,3+(i%4),2+(i%3));}
    // A stepped, two-edged approach leads directly into the gate.
    for(let step=0;step<12;step++){
      const px=c-117+step*12,py=g+3-Math.floor(step/3);
      rect(px,py,12,1);rect(px+2,py+3,9,1);
      if(step%3===0)rect(px,py,1,4);
    }
    // Attackers assemble the base, supports, then the throwing arm in place.
    const tx=engineX,ty=g-2;
    if(construction>0&&engineHP>0){
    rect(tx-13,ty-3,Math.max(2,Math.round(Math.min(1,construction*6)*28)),3);
    rect(tx-10,ty,5,3);if(construction>=.15)rect(tx+7,ty,5,3);
    // Unused wood is stacked beside the worksite.
    for(let plank=0;plank<Math.max(0,deliveredWood-Math.floor(construction*6));plank++)rect(tx+18,ty-plank*3,13,2);
    if(construction>=.3)line(tx-9,ty-3,tx,ty-24);
    if(construction>=.45)line(tx+10,ty-3,tx,ty-24);
    if(construction>=.6){line(tx-5,ty-14,tx+5,ty-14);line(tx-9,ty-3,tx+5,ty-14);}
    if(construction>=.75){
    const angle=construction<1?-.9:Math.sin((time%12)/12*Math.PI*2)*.9-.6;
    const ax=tx+Math.cos(angle)*21,ay=ty-22+Math.sin(angle)*21;
    line(tx-Math.cos(angle)*9,ty-22-Math.sin(angle)*9,ax,ay);
    if(construction>=.9){rect(tx-Math.cos(angle)*9-3,ty-22-Math.sin(angle)*9,6,6);line(ax,ay,ax+3,ay+7);}
    }
    if(engineHP<90)rect(tx-6,ty-9,3,2,'#000');
    if(engineHP<45)rect(tx+2,ty-16,3,3,'#000');
    }else if(construction>0){line(engineX-15,g,engineX+11,g-3);line(engineX-12,g-5,engineX+5,g);rect(engineX-9,g-2,5,2);}
    soldiers.forEach(soldier);
    for(const shot of shots){const p=shot.age/shot.duration;const x=shot.start+(shot.end-shot.start)*p,y=shot.y+(shot.targetY-shot.y)*p-Math.sin(p*Math.PI)*shot.arc;if(shot.arrow)line(x,y,x+4,y+1);else rect(x,y,3,3);}
    for(const charge of charges){
      rect(charge.x-2,g-4,5,4);rect(charge.x-1,g-3,3,2,'#000');line(charge.x+1,g-5,charge.x+4,g-8);
      if(Math.floor(time*7)%2)rect(charge.x+4,g-9,1,1);
    }
    for(const blast of blasts){
      const radius=Math.round(3+blast.age*35);
      for(let ray=0;ray<8;ray++){const a=ray*Math.PI/4;line(blast.x+Math.cos(a)*radius*.6,g-3+Math.sin(a)*radius*.6,blast.x+Math.cos(a)*radius,g-3+Math.sin(a)*radius);}
    }
    for(const d of debris)rect(d.x,d.y,1,1);
    drawDragon();
    drawHealthBar();
  }
  // One-bit silhouette: swept wings, long tail, horns, and a visible fire cone.
  function drawDragon() {
    if(!dragon)return;
    const {x,y,age}=dragon,flap=Math.sin(age*7)*13;
    rect(x-13,y-3,28,7);rect(x+10,y-8,7,9);rect(x+15,y-7,10,5);
    rect(x+18,y-6,2,1,'#000');line(x+12,y-8,x+10,y-13);line(x+16,y-8,x+17,y-12);
    line(x-13,y,x-29,y-7);line(x-29,y-7,x-39,y-5);
    for(const sign of [-1,1]){
      const tip=x-16,wy=y-25-flap;
      line(x,y,tip,wy);line(tip,wy,x+sign*22,y-10);
      line(x+sign*22,y-10,x-4,y+2);line(tip,wy,x-4,y-6);
    }
    line(x-5,y+4,x-9,y+10);line(x+8,y+4,x+4,y+10);
    if(dragon.breathing)for(let ray=0;ray<7;ray++){
      const reach=24+ray*5+Math.sin(time*24+ray)*4;
      line(x+24,y-3,x+24+reach,ground()-38+ray*3);
      rect(x+24+reach,ground()-38+ray*3,3,2);
    }
  }
  function summonCavalry() {
    if(castleHP<=0||victory)return;
    cavalryCharges++;
    for(let i=0;i<5;i++)soldiers.push({x:castle()+20+i*6,side:-1,kind:'horse',role:'cavalry',hp:180,power:45,lane:(i%3)*3,seed:i,dead:0});
  }
  function updateUltimates(dt) {
    if(!victory&&castleHP>0&&time>=nextDragon&&!dragon){
      dragon={x:-50,y:45,age:0,breathing:false,damageDone:false};dragonPasses++;nextDragon=time+90;
    }
    if(castleHP>0&&!victory&&time>=nextCavalry){summonCavalry();nextCavalry=time+90;}
    if(!dragon)return;
    dragon.age+=dt;
    const target=castle()-60,approach=Math.min(1,dragon.age/7);
    dragon.x=dragon.age<7?-50+(target+50)*approach:target+(dragon.age>11?(dragon.age-11)*100:0);
    dragon.y=45+Math.sin(dragon.age*2)*3;
    dragon.breathing=castleHP>0&&!victory&&dragon.age>=7&&dragon.age<11;
    if(dragon.breathing&&!dragon.damageDone){
      dragon.damageDone=true;hurtCastle(90);burst(castle()+15,ground()-35);
      for(const unit of soldiers)if(unit.side===-1&&!unit.dead&&unit.x>castle()-130){unit.hp-=60;if(unit.hp<=0)unit.dead=2;}
    }
    if(dragon.age>=16)dragon=null;
  }
  function hoveredHealth() {
    if(!hoverPoint)return null;
    const {x,y}=hoverPoint,g=ground();
    const unit=soldiers.filter(s=>!s.dead&&Math.abs(s.x-x)<(s.kind==='giant'?16:10)&&Math.abs(unitGround(s)-5-y)<16).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];
    if(unit)return {x:unit.x,y:unitGround(unit)-(unit.kind==='giant'?34:22),hp:unit.hp,max:unit.kind==='foot'?25:180};
    if(x>castle()-8&&x<castle()+60&&y>g-65)return {x:castle()+26,y:g-75,hp:castleHP,max:600};
    const tx=engineX;
    if(construction>0&&x>tx-25&&x<tx+28&&y>g-47)return {x:tx,y:g-55,hp:engineHP,max:120};
    return null;
  }
  function drawHealthBar() {
    const target=hoveredHealth();if(!target)return;
    const w=30,h=6,x=Math.max(1,Math.min(width-w-1,Math.round(target.x-w/2))),y=Math.max(1,Math.round(target.y));
    rect(x-1,y-1,w+2,h+2,'#000');
    rect(x,y,w,h);rect(x+1,y+1,w-2,h-2,'#000');
    const filled=Math.round((w-4)*Math.max(0,Math.min(1,target.hp/target.max)));
    if(filled)rect(x+2,y+2,filled,h-4);
  }
  canvas.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return;
    const bounds=canvas.getBoundingClientRect();
    hoverPoint={x:(event.clientX-bounds.left)/pixel,y:(event.clientY-bounds.top)/pixel};draw();
  });
  canvas.addEventListener('pointerleave',()=>{hoverPoint=null;draw();});
  function update(dt) {
    time+=dt;
    updateUltimates(dt);
    if(!victory&&time>nextSpawn){nextSpawn=time+8+Math.random()*7;spawn(1);}
    if(castleHP>0&&time>nextDefender){nextDefender=time+11+Math.random()*7;spawn(-1);}
    for(const archer of wallArchers)archer.flash=Math.max(0,archer.flash-dt);
    for(const s of soldiers){
      if(s.dead){s.dead-=dt;continue;}
      if(s.celebrating)continue;
      if(s.side===1&&!victory&&engineHP>0&&construction<1){
        if(s.fetchingWood){
          s.x-=dt*9;
          if(s.x<=-5){s.fetchingWood=false;s.carryingWood=true;}
          continue;
        }
        if(s.x>=engineX-12&&s.x<=engineX+10){
          if(s.carryingWood){deliveredWood=Math.min(6,deliveredWood+1);s.carryingWood=false;}
          const available=deliveredWood/6;
          s.building=construction<available;
          if(s.building){construction=Math.min(1,available,construction+dt/20);continue;}
          if(construction<1){s.building=false;s.fetchingWood=true;continue;}
        }
      }
      s.building=false;
      if(construction>=1||engineHP<=0){s.carryingWood=false;s.fetchingWood=false;}
      // Sappers place one charge, light the fuse, then run clear of the blast.
      if(s.side===1&&s.role==='sapper'&&!s.chargeUsed&&!victory&&s.x>=s.chargeSite){
        s.planting=true;s.plantTime=(s.plantTime||0)+dt;
        if(s.plantTime>=2.5){charges.push({x:s.x,fuse:4});s.chargeUsed=true;s.planting=false;s.retreat=4;}
        continue;
      }
      if(s.retreat>0){s.retreat-=dt;s.x-=dt*12;continue;}
      if(victory&&s.side===-1){s.x-=dt*8;continue;}
      if(s.side===1&&castleHP===0&&s.x>=castle()-8){
        victory=true;s.x=castle()+Math.min(45,soldiers.filter(unit=>unit.celebrating).length*9);s.celebrating=true;continue;
      }
      s.cooldown=Math.max(0,(s.cooldown||0)-dt);
      const enemy=soldiers.find(e=>!e.dead&&e.side!==s.side&&Math.abs(e.x-s.x)<(s.kind==='giant'?15:9));
      if(enemy){if(!s.cooldown){enemy.hp-=s.power;s.cooldown=1.2;if(enemy.hp<=0){enemy.dead=2;burst(enemy.x,ground()-5);}}}
      else if(s.side===1&&s.x>=castle()-8&&castleHP>0){if(!s.cooldown){hurtCastle(s.power);s.cooldown=1.8;}}
      else if(s.side===-1&&s.x<=54&&engineHP>0){if(!s.cooldown){engineHP=Math.max(0,engineHP-s.power);s.cooldown=1.8;}}
      else s.x+=s.side*dt*(s.kind==='horse'?18:4);
    }
    soldiers=soldiers.filter(s=>s.dead>=0&&s.x>-20&&s.x<width+20);
    if(time>nextShot&&construction===1&&engineHP>0&&!victory){
      // Defenders outside the keep take priority over the masonry itself.
      const target=soldiers.filter(unit=>unit.side===-1&&!unit.dead&&unit.x>engineX+28&&unit.x<castle()+12).sort((a,b)=>b.x-a.x)[0];
      if(target||castleHP>0){
      nextShot=time+12;
      const end=target?target.x:castle()+26;
      shots.push({age:0,start:engineX+6,end,y:ground()-27,targetY:target?unitGround(target)-5:ground()-27,duration:3.5,arc:48,target,stone:true});
      }
    }
    if(time>=18&&time>nextArrow&&castleHP>0){
      nextArrow=time+2.5;
      const targets=soldiers.filter(s=>s.side===1&&!s.dead&&s.x>castle()-240).sort((a,b)=>b.x-a.x);
      if(targets.length)wallArchers.forEach((archer,index)=>{
        const target=targets[index%targets.length];archer.flash=.4;
        shots.push({age:0,start:castle()+archer.offset,end:target.x,y:ground()-(archer.offset===26?45:55),targetY:ground()-target.lane-6,duration:1.5,arc:12,arrow:true,target});
      });
    }
    for(const shot of shots){
      shot.age+=dt;
      if(shot.age>=shot.duration){
        if(shot.target){
          if(!shot.target.dead){shot.target.hp-=shot.arrow?10:45;if(shot.target.hp<=0)shot.target.dead=2;}
        }else hurtCastle(8);
        burst(shot.end,shot.targetY);
      }
    }
    shots=shots.filter(s=>s.age<s.duration);
    for(const charge of charges){
      charge.fuse-=dt;
      if(charge.fuse<=0){
        craters.push({x:charge.x,radius:17});if(craters.length>12)craters.shift();
        blasts.push({x:charge.x,age:0});burst(charge.x,ground());burst(charge.x,ground()-3);
        for(const unit of soldiers)if(!unit.dead&&Math.abs(unit.x-charge.x)<24){unit.hp-=35;if(unit.hp<=0)unit.dead=2;}
      }
    }
    charges=charges.filter(charge=>charge.fuse>0);
    blasts.forEach(blast=>blast.age+=dt);blasts=blasts.filter(blast=>blast.age<.6);
    for(const d of debris){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=65*dt;d.life-=dt;}debris=debris.filter(d=>d.life>0);

  }
  function tick(now){frame=0;if(document.hidden||reduced.matches)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;update(dt);draw();frame=requestAnimationFrame(tick);}
  function resume(){cancelAnimationFrame(frame);last=0;if(!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);else draw();}
  function hurtCastle(amount){if(castleHP<=0)return;castleHP=Math.max(0,castleHP-amount);if(!castleHP)burst(castle()+26,ground()-22);}
  function spawn(side){
    const rare=side===1&&Math.random()<.01,kind=rare?'giant':'foot';
    if(side===1)attackerCount++;
    const role=side===1&&!rare&&attackerCount%4===0?'sapper':'soldier';
    soldiers.push({x:side===1?-5:castle()+26,side,kind,role,carryingWood:side===1&&construction<1&&engineHP>0,
      chargeSite:engineX+95+Math.random()*Math.max(1,castle()-engineX-220),hp:rare?180:25,power:rare?45:5,lane:Math.floor(Math.random()*3)*3,seed:Math.random()*10,dead:0});
  }
  canvas.addEventListener('pointerdown',event=>{
    const bounds=canvas.getBoundingClientRect(),x=(event.clientX-bounds.left)/pixel,y=(event.clientY-bounds.top)/pixel;
    const target=soldiers.filter(s=>!s.dead&&Math.abs(s.x-x)<(s.kind==='giant'?16:10)&&Math.abs(unitGround(s)-5-y)<16).sort((a,b)=>Math.abs(a.x-x)-Math.abs(b.x-x))[0];
    if(target){target.dead=2;burst(target.x,ground()-5);}
    else if(x>castle()-8&&x<castle()+60&&y>ground()-65){hurtCastle(35);burst(x,y);}
    else if(construction>0&&x>engineX-25&&x<engineX+28&&y>ground()-47){engineHP=Math.max(0,engineHP-25);burst(x,y);}
    draw();
  });
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);new ResizeObserver(resize).observe(document.body);
  resize();resume();
}

const nature=document.querySelector('[data-nature-scene]');
if(nature){
  const ctx=nature.getContext('2d'), reduced=matchMedia('(prefers-reduced-motion: reduce)');let sprites,last=0,t=0,frame;
  function render(){
    if(!sprites)return;
    const w=263,h=168;
    if(nature.width!==w||nature.height!==h){nature.width=w;nature.height=h;}
    ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,w,h);
    const x=0,y=0;
    ctx.drawImage(sprites.landscape,x,y);
    // Body and feet never leave their perch. Only the head turns/bobs.
    const bx=x+75,by=y+94;
    // Copy the body separately so a transparent head mask cannot erase scenery.
    ctx.drawImage(sprites.bird,0,4,18,12,bx,by+4,18,12);
    const headTurn=!reduced.matches&&Math.floor(t/3)%3===1;
    const headBob=!reduced.matches&&Math.floor(t*2)%12===1?1:0;
    if(headTurn){ctx.save();ctx.translate(bx+7,by+headBob);ctx.scale(-1,1);ctx.drawImage(sprites.bird,0,0,7,4,0,0,7,4);ctx.restore();}
    else ctx.drawImage(sprites.bird,0,0,7,4,bx,by+headBob,7,4);
  }
  function tick(now){if(document.hidden||reduced.matches)return;t+=last?Math.min((now-last)/1000,.05):0;last=now;render();frame=requestAnimationFrame(tick);}
  function resume(){cancelAnimationFrame(frame);last=0;render();if(!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
  loadSceneSprites().then(result=>{sprites=result;resume();});new ResizeObserver(render).observe(document.body);document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
}

// Back/forward cache must start a fresh visit, just like a normal page load.
addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
