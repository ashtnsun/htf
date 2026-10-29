import {
  cells,
  compose,
  composeIn,
  dino,
  fitted,
  line,
  local,
  WHITE,
  type Part,
} from "@/components/dino/compose";
import type { Variant } from "@/components/dino/variants";

/**
 * The Greek gods in the dinosaur editor: three variants of each (Aphrodite has four, redone, and
 * no picks; Athena four and one pick), every one the footer T-rex in
 * its own colour (one hue family per god) with one or two props that say who it is. Coordinates
 * are T-rex-local (components/dino/compose). Anything held upright stands in column 20 with the
 * arm raised to it; anything held low sits against the resting arm from column 16.
 */

/* ---------------------------------------------------------------- prop colours */

const GOLD = "#f2c94c";
const BRONZE = "#d9a441";
const SILVER = "#d8dee6";
const STEEL = "#aab4be";
const WOOD = "#b07a45";
const ANTLER = "#a0703f";
const LEATHER = "#7a4a24";
const RED = "#e5383b";
const LEAF = "#3dbe5a";
const YELLOW = "#ffe135";
const FLAME = "#4cc9ff";
const FLAME_CORE = "#c9f1ff";
const GHOST_FLAME = "#7cfc9a";
const GHOST_CORE = "#d9ffe3";
const BONE = "#ede6d6";
const POMEGRANATE = "#c1121f";
const CLOUD = "#b9c2cf";
const SEA = "#2f80ed";
const PEACOCK = "#22a06b";
const PEACOCK_EYE = "#1e4fd8";
const GLASS = "#bfe9ff";
const LILAC = "#c9a3ff";
const PLUME_LINE = "#c9c6d6";
const SASH = "#a9a6e0";
const SASH_FOLD = "#7f7cc0";
const SKY_CLOUD = "#e4e1f2";
const SKY_CLOUD_SHADE = "#b9b5d6";
const GREY = "#8a939c";

/* ---------------------------------------------------------------- props */

/** A Corinthian helmet over the head's top rows, optionally with a crest sweeping back. */
function helmet(metal: string, crest?: string): Part[] {
  const helm = local(["...hhhhhh..", "..hhhhhhhhh", "..hh.......", "..h........"], 9, -1, {
    h: metal,
  });
  if (!crest) return helm;
  return [
    ...local([".....pppp...", "...ppppppp..", ".pppppppppp.", "pp....hh...."], 9, -5, {
      p: crest,
      h: metal,
    }),
    ...helm,
  ];
}

/** A spear in column 20, leaf-shaped steel head above the snout. */
const SPEAR = [
  ...line(20, -7, 20, 21, WOOD),
  ...cells(
    [
      [20, -11],
      [19, -10],
      [20, -10],
      [21, -10],
      [19, -9],
      [20, -9],
      [21, -9],
      [20, -8],
    ],
    SILVER,
  ),
];

/** A round hoplite shield on the arm, with a lambda across it. */
function shield(rim: string, mark: string): Part[] {
  return local(
    ["..bbb..", ".bbbbb.", "bbbmbbb", "bbmbmbb", "bmbbbmb", ".bbbbb.", "..bbb.."],
    13,
    9,
    { b: rim, m: mark },
  );
}

/** A sword held up: pommel, grip, a three-cell guard and the blade. */
const SWORD = [
  ...line(20, -4, 20, 6, SILVER),
  ...cells(
    [
      [19, 7],
      [20, 7],
      [21, 7],
      [20, 10],
    ],
    GOLD,
  ),
  ...cells(
    [
      [20, 8],
      [20, 9],
    ],
    LEATHER,
  ),
];

/** A diadem rising to a jewel at the front of the head. */
function diadem(metal: string, jewel: string): Part[] {
  return local(["...jj...", "..gggg..", ".gggggg.", "gggggggg"], 11, -3, { g: metal, j: jewel });
}

/** One peacock eye: a dark centre, a gold ring and green corners. */
function peacockEye(cx: number, cy: number): Part[] {
  return [
    ...cells(
      [
        [cx - 1, cy - 1],
        [cx + 1, cy - 1],
        [cx - 1, cy + 1],
        [cx + 1, cy + 1],
      ],
      PEACOCK,
    ),
    ...cells(
      [
        [cx, cy - 1],
        [cx - 1, cy],
        [cx + 1, cy],
        [cx, cy + 1],
      ],
      GOLD,
    ),
    ...cells([[cx, cy]], PEACOCK_EYE),
  ];
}

/** A single peacock feather held up in column 20. */
const PEACOCK_FEATHER = [...line(20, -3, 20, 8, PEACOCK), ...peacockEye(20, -5)];

/** A peacock's fan behind the tail and back: five feathers from one base (drawn first). */
const PEACOCK_FAN = (
  [
    [-9, 9],
    [-10, 3],
    [-7, -2],
    [-2, -5],
    [4, -5],
  ] as const
).flatMap(([x, y]) => [...line(2, 10, x, y, PEACOCK), ...peacockEye(x, y)]);

