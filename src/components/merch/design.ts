/**
 * The /merch design: every choice the mockup reads, as one plain object so it can be saved
 * in the browser, copied and restored. Inks are product colours (what the printer is asked
 * for), not site tokens; the greens are the brand's.
 */

export const INKS = {
  green: { label: "Brand green", hex: "#03C652" },
  mint: { label: "Mint", hex: "#00EB88" },
  deep: { label: "Deep green", hex: "#277D4A" },
  washed: { label: "Washed green", hex: "#5E9A73" },
  bone: { label: "Bone", hex: "#D9D4C7" },
  grey: { label: "Ash grey", hex: "#7B7A76" },
  tonal: { label: "Tonal black", hex: "#0E0E0E" },
} as const;
export type InkId = keyof typeof INKS;

export const TECHNIQUES = {
  screen: "Screen print",
  puff: "Puff print",
  embroidery: "Embroidery",
  discharge: "Discharge",
} as const;
export type Technique = keyof typeof TECHNIQUES;

export const LINES = { solid: "Solid", inline: "Inline", outline: "Outline" } as const;
export type LineStyle = keyof typeof LINES;

export const BACK_PIECES = {
  none: "Sleeves only",
  arms: "Arms",
  "arms-spine": "Arms + spine",
  full: "Arms, spine + wings",
} as const;
export type BackPiece = keyof typeof BACK_PIECES;

export const SLEEVE_SPANS = {
  full: { label: "Full", from: 0, to: 0.97 },
  upper: { label: "Upper arm", from: 0, to: 0.55 },
  forearm: { label: "Forearm", from: 0.35, to: 0.97 },
} as const;
export type SleeveSpan = keyof typeof SLEEVE_SPANS;

export const ZIPPERS = {
  silver: { label: "Silver", hex: "#B9BBBD" },
  gunmetal: { label: "Gunmetal", hex: "#55585C" },
  black: { label: "Matte black", hex: "#1E1E1F" },
} as const;
export type Zipper = keyof typeof ZIPPERS;

export const CORDS = { fabric: "Matching", green: "Green", none: "None" } as const;
export type Cords = keyof typeof CORDS;

export const BACKDROPS = { studio: "Studio", light: "Light" } as const;
export type Backdrop = keyof typeof BACKDROPS;

export const MARKS = {
  chest: "Pixel dino, left chest",
  pull: "Dino zipper pull",
  pendant: "Dino in the back piece",
  cuff: "<HTF/> cuff tag",
  hem: "<HTF/> hem tab",
} as const;
export type MarkId = keyof typeof MARKS;

export type Design = {
  seed: number;
  density: number;
  thorns: number;
  weight: number;
  ribs: boolean;
  lattice: boolean;
  beads: boolean;
  needles: boolean;
  /** Mirror the left sleeve onto the right; off, the right sleeve gets its own seed. */
  mirror: boolean;
  /** Solid ink, solid with an engraved inline in the second ink, or an outline. */
  line: LineStyle;
  back: BackPiece;
  span: SleeveSpan;
  technique: Technique;
  primary: InkId;
  accent: InkId;
  /** 0..1: worn-in cracks in the print. */
  distress: number;
  /** 0..1: from a true black to a heavily washed charcoal. */
  wash: number;
  zipper: Zipper;
  cords: Cords;
  backdrop: Backdrop;
  marks: Record<MarkId, boolean>;
  markInk: "tonal" | "accent";
  /** Uploaded back artwork: its width as a share of the back, and how far down it sits. */
  uploadScale: number;
  uploadY: number;
};

export const DEFAULT_DESIGN: Design = {
  seed: 1027,
  density: 0.55,
  thorns: 0.6,
  weight: 0.35,
  ribs: true,
  lattice: true,
  beads: true,
  needles: true,
  mirror: true,
  line: "solid",
  back: "full",
  span: "full",
  technique: "screen",
  primary: "green",
  accent: "green",
  distress: 0.25,
  wash: 0.6,
  zipper: "gunmetal",
  cords: "fabric",
  backdrop: "studio",
  marks: { chest: true, pull: false, pendant: false, cuff: false, hem: true },
  markInk: "tonal",
  uploadScale: 0.8,
  uploadY: 0.3,
};

/** Starting points: the ink and finish only; the drawing stays as it is. */
export const LOOKS: { id: string; label: string; patch: Partial<Design> }[] = [
  {
    id: "toxic",
    label: "Toxic",
    patch: {
      primary: "green",
      accent: "green",
      technique: "screen",
      line: "solid",
      distress: 0.25,
    },
  },
  {
    id: "tonal",
    label: "Tonal + green",
    patch: { primary: "tonal", accent: "green", technique: "puff", line: "inline", distress: 0 },
  },
  {
    id: "bone",
    label: "Bone + green",
    patch: { primary: "bone", accent: "green", technique: "screen", line: "solid", distress: 0.4 },
  },
  {
    id: "ghost",
    label: "Ghost",
    patch: {
      primary: "washed",
      accent: "mint",
      technique: "discharge",
      line: "outline",
      distress: 0.15,
    },
  },
  {
    id: "stitched",
    label: "Stitched",
    patch: {
      primary: "deep",
      accent: "green",
      technique: "embroidery",
      line: "solid",
      distress: 0,
    },
  },
];

/** Reads a saved design back: anything missing or no longer valid takes the default. */
export function normalizeDesign(raw: unknown): Design {
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<Design>;
  const out: Design = { ...DEFAULT_DESIGN };
  for (const key of Object.keys(DEFAULT_DESIGN) as (keyof Design)[]) {
    if (key in d && typeof d[key] === typeof DEFAULT_DESIGN[key]) {
      (out as Record<string, unknown>)[key] = d[key];
    }
  }
  out.marks = { ...DEFAULT_DESIGN.marks, ...(d.marks ?? {}) };
  if (!(out.line in LINES)) out.line = DEFAULT_DESIGN.line;
  if (!(out.back in BACK_PIECES)) out.back = DEFAULT_DESIGN.back;
  return out;
}

/** Mixes two hex colours, `t` of the way from `a` to `b`. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) =>
    Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

/** The fabric colours for a wash level. */
export function fabric(wash: number) {
  const base = mix("#141414", "#3A3937", wash);
  return {
    base,
    shadow: mix(base, "#000000", 0.55),
    seam: mix(base, "#8A8782", 0.18 + wash * 0.22),
    lining: mix(base, "#000000", 0.35),
    tonal: mix(base, "#5A5955", 0.2),
  };
}
