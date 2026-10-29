import { cells, compose, dino, line, local, WHITE, type Part } from "@/components/dino/compose";
import type { Variant } from "@/components/dino/variants";

/**
 * The Greek gods in the dinosaur editor: three variants of each, every one the footer T-rex in
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
const SHELL = "#ffe3c4";
const SHELL_RIB = "#e8956b";
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

/** A flower tucked on top of the head: petals round a centre. */
function hairFlower(petal: string, centre: string): Part[] {
  return local([".p.", "pcp", ".p."], 12, -2, { p: petal, c: centre });
}

/** A rose held out from the hand: stem, one leaf, the bloom in front of the chin. */
const ROSE = [
  ...line(16, 10, 19, 10, LEAF),
  ...cells([[18, 11]], LEAF),
  ...local([".rr", "rdr", "rr."], 19, 7, { r: RED, d: "#a4161a" }),
];

/** A heart held against the arm. */
function heart(color: string): Part[] {
  return local([".hh.hh.", "hhhhhhh", "hhhhhhh", ".hhhhh.", "..hhh..", "...h..."], 16, 8, {
    h: color,
  });
}

/** Pearls on the neck. */
const PEARLS = cells(
  [
    [10, 8],
    [12, 8],
    [11, 9],
    [13, 9],
  ],
  WHITE,
);

/** A scallop shell behind the legs, its ribs fanning out from the hinge (drawn first). */
function scallop(fill: string, rib: string): Part[] {
  const cx = 8;
  const cy = 22;
  const r = 13;
  const out: Part[] = [];
  for (let y = cy - r; y <= cy; y += 1) {
    for (let x = cx - r; x <= cx + r; x += 1) {
      const dx = x - cx;
      const dy = cy - y;
      if (dx * dx + dy * dy > r * r + r) continue;
      const band = Math.floor(Math.atan2(dy, dx) / (Math.PI / 11));
      out.push({ x, y, color: band % 2 === 0 ? fill : rib });
    }
  }
  return [
    ...out,
    ...cells(
      [7, 8, 9].map((x) => [x, cy + 1] as const),
      rib,
    ),
  ];
}

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

/* ---------------------------------------------------------------- the variants */

type God = {
  group: string;
  variants: { id: string; name: string; note: string; parts: Part[][] }[];
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
    variants: [
      {
        id: "aphrodite-rose",
        name: "Aphrodite, rose",
        note: "Rose pink, a red rose and a flower in the hair",
        parts: [dino("#ff6fae"), hairFlower(WHITE, YELLOW), ROSE],
      },
      {
        id: "aphrodite-heart",
        name: "Aphrodite, heart",
        note: "Blush, a red heart and pearls",
        parts: [dino("#ffb3d1"), PEARLS, heart(RED)],
      },
      {
        id: "aphrodite-shell",
        name: "Aphrodite, shell",
        note: "Magenta, born from a scallop shell",
        parts: [scallop(SHELL, SHELL_RIB), dino("#e6268c"), hairFlower(SHELL, RED)],
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
];

export const GOD_VARIANTS: readonly Variant[] = GODS.flatMap((god) =>
  god.variants.map((v) => ({
    id: v.id,
    group: god.group,
    note: v.note,
    sprite: compose(v.name, ...v.parts),
  })),
);
