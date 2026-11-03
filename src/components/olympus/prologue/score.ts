/**
 * The Prologue's sound: ambience and effects, no music (the soundtrack that was tried is stored in
 * soundtrack.ts). Synthesised in the browser, so there are no audio files to license or load.
 *
 * Each stretch of the deck has its own place to be in (AMBIENCES), a mix of a few beds (a fire,
 * wind, a stone hall, a quiet room) and of things that happen now and then in it (a drip, a chain
 * shifting, thunder a long way off, someone at a keyboard). On cue, over that: thunder, iron,
 * whooshes, stones, ticks.
 *
 * On by default, S mutes; a browser plays nothing before the presenter's first key or click, so the
 * first press is what wakes it (`arm`). The energy sits between 200 Hz and 5 kHz, because laptops
 * and most projector speakers play next to nothing under 150 Hz.
 */
const MASTER = 1;
/** How long the sound lasts after the deck has been left, before it closes. */
const FINALE = 3.5;
/** How often the scattered sounds get their chance. */
const SCATTER_MS = 200;

type Bed = "fire" | "wind" | "hall" | "room";
/** Each is how many a second, on average. */
type Scatter = "drips" | "chains" | "farThunder" | "keys";
type Mix = Partial<Record<Bed | Scatter, number>>;

const BEDS: readonly Bed[] = ["fire", "wind", "hall", "room"];

export const AMBIENCES = {
  /** Standby: a fire in the dark and nothing else. */
  hearth: { fire: 0.8 },
  /** The climb: wind on the rock, thunder somewhere behind it. */
  mountain: { wind: 0.85, farThunder: 0.14 },
  /** The top: less wind, the braziers close by. */
  summit: { wind: 0.35, fire: 0.2, farThunder: 0.05 },
  /** The execs: a big stone room with water in it and torches on the wall. */
  hall: { hall: 0.9, fire: 0.1, drips: 0.55 },
  /** The chain before it is finished: the room, and iron shifting. */
  forge: { hall: 0.6, chains: 0.7 },
  /** The fire has caught. */
  forged: { hall: 0.45, fire: 0.45, chains: 0.45 },
  /** The practical slides: a quiet room with people in it, someone typing. */
  study: { room: 0.9, keys: 1.1 },
  /** The column: back in the stone, a breath of air through it. */
  temple: { hall: 0.8, wind: 0.12, drips: 0.3 },
  /** The Oracle: the fire in that same stone room. */
  oracle: { fire: 0.8, hall: 0.5 },
} satisfies Record<string, Mix>;

