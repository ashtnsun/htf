/**
 * STORED, NOT USED: see soundtrack.ts. The music, as data for its sequencer: E minor with the flat second
 * for the ancient colour, 100 beats a minute, four beats a bar. Each section is what plays under
 * one stretch of the deck, and starts the moment that slide does, as a cut in a film does.
 *
 * A pattern is one bar of sixteen steps. Drums: X hard, x middling, o soft. A pulse or shaker: any
 * mark plays. A lyre: a digit picks the chord's arpeggio note. `.` is a rest.
 */
export type Chord = {
  /** The root, under everything. */
  bass: number;
  /** What the strings and the choir hold. */
  notes: readonly number[];
  /** What the lyre picks from. */
  arp: readonly number[];
};

/** A note of the horn's tune: which step of the section it starts on, its pitch, its beats. */
export type HornNote = { at: number; midi: number; beats: number };

export type Section = {
  chords: readonly Chord[];
  /** The whole section's level, 0 to 1. */
  level: number;
  /** Seconds to swell from a quiet start to `level`, opening `bright` to `brightTo` as it goes. */
  build?: number;
  pad: number;
  /** Where the strings' filter sits, in hertz: low is dark, high is full. */
  bright: number;
  brightTo?: number;
  choir?: number;
  pulse?: number;
  pulsePattern?: string;
  drums?: number;
  drumPattern?: string;
  shaker?: number;
  shakerPattern?: string;
  lyre?: number;
  lyrePattern?: string;
  horn?: number;
  /** The tune, and how many bars before it repeats. */
  tune?: readonly HornNote[];
  tuneBars?: number;
};

const chord = (bass: number, notes: readonly number[], arp: readonly number[]): Chord => ({
  bass,
  notes,
  arp,
});

const Em = chord(40, [52, 59, 64, 67], [64, 67, 71, 76, 79]);
const EMajor = chord(40, [52, 59, 64, 68], [64, 68, 71, 76, 80]);
const F = chord(41, [48, 53, 60, 69], [60, 65, 69, 72, 77]);
const C = chord(36, [48, 55, 64, 67], [60, 64, 67, 72, 76]);
const G = chord(43, [50, 59, 62, 67], [62, 67, 71, 74, 79]);
const D = chord(38, [50, 57, 62, 66], [62, 66, 69, 74, 78]);
const Am = chord(45, [48, 57, 64, 69], [60, 64, 69, 72, 76]);
const B = chord(35, [47, 54, 63, 66], [59, 63, 66, 71, 75]);
/** E minor with the flat second rubbing against it: the question hanging in the air. */
const Dread = chord(40, [52, 59, 64, 65], [64, 65, 71, 76, 77]);

/** Writes a tune bar by bar, each bar a list of [pitch, beats]. */
function tune(bars: readonly (readonly (readonly [number, number])[])[]) {
  const notes: HornNote[] = [];
  bars.forEach((bar, b) => {
    let beat = 0;
    for (const [midi, beats] of bar) {
      notes.push({ at: b * 16 + beat * 4, midi, beats });
      beat += beats;
    }
  });
  return notes;
}

/** Olympus's theme, over Em C G D Em C Am B. */
const THEME = tune([
  [
    [64, 2],
    [67, 1],
    [71, 1],
  ],
  [
    [72, 3],
    [71, 1],
  ],
  [
    [74, 2],
    [71, 1],
    [67, 1],
  ],
  [[69, 4]],
  [
    [64, 2],
    [67, 1],
    [71, 1],
  ],
  [
    [76, 3],
    [74, 1],
  ],
  [
    [72, 2],
    [71, 1],
    [69, 1],
  ],
  [[71, 4]],
]);

/** The same theme's second half, lifted to end in the major: over C G D E. */
const THEME_HOME = tune([
  [
    [76, 3],
    [74, 1],
  ],
  [
    [74, 2],
    [71, 1],
    [67, 1],
  ],
  [
    [69, 3],
    [66, 1],
  ],
  [
    [68, 2],
    [71, 2],
  ],
]);

const DRIVE = "X..x..x.X.x.x..x";
const EIGHTHS = "x.x.x.x.x.x.x.x.";
const QUARTERS = "x...x...x...x...";

