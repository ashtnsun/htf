/**
 * What a dinosaur can wear, and what colour it can be. Each piece is a string map placed on the
 * T-rex's own grid (components/brand/dino-pixels: the head fills columns 10-19 of rows 0-5, the eye
 * is the carved cell at 12, 2, the arm reaches 15, 11), so it moves and flips with the body.
 *
 * Names and shopkeeper's lines must never use a family's words (content/olympus.ts): no Spartan
 * helm, no phoenix feather, no drachma.
 */

export type Slot = "head" | "face" | "back" | "hand";

export type Cosmetic = {
  id: string;
  name: string;
  slot: Slot;
  /** Coins. Zero is what the dinosaur arrives in. */
  price: number;
  x: number;
  y: number;
  rows: readonly string[];
  inks: Record<string, string>;
};

export const COSMETICS: readonly Cosmetic[] = [
  // What the dinosaur arrives in.
  {
    id: "fedora",
    name: "Fedora",
    slot: "head",
    price: 0,
    x: 8,
    y: -4,
    rows: [
      "....######....",
      "...###++###...",
      "...########...",
      "...kkkkkkkk...",
      "##############",
    ],
    inks: { "#": "#8a5a2e", "+": "#6f4522", k: "#2a1a0e" },
  },

  // Head.
  {
    id: "laurel",
    name: "Olive Wreath",
    slot: "head",
    price: 2,
    x: 9,
    y: -2,
    rows: ["g.G.g.G.g.G.", "GgGgGgGgGgGg", ".w.G.g.w.g.G"],
    inks: { g: "#a8d45a", G: "#3f6f22", w: "#f5efe0" },
  },
  {
    id: "wool",
    name: "Red Wool Cap",
    slot: "head",
    price: 1,
    x: 9,
    y: -6,
    rows: [
      "......rrrr...",
      "....rrrrrrr..",
      "...rrrrrrRrr.",
      "..rrrrrrrRRrr",
      "..rrrrrrrr.Rr",
      "..wwwwwwwwww.",
    ],
    inks: { r: "#d0402f", R: "#8e2418", w: "#efe6d2" },
  },
  {
    id: "vine",
    name: "Vine Crown",
    slot: "head",
    price: 3,
    x: 9,
    y: -3,
    rows: [".l.L.l.L.l.L", "LlLlLlLlLlLl", "p.pp.p..pp.p", "PpP..P.pPp.."],
    inks: { l: "#8fc43f", L: "#3f7a24", p: "#a56be8", P: "#5f2f9c" },
  },
  {
    id: "winged",
    name: "Winged Cap",
    slot: "head",
    price: 3,
    x: 4,
    y: -6,
    rows: [
      "ww.............",
      "www............",
      ".www..ccccccc..",
      "..www.ccccccccc",
      "...wwwccccccccc",
      "....wwddddddddd",
    ],
    inks: { w: "#f5f5f5", c: "#2fa8a0", d: "#17605c" },
  },
  {
    id: "horns",
    name: "Bull Horns",
    slot: "head",
    price: 3,
    x: 8,
    y: -5,
    rows: [
      "i............i",
      "ii..........ii",
      ".ii........ii.",
      ".iIi......iIi.",
      "..iIiiiiiiIi..",
      "..bbbbbbbbbb..",
    ],
    inks: { i: "#efe6d2", I: "#b9ad90", b: "#3a2c1b" },
  },
  {
    id: "serpents",
    name: "Serpent Locks",
    slot: "head",
    price: 5,
    x: 9,
    y: -7,
    rows: [
      ".gg...gg...gg",
      ".gY...gY...gY",
      "..g....g....g",
      ".G....G....G.",
      ".g....g....g.",
      "..g....g....g",
      "..G....G....G",
      ".gg..ggg..gg.",
    ],
    inks: { g: "#9a6cf0", G: "#6238b8", Y: "#f2c84b" },
  },
  {
    id: "helm",
    name: "Bronze Helm",
    slot: "head",
    price: 4,
    x: 9,
    y: -7,
    rows: [
      "....rrrrr....",
      "...rrrrrrr...",
      "..rrrrrrrrr..",
      "..bbbbbbbbbb.",
      ".bBBBBBBBBBBb",
      ".bBBBBBBBBBBb",
      ".bBBBBBBBBBBb",
      ".bB........bb",
      ".bB..........",
      ".bB..........",
      ".bb..........",
    ],
    inks: { b: "#8a6a3a", B: "#d2aa6a", r: "#c0392b" },
  },
  {
    id: "crown",
    name: "Golden Crown",
    slot: "head",
    price: 6,
    x: 10,
    y: -5,
    rows: ["g..g..g..g", "g..g..g..g", "gg.gg.gg.g", "gggggggggg", "gRgggBgggR"],
    inks: { g: "#e9c46a", R: "#ff4545", B: "#3388ff" },
  },

  // Face.
  {
    id: "glasses",
    name: "Scholar's Spectacles",
    slot: "face",
    price: 1,
    x: 11,
    y: 1,
    rows: ["###.###", "#.#-#b#", "###.###"],
    inks: { "#": "#c7d3da", "-": "#c7d3da", b: "#7fd0ff" },
  },
  {
    id: "patch",
    name: "Eye Patch",
    slot: "face",
    price: 1,
    x: 10,
    y: 1,
    rows: ["ssssssssss", ".kkk......", ".kkk......"],
    inks: { k: "#1c1410", s: "#b08d57" },
  },
  {
    id: "beard",
    name: "Philosopher's Beard",
    slot: "face",
    price: 2,
    x: 13,
    y: 5,
    rows: ["wwwwwww", ".wWwwww", ".wwwWw.", "..wwww.", "..wWw..", "...ww..", "...w..."],
    inks: { w: "#f5f5f5", W: "#cfcfcf" },
  },
  {
    id: "mask",
    name: "Theatre Mask",
    slot: "face",
    price: 3,
    x: 11,
    y: -1,
    rows: [
      ".wwwwww.",
      "wwwwwwww",
      "wWWwwWWw",
      "wkkwwkkw",
      "wwwwwwww",
      "wrwwwwrw",
      ".wrrrrw.",
      "..wwww..",
    ],
    inks: { w: "#f5efe0", W: "#b9ad90", k: "#14100c", r: "#d0402f" },
  },

  // Back.
  {
    id: "cape",
    name: "Crimson Cape",
    slot: "back",
    price: 2,
    x: -4,
    y: 3,
    rows: [
      ".........rrrr",
      "......rrrrrrr",
      "...rrrrrrRrrr",
      ".rrrrRrrrrrr.",
      "rrRrrrrrrRrr.",
      "rrrrrrrRrrr..",
      ".rrRrrrrr....",
      "...rr.rr.....",
    ],
    inks: { r: "#b3263a", R: "#7c1a28" },
  },
  {
    id: "cloak",
    name: "Sea Cloak",
    slot: "back",
    price: 2,
    x: -4,
    y: 3,
    rows: [
      ".........bbbb",
      "......bbbbbbb",
      "...bbbbbbBbbb",
      ".bbbbBbbbbbb.",
      "bbBbbbbbbBbb.",
      "bbbbbbbBbbb..",
      "wbwbwbwbw....",
      ".w.w.w.......",
    ],
    inks: { b: "#1f5fbf", B: "#133f86", w: "#eaf4ff" },
  },
  {
    id: "shield",
    name: "Painted Shield",
    slot: "back",
    price: 3,
    x: -3,
    y: 2,
    rows: [
      "...bbbbb...",
      ".bbBBBBBbb.",
      ".bBBgggBBb.",
      "bBBgBBBgBBb",
      "bBgBBkBBgBb",
      "bBgBkkkBgBb",
      "bBgBBkBBgBb",
      "bBBgBBBgBBb",
      ".bBBgggBBb.",
      ".bbBBBBBbb.",
      "...bbbbb...",
    ],
    inks: { b: "#b3592a", B: "#234a9c", g: "#efe6d2", k: "#efe6d2" },
  },
  {
    id: "wings",
    name: "Feather Wings",
    slot: "back",
    price: 5,
    x: -2,
    y: 0,
    rows: [
      "........ww..",
      "......wwww..",
      "....wwwWww..",
      "..wwwwWwwww.",
      ".wwwWwwwwww.",
      "wwwWwwwwwww.",
      "wwWwwwwwww..",
      ".twwwwwww...",
      "..twtwtw....",
      "...ttt......",
    ],
    inks: { w: "#f5f5f5", W: "#c9c9d6", t: "#8fb7ff" },
  },

  // Hand.
  {
    id: "torch",
    name: "Torch",
    slot: "hand",
    price: 1,
    x: 16,
    y: 2,
    rows: [
      "...m...",
      "..mgm..",
      "..mgm..",
      "...g...",
      "..bbb..",
      "...b...",
      "...b...",
      "...b...",
      "...b...",
      "bbbb...",
      "...b...",
      "...b...",
    ],
    inks: { m: "#ffb347", g: "#ff6a1f", b: "#6f4f2a" },
  },
  {
    id: "cup",
    name: "Wine Cup",
    slot: "hand",
    price: 1,
    x: 16,
    y: 6,
    rows: [
      "opppppppo",
      "ooooooooo",
      "okokokoko",
      ".ooooooo.",
      "...ooo...",
      "....o....",
      "...ooo...",
    ],
    inks: { o: "#c96f33", k: "#14100c", p: "#7a1f5e" },
  },
  {
    id: "lyre",
    name: "Lyre",
    slot: "hand",
    price: 2,
    x: 16,
    y: 6,
    rows: [".g....g", ".gg..gg", "..g..g.", "..gwwg.", "..gwwg.", "ggggwg.", "..gggg.", "...gg.."],
    inks: { g: "#9c5a28", w: "#f5f5f5" },
  },
  {
    id: "trident",
    name: "Trident",
    slot: "hand",
    price: 4,
    x: 16,
    y: -3,
    rows: [
      ".g..g..g",
      ".g..g..g",
      ".gg.g.gg",
      "..ggggg.",
      "....d...",
      "....d...",
      "....d...",
      "....d...",
      "....d...",
      "....d...",
      "....d...",
      "....d...",
      "....d...",
      "....d...",
      "ddddd...",
      "....d...",
      "....d...",
      "....d...",
      "....d...",
      "....d...",
      "....d...",
    ],
    inks: { g: "#5fe0c8", d: "#2b8a7a" },
  },
];