export type Ambience = keyof typeof AMBIENCES;

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
  private beds: Partial<Record<Bed, GainNode>> = {};
  private noise: AudioBuffer | null = null;
  private brown: AudioBuffer | null = null;
  private current: Mix = {};
  private crackling = 0;
  private scattering = 0;
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

  /** Crossfades to a place over `seconds`. */
  ambience(name: Ambience, seconds = 1.5) {
    this.current = AMBIENCES[name];
    this.applyBeds(seconds);
  }

  private applyBeds(seconds: number) {
    for (const bed of BEDS) {
      this.beds[bed]?.gain.setTargetAtTime(this.current[bed] ?? 0, this.now, seconds / 3);
    }
    if ((this.current.fire ?? 0) > 0.01 && !this.crackling) this.crackle();
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

      // A stone room, so the effects sit somewhere and do not click in from nowhere.
      const room = ctx.createConvolver();
      room.buffer = this.roomImpulse(ctx);
      this.wet = ctx.createGain();
      this.wet.gain.value = 0.6;
      this.wet.connect(room);
      room.connect(this.mix);

      this.buildFire(ctx);
      this.buildWind(ctx);
      this.buildHall(ctx);
      this.buildRoom(ctx);
      this.scattering = window.setInterval(this.scatter, SCATTER_MS);
    }
    void this.ctx.resume();
    this.applyBeds(1.5);
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

  private bed(ctx: AudioContext, name: Bed) {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.mix!);
    this.beds[name] = gain;
    return gain;
  }

  /** The fire's bed: a roar that swells at no fixed rate, spread wide, and a hiss over it. */
  private buildFire(ctx: AudioContext) {
    const out = this.bed(ctx, "fire");
    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = "lowpass";
    roarFilter.frequency.value = 900;
    const roar = ctx.createGain();
    roar.gain.value = 0.3;
    roarFilter.connect(roar);
    roar.connect(out);
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
    hiss.connect(out);
    this.loop(ctx, this.noise!, hissFilter);
    this.sway(ctx, 0.47, 0.008, hiss.gain);
  }

  /** Wind: noise through resonant bands that slide slowly up and down, a different one each ear. */
  private buildWind(ctx: AudioContext) {
    const out = this.bed(ctx, "wind");
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
      pan.connect(out);
      this.loop(ctx, this.noise!, band);
      this.sway(ctx, slow, 280, band.frequency);
      this.sway(ctx, fast, 130, band.frequency);
      this.sway(ctx, slow * 1.6, 0.12, gust.gain);
    }
  }

  /**
   * A big stone room with nothing happening in it: a dark, still, low air, with none of the wind's
   * movement. Two resonances the size of a hall, breathing very slowly.
   */
  private buildHall(ctx: AudioContext) {
    const out = this.bed(ctx, "hall");
    for (const [side, centre, q, level, rate] of [
      [-0.5, 210, 2.2, 0.5, 0.041],
      [0.5, 340, 2.6, 0.36, 0.067],
    ] as const) {
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = centre;
      band.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = level;
      const pan = ctx.createStereoPanner();
      pan.pan.value = side;
      band.connect(gain);
      gain.connect(pan);
      pan.connect(out);
      this.loop(ctx, this.brown!, band);
      this.sway(ctx, rate, level * 0.3, gain.gain);
    }
  }

  /** A quiet room: the even rush of air and machines, higher and steadier than the hall. */
  private buildRoom(ctx: AudioContext) {
    const out = this.bed(ctx, "room");
    // A loop in each ear, from different places: a room is wide.
    for (const side of [-0.7, 0.7]) {
      const low = ctx.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.value = 2200;
      const high = ctx.createBiquadFilter();
      high.type = "highpass";
      high.frequency.value = 260;
      const gain = ctx.createGain();
      gain.gain.value = 0.05;
      const pan = ctx.createStereoPanner();
      pan.pan.value = side;
      low.connect(high);
      high.connect(gain);
      gain.connect(pan);
      pan.connect(out);
      this.loop(ctx, this.noise!, low);
      this.sway(ctx, side < 0 ? 0.09 : 0.067, 0.008, gain.gain);
    }
  }

  /** Pops at random times, mostly tiny, now and then a knot of wood going. */
  private crackle = () => {
    window.clearTimeout(this.crackling);
    this.crackling = 0;
    const level = this.current.fire ?? 0;
    if (!this.ctx || level <= 0.01) return;
    const big = Math.random() < 0.1;
    const freq = big ? 500 + Math.random() * 900 : 1800 + Math.random() * 3600;
    const peak = (big ? 0.55 : 0.2) * level * (0.35 + Math.random() * 0.65);
    this.burst(this.noise!, "bandpass", freq, peak, big ? 0.07 : 0.022);
    // Exponential gaps are what make them read as random and not as a rhythm.
    const gap = 25 - Math.log(1 - Math.random()) * 120;
    this.crackling = window.setTimeout(this.crackle, gap);
  };

  /** Gives each of this place's scattered sounds its chance. */
  private scatter = () => {
    if (!this.ctx || this.ending) return;
    const chance = (rate = 0) => Math.random() < (rate * SCATTER_MS) / 1000;
    if (chance(this.current.drips)) this.drip();
    if (chance(this.current.chains)) this.chainShift();
    if (chance(this.current.farThunder)) this.farThunder();
    if (chance(this.current.keys)) this.keyTap();
  };

  /** Water falling on stone, somewhere off in the room: a little rising bloop, mostly echo. */
  private drip() {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const start = 700 + Math.random() * 800;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(start, t);
    osc.frequency.exponentialRampToValueAtTime(start * 1.7, t + 0.06);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.13, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    osc.connect(gain);
    gain.connect(pan);
    pan.connect(this.mix!);
    const send = ctx.createGain();
    send.gain.value = 1.4;
    gain.connect(send);
    send.connect(this.wet!);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /** A heavy chain shifting: two or three small high knocks of iron on iron. */
  private chainShift() {
    const ctx = this.ctx!;
    const knocks = 2 + Math.floor(Math.random() * 2);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.2 - 0.6;
    pan.connect(this.mix!);
    pan.connect(this.wet!);
    for (let k = 0; k < knocks; k += 1) {
      const t = ctx.currentTime + k * (0.09 + Math.random() * 0.1);
      const root = 1500 + Math.random() * 900;
      for (const [ratio, level, decay] of [
        [1, 0.07, 0.16],
        [1.83, 0.045, 0.1],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.frequency.value = root * ratio;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(level, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        osc.connect(gain);
        gain.connect(pan);
        osc.start(t);
        osc.stop(t + decay + 0.02);
      }
    }
  }

  /** Thunder a long way off: no crack, only a slow low roll you notice after it has started. */
  private farThunder() {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const seconds = 3.5 + Math.random() * 2;
    const src = ctx.createBufferSource();
    src.buffer = this.brown;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.32, t + seconds * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.14, t + seconds * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.mix!);
    gain.connect(this.wet!);
    src.start(t, Math.random() * 2, seconds);
  }

  /** Someone typing across the room: a short run of quiet, uneven key taps. */
  private keyTap() {
    const taps = 2 + Math.floor(Math.random() * 5);
    let delay = 0;
    for (let k = 0; k < taps; k += 1) {
      window.setTimeout(() => {
        if (!this.ctx) return;
        const level = 0.05 + Math.random() * 0.05;
        this.burst(this.noise!, "bandpass", 1500 + Math.random() * 1400, level, 0.03, 0.2);
      }, delay);
      delay += 90 + Math.random() * 130;
    }
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

  /** The deck is being left: everything falls away over /oracle, then the sound closes. */
  finale() {
    if (!this.ctx || this.ending) return;
    this.ending = true;
    this.current = {};
    this.applyBeds(1.8);
    this.whoosh(0.12, 1.8);
    window.setTimeout(() => this.shut(), FINALE * 1000);
  }

  private shut() {
    window.clearTimeout(this.crackling);
    this.crackling = 0;
    window.clearInterval(this.scattering);
    this.scattering = 0;
    void this.ctx?.close();
    this.ctx = null;
  }

  /** The page is going. After the finale, that is its own timer's job. */
  close() {
    if (!this.ending) this.shut();
  }
}
