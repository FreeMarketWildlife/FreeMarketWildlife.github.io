import {chooseCue,readAudioSettings,writeAudioSettings} from './cues.js';
const MANIFEST=new URL('../../assets/audio/soundtrack.json',import.meta.url);
const MAX_CACHE_BYTES=34*1024*1024;
export class MusicDirector{
 constructor({storage,onChange=()=>{},contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()}={}){
  this.storage=storage;this.settings=readAudioSettings(storage);this.onChange=onChange;this.contextFactory=contextFactory;
  this.context=null;this.master=null;this.analyser=null;this.manifest=null;this.loadingManifest=null;this.wanted=1;this.current=null;this.pending=null;this.generation=0;this.voices=new Set();this.cache=new Map();this.cacheBytes=0;this.visible=true;this.disposed=false;this.error='';this.worker=null;this.abort=null;this.timer=null;this.renderMs=0;
 }
 notify(){this.onChange(this.snapshot());}
 snapshot(){return {enabled:this.settings.enabled,volume:this.settings.volume,wanted:this.wanted,current:this.current,title:this.manifest?.tracks.find(t=>t.id===this.current)?.title||'',status:this.error?'unavailable':!this.settings.enabled?'muted':!this.context?'locked':this.pending?'loading':this.context.state,activeSources:this.voices.size,cacheBytes:this.cacheBytes,renderMs:this.renderMs,error:this.error};}
 async unlock(){
  if(this.disposed||!this.visible||!this.settings.enabled||!this.settings.volume)return;
  try{
   if(!this.context){this.context=this.contextFactory();this.master=this.context.createGain();this.master.gain.value=this.settings.volume;this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;this.master.connect(this.analyser).connect(this.context.destination);}
   // resume() is called synchronously inside the original tap/key event, before fetching.
   await this.context.resume();this.error='';this.ensure();this.notify();
  }catch{this.error='Music could not start. Tap Music in Options to retry.';this.notify();}
 }
 update(state,panel,origin){const next=chooseCue(state,panel,origin);if(next===this.wanted)return;this.wanted=next;this.cancelPending();this.ensure();}
 async getManifest(){
  if(this.manifest)return this.manifest;
  if(!this.loadingManifest)this.loadingManifest=fetch(MANIFEST).then(r=>{if(!r.ok)throw Error('Soundtrack manifest unavailable');return r.json();}).then(m=>{if(m.version!==1||!Array.isArray(m.tracks)||!m.tracks.length||m.tracks.length>256||new Set(m.tracks.map(t=>t.id)).size!==m.tracks.length)throw Error('Invalid soundtrack manifest');this.manifest=m;return m;}).finally(()=>{this.loadingManifest=null;});
  return this.loadingManifest;
 }
 cancelPending(){this.generation++;this.abort?.abort();this.abort=null;this.worker?.terminate();this.worker=null;clearTimeout(this.timer);this.timer=null;this.pending=null;}
 async ensure(){
  if(this.disposed||!this.visible||!this.settings.enabled||!this.settings.volume||!this.context||this.context.state!=='running'||this.current===this.wanted||this.pending===this.wanted)return;
  const request=++this.generation,id=this.wanted;this.pending=id;this.notify();
  try{
   const manifest=await this.getManifest();if(request!==this.generation)return;
   const track=manifest.tracks.find(t=>t.id===id);if(!track)throw Error('Unknown soundtrack cue');
   if(this.cache.has(id)){const b=this.cache.get(id);this.cache.delete(id);this.cache.set(id,b);this.play(id,b);return;}
   this.abort=new AbortController();const r=await fetch(new URL(track.file,MANIFEST),{signal:this.abort.signal});if(!r.ok)throw Error('MIDI file unavailable');const bytes=await r.arrayBuffer();if(request!==this.generation)return;
   this.worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});const started=performance.now();
   const failed=()=>{if(request!==this.generation)return;this.cancelPending();this.error='Music is unavailable. Tap Music in Options to retry.';this.notify();};
   this.worker.onerror=failed;this.timer=setTimeout(failed,30000);
   this.worker.onmessage=({data})=>{
    if(request!==this.generation||this.disposed)return;
    clearTimeout(this.timer);this.timer=null;this.worker.terminate();this.worker=null;this.abort=null;
    if(data.error){failed();return;}
    const buffer=this.context.createBuffer(2,data.left.length,data.sampleRate);buffer.copyToChannel(data.left,0);buffer.copyToChannel(data.right,1);this.renderMs=Math.round(performance.now()-started);
    const size=buffer.length*buffer.numberOfChannels*4;
    while(this.cache.size&&(this.cacheBytes+size>MAX_CACHE_BYTES||this.cache.size>=2)){const key=this.cache.keys().next().value,b=this.cache.get(key);this.cacheBytes-=b.length*b.numberOfChannels*4;this.cache.delete(key);}
    if(size<=MAX_CACHE_BYTES){this.cache.set(id,buffer);this.cacheBytes+=size;}
    this.play(id,buffer);
   };
   this.worker.postMessage({request,bytes},[bytes]);
  }catch(error){if(request!==this.generation||error.name==='AbortError')return;this.cancelPending();this.error='Music is unavailable. Tap Music in Options to retry.';this.notify();}
 }
 play(id,buffer){
  this.pending=null;if(this.disposed||!this.visible||!this.settings.enabled||this.wanted!==id){this.notify();return;}
  const now=this.context.currentTime;
  // A superseded fade is stopped; no accumulation after quick doorway/menu changes.
  for(const v of [...this.voices]){if(v.retiring){v.source.stop();v.source.disconnect();v.gain.disconnect();this.voices.delete(v);}else{v.retiring=true;v.gain.gain.cancelScheduledValues(now);v.gain.gain.setValueAtTime(v.gain.gain.value,now);v.gain.gain.linearRampToValueAtTime(0,now+.75);v.source.stop(now+.8);}}
  const source=this.context.createBufferSource(),gain=this.context.createGain(),v={source,gain,retiring:false};source.buffer=buffer;source.loop=true;source.connect(gain).connect(this.master);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(1,now+.75);this.voices.add(v);
  source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(v);};source.start(now+.02);this.current=id;this.error='';this.notify();
 }
 save(){if(!writeAudioSettings(this.storage,this.settings))this.error='Music settings could not be saved on this browser.';this.notify();}
 setEnabled(value){this.settings.enabled=!!value;this.cancelPending();if(!value){this.stop();void this.context?.suspend().catch(()=>{});}else void this.unlock();this.save();}
 setVolume(value){this.settings.volume=Math.max(0,Math.min(1,value));if(this.master)this.master.gain.setTargetAtTime(this.settings.volume,this.context.currentTime,.04);if(!this.settings.volume){this.cancelPending();this.stop();void this.context?.suspend().catch(()=>{});}else void this.unlock();this.save();}
 setVisible(value){this.visible=!!value;if(!value){this.cancelPending();void this.context?.suspend().catch(()=>{});}else if(this.context&&this.settings.enabled)void this.unlock();this.notify();}
 stop(){for(const v of this.voices){v.source.onended=null;try{v.source.stop();}catch{}v.source.disconnect();v.gain.disconnect();}this.voices.clear();this.current=null;}
 dispose(){this.disposed=true;this.cancelPending();this.stop();this.cache.clear();this.cacheBytes=0;void this.context?.close().catch(()=>{});}
}
