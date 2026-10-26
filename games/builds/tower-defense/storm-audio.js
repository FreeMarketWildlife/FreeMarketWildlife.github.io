// Storm percussion shares the existing MIDI transport and Effects bus.
(()=>{'use strict';const A=window.SkyAudio,plans=new Map(),slots=new Map(),history=[];let buffer=null,stormBus=null,busContext=null;
const hz=n=>440*2**((n-69)/12),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function transport(){return A.stormTransportV89?.()}
function audible(s){return s?.ready&&!s.paused&&s.sfxOn&&!document.hidden&&s.ac?.state==='running'&&s.volumes.sfx>0&&s.volumes.master>0}
function grid(){const s=transport();if(!s?.ready||s.ac?.state!=='running')return null;const step=s.beat/4,slot=Math.max(0,Math.ceil((s.ac.currentTime+.008-s.beatOrigin)/step));return{slot,time:s.beatOrigin+slot*step,step,now:s.ac.currentTime}}
function record(e){history.push(e);if(history.length>64)history.shift()}
function noise(ac){if(buffer)return buffer;buffer=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const a=buffer.getChannelData(0);let seed=881;for(let i=0;i<a.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[i]=seed/2147483648-1}return buffer}
function route(s,pan){if(busContext!==s.ac){stormBus=s.ac.createGain();stormBus.connect(s.sfx);busContext=s.ac}const p=s.ac.createStereoPanner(),g=s.ac.createGain();p.pan.value=clamp(pan,-1,1);p.connect(g);g.connect(stormBus);return{p,g}}
function tone(s,n,t,d,level,pan,type='sine',drop=false){const o=s.ac.createOscillator(),r=route(s,pan);o.type=type;o.frequency.setValueAtTime(hz(n)+(drop?hz(n):0),t);if(drop)o.frequency.exponentialRampToValueAtTime(hz(n),t+d*.5);r.g.gain.setValueAtTime(.0001,t);r.g.gain.exponentialRampToValueAtTime(Math.max(.0002,level),t+.005);r.g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(r.p);o.start(t);o.stop(t+d);o.onended=()=>{o.disconnect();r.p.disconnect();r.g.disconnect()}}
function flight({id,gain=1,pan=0,ice=false}={}){const s=transport(),q=grid();if(!audible(s)||!q||gain<.025)return null;
 for(const [k,p]of plans)if(p.end<s.ac.currentTime)plans.delete(k);if(plans.has(id))return plans.get(id).public;
 if(plans.size>=8)return null;const endSlot=q.slot+2,end=s.beatOrigin+endSlot*q.step,d=end-q.time,chord=s.chordAt(endSlot),r=route(s,pan),source=s.ac.createBufferSource(),f=s.ac.createBiquadFilter();source.buffer=noise(s.ac);f.type='bandpass';f.Q.value=ice?1.4:.8;f.frequency.setValueAtTime(ice?500:140,q.time);f.frequency.exponentialRampToValueAtTime(ice?4200:2600,end);r.g.gain.setValueAtTime(.0001,q.time);r.g.gain.exponentialRampToValueAtTime((ice?.018:.035)*gain,end-.01);r.g.gain.exponentialRampToValueAtTime(.0001,end+.015);source.connect(f);f.connect(r.p);source.start(q.time);source.stop(end+.02);
 // A rising chord-root octave doubles the filtered air, rather than an unrelated pitch.
 tone(s,chord[0]+12,q.time,d,.012*gain,pan,'sawtooth');tone(s,chord[0]+24,q.time+q.step,q.step,.008*gain,pan,'triangle');
 const pub={endSlot,end,id};plans.set(id,{end,public:pub});source.onended=()=>{source.disconnect();f.disconnect();r.p.disconnect();r.g.disconnect();plans.delete(id)};record({kind:'whoosh',ice,id,slot:q.slot,endSlot,time:q.time,end,gain,pan,note:chord[0]+12});return pub;
}
function impact({slot,power=1,gain=1,pan=0,ice=false}={}){const s=transport(),q=grid();if(!audible(s)||!q||gain<.025)return false;slot=Number.isSafeInteger(slot)?Math.max(slot,Math.floor((s.ac.currentTime-s.beatOrigin)/q.step)):q.slot;const key=slot+':'+(ice?'ice':'fire'),count=slots.get(key)||0;if(count>=(ice?2:1))return false;slots.set(key,count+1);for(const k of slots.keys())if(Number(k.split(':')[0])<slot-32)slots.delete(k);
 const t=s.beatOrigin+slot*q.step,chord=s.chordAt(slot),v=clamp(gain*power,0,1),d=q.step*(ice?1:2);
 if(ice){tone(s,chord[1]+12,t,d,.045*v,pan,'triangle');tone(s,chord[0],t,q.step,.035*v,pan,'sine',true)}else{
  tone(s,chord[0]-24,t,d,.14*v,pan,'sine',true);tone(s,chord[0]-12,t,d,.045*v,pan,'triangle',true);tone(s,chord[2]+12,t,d,.022*v,pan,'square');
 }
 const source=s.ac.createBufferSource(),f=s.ac.createBiquadFilter(),r=route(s,pan);source.buffer=noise(s.ac);f.type=ice?'highpass':'bandpass';f.frequency.value=ice?3200:1800;f.Q.value=ice?.6:.4;r.g.gain.setValueAtTime(.0001,t);r.g.gain.exponentialRampToValueAtTime((ice?.025:.045)*v,t+.004);r.g.gain.exponentialRampToValueAtTime(.0001,t+d);source.connect(f);f.connect(r.p);source.start(t);source.stop(t+d);source.onended=()=>{source.disconnect();f.disconnect();r.p.disconnect();r.g.disconnect()};record({kind:ice?'ice':'crash',slot,time:t,gain:v,pan,notes:ice?[chord[1]+12,chord[0]]:[chord[0]-24,chord[0]-12,chord[2]+12]});return true;
}
document.addEventListener('visibilitychange',()=>{const s=transport();if(stormBus&&s?.ac===busContext)stormBus.gain.setValueAtTime(document.hidden?0:1,s.ac.currentTime)});
Object.assign(A,{stormGrid:grid,stormFlight:flight,stormImpact:impact});window.__stormAudioDebug=()=>({history:history.map(e=>({...e})),flights:plans.size,step:transport()?.beat/4});
})();
