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

const GOLD = { g: "#e9c46a", G: "#a57e2a" };
const BRONZE = { b: "#8a6a3a", B: "#d2aa6a" };

export const COSMETICS: readonly Cosmetic[] = [
  {
    id: "fedora",
    name: "Fedora",
    slot: "head",
    price: 0,
    x: 8,
    y: -4,
    rows: [
      "....######....",
      "...########...",
      "...########...",
      "...gggggggg...",
      "##############",
    ],
    inks: { "#": "#d9d5c8", g: "#277d4a" },
  },
  {
    id: "laurel",
    name: "Laurel Wreath",
    slot: "head",
    price: 2,
    x: 9,
    y: -2,
    rows: ["g.G.g.G.g.G.", "GgGgGgGgGgGg", ".g.G.g.G.g.G"],
    inks: GOLD,
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
    inks: { w: "#f5f5f5", c: "#d2aa6a", d: "#8a6a3a" },
  },
  {
    id: "owl",
    name: "Owl Companion",
    slot: "head",
    price: 3,
    x: 12,
    y: -8,
    rows: ["o.....o", "ooooooo", "oYoooYo", "oDoyoDo", "ooooooo", ".oOoOo.", ".ooooo.", "..y.y.."],
    inks: { o: "#b7a27e", O: "#8a7a5a", Y: "#f5f5f5", D: "#111111", y: "#e9c46a" },
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
    inks: { ...BRONZE, r: "#c0392b" },
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
  {
    id: "glasses",
    name: "Scholar's Spectacles",
    slot: "face",
    price: 1,
    x: 11,
    y: 1,
    rows: ["###.###", "#.#-#.#", "###.###"],
    inks: { "#": "#e9c46a", "-": "#e9c46a" },
  },
  {
    id: "patch",
    name: "Eye Patch",
    slot: "face",
    price: 1,
    x: 10,
    y: 1,
    rows: ["ssssssssss", ".kkk......", ".kkk......"],
    inks: { k: "#6b4a26", s: "#c9a06a" },
  },
  {
    id: "beard",
    name: "Philosopher's Beard",
    slot: "face",
    price: 2,
    x: 12,
    y: 8,
    rows: ["wwwwww", ".wWwww", ".wwwW.", "..www.", "..ww..", "...w.."],
    inks: { w: "#f5f5f5", W: "#cfcfcf" },
  },
  {
    id: "cape",
    name: "Crimson Cape",
    slot: "back",
    price: 2,
    x: 1,
    y: 7,
    rows: [
      "......rrrr",
      ".....rrrrr",
      "....rrrrrr",
      "...rrrrrRr",
      "..rrrRrrrr",
      ".rrrrrrrRr",
      "rrRrrrrrrr",
      "rrrrrrRrrr",
      "rRrrrrrrrr",
      ".rrrrrrr..",
    ],
    inks: { r: "#b3263a", R: "#7c1a28" },
  },
  {
    id: "shield",
    name: "Round Shield",
    slot: "back",
    price: 3,
    x: 0,
    y: 6,
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
    inks: { ...BRONZE, g: "#e9c46a", k: "#3a2c1b" },
  },
  {
    id: "wings",
    name: "Feather Wings",
    slot: "back",
    price: 5,
    x: -4,
    y: -3,
    rows: [
      "........ww..",
      "......wwww..",
      "....wwwWww..",
      "..wwwwWwww..",
      ".wwwWwwwww..",
      "wwwWwwwwww..",
      "wwWwwwwww...",
      ".wwwwwww....",
      "..wwwww.....",
      "...www......",
    ],
    inks: { w: "#f5f5f5", W: "#c9c9d6" },
  },
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
    inks: { m: "#00eb88", g: "#03c652", b: "#8a6a3a" },
  },
  {
    id: "lyre",
    name: "Lyre",
    slot: "hand",
    price: 2,
    x: 16,
    y: 6,
    rows: [".g....g", ".gg..gg", "..g..g.", "..gwwg.", "..gwwg.", "ggggwg.", "..gggg.", "...gg.."],
    inks: { g: "#e9c46a", w: "#f5f5f5" },
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
      "....g...",
      "....g...",
      "....g...",
      "....g...",
      "....g...",
      "....g...",
      "....g...",
      "....g...",
      "....g...",
      "....g...",
      "ggggg...",
      "....g...",
      "....g...",
      "....g...",
      "....g...",
      "....g...",
      "....g...",
    ],
    inks: { g: "#e9c46a" },
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

/** The shopkeeper's own: never for sale, worn over the body. */
export const TOGA: Cosmetic = {
  id: "toga",
  name: "Toga",
  slot: "back",
  price: 0,
  x: 6,
  y: 8,
  rows: [
    "...wwww...",
    "..wwwww...",
    ".wwwwwWw..",
    "wwwwwWwww.",
    "wwwwWwwwww",
    ".wwWwwwww.",
    "..Wwwwww..",
  ],
  inks: { w: "#f5f5f5", W: "#c9c9d6" },
};

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
