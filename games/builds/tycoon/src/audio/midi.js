// Bounded Standard MIDI File format 0/1 decoder. Timing remains independent of render FPS.
// Synth profile: fixed-pitch notes, program/volume/pan, tempo map, note-off/velocity-zero.
export function decodeMidi(input){
 const a=input instanceof Uint8Array?input:new Uint8Array(input);let p=0;
 const fail=m=>{throw new Error(`Invalid MIDI: ${m}`);};
 const need=n=>{if(p+n>a.length)fail('truncated data');};
 const u8=()=>{need(1);return a[p++];};
 const u16=()=>u8()*256+u8();const u32=()=>u16()*65536+u16();
 const str=n=>{need(n);let s='';while(n--)s+=String.fromCharCode(a[p++]);return s;};
 const vlq=()=>{let v=0;for(let i=0;i<4;i++){const b=u8();v=v*128+(b&127);if(!(b&128))return v;}return fail('oversized variable-length integer');};
 if(a.length>2*1024*1024)fail('file too large');
 if(str(4)!=='MThd')fail('missing header');const header=u32();if(header<6)fail('short header');
 const format=u16(),count=u16(),ppq=u16();if(format>1||!count||count>64||(format===0&&count!==1))fail('unsupported format');
 if(!ppq||(ppq&0x8000))fail('SMPTE timing is not supported');need(header-6);p+=header-6;
 const events=[];let end=0,order=0;
 for(let tr=0;tr<count;tr++){
  if(str(4)!=='MTrk')fail('missing track');const len=u32();need(len);const stop=p+len;let tick=0,running=0;
  while(p<stop){
   tick+=vlq();if(tick>ppq*60*60)fail('sequence too long');let status=u8();
   if(status<128){if(!running)fail('running status without a channel status');p--;status=running;}
   else if(status<240)running=status;
   if(status===255){running=0;const type=u8(),n=vlq();need(n);if(p+n>stop)fail('meta event overrun');
    if(type===81){if(n!==3)fail('tempo length');const tempo=a[p]*65536+a[p+1]*256+a[p+2];if(!tempo)fail('zero tempo');events.push({tick,order:order++,kind:'tempo',tempo});}
    p+=n;if(type===47){if(n)fail('end marker length');p=stop;}
   }else if(status===240||status===247){running=0;const n=vlq();need(n);p+=n;}
   else{
    if(status>=240)fail('unsupported system message');const kind=status>>4,channel=status&15,x=u8(),y=(kind===12||kind===13)?0:u8();
    if(x>127||y>127)fail('invalid channel data');
    if(kind===14&&(x!==0||y!==64))fail('pitch bends are outside the fixed-pitch soundtrack profile');
    if(kind===11&&[1,64,65,93].includes(x)&&y!==0)fail('unsupported sustain/modulation/portamento/chorus');
    if([8,9,11,12].includes(kind))events.push({tick,order:order++,kind,channel,x,y});
   }
   if(p>stop)fail('track overrun');if(events.length>100000)fail('too many events');
  }
  end=Math.max(end,tick);
 }
 events.sort((a,b)=>a.tick-b.tick||a.order-b.order);
 const channels=Array.from({length:16},()=>({program:0,volume:1,expression:1,pan:.5,wet:0}));
 const active=new Map(),notes=[];let tick=0,seconds=0,tempo=500000;
 for(const e of events){seconds+=(e.tick-tick)*tempo/(ppq*1e6);tick=e.tick;
  if(e.kind==='tempo'){tempo=e.tempo;continue;}const c=channels[e.channel];
  if(e.kind===12)c.program=e.x;
  if(e.kind===11){if(e.x===7)c.volume=e.y/127;if(e.x===10)c.pan=e.y/127;if(e.x===11)c.expression=e.y/127;if(e.x===91)c.wet=e.y/127;}
  const key=e.channel*128+e.x;
  if(e.kind===9&&e.y){if(active.has(key))fail('overlapping same-channel note');active.set(key,{at:seconds,note:e.x,velocity:e.y,channel:e.channel,...c});}
  if(e.kind===8||(e.kind===9&&!e.y)){
   const n=active.get(key);if(!n)fail('orphan note-off');active.delete(key);
   if(seconds<=n.at)fail('zero-length note');notes.push({...n,duration:seconds-n.at});
  }
 }
 if(active.size)fail('unterminated notes');seconds+=(end-tick)*tempo/(ppq*1e6);
 if(!notes.length||seconds>600)fail('empty or overlong sequence');
 return {format,ppq,duration:seconds,notes:notes.sort((a,b)=>a.at-b.at||a.channel-b.channel||a.note-b.note)};
}
