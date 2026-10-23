/** Original woodland bumper illustration. The caller supplies the projected
 * collision circle; petals and curled pods are always clipped inside it. */
const TAU=Math.PI*2,INK='#302d2b';
function identity(id){let n=2166136261;for(const ch of String(id??'woodland-pod')){n^=ch.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
const disk=(c,x,y,rx,ry,color)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();};
function petal(c,a,length,width,color,cx,cy,outline=0){
 const ux=Math.cos(a),uy=Math.sin(a),px=-uy,py=ux,p=(u,v)=>[cx+ux*u+px*v,cy+uy*u+py*v];
 c.beginPath();c.moveTo(...p(.08,0));c.bezierCurveTo(...p(.3,width*.87),...p(length*.85,width),...p(length,.02));c.bezierCurveTo(...p(length*.95,-width*.63),...p(.38,-width*.7),...p(.08,0));c.closePath();c.fillStyle=color;c.fill();if(outline){c.strokeStyle=INK;c.lineWidth=outline;c.stroke();}
}
function blossom(c,seed,r,decorative){
 const phase=(seed%997)/997*TAU,cx=Math.sin(phase)*.1,cy=.03+Math.cos(phase)*.07,n=r<24?5:7;
 // Uneven broad sepals overlap, rather than forming a machined radial rim.
 for(let j=0;j<n;j++){const a=phase+j*TAU/n+Math.sin(j*2.71+phase)*.15,length=.83+Math.sin(j*1.7+phase)*.11,width=.29+Math.cos(j*2.3+phase)*.07;petal(c,a,length,width,['#d5a054','#e4b96d','#bd8446'][(j+seed)%3],cx,cy,decorative ? .043 : 0);}
 c.save();c.translate(cx,cy);c.rotate(phase*.17);
 c.beginPath();c.moveTo(-.4,-.09);c.bezierCurveTo(-.37,-.35,-.05,-.42,.2,-.31);c.bezierCurveTo(.45,-.2,.47,.11,.3,.29);c.bezierCurveTo(.08,.43,-.23,.36,-.37,.2);c.bezierCurveTo(-.48,.11,-.48,-.03,-.4,-.09);c.closePath();c.fillStyle='#65472f';c.fill();
 const seeds=r<24?[[-.13,-.12,.095],[.15,-.04,.085],[-.02,.16,.09]]:[[-.2,-.16,.06],[-.01,-.22,.055],[.18,-.12,.06],[-.26,.03,.055],[-.07,-.02,.065],[.14,.07,.06],[-.15,.2,.055],[.03,.25,.055],[.29,.12,.045]];
 for(const [x,y,s]of seeds)disk(c,x,y,s,s*.65,'#b68a46');c.restore();
}
function curledPod(c,seed,decorative){
 c.save();c.rotate(((seed%307)/307-.5)*.42);
 petal(c,1.07,.91,.24,'#6b8048',-.03,.12,decorative ? .043 : 0);petal(c,2.14,.94,.3,'#91a15b',.04,.08,decorative ? .043 : 0);
 // A single thick unfurling crozier gives this family an organic large form.
 const curl=()=>{c.beginPath();c.moveTo(-.62,.49);c.bezierCurveTo(-.98,-.08,-.58,-.82,-.02,-.79);c.bezierCurveTo(.59,-.77,.86,-.18,.48,.26);c.bezierCurveTo(.12,.62,-.4,.26,-.12,-.03);c.bezierCurveTo(.03,-.18,.26,-.04,.1,.1);};
 c.lineCap='round';c.lineJoin='round';curl();c.strokeStyle='#62452f';c.lineWidth=.45;c.stroke();curl();c.strokeStyle='#d3a35b';c.lineWidth=.31;c.stroke();
 disk(c,-.2,-.49,.16,.075,'#eed18b');c.restore();
}
/** Draw only a circular bumper's art. x/y/r are canvas pixels; scale is the
 * caller's positive world projection scale and never changes the given radius.
 * ID selects a stable blossom or curled-pod family. Decorative collision=false
 * heads show only their organic silhouette; colliders retain the full circle.
 * No object data is mutated. */
export function drawBotanicalBumper(c,o,{x,y,r,scale=1}={}){
 if(![x,y,r,scale].every(Number.isFinite)||r<=0||scale<=0)return false;
 const decorative=o?.collision===false,seed=identity(o?.id),edge=Math.min(2.6,Math.max(.6,r*.055),r*.28)/r;
 c.save();c.translate(x,y);c.scale(r,r);c.beginPath();c.arc(0,0,1,0,TAU);
 if(!decorative){c.fillStyle='#96683d';c.fill();}c.save();c.clip();
 if(r<4){
  if(decorative){petal(c,-2.5,.96,.38,'#d8ac61',0,0);petal(c,-.3,.89,.36,'#c99550',0,0);petal(c,1.8,.91,.36,'#e4b96d',0,0);}else disk(c,-.05,-.08,.67,.66,'#d8ac61');
  if(r>=2)disk(c,.05,.07,.28,.26,'#65472f');
 }else if(seed%3===0)curledPod(c,seed,decorative);else blossom(c,seed,r,decorative);
 c.restore();
 if(!decorative){c.beginPath();c.arc(0,0,1-edge*.5,0,TAU);c.strokeStyle=INK;c.lineWidth=edge;c.stroke();}
 c.restore();return true;
}
