import {drawCritter} from './build-art.js?v=70';
const xml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const num=value=>Number(value.toFixed(7));
/** Small path recorder for the existing ready-pose artwork. It does not run a
 * browser or make a second set of animal illustrations. All output is in metres.
 * Only the Canvas operations used by drawCritter's ready pose are supported. */
class CritterPathRecorder{
 constructor(){this.state={matrix:[1,0,0,1,0,0],fillStyle:'#000',strokeStyle:'#000',lineWidth:1,lineCap:'butt',lineJoin:'miter',globalAlpha:1,clips:[]};this.stack=[];this.path=[];this.paints=[];this.clips=[];}
 save(){this.stack.push({...this.state,matrix:[...this.state.matrix],clips:[...this.state.clips]});}
 restore(){if(!this.stack.length)throw Error('Unbalanced critter-art restore');this.state=this.stack.pop();}
 transform(a,b,c,d,e,f){const[m,n,o,p,q,r]=this.state.matrix;this.state.matrix=[m*a+o*b,n*a+p*b,m*c+o*d,n*c+p*d,m*e+o*f+q,n*e+p*f+r];}
 translate(x,y){this.transform(1,0,0,1,x,y);}
 scale(x,y){this.transform(x,0,0,y,0,0);}
 rotate(a){this.transform(Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0);}
 point(x,y){const[a,b,c,d,e,f]=this.state.matrix;return[a*x+c*y+e,b*x+d*y+f];}
 beginPath(){this.path=[];}
 moveTo(x,y){this.path.push(['M',...this.point(x,y)]);}
 lineTo(x,y){this.path.push(['L',...this.point(x,y)]);}
 closePath(){this.path.push(['Z']);}
 bezierCurveTo(a,b,c,d,e,f){this.path.push(['C',...this.point(a,b),...this.point(c,d),...this.point(e,f)]);}
 quadraticCurveTo(a,b,c,d){this.path.push(['Q',...this.point(a,b),...this.point(c,d)]);}
 ellipse(x,y,rx,ry,rotation,start,end,anticlockwise=false){
  const tau=Math.PI*2,raw=end-start;let sweep=raw;
  if(!anticlockwise){if(raw>=tau)sweep=tau;else while(sweep<0)sweep+=tau;}
  else{if(raw<=-tau)sweep=-tau;else while(sweep>0)sweep-=tau;}
  const cos=Math.cos(rotation),sin=Math.sin(rotation),p=t=>[x+rx*Math.cos(t)*cos-ry*Math.sin(t)*sin,y+rx*Math.cos(t)*sin+ry*Math.sin(t)*cos],v=t=>[-rx*Math.sin(t)*cos-ry*Math.cos(t)*sin,-rx*Math.sin(t)*sin+ry*Math.cos(t)*cos];
  const first=p(start);if(this.path.length)this.lineTo(...first);else this.moveTo(...first);
  const segments=Math.ceil(Math.abs(sweep)/(Math.PI/2));
  for(let i=0;i<segments;i++){const a=start+sweep*i/segments,b=start+sweep*(i+1)/segments,k=4/3*Math.tan((b-a)/4),pa=p(a),pb=p(b),va=v(a),vb=v(b);this.bezierCurveTo(pa[0]+k*va[0],pa[1]+k*va[1],pb[0]-k*vb[0],pb[1]-k*vb[1],...pb);}
 }
 arc(x,y,r,start,end,anticlockwise=false){this.ellipse(x,y,r,r,0,start,end,anticlockwise);}
 rect(x,y,w,h){this.moveTo(x,y);this.lineTo(x+w,y);this.lineTo(x+w,y+h);this.lineTo(x,y+h);this.closePath();}
 data(){return this.path.map(([command,...p])=>command+p.map(num).join(' ')).join(' ');}
 clip(){this.clips.push(this.data());this.state.clips.push(this.clips.length-1);}
 paint(stroke=false){
  const s=this.state,[a,b,c,d]=s.matrix,scale=Math.sqrt(Math.abs(a*d-b*c));
  this.paints.push({d:this.data(),fill:stroke?'none':s.fillStyle,stroke:stroke?s.strokeStyle:'none',width:stroke?s.lineWidth*scale:0,cap:s.lineCap,join:s.lineJoin,alpha:s.globalAlpha,clips:[...s.clips]});
 }
 fill(){this.paint();}
 stroke(){this.paint(true);}
 fillRect(x,y,w,h){const before=this.path;this.beginPath();this.rect(x,y,w,h);this.fill();this.path=before;}
 markup(prefix){
  const defs=this.clips.map((d,i)=>`<clipPath id="${prefix}-${i}" clipPathUnits="userSpaceOnUse"><path d="${d}"/></clipPath>`).join('');
  const paints=this.paints.map(p=>{let node=`<path d="${p.d}" fill="${xml(p.fill)}" stroke="${xml(p.stroke)}" stroke-width="${num(p.width)}" stroke-linecap="${xml(p.cap)}" stroke-linejoin="${xml(p.join)}" opacity="${num(p.alpha)}"/>`;for(const i of p.clips)node=`<g clip-path="url(#${prefix}-${i})">${node}</g>`;return node;}).join('');
  return`<defs>${defs}</defs>${paints}`;
 }
}
for(const property of['fillStyle','strokeStyle','lineWidth','lineCap','lineJoin','globalAlpha'])Object.defineProperty(CritterPathRecorder.prototype,property,{get(){return this.state[property];},set(value){this.state[property]=value;}});
export function critterScaleMarkup(animal,bounds,prefix='scale-'+animal.id){
 if(!/^[a-zA-Z][\w-]*$/.test(prefix))throw Error('Invalid scale-art identifier');
 const c=new CritterPathRecorder();c.scale(1,-1);
 drawCritter(c,animal,animal.id==='mouse'?0:(bounds.minX+bounds.maxX)/2,animal.id==='mouse'?0:-(bounds.minY+bounds.maxY)/2,animal.length,0,false,animal.width,{pose:'ready'});
 if(c.stack.length)throw Error('Unbalanced critter-art save');
 return c.markup(prefix);
}