/** A pomegranate against the arm, its crown on top. */
const POMEGRANATE_FRUIT = local([".c.c.", ".rrr.", "rrrrr", "rrrrr", ".rrr."], 16, 8, {
  r: POMEGRANATE,
  c: "#7a0c14",
});

/** A bow drawn at arm's length: the string at the hand, the wood bowed forward, an arrow nocked. */
const BOW = [
  ...line(20, 1, 20, 15, WHITE),
  ...cells(
    [
      [21, 1],
      [22, 2],
      ...Array.from({ length: 11 }, (_, i) => [23, 3 + i] as [number, number]),
      [22, 14],
      [21, 15],
    ],
    WOOD,
  ),
  ...line(20, 8, 25, 8, WOOD),
  ...cells(
    [
      [26, 8],
      [25, 7],
      [25, 9],
    ],
    SILVER,
  ),
];

/** A crescent moon over the brow on a thin band. */
function crescentTiara(color: string): Part[] {
  return [...local([".mm", "m..", ".mm"], 13, -3, { m: color }), ...line(11, 0, 18, 0, color)];
}

/** A quiver on the back, three fletched arrows showing (drawn before the dinosaur). */
const QUIVER = [
  ...local(["qqq", "qqq", "qqq", "qqq", "qqq", "qqq", "qqq"], 6, 3, { q: LEATHER }),
  ...cells(
    [
      [6, 1],
      [7, 0],
      [8, 1],
    ],
    RED,
  ),
  ...cells(
    [
      [6, 2],
      [7, 1],
      [7, 2],
      [8, 2],
    ],
    WOOD,
  ),
];

/** Antlers: two beams spreading in a V, a tine forward from each. */
const ANTLERS = cells(
  [
    [13, -1],
    [13, -2],
    [12, -3],
    [12, -4],
    [11, -5],
    [11, -6],
    [13, -4],
    [14, -5],
    [16, -1],
    [16, -2],
    [17, -3],
    [17, -4],
    [18, -5],
    [18, -6],
    [16, -4],
    [15, -5],
  ],
  ANTLER,
);

/** A crescent moon floating behind the back (drawn first). */
function moon(color: string): Part[] {
  return local([".mmm.", "mm...", "m....", "m....", "m....", "mm...", ".mmm."], 1, -4, {
    m: color,
  });
}

/** Fire for hair: flames rising from the head, pale at the roots. */
function flames(outer: string, core: string): Part[] {
  const heights = [3, 5, 4, 6, 3, 5, 4, 2];
  return heights.flatMap((h, i) =>
    Array.from({ length: h }, (_, k) => ({
      x: 11 + i,
      y: -1 - k,
      color: k < h - 2 ? core : outer,
    })),
  );
}

/** Hades's bident: two prongs over a steel shaft in column 20. */
const BIDENT = [
  ...line(20, -5, 20, 21, STEEL),
  ...cells(
    [
      [19, -8],
      [19, -7],
      [19, -6],
      [21, -8],
      [21, -7],
      [21, -6],
      [19, -5],
      [21, -5],
    ],
    STEEL,
  ),
];

/** A skull held against the arm, its eyes carved. */
const SKULL = local([".ooo.", "ooooo", "o.o.o", "ooooo", ".o.o."], 16, 8, { o: BONE });

/** A spiked crown. */
function spikedCrown(metal: string): Part[] {
  return local(["c..cc..c", "cc.cc.cc", "cccccccc"], 11, -3, { c: metal });
}

/** A gold crown with jewels. */
function crown(metal: string, jewel: string): Part[] {
  return local(["c..cc..c", "cc.cc.cc", "cccccccc", "ccjccjcc"], 11, -4, { c: metal, j: jewel });
}

/** A thunderbolt held up, its tip at the raised hand. */
function bolt(color: string): Part[] {
  return local(
    [
      "...###",
      "..###.",
      "..##..",
      ".##...",
      ".#####",
      "...##.",
      "..##..",
      ".##...",
      "##....",
      "#.....",
    ],
    19,
    -2,
    { "#": color },
  );
}

/** A laurel wreath: a band round the head and leaves standing up from it. */
function laurel(color: string): Part[] {
  return local(["..l.l.l.l.", ".lllllllll", "l.........", "l........."], 9, -1, { l: color });
}

/** A storm cloud over the head with a bolt dropping past the snout. */
const STORM = [
  ...local(
    [
      ".....cccc......",
      "...cccccccc.cc.",
      ".ccccccccccccccc",
      "ccccccccccccccc.",
      ".ccccccccccccc..",
    ],
    7,
    -8,
    { c: CLOUD },
  ),
  ...bolt(YELLOW).map((p) => ({ ...p, x: p.x + 2, y: p.y - 1 })),
];

/** A long beard hanging from the jaw (worn by a dinosaur drawn with no arm: it hides there). */
function beard(color: string): Part[] {
  return local(["oooo", "oooo", ".ooo", ".oo.", "..o."], 14, 8, { o: color });
}

