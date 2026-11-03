/**
 * The Prologue's sound, synthesised in the browser so there are no audio files to license or
 * load. Under the deck: a low drone, the wind on the mountain and a fire (a low roar, a hiss and
 * a crackle of tiny pops). On cue: a hit, thunder, ticks, the ring of a link struck, the rush of
 * cells flying and a slow warm swell. On by default, S mutes; a browser plays nothing before the
 * presenter's first key or click, so the first press is what wakes it (`arm`). Everything goes
 * through a compressor so a thunderclap cannot clip the room's speakers.
 */
/** The three saws sum high; this keeps the drone under the cues. */
const DRONE_TRIM = 0.45;
const MASTER = 0.8;

export class Score {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private fireGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private brown: AudioBuffer | null = null;
  private droneLevel = 0;
  private fireLevel = 0;
  private windLevel = 0;
  private crackling = 0;
  on = true;

  /** Call on the presenter's first key or click: the moment a browser lets sound start. */
  arm() {
    if (this.on) this.wake();
  }

  toggle() {
    this.on = !this.on;
    if (this.on) this.wake();
    this.master?.gain.setTargetAtTime(this.on ? MASTER : 0, this.now, 0.15);
    return this.on;
  }

  private get now() {
    return this.ctx?.currentTime ?? 0;
  }

