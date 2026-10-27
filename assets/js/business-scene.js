// Circle physics in CSS pixels; the scenery is drawn at a small native pixel scale.
export function stepBodies(bodies,width,height,dt,field=null){
 let collisions=0;
 const constrain=b=>{
  if(b.held)return;
  if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx);}else if(b.x>width-b.r){b.x=width-b.r;b.vx=-Math.abs(b.vx);}
  if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy);}else if(b.y>height-b.r){b.y=height-b.r;b.vy=-Math.abs(b.vy);}
  if(field){const dx=b.x-field.x,dy=b.y-field.y,d=Math.hypot(dx,dy),min=b.r+field.r+4;
   if(d<min){const nx=d?dx/d:1,ny=d?dy/d:0;b.x=field.x+nx*min;b.y=field.y+ny*min;const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=2*vn*nx;b.vy-=2*vn*ny;collisions++;}}
  }
 };
 for(const b of bodies){if(!b.held){b.x+=b.vx*dt;b.y+=b.vy*dt;}}
 // Repeat contact constraints to resolve groups without pushing neighbours through walls.
 for(let pass=0;pass<16;pass++){
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
   const a=bodies[i],b=bodies[j];if(a.held&&b.held)continue;
   const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.r+b.r+5;if(d>=min)continue;
   const nx=d?dx/d:1,ny=d?dy/d:0,overlap=min-d;
   const ia=a.held?0:1/(a.r*a.r),ib=b.held?0:1/(b.r*b.r),sum=ia+ib;
   a.x-=nx*overlap*ia/sum;a.y-=ny*overlap*ia/sum;b.x+=nx*overlap*ib/sum;b.y+=ny*overlap*ib/sum;
   const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
   if(relative<0){const impulse=-2*relative/sum;if(!a.held){a.vx-=impulse*ia*nx;a.vy-=impulse*ia*ny;}if(!b.held){b.vx+=impulse*ib*nx;b.vy+=impulse*ib*ny;}collisions++;}
  }
  for(const b of bodies)constrain(b);
 }
 return collisions;
}
export function forceField(width,height){return {x:width/2,y:height/2,r:Math.min(48,width*.1,height*.14)};}
export function bubbleLayout(width,height,interests=false){
 const radius=Math.min(width<650?38:50,Math.max(26,(height-10)/2));
 const columns=Math.max(1,Math.floor((width+5)/(radius*2+5))),rows=Math.max(1,Math.floor((height+5)/(radius*2+5)));
 const capacity=Math.max(1,columns*rows-(interests?Math.min(2,columns-1):0));
 return {radius,count:Math.min(width>=1000?15:width>=650?12:6,capacity)};
}
export function shipPose(width,height,pointer={x:width/2,y:height/2}){
 const x=width/2,y=height/2,angle=Math.atan2(pointer.y-y,pointer.x-x);
 return {x,y,angle,muzzle:{x:x+Math.cos(angle)*24,y:y+Math.sin(angle)*24}};
}
export class BusinessScene {
 constructor(arena,{interests,isPaused,onPick}){
  this.arena=arena;this.interests=interests;this.isPaused=isPaused;this.onPick=onPick;this.bodies=[];this.width=0;this.height=0;this.time=0;this.collisions=0;this.disposed=false;this.pointer=null;this.shots=[];this.aimDirty=false;this.events=new AbortController();
  this.canvas=document.createElement('canvas');this.canvas.className='scene-background';this.canvas.setAttribute('aria-hidden','true');arena.append(this.canvas);this.ctx=this.canvas.getContext('2d');
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(arena);
  if(interests){
   const aim=event=>{const rect=arena.getBoundingClientRect();this.pointer={x:event.clientX-rect.left-arena.clientLeft,y:event.clientY-rect.top-arena.clientTop};this.aimDirty=true;};
   document.addEventListener('pointermove',aim,{signal:this.events.signal});
   arena.addEventListener('click',event=>{
    if(event.target.closest('button:disabled'))return;
    if(event.detail===0&&event.target.closest('button')){const r=event.target.getBoundingClientRect();aim({clientX:r.x+r.width/2,clientY:r.y+r.height/2});}else aim(event);
    const ship=shipPose(this.width,this.height,this.pointer);
    this.shots.push({from:ship.muzzle,to:{...this.pointer},expires:performance.now()+160});this.draw();
   },{capture:true,signal:this.events.signal});
  }
  this.resize();this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);
 }
 resize(){
  const oldW=this.width||this.arena.clientWidth,oldH=this.height||this.arena.clientHeight;
  this.width=this.arena.clientWidth;this.height=this.arena.clientHeight;
  this.canvas.width=Math.ceil(this.width/3);this.canvas.height=Math.ceil(this.height/3);
  for(const b of this.bodies){const oldR=b.r;b.r=this.radius(b.node);b.x=Math.max(b.r,Math.min(this.width-b.r,b.x*this.width/oldW));b.y=Math.max(b.r,Math.min(this.height-b.r,b.y*this.height/oldH));if(oldR!==b.r)this.size(b);}
  stepBodies(this.bodies,this.width,this.height,0,this.interests?forceField(this.width,this.height):null);this.draw();this.place();
 }
 radius(node){return bubbleLayout(this.width,this.height,this.interests).radius;}
 size(b){b.element.style.width=b.r*2+'px';b.element.style.height=b.r*2+'px';}
 sync(nodes,origin){
  const labels=new Set(nodes.map(n=>n.label));for(const b of this.bodies)if(!labels.has(b.node.label))b.element.remove();this.bodies=this.bodies.filter(b=>labels.has(b.node.label));
  for(const node of nodes){if(this.bodies.some(b=>b.node.label===node.label))continue;const first=!this.started||this.isPaused();
   const r=this.radius(node),side=Math.random()<.5?-1:1;let x,y;
   const field=this.interests?forceField(this.width,this.height):null;
   let best=null;for(let attempt=0;attempt<400;attempt++){
    const px=r+Math.random()*Math.max(1,this.width-r*2),py=r+Math.random()*Math.max(1,this.height-r*2);
    const gap=Math.min(...this.bodies.map(b=>Math.hypot(px-b.x,py-b.y)-r-b.r),field?Math.hypot(px-field.x,py-field.y)-r-field.r:Infinity);
    if(!best||gap>best.gap)best={x:px,y:py,gap};if(gap>10)break;
   }x=best.x;y=best.y;
   const speed=this.interests?48+Math.random()*24:23+Math.random()*13;
   const element=document.createElement('button');element.type='button';element.className='skill-target';element.textContent=node.label;element.dataset.depth=String(node.depth||0);element.setAttribute('aria-label',(this.interests?'Shoot ':'Pop ')+node.label);
   const angle=Math.random()*Math.PI*2;
   const b={node,element,r,x,y,vx:(first?(Math.random()<.5?-1:1):-side)*Math.cos(angle)*speed,vy:Math.sin(angle)*speed,entering:false,held:false,spin:(Math.random()-.5)*12};
   if(!this.interests){element.addEventListener('pointerenter',()=>b.held=true);element.addEventListener('pointerleave',()=>b.held=false);}
   element.addEventListener('click',()=>this.onPick(node,element,{x:b.x,y:b.y}));
   if(b.entering)b.vx*=3;this.size(b);this.bodies.push(b);this.arena.append(element);
  }
  this.started=true;stepBodies(this.bodies,this.width,this.height,0,this.interests?forceField(this.width,this.height):null);this.place();
 }
 setDisabled(disabled){for(const b of this.bodies)b.element.disabled=disabled;}
 place(){for(const b of this.bodies)b.element.style.transform=`translate(${Math.round(b.x-b.r)}px,${Math.round(b.y-b.r)}px)`;}
 tick(stamp){if(this.disposed)return;const dt=Math.min(.033,Math.max(0,(stamp-(this.previous||stamp))/1000));this.previous=stamp;
  const frozen=this.isPaused()||document.hidden||this.bodies.some(b=>b.element.matches(':focus-visible'));
  const oldShots=this.shots.length;this.shots=this.shots.filter(shot=>shot.expires>stamp);
  if(!frozen){this.time+=dt;this.collisions+=stepBodies(this.bodies,this.width,this.height,dt,this.interests?forceField(this.width,this.height):null);this.place();this.draw();}else if(this.aimDirty||oldShots!==this.shots.length)this.draw();
  this.aimDirty=false;
  this.frame=requestAnimationFrame(this.tick);
 }
 draw(){const c=this.ctx,w=this.canvas.width,h=this.canvas.height;c.fillStyle='#000';c.fillRect(0,0,w,h);c.fillStyle='#fff';
  if(this.interests){
   // Different star speeds give a small parallax effect behind the passing rocks.
   for(let i=0;i<50;i++){const speed=1+i%3,x=((i*83.37-this.time*speed*2)%w+w)%w,y=(i*47.13)%h;const size=i%17===0?2:1;c.fillRect(Math.round(x),Math.round(y),size,size);if(i%23===0){c.fillRect(Math.round(x)-2,Math.round(y),5,1);c.fillRect(Math.round(x),Math.round(y)-2,1,5);}}
   const ship=shipPose(this.width,this.height,this.pointer||undefined),scaleX=w/this.width,scaleY=h/this.height;
   c.strokeStyle='#fff';c.lineWidth=1;
   for(const shot of this.shots){c.beginPath();c.moveTo(shot.from.x*scaleX,shot.from.y*scaleY);c.lineTo(shot.to.x*scaleX,shot.to.y*scaleY);c.stroke();}
   const field=forceField(this.width,this.height);c.beginPath();c.arc(field.x*scaleX,field.y*scaleY,field.r*scaleX,0,Math.PI*2);c.stroke();
   c.save();c.translate(ship.x*scaleX,ship.y*scaleY);c.rotate(ship.angle+Math.PI/2);
   c.fillStyle='#fff';for(const [x,y,a,b] of [[-1,-7,2,14],[-4,-2,8,4],[-7,2,14,2],[-4,5,2,3],[2,5,2,3]])c.fillRect(x,y,a,b);
   if(this.shots.length)c.fillRect(-2,-11,4,3);c.restore();
  }else{
   const ground=h-24,fence=ground-27;
   // Picket fence, little house, tree, garden beds, stepping stones and clouds.
   c.fillRect(0,ground,w,1);c.fillRect(0,fence+10,w,1);c.fillRect(0,fence+21,w,1);
   for(let x=0;x<w;x+=10){c.fillRect(x,fence+3,1,27);c.fillRect(x+5,fence+3,1,27);c.fillRect(x+1,fence,4,1);c.fillRect(x,fence+1,6,2);}
   c.fillStyle='#000';c.fillRect(18,ground-61,49,61);c.strokeStyle='#fff';c.strokeRect(18,ground-61,49,61);c.beginPath();c.moveTo(12,ground-61);c.lineTo(42,ground-85);c.lineTo(73,ground-61);c.closePath();c.stroke();c.strokeRect(26,ground-48,12,13);c.strokeRect(47,ground-29,12,29);c.fillStyle='#fff';c.fillRect(31,ground-48,1,13);c.fillRect(26,ground-42,12,1);
   const tx=w-32;c.fillStyle='#000';c.fillRect(tx-4,ground-52,8,52);c.strokeRect(tx-4,ground-52,8,52);c.beginPath();const crown=[[-22,-42],[-28,-50],[-24,-65],[-16,-66],[-17,-77],[-5,-85],[6,-83],[11,-72],[22,-72],[29,-58],[22,-44]];c.moveTo(tx+crown[0][0],ground+crown[0][1]);for(const [x,y]of crown.slice(1))c.lineTo(tx+x,ground+y);c.closePath();c.fill();c.stroke();
   c.fillStyle='#fff';for(let x=4;x<w;x+=13){c.fillRect(x,ground+9,1,3);c.fillRect(x+2,ground+7,1,2);c.fillRect(x+5,ground+18,2,1);}
   for(let i=0;i<3;i++){const cx=((i*w/3+this.time*1.7)%(w+70))-35,cy=16+(i%2)*18;c.fillRect(Math.round(cx),cy,23,2);c.fillRect(Math.round(cx)+4,cy-3,15,3);c.fillRect(Math.round(cx)+8,cy-5,6,2);}
   c.strokeRect(17,15,10,10);c.fillRect(21,9,2,3);c.fillRect(21,28,2,3);c.fillRect(11,19,3,2);c.fillRect(30,19,3,2);
  }
  // Threshold rasterized strokes so the enlarged scene contains only black and white pixels.
  const pixels=c.getImageData(0,0,w,h);for(let i=0;i<pixels.data.length;i+=4){const value=pixels.data[i]>=128?255:0;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;}c.putImageData(pixels,0,0);
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.observer.disconnect();this.events.abort();}
}
