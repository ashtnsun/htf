import { REVEAL_CUES } from "@/components/olympus/GodRevealView";
import { roomImpulse, softClip } from "@/components/olympus/prologue/score";

/**
 * The Oracle's sound: nothing at all until REVEAL is pressed, then one long held breath and its
 * release. Synthesised in the browser, like the Prologue's (prologue/score.ts), and tonal: the only
 * noise in it is the short strike of a drum, never a bed.
 *
 * The hold is driven by the charge itself, so the sound can never disagree with the button:
 * - the swell: eight voices start bunched in one muddy cluster, low and shut, and fan out into a
 *   wide suspended chord as the filter opens and a tremolo quickens. Let go and they sink back.
 * - the pulse: a drum, slow at first, closing up into a roll (the phone's buzz quickens the same way).
 * - the glints: once the Oracle knows the word, a note on each pulse climbs with the charge, as the
 *   scene's cells gather. A word it does not know gets no glints, as it gets no scene.
 *
 * Then `breath`: at a full hold everything stops, sound and screen, for under half a second. `strike`
 * lands on the flash and resolves the suspended chord to E major, the cells switch on over a run of
 * rising notes and a bell brings in the name (REVEAL_CUES is GodRevealView's own timing). It rings
 * out to silence: the room should talk over the end of it. `deny` is the wrong word's dull thud.
 *
 * The energy sits between 200 Hz and 5 kHz, because laptops and most projector speakers play next to
 * nothing under 150 Hz.
 */

/** The whole thing's level: the one number to change if the room needs it louder or quieter. */
const LEVEL = 0.9;
/** Seconds of silence between a full hold and the flash. */
const BREATH = 0.42;
/** Each oscillator of the swell at full charge (there are sixteen). */
const SWELL_VOICE = 0.05;
/** Each oscillator of the strike's chord (there are sixteen). */
const STRIKE_VOICE = 0.05;

/** Where each voice starts in the cluster and where it ends on the held chord, as MIDI notes. */
const SWELL: readonly (readonly [number, number])[] = [
  [52, 47],
  [53, 54],
  [54, 59],
  [55, 64],
  [56, 66],
  [57, 71],
  [55, 76],
  [58, 83],
];
/** The chord the swell resolves to: E major, wide open. */
const STRIKE = [52, 59, 64, 68, 71, 76, 80, 83] as const;
/** The name's chord, the same one higher up and softer. */
const NAME = [64, 68, 71, 76, 83, 88] as const;
/** What the glints climb through as the charge rises: the held chord's own notes. */
const GLINTS = [71, 76, 78, 83, 88, 90, 95] as const;
/** The cells' run: E major pentatonic, counted up from E5. */
const RUN = [76, 78, 80, 83, 85, 88, 90, 92, 95, 97, 100, 102] as const;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

type Swell = {
  oscs: OscillatorNode[];
  sources: ConstantSourceNode;
  shimmer: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  depth: GainNode;
};

