/** Original synthesized cues. No assets, autoplay, persistent loops, or physics side effects. */
export const AUDIO_EVENTS = Object.freeze(['unlatch', 'launch', 'impact', 'coin', 'shop', 'enemy', 'wind', 'zone','ratchet','ready','reroll','pack','purchase','score','click','bumper','sparkle','bonk','rustle','sap','creak','swish','releasePop']);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
export function soundSpec(event, intensity = 1, { material = 'wood', mass = 1, variant = 0, biome = 'openSky' } = {}) {
  const strength = clamp(intensity, 0, 1);
  const notes={space:659,grandfatherTree:392,openSky:523,jungleCanopy:330,forestFloor:262};
  const cues = {
    unlatch: {frequency:180,endFrequency:105,duration:.10,gain:.07,type:'triangle',noise:.06},
    launch: { frequency: 210, endFrequency: 560, duration: .32, gain: .14, type: 'triangle', noise: .23 },
    creak:{frequency:105,endFrequency:63,duration:.24,gain:.042,type:'triangle',noise:.08,noiseFrequency:450},
    swish:{frequency:240,endFrequency:950,duration:.34,gain:.048,type:'sine',noise:.72,noiseFrequency:1800},
    releasePop:{frequency:622,endFrequency:1046.5,duration:.16,gain:.09,type:'sine',harmony:1.5},
    impact: { frequency: 190 + strength * 100, endFrequency: 76, duration: .12 + strength * .12, gain: .14, type: 'sine', noise: .12, harmony: 1.9, bend: 1.18, noiseFrequency: 900 },
    coin: { frequency: 880, endFrequency: 1320, duration: .19, gain: .09, type: 'sine', harmony: 1.5 },
    shop: { frequency: 440, endFrequency: 660, duration: .3, gain: .08, type: 'triangle', harmony: 1.25 },
    enemy: { frequency: 280, endFrequency: 110, duration: .23, gain: .11, type: 'triangle', harmony: 1.03 },
    zone: {frequency:Object.hasOwn(notes,biome)?notes[biome]:392,endFrequency:392,duration:.32,gain:.045,type:'sine',harmony:1.5},
    wind: { frequency: 350, endFrequency: 800, duration: .45, gain: .035, type: 'sine', noise: 1 },
    ratchet: {frequency:580,endFrequency:220,duration:.045,gain:.095,type:'triangle',noise:.13,noiseFrequency:2300},
    ready: {frequency:1046.5,endFrequency:1046.5,duration:.32,gain:.12,type:'sine',harmony:1.5},
    reroll: {frequency:210,endFrequency:680,duration:.18,gain:.13,type:'triangle',noise:.2,noiseFrequency:1700},
    pack: {frequency:660,endFrequency:1320,duration:.42,gain:.12,type:'sine',harmony:1.25,noise:.08},
    purchase: {frequency:783.99,endFrequency:1046.5,duration:.27,gain:.14,type:'sine',harmony:1.5},
    score: {frequency:1318.5,endFrequency:1568,duration:.34,gain:.11,type:'sine',harmony:1.5},
    bumper: {frequency:523.25,endFrequency:783.99,duration:.22,gain:.14,type:'sine',harmony:2,bend:1.35,noise:.025},
    rustle:{frequency:540,endFrequency:290,duration:.13,gain:.045,type:'sine',noise:.7,noiseFrequency:2300},
    sap:{frequency:170,endFrequency:48,duration:.22,gain:.1,type:'triangle',harmony:1.25,bend:1.65,noise:.16,noiseFrequency:700},
    bonk: {frequency:240,endFrequency:95,duration:.19,gain:.09,type:'triangle',harmony:1.5,bend:1.8,noise:.04},
    sparkle: {frequency:1568,endFrequency:2093,duration:.3,gain:.065,type:'sine',harmony:1.5},
    click: {frequency:440,endFrequency:330,duration:.055,gain:.06,type:'triangle'},
  };
  let cue = Object.hasOwn(cues, event) ? cues[event] : null;
  if (!cue) return null;
  if (event === 'impact') {
    // These are original contact timbres, not species cries or injury cues.
    const materials = {
      wood: {},
      ground: { frequency: 130 + strength * 65, endFrequency: 52, harmony: 1.5, noise: .2, noiseFrequency: 650 },
      leaf: { frequency: 350, endFrequency: 220, duration: .11, gain: .065, harmony: 0, noise: .65, noiseFrequency: 1800, bend: 1 },
      shell: { frequency: 280 + strength * 90, endFrequency: 180, harmony: 2.7, noise: .045, type: 'triangle', bend: 1.06 },
      bumper: { frequency: 330 + strength * 80, endFrequency: 140, harmony: 1.5, noise: .035, duration: .23, bend: 1.5 },
    };
    // The current Grove solver labels its forest floor and stone surfaces stone.
    const materialKey = material === 'stone' ? 'ground' : material;
    cue = { ...cue, ...(Object.hasOwn(materials, materialKey) ? materials[materialKey] : materials.wood) };
    // Optional gameplay mass changes timbre, never sound amplitude/physics.
    const pitchScale = Math.pow(clamp(mass, .15, 8), -.16);
    cue.frequency *= pitchScale; cue.endFrequency *= pitchScale;
  }
  const variation=[1,.94,1.06,.98][Math.floor(clamp(variant,0,3))];cue={...cue,frequency:cue.frequency*variation,endFrequency:cue.endFrequency*variation};
  return { ...cue, gain: cue.gain * Math.sqrt(strength) };
}

