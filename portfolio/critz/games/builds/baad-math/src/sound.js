import { CricketAmbience } from './ambience.js';
import { Lullaby } from './music.js';
// Diatonic Shepard-style voicing: seven C-major degrees, with octave layers
// fading around a fixed register. Wraps never drive taps into extreme pitches.
export function cMajorVoices(step) {
  const degrees = [0, 2, 4, 5, 7, 9, 11];
  const semitone = degrees[((step % 7) + 7) % 7];
  const voices = [-2, -1, 0, 1, 2].map(octave => {
    const frequency = 261.625565 * 2 ** (octave + semitone / 12);
    return { frequency, gain: Math.exp(-((Math.log2(frequency / 370) / .8) ** 2)) };
  });
  const total = voices.reduce((sum, voice) => sum + voice.gain, 0);
  return voices.map(voice => ({ ...voice, gain: voice.gain / total }));
}

// Synthesized toys plus an original lullaby; no audio downloads required.
// The context is created/resumed only by a start, resume, or sound-button gesture.
export class DreamSounds {
  constructor() {
    this.enabled = true;
    try { this.enabled = localStorage.getItem('baad-sound') !== 'off'; } catch {}
    this.context = null; this.music = null; this.ambience = null;
    this.tapStep = 0; this.perfectStep = 0;
    this.lastBaa = -1;
    this.lastWarning = -1;
  }
  unlock() {
    if (!this.enabled) return;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      if (!this.context) {
        this.context = new Context();
        this.master = this.context.createGain(); this.master.gain.value = .32;
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -18; limiter.ratio.value = 8;
        this.master.connect(limiter); limiter.connect(this.context.destination);
        this.music = new Lullaby(this.context, this.master);
        this.ambience = new CricketAmbience(this.context, this.master);
      }
      this.context.resume().catch(() => {});
      if (this.inDream && !this.music.active) this.music.resume();
      if (this.inDream && !this.ambience.active) this.ambience.resume();
    } catch { /* The game also works without audio hardware. */ }
  }
  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem('baad-sound', this.enabled ? 'on' : 'off'); } catch {}
    if (this.enabled) this.unlock();
    else if (this.context) this.context.suspend().catch(() => {});
  }
  note(frequency, duration = .15, delay = 0, type = 'sine', volume = .18, end = frequency) {
    const c = this.context;
    if (!this.enabled || !c || c.state === 'closed') return;
    const start = c.currentTime + delay, osc = c.createOscillator(), gain = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain).connect(this.master); osc.start(start); osc.stop(start + duration + .02);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  start() {
    this.tapStep = 0; this.perfectStep = 0; this.unlock();
    // A muted start still needs a score ready for the first unmute gesture.
    if (this.music) { this.music.setSpace(false); this.music.start(); }
    if (this.ambience) this.ambience.start();
    this.inDream = true;
  }
  playCountNote(direction = 1, kind = 'tap') {
    const step = direction > 0 ? this.tapStep++ : --this.tapStep;
    const duration = kind === 'perfect' ? .75 : .18;
    const level = kind === 'perfect' ? .21 : .13;
    for (const [i, voice] of cMajorVoices(step).entries()) {
      if (voice.gain > .002) this.note(voice.frequency, duration,
        kind === 'perfect' ? i * .008 : 0, 'sine', voice.gain * level);
    }
    if (kind === 'perfect') {
      // A bell-like octave shimmer repeats the same pitch class, without a chord
      // or an extra melody step. Delayed glints make the reward stand out.
      const frequency = cMajorVoices(step)[2].frequency;
      this.note(frequency * 2, .6, .045, 'triangle', .045);
      this.note(frequency * 4, .42, .12, 'sine', .035);
      this.note(frequency * 2, .38, .22, 'sine', .025);
    }
  }
  tap(direction) { this.playCountNote(direction, 'tap'); }
  perfect() {
    // A separate ascending C-major reward phrase: taps/subtractions cannot pull it down.
    // Two octaves, then repeat the phrase softly instead of climbing out of hearing range.
    const step = this.perfectStep++ % 14, degrees = [0, 2, 4, 5, 7, 9, 11];
    const frequency = 523.25113 * 2 ** (Math.floor(step / 7) + degrees[step % 7] / 12);
    this.note(frequency, .72, 0, 'sine', .14);
    this.note(frequency / 2, .8, .008, 'sine', .055);
    this.note(frequency * 2, .48, .055, 'triangle', .022);
    this.note(frequency * 2, .34, .14, 'sine', .018);
  }
  updateMusic(focused, height = 0, space = false) {
    if (!this.inDream) return;
    if (this.music) { this.music.setSpace(space); this.music.update(focused); }
    if (this.ambience) this.ambience.update(height);
  }
  resume() {
    this.unlock(); this.inDream = true;
    if (this.music) { if (!this.music.active) this.music.resume(); }
    if (this.ambience) this.ambience.resume();
  }
  stopMusic() { this.inDream = false; if (this.music) this.music.stop(); if (this.ambience) this.ambience.stop(); }
  launch(side) {
    this.note(side < 0 ? 170 : 195, .13, 0, 'sine', .09, 560);
  }
  // Crossing is a silent checkpoint; only perfect() plays a reward.
  cross() {}
  baa() {
    const c = this.context;
    if (!this.enabled || !c || c.state !== 'running') return;
    const t = c.currentTime + .035;
    const voice = c.createOscillator(), filter = c.createBiquadFilter(), gain = c.createGain();
    const wobble = c.createOscillator(), depth = c.createGain();
    voice.type = 'sawtooth'; voice.frequency.setValueAtTime(235, t);
    voice.frequency.exponentialRampToValueAtTime(165, t + .3);
    filter.type = 'bandpass'; filter.frequency.setValueAtTime(1050, t); filter.Q.value = 2.5;
    filter.frequency.linearRampToValueAtTime(720, t + .3);
    wobble.frequency.value = 19; depth.gain.value = 15;
    wobble.connect(depth).connect(voice.frequency);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.1, t + .035);
    gain.gain.exponentialRampToValueAtTime(.0001, t + .34);
    voice.connect(filter).connect(gain).connect(this.master);
    voice.start(t); wobble.start(t); voice.stop(t + .35); wobble.stop(t + .35);
    voice.onended = () => { voice.disconnect(); filter.disconnect(); gain.disconnect(); wobble.disconnect(); depth.disconnect(); };
  }
  warning() {
    const c = this.context;
    if (!c || c.currentTime - this.lastWarning < 1.3) return;
    this.lastWarning = c.currentTime;
    this.note(87, .16, 0, 'sine', .13, 70); this.note(78, .2, .22, 'sine', .1, 60);
  }
  bite() {
    this.note(130, .12, 0, 'sawtooth', .13, 35);
    this.note(310, .07, .035, 'triangle', .1, 90);
    this.note(75, .17, .1, 'sine', .15, 38);
  }
  finish(win) {
    this.stopMusic();
    const notes = win ? [523, 659, 784, 1047] : [294, 247, 196, 98];
    notes.forEach((n, i) => this.note(n, win ? .5 : .35, i * .12, 'triangle', .14));
  }
  pause() {
    this.inDream = false; if (this.music) this.music.pause();
    if (this.ambience) this.ambience.stop();
    if (this.context) this.context.suspend().catch(() => {});
  }
}
