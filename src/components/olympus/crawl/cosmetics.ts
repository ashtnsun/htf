/**
 * What a dinosaur can wear, and what colour it can be. Each piece is a string map placed on the
 * T-rex's own grid (components/brand/dino-pixels), so it moves and flips with the body. The dinosaur
 * is seen from the side, and everything here is drawn from the side too, on its anatomy:
 *
 *   skull      row 0 runs cols 11-18, rows 1-5 cols 10-19 (the snout runs forward from col 14)
 *   eye        the carved cell at 12, 2, at the back of the head
 *   mouth      the gap on row 6, cols 15-19; the jaw under it is row 7, cols 10-17
 *   neck       row 8, cols 9-13
 *   back       steps down from 9, 8 to 5, 11, and the tail runs out to col 0 on rows 12-13
 *   hand       15, 11, on the arm at 14-15, 10
 *
 * Hats sit down on the skull and go no wider than it does. Things for the back fasten at the neck
 * and lie over the body. Things in the hand pass behind the arm, which is drawn last, and are angled
 * forward so they clear the snout. Check a new one worn, never by itself.
 *
 * Names must never use a family's words (content/olympus.ts): no Spartan helm, no phoenix feather,
 * no drachma.
 */

export type Slot = "head" | "back" | "hand";

export type Cosmetic = {
  id: string;
  name: string;
  slot: Slot;
  /** Coins. Zero is what the dinosaur arrives in. */
  price: number;
  /** A thing for the back that lies over the body, instead of showing from behind it. */
  over?: boolean;
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
    id: "cat",
    name: "Cat Ears",
    slot: "head",
    price: 2,
    x: 11,
    y: -4,
    rows: [".o....o.", "ooo..ooo", "oppo.opo", "oppo.opo", "bbbbbbbb"],
    inks: { o: "#211e26", p: "#ffb7c5", b: "#211e26" },
  },
  {
    id: "winged",
    name: "Winged Cap",
    slot: "head",
    price: 3,
    x: 8,
    y: -4,
    rows: ["w.....ccc....", "www.cccccc...", ".wwwcccccc...", "..wWwccccc...", "..ddddddddddd"],
    inks: { w: "#f5f5f5", W: "#c9c9d6", c: "#2fa8a0", d: "#17605c" },
  },
  {
    id: "horns",
    name: "Bull Horns",
    slot: "head",
    price: 3,
    x: 11,
    y: -4,
    rows: ["..i....I..", ".ii...II..", "ii...II...", "ii...II...", "bb...BB..."],
    inks: { i: "#efe6d2", I: "#b9ad90", b: "#3a2c1b", B: "#2a2014" },
  },
  {
    id: "serpents",
    name: "Serpent Locks",
    slot: "head",
    price: 5,
    x: 9,
    y: -6,
    rows: [
      ".....ggg......",
      ".ggg.gYgr.....",
      ".gYgr.g..ggg..",
      "..g..g...gYgr.",
      ".g....g..g....",
      "..g..g..g.....",
      ".GGGGGGGGG....",
      "gG............",
      "g.............",
    ],
    inks: { g: "#9a6cf0", G: "#6238b8", Y: "#f2c84b", r: "#ff4545" },
  },
  {
    id: "helm",
    name: "Bronze Helm",
    slot: "head",
    price: 4,
    x: 9,
    y: -5,
    rows: [
      "..rrrrrrr.",
      ".rrRrRrRrr",
      "rr.bbbbb..",
      "r.bBBBBBBb",
      "r.bBBBBBBb",
      ".bBBBBBBBBb",
      ".bB...bBB.",
      ".bB..bB...",
      ".bB.......",
      ".bBb......",
      ".bb.......",
    ],
    inks: { b: "#8a6a3a", B: "#d2aa6a", r: "#c0392b", R: "#8e2418" },
  },
  {
    id: "crown",
    name: "Golden Crown",
    slot: "head",
    price: 6,
    x: 11,
    y: -3,
    rows: ["g..g..g", "gg.g.gg", "ggggggg", "gRgBgRg"],
    inks: { g: "#e9c46a", R: "#ff4545", B: "#3388ff" },
  },

  // Back.
  {
    id: "cape",
    name: "Crimson Cape",
    slot: "back",
    over: true,
    price: 2,
    x: 2,
    y: 8,
    rows: [
      ".......rrrrg",
      ".....rrrrrr.",
      "..rrrrrrrr..",
      ".rrrrRrrrr..",
      "rrRrrrrrr...",
      "rrrRrrrrr...",
      "rRrrrrrR....",
      "rrrRrr......",
      "rrrrrr......",
      "r.rr.rr.....",
    ],
    inks: { r: "#b3263a", R: "#7c1a28", g: "#e9c46a" },
  },
  {
    id: "cloak",
    name: "Sea Cloak",
    slot: "back",
    over: true,
    price: 2,
    x: 3,
    y: 8,
    rows: [
      "......bbbbg",
      "....bbbbbb.",
      "..bbbbbbb..",
      ".bbBbbbb...",
      "bbBbbbbb...",
      "wbwbwbwb...",
      ".w.w.w.....",
    ],
    inks: { b: "#1f5fbf", B: "#133f86", w: "#eaf4ff", g: "#efe6d2" },
  },
  {
    id: "shield",
    name: "Painted Shield",
    slot: "back",
    over: true,
    price: 3,
    x: 3,
    y: 8,
    rows: [
      "...bbb....s",
      ".bbBBBbb.s.",
      ".bBBgBBbs..",
      "bBBgggBBb..",
      "bBgggggBb..",
      "bBBgggBBb..",
      ".bBBgBBb...",
      ".bbBBBbb...",
      "...bbb.....",
    ],
    inks: { b: "#b3592a", B: "#234a9c", g: "#efe6d2", s: "#6f4f2a" },
  },
  {
    id: "wings",
    name: "Feather Wings",
    slot: "back",
    over: true,
    price: 5,
    x: -1,
    y: 2,
    rows: [
      "w...........",
      "www.........",
      ".wwww.......",
      ".wwwwww.....",
      "..WwwwwWw...",
      "..wwWwwwwww.",
      "...wWwwWwwww",
      "...t.wWwwwww",
      ".....t.wWwww",
      ".......t.ww.",
    ],
    inks: { w: "#f5f5f5", W: "#c9c9d6", t: "#8fb7ff" },
  },

  // Hand.
  {
    id: "torch",
    name: "Torch",
    slot: "hand",
    price: 1,
    x: 14,
    y: 0,
    rows: [
      "........m..",
      ".......mfm.",
      ".......fyf.",
      ".......fyf.",
      "........f..",
      ".......b...",
      "......b....",
      ".....b.....",
      "....b......",
      "...b.......",
      "..b........",
      "...........",
      "b..........",
    ],
    inks: { m: "#ffb347", f: "#ff6a1f", y: "#ffe08a", b: "#6f4f2a" },
  },
  {
    id: "cup",
    name: "Wine Cup",
    slot: "hand",
    price: 1,
    x: 16,
    y: 9,
    rows: ["opppo", "ooooo", "oooo.", "..o..", ".ooo."],
    inks: { o: "#c96f33", p: "#7a1f5e" },
  },
  {
    id: "lyre",
    name: "Lyre",
    slot: "hand",
    price: 2,
    x: 16,
    y: 8,
    rows: ["g.....g", "ggggggg", "g.w.w.g", "g.w.w.g", "g.w.w.g", ".ggggg.", "..ggg.."],
    inks: { g: "#9c5a28", w: "#f5f5f5" },
  },
  {
    id: "trident",
    name: "Trident",
    slot: "hand",
    price: 4,
    x: 10,
    y: -2,
    rows: [
      "..............g.....",
      ".............g....g.",
      "............g....g..",
      "...........g....g..g",
      "............g..g..g.",
      ".............gg..g..",
      "............d..gg...",
      "...........d...g....",
      "..........d.........",
      ".........d..........",
      "........d...........",
      ".......d............",
      "......d.............",
      "....................",
      "....d...............",
      "...d................",
      "..d.................",
      ".d..................",
      "d...................",
    ],
    inks: { g: "#5fe0c8", d: "#2b8a7a" },
  },
];

export const FOR_SALE = COSMETICS.filter((c) => c.price > 0);
export const cosmeticById = (id: string | null) => COSMETICS.find((c) => c.id === id);
export const SLOTS: readonly { slot: Slot; name: string }[] = [
  { slot: "head", name: "Head" },
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
  back: string | null;
  hand: string | null;
};

export const DEFAULT_LOOK: Look = {
  color: "olympus",
  head: "fedora",
  back: null,
  hand: null,
};