/** Poseidon's trident: three prongs over a shaft in column 20. */
function trident(metal: string): Part[] {
  return [
    ...line(20, -5, 20, 21, metal),
    ...line(18, -5, 22, -5, metal),
    ...line(18, -9, 18, -6, metal),
    ...line(20, -10, 20, -6, metal),
    ...line(22, -9, 22, -6, metal),
    ...cells(
      [
        [17, -8],
        [23, -8],
      ],
      metal,
    ),
  ];
}

/** A three-pointed sea crown. */
function seaCrown(metal: string): Part[] {
  return local(["c..c..c.", "c..c..c.", "cccccccc"], 11, -3, { c: metal });
}

/** Waves round the feet: white crests on blue (drawn before the dinosaur). */
const WAVES = local(
  ["..ff.....ff.....ff.....ff..", ".fssf...fssf...fssf...fssf.", "sssssssssssssssssssssssssss"],
  -3,
  20,
  { f: WHITE, s: SEA },
);

/** A lyre against the arm: horns, the yoke, two strings, the sound box. */
function lyre(frame: string): Part[] {
  return local(["g...g", "ggggg", "gs.sg", "gs.sg", "gs.sg", ".ggg."], 16, 8, {
    g: frame,
    s: WHITE,
  });
}

/** Sun rays round the head (drawn before the dinosaur, so the body hides the lower ones). */
function sunRays(color: string): Part[] {
  const cx = 15;
  const cy = 3;
  return Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6).flatMap((a) =>
    [7, 8, 9].map((r) => ({
      x: Math.round(cx + Math.cos(a) * r),
      y: Math.round(cy - Math.sin(a) * r),
      color,
    })),
  );
}

/** A small sun held up: a round disc with four short rays. */
function sunHeld(color: string): Part[] {
  return local(
    ["...#...", ".#####.", ".#####.", "#######", ".#####.", ".#####.", "...#..."],
    20,
    1,
    { "#": color },
  );
}

/** The petasos: a round-brimmed hat with a white wing sweeping back. */
function wingedHelm(metal: string): Part[] {
  return [
    ...local(["...hhhh...", "..hhhhhh..", "hhhhhhhhhh"], 10, -2, { h: metal }),
    ...local(["w.......", ".ww.....", ".wwww...", "..wwwww.", "..w.wwww", "....w.ww"], 5, -6, {
      w: WHITE,
    }),
  ];
}

/** Small white wings at both ankles. */
const WINGED_SANDALS = cells(
  [
    [2, 19],
    [3, 19],
    [3, 20],
    [4, 20],
    [7, 19],
    [8, 19],
    [8, 20],
    [9, 20],
  ],
  WHITE,
);

/** The caduceus: a winged staff in column 21 (one column past the raised grip), snakes twined round it. */
function caduceus(staff: string, snakes: string): Part[] {
  const twist = Array.from({ length: 9 }, (_, i) => i - 3).flatMap((y) =>
    (y + 3) % 3 === 2
      ? cells([[21, y]], snakes)
      : cells(
          [
            [20, y],
            [22, y],
          ],
          snakes,
        ),
  );
  return [
    ...line(21, -4, 21, 15, staff),
    ...twist,
    ...cells([[21, -5]], staff),
    ...local(["ww.ww", ".w.w."], 19, -6, { w: WHITE }),
  ];
}

/** A sealed letter held against the arm. */
const LETTER = local(["ooooooo", "o#ooo#o", "oo#r#oo", "ooooooo", "ooooooo"], 16, 9, {
  o: WHITE,
  "#": GREY,
  r: RED,
});

/* ---------------------------------------------------------------- Aphrodite */

/** A flower crown: a leaf band over the head's top row and three flowers standing on it. */
function flowerCrown(a: string, b: string, c: string): Part[] {
  return [
    ...local(["l........", "lllllllll"], 10, -1, { l: LEAF }),
    ...[11, 14, 17].flatMap((x, i) =>
      local([".p.", "pyp", ".p."], x, -3, { p: [a, b, c][i]!, y: YELLOW }),
    ),
  ];
}

/** A hand mirror: a gold rim round pale glass with a glint, `rows` tall. */
function mirror(x: number, y: number, rows: 5 | 6): Part[] {
  const glass = rows === 6 ? ["gsssg", "gwssg", "gsssg", "gsssg"] : ["gsssg", "gwssg", "gsssg"];
  return local([".ggg.", ...glass, ".ggg."], x, y, { g: GOLD, s: GLASS, w: WHITE });
}

/** The mirror raised in front of the face, its handle angled down to the raised hand. */
const MIRROR_RAISED = [...line(20, 8, 22, 6, GOLD), ...mirror(21, 0, 6)];

/** The mirror held out level from the resting hand. */
const MIRROR_LEVEL = [...line(16, 11, 18, 11, GOLD), ...mirror(19, 9, 5)];

/** A rose bloom with a dark spiral, its top-left cell at (x, y). */
function bloom(x: number, y: number): Part[] {
  return local([".rr.", "rddr", "rdrr", ".rr."], x, y, { r: RED, d: "#9e1b24" });
}

/** A rose in the jaws: the stem through the mouth, a leaf under it, the bloom in front. */
const ROSE_IN_JAWS = [...line(15, 6, 21, 6, LEAF), ...cells([[19, 7]], LEAF), ...bloom(21, 4)];

