import {
  LAST_CHORD,
  SECTIONS,
  type Chord,
  type HornNote,
  type Section,
  type SectionName,
} from "@/components/olympus/prologue/cuesheet";

/**
 * STORED, NOT USED (2026-11-02): Ashton took it off the Prologue as too much, in favour of the
 * ambience and effects in score.ts. Nothing imports this file or cuesheet.ts, so neither ships. To
 * bring it back, use this class in Prologue in place of `Score`, and call `section()` from the cues
 * (the calls are in commit 4bce4d4).
 *
 * A full soundtrack, synthesised in the browser so there are no audio files to license or load: an
 * orchestra of a few synth voices (strings, choir, horns, low pulse, drums, a shaker and a plucked
 * lyre) in one big reverb, playing the sections in cuesheet.ts, over the fire and the wind, with
 * hits on cue (thunder, the low brass "braam", iron, whooshes).
 *
 * `section()` cuts to a section the moment a slide starts, as an edit does in a film, so the music
 * never waits for a bar line. On by default, S mutes; a browser plays nothing before the
 * presenter's first key or click, so the first press is what wakes it (`arm`).
 *
 * Most of the energy is deliberately between 200 Hz and 5 kHz: laptops and most projector speakers
 * play next to nothing under 150 Hz. The output goes through a compressor and then a soft clipper,
 * so it runs loud and can never go over full scale.
 */
const BEAT = 0.6;
const STEP = BEAT / 4;
const BAR = BEAT * 4;
/** How far ahead the sequencer schedules, and how often it wakes to do so. */
const LOOKAHEAD = 0.2;
const TICK_MS = 40;
const MASTER = 1;
/** How long the last chord rings out over /oracle before the sound closes. */
const FINALE = 8;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** A soft clipper's curve: linear when quiet, leaning over near full scale, never past it. */
function softClip() {
  const curve = new Float32Array(4096);
  const k = 1.1;
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

/** A heavier curve for the drums and the braam: it adds the harmonics small speakers can play. */
function driveCurve() {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(3 * x);
  }
  return curve;
}

export class Soundtrack {
  private ctx: AudioContext | null = null;
  private mix: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private wet: GainNode | null = null;
  private drive: WaveShaperNode | null = null;
  private fireGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private choirIn: GainNode | null = null;
  private vibrato: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private brown: AudioBuffer | null = null;
  private plucks: { base: number; buffer: AudioBuffer }[] = [];
  private fireLevel = 0;
  private windLevel = 0;
  private crackling = 0;

  // The sequencer: what is playing, the step it is on, and the bus this section plays through.
  private current: SectionName = "standby";
  private bus: GainNode | null = null;
  private choirGate: GainNode | null = null;
  private hallSend: GainNode | null = null;
  private step = 0;
  private nextStep = 0;
  private started = 0;
  private ticking = 0;
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

  // ---------------------------------------------------------------- the desk

