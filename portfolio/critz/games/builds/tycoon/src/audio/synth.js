// Original MUSIC.02 timbres, rendered off the UI thread. No external samples or pitch modulation.
export const SAMPLE_RATE=22050;
export const PROGRAMS={0:'felt',4:'epiano',8:'bell',10:'box',11:'vibes',12:'marimba',16:'organ',24:'nylon',27:'pluck',32:'upright',38:'sub',48:'strings',62:'brass',71:'reed',73:'flute',80:'square',81:'saw',85:'triangle',87:'pulse',89:'air',90:'sine',98:'glass',103:'bubble'};
const releases={felt:.8,epiano:.55,bell:.9,box:.8,vibes:.7,marimba:.18,organ:.15,nylon:.35,pluck:.2,upright:.22,sub:.2,strings:.9,brass:.2,reed:.2,flute:.3,square:.12,saw:.16,triangle:.17,pulse:.12,air:1.5,sine:.5,glass:1.3,bubble:.14};
const TAU=2*Math.PI;
export function synthNote(patch,n,d,sr=SAMPLE_RATE){
 if(!Object.hasOwn(releases,patch))throw Error(`Unsupported instrument ${patch}`);
 const f=440*2**((n-69)/12),release=releases[patch],length=Math.ceil((d+release)*sr),out=new Float32Array(length),maxh=Math.min(40,Math.floor(sr*.45/f));
 let attack=.009,decay=.4,sustain=.8,scale=1,partials=[],fm=0;
 if(patch==='sine'||patch==='sub'){partials=[[1,1,0]];if(patch==='sub'){partials.push([2,.08,0]);attack=.015;}else{attack=.05;sustain=1;}}
 else if(patch==='triangle'){for(let h=1;h<=maxh;h+=2)partials.push([h,(-1)**((h-1)/2)/h**2,0]);scale=.82;attack=.02;sustain=.85;}
 else if(['square','pulse','saw','strings','air','brass','reed'].includes(patch)){
  const cutoff={square:4200,pulse:3400,saw:3100,strings:2100,air:1000,brass:2300,reed:3000}[patch];
  for(let h=1;h<=maxh;h++){
   if(['square','reed'].includes(patch)&&h%2===0)continue;
   const c=patch==='square'?1/h:patch==='reed'?1/h**1.3:patch==='pulse'?2*Math.sin(Math.PI*h*.28)/(Math.PI*h):(-1)**(h+1)/h;
   partials.push([h,c*Math.exp(-((h*f/cutoff)**2)),0,patch==='pulse'?Math.PI/2-Math.PI*h*.28:0]);
  }
  scale=patch==='pulse'?1.4:.72;attack=({air:.45,strings:.2,brass:.065,reed:.035})[patch]||.016;sustain=['air','strings'].includes(patch)?.9:.75;
 }else if(patch==='organ'){partials=[[1,.65,0],[2,.32,0],[3,.12,0],[4,.08,0],[6,.025,0]];attack=.018;sustain=1;}
 else if(['felt','epiano','nylon','pluck','upright'].includes(patch)){
  if(patch==='epiano'){fm=.65;partials=[[3,.06,3]];decay=.6;sustain=.25;}
  else{const power={felt:1.9,nylon:1.65,pluck:1.3,upright:2.2}[patch],damp={felt:2.2,nylon:1.5,pluck:3.7,upright:4}[patch];
   for(let h=1;h<=Math.min(maxh,18);h++)partials.push([h,(patch==='nylon'?Math.cos(h*Math.PI*.12):1)/h**power,.35+(h-1)*damp]);
   scale=.8;decay={felt:.8,nylon:.48,pluck:.12,upright:.23}[patch];sustain={felt:.4,nylon:.3,pluck:.1,upright:.5}[patch];
  }attack=patch==='felt'?.012:.007;
 }else if(['bell','box','vibes','marimba','glass'].includes(patch)){
  partials={bell:[[1,.8,.3],[2,.22,2],[4,.12,3],[6,.03,6]],box:[[1,.8,.5],[3,.22,2.8],[5,.05,7]],vibes:[[1,.95,.3],[4,.13,5],[7,.02,10]],marimba:[[1,.95,1],[4,.22,13],[8,.04,25]],glass:[[1,.76,.25],[2,.12,1.5],[4,.14,2],[6,.03,5]]}[patch];attack=.007;decay=patch==='marimba'?.08:.3;sustain=patch==='marimba'?.2:.35;
 }else if(patch==='flute'){partials=[[1,.9,0],[2,.11,0],[3,.025,0]];attack=.05;sustain=.9;}
 else if(patch==='bubble'){fm=.7;attack=.009;decay=.12;sustain=.28;}
 // Harmonic recurrences avoid millions of expensive sin/exp calls in each worker render.
 for(const [h,amp,damp,offset=0] of partials){
  if(h>maxh)continue;const step=TAU*f*h/sr,cs=Math.cos(step),sn=Math.sin(step),loss=Math.exp(-damp/sr);let si=Math.sin(offset),co=Math.cos(offset),gain=amp;
  for(let i=0;i<length;i++){out[i]+=gain*si;const next=si*cs+co*sn;co=co*cs-si*sn;si=next;gain*=loss;}
 }
 for(let i=0;i<length;i++){
  const t=i/sr,ph=TAU*f*t;
  if(fm)out[i]+=.85*Math.sin(ph+fm*Math.exp(-t*(patch==='bubble'?10:6))*Math.sin(2*ph));
  let e=(.5-.5*Math.cos(Math.PI*Math.min(1,t/attack)))*(sustain+(1-sustain)*Math.exp(-Math.max(0,t-attack)/decay));
  if(t>d)e*=(.5+.5*Math.cos(Math.PI*Math.min(1,(t-d)/release)))**2;
  out[i]*=e*scale;
 }
 return out;
}
function drum(n,sr){
 const duration=({36:.28,37:.06,38:.18,42:.06,45:.25,47:.2,75:.065})[n]||.2,out=new Float32Array(Math.ceil(duration*sr));let seed=157+n,previous=0;
 for(let i=0;i<out.length;i++){
  seed=(1664525*seed+1013904223)>>>0;const noise=seed/2147483648-1,t=i/sr,hp=(noise-previous)*.5;previous=noise;let w;
  if(n===36)w=Math.sin(TAU*(48*t+1.6*(1-Math.exp(-35*t))))*Math.exp(-t*16)+.035*noise*Math.exp(-t*180);
  else if(n===38)w=.34*hp*Math.exp(-t*28)+.22*Math.sin(TAU*175*t)*Math.exp(-t*36);
  else if(n===42)w=.24*hp*Math.exp(-t*65);
  else if(n===45||n===47)w=.62*Math.sin(TAU*(n===45?110:150)*t)*Math.exp(-t*19);
  else w=.35*(Math.sin(TAU*(n===37?1100:780)*t)+.3*Math.sin(TAU*1870*t))*Math.exp(-t*80);
  out[i]=w*Math.min(1,t/.002)*Math.min(1,(duration-t)/.005);
 }return out;
}
export function renderSequence(sequence,sr=SAMPLE_RATE){
 const N=Math.ceil((sequence.duration+3)*sr),left=new Float32Array(N),right=new Float32Array(N),sendL=new Float32Array(N),sendR=new Float32Array(N),cache=new Map();
 for(const n of sequence.notes){
  const patch=n.channel===9?'drums':PROGRAMS[n.program];if(!patch)throw Error(`Unmapped MIDI program ${n.program}`);
  const key=`${patch}/${n.note}/${n.duration.toFixed(5)}`;let wave=cache.get(key);
  if(!wave){wave=patch==='drums'?drum(n.note,sr):synthNote(patch,n.note,n.duration,sr);cache.set(key,wave);if(cache.size>128)cache.delete(cache.keys().next().value);}
  const gain=n.volume*n.expression*(n.velocity/127)**1.35*(patch==='drums'?.8:.42),l=Math.cos(n.pan*Math.PI/2)*gain,r=Math.sin(n.pan*Math.PI/2)*gain,offset=Math.round(n.at*sr),count=Math.min(wave.length,N-offset);
  for(let i=0;i<count;i++){const j=offset+i,x=wave[i];left[j]+=x*l;right[j]+=x*r;sendL[j]+=x*l*n.wet;sendR[j]+=x*r*n.wet;}
 }
 // Fixed, quiet room reflections. No chorus, time-varying delay or pitch effects.
 for(const [seconds,gain] of [[.043,.16],[.071,.12],[.113,.09],[.179,.05],[.293,.03]]){
  const shift=Math.round(seconds*sr);for(let i=shift;i<N;i++){left[i]+=sendR[i-shift]*gain;right[i]+=sendL[i-shift]*gain;}
 }
 let peak=0,total=0,used=0;
 for(let at=0;at<N;at+=Math.floor(sr*.4)){
  let energy=0;const stop=Math.min(N,at+Math.floor(sr*.4));
  for(let i=at;i<stop;i++){peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));energy+=left[i]**2+right[i]**2;}
  if(energy/(2*(stop-at))>1e-7){total+=energy;used+=2*(stop-at);}
 }
 if(!Number.isFinite(peak)||peak===0)throw Error('Silent or invalid MIDI synthesis');
 const gain=Math.min(.72/peak,.105/Math.sqrt(total/used));
 for(let i=0;i<N;i++){const fade=Math.min(1,(N-1-i)/(sr*.08));left[i]*=gain*fade;right[i]*=gain*fade;}
 return {left,right,sampleRate:sr,duration:N/sr,peak:peak*gain,noteCount:sequence.notes.length};
}
