/**
 * The Prologue's sound: one small, quiet piece of music under the whole deck, and effects on cue
 * over it (thunder, iron, a stone set down, the wheel's pegs). Synthesised in the browser, so there
 * are no audio files to license or load. (The full score that was tried and taken off is stored in
 * soundtrack.ts; this is not that.)
 *
 * The music is four soft chords, ten seconds each, and now and then one slow note over them. There
 * is no beat, and no noise bed of any kind: no wind, no room tone, nothing that hisses. Each stretch
 * of the deck only moves its level and brightness (AMBIENCES); a slide with a fire on it also gets
 * the fire's crackle. The one exception is the opening: `rise` builds up the mountain and holds at
 * the top, a breath of silence comes before the lightning, and `land` opens out under the thunder.
 *
 * On by default, S mutes; a browser plays nothing before the presenter's first key or click, so the
 * first press is what wakes it (`arm`). The energy sits between 200 Hz and 5 kHz, because laptops
 * and most projector speakers play next to nothing under 150 Hz.
 */
const MASTER = 1;
/** How long the sound lasts after the deck has been left, before it closes. */
const FINALE = 3.5;

/** Seconds a chord holds before the next starts to come in over it. */
const BAR = 10;
/** Seconds a chord takes to come in and to go, so one is always leaving as the next arrives. */
const SWELL = 4;
const SCHEDULE_MS = 500;
const LOOK_AHEAD = 2;
/** Each voice of a chord at full level. Quiet on purpose: the room should have to listen for it. */
const PAD_VOICE = 0.016;
const NOTE_LEVEL = 0.05;

/** Em7, Cmaj7, Gadd9, D, as MIDI notes, voiced close so each leads into the next. */
const CHORDS = [
  [52, 59, 62, 67, 71],
  [48, 59, 64, 67, 71],
  [55, 59, 62, 69, 71],
  [50, 57, 62, 66, 69],
] as const;

/** The slow notes, a bar to a line, twice round the chords: [seconds into the bar, MIDI note]. */
const NOTES: readonly (readonly (readonly [number, number])[])[] = [
  [
    [1.5, 71],
    [3.5, 74],
    [6, 76],
  ],
  [
    [2, 76],
    [5, 71],
  ],
  [
    [1.5, 74],
    [4, 71],
    [7, 69],
  ],
  [
    [3, 69],
    [6, 66],
  ],
  [],
  [
    [2, 67],
    [4, 71],
    [6.5, 72],
  ],
  [
    [1.5, 74],
    [5, 71],
  ],
  [[3, 69]],
];

/** The climb's chords, higher each time, as the camera goes up. */
const CLIMB_CHORDS = [
  [52, 59, 62, 67],
  [55, 60, 64, 67, 72],
  [55, 62, 67, 69, 74],
  [57, 64, 67, 72, 76, 79],
] as const;
/** Held at the top, wanting to go somewhere: Dsus4. */
const TOP_CHORD = [57, 62, 67, 74, 79, 86] as const;
/** What it goes to, under the thunder: E minor, wide open. */
const LAND_CHORD = [52, 59, 64, 67, 71, 76, 83] as const;
/** The music's level at the top of the climb and at the end of the hold. */
const RISE_TOP = 1.6;
const RISE_PEAK = 2.1;
/** Seconds of near silence before the lightning. */
const BREATH = 0.45;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const PENTATONIC = [0, 3, 5, 7, 10];
/** E minor pentatonic, counted up from E4. */
const pentatonic = (step: number) =>
  64 + 12 * Math.floor(step / 5) + PENTATONIC[((step % 5) + 5) % 5]!;

type Mood = {
  /** The music's level, 0 to 1. */
  level: number;
  /** How bright the chords are: the cut-off of their filter, in Hz. */
  bright: number;
  /** Whether the slow notes play over the chords. */
  notes: boolean;
  /** How close a fire is: its crackle, 0 to 1. */
  fire?: number;
};