/** A long-stemmed rose offered forward from the resting hand. */
const ROSE_OFFERED = [
  ...line(16, 11, 22, 11, LEAF),
  ...cells(
    [
      [19, 10],
      [20, 12],
    ],
    LEAF,
  ),
  ...bloom(22, 9),
];

/* ---------------------------------------------------------------- Athena */

/** A gold Corinthian helmet fitted to the head, cheek guard down, a tall white plume swept back. */
const PLUMED_HELM = [
  ...fitted([0, 1, 2], GOLD),
  ...cells(
    [
      [10, 3],
      [11, 3],
      [10, 4],
    ],
    GOLD,
  ),
  ...local(["gggg", "gggg"], 13, -2, { g: GOLD }),
  ...local(
    [
      "......wwwww.",
      "...wwwwwwwww",
      ".wwwwwwwwwww",
      "wwwsssss....",
      "ws..........",
      "w...........",
    ],
    6,
    -6,
    { w: WHITE, s: PLUME_LINE },
  ),
];

/** The spear held across the body at the resting hand, its head up and forward, a gold butt. */
const SPEAR_ACROSS = [
  ...line(12, 18, 22, 1, WOOD),
  ...cells(
    [
      [11, 19],
      [11, 20],
      [22, 0],
    ],
    GOLD,
  ),
  ...local([".s.", ".s.", "sss", "sss", ".s."], 22, -5, { s: SILVER }),
];

/** The hand closed over the spear (drawn after it). */
const grip = (color: string) => cells([[16, 11]], color);

/** A barred owl flying, wings raised, a pale face with dark eyes. */
function flyingOwl(x: number, y: number): Part[] {
  return local(
    [
      "d.........d",
      "ld.......dl",
      "dld.....dld",
      ".ldlbbbldl.",
      ".dlbfffbld.",
      "..dfefefd..",
      "..dbfofbd..",
      "...bbbbb...",
      "....blb....",
      "....y.y....",
    ],
    x,
    y,
    {
      d: "#5b5068",
      l: "#ece8f2",
      f: "#ece8f2",
      b: "#8a7f8f",
      e: "#2a2230",
      o: "#ff8c42",
      y: YELLOW,
    },
  );
}

/** A sash streaming back from the neck in one long wave, its fold underneath (drawn first). */
const SASH_STREAM = Array.from({ length: 12 }, (_, x) => {
  const cy = 4 + Math.round(2 * Math.sin(x * 0.45));
  const top = x < 2 ? [] : [{ x, y: cy - 1, color: SASH }];
  return [...top, { x, y: cy, color: SASH }, { x, y: cy + 1, color: SASH_FOLD }];
}).flat();

/** Clouds round the feet (drawn first). */
const SKY_CLOUDS = local(
  [
    "..ccc.......ccc.......cc..",
    ".ccccc..cc.ccccc....ccccc.",
    "cccccccccccccccccccccccccc",
    "kkkkkkkkkkkkkkkkkkkkkkkkkk",
  ],
  0,
  18,
  { c: SKY_CLOUD, k: SKY_CLOUD_SHADE },
);

/* ---------------------------------------------------------------- the picks */

/**
 * One chosen variant per god, simpler than the rest and all drawn in the same frame, so the
 * dinosaur is the same size and in the same cells in each and the exports line up.
 */
const PICK_FRAME = { x0: 0, y0: -6, x1: 26, y1: 21 };

/** Ares's helmet fitted to the head (the eye stays carved), a cheek guard and a short crest. */
const ARES_HELM = [
  ...fitted([0, 1, 2], BRONZE),
  ...cells(
    [
      [10, 3],
      [11, 3],
      [10, 4],
    ],
    BRONZE,
  ),
  ...local(["..pppp..", ".pppppp.", "pppppppp"], 11, -3, { p: "#9e1b24" }),
];

/** A shorter spear, its head inside the frame. */
const SHORT_SPEAR = [
  ...line(20, -3, 20, 21, WOOD),
  ...local([".s.", "sss", "sss", ".s."], 19, -6, { s: SILVER }),
];

/** The polos, the tall crown Hera wears in Greek art, banded with peacock-blue gems. */
const POLOS = local(["gggggggg", ".gegege.", ".gggggg.", ".gggggg."], 11, -4, {
  g: GOLD,
  e: PEACOCK_EYE,
});

/** A gold sceptre topped with a peacock eye. */
const PEACOCK_SCEPTRE = [...line(20, -3, 20, 16, GOLD), ...peacockEye(20, -5)];

/** The bident with its prongs inside the frame. */
const SHORT_BIDENT = [
  ...line(20, -3, 20, 21, STEEL),
  ...line(19, -3, 21, -3, STEEL),
  ...line(19, -6, 19, -4, STEEL),
  ...line(21, -6, 21, -4, STEEL),
];

/** A halo: a flat ring floating over the head. */
function halo(color: string): Part[] {
  return local([".hhhhhh.", "h......h", ".hhhhhh."], 11, -5, { h: color });
}