export const SECTIONS = {
  /** The room settling: low strings and a stray lyre note round the fire. */
  standby: {
    chords: [Em, Em, Em, Em, F, F, Em, Em],
    level: 0.48,
    pad: 0.6,
    bright: 650,
    lyre: 0.7,
    lyrePattern: "0.......3.......",
    drums: 0.35,
    drumPattern: "o...............",
  },
  /** The climb: one long swell for the eleven seconds of the tilt, and it holds there. */
  mountain: {
    chords: [Em, Em, F, F, Em, Em, C, D],
    level: 1,
    build: 11,
    pad: 0.85,
    bright: 500,
    brightTo: 2000,
    choir: 0.55,
    pulse: 0.6,
    pulsePattern: QUARTERS,
    drums: 0.8,
    drumPattern: "X.......x.....x.",
  },
  /** The breath before the strike. The reverb rings on, and a rising noise carries it. */
  hush: { chords: [Em], level: 0, pad: 0, bright: 500 },
  /** OLYMPUS: the whole band and the theme. */
  title: {
    chords: [Em, C, G, D, Em, C, Am, B],
    level: 1,
    pad: 1,
    bright: 2200,
    choir: 0.75,
    pulse: 0.8,
    pulsePattern: EIGHTHS,
    drums: 1,
    drumPattern: DRIVE,
    shaker: 0.6,
    shakerPattern: "..x...x...x...x.",
    horn: 1,
    tune: THEME,
    tuneBars: 8,
  },
  /** The execs: the band falls back to a lyre figure over a walking pulse. */
  execs: {
    chords: [Em, Em, F, F],
    level: 0.72,
    pad: 0.6,
    bright: 1100,
    pulse: 0.6,
    pulsePattern: QUARTERS,
    lyre: 1,
    lyrePattern: "0.1.2.3.4.3.2.1.",
    drums: 0.6,
    drumPattern: "x.......x.....o.",
    shaker: 0.3,
    shakerPattern: "..x...x...x...x.",
  },
  /** The roulette: everything tightens to sixteenths and climbs. */
  roulette: {
    chords: [Em, F],
    level: 1,
    build: 4.5,
    pad: 0.7,
    bright: 900,
    brightTo: 2600,
    choir: 0.5,
    pulse: 1,
    pulsePattern: "xxxxxxxxxxxxxxxx",
    drums: 0.9,
    drumPattern: "x...x...x...x.x.",
    shaker: 0.6,
    shakerPattern: "x.x.x.x.x.x.x.x.",
  },
  /** "Whose family are you in?": a heartbeat under a chord that will not resolve. */
  question: {
    chords: [Dread],
    level: 0.65,
    pad: 0.7,
    bright: 800,
    choir: 0.9,
    drums: 1,
    drumPattern: "X..x............",
  },
  /** The chain being forged, a hammer on every beat. */
  forge: {
    chords: [Em, F],
    level: 0.9,
    pad: 0.75,
    bright: 1100,
    choir: 0.4,
    pulse: 0.8,
    pulsePattern: EIGHTHS,
    drums: 0.9,
    drumPattern: "X...x...X...x...",
  },
  /** The fire catches: the theme comes back. */
  forged: {
    chords: [Em, C, G, D, Em, C, Am, B],
    level: 0.95,
    pad: 0.9,
    bright: 1800,
    choir: 0.55,
    pulse: 0.7,
    pulsePattern: EIGHTHS,
    drums: 0.9,
    drumPattern: DRIVE,
    shaker: 0.5,
    shakerPattern: "..x...x...x...x.",
    horn: 0.85,
    tune: THEME,
    tuneBars: 8,
  },
  /**
   * The setup: a light, moving groove that runs on across the three slides. It stays under
   * the presenter's voice but never stops.
   */
  setup: {
    chords: [Em, C, G, D],
    level: 0.64,
    pad: 0.55,
    bright: 1300,
    pulse: 0.5,
    pulsePattern: "x..x..x.x..x..x.",
    lyre: 1,
    lyrePattern: "0.2.1.3.2.4.3.2.",
    drums: 0.6,
    drumPattern: "x.....x.x.......",
    shaker: 0.45,
    shakerPattern: "..x...x...x...x.",
  },
  /** Good luck: the theme lifted, ending bright in the major. The loudest thing in the deck. */
  goodLuck: {
    chords: [C, G, D, EMajor],
    level: 1,
    pad: 1,
    bright: 2600,
    choir: 0.85,
    pulse: 0.9,
    pulsePattern: EIGHTHS,
    drums: 1,
    drumPattern: DRIVE,
    shaker: 0.7,
    shakerPattern: "..x...x...x...x.",
    lyre: 0.6,
    lyrePattern: "0.1.2.3.4.3.2.1.",
    horn: 1,
    tune: THEME_HOME,
    tuneBars: 4,
  },
  /** The Oracle: the drums all but gone, voices over the fire. */
  oracle: {
    chords: [Em, F, Em, C],
    level: 0.62,
    pad: 0.6,
    bright: 900,
    choir: 1,
    lyre: 0.6,
    lyrePattern: "0...2...4...3...",
    drums: 0.6,
    drumPattern: "X...............",
  },
} satisfies Record<string, Section>;

export type SectionName = keyof typeof SECTIONS;

/** The chord the score ends on, ringing out over /oracle. */
export const LAST_CHORD = Em;
