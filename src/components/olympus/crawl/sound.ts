/**
 * The tomb's sound, synthesised in the browser, and nothing in it hisses: a low hum of a few soft
 * notes that drift, water dripping somewhere with the room's echo on it, the odd stone settling far
 * off, and fire as separate crackles rather than a roar. Kept quiet on purpose: nine families play
 * in one room, each on a laptop. On by default, M mutes; a browser plays nothing before the first
 * key or click, so that is what wakes it (`arm`).
 *
 * What happens in the game is played on instruments, not bleeps: a plucked lyre (a real string
 * model, Karplus-Strong, rendered once per note), a breathy ocarina, and coins as struck metal. The
 * phrases are this game's own, in the spirit of a Zelda secret or item jingle; none is a copy.
 *
 * One instance (`tombSound`) serves the temple on /olympus and then the game: the click on a column
 * is what a browser asks for before it plays anything, so the sound has to live through the route
 * change, and so does a mute. A fresh page cannot make a sound before its first key or click.
 */
const MASTER = 0.7;
/** The drifting top note of the hum: A, C, E, D, a minor-ish wander that never resolves. */
const TOP_NOTES = [220, 261.63, 329.63, 293.66, 220, 196];

/** A semitone number (MIDI: 60 is middle C) as a frequency. */
const pitch = (note: number) => 440 * 2 ** ((note - 69) / 12);
/** A dorian scale on D, what the Hall's letters climb. */
const SCALE = [62, 64, 65, 67, 69, 71, 72, 74];
/** The temple's nine columns, as strings: the same scale, left to right. */
const COLUMN_NOTES = [62, 64, 65, 67, 69, 71, 72, 74, 76];
/** What someone plays on a lyre in the empty temple, a phrase at a time. */
const TEMPLE_PHRASES = [
  [62, 69, 74],
  [65, 72, 77],
  [69, 74, 76, 81],
  [60, 67, 72],
  [62, 65, 69, 74],
  [57, 64, 69],
];
/** A struck coin's partials: frequency, level, how quickly each dies. Inharmonic, as metal is. */
const COIN_PARTIALS = [
  [2650, 1, 0.14],
  [3990, 0.7, 0.1],
  [5430, 0.5, 0.07],
  [7270, 0.32, 0.05],
  [9120, 0.2, 0.03],
] as const;

type Place = "temple" | "tomb";
export type SoundState = "blocked" | "on" | "off";