export const FOR_SALE = COSMETICS.filter((c) => c.price > 0);
export const cosmeticById = (id: string | null) => COSMETICS.find((c) => c.id === id);
export const SLOTS: readonly { slot: Slot; name: string }[] = [
  { slot: "head", name: "Head" },
  { slot: "face", name: "Face" },
  { slot: "back", name: "Back" },
  { slot: "hand", name: "Hand" },
];

/** The nine colours in the mirror, each named for something Greek but no one's family. */
export const DINO_COLORS = [
  { id: "olympus", name: "Olive Grove", body: "#03c652", light: "#00eb88" },
  { id: "aegean", name: "Aegean Blue", body: "#2f7fe0", light: "#6fb0ff" },
  { id: "kymata", name: "Sea Foam", body: "#19c7c0", light: "#7cefe6" },
  { id: "amethyst", name: "Amethyst", body: "#8d5be0", light: "#bb97f5" },
  { id: "rose", name: "Dawn Rose", body: "#ef5da8", light: "#ff9bcb" },
  { id: "wine", name: "Wine Dark", body: "#c0263f", light: "#ef5a70" },
  { id: "clay", name: "Red Clay", body: "#d9692b", light: "#f39a63" },
  { id: "gilt", name: "Gilt", body: "#e0b235", light: "#f7d875" },
  { id: "marble", name: "Marble", body: "#d8d4c8", light: "#f5f5f5" },
] as const;

export type Look = {
  color: string;
  head: string | null;
  face: string | null;
  back: string | null;
  hand: string | null;
};

export const DEFAULT_LOOK: Look = {
  color: "olympus",
  head: "fedora",
  face: null,
  back: null,
  hand: null,
};