export class RevealSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private room: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private swell: Swell | null = null;
  private holding = false;
  private known = false;
  private nextPulse = 0;
  private side = 1;
  /** The swell's last level and the charge it had, so a let-go fades in step with the drain. */
  private level = 0;
  private charge = 0;
  private drain = { level: 0, charge: 1 };

  private get now() {
    return this.ctx?.currentTime ?? 0;
  }

  /** Must run inside the press itself: the moment a browser lets sound start. */
  private wake() {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
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
      this.master = ctx.createGain();
      this.master.gain.value = LEVEL;
      this.master.connect(shelf);

      const space = ctx.createConvolver();
      space.buffer = roomImpulse(ctx, 3, 2);
      this.room = ctx.createGain();
      this.room.gain.value = 0.5;
      this.room.connect(space);
      space.connect(this.master);

      const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      this.noise = noise;
    }
    void this.ctx.resume();
  }

  /** The hold has begun. */
  press() {
    this.wake();
    const now = this.now;
    this.holding = true;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setTargetAtTime(LEVEL, now, 0.01);
    if (!this.swell) this.swell = this.startSwell();
    this.nextPulse = Math.max(this.nextPulse, now + 0.01);
  }

  release() {
    if (!this.holding) return;
    this.holding = false;
    this.drain = { level: this.level, charge: Math.max(0.001, this.charge) };
  }

  /** Whether the Oracle knows the word being held. */
  setKnown(known: boolean) {
    this.known = known;
  }

  /** Every frame: the charge, 0 to 1. */
  follow(p: number) {
    const swell = this.swell;
    if (!swell) return;
    const now = this.now;
    if (p <= 0 && !this.holding) {
      this.stopSwell(0.06);
      return;
    }

    // The voices climb faster and faster and only reach the chord at the very top.
    swell.sources.offset.setTargetAtTime(1 - p ** 1.6, now, 0.03);
    // Holding, it grows late and hard; let go, it sinks evenly, so the fall can be heard.
    const level = this.holding
      ? 0.12 + 0.88 * p ** 2.2
      : this.drain.level * clamp01(p / this.drain.charge);
    this.level = level;
    this.charge = p;
    swell.gain.gain.setTargetAtTime(level, now, 0.04);
    swell.filter.frequency.setTargetAtTime(380 * (5000 / 380) ** (p ** 1.3), now, 0.04);
    swell.shimmer.frequency.setTargetAtTime(3 + 11 * p, now, 0.05);
    swell.depth.gain.setTargetAtTime(0.28 * p ** 1.5, now, 0.05);

    if (!this.holding) return;
    while (this.nextPulse < now + 0.06) {
      const at = Math.max(this.nextPulse, now);
      this.pulse(at, p);
      this.nextPulse = at + 0.5 * (1 - p) ** 1.5 + 0.08;
    }
  }

  /** Sixteen oscillators on one bend, so a frame only moves one number and they all follow. */
  private startSwell(): Swell {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 380;
    filter.Q.value = 0.7;
    filter.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);

    // How far each voice still has to go: 1 in the cluster, 0 on the chord.
    const sources = ctx.createConstantSource();
    sources.offset.value = 1;
    sources.start(t);

    // The tremolo: added to the swell's own level, so it shudders harder as it grows.
    const shimmer = ctx.createOscillator();
    shimmer.frequency.value = 3;
    const depth = ctx.createGain();
    depth.gain.value = 0;
    shimmer.connect(depth);
    depth.connect(gain.gain);
    shimmer.start(t);

    const oscs: OscillatorNode[] = [];
    SWELL.forEach(([from, to], i) => {
      const pan = ctx.createStereoPanner();
      pan.pan.value = ((i % 4) / 3) * 0.8 - 0.4;
      pan.connect(filter);
      const bend = ctx.createGain();
      bend.gain.value = (from - to) * 100;
      sources.connect(bend);
      for (const cents of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = hz(to);
        osc.detune.value = cents;
        bend.connect(osc.detune);
        const voice = ctx.createGain();
        voice.gain.value = SWELL_VOICE;
        osc.connect(voice);
        voice.connect(pan);
        osc.start(t);
        oscs.push(osc);
      }
    });
    return { oscs, sources, shimmer, gain, filter, depth };
  }

  private stopSwell(fade: number) {
    const swell = this.swell;
    if (!swell) return;
    this.swell = null;
    const now = this.now;
    swell.gain.gain.cancelScheduledValues(now);
    swell.gain.gain.setTargetAtTime(0, now, fade);
    const end = now + fade * 8;
    for (const osc of [...swell.oscs, swell.shimmer]) osc.stop(end);
    swell.sources.stop(end);
  }

  /** One beat of the roll: a drum that tightens and rises with the charge, and maybe a glint. */
  private pulse(at: number, p: number) {
    const ctx = this.ctx!;
    const level = 0.12 + 0.38 * p ** 1.5;
    const pitch = 190 + 90 * p;
    const drum = ctx.createOscillator();
    drum.type = "triangle";
    drum.frequency.setValueAtTime(pitch * 1.8, at);
    drum.frequency.exponentialRampToValueAtTime(pitch, at + 0.04);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    drum.connect(gain);
    gain.connect(this.master!);
    drum.start(at);
    drum.stop(at + 0.24);
    // The skin: what makes the beat carry on a speaker that has no bottom.
    this.burst("bandpass", 1100 + 1500 * p, 0.05 + 0.13 * p, 0.03, at);

    if (!this.known || p < 0.3) return;
    const step = Math.floor(((p - 0.3) / 0.7) * GLINTS.length);
    this.side = -this.side;
    this.pluck(
      GLINTS[Math.min(GLINTS.length - 1, step)]!,
      at,
      0.03 + 0.05 * p,
      0.45,
      this.side * 0.4,
    );
  }

  private burst(type: BiquadFilterType, freq: number, peak: number, seconds: number, at: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    src.start(at, Math.random() * 0.5, seconds + 0.02);
  }

  /** One small struck note with a little octave in it. */
  private pluck(midi: number, at: number, level: number, seconds: number, pan = 0) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    gain.connect(panner);
    panner.connect(this.master!);
    panner.connect(this.room!);
    for (const [ratio, share] of [
      [1, 1],
      [2, 0.25],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.frequency.value = hz(midi) * ratio;
      const voice = ctx.createGain();
      voice.gain.value = share;
      osc.connect(voice);
      voice.connect(gain);
      osc.start(at);
      osc.stop(at + seconds + 0.02);
    }
  }

  /** Everything cuts out, and the promise resolves when the silence has lasted. */
  breath() {
    this.holding = false;
    if (this.ctx) {
      const now = this.now;
      this.master!.gain.cancelScheduledValues(now);
      this.master!.gain.setTargetAtTime(0, now, 0.015);
      this.stopSwell(0.015);
      this.nextPulse = 0;
    }
    return new Promise<void>((done) => window.setTimeout(done, BREATH * 1000));
  }

  /** The flash: the hit, the chord the hold was asking for, then the cells' run and the name. */
  strike() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.master!.gain.cancelScheduledValues(t);
    this.master!.gain.setValueAtTime(LEVEL, t);

    // The hit itself: a drop with enough top to land on a laptop, and the crack on the front of it.
    const body = ctx.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(260, t);
    body.frequency.exponentialRampToValueAtTime(70, t + 0.18);
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(0.85, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    body.connect(bodyGain);
    bodyGain.connect(this.master!);
    bodyGain.connect(this.room!);
    body.start(t);
    body.stop(t + 0.95);
    this.burst("bandpass", 900, 0.55, 0.28, t);
    this.burst("highpass", 2400, 0.3, 0.05, t);

    // The chord: bright at the hit, closing slowly as it rings.
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 0.5;
    filter.frequency.setValueAtTime(5000, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + 4);
    const chord = ctx.createGain();
    chord.gain.setValueAtTime(0.0001, t);
    chord.gain.exponentialRampToValueAtTime(1, t + 0.012);
    chord.gain.setValueAtTime(1, t + 0.5);
    chord.gain.exponentialRampToValueAtTime(0.0001, t + 6.5);
    filter.connect(chord);
    chord.connect(this.master!);
    chord.connect(this.room!);
    STRIKE.forEach((midi, i) => {
      const pan = ctx.createStereoPanner();
      pan.pan.value = ((i % 4) / 3) * 0.8 - 0.4;
      pan.connect(filter);
      for (const cents of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = hz(midi);
        osc.detune.value = cents;
        const voice = ctx.createGain();
        voice.gain.value = STRIKE_VOICE;
        osc.connect(voice);
        voice.connect(pan);
        osc.start(t);
        osc.stop(t + 6.6);
      }
    });
    this.bell(hz(76), t, 0.14);

    // The cells switching on, a note at a time, right to the moment the name starts.
    const { cells, spread, name } = REVEAL_CUES;
    RUN.forEach((midi, i) => {
      const at = t + cells + (i / RUN.length) * spread;
      this.pluck(midi, at, 0.05 + 0.03 * (i / RUN.length), 0.8, i % 2 ? 0.35 : -0.35);
    });

    // The name: a bell and the chord coming back, high up and soft.
    const at = t + name;
    this.bell(hz(88), at, 0.11);
    const lift = ctx.createGain();
    lift.gain.setValueAtTime(0.0001, at);
    lift.gain.exponentialRampToValueAtTime(1, at + 0.5);
    lift.gain.exponentialRampToValueAtTime(0.0001, at + 5);
    lift.connect(this.master!);
    lift.connect(this.room!);
    NAME.forEach((midi, i) => {
      const pan = ctx.createStereoPanner();
      pan.pan.value = ((i % 3) / 2) * 0.7 - 0.35;
      pan.connect(lift);
      for (const cents of [-4, 4]) {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = hz(midi);
        osc.detune.value = cents;
        const voice = ctx.createGain();
        voice.gain.value = 0.035;
        osc.connect(voice);
        voice.connect(pan);
        osc.start(at);
        osc.stop(at + 5.1);
      }
    });
  }

  /** Partials with no common root are what make it ring and not sing. */
  private bell(root: number, at: number, level: number) {
    const ctx = this.ctx!;
    for (const [ratio, share, decay] of [
      [1, 1, 3],
      [2.76, 0.5, 1.5],
      [5.4, 0.25, 0.7],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.frequency.value = root * ratio;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(level * share, at + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
      osc.connect(gain);
      gain.connect(this.master!);
      gain.connect(this.room!);
      osc.start(at);
      osc.stop(at + decay + 0.02);
    }
  }

  /** The wrong word: at the top of the hold, one dull thud, and the swell sinks with the drain. */
  deny() {
    const ctx = this.ctx;
    if (!ctx) return;
    this.release();
    const t = ctx.currentTime;
    const body = ctx.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(190, t);
    body.frequency.exponentialRampToValueAtTime(62, t + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    body.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    body.start(t);
    body.stop(t + 0.55);
    this.burst("bandpass", 480, 0.35, 0.12, t);
  }

  /** Next group: whatever is still ringing goes. */
  hush() {
    if (!this.ctx) return;
    const now = this.now;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setTargetAtTime(0, now, 0.2);
  }

  close() {
    this.stopSwell(0.015);
    void this.ctx?.close();
    this.ctx = null;
  }
}
