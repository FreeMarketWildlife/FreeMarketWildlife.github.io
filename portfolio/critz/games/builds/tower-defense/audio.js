(() => {
'use strict';
let ac,master,music,sfx,ambience,ready=false,timer=null,next=0,bar=0,beatOrigin=0,windSource=null,lastSplash=0,lastSizzle=0;
let nightMix=0,arrangementMix=0;
const biomeNames=['mountains','plains','jungle','ocean'];
let biomeTarget={mountains:1,plains:0,jungle:0,ocean:0},biomeMix={...biomeTarget},biomeTime=0;
let biomeArrangement={...biomeTarget},animalCues=0,lastAnimal=null;
const animalSlots=new Map();
let ghostMix=0,ghostPan=0,lastSpiritDeathSlot=-1,spiritCues=0,lastGoldSlot=-1,musicOn=true,sfxOn=true;
let automation,machineSource=()=>[],machineSlot=0,machineVoices=[],machineHistory=[],machineMix=[];
let paused=false;
const volumeKey='skyStack.audio.volume.v1',volumes={master:1,music:1,sfx:1};
try{const saved=JSON.parse(localStorage.getItem(volumeKey)||'null');for(const key of Object.keys(volumes))if(Number.isFinite(saved?.[key]))volumes[key]=Math.max(0,Math.min(1,saved[key]))}catch{}
function applyVolumes(){if(!ac)return;for(const [bus,value] of [[master,.76*volumes.master],[music,musicOn?.43*volumes.music:0],[sfx,sfxOn?.9*volumes.sfx:0],[ambience,sfxOn?.11*volumes.sfx:0],[automation,sfxOn?.45*volumes.sfx:0]])if(bus)bus.gain.setTargetAtTime(value,ac.currentTime,.025)}
function setVolume(key,value){if(!Object.hasOwn(volumes,key)||!Number.isFinite(Number(value)))return;volumes[key]=Math.max(0,Math.min(1,Number(value)));applyVolumes();try{localStorage.setItem(volumeKey,JSON.stringify(volumes))}catch{}return volumes[key]}
async function setPaused(on){paused=!!on;clearInterval(timer);timer=null;if(!ready)return;try{if(paused||document.hidden)await ac.suspend();else{await ac.resume();if(!paused&&!document.hidden){timer=setInterval(schedule,50);schedule()}}}catch{}}
const minerSlots=new Map();
const pendingMinerVoices=new Map();
// Patterns use sixteenth-note positions within a 4/4 bar. Future physical
// facilities only register active sources; gameplay never waits for this clock.
const MACHINE_AUDIO={
 furnace:{pattern:[0],everyBars:1,gain:.034,duration:.26,chordTone:0,octave:-12,timbre:'metal',maxVoices:1},
 sawmill:{pattern:[3,10],everyBars:1,gain:.018,duration:.09,chordTone:1,octave:0,timbre:'wood',maxVoices:1},
 stonecutter:{pattern:[4,12],everyBars:1,gain:.014,duration:.06,chordTone:2,octave:12,timbre:'chisel',maxVoices:1}
};
const BPM=72,beat=60/BPM,barLen=beat*4,hz=midi=>440*Math.pow(2,(midi-69)/12);

// The score is MIDI note data played by tiny Web Audio instruments. No recordings
// or music samples are used, so every performance is generated inside the game.
const SONG=[
 {chord:[50,57,61,64],bass:[38,45],melody:[[1,69,1.5],[3.25,66,.65]]},
 {chord:[47,54,57,62],bass:[35,42],melody:[[.5,66,1],[2.5,69,1.2]]},
 {chord:[43,50,54,57],bass:[31,38],melody:[[1.5,62,1.5]]},
 {chord:[45,52,57,61],bass:[33,40],melody:[[.75,64,.75],[2.75,61,1]]},
 {chord:[50,57,61,66],bass:[38,45],melody:[[.5,69,1.25],[2.5,73,.7]]},
 {chord:[52,59,62,66],bass:[40,47],melody:[[1,71,1.5],[3,69,.7]]},
 {chord:[43,50,54,59],bass:[31,38],melody:[[.75,66,1],[2.25,62,1.5]]},
 {chord:[45,52,57,64],bass:[33,40],melody:[[1.5,64,1],[3.25,61,.5]]},
 {chord:[50,57,61,64],bass:[38,45],melody:[[.5,66,1],[2,69,1.5]]},
 {chord:[47,54,59,62],bass:[35,42],melody:[[1.25,71,1.5]]},
 {chord:[52,59,64,67],bass:[40,47],melody:[[.5,67,.8],[2.5,64,1.2]]},
 {chord:[45,52,57,61],bass:[33,40],melody:[[1,61,1.3],[3,64,.7]]}
],ARP=[0,2,1,3,1,2,0,1];
function env(g,t,a,v,d){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+d)}
function route(node,bus,pan=0){if(bus===music&&!musicOn)return;if(bus===sfx&&!sfxOn)return;if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));node.connect(p);p.connect(bus)}else node.connect(bus)}
function voice(midi,t,d,v,type='triangle',bus=music,pan=0,detune=0,cutoff=1800){const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type=type;o.frequency.value=hz(midi);o.detune.value=detune;f.type='lowpass';f.frequency.value=cutoff;env(g,t,.018,v,d);o.connect(f);f.connect(g);route(g,bus,pan);o.start(t);o.stop(t+d+.06)}
function pad(midi,t,d,pan,mix=0){
 const f=ac.createBiquadFilter(),g=ac.createGain(),lfo=ac.createOscillator(),depth=ac.createGain();f.type='lowpass';f.frequency.value=950-mix*390;const level=.018-mix*.004;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(level,t+.65+mix*.3);g.gain.setValueAtTime(level,t+d-.55);g.gain.exponentialRampToValueAtTime(.0001,t+d+.75);lfo.frequency.value=.18;depth.gain.value=4;lfo.connect(depth);
 for(const [type,cents,level] of [['sine',-5,.78],['triangle',5,.35]]){const o=ac.createOscillator(),og=ac.createGain();o.type=type;o.frequency.value=hz(midi);o.detune.value=cents;og.gain.value=level;depth.connect(o.detune);o.connect(og);og.connect(f);o.start(t);o.stop(t+d+1)}f.connect(g);route(g,music,pan);lfo.start(t);lfo.stop(t+d+1)
}
// The nocturne shares the same harmony and clock, with longer rests and soft echoes.
// Half-time phrasing leaves the 72 BPM Worker and machine grid intact.
const NIGHT_MELODY=[
 [[.5,78,2.8]],[[1,74,2.4]],[[.5,69,2.6],[3.25,66,1.6]],[[1.5,73,2.5]],
 [[.5,78,2.7],[3,81,1.8]],[[1,78,2.8]],[[.75,74,2.8]],[[1.5,76,2.3]],
 [[.5,73,2.8],[3,69,1.7]],[[1.25,74,2.6]],[[.75,76,2.6]],[[1.5,73,2.5]]
];
function setNightMix(value=0){nightMix=Number.isFinite(value)?Math.max(0,Math.min(1,value)):0}
// Spatial weights are supplied by the same saved biome field as the scenery.
// A three-second easing preserves the running score, night blend and work grid.
function updateBiomeMix(){
 const now=ac?.currentTime||0,elapsed=Math.max(0,now-biomeTime),step=1-Math.exp(-elapsed/3);
 for(const key of biomeNames)biomeMix[key]+=(biomeTarget[key]-biomeMix[key])*step;
 biomeTime=now;return biomeMix;
}
function setBiome(weights='mountains'){
 updateBiomeMix();
 const input=typeof weights==='string'?{[weights]:1}:weights||{},nextMix={};let sum=0;
 for(const key of biomeNames){const value=input[key];nextMix[key]=Number.isFinite(value)?Math.max(0,value):0;sum+=nextMix[key];}
 biomeTarget=sum>0?Object.fromEntries(biomeNames.map(key=>[key,nextMix[key]/sum])):{mountains:1,plains:0,jungle:0,ocean:0};
}
function moonBell(midi,t,d,v,pan){
 const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=hz(midi);
 env(g,t,.12,v,d);o.connect(g);route(g,music,pan);o.start(t);o.stop(t+d+.06);
}
function playBar(i,t){
 const p=SONG[i],pan=[-.48,-.15,.17,.48],n=nightMix,day=1-n,b={...updateBiomeMix()};arrangementMix=n;biomeArrangement=b;
 p.chord.forEach((note,j)=>pad(note,t,barLen*.98,pan[j],n));
 voice(p.bass[0],t,beat*(1.7+n),.028-.01*n,'triangle',music,-.08,0,600-180*n);
 if(day>.001){
  voice(p.bass[1],t+beat*2,beat*1.45,.021*day,'triangle',music,.08,0,560);
  for(let s=0;s<8;s++){if((i+s)%7===5)continue;voice(p.chord[ARP[s]]+12,t+s*beat*.5,beat*(.34+.1*b.ocean),.011*day*(1-.14*b.ocean),'triangle',music,s%2?.2:-.2,s%3===0?-3:2,1250+180*b.plains-200*b.ocean)}
  for(const [o,note,d] of p.melody)voice(note,t+o*beat,d*beat,.018*day,'sine',music,o<2?-.16:.16,0,1400);
  voice(38,t,.16,(i%4===0?.018:.012)*day,'sine',music,0,0,420);
  voice(38,t+beat*2,.16,.01*day,'sine',music,0,0,420);
 }
 if(n>.001){
  for(const [o,note,d] of NIGHT_MELODY[i]){
   moonBell(note,t+o*beat,d*beat,.014*n,i%2?.35:-.35);
   moonBell(note,t+(o+.75)*beat,d*beat,.003*n,i%2?-.42:.42);
  }
  for(const [o,tone] of [[0,1],[2.5,3]])moonBell(p.chord[tone]+12,t+o*beat,beat*1.6,.008*n,o?-.5:.5);
 }
 // Small harmonic color changes sit beneath the melody. Every region uses the
 // same chord, 72 BPM and bar phase, so moving across a border never restarts music.
 const soft=1-.55*n;
 if(b.mountains>.001)moonBell(p.chord[2]+24,t+beat*2.5,beat*1.65,.0028*b.mountains*soft,-.38);
 if(b.plains>.001)for(const [o,tone] of [[.5,1],[2.5,2]])voice(p.chord[tone]+12,t+o*beat,beat*.58,.004*b.plains*soft,'triangle',music,o<2?-.34:.34,0,1550);
 if(b.jungle>.001)for(const [o,tone] of [[.75,0],[1.5,2],[3.25,1]])voice(p.chord[tone]+12,t+o*beat,beat*.3,.0048*b.jungle*soft,'sine',music,o<2?-.4:.4,0,1900);
 if(b.ocean>.001){moonBell(p.chord[1]+12,t+beat*.75,beat*2.8,.0045*b.ocean*soft,.42);moonBell(p.chord[1]+12,t+beat*1.5,beat*2.1,.0014*b.ocean*soft,-.42);}
}
function schedule(){if(!ready||paused||ac.state!=='running'||document.hidden)return;while(next<ac.currentTime+1){playBar(bar,next);playGhostBar(bar,next);next+=barLen;bar=(bar+1)%SONG.length}scheduleMachines()}
function start(){clearInterval(timer);next=ac.currentTime+.08;beatOrigin=next;bar=0;machineSlot=0;minerSlots.clear();lastSpiritDeathSlot=-1;timer=setInterval(schedule,50);schedule()}
function setMachineSource(source){machineSource=typeof source==='function'?source:()=>[]}
function scheduleMachines(){
 const now=ac.currentTime,step=beat/4;
 machineVoices=machineVoices.filter(v=>v.end>now);
 // Skip elapsed slots after a stall; never replay a backlog of missed actions.
 machineSlot=Math.max(machineSlot,Math.ceil((now-beatOrigin)/step),0);
 while(beatOrigin+machineSlot*step<now+.15){
   const slot=machineSlot++,t=beatOrigin+slot*step,barIndex=Math.floor(slot/16),subdivision=slot%16;
   const chord=SONG[barIndex%SONG.length].chord,groups=new Map();
   for(const m of machineSource()){
     if(!m.active||!MACHINE_AUDIO[m.type]||!Number.isFinite(m.gain)||m.gain<.012)continue;
     const group=groups.get(m.type)||[];group.push(m);groups.set(m.type,group);
   }
   machineMix=[];
   for(const [type,list] of groups){
     const d=MACHINE_AUDIO[type];list.sort((a,b)=>b.gain-a.gain);
     const strongest=list[0],sum=list.reduce((n,m)=>n+m.gain,0);
     // One combined voice per instrument, modest count accent, bounded headroom.
     const gain=d.gain*Math.min(1,strongest.gain)*(1+Math.min(.3,Math.log2(1+sum)*.065));
     const pan=list.reduce((n,m)=>n+(m.pan||0)*m.gain,0)/sum;
     machineMix.push({type,count:list.length,gain,pan,pattern:d.pattern});
     if(barIndex%d.everyBars||!d.pattern.includes(subdivision)||machineVoices.length>=6||machineVoices.filter(v=>v.type===type).length>=d.maxVoices)continue;
     const midi=chord[d.chordTone%chord.length]+d.octave;
     voice(midi,t,d.duration,gain,d.timbre==='wood'?'sine':'triangle',automation,pan,0,d.timbre==='metal'?850:2400);
     if(d.timbre==='metal')voice(chord[1]-12,t+.018,d.duration*.65,gain*.2,'sine',automation,pan,0,1100);
     machineVoices.push({type,start:t,end:t+d.duration+.06});
     machineHistory.push({type,t,bar:barIndex,subdivision,midi,chord:[...chord],gain,pan,count:list.length});
     if(machineHistory.length>64)machineHistory.shift();
   }
 }
}