/** The trident with its prongs inside the frame. */
function shortTrident(metal: string): Part[] {
  return [
    ...line(20, -2, 20, 21, metal),
    ...line(18, -2, 22, -2, metal),
    ...line(18, -5, 18, -3, metal),
    ...line(20, -6, 20, -3, metal),
    ...line(22, -5, 22, -3, metal),
  ];
}

/** A big lyre against the arm: horns, the yoke, two strings and the sound box. */
function bigLyre(frame: string): Part[] {
  return local(
    [
      "g.....g",
      "g.....g",
      "ggggggg",
      "g.s.s.g",
      "g.s.s.g",
      "g.s.s.g",
      ".gs.sg.",
      ".ggggg.",
      "..ggg..",
    ],
    16,
    9,
    { g: frame, s: WHITE },
  );
}

/** Hermes's helmet fitted to the head, with a large wing sweeping back from it. */
function hermesHelm(metal: string): Part[] {
  return [
    ...fitted([0, 1], metal),
    // Three feathers layered up and back, their tips stepping out on the trailing edge.
    ...local(
      [
        ".....ww...",
        "...wwww...",
        "wwwwwww...",
        "..wwwwww..",
        "wwwwwwwww.",
        "...wwwwwww",
        ".wwwwwww..",
      ],
      3,
      -6,
      { w: WHITE },
    ),
  ];
}

/** Antlers as two forked beams spreading up and out from the head. */
const FORKED_ANTLERS = local(
  ["a.a....a.a", "a.a....a.a", ".aa....aa.", "..aa..aa..", "...a..a...", "...a..a..."],
  10,
  -6,
  { a: ANTLER },
);

type Pick = { name: string; note: string; parts: Part[][] };

const PICKS: Record<string, Pick | undefined> = {
  Ares: {
    name: "Ares",
    note: "Crimson, a bronze helmet fitted to the head and a spear",
    parts: [dino("#e5383b", "raised"), ARES_HELM, SHORT_SPEAR],
  },
  Hera: {
    name: "Hera",
    note: "Royal purple, the tall polos crown and a peacock sceptre",
    parts: [dino("#8e5bd8", "raised"), POLOS, PEACOCK_SCEPTRE],
  },
  Artemis: {
    name: "Artemis",
    note: "Forest green, antlers and a drawn bow",
    parts: [dino("#2f7d5b", "raised"), FORKED_ANTLERS, BOW],
  },
  Hades: {
    name: "Hades",
    note: "Ash grey, green ghost fire and a bident",
    parts: [dino("#75757f", "raised"), flames(GHOST_FLAME, GHOST_CORE), SHORT_BIDENT],
  },
  Zeus: {
    name: "Zeus",
    note: "Lightning yellow, a halo and a thunderbolt",
    parts: [dino("#ffd60a", "raised"), halo(WHITE), bolt("#6fd3ff")],
  },
  Poseidon: {
    name: "Poseidon",
    note: "Aqua, a gold sea crown and a gold trident",
    parts: [dino("#17bebb", "raised"), seaCrown(GOLD), shortTrident(GOLD)],
  },
  Apollo: {
    name: "Apollo",
    note: "Orange and a big gold lyre",
    parts: [dino("#ff8c1a"), bigLyre("#ffd23f")],
  },
  Hermes: {
    name: "Hermes",
    note: "Sky blue, a gold helmet with a big white wing, and winged sandals",
    parts: [dino("#4da3ff"), hermesHelm(GOLD), WINGED_SANDALS],
  },
};

/* ---------------------------------------------------------------- the second picks */

/**
 * A second pick per god, after Ashton's notes on the first: other ways of holding things, so
 * not every dinosaur raises the same long arm (a sword or trident held forward, a staff across
 * the body, a bolt hurled down), and the headgear and colours reworked. Same frame as the first.
 */

/** A hand one cell further forward than the resting arm, for a grip at column 17. */
const reach = (color: string) => cells([[16, 11]], color);

/** A sword held forward at the resting hand: grip, a three-cell guard, the blade level. */
const SWORD_FORWARD = [
  ...cells([[16, 10]], LEATHER),
  ...line(17, 9, 17, 11, GOLD),
  ...line(18, 10, 26, 10, SILVER),
];

/** Three peacock feathers fanned out from the resting hand. */
const PEACOCK_HAND_FAN = (
  [
    [22, 4],
    [24, 9],
    [21, 14],
  ] as const
).flatMap(([x, y]) => [...line(16, 11, x, y, PEACOCK), ...peacockEye(x, y)]);

/** A bow held low at the resting hand, the string forward. */
const BOW_LOWERED = [
  ...line(19, 7, 19, 20, WHITE),
  ...cells(
    [
      [18, 8],
      [17, 9],
      [17, 18],
      [18, 19],
    ],
    WOOD,
  ),
  ...line(16, 10, 16, 17, WOOD),
];

/** The bident held across the body: the shaft rising forward past the jaw, two prongs. */
const BIDENT_ACROSS = [
  ...line(15, 15, 23, -1, STEEL),
  ...line(22, -2, 24, -1, STEEL),
  ...line(22, -2, 23, -6, STEEL),
  ...line(24, -1, 26, -5, STEEL),
];