export class TombSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  /** Everything sent here comes back with the tomb's echo on it. */
  private room: ConvolverNode | null = null;
  private noise: AudioBuffer | null = null;
  private fireLevel = 0;
  private strings = new Map<number, { buffer: AudioBuffer; rate: number }>();
  private clinks: AudioBuffer[] = [];
  private timers = new Set<number>();
  private place: Place = "tomb";
  /** Which background is playing, if any. */
  private playing: Place | null = null;
  /** A column has been chosen: the temple's page may go, the sound stays for the game. */
  private handedOver = false;
  /** The landing came before the browser would let anything play. */
  private introWaiting = false;
  private closing = 0;
  private listeners = new Set<() => void>();
  on = true;

  /** Whether the browser is letting it play, for the temple's button. */
  state = (): SoundState => (!this.on ? "off" : this.ctx?.state === "running" ? "on" : "blocked");

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private changed() {
    this.listeners.forEach((listener) => listener());
  }

  /** Which page it is playing for. Nothing can be heard until `arm`. */
  enter(place: Place) {
    window.clearTimeout(this.closing);
    // Back from the game: its hum and drips end with it.
    if (place === "temple" && this.playing === "tomb") this.close();
    this.place = place;
    this.handedOver = false;
    if (this.ctx) this.startBackground();
  }

  /** Off the temple's page, unless a column has taken it into the game. */
  leaveTemple() {
    if (!this.handedOver) this.closeSoon();
  }

  /** Arms only if this tab has already had the click or key the browser asks for. */
  armIfAllowed() {
    if (navigator.userActivation?.hasBeenActive) this.arm();
    return !!this.ctx;
  }

  arm() {
    if (!this.on) return;
    // Every key goes through here: a browser that cannot make sound must still get to play.
    try {
      if (!this.ctx) this.wake();
      else if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      if (this.introWaiting) {
        this.introWaiting = false;
        this.arrival();
      }
    } catch {
      this.on = false;
      this.changed();
    }
  }

  toggle() {
    this.on = !this.on;
    if (this.on) this.arm();
    this.master?.gain.setTargetAtTime(this.on ? MASTER : 0, this.now, 0.15);
    this.changed();
    return this.on;
  }

  private get now() {
    return this.ctx?.currentTime ?? 0;
  }

  private wake() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    ctx.onstatechange = () => this.changed();
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
    this.startBackground();
  }

  private clearTimers() {
    for (const id of this.timers) window.clearTimeout(id);
    this.timers.clear();
  }

  private startBackground() {
    if (this.playing === this.place) return;
    this.clearTimers();
    this.playing = this.place;
    if (this.place === "temple") {
      this.lyreLater(400);
      return;
    }
    this.startHum();
    this.startTopNote();
    this.dripLater();
    this.settleLater();
    this.crackleLater();
  }

  /** The temple's only background: a phrase on the lyre, far off, then a long rest. */
  private lyreLater(ms: number, last = -1) {
    this.later(ms, () => {
      let at = Math.floor(Math.random() * TEMPLE_PHRASES.length);
      if (at === last) at = (at + 1) % TEMPLE_PHRASES.length;
      if (this.on) this.run(TEMPLE_PHRASES[at]!, 0.42, 0.07);
      this.lyreLater(4500 + Math.random() * 3000, at);
    });
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
      if (this.on && this.fireLevel > 0) {
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
    this.boom(0, 90, 42, 0.28 * weight, 0.8);
    this.rolling(2.2, 0.22 * weight);
  }

  /** Air moving past: a door, the camera closing in. Short and low. */
  whoosh(level = 0.08, seconds = 0.4) {
    this.burst("lowpass", 520, level * 0.7, seconds);
  }

  /** A string, rendered the first time its note is wanted: a burst of noise round a short delay. */
  private stringOf(note: number) {
    const known = this.strings.get(note);
    if (known) return known;
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const hz = pitch(note);
    // The loop averages two samples, half a sample of delay; playback rate takes up the rest.
    const period = Math.max(2, Math.round(rate / hz - 0.5));
    const length = Math.floor(rate * 2);
    const buffer = ctx.createBuffer(1, length, rate);
    const out = buffer.getChannelData(0);
    const line = new Float32Array(period);
    let soft = 0;
    let mean = 0;
    for (let i = 0; i < period; i += 1) {
      soft += (Math.random() * 2 - 1 - soft) * 0.55;
      line[i] = soft;
      mean += soft / period;
    }
    for (let i = 0; i < period; i += 1) line[i]! -= mean;
    let at = 0;
    for (let n = 0; n < length; n += 1) {
      const next = (at + 1) % period;
      const value = line[at]!;
      out[n] = value * Math.min(1, (length - n) / 2000);
      line[at] = (value + line[next]!) * 0.4985;
      at = next;
    }
    const made = { buffer, rate: (hz * (period + 0.5)) / rate };
    this.strings.set(note, made);
    return made;
  }

  /** The lyre: one note, `at` seconds from now. */
  private pluck(note: number, at = 0, level = 0.3) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const { buffer, rate } = this.stringOf(note);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = level;
    src.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    src.start(this.now + at);
  }

  /** A run on the lyre, one note every `step` seconds. */
  private run(notes: readonly number[], step: number, level = 0.3, at = 0) {
    notes.forEach((note, i) => this.pluck(note, at + i * step, level));
  }

  /** The ocarina: nearly a pure tone, breath in it, a slow vibrato arriving late. */
  private ocarina(note: number, at: number, seconds: number, level = 0.07) {
    if (!this.on || !this.ctx || !this.noise) return;
    const ctx = this.ctx;
    const t = this.now + at;
    const hz = pitch(note);
    const osc = ctx.createOscillator();
    osc.frequency.value = hz;
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 5;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(hz * 0.005, t + Math.min(0.4, seconds * 0.6));
    vibrato.connect(depth);
    depth.connect(osc.frequency);
    const breath = ctx.createBufferSource();
    breath.buffer = this.noise;
    breath.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = hz * 2;
    band.Q.value = 3;
    const breathGain = ctx.createGain();
    breathGain.gain.value = 0.14;
    breath.connect(band);
    band.connect(breathGain);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.05);
    gain.gain.setValueAtTime(level, t + Math.max(0.06, seconds - 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain);
    breathGain.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    const end = t + seconds + 0.05;
    osc.start(t);
    vibrato.start(t);
    breath.start(t, Math.random());
    osc.stop(end);
    vibrato.stop(end);
    breath.stop(end);
  }

  /** A coin, struck: metal partials dying at their own speeds over a tiny click of contact. */
  private clinkBuffer(scale: number) {
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * 0.4);
    const buffer = ctx.createBuffer(1, length, rate);
    const out = buffer.getChannelData(0);
    for (let n = 0; n < length; n += 1) {
      const t = n / rate;
      let v = n < rate * 0.0015 ? (Math.random() * 2 - 1) * 0.6 : 0;
      for (const [hz, level, life] of COIN_PARTIALS) {
        v += level * Math.exp(-t / life) * Math.sin(2 * Math.PI * hz * scale * t);
      }
      out[n] = v * 0.4;
    }
    return buffer;
  }

  private clink(index: number, at: number, level: number) {
    if (!this.on || !this.ctx) return;
    if (!this.clinks.length) this.clinks = [1, 1.09, 0.92].map((k) => this.clinkBuffer(k));
    const src = this.ctx.createBufferSource();
    src.buffer = this.clinks[index]!;
    const gain = this.ctx.createGain();
    gain.gain.value = level;
    src.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    src.start(this.now + at);
  }

  /** A coin dropping on to other coins. */
  coin() {
    this.clink(0, 0, 0.24);
    this.clink(1, 0.07, 0.15);
    this.clink(2, 0.13, 0.07);
  }

  /** Something bought: coins down, and a little rising phrase as it comes into hand. */
  buy() {
    this.coin();
    this.run([69, 74, 78, 81], 0.085, 0.26, 0.2);
    this.ocarina(86, 0.54, 0.7, 0.06);
  }

  /** A riddle answered: four notes up. */
  solved() {
    this.run([69, 72, 76, 81], 0.09, 0.3);
  }

  /** A trial opened: the lyre swept all the way up, and a held note on the ocarina over it. */
  secret() {
    this.run([62, 65, 69, 72, 74, 77, 81, 84, 86], 0.06, 0.28);
    this.ocarina(86, 0.55, 1.1, 0.06);
  }

  /** The biggest moments: a slow rise on the ocarina over chords. */
  fanfare() {
    for (const [note, at, seconds] of [
      [62, 0, 0.3],
      [69, 0.3, 0.3],
      [74, 0.6, 1.3],
    ] as const) {
      this.ocarina(note + 12, at, seconds, 0.07);
      this.pluck(note - 12, at, 0.3);
      this.pluck(note, at + 0.02, 0.25);
    }
    this.run([74, 78, 81, 86], 0.05, 0.22, 0.62);
  }

  /** Somewhere off in the tomb, gears shift: a heavy ratchet slowing down, over a rumble. */
  gears() {
    const gaps = [0, 90, 190, 300, 430, 590, 790, 1060];
    gaps.forEach((ms, i) => {
      this.later(ms, () => {
        this.burst("bandpass", i % 2 ? 620 : 840, 0.08, 0.05, true);
        this.tone(170 - i * 8, 90, 0.05, 0.07);
      });
    });
    this.rolling(3, 0.24);
  }

  /** Something refused: two low notes falling, and a dull knock. */
  thud() {
    this.tone(95, 45, 0.4, 0.3);
    this.pluck(43, 0, 0.45);
    this.pluck(42, 0.12, 0.45);
  }

  /** Hit: a quick fall on the lyre, and the knock under it. */
  hurt() {
    this.tone(120, 45, 0.45, 0.3);
    this.run([69, 65, 61, 56], 0.05, 0.28);
  }

  /** A hidden stone found underfoot. */
  reveal() {
    this.pluck(81, 0, 0.2);
    this.pluck(88, 0.07, 0.2);
  }

  /** A letter pressed on the Hall's floor: stone, and a note that climbs with each. */
  press(count: number) {
    this.stone();
    const octave = Math.floor((count - 1) / SCALE.length) * 12;
    this.pluck(SCALE[(count - 1) % SCALE.length]! + octave, 0, 0.3);
  }

  /** Dropping into a pit: a long falling whistle. */
  fall() {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.exponentialRampToValueAtTime(170, t + 0.6);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.setValueAtTime(0.07, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);
    osc.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  /** A close-up opening or closing: two notes, up or back down. */
  menu(open: boolean) {
    this.run(open ? [69, 76] : [76, 69], 0.06, 0.16);
    if (open) this.whoosh(0.04, 0.35);
  }

  /** Someone speaking: one quiet note. */
  talk() {
    this.pluck([76, 74, 79, 72][Math.floor(Math.random() * 4)]!, 0, 0.12);
  }

  /** The runner's jump. */
  hop() {
    this.pluck(74, 0, 0.14);
    this.pluck(81, 0.04, 0.14);
  }

  /**
   * A real rumble: no edge at all, it swells up from nothing, rolls unevenly and dies away. Four low
   * reeds a little out of tune beat against each other through a filter, so the growl sits where a
   * laptop can play it (their overtones, 150 to 300 Hz) and the weight where a good speaker can.
   */
  private rolling(seconds: number, level: number) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 300;
    filter.Q.value = 0.4;
    const a = Math.random() * 6.28;
    const b = Math.random() * 6.28;
    const curve = Float32Array.from({ length: 256 }, (_, i) => {
      const u = i / 255;
      const swell =
        u < 0.35
          ? Math.sin((u / 0.35) * (Math.PI / 2)) ** 2
          : Math.cos(((u - 0.35) / 0.65) * (Math.PI / 2)) ** 2;
      const roll =
        0.75 + 0.15 * Math.sin(u * seconds * 5 + a) + 0.1 * Math.sin(u * seconds * 11 + b);
      return level * swell * roll;
    });
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setValueCurveAtTime(curve, t, seconds);
    filter.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    for (const [hz, voice] of [
      [49, 0.5],
      [51.5, 0.5],
      [73.5, 0.32],
      [110.5, 0.14],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = hz;
      const part = ctx.createGain();
      part.gain.value = voice;
      osc.connect(part);
      part.connect(filter);
      osc.start(t);
      osc.stop(t + seconds + 0.05);
    }
  }

  /** Far off, something huge moves and settles. */
  farRumble() {
    this.rolling(3, 0.34);
  }

  /** One pair of the Sanctum's bowls catching, a step up each time. */
  kindle(step: number) {
    this.whoosh(0.1, 0.5);
    this.pluck(50 + step * 7, 0, 0.32);
    this.pluck(57 + step * 7, 0.04, 0.26);
  }

  /** The room leaning in on the altar: a low fifth swelling, the lyre climbing faster and faster. */
  revealRise(seconds: number) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now;
    for (const [from, to, peak] of [
      [55, 110, 0.3],
      [82.4, 164.8, 0.2],
      [110, 440, 0.07],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.exponentialRampToValueAtTime(to, t + seconds);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + seconds);
      osc.connect(gain);
      gain.connect(this.master!);
      gain.connect(this.room!);
      osc.start(t);
      osc.stop(t + seconds + 0.1);
    }
    const notes = [50, 53, 57, 60, 62, 65, 69, 72, 74, 77, 81, 84, 86, 89, 93, 96];
    notes.forEach((note, i) => {
      const u = i / notes.length;
      this.pluck(note, seconds * (1 - (1 - u) ** 1.8), 0.14 + u * 0.16);
    });
  }

  /** Everything in the tomb holds its breath, the hum too, until it is let go. */
  breath(held: boolean) {
    if (!this.master) return;
    const gain = this.master.gain;
    gain.cancelScheduledValues(this.now);
    if (held) gain.setTargetAtTime(this.on ? 0.015 : 0, this.now, 0.03);
    else gain.setValueAtTime(this.on ? MASTER : 0, this.now);
  }

  /** The pause menu: everything fades out and carries on silently, ready to come back. */
  hush(held: boolean) {
    if (!this.master) return;
    const gain = this.master.gain;
    gain.cancelScheduledValues(this.now);
    gain.setTargetAtTime(!held && this.on ? MASTER : 0, this.now, 0.08);
  }

  /** The blast: a long fall under a low chord on every string at once. */
  revealStrike() {
    this.tone(120, 24, 0.9, 2.8);
    this.tone(70, 30, 0.6, 3.2, "triangle");
    this.burst("lowpass", 900, 0.5, 0.7, true);
    for (const note of [38, 45, 50, 57, 62]) this.pluck(note, 0, 0.42);
  }

  /** A letter struck home: a hammer on metal, and a note that climbs with each. */
  revealLetter(index: number) {
    const notes = [62, 65, 69, 74, 77, 81, 86, 89, 93];
    this.clink(index % 3, 0, 0.2);
    this.tone(150, 60, 0.16, 0.16);
    this.pluck(notes[index % notes.length]!, 0, 0.36);
  }

  /** The word whole: the climb resolved, the ocarina held over it. */
  revealWhole() {
    for (const note of [50, 57, 62, 66, 69]) this.pluck(note, 0, 0.3);
    this.run([74, 78, 81, 86, 90, 93], 0.07, 0.24, 0.1);
    this.ocarina(81, 0.3, 0.4, 0.07);
    this.ocarina(86, 0.7, 2.4, 0.08);
    this.pluck(38, 0.7, 0.4);
    this.pluck(62, 0.72, 0.3);
    this.pluck(69, 0.74, 0.28);
  }

  /** The word landing on the wall. */
  revealCarve() {
    this.stone();
    this.run([74, 81, 86], 0.08, 0.22);
  }

  /** The fifth coin: the lid lifting, and a short climb on the lyre. */
  chestOpen() {
    this.run([62, 69, 74, 77, 81], 0.11, 0.2, 0.05);
  }

  /** The floor parting and the altar coming up: one long rumble, under everything. */
  altarRises(seconds: number) {
    this.rolling(seconds, 0.3);
  }

  /** The altar home: stone settling, the lyre swept, and its flame catching. */
  altarSet() {
    this.boom(0, 100, 48, 0.24, 0.6);
    this.secret();
  }

  /** A card down on the table. */
  card() {
    this.burst("bandpass", 2300, 0.07, 0.035);
    this.burst("lowpass", 500, 0.08, 0.05);
  }

  /** A low note falling, on the audio clock, so a busy main thread cannot make it late. */
  private boom(
    at: number,
    from: number,
    to: number,
    peak: number,
    seconds: number,
    type: OscillatorType = "sine",
  ) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now + at;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + seconds * 0.6);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    osc.start(t);
    osc.stop(t + seconds + 0.05);
  }

  /** A bronze horn: two reeds a hair apart through a filter that opens as the note speaks. */
  private horn(note: number, at: number, seconds: number, level = 0.055) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now + at;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.09);
    filter.frequency.exponentialRampToValueAtTime(1500, t + Math.min(0.5, seconds));
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.05);
    gain.gain.setValueAtTime(level, t + Math.max(0.06, seconds - 0.28));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    filter.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    for (const detune of [-6, 6]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = pitch(note);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + seconds + 0.05);
    }
  }

  /** The temple building itself, for a page that already may play: the strings, bottom to top. */
  templeRise(seconds: number) {
    this.run(COLUMN_NOTES, seconds / COLUMN_NOTES.length, 0.09, 0.3);
    for (const note of [50, 57, 62]) this.pluck(note, seconds + 0.3, 0.12);
  }

  /**
   * A column chosen, the whole passage laid out on the audio clock at once: its string, the lyre
   * climbing as it gathers light, the burst, then the horn over the group's card.
   */
  passage(index: number, burst: number) {
    this.handedOver = true;
    this.clearTimers();
    this.pluck(COLUMN_NOTES[index % COLUMN_NOTES.length]!, 0, 0.24);
    const climb = [62, 65, 69, 72, 74, 77, 81, 84, 86];
    climb.forEach((note, i) => {
      const u = i / climb.length;
      this.pluck(note, burst * (1 - (1 - u) ** 1.7), 0.07 + u * 0.1);
    });
    this.boom(burst, 140, 55, 0.16, 0.6);
    for (const note of [50, 57, 62]) this.pluck(note, burst, 0.15);
    const call = burst + 0.35;
    this.horn(62, call, 0.3);
    this.horn(69, call + 0.3, 0.3);
    this.horn(74, call + 0.6, 1.7, 0.062);
    this.horn(69, call + 0.6, 1.7, 0.036);
    this.run([69, 74, 77, 81, 86], 0.07, 0.14, call + 0.72);
  }

  /** The first fall into the tomb: a long whistle, down the whole way. */
  introFall(seconds: number) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const t = this.now;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + seconds);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
    gain.gain.setValueAtTime(0.05, t + seconds - 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain);
    gain.connect(this.master!);
    gain.connect(this.room!);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  /** The first landing. Held until the first key or click when the browser would not play yet. */
  introLand() {
    if (!this.on) return;
    if (this.ctx?.state === "running") this.arrival();
    else this.introWaiting = true;
  }

  /** Down in the dark, and the tomb answers: a soft footfall, a chord, the ocarina's own short phrase. */
  private arrival() {
    this.boom(0, 110, 55, 0.12, 0.45);
    this.burst("lowpass", 420, 0.04, 0.1);
    for (const note of [50, 57, 62]) this.pluck(note, 0.02, 0.13);
    const phrase = [
      [74, 0.2, 50],
      [77, 0.2, 57],
      [81, 0.55, 62],
      [79, 0.2, 55],
      [76, 0.2, 57],
      [74, 1.4, 50],
    ] as const;
    let at = 0.5;
    for (const [note, seconds, under] of phrase) {
      this.ocarina(note, at, seconds, 0.07);
      this.pluck(under, at, 0.2);
      at += seconds;
    }
    this.run([62, 69, 74], 0.09, 0.14, at - 1.4);
  }

  /** After the current tick, so a React double mount in dev does not cut what is ringing. */
  closeSoon() {
    window.clearTimeout(this.closing);
    this.closing = window.setTimeout(() => this.close(), 50);
  }

  close() {
    this.clearTimers();
    this.playing = null;
    this.introWaiting = false;
    void this.ctx?.close();
    this.ctx = null;
    this.changed();
  }
}

/** The one instance: see the top of this file. */
export const tombSound = new TombSound();