/** Call unlock directly from a click/touch/key gesture. Unsupported/blocked audio fails silently. */
export function createAudio({ contextFactory, maxVoices = 10 } = {}) {
  let context, master, noiseBuffer, muted = false, volume = .55, wantsRunning = false, transition, generation = 0, lastCue = null;
  const voices = new Set(), lastPlayed = new Map(), sequence = new Map();
  const limit = Math.round(clamp(maxVoices, 1, 16));
  function stopVoice(voice) {
    if (!voices.delete(voice)) return;
    for (const source of voice.sources) { source.onended=null;try { source.stop(); } catch {} }
    for (const node of voice.nodes) { try { node.disconnect(); } catch {} }
  }
  function hush() { for (const voice of [...voices]) stopVoice(voice); }
  // Resume/suspend are asynchronous. One transition follows the latest intent;
  // a disposed context can never resume work in a later context's generation.
  function synchronizeContext() {
    const ctx = context, epoch = generation;
    if (!ctx) return Promise.resolve(false);
    if (transition?.context === ctx && transition.generation === epoch) return transition.promise;
    const task = { context:ctx, generation:epoch, promise:null }; transition = task;
    task.promise = (async () => {
      try {
        while (context === ctx && generation === epoch) {
          const run = wantsRunning;
          if (run && ctx.state === 'suspended') await ctx.resume();
          else if (!run && ctx.state === 'running' && ctx.suspend) await ctx.suspend();
          else return run && ctx.state === 'running';
          if (context !== ctx || generation !== epoch) return false;
          if (wantsRunning === run) return run && ctx.state === 'running';
        }
        return false;
      } catch { return context === ctx && generation === epoch && wantsRunning && ctx.state === 'running'; }
      finally { if (transition === task) transition = null; }
    })();
    return task.promise;
  }
  async function unlock() {
    wantsRunning = true;
    try {
      if (!context) {
        const Factory = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!contextFactory && !Factory) return false;
        // Create and begin resuming directly in the caller's gesture turn.
        const next = contextFactory ? contextFactory() : new Factory({ latencyHint:'interactive' });
        try {
          const gain = next.createGain();
          // Headroom limits summed cue amplitude even at maximum voice count.
          gain.gain.value = (muted ? 0 : volume) / Math.sqrt(limit); gain.connect(next.destination);
          const buffer = next.createBuffer(1, next.sampleRate, next.sampleRate);
          const data = buffer.getChannelData(0); let seed = 271828;
          for (let i = 0; i < data.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
          context = next; master = gain; noiseBuffer = buffer;
        } catch {
          try { await next.close(); } catch {}
          return false;
        }
      }
      return await synchronizeContext();
    } catch { return false; }
  }
  function updateGain() {
    if (master) master.gain.setTargetAtTime((muted ? 0 : volume) / Math.sqrt(limit), context.currentTime, .015);
  }
  function play(event, { intensity = 1, material, mass, biome } = {}) {
    const cue = soundSpec(event, intensity, { material, mass, biome, variant:(sequence.get(event)??0)%4 });
    if (!cue || cue.gain === 0 || muted || volume === 0 || !context || context.state !== 'running') return false;
    const now = context.currentTime;
    // Contact chatter cannot fill the voice pool or create hundreds of nodes per frame.
    if (now - (lastPlayed.get(event) ?? -Infinity) < (event === 'zone'?2:event === 'wind' ? .35:event==='impact'?.09:.06)) return false;
    lastCue=event;lastPlayed.set(event, now);sequence.set(event,(sequence.get(event)??0)+1);
    while (voices.size >= limit) stopVoice(voices.values().next().value);
    const voice = { sources: [], nodes: [] }; voices.add(voice);
    const envelope = context.createGain(); voice.nodes.push(envelope);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(cue.gain, now + .008);
    envelope.gain.exponentialRampToValueAtTime(Math.max(1e-12, cue.gain * .001), now + cue.duration);
    envelope.gain.linearRampToValueAtTime(0, now + cue.duration + .012);
    envelope.connect(master);
    function tone(ratio, level) {
      const osc = context.createOscillator(), gain = context.createGain();
      voice.sources.push(osc); voice.nodes.push(osc, gain);
      osc.type = cue.type; osc.frequency.setValueAtTime(cue.frequency * ratio, now);
      if (cue.bend) osc.frequency.exponentialRampToValueAtTime(cue.frequency * cue.bend * ratio, now + .018);
      osc.frequency.exponentialRampToValueAtTime(cue.endFrequency * ratio, now + cue.duration);
      gain.gain.value = level; osc.connect(gain); gain.connect(envelope);
      osc.start(now); osc.stop(now + cue.duration + .02);
      return osc;
    }
    const primary = tone(1, event === 'wind' ? .04 : .7);
    if (cue.harmony) tone(cue.harmony, .25);
    if (cue.noise) {
      const noise = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
      voice.sources.push(noise); voice.nodes.push(noise, filter, gain);
      noise.buffer = noiseBuffer; filter.type = 'bandpass'; filter.Q.value = .6;
      filter.frequency.setValueAtTime(cue.noiseFrequency || (event === 'wind' ? 500 : 1100), now);
      gain.gain.value = cue.noise; noise.connect(filter); filter.connect(gain); gain.connect(envelope);
      noise.start(now); noise.stop(now + cue.duration + .02);
    }
    primary.onended = () => stopVoice(voice);
    return true;
  }
  return {
    unlock, play,
    pause(){wantsRunning = false; hush(); return synchronizeContext();},
    getStatus(){return {muted,volume,contextState:context?.state??'not-started',voices:voices.size,lastCue};},
    setMuted(value) { muted = Boolean(value); updateGain(); if (muted) hush(); },
    setVolume(value) { volume = clamp(value, 0, 1); updateGain(); if (!volume) hush(); },
    // Optional lifecycle hook for a disposed game; re-unlock can recreate its context.
    dispose() { wantsRunning = false; generation++; hush(); const old = context; context = master = noiseBuffer = undefined; transition = null; lastPlayed.clear();sequence.clear();lastCue=null; if (old) try { return Promise.resolve(old.close()).catch(() => {}); } catch {} },
  };
}
