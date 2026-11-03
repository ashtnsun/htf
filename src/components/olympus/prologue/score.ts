/**
 * The Prologue's sound: ambience and effects, no music (the soundtrack that was tried is stored in
 * soundtrack.ts). Synthesised in the browser, so there are no audio files to license or load.
 * Under the deck, a bed that never quite stops: a fire (roar, hiss, crackle) where a fire is on
 * screen, and wind or moving air elsewhere. On cue: thunder, iron, whooshes, stones, ticks.
 *
 * On by default, S mutes; a browser plays nothing before the presenter's first key or click, so the
 * first press is what wakes it (`arm`). The energy sits between 200 Hz and 5 kHz, because laptops
 * and most projector speakers play next to nothing under 150 Hz.
 */
const MASTER = 1;
/** How long the sound lasts after the deck has been left, before it closes. */
const FINALE = 3.5;

/** A soft clipper's curve: linear when quiet, leaning over near full scale, never past it. */
function softClip() {
  const curve = new Float32Array(2048);
  const k = 1.1;
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

export class Score {
  private ctx: AudioContext | null = null;
  private mix: GainNode | null = null;
  private wet: GainNode | null = null;
  private fireGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private brown: AudioBuffer | null = null;
  private fireLevel = 0;
  private windLevel = 0;
  private crackling = 0;
  private ending = false;
  on = true;

  /** Call on the presenter's first key or click: the moment a browser lets sound start. */
  arm() {
    if (this.on) this.wake();
  }

  toggle() {
    this.on = !this.on;
    if (this.on) this.wake();
    this.mix?.gain.setTargetAtTime(this.on ? MASTER : 0, this.now, 0.1);
    return this.on;
  }

  private get now() {
    return this.ctx?.currentTime ?? 0;
  }

  private wake() {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 12;
      comp.ratio.value = 3;
      comp.attack.value = 0.006;
      comp.release.value = 0.25;
      const clip = ctx.createWaveShaper();
      clip.curve = softClip();
      clip.oversample = "2x";
      const ceiling = ctx.createGain();
      ceiling.gain.value = 0.9;
      comp.connect(clip);
      clip.connect(ceiling);
      ceiling.connect(ctx.destination);

      // The deep bass is what small speakers cannot play and what makes a big system boom.
      const shelf = ctx.createBiquadFilter();
      shelf.type = "lowshelf";
      shelf.frequency.value = 150;
      shelf.gain.value = -8;
      shelf.connect(comp);
      this.mix = ctx.createGain();
      this.mix.gain.value = this.on ? MASTER : 0;
      this.mix.connect(shelf);

      this.noise = this.buffer(4, () => Math.random() * 2 - 1);
      let last = 0;
      this.brown = this.buffer(8, () => {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        return last * 3.5;
      });

      // A small stone room, so the effects sit somewhere and do not click in from nowhere.
      const room = ctx.createConvolver();
      room.buffer = this.roomImpulse(ctx);
      this.wet = ctx.createGain();
      this.wet.gain.value = 0.6;
      this.wet.connect(room);
      room.connect(this.mix);

      this.buildFire(ctx);
      this.buildWind(ctx);
    }
    void this.ctx.resume();
    this.fireGain?.gain.setTargetAtTime(this.fireLevel, this.now, 0.5);
    this.windGain?.gain.setTargetAtTime(this.windLevel, this.now, 0.5);
    this.crackle();
  }

  private buffer(seconds: number, sample: () => number) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = sample();
    return buf;
  }

  /** Decaying noise, different in each ear. */
  private roomImpulse(ctx: AudioContext) {
    const length = Math.round(ctx.sampleRate * 1.6);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c += 1) {
      const data = impulse.getChannelData(c);
      let low = 0;
      for (let i = 0; i < length; i += 1) {
        const t = i / ctx.sampleRate;
        const smooth = Math.min(0.9, 0.3 + t * 0.6);
        low = low * smooth + (Math.random() * 2 - 1) * (1 - smooth);
        data[i] = low * Math.min(1, t / 0.012) * Math.exp(-t * 4) * 0.4;
      }
    }
    return impulse;
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
  private sway(ctx: AudioContext, rate: number, depth: number, param: AudioParam) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = depth;
    lfo.connect(gain);
    gain.connect(param);
    lfo.start();
  }

  /** The fire's bed: a roar that swells at no fixed rate, spread wide, and a hiss over it. */
  private buildFire(ctx: AudioContext) {
    this.fireGain = ctx.createGain();
    this.fireGain.gain.value = 0;
    this.fireGain.connect(this.mix!);

    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = "lowpass";
    roarFilter.frequency.value = 900;
    const roar = ctx.createGain();
    roar.gain.value = 0.3;
    roarFilter.connect(roar);
    roar.connect(this.fireGain);
    for (const side of [-0.6, 0.6]) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = side;
      pan.connect(roarFilter);
      this.loop(ctx, this.brown!, pan);
    }
    // Rates with no common beat: the swell never repeats audibly.
    this.sway(ctx, 0.31, 0.07, roar.gain);
    this.sway(ctx, 0.73, 0.05, roar.gain);
    this.sway(ctx, 0.19, 240, roarFilter.frequency);

    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = "highpass";
    hissFilter.frequency.value = 2600;
    const hiss = ctx.createGain();
    hiss.gain.value = 0.022;
    hissFilter.connect(hiss);
    hiss.connect(this.fireGain);
    this.loop(ctx, this.noise!, hissFilter);
    this.sway(ctx, 0.47, 0.008, hiss.gain);
  }

  /** Wind: noise through resonant bands that slide slowly up and down, a different one each ear. */
  private buildWind(ctx: AudioContext) {
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    this.windGain.connect(this.mix!);
    for (const [side, centre, slow, fast] of [
      [-0.7, 560, 0.07, 0.17],
      [0.7, 700, 0.053, 0.13],
    ] as const) {
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = centre;
      band.Q.value = 1.1;
      const gust = ctx.createGain();
      gust.gain.value = 0.32;
      const pan = ctx.createStereoPanner();
      pan.pan.value = side;
      band.connect(gust);
      gust.connect(pan);
      pan.connect(this.windGain);
      this.loop(ctx, this.noise!, band);
      this.sway(ctx, slow, 280, band.frequency);
      this.sway(ctx, fast, 130, band.frequency);
      this.sway(ctx, slow * 1.6, 0.12, gust.gain);
    }
  }

  /** Pops at random times, mostly tiny, now and then a knot of wood going. */
  private crackle = () => {
    window.clearTimeout(this.crackling);
    this.crackling = 0;
    if (!this.ctx || this.fireLevel <= 0.01) return;
    const big = Math.random() < 0.1;
    const freq = big ? 500 + Math.random() * 900 : 1800 + Math.random() * 3600;
    const peak = (big ? 0.55 : 0.2) * this.fireLevel * (0.35 + Math.random() * 0.65);
    this.burst(this.noise!, "bandpass", freq, peak, big ? 0.07 : 0.022);
    // Exponential gaps are what make them read as random and not as a rhythm.
    const gap = 25 - Math.log(1 - Math.random()) * 120;
    this.crackling = window.setTimeout(this.crackle, gap);
  };

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
    freq: number,
    peak: number,
    seconds: number,
    room = 0,
  ) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    const t = this.now;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.mix!);
    if (room) {
      const send = ctx.createGain();
      send.gain.value = room;
      gain.connect(send);
      send.connect(this.wet!);
    }
    src.start(t, Math.random() * Math.max(0, buf.duration - seconds), seconds + 0.02);
    return { filter, gain };
  }

  /** Something heavy landing: a falling tone with enough top for small speakers to carry it. */
  thud(weight = 1) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5 * weight, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    gain.connect(this.mix!);
    const send = ctx.createGain();
    send.gain.value = 0.4;
    gain.connect(send);
    send.connect(this.wet!);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(62, t + 0.1);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.55);
    this.burst(this.noise!, "bandpass", 560, 0.35 * weight, 0.09, 0.4);
  }

  /** A crack, then a long roll that swells twice and dies, with a band small speakers can play. */
  thunder() {
    if (!this.ctx) return;
    this.burst(this.noise!, "highpass", 1800, 0.5, 0.09, 0.6);
    this.burst(this.noise!, "bandpass", 900, 0.55, 0.32, 0.6);
    const { gain, filter } = this.burst(this.brown!, "lowpass", 700, 0.6, 5);
    const t = this.now;
    filter.frequency.setValueAtTime(1100, t);
    filter.frequency.exponentialRampToValueAtTime(260, t + 4.5);
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.75, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.5, t + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 5);
  }

  /** A small dry tick (the roulette, a typed letter, a card landing). */
  tick(freq = 1400, level = 0.2) {
    if (!this.ctx) return;
    this.burst(this.noise!, "bandpass", freq, level, 0.04, 0.15);
  }

  /** A stone set down: the setup steps. */
  stone() {
    if (!this.ctx) return;
    this.thud(0.55);
    this.burst(this.noise!, "bandpass", 620, 0.28, 0.13, 0.4);
  }

  /** Iron struck: partials with no common root are what make it ring and not sing. */
  clang() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const root = 380 + Math.random() * 70;
    for (const [ratio, level, decay] of [
      [1, 0.14, 0.7],
      [2.76, 0.1, 0.45],
      [5.4, 0.07, 0.28],
      [8.93, 0.04, 0.16],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.frequency.value = root * ratio;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(level, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      osc.connect(gain);
      gain.connect(this.mix!);
      gain.connect(this.wet!);
      osc.start(t);
      osc.stop(t + decay + 0.02);
    }
    this.thud(0.6);
    this.burst(this.noise!, "highpass", 2400, 0.22, 0.03);
  }

  /** Air moving: noise through a band that sweeps up and away, for cells flying or a fire catching. */
  whoosh(level = 0.14, seconds = 0.9) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.8;
    band.frequency.setValueAtTime(260, t);
    band.frequency.exponentialRampToValueAtTime(1900, t + seconds * 0.45);
    band.frequency.exponentialRampToValueAtTime(420, t + seconds);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + seconds * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(band);
    band.connect(gain);
    gain.connect(this.mix!);
    src.start(t, Math.random() * (this.noise!.duration - seconds), seconds);
  }

  /** The deck is being left: the fire and the air fall away over /oracle, then the sound closes. */
  finale() {
    const ctx = this.ctx;
    if (!ctx || this.ending) return;
    this.ending = true;
    this.fire(0, 1.8);
    this.wind(0, 1.8);
    this.whoosh(0.12, 1.8);
    window.setTimeout(() => this.shut(), FINALE * 1000);
  }

  private shut() {
    window.clearTimeout(this.crackling);
    this.crackling = 0;
    void this.ctx?.close();
    this.ctx = null;
  }

  /** The page is going. After the finale, that is its own timer's job. */
  close() {
    if (!this.ending) this.shut();
  }
}