  private wake() {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 14;
      comp.ratio.value = 4;
      comp.attack.value = 0.008;
      comp.release.value = 0.22;
      const makeup = ctx.createGain();
      makeup.gain.value = 1.05;
      const clip = ctx.createWaveShaper();
      clip.curve = softClip();
      clip.oversample = "2x";
      comp.connect(makeup);
      makeup.connect(clip);
      // The clipper's oversampling can ring a hair past full scale (measured: 1.08 on a big hit).
      const ceiling = ctx.createGain();
      ceiling.gain.value = 0.9;
      clip.connect(ceiling);
      ceiling.connect(ctx.destination);

      // Laptops and projectors cannot play the deep bass, and it eats the headroom of what they can.
      const rumble = ctx.createBiquadFilter();
      rumble.type = "highpass";
      rumble.frequency.value = 42;
      const shelf = ctx.createBiquadFilter();
      shelf.type = "lowshelf";
      shelf.frequency.value = 150;
      shelf.gain.value = -8;
      const air = ctx.createBiquadFilter();
      air.type = "highshelf";
      air.frequency.value = 3200;
      air.gain.value = 3;
      rumble.connect(shelf);
      shelf.connect(air);
      air.connect(comp);

      this.mix = ctx.createGain();
      this.mix.gain.value = this.on ? MASTER : 0;
      this.mix.connect(rumble);
      this.music = ctx.createGain();
      this.music.connect(this.mix);
      this.sfx = ctx.createGain();
      this.sfx.connect(this.mix);

      this.noise = this.buffer(4, () => Math.random() * 2 - 1);
      let last = 0;
      this.brown = this.buffer(8, () => {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        return last * 3.5;
      });

      // One hall for everything: it is most of what makes separate voices sound like one room.
      const hall = ctx.createConvolver();
      hall.buffer = this.hallImpulse(ctx);
      this.wet = ctx.createGain();
      this.wet.gain.value = 0.9;
      this.wet.connect(hall);
      hall.connect(this.mix);

      this.drive = ctx.createWaveShaper();
      this.drive.curve = driveCurve();
      this.drive.oversample = "2x";
      const driven = ctx.createGain();
      driven.gain.value = 0.7;
      this.drive.connect(driven);
      driven.connect(this.music);
      driven.connect(this.wet);

      this.buildChoir(ctx);
      this.buildFire(ctx);
      this.buildWind(ctx);
      this.plucks = [52, 64, 76].map((base) => ({ base, buffer: this.renderPluck(ctx, hz(base)) }));
    }
    void this.ctx.resume();
    this.fireGain?.gain.setTargetAtTime(this.fireLevel, this.now, 0.5);
    this.windGain?.gain.setTargetAtTime(this.windLevel, this.now, 0.5);
    this.crackle();
    if (!this.ticking && !this.ending) {
      this.begin();
      this.ticking = window.setInterval(this.advance, TICK_MS);
    }
  }

  private buffer(seconds: number, sample: () => number) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = sample();
    return buf;
  }

  /** Decaying noise, different in each ear, its treble dying faster than its body. */
  private hallImpulse(ctx: AudioContext) {
    const seconds = 3.4;
    const length = Math.round(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c += 1) {
      const data = impulse.getChannelData(c);
      let low = 0;
      for (let i = 0; i < length; i += 1) {
        const t = i / ctx.sampleRate;
        const smooth = Math.min(0.9, 0.25 + t * 0.35);
        low = low * smooth + (Math.random() * 2 - 1) * (1 - smooth);
        // A short gap before the tail, as a big room has.
        const onset = Math.min(1, t / 0.02);
        data[i] = low * onset * Math.exp(-t * 2.2) * 0.32;
      }
    }
    return impulse;
  }

  /** A plucked string (Karplus-Strong), rendered once and repitched per note. */
  private renderPluck(ctx: AudioContext, freq: number) {
    const rate = ctx.sampleRate;
    const length = Math.round(rate * 2.4);
    const period = Math.round(rate / freq);
    const buf = ctx.createBuffer(1, length, rate);
    const data = buf.getChannelData(0);
    let held = 0;
    for (let i = 0; i < period; i += 1) {
      held = held * 0.35 + (Math.random() * 2 - 1) * 0.65;
      data[i] = held;
    }
    for (let i = period; i < length; i += 1) {
      data[i] =
        ((data[i - period]! + data[i - period - 1 >= 0 ? i - period - 1 : 0]!) / 2) * 0.9975;
    }
    let peak = 0;
    for (const v of data) peak = Math.max(peak, Math.abs(v));
    for (let i = 0; i < length; i += 1) data[i] = data[i]! / peak;
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
  private sway(ctx: AudioContext, rate: number, depth: number, param: AudioParam) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = depth;
    lfo.connect(gain);
    gain.connect(param);
    lfo.start();
  }

  /** Three vowel resonances over a shared input: what turns saws into "ah". */
  private buildChoir(ctx: AudioContext) {
    this.choirIn = ctx.createGain();
    const out = ctx.createGain();
    out.gain.value = 3.2;
    for (const [freq, q, level] of [
      [750, 7, 1],
      [1180, 9, 0.6],
      [2750, 11, 0.32],
    ] as const) {
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = freq;
      band.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = level;
      this.choirIn.connect(band);
      band.connect(gain);
      gain.connect(out);
    }
    out.connect(this.music!);
    out.connect(this.wet!);
    const wobble = ctx.createOscillator();
    wobble.frequency.value = 5.1;
    this.vibrato = ctx.createGain();
    this.vibrato.gain.value = 9;
    wobble.connect(this.vibrato);
    wobble.start();
  }

  /** The fire's bed: a roar that swells at no fixed rate, and a hiss over it. */
  private buildFire(ctx: AudioContext) {
    this.fireGain = ctx.createGain();
    this.fireGain.gain.value = 0;
    this.fireGain.connect(this.sfx!);

    const roarFilter = ctx.createBiquadFilter();
    roarFilter.type = "lowpass";
    roarFilter.frequency.value = 900;
    const roar = ctx.createGain();
    roar.gain.value = 0.5;
    roarFilter.connect(roar);
    roar.connect(this.fireGain);
    // Two loops from different places, one in each ear: a fire is wide.
    for (const side of [-0.6, 0.6]) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = side;
      pan.connect(roarFilter);
      this.loop(ctx, this.brown!, pan);
    }
    // Rates with no common beat: the swell never repeats audibly.
    this.sway(ctx, 0.31, 0.12, roar.gain);
    this.sway(ctx, 0.73, 0.09, roar.gain);
    this.sway(ctx, 0.19, 240, roarFilter.frequency);

    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = "highpass";
    hissFilter.frequency.value = 2600;
    const hiss = ctx.createGain();
    hiss.gain.value = 0.045;
    hissFilter.connect(hiss);
    hiss.connect(this.fireGain);
    this.loop(ctx, this.noise!, hissFilter);
    this.sway(ctx, 0.47, 0.015, hiss.gain);
  }

  /** Wind: noise through a resonant band that slides slowly up and down. */
  private buildWind(ctx: AudioContext) {
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    this.windGain.connect(this.sfx!);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 620;
    band.Q.value = 1.1;
    const gust = ctx.createGain();
    gust.gain.value = 0.34;
    band.connect(gust);
    gust.connect(this.windGain);
    this.loop(ctx, this.noise!, band);
    this.sway(ctx, 0.07, 300, band.frequency);
    this.sway(ctx, 0.17, 140, band.frequency);
    this.sway(ctx, 0.11, 0.14, gust.gain);
  }

  /** Pops at random times, mostly tiny, now and then a knot of wood going. */
  private crackle = () => {
    window.clearTimeout(this.crackling);
    this.crackling = 0;
    if (!this.ctx || this.fireLevel <= 0.01) return;
    const big = Math.random() < 0.12;
    const freq = big ? 500 + Math.random() * 900 : 1800 + Math.random() * 3600;
    const peak = (big ? 1 : 0.38) * this.fireLevel * (0.35 + Math.random() * 0.65);
    this.burst(this.noise!, "bandpass", freq, peak, big ? 0.07 : 0.022);
    // Exponential gaps are what make them read as random and not as a rhythm.
    const gap = 20 - Math.log(1 - Math.random()) * 100;
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

  // ---------------------------------------------------------------- the sequencer

  /** Cuts to a section now. The same section again is left running, so a groove can span slides. */
  section(name: SectionName) {
    if (name === this.current && this.bus) return;
    this.current = name;
    if (this.ctx && !this.ending) this.begin();
  }

  private begin() {
    const ctx = this.ctx!;
    const section: Section = SECTIONS[this.current];
    const t = ctx.currentTime;
    this.cut(t, 0.12);
    const bus = this.openGates();
    if (section.build) {
      bus.gain.setValueAtTime(section.level * 0.3, t);
      bus.gain.linearRampToValueAtTime(section.level, t + section.build);
    } else {
      bus.gain.setValueAtTime(section.level, t);
    }
    this.step = 0;
    this.started = t + 0.02;
    this.nextStep = this.started;
  }

  /** Fades what the last section left sounding, so its held notes do not smear into the next. */
  private cut(t: number, fade: number) {
    for (const gate of [this.bus, this.choirGate, this.hallSend]) {
      if (!gate) continue;
      gate.gain.cancelScheduledValues(t);
      gate.gain.setTargetAtTime(0, t, fade);
      window.setTimeout(() => gate.disconnect(), 3000);
    }
  }

  private openGates() {
    const ctx = this.ctx!;
    this.choirGate = ctx.createGain();
    this.choirGate.connect(this.choirIn!);
    this.hallSend = ctx.createGain();
    this.hallSend.connect(this.wet!);
    this.bus = ctx.createGain();
    this.bus.connect(this.music!);
    return this.bus;
  }

  private advance = () => {
    const ctx = this.ctx;
    if (!ctx) return;
    const section: Section = SECTIONS[this.current];
    while (this.nextStep < ctx.currentTime + LOOKAHEAD) {
      this.play(section, this.step, this.nextStep);
      this.step += 1;
      this.nextStep += STEP;
    }
  };

  private play(section: Section, step: number, t: number) {
    const i = step % 16;
    const bar = Math.floor(step / 16);
    const chord = section.chords[bar % section.chords.length]!;
    if (i === 0) {
      if (section.pad) this.strings(chord, t, section);
      if (section.choir) this.choir(chord, t, BAR * 1.05, section.choir);
    }
    if (section.pulse && section.pulsePattern?.[i] !== ".") {
      if (section.pulsePattern) this.lowPulse(chord, t, section.pulse);
    }
    const drum = section.drumPattern?.[i];
    if (section.drums && drum && drum !== ".") {
      this.drum(t, section.drums * (drum === "X" ? 1 : drum === "x" ? 0.72 : 0.45));
    }
    if (section.shaker && section.shakerPattern?.[i] !== ".") {
      if (section.shakerPattern) this.shake(t, section.shaker, step);
    }
    const pick = section.lyrePattern?.[i];
    if (section.lyre && pick && pick !== ".") {
      const pan = step % 4 === 0 ? -0.25 : 0.25;
      this.pluck(chord.arp[Number(pick)]!, section.lyre, t, pan);
    }
    if (section.horn && section.tune && section.tuneBars) {
      const inTune = step % (section.tuneBars * 16);
      const note = section.tune.find((n: HornNote) => n.at === inTune);
      if (note) this.horn(note.midi, t, note.beats * BEAT, section.horn);
    }
  }

  /** The section's bus, or the music bus once the sequencer has stopped. */
  private get out(): AudioNode {
    return this.bus ?? this.music!;
  }

  // ---------------------------------------------------------------- the voices

  /** How far a building section has got, 0 to 1. */
  private progress(section: Section, t: number) {
    return section.build ? Math.min(1, (t - this.started) / section.build) : 1;
  }

  /**
   * Strings: each note three detuned saws spread across the room. Each side has its own filter, so
   * opening a chord is one sweep; the root sits under it with a saw, which small speakers can hear,
   * and a sine an octave down for the ones that can go there.
   */
  private strings(chord: Chord, t: number, section: Section, dur = BAR * 1.04) {
    const ctx = this.ctx!;
    const reached = section.brightTo
      ? section.bright + (section.brightTo - section.bright) * this.progress(section, t)
      : section.bright;
    const level = section.pad;
    const voices = [
      { side: "left", cents: -11 },
      { side: "centre", cents: 2 },
      { side: "right", cents: 12 },
    ] as const;
    for (const { side, cents } of voices) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 0.7;
      filter.frequency.setValueAtTime(reached * 0.55, t);
      filter.frequency.linearRampToValueAtTime(reached, t + 0.7);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.085 * level, t + 0.18);
      gain.gain.setValueAtTime(0.085 * level, t + dur - 0.2);
      gain.gain.linearRampToValueAtTime(0.0001, t + dur + 0.25);
      filter.connect(gain);
      const pan = ctx.createStereoPanner();
      pan.pan.value = side === "left" ? -0.7 : side === "right" ? 0.7 : 0;
      gain.connect(pan);
      pan.connect(this.out);
      const send = ctx.createGain();
      send.gain.value = 0.35;
      gain.connect(send);
      send.connect(this.hallSend ?? this.wet!);
      for (const midi of chord.notes) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = hz(midi);
        osc.detune.value = cents;
        osc.connect(filter);
        osc.start(t);
        osc.stop(t + dur + 0.3);
      }
    }
    // The root.
    const rootFilter = ctx.createBiquadFilter();
    rootFilter.type = "lowpass";
    rootFilter.frequency.value = 620;
    const rootGain = ctx.createGain();
    rootGain.gain.setValueAtTime(0.0001, t);
    rootGain.gain.linearRampToValueAtTime(0.11 * level, t + 0.05);
    rootGain.gain.setValueAtTime(0.11 * level, t + dur - 0.15);
    rootGain.gain.linearRampToValueAtTime(0.0001, t + dur + 0.1);
    rootFilter.connect(rootGain);
    rootGain.connect(this.out);
    const saw = ctx.createOscillator();
    saw.type = "sawtooth";
    saw.frequency.value = hz(chord.bass + 12);
    saw.connect(rootFilter);
    saw.start(t);
    saw.stop(t + dur + 0.15);
    const sub = ctx.createOscillator();
    sub.frequency.value = hz(chord.bass);
    sub.connect(rootGain);
    sub.start(t);
    sub.stop(t + dur + 0.15);
  }

  private choir(chord: Chord, t: number, dur: number, level: number) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.18 * level, t + 0.55);
    gain.gain.setValueAtTime(0.18 * level, t + dur - 0.3);
    gain.gain.linearRampToValueAtTime(0.0001, t + dur + 0.35);
    // The vowels are shared, so a cut hushes the voices at this section's gate.
    gain.connect(this.choirGate ?? this.choirIn!);
    for (const midi of chord.notes) {
      // An octave up: the voices sit over the strings, not inside them.
      for (const cents of [-7, 8]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = hz(midi + 12);
        osc.detune.value = cents;
        this.vibrato?.connect(osc.detune);
        osc.connect(gain);
        osc.start(t);
        osc.stop(t + dur + 0.4);
      }
    }
  }

  /** Low strings played short: the engine under a section. */
  private lowPulse(chord: Chord, t: number, level: number) {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1500, t);
    filter.frequency.exponentialRampToValueAtTime(420, t + 0.14);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.3 * level, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    filter.connect(gain);
    gain.connect(this.out);
    for (const [offset, cents] of [
      [12, -6],
      [12, 7],
      [24, 0],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = hz(chord.bass + offset);
      osc.detune.value = cents;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + 0.22);
    }
  }

  /** A big drum: a falling tone and a slap of skin, driven so its harmonics reach small speakers. */
  private drum(t: number, level: number) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.75 * level, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    gain.connect(this.drive!);
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(210, t);
    osc.frequency.exponentialRampToValueAtTime(68, t + 0.09);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + 0.7);
    this.burst(this.noise!, "bandpass", 520, 0.75 * level, 0.09, t - this.now, this.wet!);
    this.burst(this.noise!, "bandpass", 1500, 0.4 * level, 0.035, t - this.now);
  }

  private shake(t: number, level: number, step: number) {
    const ctx = this.ctx!;
    const pan = ctx.createStereoPanner();
    pan.pan.value = step % 8 < 4 ? -0.35 : 0.35;
    pan.connect(this.out);
    const { gain } = this.burst(this.noise!, "highpass", 5200, 0.2 * level, 0.06, t - this.now);
    gain.disconnect();
    gain.connect(pan);
  }

  /** The lyre. Also a cue by itself: a photo landing, a hit of the scale. */
  pluck(midi: number, level = 0.8, at?: number, pan = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = at ?? ctx.currentTime;
    const nearest = this.plucks.reduce((a, b) =>
      Math.abs(b.base - midi) < Math.abs(a.base - midi) ? b : a,
    );
    const src = ctx.createBufferSource();
    src.buffer = nearest.buffer;
    src.playbackRate.value = 2 ** ((midi - nearest.base) / 12);
    const gain = ctx.createGain();
    gain.gain.value = 0.5 * level;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    src.connect(gain);
    gain.connect(panner);
    panner.connect(this.out);
    const send = ctx.createGain();
    send.gain.value = 0.3;
    gain.connect(send);
    send.connect(this.hallSend ?? this.wet!);
    src.start(t);
    src.stop(t + 2.2);
  }

  /** A horn section on one note: the filter opening is what makes saws read as brass. */
  private horn(midi: number, t: number, dur: number, level: number) {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(420, t);
    filter.frequency.exponentialRampToValueAtTime(2900, t + 0.1);
    filter.frequency.exponentialRampToValueAtTime(1500, t + Math.max(0.22, dur));
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.2 * level, t + 0.05);
    gain.gain.setValueAtTime(0.17 * level, t + Math.max(0.06, dur - 0.08));
    gain.gain.linearRampToValueAtTime(0.0001, t + dur + 0.14);
    filter.connect(gain);
    gain.connect(this.out);
    const send = ctx.createGain();
    send.gain.value = 0.55;
    gain.connect(send);
    send.connect(this.hallSend ?? this.wet!);
    for (const [offset, cents, share] of [
      [0, -8, 1],
      [0, 9, 1],
      [-12, 0, 0.75],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      // A little scoop up into the note, as players do.
      osc.frequency.setValueAtTime(hz(midi + offset) * 0.985, t);
      osc.frequency.exponentialRampToValueAtTime(hz(midi + offset), t + 0.05);
      osc.detune.value = cents;
      const part = ctx.createGain();
      part.gain.value = share;
      osc.connect(part);
      part.connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.2);
    }
  }

  // ---------------------------------------------------------------- the hits

  private burst(
    buf: AudioBuffer,
    type: BiquadFilterType,
    freq: number,
    peak: number,
    seconds: number,
    delay = 0,
    send?: AudioNode,
  ) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    const t = this.now + Math.max(0, delay);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx!);
    if (send) gain.connect(send);
    src.start(t, Math.random() * Math.max(0, buf.duration - seconds), seconds + 0.02);
    return { src, filter, gain };
  }

  /** The low brass blast at the big moments: an E across three octaves, opening and closing. */
  braam(weight = 1) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const seconds = 2.2 + weight * 1.6;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(240, t);
    filter.frequency.exponentialRampToValueAtTime(2600, t + 0.16);
    filter.frequency.exponentialRampToValueAtTime(320, t + seconds);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.42 * weight, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    filter.connect(gain);
    gain.connect(this.drive!);
    for (const [midi, cents] of [
      [28, 0],
      [40, -7],
      [40, 8],
      [47, -5],
      [52, 6],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = hz(midi);
      osc.detune.value = cents;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + seconds + 0.05);
    }
    this.drum(t, weight);
  }

  /** A crack, then a long roll that swells twice and dies, with a band small speakers can play. */
  thunder() {
    if (!this.ctx) return;
    this.burst(this.noise!, "highpass", 1800, 1, 0.1, 0, this.wet!);
    this.burst(this.noise!, "bandpass", 900, 1, 0.35, 0, this.wet!);
    const { gain, filter } = this.burst(this.brown!, "lowpass", 700, 1, 5.5);
    filter.frequency.setValueAtTime(1100, this.now);
    filter.frequency.exponentialRampToValueAtTime(260, this.now + 5);
    const t = this.now;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(1.1, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.45, t + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.75, t + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 5.5);
  }

  /** A small dry tick (the roulette, a typed letter). */
  tick(freq = 1400, level = 0.3) {
    if (!this.ctx) return;
    this.burst(this.noise!, "bandpass", freq, level, 0.04);
  }

  /** A stone set down: the setup steps. */
  stone() {
    if (!this.ctx) return;
    this.drum(this.now, 0.7);
    this.burst(this.noise!, "bandpass", 620, 0.55, 0.14, 0, this.wet!);
  }

  /**
   * Iron struck, on `rise` steps up the scale, so a chain being forged climbs. Partials with no
   * common root are what make it ring and not sing.
   */
  clang(rise = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const root = hz([64, 67, 69, 71, 74, 76][rise % 6]!);
    for (const [ratio, level, decay] of [
      [1, 0.34, 1.1],
      [2.76, 0.24, 0.7],
      [5.4, 0.16, 0.4],
      [8.93, 0.09, 0.22],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.frequency.value = root * ratio;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(level, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      osc.connect(gain);
      gain.connect(this.sfx!);
      gain.connect(this.wet!);
      osc.start(t);
      osc.stop(t + decay + 0.02);
    }
    this.drum(t, 0.85);
    this.burst(this.noise!, "highpass", 2400, 0.5, 0.04);
  }

  /** Air moving: noise through a band that sweeps up and away, for cells flying or a fire catching. */
  whoosh(level = 0.3, seconds = 0.9) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.8;
    band.frequency.setValueAtTime(260, t);
    band.frequency.exponentialRampToValueAtTime(2400, t + seconds * 0.45);
    band.frequency.exponentialRampToValueAtTime(420, t + seconds);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + seconds * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(band);
    band.connect(gain);
    gain.connect(this.sfx!);
    gain.connect(this.wet!);
    src.start(t, Math.random() * (this.noise!.duration - seconds), seconds);
  }

  /** Air and pitch climbing together for `seconds`, cut dead at the end: the breath before a hit. */
  riser(seconds: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 1.6;
    band.frequency.setValueAtTime(300, t);
    band.frequency.exponentialRampToValueAtTime(5200, t + seconds);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.9, t + seconds);
    gain.gain.setValueAtTime(0.0001, t + seconds + 0.01);
    src.connect(band);
    band.connect(gain);
    gain.connect(this.sfx!);
    gain.connect(this.wet!);
    src.start(t, 0, seconds + 0.02);
  }

  // ---------------------------------------------------------------- the end

  /** Stops the band on one long last chord, which rings out over /oracle and closes by itself. */
  finale() {
    const ctx = this.ctx;
    if (!ctx || this.ending) return;
    this.ending = true;
    window.clearInterval(this.ticking);
    this.ticking = 0;
    const t = ctx.currentTime;
    this.cut(t, 0.3);
    this.openGates();
    this.fire(0, 1.5);
    this.wind(0, 1.5);
    this.whoosh(0.3, 2);
    this.drum(t, 0.9);
    this.strings(LAST_CHORD, t, { ...SECTIONS.oracle, pad: 0.9, bright: 1100 }, 5);
    this.choir(LAST_CHORD, t, 4, 1);
    this.pluck(76, 0.8, t);
    this.pluck(64, 0.7, t + 0.3);
    // Long enough to reach the room over /oracle, gone before the first family is up.
    this.mix?.gain.setTargetAtTime(0, t + 2.2, 1.2);
    window.setTimeout(() => this.shut(), FINALE * 1000);
  }

  private shut() {
    window.clearInterval(this.ticking);
    this.ticking = 0;
    window.clearTimeout(this.crackling);
    this.crackling = 0;
    void this.ctx?.close();
    this.ctx = null;
    this.bus = this.choirGate = this.hallSend = null;
  }

  /** The page is going. After the finale, that is the chord's own timer's job. */
  close() {
    if (!this.ending) this.shut();
  }
}
