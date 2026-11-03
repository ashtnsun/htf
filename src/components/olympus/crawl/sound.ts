/**
 * The tomb's sound, synthesised in the browser: a low drone, moving air and a fire under
 * everything, and small sounds on cue. Kept quiet on purpose: nine families play in one room, each
 * on a laptop. On by default, M mutes; a browser plays nothing before the first key or click, so
 * that is what wakes it (`arm`).
 */
const MASTER = 0.55;

export class TombSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private fireGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private fireLevel = 0.1;
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

    const noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noise = noise;

    // A low hum with no edge.
    for (const [hz, level] of [
      [55, 0.05],
      [82.4, 0.025],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.frequency.value = hz;
      const gain = ctx.createGain();
      gain.gain.value = level;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
    }
    // Air through the passages, and the fire's roar.
    this.loop(noise, "bandpass", 400, 0.02);
    this.fireGain = this.loop(noise, "lowpass", 520, this.fireLevel);
  }

  private loop(buffer: AudioBuffer, type: BiquadFilterType, hz: number, level: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = hz;
    const gain = ctx.createGain();
    gain.gain.value = level;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    src.start();
    return gain;
  }

  /** The fire's level, louder in the Hall. */
  fire(level: number) {
    this.fireLevel = level;
    this.fireGain?.gain.setTargetAtTime(level, this.now, 0.4);
  }

  private burst(type: BiquadFilterType, hz: number, peak: number, seconds: number) {
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
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    src.start(t, Math.random() * 3, seconds);
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
    this.burst("bandpass", 500, 0.12, 0.12);
  }

  /** Something heavy moving: the gate, the door, the floor. */
  rumble(weight = 1) {
    this.tone(70, 28, 0.6 * weight, 1.6);
    this.burst("lowpass", 700, 0.3 * weight, 1.4);
  }

  /** Air moving past: a door, a dash, the camera closing in. */
  whoosh(level = 0.08, seconds = 0.4) {
    this.burst("bandpass", 900, level, seconds);
  }

  /** A trial answered: a bright struck note and its fifth. */
  chime() {
    this.tone(523, 523, 0.09, 1.4, "triangle");
    this.tone(784, 784, 0.05, 1.1, "triangle");
  }

  /** Something wrong: a low dull thud. */
  thud() {
    this.tone(95, 45, 0.5, 0.35);
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
