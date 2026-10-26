import { BY_ID } from './flock.js';
// Moonwool — an original 16-bar, 3/4 lullaby at 72 BPM.
// All voices pass through the music-only room filter; gameplay chimes stay clear.
export const BEAT = 60 / 72;
export const BAR = BEAT * 3;
export const LOOP_LENGTH = BAR * 16;
const midi = n => 440 * 2 ** ((n - 69) / 12);
const harmony = [
  [48, 60, 64, 67, 71], [45, 60, 64, 67, 69], [41, 60, 64, 65, 69], [43, 59, 62, 67, 69],
  [40, 60, 64, 67, 72], [38, 60, 62, 65, 69], [41, 60, 64, 65, 69], [43, 59, 62, 65, 67],
  [48, 60, 64, 67, 71], [45, 60, 64, 67, 69], [41, 60, 64, 65, 69], [43, 59, 62, 67, 69],
  [40, 60, 64, 67, 72], [38, 60, 62, 65, 69], [43, 59, 62, 65, 67], [48, 60, 64, 67, 71],
];
// [beat, duration in beats, note]. Space between phrases is part of the melody.
const melody = [
  [[0, 1.35, 76], [1.5, .6, 79], [2.25, .55, 74]], [[0, 1.8, 72], [2, .75, 76]],
  [[0, .7, 77], [1, .7, 76], [2, .8, 72]], [[0, 1.3, 74], [1.5, .5, 71], [2.25, .5, 69]],
  [[0, 1.8, 67], [2, .75, 72]], [[0, .65, 69], [.75, .65, 72], [1.75, .95, 74]],
  [[0, 1.35, 76], [1.5, .55, 72], [2.25, .5, 69]], [[0, 1.8, 71], [2, .6, 74]],
  [[0, 1.3, 79], [1.5, .6, 76], [2.25, .55, 74]], [[0, 1.8, 72], [2, .7, 69]],
  [[0, .7, 72], [1, .7, 77], [2, .8, 76]], [[0, 1.3, 74], [1.5, .55, 71], [2.25, .5, 67]],
  [[0, 1.8, 72], [2, .7, 76]], [[0, .65, 74], [.75, .65, 72], [1.75, .9, 69]],
  [[0, 1.2, 71], [1.5, .55, 74]], [[0, 2.7, 72]],
];

export function lullabyScore() {
  const events = [];
  const add = (time, duration, note, kind, volume) => events.push({ time, duration, frequency: midi(note), kind, volume });
  harmony.forEach((chord, bar) => {
    const start = bar * BAR;
    add(start, BAR * .94, chord[0], 'bass', .12);
    for (const note of chord.slice(1)) add(start + .02, BAR * 1.12, note, 'pad', .034);
    [1, 3, 2, 4, 2, 3].forEach((index, pulse) => add(start + pulse * BEAT / 2, .72, chord[index] + 12, 'harp', .047));
    for (const [beat, duration, note] of melody[bar]) add(start + beat * BEAT, duration * BEAT, note, 'bell', .13);
  });
  return events.sort((a, b) => a.time - b.time);
}
// Starwake: original syncopated synth arpeggios over suspended, wide pads.
// Same loop duration lets the transition preserve the current musical position.
export function spaceScore() {
  const events = [];
  const roots = [45, 41, 48, 43, 45, 41, 38, 43, 45, 48, 41, 43, 38, 41, 43, 45];
  roots.forEach((root, bar) => {
    const start = bar * BAR;
    const add = (offset, duration, note, kind, volume) => events.push({ time: start + offset, duration, frequency: midi(note), kind, volume });
    add(0, BAR*.98, root-12, 'bass', .11);
    for (const n of [root+12,root+19,root+26]) add(0,BAR*1.3,n,'pad',.038);
    [0,7,12,14,19,12,7,14,24,19,14,7].forEach((note,i) => add(i*BAR/12,.3,root+12+note,'synth',.055+(i%3===0?.018:0)));
    for (const i of [0,3,6,9]) add(i*BAR/12,.08,root-12,'pulse',.1);
  });
  return events.sort((a,b)=>a.time-b.time);
}
export const slowArithmetic = flights => flights.some(flight => !flight.crossed &&
  ((BY_ID[flight.op]?.slow ?? 1) > 1) && flight.crossingTime > .81);

