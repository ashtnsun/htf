/**
 * The tomb's sound, synthesised in the browser, and nothing in it hisses: a low hum of a few soft
 * notes that drift, water dripping somewhere with the room's echo on it, the odd stone settling far
 * off, and fire as separate crackles rather than a roar. Kept quiet on purpose: nine families play
 * in one room, each on a laptop. On by default, M mutes; a browser plays nothing before the first
 * key or click, so that is what wakes it (`arm`).
 */
const MASTER = 0.7;
/** The drifting top note of the hum: A, C, E, D, a minor-ish wander that never resolves. */
const TOP_NOTES = [220, 261.63, 329.63, 293.66, 220, 196];

export class TombSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  /** Everything sent here comes back with the tomb's echo on it. */
  private room: ConvolverNode | null = null;
  private noise: AudioBuffer | null = null;
  private fireLevel = 0.3;
  private timers = new Set<number>();
  on = true;

  arm() {
    if (this.on && !this.ctx) this.wake();
    else if (this.on && this.ctx?.state === "suspended") void this.ctx.resume();
  }

  toggle() {
    this.on = !this.on;
    if (this.on) this.arm();
    this.master?.gain.setTargetAtTime(this.on ? MASTER : 0, this.now, 0.15);
    return this.on;
  }

  private get now() {
    return this.ctx?.currentTime ?? 0;
  }

  private wake() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    const limiter = ctx.createDynamicsCompressor();
    limiter.connect(ctx.destination);
    const master = ctx.createGain();
    master.gain.value = MASTER;
    master.connect(limiter);
    this.master = master;

    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noise = noise;

    // The echo of a long stone room: a short decaying impulse, dark at the end.
    const seconds = 2.6;
    const impulse = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const out = impulse.getChannelData(channel);
      let low = 0;
      for (let i = 0; i < out.length; i += 1) {
        const u = i / out.length;
        const k = 0.5 - 0.42 * u;
        low += (Math.random() * 2 - 1 - low) * k;
        out[i] = low * (1 - u) ** 3;
      }
    }
    const room = ctx.createConvolver();
    room.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = 0.7;
    room.connect(wet);
    wet.connect(master);
    this.room = room;

    this.startHum();
    this.startTopNote();
    this.dripLater();
    this.settleLater();
    this.crackleLater();
  }

  private later(ms: number, run: () => void) {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      if (this.ctx) run();
    }, ms);
    this.timers.add(id);
  }

  /** Two soft low notes a fifth apart, each swelling slowly at its own pace. */
  private startHum() {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    filter.connect(this.master!);
    for (const [hz, level, drift, detune] of [
      [110, 0.075, 0.06, 0],
      [110, 0.05, 0.043, 5],
      [164.81, 0.05, 0.051, -3],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = hz;
      osc.detune.value = detune;
      const gain = ctx.createGain();
      gain.gain.value = level;
      // It breathes.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = drift;
      const depth = ctx.createGain();
      depth.gain.value = level * 0.55;
      lfo.connect(depth);
      depth.connect(gain.gain);
      osc.connect(gain);
      gain.connect(filter);
      osc.start();
      lfo.start();
    }
  }

  /** A faint high note that fades from one pitch to the next, far back in the room. */
  private startTopNote(index = 0) {
    const ctx = this.ctx!;
    const t = this.now;
    const hold = 9 + Math.random() * 7;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = TOP_NOTES[index % TOP_NOTES.length]!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.03, t + hold * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + hold * 1.2);
    osc.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    osc.start(t);
    osc.stop(t + hold * 1.25);
    this.later(hold * 1000, () => this.startTopNote(index + 1));
  }

  /** A drop into still water: a quick rising blip, nearly all echo. */
  private dripLater() {
    this.later(1800 + Math.random() * 5200, () => {
      if (this.on) {
        const ctx = this.ctx!;
        const t = this.now;
        const base = 700 + Math.random() * 900;
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(base, t);
        osc.frequency.exponentialRampToValueAtTime(base * 1.9, t + 0.05);
        const gain = ctx.createGain();
        const level = 0.04 + Math.random() * 0.06;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(level, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        osc.connect(gain);
        gain.connect(this.room!);
        gain.connect(this.master!);
        osc.start(t);
        osc.stop(t + 0.1);
      }
      this.dripLater();
    });
  }

  /** Now and then the tomb shifts somewhere far off. */
  private settleLater() {
    this.later(18000 + Math.random() * 26000, () => {
      if (this.on && this.room) {
        const ctx = this.ctx!;
        const t = this.now;
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(70 + Math.random() * 20, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 1.2);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.12, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        osc.connect(gain);
        gain.connect(this.room);
        osc.start(t);
        osc.stop(t + 1.7);
      }
      this.settleLater();
    });
  }

  /** Fire as separate small cracks, more of them where there is more fire. */
  private crackleLater() {
    this.later((120 + Math.random() * 500) / Math.max(0.15, this.fireLevel), () => {
      if (this.on) {
        this.burst("bandpass", 1600 + Math.random() * 2600, 0.012 + Math.random() * 0.03, 0.018);
      }
      this.crackleLater();
    });
  }

  /** How much fire is in the room, 0 to 1: louder in the Hall. */
  fire(level: number) {
    this.fireLevel = level;
  }

  private burst(type: BiquadFilterType, hz: number, peak: number, seconds: number, wet = false) {
    if (!this.on || !this.ctx || !this.noise) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = hz;
    const gain = ctx.createGain();
    const t = this.now;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    if (wet) gain.connect(this.room!);
    src.start(t, Math.random() * 1.5, seconds + 0.02);
  }

  private tone(
    from: number,
    to: number,
    peak: number,
    seconds: number,
    type: OscillatorType = "sine",
  ) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + seconds * 0.5);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    osc.start(t);
    osc.stop(t + seconds + 0.05);
  }

  /** A footfall, a press, a turn of a wheel. */
  tick(hz = 300, level = 0.06) {
    this.burst("bandpass", hz, level, 0.04);
  }

  /** Stone set down on stone. */
  stone() {
    this.tone(120, 40, 0.3, 0.3);
    this.burst("bandpass", 500, 0.1, 0.1);
  }

  /** Something heavy moving: the door, the floor. A low grinding, not a hiss. */
  rumble(weight = 1) {
    this.tone(70, 28, 0.6 * weight, 1.6);
    this.tone(46, 33, 0.35 * weight, 2.2, "triangle");
    this.burst("lowpass", 320, 0.25 * weight, 1.2);
  }

  /** Air moving past: a door, the camera closing in. Short and low. */
  whoosh(level = 0.08, seconds = 0.4) {
    this.burst("lowpass", 520, level * 0.7, seconds);
  }

  /** A trial answered: a bright struck note and its fifth, ringing on in the room. */
  chime() {
    this.tone(523, 523, 0.08, 1.4, "triangle");
    this.tone(784, 784, 0.045, 1.1, "triangle");
  }

  /** A coin: two quick bright notes. */
  coin() {
    this.tone(988, 988, 0.08, 0.12, "triangle");
    window.setTimeout(() => this.tone(1319, 1319, 0.09, 0.35, "triangle"), 80);
  }

  /** The last seconds before a swap. */
  beep() {
    this.tone(880, 880, 0.16, 0.14, "square");
  }

  /** Time to swap: three loud rising calls that cannot be missed in a noisy room. */
  swap() {
    [0, 260, 520].forEach((ms, i) => {
      window.setTimeout(() => this.tone(660 + i * 220, 660 + i * 220, 0.3, 0.26, "square"), ms);
    });
  }

  /** Something wrong: a low dull thud. */
  thud() {
    this.tone(95, 45, 0.5, 0.35);
  }

  close() {
    for (const id of this.timers) window.clearTimeout(id);
    this.timers.clear();
    void this.ctx?.close();
    this.ctx = null;
  }
}
