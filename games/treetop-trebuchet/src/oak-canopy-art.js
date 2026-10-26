const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rand=n=>{const r=Math.sin(n*91.73+17.43)*21435.77;return r-Math.floor(r);};
/** Crown volumes belong to the same editable leaf objects as the branches.
 * Rear fans establish the silhouette; nearer leaf sprays cross the wood. */
export function oakLeafVolumes(map){
 const volumes=(map.objects??[]).filter(o=>/^oak-limb-.*-leaves$/.test(o.id)).map((o,i)=>{
  const xs=o.points.map(p=>p.x),ys=o.points.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  return{x:(minX+maxX)/2,y:(minY+maxY)/2,rx:(maxX-minX)/2,ry:(maxY-minY)/2,seed:i*13+4,near:i%3!==0||o.id.endsWith('crown-leaves')};
 });return volumes;
}
export function drawLeafVolume(c,project,v,s,W,H,front){
 const {x,y,rx,ry,seed}=v,p=project(x,y),w=rx*s,h=ry*s;
 if(p[0]+w*1.2<0||p[0]-w*1.2>W||p[1]+h*1.2<0||p[1]-h*1.2>H)return;
 if(w<5||h<3){c.beginPath();c.ellipse(p[0],p[1],Math.max(.01,w),Math.max(.01,h),0,0,TAU);c.fillStyle=front?'#78945a':'#466d50';c.fill();return;}
 // Irregular scallops and distinct shoulders, rather than smooth oval pads.
 const count=Math.min(s<8?32:64,Math.max(s<8?12:18,Math.floor(w/3))),pts=[];
 for(let i=0;i<count;i++){
  const a=i/count*TAU,scallop=1+.075*Math.sin(a*7+seed)+.042*Math.sin(a*17+seed*.7)+.025*Math.cos(a*29+seed),lean=.13*Math.sin(a*2+seed);
  pts.push([p[0]+Math.cos(a)*w*scallop+Math.sin(a)*w*lean,p[1]+Math.sin(a)*h*scallop]);
 }
 c.beginPath();const last=pts.at(-1);c.moveTo((last[0]+pts[0][0])/2,(last[1]+pts[0][1])/2);for(let i=0;i<count;i++){const q=pts[i],n=pts[(i+1)%count];c.quadraticCurveTo(q[0],q[1],(q[0]+n[0])/2,(q[1]+n[1])/2);}c.closePath();
 const g=c.createLinearGradient(p[0]-w*.55,p[1]-h,p[0]+w*.35,p[1]+h);
 if(front){g.addColorStop(0,'#9eae65');g.addColorStop(.32,'#7e9956');g.addColorStop(.7,'#597f49');g.addColorStop(1,'#365d40');}
 else{g.addColorStop(0,'#79976a');g.addColorStop(.5,'#487953');g.addColorStop(1,'#2a5646');}
 c.fillStyle=g;c.fill();
 if(w<10||h<7)return;
 c.save();c.clip();
 // Broken patches of dappled light articulate the top-facing leaf planes.
 const n=Math.min(s<8?3:20,Math.max(3,Math.floor(Math.min(w*h,W*H)/320)));
 for(let j=0;j<n;j++){
  const a=rand(seed+j*3)*TAU,r=Math.sqrt(rand(seed+j*3+1)),xx=p[0]+Math.cos(a)*w*r,yy=p[1]+Math.sin(a)*h*r;
  if(xx< -12||xx>W+12||yy< -12||yy>H+12)continue;
  const rpx=Math.min(9,Math.max(1.1,w*(.035+rand(j+seed)*.045))),rpy=rpx*.45;
  c.beginPath();c.moveTo(xx-rpx,yy);c.quadraticCurveTo(xx-rpx*.4,yy-rpy*1.6,xx+rpx*.5,yy-rpy);c.quadraticCurveTo(xx+rpx*1.3,yy-rpy*.2,xx+rpx*.7,yy+rpy*.6);c.quadraticCurveTo(xx,yy+rpy*.3,xx-rpx,yy);
  c.fillStyle=yy<p[1]+h*.15?(front?'#bdc78255':'#a3b97740'):'#214f3930';c.fill();
 }
 c.restore();
}
export function drawOakCanopy(c,{map,project,scale:s,width:W,height:H,front=false}){
 if(map.version!==4||map.starterRevision<11)return;
 const t=map.tree,origin=map.launch.y,k=t.height/75;
 c.save();
 // At centimetre scale the crown is distant; preserve gameplay contrast.
 c.globalAlpha*=1-clamp((s-12)/55,0,1)*(front?.90:.72);
 if(!front){
  // Unequal broad rear lobes form a connected, rounded but off-centre crown.
  const lobes=[[-23,43,9,7],[-28,53,8,9],[-24,61,9,8],[-16,66,9,7],[-7,69,8,6],[3,68,10,7],[14,67,9,6],[24,60,10,9],[28,51,8,8],[22,43,10,7],[-16,48,7,8],[3,62,9,8],[16,48,8,8]];
  for(const [i,[dx,h,rx,ry]]of lobes.entries())drawLeafVolume(c,project,{x:t.trunkX+dx*k,y:h*k-origin,rx:rx*k,ry:ry*k,seed:i*17},s,W,H,false);
 }else{
  const leaves=oakLeafVolumes(map);
  for(const [i,v]of leaves.entries()){
   if(!v.near)continue;
   // Upper/outer leaf fans overlap terminal branches, leaving the central
   // crotches exposed and the substantial trunk legible through the crown.
   const distance=Math.abs(v.x-t.trunkX);
   if(distance<6*k&&v.y+origin<64*k)continue;
   drawLeafVolume(c,project,{...v,rx:v.rx*(.77+rand(i)*.34),ry:v.ry*(.85+rand(i+7)*.35)},s,W,H,true);
  }
 }
 c.restore();
}