export function musicRoom(context, destination) {
  const input = context.createGain(), filter = context.createBiquadFilter(), output = context.createGain();
  filter.type = 'lowpass'; filter.Q.value = .65; filter.frequency.value = 9000;
  output.gain.value = .65;
  input.connect(filter).connect(output).connect(destination);
  // Two quiet, filtered echoes soften the bell into a little bedroom ambience.
  const delays = [];
  for (const [seconds, level] of [[.23, .17], [.39, .1]]) {
    const delay = context.createDelay(1), gain = context.createGain();
    delay.delayTime.value = seconds; gain.gain.value = level;
    filter.connect(delay).connect(gain).connect(output);
    delays.push(delay, gain);
  }
  return {
    input, output, filter,
    focus(focused, at = context.currentTime) {
      // setTargetAtTime gives a continuous exponential glide on both entry and exit.
      const frequency = filter.frequency;
      if (at <= context.currentTime && frequency.cancelAndHoldAtTime) frequency.cancelAndHoldAtTime(at);
      else frequency.cancelScheduledValues(at);
      frequency.setTargetAtTime(focused ? 480 : 9000, at, focused ? .27 : .48);
    },
    dispose() { input.disconnect(); filter.disconnect(); output.disconnect(); delays.forEach(n => n.disconnect()); },
  };
}

export function scheduleMusicNote(context, destination, event, at, duration = event.duration) {
  const nodes = [], gain = context.createGain();
  const attack = event.kind === 'pad' ? .38 : event.kind === 'bass' ? .035 : .014;
  const release = event.kind === 'pad' ? .6 : .2;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(event.volume, at + Math.min(attack, duration * .3));
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration + release);
  gain.connect(destination);
  const partials = event.kind === 'bell' ? [[1, .83], [2, .13], [3, .025]] :
    event.kind === 'harp' ? [[1, .9], [2, .06]] : [[1, 1]];
  for (const [multiple, level] of partials) {
    const oscillator = context.createOscillator(), partial = context.createGain();
    oscillator.type = event.kind === 'synth' ? 'triangle' : 'sine'; oscillator.frequency.value = event.frequency * multiple;
    partial.gain.value = level; oscillator.connect(partial).connect(gain);
    oscillator.start(at); oscillator.stop(at + duration + release + .03);
    nodes.push(oscillator, partial);
  }
  let cleaned = false;
  const cleanup = () => { if (!cleaned) { cleaned = true; nodes.forEach(n => n.disconnect()); gain.disconnect(); } };
  nodes[0].onended = cleanup;
  return { stop() { for (const node of nodes) if (typeof node.stop === 'function') { try { node.stop(); } catch {} } cleanup(); } };
}

export class Lullaby {
  constructor(context, destination) {
    this.context = context; this.room = musicRoom(context, destination); this.score = lullabyScore();
    this.active = false; this.position = 0; this.cursor = 0; this.cycle = 0; this.voices = new Set(); this.focused = false;
  }
  setSpace(space) {
    if (Boolean(space) === Boolean(this.space)) return;
    const active = this.active; this.pause(); this.space = Boolean(space);
    this.score = this.space ? spaceScore() : lullabyScore();
    if (active) this.resume();
  }
  clearVoices() { this.voices.forEach(voice => voice.stop()); this.voices.clear(); }
  start() { this.stop(); this.position = 0; this.resume(); }
  resume() {
    if (this.active) return;
    const c = this.context;
    this.active = true; this.origin = c.currentTime + .05 - this.position;
    this.cycle = Math.floor(this.position / LOOP_LENGTH);
    const within = this.position % LOOP_LENGTH;
    this.cursor = this.score.findIndex(event => event.time >= within);
    if (this.cursor < 0) { this.cursor = 0; this.cycle++; }
    this.room.output.gain.cancelScheduledValues(c.currentTime);
    this.room.output.gain.setValueAtTime(0, c.currentTime);
    this.room.output.gain.linearRampToValueAtTime(.65, c.currentTime + .2);
    // Rebuild sustained notes when resuming in the middle of a bar.
    for (const event of this.score) if (event.time < within && event.time + event.duration > within) {
      this.addVoice(event, c.currentTime + .05, event.time + event.duration - within);
    }
  }
  addVoice(event, at, duration = event.duration) {
    const voice = scheduleMusicNote(this.context, this.room.input, event, at, duration);
    voice.ends = at + duration + .8; this.voices.add(voice);
  }
  update(focused = false) {
    const c = this.context;
    if (!this.active) return;
    if (focused !== this.focused) { this.focused = focused; this.room.focus(focused); }
    if (c.state !== 'running') return;
    for (const voice of this.voices) if (voice.ends < c.currentTime) this.voices.delete(voice);
    const ahead = c.currentTime + .18;
    while (true) {
      const event = this.score[this.cursor], at = this.origin + this.cycle * LOOP_LENGTH + event.time;
      if (at > ahead) break;
      // A late frame skips expired events instead of playing a backlog of notes.
      if (at + event.duration > c.currentTime) this.addVoice(event, Math.max(at, c.currentTime + .005));
      if (++this.cursor >= this.score.length) { this.cursor = 0; this.cycle++; }
    }
  }
  pause() {
    if (!this.active) return;
    this.position = Math.max(0, this.context.currentTime - this.origin);
    this.active = false; this.clearVoices();
    this.room.output.gain.cancelScheduledValues(this.context.currentTime); this.room.output.gain.value = 0;
  }
  stop() { this.pause(); this.position = 0; this.focused = false; this.room.focus(false); }
}