/** A thunderbolt held upright in front of the chest, gripped at its lower bend. */
function boltUpright(color: string): Part[] {
  return bolt(color).map((p) => ({ ...p, x: p.x - 3, y: p.y + 10 }));
}

/** Poseidon's trident held forward, level, at the resting hand. */
function tridentForward(metal: string): Part[] {
  return [
    ...line(12, 11, 22, 11, metal),
    ...line(23, 9, 23, 13, metal),
    ...line(24, 9, 25, 9, metal),
    ...line(24, 11, 26, 11, metal),
    ...line(24, 13, 25, 13, metal),
  ];
}

/** A radiant sun crown: a gold band and rays fanning up from it. */
function sunCrown(band: string, rays: string): Part[] {
  const out: Part[] = [];
  [165, 140, 115, 90, 65, 40, 15].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const length = i % 2 === 0 ? 4 : 6;
    for (let r = 2; r <= length; r += 1) {
      out.push({
        x: Math.round(15 + Math.cos(a) * r),
        y: Math.round(-1 - Math.sin(a) * r),
        color: rays,
      });
    }
  });
  return [...out, ...line(11, -1, 18, -1, band)];
}

/** Hermes's helmet: fitted over the head's top rows with a dome, a white wing on its side. */
function hermesWingedHelm(metal: string): Part[] {
  return [
    ...fitted([0, 1, 2], metal),
    ...line(12, -1, 17, -1, metal),
    ...local(["w......", "www....", ".wwwww.", "wwwwwww", "..wwww."], 7, -3, { w: WHITE }),
  ];
}

/** Small gold wings at both ankles. */
const GOLD_SANDALS = WINGED_SANDALS.map((p) => ({ ...p, color: GOLD }));

/** Athena's owl, perched on the back behind the head: ear tufts, yellow eyes, a beak. */
const OWL = local(["b...b", "bbbbb", "bybyb", "bbobb", "bwwwb", ".bbb."], 5, 3, {
  b: "#8b5a2b",
  y: YELLOW,
  o: "#ff8c42",
  w: "#f0e0c0",
});

/** A round bronze shield on the arm with a dark boss in the middle. */
const ATHENA_SHIELD = local(
  ["..bbb..", ".bdddb.", "bdbbbdb", "bdbcbdb", "bdbbbdb", ".bdddb.", "..bbb.."],
  14,
  9,
  { b: BRONZE, d: "#8a5a22", c: "#8a5a22" },
);

const PICKS_2: Record<string, Pick | undefined> = {
  Ares: {
    name: "Ares 2",
    note: "Crimson, the fitted helmet and a sword held forward",
    parts: [dino("#e5383b"), ARES_HELM, SWORD_FORWARD],
  },
  Hera: {
    name: "Hera 2",
    note: "Royal purple, the polos crown and a fan of three peacock feathers",
    parts: [dino("#8e5bd8"), POLOS, PEACOCK_HAND_FAN],
  },
  Artemis: {
    name: "Artemis 2",
    note: "Forest green, forked antlers and the bow held low",
    parts: [dino("#2f7d5b"), FORKED_ANTLERS, BOW_LOWERED],
  },
  Hades: {
    name: "Hades 2",
    note: "Charcoal, green ghost fire and the bident held across the body",
    parts: [dino("#55555f"), reach("#55555f"), flames(GHOST_FLAME, GHOST_CORE), BIDENT_ACROSS],
  },
  Zeus: {
    name: "Zeus 2",
    note: "Lightning yellow, a pale-yellow halo and a bolt held upright in front",
    parts: [dino("#ffd60a"), reach("#ffd60a"), halo("#fff3a0"), boltUpright("#fff3a0")],
  },
  Poseidon: {
    name: "Poseidon 2",
    note: "Royal blue, a gold sea crown and the trident held forward",
    parts: [tridentForward(GOLD), dino("#1e6bff"), seaCrown(GOLD)],
  },
  Apollo: {
    name: "Apollo 2",
    note: "Orange, a radiant sun crown and the big lyre",
    parts: [dino("#ff8c1a"), sunCrown(GOLD, YELLOW), bigLyre("#ffd23f")],
  },
  Hermes: {
    name: "Hermes 2",
    note: "Teal, a gold helmet with a white wing on its side and gold-winged sandals",
    parts: [dino("#14c4b0"), hermesWingedHelm(GOLD), GOLD_SANDALS],
  },
  Athena: {
    name: "Athena",
    note: "Silver, her owl perched on the back and a bronze shield",
    parts: [dino("#aeb8c4"), OWL, ATHENA_SHIELD],
  },
};

/* ---------------------------------------------------------------- the variants */

type God = {
  group: string;
  /** `framed` composes in the picks' frame instead of cropping to the drawing. */
  variants: { id: string; name: string; note: string; parts: Part[][]; framed?: boolean }[];
};