export const AMBIENCES = {
  /** Standby: the fire, and the chords barely there. */
  hearth: { level: 0.55, bright: 650, notes: false, fire: 0.7 },
  /** The top, the braziers close by. */
  summit: { level: 1, bright: 1300, notes: true, fire: 0.15 },
  /** The execs. */
  hall: { level: 0.75, bright: 800, notes: true },
  /** The chain being forged: the music steps back for the hammer. */
  forge: { level: 0.45, bright: 700, notes: false },
  /** The fire has caught. */
  forged: { level: 0.7, bright: 1100, notes: true, fire: 0.35 },
  /** The practical slides. */
  study: { level: 0.6, bright: 800, notes: true },
  /** The column. */
  temple: { level: 0.75, bright: 900, notes: true },
  /** The Oracle. */
  oracle: { level: 0.85, bright: 1000, notes: true, fire: 0.5 },
} satisfies Record<string, Mood>;

export type Ambience = keyof typeof AMBIENCES;

const SILENT: Mood = { level: 0, bright: 800, notes: false };

/** A soft clipper's curve: linear when quiet, leaning over near full scale, never past it. */
export function softClip() {
  const curve = new Float32Array(2048);
  const k = 1.1;
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

/** Decaying noise, different in each ear: a room to send sound into. */
export function roomImpulse(ctx: AudioContext, seconds: number, decay: number) {
  const length = Math.round(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c += 1) {
    const data = impulse.getChannelData(c);
    let low = 0;
    for (let i = 0; i < length; i += 1) {
      const t = i / ctx.sampleRate;
      const smooth = Math.min(0.9, 0.3 + t * 0.6);
      low = low * smooth + (Math.random() * 2 - 1) * (1 - smooth);
      data[i] = low * Math.min(1, t / 0.012) * Math.exp(-t * decay) * 0.4;
    }
  }
  return impulse;
}

export class Score {
  private ctx: AudioContext | null = null;
  private mix: GainNode | null = null;
  private wet: GainNode | null = null;
  private music: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private noteBus: GainNode | null = null;
  /** What is playing now, by way of these: replacing them fades it, however far ahead it is booked. */
  private padSection: GainNode | null = null;
  private noteSection: GainNode | null = null;
  private rising = false;
  private noise: AudioBuffer | null = null;
  private brown: AudioBuffer | null = null;
  private current: Mood = SILENT;
  private bar = 0;
  private nextBarAt = 0;
  private scheduling = 0;
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

  /** Moves the music to this stretch of the deck over `seconds`. */
  ambience(name: Ambience, seconds = 1.5) {
    this.endRise(1);
    this.current = AMBIENCES[name];
    this.applyMood(seconds);
  }

  private applyMood(seconds: number) {
    if (this.rising) return;
    const { level, bright, notes, fire = 0 } = this.current;
    const rate = seconds / 3;
    this.music?.gain.setTargetAtTime(level, this.now, rate);
    this.padFilter?.frequency.setTargetAtTime(bright, this.now, rate);
    this.noteBus?.gain.setTargetAtTime(notes ? 1 : 0, this.now, rate);
    if (fire > 0.01 && !this.crackling) this.crackle();
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
      room.buffer = roomImpulse(ctx, 1.6, 4);
      this.wet = ctx.createGain();
      this.wet.gain.value = 0.6;
      this.wet.connect(room);
      room.connect(this.mix);

      this.buildMusic(ctx);
      this.nextBarAt = ctx.currentTime + 0.05;
      this.schedule();
      this.scheduling = window.setInterval(this.schedule, SCHEDULE_MS);
    }
    void this.ctx.resume();
    this.applyMood(1.5);
  }

  private buffer(seconds: number, sample: () => number) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = sample();
    return buf;
  }

  /** The music's path: chords through a slow filter and the notes, both into a long soft room. */
  private buildMusic(ctx: AudioContext) {
    const music = ctx.createGain();
    music.gain.value = 0;
    music.connect(this.mix!);
    this.music = music;

    const space = ctx.createConvolver();
    space.buffer = roomImpulse(ctx, 4, 1.6);
    const send = ctx.createGain();
    send.gain.value = 0.5;
    music.connect(send);
    send.connect(space);
    space.connect(this.mix!);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = SILENT.bright;
    filter.Q.value = 0.4;
    filter.connect(music);
    this.padFilter = filter;
    // So a held chord is never quite still.
    const drift = ctx.createOscillator();
    drift.frequency.value = 0.07;
    const depth = ctx.createGain();
    depth.gain.value = 140;
    drift.connect(depth);
    depth.connect(filter.frequency);
    drift.start();

    const notes = ctx.createGain();
    notes.gain.value = 0;
    notes.connect(music);
    this.noteBus = notes;
    this.freshSection(0);
  }

  /** Fades out everything booked so far and opens the way for what comes next. */
  private freshSection(fade: number) {
    const ctx = this.ctx!;
    for (const old of [this.padSection, this.noteSection]) {
      old?.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
    }
    this.padSection = ctx.createGain();
    this.padSection.connect(this.padFilter!);
    this.noteSection = ctx.createGain();
    this.noteSection.connect(this.noteBus!);
  }

  /**
   * The opening: `arrive` seconds up the mountain and held until `strike`. The chords climb and the
   * notes run up the scale, closer and closer, until the camera stops; then only one held chord,
   * growing, until the breath before the lightning.
   */
  rise(arrive: number, strike: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    this.rising = true;
    this.current = SILENT;
    this.freshSection(1.2);
    const t = ctx.currentTime + 0.05;
    // The usual chords wait until after the strike; `land` says exactly when.
    this.nextBarAt = t + strike;

    const hold = (param: AudioParam, from: number) => {
      param.cancelScheduledValues(ctx.currentTime);
      param.setValueAtTime(from, ctx.currentTime);
    };
    const level = this.music!.gain;
    hold(level, level.value);
    level.linearRampToValueAtTime(0.8, t + 1.5);
    level.linearRampToValueAtTime(RISE_TOP, t + arrive);
    level.linearRampToValueAtTime(RISE_PEAK, t + strike - BREATH);
    level.linearRampToValueAtTime(0.03, t + strike - 0.05);
    const bright = this.padFilter!.frequency;
    hold(bright, 500);
    bright.linearRampToValueAtTime(1900, t + arrive);
    bright.linearRampToValueAtTime(3000, t + strike - BREATH);
    hold(this.noteBus!.gain, 1);

    const step = arrive / CLIMB_CHORDS.length;
    CLIMB_CHORDS.forEach((chord, c) => {
      chord.forEach((midi, i) => this.padVoice(midi, i, t + c * step, 2.5, step, 2.5));
    });
    // The swell has to fit inside the hold, or its envelope's points land out of order.
    const held = strike - arrive;
    const swell = Math.min(2, held * 0.6);
    TOP_CHORD.forEach((midi, i) => this.padVoice(midi, i, t + arrive, swell, held, 0.5));

    let at = 0.8;
    for (let n = 0; at < arrive; n += 1) {
      const up = at / arrive;
      this.note(pentatonic(n), t + at, NOTE_LEVEL * (0.7 + 0.5 * up));
      at += 1.5 - 1.05 * up;
    }
  }

  /** The lightning: the climb's chord gives way at once to one wide open chord, under the thunder. */
  land() {
    const ctx = this.ctx;
    if (!ctx) return;
    this.endRise(0.2);
    const t = ctx.currentTime;
    LAND_CHORD.forEach((midi, i) => this.padVoice(midi, i, t, 0.2, 7, 6, PAD_VOICE * 1.4));
    this.bar = 1;
    this.nextBarAt = t + 8;
  }

  private endRise(fade: number) {
    const ctx = this.ctx;
    if (!ctx || !this.rising) return;
    this.rising = false;
    this.freshSection(fade);
    for (const param of [this.music!.gain, this.padFilter!.frequency, this.noteBus!.gain]) {
      param.cancelScheduledValues(ctx.currentTime);
      param.setValueAtTime(param.value, ctx.currentTime);
    }
    this.bar = 0;
    this.nextBarAt = ctx.currentTime + 0.05;
  }

  /** Puts the next bars on the audio clock a little ahead of time. */
  private schedule = () => {
    const ctx = this.ctx;
    if (!ctx || this.ending || this.rising) return;
    while (this.nextBarAt < ctx.currentTime + LOOK_AHEAD) {
      const at = Math.max(this.nextBarAt, ctx.currentTime + 0.05);
      CHORDS[this.bar % CHORDS.length]!.forEach((midi, i) => this.padVoice(midi, i, at));
      for (const [offset, midi] of NOTES[this.bar % NOTES.length]!) this.note(midi, at + offset);
      this.bar += 1;
      this.nextBarAt = at + BAR;
    }
  };

  /** One voice of a chord: two triangles a few cents apart, so it breathes, spread across the room. */
  private padVoice(
    midi: number,
    index: number,
    at: number,
    attack = SWELL,
    hold = BAR,
    release = SWELL,
    level = PAD_VOICE,
  ) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + attack);
    gain.gain.setValueAtTime(level, at + hold);
    gain.gain.linearRampToValueAtTime(0, at + hold + release);
    const pan = ctx.createStereoPanner();
    pan.pan.value = ((index % 5) / 4) * 0.9 - 0.45;
    gain.connect(pan);
    pan.connect(this.padSection!);
    for (const cents of [-5, 5]) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = hz(midi);
      osc.detune.value = cents;
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + hold + release + 0.05);
    }
  }

  /** One slow note: a soft strike that takes a few seconds to die, with a little octave in it. */
  private note(midi: number, at: number, level = NOTE_LEVEL) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 3.2);
    const pan = ctx.createStereoPanner();
    pan.pan.value = ((midi * 7) % 5) * 0.15 - 0.3;
    gain.connect(pan);
    pan.connect(this.noteSection!);
    for (const [ratio, level] of [
      [1, 1],
      [2, 0.22],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.frequency.value = hz(midi) * ratio;
      const voice = ctx.createGain();
      voice.gain.value = level;
      osc.connect(voice);
      voice.connect(gain);
      osc.start(at);
      osc.stop(at + 3.3);
    }
  }

  /** Pops at random times, mostly tiny, now and then a knot of wood going. */
  private crackle = () => {
    window.clearTimeout(this.crackling);
    this.crackling = 0;
    const level = this.current.fire ?? 0;
    if (!this.ctx || level <= 0.01) return;
    const big = Math.random() < 0.1;
    const freq = big ? 500 + Math.random() * 900 : 1800 + Math.random() * 3200;
    const peak = (big ? 0.5 : 0.16) * level * (0.35 + Math.random() * 0.65);
    this.burst(this.noise!, "bandpass", freq, peak, big ? 0.07 : 0.022);
    // Exponential gaps are what make them read as random and not as a rhythm.
    const gap = 40 - Math.log(1 - Math.random()) * 170;
    this.crackling = window.setTimeout(this.crackle, gap);
  };

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

  /** A small dry tick (a typed letter, a card landing). */
  tick(freq = 1400, level = 0.2) {
    if (!this.ctx) return;
    this.burst(this.noise!, "bandpass", freq, level, 0.04, 0.15);
  }

  /** One stop of the randomizer, like a game's selector: a soft square blip that climbs the scale. */
  blip(step: number) {
    if (!this.ctx) return;
    this.chip(hz(pentatonic(step)), this.ctx.currentTime, 0.14, 0.09, 0.12);
  }

  /** The randomizer locking in: four notes run quickly up and left to ring. */
  lockIn() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i += 1) {
      this.chip(hz(pentatonic(10 + i)), t + i * 0.055, 0.12, i === 3 ? 0.7 : 0.3, 0.45);
    }
  }

  /** One game-sound note: a square wave with its harshest top taken off, dipping as it starts. */
  private chip(freq: number, at: number, level: number, seconds: number, room: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq * 1.03, at);
    osc.frequency.exponentialRampToValueAtTime(freq, at + 0.03);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 4000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    const send = ctx.createGain();
    send.gain.value = room;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.mix!);
    gain.connect(send);
    send.connect(this.wet!);
    osc.start(at);
    osc.stop(at + seconds + 0.02);
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
    this.current = SILENT;
    this.applyMood(1.8);
    window.setTimeout(() => this.shut(), FINALE * 1000);
  }

  private shut() {
    window.clearTimeout(this.crackling);
    this.crackling = 0;
    window.clearInterval(this.scheduling);
    this.scheduling = 0;
    void this.ctx?.close();
    this.ctx = null;
  }

  /** The page is going. After the finale, that is its own timer's job. */
  close() {
    if (!this.ending) this.shut();
  }
}