function makeNoise(seconds=4){const length=Math.floor(ac.sampleRate*seconds),buffer=ac.createBuffer(1,length,ac.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<length;i++){last=last*.985+(Math.random()*2-1)*.015;data[i]=last}return buffer}
function startAmbience(){if(windSource)return;windSource=ac.createBufferSource();windSource.buffer=makeNoise(6);windSource.loop=true;const hi=ac.createBiquadFilter(),lo=ac.createBiquadFilter(),g=ac.createGain(),lfo=ac.createOscillator(),move=ac.createGain();hi.type='highpass';hi.frequency.value=110;lo.type='lowpass';lo.frequency.value=760;g.gain.value=.055;lfo.frequency.value=.055;move.gain.value=.018;lfo.connect(move);move.connect(g.gain);windSource.connect(hi);hi.connect(lo);lo.connect(g);route(g,ambience,-.12);windSource.start();lfo.start()}
function birdAt(t,pan,midi){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(hz(midi),t);o.frequency.exponentialRampToValueAtTime(hz(midi+7),t+.07);o.frequency.exponentialRampToValueAtTime(hz(midi+2),t+.16);env(g,t,.012,.018,.2);o.connect(g);route(g,ambience,pan);o.start(t);o.stop(t+.22)}
function scheduleBirds(){if(!ready||ac.state!=='running'||document.hidden||nightMix>.35)return;const t=ac.currentTime+1+Math.random()*3,n=76+Math.floor(Math.random()*8);birdAt(t,Math.random()*1.4-.7,n);if(Math.random()>.55)birdAt(t+.27,Math.random()*1.4-.7,n+2)}