  private wake() {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.25;
      // The compressor adds its own make-up gain (measured: thunder at +3 dB over full scale).
      const trim = ctx.createGain();
      trim.gain.value = 0.6;
      limiter.connect(trim);
      trim.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.gain.value = MASTER;
      this.master.connect(limiter);
      this.noise = this.buffer(4, () => Math.random() * 2 - 1);
      let last = 0;
      this.brown = this.buffer(8, () => {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        return last * 3.5;
      });
      this.buildDrone(ctx);
      this.buildFire(ctx);
      this.buildWind(ctx);
    }
    void this.ctx.resume();
    this.droneGain?.gain.setTargetAtTime(this.droneLevel * DRONE_TRIM, this.now, 0.6);
    this.fireGain?.gain.setTargetAtTime(this.fireLevel, this.now, 0.6);
    this.windGain?.gain.setTargetAtTime(this.windLevel, this.now, 0.6);
    this.crackle();
  }

  private buffer(seconds: number, sample: () => number) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = sample();
    return buf;
  }

  /** A sound that loops until the page goes. */
  private loop(ctx: AudioContext, buf: AudioBuffer, out: AudioNode) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(out);
    src.start(0, Math.random() * buf.duration);
  }

  /** A slow sine moving a parameter by `depth` either side, so a bed never sits still. */
  private sway(ctx: AudioContext, hz: number, depth: number, param: AudioParam) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = hz;
    const gain = ctx.createGain();
    gain.gain.value = depth;
    lfo.connect(gain);
    gain.connect(param);
    lfo.start();
  }

  /** Two low saws, a fifth apart and a hair detuned, breathing through a slow filter. */
  private buildDrone(ctx: AudioContext) {
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 170;
    filter.connect(this.droneGain);
    this.droneGain.connect(this.master!);
    for (const [hz, cents] of [
      [41.2, -6],
      [41.2, 7],
      [61.74, 3],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = hz;
      osc.detune.value = cents;
      osc.connect(filter);
      osc.start();
    }
    this.sway(ctx, 0.09, 60, filter.frequency);
  }

  /** The fire's bed: a low roar that swells at no fixed rate, and a hiss over it. */
  private buildFire(ctx: AudioContext) {
    this.fireGain = ctx.createGain();
    this.fireGain.gain.value = 0;
    this.fireGain.connect(this.master!);

    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = "lowpass";
    roarFilter.frequency.value = 420;
    const roar = ctx.createGain();
    roar.gain.value = 0.85;
    roarFilter.connect(roar);
    roar.connect(this.fireGain);
    this.loop(ctx, this.brown!, roarFilter);
    // Rates with no common beat: the swell never repeats audibly.
    this.sway(ctx, 0.31, 0.2, roar.gain);
    this.sway(ctx, 0.73, 0.14, roar.gain);
    this.sway(ctx, 0.19, 110, roarFilter.frequency);

    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = "highpass";
    hissFilter.frequency.value = 3200;
    const hiss = ctx.createGain();
    hiss.gain.value = 0.018;
    hissFilter.connect(hiss);
    hiss.connect(this.fireGain);
    this.loop(ctx, this.noise!, hissFilter);
    this.sway(ctx, 0.47, 0.006, hiss.gain);
  }

  /** Wind: noise through a resonant band that slides slowly up and down. */
  private buildWind(ctx: AudioContext) {
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    this.windGain.connect(this.master!);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 460;
    band.Q.value = 1.4;
    const gust = ctx.createGain();
    gust.gain.value = 0.55;
    band.connect(gust);
    gust.connect(this.windGain);
    this.loop(ctx, this.noise!, band);
    this.sway(ctx, 0.07, 240, band.frequency);
    this.sway(ctx, 0.17, 110, band.frequency);
    this.sway(ctx, 0.11, 0.22, gust.gain);
  }

  /** Pops at random times, mostly tiny, now and then a knot of wood going. */
  private crackle = () => {
    window.clearTimeout(this.crackling);
    this.crackling = 0;
    if (!this.ctx || this.fireLevel <= 0.01) return;
    if (this.on) {
      const big = Math.random() < 0.1;
      const hz = big ? 500 + Math.random() * 900 : 1800 + Math.random() * 3600;
      const peak = (big ? 0.5 : 0.16) * this.fireLevel * (0.35 + Math.random() * 0.65);
      this.burst(this.noise!, "bandpass", hz, peak, big ? 0.06 : 0.02);
    }
    // Exponential gaps are what make them read as random and not as a rhythm.
    const gap = 25 - Math.log(1 - Math.random()) * 120;
    this.crackling = window.setTimeout(this.crackle, gap);
  };

  /** The drone's level, 0 to 1 (about 0.35 is "present"). */
  drone(level: number, seconds = 2) {
    this.droneLevel = level;
    this.droneGain?.gain.setTargetAtTime(level * DRONE_TRIM, this.now, seconds / 3);
  }

  /** The fire's level, 0 to 1. */
  fire(level: number, seconds = 1.5) {
    this.fireLevel = level;
    this.fireGain?.gain.setTargetAtTime(level, this.now, seconds / 3);
    if (level > 0.01 && !this.crackling) this.crackle();
  }

  /** The wind's level, 0 to 1. */
  wind(level: number, seconds = 3) {
    this.windLevel = level;
    this.windGain?.gain.setTargetAtTime(level, this.now, seconds / 3);
  }

  private burst(
    buf: AudioBuffer,
    type: BiquadFilterType,
    hz: number,
    peak: number,
    seconds: number,
    delay = 0,
  ) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = hz;
    const gain = ctx.createGain();
    const t = this.now + delay;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    src.start(
      t,
      Math.random() * (buf.duration - seconds > 0 ? buf.duration - seconds : 0),
      seconds,
    );
    return { src, filter, gain };
  }

  /** A low impact: a sine falling away under a thud of noise. */
  hit(weight = 1) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.45);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9 * weight, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    osc.connect(gain);
    gain.connect(this.master!);
    osc.start(t);
    osc.stop(t + 1.35);
    this.burst(this.noise!, "lowpass", 900, 0.5 * weight, 0.22);
  }

  /** A crack, then a long roll of low noise that swells twice and dies. */
  thunder() {
    if (!this.on || !this.ctx) return;
    this.burst(this.noise!, "highpass", 1800, 0.6, 0.09);
    this.burst(this.noise!, "lowpass", 2400, 0.7, 0.3);
    const { gain } = this.burst(this.brown!, "lowpass", 280, 1, 5.5);
    const t = this.now;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(1.2, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.85, t + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 5.5);
    this.hit(0.9);
  }

  /** A small dry tick (the roulette, a typed letter, a card landing). */
  tick(hz = 1400, level = 0.12) {
    if (!this.on || !this.ctx) return;
    this.burst(this.noise!, "bandpass", hz, level, 0.035);
  }

  /** A stone set down: the setup steps. */
  stone() {
    if (!this.on || !this.ctx) return;
    this.hit(0.4);
    this.burst(this.noise!, "bandpass", 520, 0.18, 0.12);
  }

  /** Iron struck: partials with no common root, which is what makes it ring and not sing. */
  clang() {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now;
    const root = 380 + Math.random() * 60;
    for (const [ratio, level, decay] of [
      [1, 0.09, 0.7],
      [2.76, 0.07, 0.45],
      [5.4, 0.05, 0.28],
      [8.93, 0.03, 0.16],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.frequency.value = root * ratio;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(level, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start(t);
      osc.stop(t + decay + 0.02);
    }
    this.hit(0.45);
    this.burst(this.noise!, "highpass", 2400, 0.16, 0.03);
  }

  /** Air moving: noise through a band that sweeps up and away, for cells flying or a fire catching. */
  whoosh(level = 0.2, seconds = 0.9) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.8;
    band.frequency.setValueAtTime(220, t);
    band.frequency.exponentialRampToValueAtTime(1500, t + seconds * 0.45);
    band.frequency.exponentialRampToValueAtTime(320, t + seconds);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + seconds * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(band);
    band.connect(gain);
    gain.connect(this.master!);
    src.start(t, Math.random() * (this.noise!.duration - seconds), seconds);
  }

  /** A slow, warm open chord: rises for a third of its length, then fades away. */
  swell(seconds = 6, level = 0.07) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + seconds / 3);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.exponentialRampToValueAtTime(1100, t + seconds / 3);
    filter.frequency.exponentialRampToValueAtTime(260, t + seconds);
    filter.connect(gain);
    gain.connect(this.master!);
    for (const [hz, cents] of [
      [82.41, -4],
      [123.47, 3],
      [164.81, 5],
      [246.94, -6],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = hz;
      osc.detune.value = cents;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + seconds + 0.05);
    }
  }

  close() {
    window.clearTimeout(this.crackling);
    this.crackling = 0;
    void this.ctx?.close();
    this.ctx = null;
  }
}
