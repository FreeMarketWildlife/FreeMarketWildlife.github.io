// Quiet, intermittent field crickets, synthesized locally; no audio assets or timers.
export class CricketAmbience {
  constructor(context, destination) {
    this.context = context;
    this.output = context.createGain(); this.output.gain.value = 0;
    this.output.connect(destination);
    this.active = false; this.next = 0; this.call = 0; this.voices = new Set();
  }
  start() { this.stop(); this.call = 0; this.resume(); }
  resume() {
    if (this.active) return;
    this.active = true; this.next = this.context.currentTime + .35;
    this.output.gain.cancelScheduledValues(this.context.currentTime);
    this.output.gain.setTargetAtTime(.65, this.context.currentTime, .6);
  }
  chirp(at, call) {
    const c = this.context, envelope = c.createGain(), oscillator = c.createOscillator();
    oscillator.type = 'sine';
    const pitch = call % 2 ? 4650 : 4100;
    oscillator.frequency.setValueAtTime(pitch, at);
    oscillator.frequency.linearRampToValueAtTime(pitch * .97, at + .34);
    envelope.gain.setValueAtTime(0, at);
    // Four little wing strokes per phrase, with breathing room between callers.
    for (let pulse = 0; pulse < 4; pulse++) {
      const t = at + pulse * .064;
      envelope.gain.setValueAtTime(0, t);
      envelope.gain.linearRampToValueAtTime(call % 2 ? .012 : .018, t + .007);
      envelope.gain.exponentialRampToValueAtTime(.00001, t + .042);
    }
    envelope.gain.setValueAtTime(0, at + .26);
    oscillator.connect(envelope).connect(this.output);
    oscillator.start(at); oscillator.stop(at + .3);
    const voice = { oscillator, envelope, ends: at + .32 };
    this.voices.add(voice);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); this.voices.delete(voice); };
  }
  update(height = 0) {
    if (!this.active || this.context.state !== 'running') return;
    const c = this.context;
    this.output.gain.setTargetAtTime(.65 * Math.exp(-Math.max(0, height) * 1.1), c.currentTime, 1.4);
    for (const voice of this.voices) if (voice.ends < c.currentTime) this.voices.delete(voice);
    // Skip old calls after a late frame instead of piling up a chorus.
    if (this.next < c.currentTime) this.next = c.currentTime + .08;
    if (this.next < c.currentTime + .18) {
      this.chirp(this.next, this.call++);
      this.next += 1.25 + (.5 + Math.sin(this.call * 2.1) * .5) * 1.3;
    }
  }
  stop() {
    this.active = false;
    const c = this.context;
    this.output.gain.cancelScheduledValues(c.currentTime);
    this.output.gain.setTargetAtTime(0, c.currentTime, .03);
    for (const voice of this.voices) {
      try { voice.oscillator.stop(c.currentTime + .1); } catch {}
    }
    this.voices.clear();
  }
}