function toneAt(freq,t,d=.08,v=.08,type='triangle',slide=0,bus=sfx,pan=0){if(!ready)return;const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(1,slide),t+d);env(g,t,.004,Math.max(.0001,v),d);o.connect(g);route(g,bus,pan);o.start(t);o.stop(t+d+.03)}
function tone(freq,d=.08,v=.08,type='triangle',slide=0){if(ready)toneAt(freq,ac.currentTime,d,v,type,slide)}
function noiseAt(t,d=.18,v=.04,cut=1800,pan=0,bus=sfx){if(!ready)return;const src=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();src.buffer=makeNoise(Math.max(.25,d));f.type='lowpass';f.frequency.value=cut;env(g,t,.006,Math.max(.0001,v),d);src.connect(f);f.connect(g);route(g,bus,pan);src.start(t);src.stop(t+d+.02)}
function noise(d=.18,v=.04,cut=1800){if(ready)noiseAt(ac.currentTime,d,v,cut)}
function animalSound(species,pan=0,gain=1){
 if(!['bird','butterfly','worm','mole','rabbit','firefly'].includes(species))return false;
 if(!ready){ensure().then(()=>{if(ready)animalSound(species,pan,gain)});return false;}
 if(ac.state!=='running'||document.hidden||!sfxOn)return false;
 const t=ac.currentTime,previous=animalSlots.get(species);
 if(previous!==undefined&&t-previous<.1)return false;
 animalSlots.set(species,t);pan=Number.isFinite(pan)?Math.max(-1,Math.min(1,pan)):0;gain=Number.isFinite(gain)?Math.max(0,Math.min(1,gain)):1;
 if(!gain)return false;
 // Tiny species use stylized wing/soil rustles; they are tactile sound cues,
 // while the bird whistle and mammal squeaks retain a small, gentle voice.
 if(species==='bird'){
  toneAt(1720,t,.1,.027*gain,'sine',2350,sfx,pan);toneAt(2150,t+.12,.14,.022*gain,'sine',1560,sfx,pan);
 }else if(species==='butterfly'){
  noiseAt(t,.09,.065*gain,3900,pan);noiseAt(t+.11,.08,.045*gain,3100,pan);
 }else if(species==='worm'){
  noiseAt(t,.18,.13*gain,850,pan);toneAt(145,t,.1,.011*gain,'sine',115,sfx,pan);
 }else if(species==='mole'){
  noiseAt(t,.21,.12*gain,1100,pan);toneAt(440,t+.03,.12,.022*gain,'triangle',340,sfx,pan);toneAt(530,t+.17,.08,.012*gain,'sine',370,sfx,pan);
 }else if(species==='rabbit'){
  toneAt(970,t,.1,.024*gain,'sine',1300,sfx,pan);toneAt(1180,t+.11,.12,.017*gain,'sine',850,sfx,pan);noiseAt(t+.08,.13,.03*gain,1600,pan);
 }else{
  noiseAt(t,.16,.055*gain,4400,pan);toneAt(185,t,.12,.008*gain,'sine',210,sfx,pan);
 }
 animalCues++;lastAnimal=species;return true;
}
function stoneStrike(broken,gain=1,pan=0,midi=67){
 const t=ac.currentTime,d=.085;
 const buffer=ac.createBuffer(1,Math.ceil(ac.sampleRate*d),ac.sampleRate),samples=buffer.getChannelData(0);
 for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
 const source=ac.createBufferSource(),filter=ac.createBiquadFilter(),g=ac.createGain();source.buffer=buffer;filter.type='highpass';filter.frequency.value=2400;
 env(g,t,.002,.06*gain,d);source.connect(filter);filter.connect(g);route(g,sfx,pan);source.start(t);source.stop(t+d+.02);
 voice(midi,t,.045,.055*gain,'triangle',sfx,pan,0,3000);
 // Breaking keeps the same strike, with only a faint breath of debris after it.
 if(broken){const hiss=ac.createBufferSource(),band=ac.createBiquadFilter(),level=ac.createGain();hiss.buffer=buffer;band.type='bandpass';band.frequency.value=4200;band.Q.value=.7;env(level,t+.025,.008,.006*gain,.075);hiss.connect(band);band.connect(level);route(level,sfx,pan);hiss.start(t+.025);hiss.stop(t+.105)}
}
let bellCues=0;
function bellCollect(gain=1,pan=0){
 if(!ready||paused||ac.state!=='running'||document.hidden||!sfxOn||volumes.sfx===0||gain<.012)return false;
 const step=beat/4,slot=Math.max(0,Math.floor((ac.currentTime-beatOrigin)/step));if(slot===lastGoldSlot)return false;lastGoldSlot=slot;
 const chord=SONG[((Math.floor(slot/16)%SONG.length)+SONG.length)%SONG.length].chord,t=ac.currentTime+.008;
 // A quick bright ding blooms into a short, playful ascending bell chord.
 [chord[0]+24,chord[1]+24,chord[2]+36].forEach((note,i)=>{const time=t+i*.055;for(const [partial,level]of [[0,.05],[12,.013],[19,.004]]){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=hz(note+partial);env(g,time,.002,level*Math.min(1,gain),.28-i*.035);o.connect(g);route(g,sfx,pan);o.start(time);o.stop(time+.34)}});bellCues++;return true;
}
let nailCues=0,lastNailBeat=null,lastNailTime=null;
function nailHammer(beatIndex=null){
 if(!ready||paused||ac.state!=='running'||document.hidden||!sfxOn||volumes.sfx===0)return false;
 const slot=Number.isInteger(beatIndex)?beatIndex:Math.max(0,Math.ceil((ac.currentTime+.015-beatOrigin)/beat));
 if(slot===lastNailBeat)return false;lastNailBeat=slot;
 const t=Math.max(ac.currentTime,beatOrigin+slot*beat),chord=SONG[((Math.floor(slot/4)%SONG.length)+SONG.length)%SONG.length].chord;
 voice(chord[0]+12,t,.075,.09,'triangle',sfx,0,0,2200);
 for(const [offset,level]of [[24,.05],[43,.017]])voice(chord[0]+offset,t,.13,level,'sine',sfx,0,0,9000);
 const source=ac.createBufferSource(),filter=ac.createBiquadFilter(),g=ac.createGain(),duration=.035,buffer=ac.createBuffer(1,Math.ceil(ac.sampleRate*duration),ac.sampleRate),data=buffer.getChannelData(0);
 for(let n=0;n<data.length;n++)data[n]=Math.random()*2-1;
 source.buffer=buffer;filter.type='bandpass';filter.frequency.value=3400;filter.Q.value=1.2;env(g,t,.001,.09,duration);source.connect(filter);filter.connect(g);route(g,sfx,0);source.start(t);source.stop(t+.055);
 nailCues++;lastNailTime=t;return true;
}
// Half-note inspector chimes share the score chord and audio clock.
let inspectCues=0,lastInspectBeat=null,lastInspectTime=null;
function inspectCue(beatIndex){
 if(!ready||paused||ac.state!=='running'||document.hidden||!sfxOn||volumes.sfx===0||!Number.isInteger(beatIndex)||beatIndex%2!==0)return false;
 if(beatIndex===lastInspectBeat)return false;
 const t=beatOrigin+beatIndex*beat;if(t<ac.currentTime-.035)return false;
 const chord=SONG[((Math.floor(beatIndex/4)%SONG.length)+SONG.length)%SONG.length].chord;
 voice(chord[1]+24,Math.max(t,ac.currentTime),.15,.055,'sine',sfx,0,0,9000);
 voice(chord[2]+36,Math.max(t,ac.currentTime)+.04,.12,.018,'sine',sfx,0,0,9000);
 inspectCues++;lastInspectBeat=beatIndex;lastInspectTime=t;return true;
}
// A varied chord-tone reward on completion's half-note boundary.
let discoveryCues=0,lastDiscoveryBeat=null,discoveryHistory=[],discoveryBuses=new Map();
function cancelDiscoveryCue(id){const node=discoveryBuses.get(id);if(!node)return;node.disconnect();discoveryBuses.delete(id);const event=discoveryHistory.find(e=>e.id===id);if(event)event.cancelled=true;if(event?.beatIndex===lastDiscoveryBeat)lastDiscoveryBeat=null;}
function discoveryCue(beatIndex,seed=0){
 if(!ready||paused||document.hidden||ac.state!=='running'||!sfxOn||volumes.sfx===0||!Number.isInteger(beatIndex)||beatIndex%2!==0||lastDiscoveryBeat===beatIndex)return false;
 const time=beatOrigin+beatIndex*beat;if(time<ac.currentTime-.10||time>ac.currentTime+beat*2+.12)return false;
 const bus=ac.createGain();bus.connect(sfx);const id=++discoveryCues;discoveryBuses.set(id,bus);for(const [old,node]of discoveryBuses)if(old<id-8){node.disconnect();discoveryBuses.delete(old)}
 const variant=Math.abs(Math.trunc(seed))%4,chord=SONG[((Math.floor(beatIndex/4)%SONG.length)+SONG.length)%SONG.length].chord,t=Math.max(time,ac.currentTime),octave=variant%2?12:24;
 for(const [i,note]of [chord[0]+octave,chord[2]+octave,chord[1]+24].entries())voice(note,t,beat*(.35+i*.12),[.027,.018,.012][i],variant<2?'sine':'triangle',bus,(i-1)*.16,0,2400);
 // Three tiny filtered crackles, deliberately quieter than the pitched reward.
 for(let i=0;i<3;i++)noiseAt(t+i*beat/8,.018,.004,1100+variant*300,i%2?.2:-.2,bus);
 lastDiscoveryBeat=beatIndex;discoveryHistory.push({id,beatIndex,time,variant,notes:[chord[0]+octave,chord[2]+octave,chord[1]+24]});if(discoveryHistory.length>24)discoveryHistory.shift();return id;
}
// Level-ups have a recognizable ascending, plucked motif, distinct from discoveries.
let levelRewardBus=null,levelRewardHistory=[];
function cancelLevelReward(){if(levelRewardBus){levelRewardBus.disconnect();levelRewardBus=null}}
function levelReward(tier=1,seed=0){
 const r=rhythm();if(!r.ready||paused||document.hidden)return null;
 tier=Math.max(1,Math.min(3,Math.trunc(tier)||1));
 const beatIndex=Math.max(0,Math.ceil((ac.currentTime+.025-beatOrigin)/barLen)*4),time=beatOrigin+beatIndex*beat,plan={tier,beatIndex,time,beats:tier===3?4:2};
 cancelLevelReward();levelRewardHistory.push(plan);if(levelRewardHistory.length>16)levelRewardHistory.shift();
 if(!sfxOn||volumes.sfx===0)return plan;
 const bus=levelRewardBus=ac.createGain();bus.connect(sfx);
 const chord=SONG[(beatIndex/4)%SONG.length].chord,variant=Math.abs(Math.trunc(seed))%3;
 const motif=tier===1?[[0,0],[.5,2],[1,3]]:tier===2?[[0,0],[.5,1],[1,2],[1.5,3]]:[[0,0],[.5,1],[1,2],[1.5,3],[2,0]];
 for(const [offset,index]of motif){const note=chord[index]+12+(tier===3&&offset===2?12:0),t=time+offset*beat;
 voice(note,t,beat*(.22+tier*.045),.026+tier*.004,'triangle',bus,(index-1.5)*.10,0,1800+variant*200);
 voice(note+12,t,beat*.18,.006+tier*.002,'sine',bus,0,0,3200);
 }
 if(tier>1)voice(chord[0],time,beat*(tier===3?2.5:1),.013+tier*.003,'triangle',bus,0,0,1000);
 return plan;
}
// Legacy callers use the same currency pickup sound.
function goldChaching(gain=1,pan=0){return bellCollect(gain,pan)}

