/**
 * The Prologue's sound, synthesised in the browser so there are no audio files to license or
 * load: a low drone under the deck, and a hit, thunder, a rising charge and ticks on
 * cue. Off until the presenter presses S (a browser will not play sound before a key press
 * anyway). Everything goes through a compressor so a thunderclap cannot clip the room's speakers.
 */
/** The three saws sum high; this keeps the drone under the cues. */
const DRONE_TRIM = 0.45;

export class Score {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private brown: AudioBuffer | null = null;
  private droneLevel = 0;
  on = false;

  toggle() {
    this.on = !this.on;
    if (this.on) this.wake();
    else this.droneGain?.gain.setTargetAtTime(0, this.now, 0.3);
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
      this.master.gain.value = 0.8;
      this.master.connect(limiter);
      this.noise = this.buffer(2, () => Math.random() * 2 - 1);
      let last = 0;
      this.brown = this.buffer(6, () => {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        return last * 3.5;
      });

      // Two low saws, a fifth apart and a hair detuned, breathing through a slow filter.
      this.droneGain = ctx.createGain();
      this.droneGain.gain.value = 0;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 170;
      filter.connect(this.droneGain);
      this.droneGain.connect(this.master);
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
      const breath = ctx.createOscillator();
      breath.frequency.value = 0.09;
      const depth = ctx.createGain();
      depth.gain.value = 60;
      breath.connect(depth);
      depth.connect(filter.frequency);
      breath.start();
    }
    void this.ctx.resume();
    this.droneGain?.gain.setTargetAtTime(this.droneLevel * DRONE_TRIM, this.now, 0.6);
  }

  private buffer(seconds: number, sample: () => number) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = sample();
    return buf;
  }

  /** The drone's level, 0 to 1 (about 0.35 is "present"). */
  drone(level: number, seconds = 2) {
    this.droneLevel = level;
    if (this.on) this.droneGain?.gain.setTargetAtTime(level * DRONE_TRIM, this.now, seconds / 3);
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

  /** A pitch and a filter climbing together for `seconds`, cut dead at the end. */
  rise(seconds: number) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + seconds);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.32, t + seconds);
    gain.gain.setValueAtTime(0.0001, t + seconds + 0.01);
    filter.connect(gain);
    gain.connect(this.master!);
    for (const [from, to] of [
      [55, 220],
      [82.4, 330],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.exponentialRampToValueAtTime(to, t + seconds);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + seconds + 0.02);
    }
  }

  /** A small dry tick (the roulette, a typed letter, a link of the chain). */
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

  close() {
    void this.ctx?.close();
    this.ctx = null;
    this.on = false;
  }
}
