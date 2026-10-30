import { dinoCells } from "@/components/brand/dino-pixels";
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
 * The Greek gods in the dinosaur editor (no Hera since 2026-10-29): three variants of each, more
 * for some (Aphrodite four, redone, and no picks, then two on Ashton's saved one; Athena five and one pick; Ares five, Hermes fifteen; Zeus and Artemis five,
 * two from Ashton's saves), every one the footer T-rex in its own colour (one hue family per god) with one or two props that say who it is. Coordinates
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
const GLASS = "#bfe9ff";
const LILAC = "#c9a3ff";
const PLUME_LINE = "#c9c6d6";
const SASH = "#a9a6e0";
const SASH_FOLD = "#7f7cc0";
const SKY_CLOUD = "#e4e1f2";
const SKY_CLOUD_SHADE = "#b9b5d6";
const ROBE_FOLD = "#c9ced6";
const GREY = "#8a939c";
/** Gold dark enough to read on a yellow dinosaur. */
const DEEP_GOLD = "#c98f1a";

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

/**
 * Ashton's saved "Ares final": the arm reaching forward and up to a long spear in column 20,
 * its steel head shaded on the far side.
 */
const ARM_TO_SPEAR = (color: string) =>
  cells(
    [
      [14, 10],
      [15, 10],
      [16, 10],
      [17, 10],
      [18, 9],
      [19, 9],
    ],
    color,
  );
const LONG_SPEAR = [
  ...line(20, -7, 20, 21, WOOD),
  ...local([".a.", "aad", "aad", ".d."], 19, -11, { a: SILVER, d: "#9aa4b0" }),
];

/**
 * Ashton's saved "Ares final" with the helmet in metal: a low bowl over the head's top row, a
 * darker brim at front and back and a two-cell stand on top, and the crest kept to two flat
 * tones, a red arc over a dark underside whose tail drops behind the head.
 */
function aresFinalHelm(metal: string, brim: string, crest: string, under: string) {
  return [
    ...local(["......ss...", "...ssssss..", "..sssssssdd", ".dd........"], 8, -2, {
      s: metal,
      d: brim,
    }),
    ...local(
      [
        ".....cccc....",
        "...cccccccc..",
        "..cccccccccc.",
        ".uuuuuuuuuuu.",
        "uu...........",
        "u............",
      ],
      7,
      -6,
      { c: crest, u: under },
    ),
  ];
}

/** The helmet, wings and gold-winged sandals of Ashton's saved "Hermes final". */
const HERMES_FINAL = [
  ...local(
    [
      "w............",
      "www..........",
      ".wwwww.......",
      "cwwwwwaaoob..",
      "..cccwooooob.",
      "...oooooooobb",
      "..bb.........",
    ],
    7,
    -4,
    { w: WHITE, c: PLUME_LINE, a: "#fbe7a1", o: GOLD, b: "#c9962a" },
  ),
  ...local(["oo...oo", ".ob...ob"], 2, 19, { o: GOLD, b: "#c9962a" }),
];

/**
 * A grand caduceus held high in column 21: a gold orb on top, wings spread wide, and two green
 * snakes crossing the staff in a double helix that widens into loops, all above the helmet.
 */
const GRAND_CADUCEUS = [
  ...local(
    [
      "....a....",
      "...aoo...",
      "w..ooo..w",
      "ww..o..ww",
      "wwwwowwww",
      ".wwwowww.",
      "..wwoww..",
      ".gg.o.ee.",
      "...gox...",
      "....g....",
      "...eog...",
      "..e.o.g..",
      "..e.o.g..",
      "...eog...",
      "....e....",
      "...gox...",
    ],
    17,
    -15,
    { a: "#fbe7a1", o: GOLD, w: WHITE, g: "#3ddc84", e: "#1b8a4c", x: "#1b8a4c" },
  ),
  ...line(21, 1, 21, 16, GOLD),
];

/**
 * The herald's staff, the older kerykeion: a wooden staff planted in column 21 under an open
 * gold figure eight, its horns curling up, with two ribbons tied below it.
 */
const HERALD_STAFF = [
  ...local(
    ["o...b", "o...b", ".o.b.", "..o..", ".o.b.", "o...b", "o...b", ".o.b.", "..o.."],
    19,
    -14,
    { o: GOLD, b: "#c9962a" },
  ),
  ...local(["..oww", "..o.wc", "..o..c"], 19, -5, { o: GOLD, w: WHITE, c: PLUME_LINE }),
  ...line(21, -2, 21, 19, WOOD),
  ...line(21, 20, 21, 21, GOLD),
];

/**
 * The two staffs cut down to hand size, held up past the raised grip: a short caduceus in column
 * 22 (gold knob, small wings, the snakes crossing three times) and a short herald's staff
 * (a small open figure eight on wood, one ribbon).
 */
const SMALL_CADUCEUS = [
  ...local(["..a..", "wwoww", ".wow.", ".goe.", "..g..", ".eog.", "..e..", ".goe."], 20, -2, {
    a: "#fbe7a1",
    o: GOLD,
    w: WHITE,
    g: "#3ddc84",
    e: "#1b8a4c",
  }),
  ...line(22, 6, 22, 12, GOLD),
];
const SMALL_HERALD_STAFF = [
  ...local(["o.b", "o.b", ".o.", "o.b", ".o."], 20, -7, { o: GOLD, b: "#c9962a" }),
  ...local(["ww", ".c"], 22, -2, { w: WHITE, c: PLUME_LINE }),
  ...line(21, -2, 21, 11, WOOD),
  ...cells([[21, 12]], GOLD),
];

/**
 * The small staffs pointed like Zeus's saved bolt: gripped in the hand held straight forward at
 * (16, 10) and laid on the 45° diagonal up and away past the snout. Like the bolt, the shaft is
 * two cells on each row (the lit side, then the shaded one) so it reads as one solid stroke. The heads are the hand-sized ones turned with it: the
 * caduceus's orb, its wings spread square to the shaft and the snakes crossing it twice; the
 * herald's staff's ring with two horns curling back toward the line of the shaft.
 */
function diagonalShaft(fromY: number, lit: string, shade: string): Part[] {
  return Array.from({ length: 12 - fromY }, (_, i) => fromY + i).flatMap((y) => [
    ...cells([[26 - y, y]], lit),
    ...cells([[27 - y, y]], shade),
  ]);
}
const DIAGONAL_CADUCEUS = [
  ...diagonalShaft(2, GOLD, "#c9962a"),
  ...local(["ao", "oo"], 25, 0, { a: "#fbe7a1", o: GOLD }),
  ...cells(
    [
      [20, 0],
      [21, 0],
      [21, 1],
      [22, 1],
      [22, 2],
      [23, 2],
      [25, 3],
      [25, 4],
      [26, 4],
      [26, 5],
      [27, 5],
      [27, 6],
    ],
    WHITE,
  ),
  ...cells(
    [
      [21, 4],
      [21, 5],
      [22, 5],
      [22, 6],
      [18, 8],
    ],
    "#3ddc84",
  ),
  ...cells(
    [
      [24, 4],
      [19, 6],
      [19, 7],
      [20, 7],
      [20, 8],
    ],
    "#1b8a4c",
  ),
];
const DIAGONAL_HERALD_STAFF = [
  ...diagonalShaft(4, WOOD, "#8a5a2b"),
  ...local(["ooo", "o.o", "ooo"], 23, 1, { o: GOLD }),
  ...cells(
    [
      [25, 0],
      [25, -1],
      [26, -2],
    ],
    GOLD,
  ),
  ...cells(
    [
      [26, 1],
      [27, 1],
      [28, 0],
    ],
    "#c9962a",
  ),
  ...local(["ww", ".c"], 23, 5, { w: WHITE, c: PLUME_LINE }),
];

/**
 * Ashton's saved "Hermes2 final": the arm straight forward to (17, 10), and a one-cell caduceus
 * on the diagonal through the hand, its orb up past the snout and its wings square to the staff.
 * The saved snakes are redrawn two ways (`HERMES2_SNAKES_*`).
 */
const HERMES2_ARM = (color: string) => line(14, 10, 17, 10, color);
const HERMES2_CADUCEUS = [
  ...line(14, 14, 24, 4, GOLD),
  ...local(["ao", "oo"], 25, 2, { a: "#fbe7a1", o: GOLD }),
  ...cells(
    [
      [21, 3],
      [22, 3],
      [22, 4],
      [23, 4],
      [24, 5],
      [25, 5],
      [25, 6],
      [26, 6],
    ],
    WHITE,
  ),
];
const SNAKE_LIGHT = "#3ddc84";
const SNAKE_DARK = "#1b8a4c";
/**
 * The snakes kept close to the staff: each coil is a short stroke across it, one cell out on
 * each side and one on the staff, with the gold left showing between coils. Across a 45° staff a
 * stroke is upright or level, and those are the two slants a coil shows in front, so crossed
 * gives the light snake upright strokes and the dark one level ones (two snakes crossing), and
 * spiral gives both upright ones (one coil winding down). The top stroke rises under the wing.
 */
const HERMES2_SNAKES_CROSSED = [
  ...cells(
    [
      [22, 5],
      [22, 6],
      [22, 7],
      [18, 9],
      [18, 10],
      [18, 11],
    ],
    SNAKE_LIGHT,
  ),
  ...line(19, 8, 21, 8, SNAKE_DARK),
];
const HERMES2_SNAKES_SPIRAL = [
  ...cells(
    [
      [22, 5],
      [22, 6],
      [22, 7],
      [18, 9],
      [18, 10],
    ],
    SNAKE_LIGHT,
  ),
  ...cells(
    [
      [23, 6],
      [20, 7],
      [20, 8],
      [20, 9],
    ],
    SNAKE_DARK,
  ),
];

/** The resting arm stretched forward along row 10 to a staff in column 21. */
const ARM_TO_STAFF = (color: string) => line(14, 10, 20, 10, color);

/** An open scroll held against the arm: two rolls with gold knobs, lines of ink, a red seal. */
const SCROLL = [
  ...local(
    ["k.......k", "rpppppppr", "rpiiiiipr", "rpppppppr", "rpiiiippr", "rpppppppr", "k.......k"],
    16,
    8,
    { k: GOLD, r: "#d9c08a", p: "#f3e2b3", i: LEATHER },
  ),
  ...cells(
    [
      [20, 14],
      [20, 15],
    ],
    RED,
  ),
];

/**
 * A proclamation: a scroll hanging open from its top roller, which the resting hand holds, past
 * lines of ink to the bottom roller, a red wax seal tied under it.
 */
const SCROLL_HANGING = [
  ...local(
    [
      "kRRRRRk",
      ".ppppp.",
      ".piiip.",
      ".ppppp.",
      ".piiip.",
      ".ppppp.",
      ".piipp.",
      ".ppppp.",
      ".piiip.",
      "kRRRRRk",
    ],
    16,
    10,
    { k: GOLD, R: "#d9c08a", p: "#f3e2b3", i: LEATHER },
  ),
  ...cells([[19, 20]], RED),
];

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

/**
 * The messenger's phone held against the arm: a graphite case, a cyan screen with a new-mail
 * envelope, a red badge on the corner and a white wing on its back edge.
 */
const WINGED_PHONE = [
  ...local(
    [
      "kkkkkkk",
      "kccccck",
      "kwwwwwk",
      "kwgwgwk",
      "kwwgwwk",
      "kwwwwwk",
      "kccccck",
      "kccccck",
      "kkkokkk",
      "kkkkkkk",
    ],
    16,
    8,
    { k: "#3a3f47", c: "#00e0ff", w: WHITE, g: "#03c652", o: GREY },
  ),
  ...local(["rr", "rr"], 22, 7, { r: RED }),
  ...local(["...w", "..ww", "wwww", "www.", "ww.."], 23, 9, { w: WHITE }),
];

/** The harpe, the hooked sword Hermes lent Perseus: raised in column 21, the hook curling forward. */
function harpe(blade: string): Part[] {
  return [
    ...line(21, 5, 21, -8, blade),
    ...local(
      ["..sss..", ".sssss.", "ss...ss", "s....ss", "s....ss", "s...ss.", "s..ss..", "s.s...."],
      21,
      -10,
      { s: blade },
    ),
    ...line(20, 6, 22, 6, GOLD),
    ...line(21, 7, 21, 9, LEATHER),
    ...cells([[21, 10]], GOLD),
  ];
}

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

/**
 * Ashton's saved "Aphrodite final": the arm reaching forward and down to (16, 11), a crown of two
 * daisies and a lilac flower on grey stems over the head's top row, and a long-stemmed red rose
 * held up past the snout.
 */
const APHRODITE_FINAL_ARM = (color: string) =>
  cells(
    [
      [14, 10],
      [15, 10],
      [16, 10],
      [16, 11],
    ],
    color,
  );
const APHRODITE_FINAL_CROWN = local([".b..c..b.", "bdbcdcbdb", ".h..i..h."], 11, -2, {
  b: WHITE,
  d: "#ffe135",
  c: LILAC,
  h: "#cfcfe0",
  i: "#9b74d4",
});
const ROSE_STEM = "#34b24f";
const finalBloom = (x: number, y: number) =>
  local([".ff.", "fggf", "fgff", ".ff."], x, y, { f: "#c40303", g: "#900404" });
const APHRODITE_FINAL_ROSE = [
  ...cells(
    [
      [19, 9],
      [18, 10],
      [19, 11],
      [17, 11],
      [16, 12],
      [15, 13],
      [15, 14],
    ],
    ROSE_STEM,
  ),
  ...finalBloom(19, 6),
];

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

/* ---------------------------------------------------------------- Artemis's leaf crown */

/** A leaf crown: big pointed leaves standing on a band round the head, a dark midrib in each. */
const LEAF_CROWN = local(
  ["...l...l...l.", "..lvl.lvl.lvl", "..lvl.lvl.lvl", ".lllllllllll.", "l............"],
  8,
  -4,
  { l: "#9be564", v: "#5aa832" },
);

/**
 * A leaf headband, worn low: a leather cord round the head above the eye, small leaves standing
 * along it, leaning forward, and two leaves trailing from the knot at the back.
 */
const LEAF_HEADBAND = local(
  [".....l..l..l.", "....l..l..l..", "..ccccccccccc", ".ll..........", "l............"],
  7,
  -1,
  { l: "#9be564", c: LEATHER },
);

/* ---------------------------------------------------------------- Ashton's saves */

/*
 * Starting points saved in the editor (2026-10-29): Artemis is the pick in a brighter green
 * (#009e3f); Zeus and Athena were redrawn by hand, both with the arm held straight forward,
 * Zeus with a longer bolt at that hand and Athena with the helmet, plume and sash moved.
 */

/** The arm held straight forward from the shoulder, the hand at (16, 10). */
const armForward = (color: string) =>
  cells(
    [
      [14, 10],
      [15, 10],
      [16, 10],
    ],
    color,
  );

/** Zeus's bolt as saved: held at the forward hand, the top zag over the snout. */
const SAVED_BOLT = local(
  [
    ".....#",
    "....##",
    "...##.",
    "..##..",
    ".##...",
    ".#####",
    "...##.",
    "..##..",
    ".##...",
    "##....",
    "#.....",
  ],
  16,
  6,
  { "#": "#6fd3ff" },
);

/** Athena's plumed helmet and lavender sash as saved, the helmet sitting over the top two rows. */
const SAVED_ATHENA_HELM = local(
  [
    "............wwwww...",
    ".........wwwwwwwww..",
    ".......wwwwwwwwwww..",
    "......wwwppppp......",
    "......wp.....gggg...",
    "......w....gggggg...",
    "..........ggggggggg.",
    "........ssgggggggggg",
    ".......ssfg.........",
    "s.....ssf...........",
    "fssssssf............",
    ".fssssf.............",
    "..ffff..............",
  ],
  0,
  -6,
  { w: WHITE, p: PLUME_LINE, g: GOLD, s: SASH, f: SASH_FOLD },
);

/** A band over the head above the eye with a gem set in the middle, the band rising round it. */
function gemHeadband(metal: string, gem: string): Part[] {
  return local(["...gggg...", "ggggjjgggg"], 10, 0, { g: metal, j: gem });
}

/* ---------------------------------------------------------------- Ashton's finals */

/*
 * Ashton's saved "Ares final" (the newer one, with the dark helmet), "Zeus final" and "Poseidon
 * final", pasted as they were exported. Each variant draws the map without its old helmet or
 * crown (`local` skips any character its inks leave out) over the T-rex, so the head under it
 * is whole, then the new one on top.
 */
const ARES_FINAL_MAP = [
  "....................c.",
  "...................cce",
  "...................cce",
  "....................e.",
  "....................o.",
  "............++++....o.",
  "..........++++++++..o.",
  ".........++++++++++.o.",
  "........bbbbbbbbbbb.o.",
  ".......bb.....aa....o.",
  ".......b...aaaaaa...o.",
  "..........aaaaaaadd.o.",
  ".........dd#########o.",
  "..........##.#######o.",
  "..........##########o.",
  "..........##########o.",
  "..........##########o.",
  "..........#####.....o.",
  "..........########..o.",
  "#........#####......o.",
  "#......#######....##o.",
  "##....############..o.",
  "###..#########......o.",
  "##############......o.",
  "##############......o.",
  ".############.......o.",
  "..###########.......o.",
  "...#########........o.",
  "....#######.........f.",
  ".....###.##.........f.",
  ".....##...#.........f.",
  ".....#....#.........f.",
  ".....##...##........f.",
];
const ZEUS_FINAL_MAP = [
  "..............................",
  "..............................",
  "..............................",
  "..............................",
  "..............................",
  "..............................",
  "...............+..............",
  "............+..+..+...........",
  "............+..+..+...........",
  "............+++++aa.......oob.",
  "...........########......oob..",
  "..........##########....oob...",
  "..........##o#######...oob....",
  "..........##########..ooooob..",
  "..........##########....oob...",
  "..........##########...oob....",
  "..........#####.......ob......",
  "..........########...ob.......",
  "#........#####......a.........",
  "#......#######....##..........",
  "##....############a...........",
  "###..#########...o............",
  "##############..o.............",
  "##############................",
  ".############.................",
  "..###########.................",
  "...#########..................",
  "....#######...................",
  ".....###.##...................",
  ".....##...#...................",
  ".....#....#...................",
  ".....##...##..................",
];
const POSEIDON_FINAL_MAP = [
  "....................o...",
  "..................o.o.a.",
  ".................oo.o.aa",
  "..................o.a.a.",
  "..................o.a.a.",
  "..................aaaaa.",
  "....................o...",
  "...........+..+..+..o...",
  "...........+..+..+..o...",
  "...........bbbbbbb..o...",
  "...........########.o...",
  "..........##########o...",
  "..........##.#######o...",
  "..........##########o...",
  "..........##########o...",
  "..........##########o...",
  "..........#####.....o...",
  "..........########..o...",
  "#........#####....##o...",
  "#......#######..##..o...",
  "##....##########....o...",
  "###..#########......o...",
  "##############......o...",
  "##############......o...",
  ".############.......o...",
  "..###########.......o...",
  "...#########........o...",
  "....#######.........o...",
  ".....###.##.........o...",
  ".....##...#.........o...",
  ".....#....#.........o...",
  ".....##...##........o...",
];

/** The Ares final without its helmet and crest: body, the arm to the spear, the spear. */
const ARES_FINAL_BASE = [
  dino("#e5383b", "none"),
  local(ARES_FINAL_MAP, 0, -11, {
    "#": "#e5383b",
    o: WOOD,
    c: "#d8dee6",
    e: "#9aa4b0",
    f: "#6d4e31",
  }),
];
/** The Zeus final without its crown: body, the glowing eye, the arm and the bolt. */
const ZEUS_FINAL_BASE = [
  dino("#f5c724", "none"),
  local(ZEUS_FINAL_MAP.slice(0, 10), 0, -10, { o: "#4cc9ff", b: "#1f8fd0" }),
  local(ZEUS_FINAL_MAP.slice(10), 0, 0, {
    "#": "#f5c724",
    o: "#4cc9ff",
    a: "#9a6a10",
    b: "#1f8fd0",
  }),
];
/** The Poseidon final without its crown: body, the arm raised to the trident, the trident. */
const POSEIDON_FINAL_BASE = [
  dino("#3388ff", "none"),
  local(POSEIDON_FINAL_MAP, 0, -10, { "#": "#3388ff", o: GOLD, a: "#c9962a" }),
];

/**
 * Ares's helmet fitted to the head: a dome over the top two rows with a lit crown, a dark lip at
 * the front, a guard down the back of the head behind the eye; the crest grows straight out of
 * the dome. Plain, swept back, or with a gold brow band.
 */
const ARES_DOME = local(
  [
    "...hhhhhh..",
    "..ssssssss.",
    ".ssssssssss",
    ".sssssssssd",
    ".ss........",
    ".ss........",
    ".dd........",
  ],
  9,
  -2,
  { s: "#3a3f47", h: "#6b737d", d: "#23272d" },
);
const ARES_CREST_INKS = { "+": "#ff3b3b", b: "#a8242a" };
const ARES_DOME_CREST = local(
  ["....++++..", "..++++++++", ".+++++++++", "bbbbbbbbb.", "b.........", "b........."],
  9,
  -5,
  ARES_CREST_INKS,
);
const ARES_SWEPT_CREST = local(
  [
    "......+++++..",
    "....+++++++++",
    "..++++++++++.",
    ".++bbbbbbbb..",
    "++b..........",
    "+b...........",
    "b............",
  ],
  6,
  -5,
  ARES_CREST_INKS,
);
const ARES_GOLD_BROW = local(["gggggggggg"], 10, 1, { g: GOLD });

/**
 * Proper crowns for Ashton's Zeus and Poseidon finals, kept low (four rows; five or six where a
 * centre point or the bolt needs it), sat just above the head: tipped points over a band of gems
 * over a dark base. Zeus's are in the darker golds of
 * his saved crown (bright gold melts into his body) with blue gems; Poseidon's in bright gold
 * with pearls and aquamarines, eight wide so the points stay clear of the trident.
 */
const crownOn = (rows: readonly string[], ox: number, inks: Record<string, string>) =>
  local(rows, ox, -rows.length, inks);
const ZEUS_CROWN_INKS = {
  o: DEEP_GOLD,
  d: "#9a6a10",
  y: "#fff3a0",
  g: "#4cc9ff",
  G: "#1f8fd0",
  b: "#4cc9ff",
};
const ZEUS_CLASSIC_CROWN = crownOn(
  ["y...y...y", "oo.ooo.oo", "ogoGoGogo", "ddddddddd"],
  10,
  ZEUS_CROWN_INKS,
);
const ZEUS_FIVE_CROWN = crownOn(
  ["y.y.y.y.y", "ooooooooo", "oogoGogoo", "ddddddddd"],
  10,
  ZEUS_CROWN_INKS,
);
const ZEUS_ARCHED_CROWN = crownOn(
  ["...oyo...", "oooo.oooo", "ogoGoGogo", "ddddddddd"],
  10,
  ZEUS_CROWN_INKS,
);
/** A lightning jewel: a blue bolt, in the blue of the one he holds, standing between two points. */
const ZEUS_BOLT_JEWEL_CROWN = crownOn(
  [".....bb..", "o...bb..o", "o..bbbb.o", "oo..bb.oo", "oo.bb..oo", "ddddddddd"],
  10,
  ZEUS_CROWN_INKS,
);
const POSEIDON_CROWN_INKS = {
  o: GOLD,
  d: "#c9962a",
  y: WHITE,
  g: "#2ee6c8",
  G: "#0fa3a3",
};
const POSEIDON_CLASSIC_CROWN = crownOn(
  ["y..yy..y", "oo.oo.oo", "ogoGGogo", "dddddddd"],
  10,
  POSEIDON_CROWN_INKS,
);
const POSEIDON_PEARL_CROWN = crownOn(
  ["y.y.y.y.", "oooooooo", "oGoyyoGo", "dddddddd"],
  10,
  POSEIDON_CROWN_INKS,
);
const POSEIDON_TALL_CROWN = crownOn(
  ["...yy...", "y..oo..y", "oooooooo", "ogoGGogo", "dddddddd"],
  10,
  POSEIDON_CROWN_INKS,
);

/**
 * For Ashton's Aphrodite final: a crown of red roses on a band of leaves, a gold tiara with one
 * big heart, and the golden apple ("to the fairest") held in the hand in place of the rose.
 */
const APHRODITE_ROSE_CROWN = local(
  ["..rr..rr..rr.", ".rRr.rRr.rRr.", "lrrllrrllrrl.", "llllllllllll."],
  9,
  -3,
  { r: RED, R: "#9e1b24", l: ROSE_STEM },
);
const APHRODITE_HEART_TIARA = [
  ...local([".rr.rr.", "rprrrrr", ".rrrrr.", "..rrr..", "...r..."], 11, -6, {
    r: RED,
    p: "#ff9ccb",
  }),
  ...local(["oooooooo"], 11, -1, { o: GOLD }),
];
const GOLDEN_APPLE = local(["..kl.", ".o.o.", "oeooo", "ooood", ".odd."], 17, 8, {
  k: "#6d4e31",
  l: ROSE_STEM,
  o: GOLD,
  e: "#fff1b0",
  d: "#c9962a",
});

/* ---------------------------------------------------------------- Zeus's robe */

/**
 * A robe draped from the front shoulder down across the body to the knees: the dinosaur's own
 * cells below a diagonal edge (the tail stays out), a hem over the thighs, trim on the edge and
 * the hem, and two drape folds. The raised arm is drawn over it again.
 */
function robe(cloth: string, trim: string): Part[] {
  const edge = (x: number) => 8 + Math.max(0, Math.round((11 - x) * 0.55));
  const body = dinoCells({ withoutArm: true })
    .filter(({ x, y }) => x >= 3 && y >= edge(x) && y <= 17)
    .map(({ x, y }) => ({ x, y, color: y === edge(x) ? trim : cloth }));
  const hem = local(["ccccccc", "ttttttt"], 4, 18, { c: cloth, t: trim });
  const folds = [...line(8, 12, 6, 18, ROBE_FOLD), ...line(12, 10, 10, 18, ROBE_FOLD)].filter(
    ({ x, y }) => [...body, ...hem].some((p) => p.x === x && p.y === y && p.color === cloth),
  );
  return [...body, ...hem, ...folds];
}

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
      {
        id: "ares-final-steel",
        name: "Ares, steel",
        note: "Ashton's Ares, the helmet in bright steel under a plain red crest",
        parts: [
          dino("#e5383b", "none"),
          ARM_TO_SPEAR("#e5383b"),
          LONG_SPEAR,
          aresFinalHelm(STEEL, GREY, RED, "#a8242a"),
        ],
      },
      {
        id: "ares-final-black",
        name: "Ares, blackened steel",
        note: "Ashton's Ares, the helmet in blackened steel under a bright red crest",
        parts: [
          dino("#e5383b", "none"),
          ARM_TO_SPEAR("#e5383b"),
          LONG_SPEAR,
          aresFinalHelm("#4a525c", "#2e343b", "#ff3b3b", "#a8242a"),
        ],
      },
      {
        id: "ares-final2-fitted",
        name: "Ares, fitted helm",
        note: "Ashton's Ares, the helmet a dome fitted to the head with a guard behind the eye, the crest growing out of it",
        parts: [...ARES_FINAL_BASE, ARES_DOME, ARES_DOME_CREST],
      },
      {
        id: "ares-final2-swept",
        name: "Ares, swept crest",
        note: "Ashton's Ares in the fitted helm, the crest swept back and trailing down behind",
        parts: [...ARES_FINAL_BASE, ARES_DOME, ARES_SWEPT_CREST],
      },
      {
        id: "ares-final2-gold",
        name: "Ares, gold brow",
        note: "Ashton's Ares in the fitted helm with a gold band across the brow",
        parts: [...ARES_FINAL_BASE, ARES_DOME, ARES_GOLD_BROW, ARES_DOME_CREST],
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
      {
        id: "aphrodite-final-roses",
        name: "Aphrodite, rose crown",
        note: "Ashton's Aphrodite with a crown of red roses on a band of leaves, and the rose",
        parts: [
          dino("#ff6fae", "none"),
          APHRODITE_FINAL_ROSE,
          APHRODITE_FINAL_ARM("#ff6fae"),
          APHRODITE_ROSE_CROWN,
        ],
      },
      {
        id: "aphrodite-final-heart",
        name: "Aphrodite, heart tiara",
        note: "Ashton's Aphrodite with a gold tiara and one big red heart, and the rose",
        parts: [
          dino("#ff6fae", "none"),
          APHRODITE_FINAL_ROSE,
          APHRODITE_FINAL_ARM("#ff6fae"),
          APHRODITE_HEART_TIARA,
        ],
      },
      {
        id: "aphrodite-final-apple",
        name: "Aphrodite, golden apple",
        note: "Ashton's Aphrodite holding the golden apple, to the fairest, under her flower crown",
        parts: [
          dino("#ff6fae", "none"),
          APHRODITE_FINAL_ARM("#ff6fae"),
          APHRODITE_FINAL_CROWN,
          GOLDEN_APPLE,
        ],
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
      {
        id: "artemis-leaf-crown",
        name: "Artemis, leaf crown",
        note: "The pick with a crown of leaves instead of the antlers: forest green, a drawn bow",
        parts: [dino("#2f7d5b", "raised"), LEAF_CROWN, BOW],
        framed: true,
      },
      {
        id: "artemis-leaf-headband",
        name: "Artemis, leaf headband",
        note: "Ashton's saved Artemis with a leaf headband for the antlers: a cord with leaves, a drawn bow",
        parts: [dino("#009e3f", "raised"), LEAF_HEADBAND, BOW],
        framed: true,
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
      {
        id: "zeus-robe",
        name: "Zeus, robe",
        note: "The pick in a white robe trimmed in the bolt's blue: halo, raised thunderbolt",
        parts: [
          dino("#ffd60a", "raised"),
          robe(WHITE, "#6fd3ff"),
          cells(
            [
              [14, 10],
              [15, 10],
            ],
            "#ffd60a",
          ),
          halo(WHITE),
          bolt("#6fd3ff"),
        ],
        framed: true,
      },
      {
        id: "zeus-headband",
        name: "Zeus, gold headband",
        note: "Ashton's saved Zeus with a gold headband for the halo, a blue gem in the middle",
        parts: [
          dino("#f5c724", "none"),
          armForward("#f5c724"),
          gemHeadband(DEEP_GOLD, "#1e6bff"),
          SAVED_BOLT,
        ],
        framed: true,
      },
      {
        id: "zeus-final-classic",
        name: "Zeus, classic crown",
        note: "Ashton's Zeus, a dark-gold crown, three points tipped in pale gold over a band of blue gems",
        parts: [...ZEUS_FINAL_BASE, ZEUS_CLASSIC_CROWN],
      },
      {
        id: "zeus-final-five",
        name: "Zeus, five-point crown",
        note: "Ashton's Zeus, a dark-gold crown of five tipped points over blue gems",
        parts: [...ZEUS_FINAL_BASE, ZEUS_FIVE_CROWN],
      },
      {
        id: "zeus-final-arched",
        name: "Zeus, arched crown",
        note: "Ashton's Zeus, an arched dark-gold crown with a pale-gold finial over blue gems",
        parts: [...ZEUS_FINAL_BASE, ZEUS_ARCHED_CROWN],
      },
      {
        id: "zeus-final-bolt-jewel",
        name: "Zeus, lightning jewel",
        note: "Ashton's Zeus, a low crown with a blue lightning-bolt jewel standing between two points",
        parts: [...ZEUS_FINAL_BASE, ZEUS_BOLT_JEWEL_CROWN],
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
      {
        id: "poseidon-final-classic",
        name: "Poseidon, classic crown",
        note: "Ashton's Poseidon, a gold crown with pearl-tipped points over aquamarines",
        parts: [...POSEIDON_FINAL_BASE, POSEIDON_CLASSIC_CROWN],
      },
      {
        id: "poseidon-final-pearls",
        name: "Poseidon, pearl crown",
        note: "Ashton's Poseidon, a gold crown of four pearl-tipped points, pearls and aquamarines set in the band",
        parts: [...POSEIDON_FINAL_BASE, POSEIDON_PEARL_CROWN],
      },
      {
        id: "poseidon-final-tall",
        name: "Poseidon, tall crown",
        note: "Ashton's Poseidon, a gold crown with a tall centre point, pearl tips and aquamarines",
        parts: [...POSEIDON_FINAL_BASE, POSEIDON_TALL_CROWN],
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
      {
        id: "hermes-phone",
        name: "Hermes, phone",
        note: "Sky blue, the winged gold helmet and a winged phone with a new message",
        parts: [dino("#4da3ff"), hermesWingedHelm(GOLD), WINGED_PHONE, WINGED_SANDALS],
      },
      {
        id: "hermes-harpe",
        name: "Hermes, harpe",
        note: "Teal, the big-winged helmet and the harpe, the hooked sword he lent Perseus",
        parts: [
          dino("#14c4b0", "raised"),
          cells([[20, 8]], "#14c4b0"),
          hermesHelm(GOLD),
          harpe(SILVER),
          GOLD_SANDALS,
        ],
      },
      {
        id: "hermes-final-caduceus",
        name: "Hermes, grand caduceus",
        note: "Ashton's Hermes holding up a grand caduceus: a gold orb, wide wings, two green snakes",
        parts: [
          dino("#14c4b0", "raised"),
          cells([[20, 8]], "#14c4b0"),
          GRAND_CADUCEUS,
          HERMES_FINAL,
        ],
      },
      {
        id: "hermes-final-staff",
        name: "Hermes, herald's staff",
        note: "Ashton's Hermes leaning on the herald's staff, an open gold figure eight with ribbons",
        parts: [dino("#14c4b0", "none"), HERALD_STAFF, ARM_TO_STAFF("#14c4b0"), HERMES_FINAL],
      },
      {
        id: "hermes-final-small-caduceus",
        name: "Hermes, small caduceus",
        note: "Ashton's Hermes holding up a hand-sized caduceus with small wings and green snakes",
        parts: [
          dino("#14c4b0", "raised"),
          cells(
            [
              [20, 8],
              [21, 8],
            ],
            "#14c4b0",
          ),
          SMALL_CADUCEUS,
          HERMES_FINAL,
        ],
      },
      {
        id: "hermes-final-small-herald",
        name: "Hermes, small herald's staff",
        note: "Ashton's Hermes holding up a hand-sized herald's staff, a small gold figure eight and a ribbon",
        parts: [
          dino("#14c4b0", "raised"),
          cells([[20, 8]], "#14c4b0"),
          SMALL_HERALD_STAFF,
          HERMES_FINAL,
        ],
      },
      {
        id: "hermes-final-diagonal-caduceus",
        name: "Hermes, caduceus pointed",
        note: "Ashton's Hermes pointing the small caduceus up and forward on the diagonal, like Zeus's bolt",
        parts: [dino("#14c4b0", "none"), DIAGONAL_CADUCEUS, armForward("#14c4b0"), HERMES_FINAL],
      },
      {
        id: "hermes-final-diagonal-herald",
        name: "Hermes, herald's staff pointed",
        note: "Ashton's Hermes pointing the small herald's staff up and forward on the diagonal",
        parts: [
          dino("#14c4b0", "none"),
          DIAGONAL_HERALD_STAFF,
          armForward("#14c4b0"),
          HERMES_FINAL,
        ],
      },
      {
        id: "hermes2-final-crossed",
        name: "Hermes, caduceus crossed",
        note: "Ashton's Hermes2 with two snakes coiling the staff and crossing, kept close to it",
        parts: [
          dino("#14c4b0", "none"),
          HERMES2_CADUCEUS,
          HERMES2_SNAKES_CROSSED,
          HERMES2_ARM("#14c4b0"),
          HERMES_FINAL,
        ],
      },
      {
        id: "hermes2-final-spiral",
        name: "Hermes, caduceus spiral",
        note: "Ashton's Hermes2 with the snakes in one spiral winding down the staff, kept close to it",
        parts: [
          dino("#14c4b0", "none"),
          HERMES2_CADUCEUS,
          HERMES2_SNAKES_SPIRAL,
          HERMES2_ARM("#14c4b0"),
          HERMES_FINAL,
        ],
      },
      {
        id: "hermes-final-scroll",
        name: "Hermes, scroll",
        note: "Ashton's Hermes holding an open scroll with a red seal",
        parts: [dino("#14c4b0"), SCROLL, HERMES_FINAL],
      },
      {
        id: "hermes-final-proclamation",
        name: "Hermes, proclamation",
        note: "Ashton's Hermes holding a scroll that hangs open from its top roller, a red seal below",
        parts: [dino("#14c4b0"), SCROLL_HANGING, HERMES_FINAL],
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
      {
        id: "athena-shield",
        name: "Athena, shield",
        note: "Ashton's saved Athena with a bronze shield on the arm instead of the spear",
        parts: [dino("#c6ced7", "none"), armForward("#c6ced7"), SAVED_ATHENA_HELM, ATHENA_SHIELD],
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