let pickStroke=null;
function beginPickStroke(){pickStroke=new Map()}
function endPickStroke(){const hits=pickStroke;pickStroke=null;if(hits)for(const [material,broken] of hits)hit(material,broken)}
function dirtKick(gain=1,pan=0){
 if(!ready||ac.state!=='running')return;
 const t=ac.currentTime,level=Math.max(0,Math.min(1,gain));
 // A fast pitch drop gives soil a kick-drum thump; the upper body keeps it
 // audible on small speakers at a similar level to the stone snare.
 const body=ac.createOscillator(),amp=ac.createGain();body.type='sine';
 body.frequency.setValueAtTime(170,t);body.frequency.exponentialRampToValueAtTime(62,t+.055);body.frequency.exponentialRampToValueAtTime(48,t+.18);
 env(amp,t,.002,.15*level,.19);body.connect(amp);route(amp,sfx,pan);body.start(t);body.stop(t+.22);
 toneAt(260,t,.055,.035*level,'triangle',95,sfx,pan);
}
function hit(material,broken=false){if(pickStroke){pickStroke.set(material,broken||pickStroke.get(material)||false);return}if(!ready)return;if(material==='dirt')return dirtKick();if(material==='stone')return stoneStrike(broken);const midi={dirt:43,deepslate:40,obsidian:35}[material]||43;voice(midi,ac.currentTime,broken?.2:.09,broken?.1:.065,'triangle',sfx,0,0,material==='dirt'?700:1200);if(broken)noise(.12,.025,material==='dirt'?650:1800)}
function rhythm(){if(!ready||ac.state!=='running')return{ready:false,bpm:BPM,beatMs:beat*1000,beatIndex:-1,barBeat:0,phase:0};const pos=(ac.currentTime-beatOrigin)/beat,index=Math.floor(pos);return{ready:true,epoch:beatOrigin,bpm:BPM,beatMs:beat*1000,beatIndex:index,barBeat:((index%4)+4)%4,phase:pos-index}}
function minerHit(material,gain=1,pan=0,broken=false){
 if(!ready||ac.state!=='running'||document.hidden||gain<.012)return;
 const pos=Math.max(0,(ac.currentTime-beatOrigin)/beat),slot=Math.floor(pos*2),key=material+':'+slot;
 for(const [k,s] of minerSlots)if(s<slot-1)minerSlots.delete(k);
 // Mining remains tied to actual hits. At most one shared strike per material
 // per eighth-note window prevents crowds multiplying the percussion volume.
 const pending=pendingMinerVoices.get(key);
 if(pending){pending.broken||=broken;if(gain>pending.gain){pending.gain=gain;pending.pan=pan}return}
 if(minerSlots.has(key))return;minerSlots.set(key,slot);
 const chord=SONG[Math.floor(pos/4)%SONG.length].chord,midi=chord[material==='stone'?1:0]+(material==='deepslate'?-12:0);
 const event={gain,pan,broken};pendingMinerVoices.set(key,event);
 // Aggregate a simulation frame before rendering its strike, so nearby workers
 // dominate even if a distant worker appears first in the worker collection.
 queueMicrotask(()=>{
   pendingMinerVoices.delete(key);if(ac.state!=='running'||document.hidden)return;
   const {gain,pan,broken}=event;
   if(material==='dirt')return dirtKick(gain,pan);
   if(material==='stone')return stoneStrike(broken,gain,pan,midi);
   voice(midi,ac.currentTime,.12,.055*Math.min(1,gain),'triangle',sfx,pan,0,900);if(broken)noiseAt(ac.currentTime,.1,.02*gain,1300,pan);
 });
}
// Breath-like, gently detuned ghost notes follow the score's actual chord and
// eighth-note grid. Nearby ghosts add a sparse counter-melody to each music bar.
function ghostVoice(midi,t,d,v,pan){
 const o=ac.createOscillator(),lfo=ac.createOscillator(),depth=ac.createGain(),f=ac.createBiquadFilter(),g=ac.createGain();
 o.type='sine';o.frequency.setValueAtTime(hz(midi-.25),t);o.frequency.exponentialRampToValueAtTime(hz(midi),t+.18);
 lfo.frequency.value=4.4;depth.gain.value=22;lfo.connect(depth);depth.connect(o.detune);
 f.type='lowpass';f.frequency.value=1350;env(g,t,.1,v,d);o.connect(f);f.connect(g);route(g,music,pan);
 o.start(t);lfo.start(t);o.stop(t+d+.06);lfo.stop(t+d+.06)
}
function playGhostBar(i,t){
 if(ghostMix<.012)return;const p=SONG[i],v=.024*ghostMix;
 ghostVoice(p.chord[2]+12,t+beat*.5,beat*1.45,v,ghostPan);
 ghostVoice(p.chord[0]+24,t+beat*2.5,beat*1.2,v*.7,-ghostPan*.6);
 ghostVoice(p.chord[2]+12,t+beat*1.25,beat*.8,v*.2,ghostPan*.5)
}
function setGhostPresence(gain=0,pan=0){ghostMix=Math.max(0,Math.min(1,gain));ghostPan=Math.max(-1,Math.min(1,pan))}
// Gameplay departures share the score's next 4/4 downbeat, even with Effects muted.
let departureEvents=[],lastErrorSlot=-1;
function deathCue(kind='worker',gain=1,pan=0,beats=1){
 const r=rhythm();if(!r.ready||paused||document.hidden)return null;
 const slot=Math.max(0,Math.ceil((ac.currentTime+.015-beatOrigin)/barLen));
 const t=beatOrigin+slot*barLen,duration=[0,1,2,4].includes(beats)?beats:1;
 const p=SONG[slot%SONG.length],notes=[p.chord[2]+12,p.chord[0]+12];
 const event={kind,beatIndex:slot*4,time:t,end:t+duration*beat,beats:duration};
 departureEvents.push(event);if(departureEvents.length>32)departureEvents.shift();
 if(sfxOn&&volumes.sfx>0&&gain>=.012&&slot!==lastSpiritDeathSlot){
  lastSpiritDeathSlot=slot;
  // A single soft falling interval; both voices attack on 1, never between bars.
  notes.forEach((n,i)=>ghostVoice(n,t,Math.max(.12,duration*beat)*(.9-i*.12),.035*Math.min(1,gain)*(i?.65:1),pan));spiritCues++;
 }
 return event;
}
function miningError(reason='blocked',pan=0){
 if(!ready||paused||document.hidden||ac.state!=='running'||!sfxOn||volumes.sfx===0)return false;
 const slot=Math.max(0,Math.ceil((ac.currentTime+.015-beatOrigin)/beat));
 if(slot===lastErrorSlot)return false;lastErrorSlot=slot;
 const t=beatOrigin+slot*beat,p=SONG[Math.floor(slot/4)%SONG.length];
 voice(p.chord[1]+12,t,beat*.22,.022,'triangle',sfx,pan,0,1100);
 voice(p.chord[0]+12,t+beat*.25,beat*.28,.018,'sine',sfx,pan,0,900);
 return true;
}
function spiritCue(kind,gain=1,pan=0){
 if(kind==='death')return deathCue('worker',gain,pan);
 if(!ready||ac.state!=='running'||gain<.012)return;
 const step=beat*.5,slot=Math.max(0,Math.ceil((ac.currentTime+.015-beatOrigin)/step)),t=beatOrigin+slot*step;
 if(kind==='death'&&slot===lastSpiritDeathSlot)return;if(kind==='death')lastSpiritDeathSlot=slot;
 const index=((Math.floor((t-beatOrigin)/barLen)%SONG.length)+SONG.length)%SONG.length,p=SONG[index];
 const notes=kind==='revive'?[p.chord[0]+12,p.chord[1]+12,p.chord[2]+12,p.chord[0]+24]:[p.chord[2]+12,p.chord[1]+12,p.chord[0]+12];
 notes.forEach((n,i)=>ghostVoice(n,t+i*step,beat*(kind==='revive'?.65:1.1),.05*gain*(1-i*.13),pan));
 if(kind==='revive')noiseAt(ac.currentTime,.09,.017*gain,1600,pan);
 spiritCues++
}
let lastFeySparkSlot=-1,feySparkCues=0;
function feySpark(id=0,pan=0){
 if(!ready||ac.state!=='running'||!musicOn)return false;
 const step=beat*.5,slot=Math.ceil((ac.currentTime+.015-beatOrigin)/step);
 if(slot===lastFeySparkSlot)return false;lastFeySparkSlot=slot;
 const t=beatOrigin+slot*step,index=((Math.floor(slot/8)%SONG.length)+SONG.length)%SONG.length;
 moonBell(SONG[index].chord[Math.abs(id)%4]+24,t,beat*.8,.012,pan);feySparkCues++;return true;
}
function setMusicEnabled(on){musicOn=!!on;applyVolumes();return musicOn}
function setSfxEnabled(on){sfxOn=!!on;applyVolumes();return sfxOn}
function place(material,cost=1){if(!ready)return;voice(material==='deepslate'?36:material==='stone'?43:48,ac.currentTime,.14,.07+Math.min(.03,cost*.002),'triangle',sfx,0,0,700)}
function unlock(){if(!ready)return;const t=ac.currentTime;[62,66,69,74].forEach((m,i)=>voice(m,t+i*.09,.48,.05,'sine',sfx,(i-1.5)*.12))}
function ui(){tone(620,.035,.018,'sine')}
function splash(kind='water'){if(!ready||performance.now()-lastSplash<180)return;lastSplash=performance.now();if(kind==='lava'){tone(92,.23,.05,'triangle',64);noise(.12,.014,520)}else{tone(360,.13,.026,'sine',205);noise(.07,.012,2200)}}
function sizzle(){if(!ready||performance.now()-lastSizzle<120)return;lastSizzle=performance.now();noise(.24,.045,3000);tone(170,.16,.03,'triangle',90)}
async function ensure(){if(paused)return;if(ready){if(ac.state==='suspended')try{await ac.resume()}catch{};return}try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();master=ac.createGain();const comp=ac.createDynamicsCompressor();music=ac.createGain();sfx=ac.createGain();ambience=ac.createGain();automation=ac.createGain();automation.gain.value=.45;automation.connect(master);master.gain.value=.76;music.gain.value=.43;sfx.gain.value=.9;ambience.gain.value=.11;music.connect(master);sfx.connect(master);ambience.connect(master);master.connect(comp);comp.connect(ac.destination);await ac.resume();ready=true;applyVolumes();start();startAmbience();setInterval(scheduleBirds,9000);if(paused){clearInterval(timer);timer=null;await ac.suspend()}}catch(e){console.warn('Audio start failed',e)}}
document.addEventListener('pointerdown',ensure,{capture:true});document.addEventListener('keydown',ensure,{capture:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInterval(timer);timer=null}else if(ready&&!paused)ac.resume().then(()=>{if(!paused){timer=setInterval(schedule,50);schedule()}}).catch(()=>{})});
function meteorImpact(power=1,pan=0){if(!ready||paused||!sfxOn||ac.state!=='running')return;const t=ac.currentTime;const chord=SONG[Math.max(0,Math.floor(rhythm().beatIndex/4))%SONG.length].chord;toneAt(hz(chord[0]-24),t,.32,.15*power,'sine',35,sfx,pan);noiseAt(t,.24,.04*power,580,pan);toneAt(hz(chord[1]),t,.09,.025*power,'triangle',0,sfx,pan)}
function defenseCue(kind,pan=0){if(!ready||paused||!sfxOn||ac.state!=='running')return;const step=beat/4,slot=Math.ceil((ac.currentTime+.01-beatOrigin)/step),t=beatOrigin+slot*step,chord=SONG[((Math.floor(slot/16)%SONG.length)+SONG.length)%SONG.length].chord;const note=chord[kind==='magic'?2:0]+(kind==='fire'?0:kind==='alarm'?12:-12);toneAt(hz(note),t,.13,.035,'triangle',0,sfx,pan);if(kind==='impact'||kind==='hit')noiseAt(t,.05,.009,700,pan)}
window.SkyAudio={defenseCue,levelReward,cancelLevelReward,discoveryCue,cancelDiscoveryCue,deathCue,miningError,meteorImpact,setPaused,setVolume,getVolumes:()=>({...volumes}),inspectCue,nailHammer,bellCollect,feySpark,ensure,beginPickStroke,endPickStroke,hit,minerHit,rhythm,place,unlock,ui,splash,sizzle,spiritCue,setGhostPresence,goldChaching,setMachineSource,setMusicEnabled,setSfxEnabled,setNightMix,setBiome,animalSound,bpm:BPM};
window.__skyStackAudioDebug=()=>({levelRewardHistory,discoveryCues,discoveryHistory,departureEvents,lastErrorSlot,inspectCues,lastInspectBeat,lastInspectTime,nailCues,lastNailBeat,lastNailTime,bellCues,paused,contextState:ac?.state??'uninitialized',audioTime:ac?.currentTime??0,volumes:{...volumes},feySparkCues,ready,bpm:BPM,bar,scoreBars:SONG.length,midiOnly:true,nightMix,arrangementMix,arrangement:arrangementMix>.65?'nocturne':arrangementMix>.1?'twilight':'day',biome:{target:{...biomeTarget},mix:{...biomeMix},arrangement:{...biomeArrangement}},animalCues,lastAnimal,wind:!!windSource,musicGain:music?.gain?.value??null,ambienceGain:ambience?.gain?.value??null,ghostMix,spiritCues,automation:{beatOrigin,beat:rhythm().beatIndex,currentBar:Math.floor(rhythm().beatIndex/4),subdivision:Math.floor(rhythm().phase*4),definitions:MACHINE_AUDIO,mix:machineMix,activeVoices:machineVoices.filter(v=>v.end>(ac?.currentTime||0)).length,events:machineHistory,minerVoices:minerSlots.size}});
document.documentElement.dataset.audioEngine='midi-ready';
// Storm-only bridge: separate storm scoring leaves death/error voices independent.
window.SkyAudio.stormTransportV89=()=>({ac,sfx,ready,paused,sfxOn,volumes:{...volumes},beat,beatOrigin,chordAt:slot=>SONG[((Math.floor(slot/16)%SONG.length)+SONG.length)%SONG.length].chord});
})();