const GODS: God[] = [
  {
    group: "Ares",
    variants: [
      {
        id: "ares-spear",
        name: "Ares, spear",
        note: "Crimson, a red-crested bronze helm and a spear",
        parts: [dino("#e5383b", "raised"), helmet(BRONZE, RED), SPEAR],
      },
      {
        id: "ares-hoplite",
        name: "Ares, hoplite",
        note: "Blood red, crested helm and a round shield",
        parts: [dino("#9e1b24"), helmet(BRONZE, WHITE), shield(BRONZE, WHITE)],
      },
      {
        id: "ares-sword",
        name: "Ares, sword",
        note: "Rust, a plain silver helm and a raised sword",
        parts: [dino("#c8553d", "raised"), helmet(SILVER), SWORD],
      },
    ],
  },
  {
    group: "Aphrodite",
    // Redone from scratch: a flower crown on each, the mirror and the rose held four ways.
    variants: [
      {
        id: "aphrodite-mirror",
        name: "Aphrodite, mirror",
        note: "Rose pink, a flower crown and a hand mirror raised to the face",
        parts: [dino("#ff6fae", "raised"), flowerCrown(WHITE, LILAC, WHITE), MIRROR_RAISED],
        framed: true,
      },
      {
        id: "aphrodite-rose-jaws",
        name: "Aphrodite, rose in the jaws",
        note: "Magenta, a flower crown and a rose held in the jaws",
        parts: [dino("#e6268c"), flowerCrown(WHITE, LILAC, WHITE), ROSE_IN_JAWS],
        framed: true,
      },
      {
        id: "aphrodite-rose-offered",
        name: "Aphrodite, rose offered",
        note: "Blush, a crown of red and white flowers and a long-stemmed rose held out",
        parts: [dino("#ffb3d1"), flowerCrown(RED, WHITE, RED), ROSE_OFFERED],
        framed: true,
      },
      {
        id: "aphrodite-mirror-rose",
        name: "Aphrodite, mirror and rose",
        note: "Coral pink, a flower crown, a rose in the jaws and the mirror held out",
        parts: [dino("#ff7f9f"), flowerCrown(WHITE, RED, WHITE), ROSE_IN_JAWS, MIRROR_LEVEL],
        framed: true,
      },
    ],
  },
  {
    group: "Hera",
    variants: [
      {
        id: "hera-feather",
        name: "Hera, feather",
        note: "Royal purple, gold diadem and a peacock feather",
        parts: [dino("#8e5bd8", "raised"), diadem(GOLD, "#00e0ff"), PEACOCK_FEATHER],
      },
      {
        id: "hera-peacock",
        name: "Hera, peacock",
        note: "Plum, a peacock's fan behind and a diadem",
        parts: [PEACOCK_FAN, dino("#b547c9"), diadem(GOLD, RED)],
      },
      {
        id: "hera-pomegranate",
        name: "Hera, pomegranate",
        note: "Lavender, gold diadem and a pomegranate",
        parts: [dino("#c3a6f5"), diadem(GOLD, PEACOCK_EYE), POMEGRANATE_FRUIT],
      },
    ],
  },
  {
    group: "Artemis",
    variants: [
      {
        id: "artemis-bow",
        name: "Artemis, bow",
        note: "Fawn, a drawn bow and a crescent moon tiara",
        parts: [dino("#c9a27a", "raised"), crescentTiara(WHITE), BOW],
      },
      {
        id: "artemis-quiver",
        name: "Artemis, quiver",
        note: "Forest green, a quiver of arrows and the crescent",
        parts: [QUIVER, dino("#2f7d5b"), crescentTiara(SILVER)],
      },
      {
        id: "artemis-stag",
        name: "Artemis, stag",
        note: "Moonstone, antlers and the moon behind",
        parts: [moon(WHITE), dino("#a9c7e8"), ANTLERS],
      },
    ],
  },
  {
    group: "Hades",
    variants: [
      {
        id: "hades-bident",
        name: "Hades, bident",
        note: "Slate, blue fire for hair and a bident",
        parts: [dino("#5d6b8a", "raised"), flames(FLAME, FLAME_CORE), BIDENT],
      },
      {
        id: "hades-skull",
        name: "Hades, skull",
        note: "Ash grey, green ghost fire and a skull",
        parts: [dino("#75757f"), flames(GHOST_FLAME, GHOST_CORE), SKULL],
      },
      {
        id: "hades-pomegranate",
        name: "Hades, pomegranate",
        note: "Smoke violet, a spiked crown and Persephone's pomegranate",
        parts: [dino("#5e4b8b"), spikedCrown(STEEL), POMEGRANATE_FRUIT],
      },
    ],
  },
  {
    group: "Zeus",
    variants: [
      {
        id: "zeus-bolt",
        name: "Zeus, thunderbolt",
        note: "Storm blue, a gold crown and a thunderbolt",
        parts: [dino("#8d99ae", "raised"), crown(GOLD, RED), bolt(YELLOW)],
      },
      {
        id: "zeus-storm",
        name: "Zeus, storm",
        note: "Lightning yellow, a white beard under a storm cloud",
        parts: [dino("#ffd60a", "none"), STORM, beard(WHITE)],
      },
      {
        id: "zeus-marble",
        name: "Zeus, marble",
        note: "Marble white, a gold laurel and a thunderbolt",
        parts: [dino("#eceff3", "raised"), laurel(GOLD), bolt(YELLOW)],
      },
    ],
  },
  {
    group: "Poseidon",
    variants: [
      {
        id: "poseidon-trident",
        name: "Poseidon, trident",
        note: "Ocean blue, a sea crown and a gold trident",
        parts: [dino("#1f78d1", "raised"), seaCrown(GOLD), trident(GOLD)],
      },
      {
        id: "poseidon-tide",
        name: "Poseidon, tide",
        note: "Aqua, a silver trident and waves at the feet",
        parts: [WAVES, dino("#17bebb", "raised"), trident(SILVER)],
      },
      {
        id: "poseidon-elder",
        name: "Poseidon, elder",
        note: "Seafoam, a long white beard and a silver sea crown",
        parts: [dino("#7fe0d2", "none"), seaCrown(SILVER), beard(WHITE)],
      },
    ],
  },
  {
    group: "Apollo",
    variants: [
      {
        id: "apollo-lyre",
        name: "Apollo, lyre",
        note: "Orange, a laurel wreath and a gold lyre",
        parts: [dino("#ff8c1a"), laurel(LEAF), lyre("#ffd23f")],
      },
      {
        id: "apollo-sun",
        name: "Apollo, sun",
        note: "Amber, sun rays round the head and a laurel",
        parts: [sunRays(YELLOW), dino("#ffb020"), laurel(LEAF)],
      },
      {
        id: "apollo-sunbearer",
        name: "Apollo, sunbearer",
        note: "Apricot, the sun held up and a laurel",
        parts: [dino("#ffa36c", "raised"), laurel(LEAF), sunHeld(YELLOW)],
      },
    ],
  },
  {
    group: "Hermes",
    variants: [
      {
        id: "hermes-helm",
        name: "Hermes, winged helm",
        note: "HTF green, a winged petasos and winged sandals",
        parts: [dino("#03c652"), wingedHelm(GOLD), WINGED_SANDALS],
      },
      {
        id: "hermes-caduceus",
        name: "Hermes, caduceus",
        note: "Mint, the caduceus and winged sandals",
        parts: [
          dino("#00eb88", "raised"),
          cells([[20, 8]], "#00eb88"),
          caduceus(GOLD, SILVER),
          WINGED_SANDALS,
        ],
      },
      {
        id: "hermes-messenger",
        name: "Hermes, messenger",
        note: "Lime, a winged petasos and a sealed letter",
        parts: [dino("#9be564"), wingedHelm(SILVER), LETTER],
      },
    ],
  },
  {
    group: "Athena",
    // After a painting of her in flight: plumed gold helmet, spear, lavender sash, barred owl.
    variants: [
      {
        id: "athena-spear",
        name: "Athena, spear",
        note: "Ivory, a plumed gold helmet and a spear held across the body",
        parts: [dino("#efe6d2"), PLUMED_HELM, SPEAR_ACROSS, grip("#efe6d2")],
        framed: true,
      },
      {
        id: "athena-owl",
        name: "Athena, owl",
        note: "Lavender, the plumed helmet and a barred owl flying beside her",
        parts: [dino("#b8b4e0"), PLUMED_HELM, flyingOwl(15, 11)],
        framed: true,
      },
      {
        id: "athena-sash",
        name: "Athena, sash",
        note: "Silver, the plumed helmet, the spear and a lavender sash streaming back",
        parts: [SASH_STREAM, dino("#aeb8c4"), PLUMED_HELM, SPEAR_ACROSS, grip("#aeb8c4")],
        framed: true,
      },
      {
        id: "athena-sky",
        name: "Athena, sky",
        note: "Ivory, the plumed helmet, the spear and the owl, above the clouds",
        parts: [
          SKY_CLOUDS,
          dino("#efe6d2"),
          PLUMED_HELM,
          flyingOwl(16, 10),
          SPEAR_ACROSS,
          grip("#efe6d2"),
        ],
        framed: true,
      },
    ],
  },
];

/** Each god's picks first (the newest leading), then the earlier variants. */
export const GOD_VARIANTS: readonly Variant[] = GODS.flatMap((god) => {
  const slug = god.group.toLowerCase();
  const picks = [
    { id: `${slug}-pick-2`, label: "Pick 2", pick: PICKS_2[god.group] },
    { id: `${slug}-pick`, label: "Pick", pick: PICKS[god.group] },
  ].flatMap(({ id, label, pick }) =>
    pick
      ? [
          {
            id,
            group: god.group,
            note: `${label}: ${pick.note}`,
            sprite: composeIn(pick.name, PICK_FRAME, ...pick.parts),
          },
        ]
      : [],
  );
  return [
    ...picks,
    ...god.variants.map((v) => ({
      id: v.id,
      group: god.group,
      note: v.note,
      sprite: v.framed ? composeIn(v.name, PICK_FRAME, ...v.parts) : compose(v.name, ...v.parts),
    })),
  ];
});
