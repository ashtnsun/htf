import { DINO_PIXELS } from "@/components/brand/dino-pixels";
import { compose, GREEN, layer, local, WHITE } from "@/components/dino/compose";
import { GOD_VARIANTS } from "@/components/dino/gods";
import { REVEAL_SPRITES } from "@/components/dino/reveal";
import { BRAND_COLORS, flipX, fromRows, type Sprite } from "@/components/dino/sprite";

/**
 * The starting points in the dinosaur editor (/dino), listed in groups. The first is the
 * T-rex itself (brand/dino-pixels); the scenes and props reuse the process scene's sprites
 * (home/ProcessSprites) so a hat here is the hat on the home page; the rest are new drawings
 * on the same grid (components/dino/compose has the coordinates), and the Greek gods live in
 * gods.ts. To add a variant, draw it with `local` and `compose` and append it to a list; the
 * editor shows it on the next load.
 */
export type Variant = { id: string; group: string; note: string; sprite: Sprite };

const hex = (name: string) => BRAND_COLORS.find((c) => c.name === name)!.hex;
/** `#` the dinosaur's green, `o` white, `x` carves a cell out. */
const INKS = { "#": GREEN, o: WHITE, x: null };

const TREX = [...layer("trex"), ...layer("arm")];
const GROUP = "Starting points";

/** A pointed hat with its tip bent back and a green band; the brim covers the head's top row. */
const WITCH_HAT = local(
  [
    "...oo...........",
    "....ooo.........",
    ".....oooo.......",
    "......oooo......",
    "......ooooo.....",
    ".....oooooo.....",
    ".....ooooooo....",
    "....########....",
    "....oooooooo....",
    "oooooooooooooooo",
  ],
  7,
  -9,
  INKS,
);
/** A mortarboard seen from the side, its green tassel hanging at the back. */
const GRAD_CAP = local(
  [
    "..oooooooooooo..",
    "oooooooooooooooo",
    "#...oooooooo....",
    "#...oooooooo....",
    "##..oooooooo....",
  ],
  7,
  -4,
  INKS,
);
const CROWN = local(["o..oo..o", "oo.oo.oo", "oooooooo", "oo#oo#oo", "oooooooo"], 11, -4, INKS);
/** Wraparound shades carved out of the head over the eye, the strap running back, one white glint. */
const SHADES = local(["xxxxxxx", "..xoxxx", "...xxx."], 10, 2, INKS);
/** A mug in the hand (the arm reaches its side), the handle facing out. */
const MUG = local(["oooo..", "oooooo", "oooo.o", "oooooo", "oooo.."], 16, 8, INKS);

const recolor = (sprite: Sprite, name: string, color: string): Sprite => ({
  ...sprite,
  name,
  palette: [color],
});

const classic = fromRows("Classic", DINO_PIXELS, { "#": GREEN });

const STARTING_POINTS: readonly Omit<Variant, "group">[] = [
  { id: "classic", note: "The footer T-rex, 20 × 22", sprite: classic },
  {
    id: "facing-left",
    note: "Mirrored, as the footer draws it",
    sprite: { ...flipX(classic), name: "Facing left" },
  },
  {
    id: "waving",
    note: "The team step's raised arm",
    sprite: compose("Waving", layer("trex"), layer("arm-up")),
  },
  {
    id: "detective",
    note: "Discover: deerstalker and magnifying glass",
    sprite: compose("Detective", TREX, layer("hat-detective"), layer("glass")),
  },
  {
    id: "team",
    note: "Match: the T-rex and its two teammates",
    sprite: compose("Team", layer("trex"), layer("arm"), layer("teammate-a"), layer("teammate-b")),
  },
  {
    id: "builder",
    note: "Build: hard hat, hammer and bricks",
    sprite: compose("Builder", TREX, layer("hat-hard"), layer("hammer-up"), layer("bricks")),
  },
  {
    id: "party",
    note: "Deliver: party hat, gift and confetti",
    sprite: compose(
      "Party",
      TREX,
      layer("hat-party"),
      layer("arm-out"),
      layer("gift"),
      ...[0, 1, 2].map((g) => layer(`confetti-${g}`)),
    ),
  },
  {
    id: "witch",
    note: "New: a witch hat for Halloween",
    sprite: compose("Witch", TREX, WITCH_HAT),
  },
  {
    id: "graduate",
    note: "New: mortarboard and tassel",
    sprite: compose("Graduate", TREX, GRAD_CAP),
  },
  { id: "royal", note: "New: a crown with green gems", sprite: compose("Royal", TREX, CROWN) },
  {
    id: "shades",
    note: "New: sunglasses carved over the eye",
    sprite: compose("Shades", TREX, SHADES),
  },
  { id: "coffee", note: "New: a mug in the hand", sprite: compose("Coffee", TREX, MUG) },
  {
    id: "pink",
    note: "The small pink teammate",
    sprite: compose("Pink teammate", layer("teammate-a")),
  },
  {
    id: "blue",
    note: "The small blue teammate",
    sprite: compose("Blue teammate", layer("teammate-b")),
  },
  { id: "mint", note: "Palette swap: mint", sprite: recolor(classic, "Mint", hex("Mint")) },
  { id: "cyan", note: "Palette swap: cyan", sprite: recolor(classic, "Cyan", hex("Cyan")) },
];

export const VARIANTS: readonly Variant[] = [
  ...STARTING_POINTS.map((v) => ({ ...v, group: GROUP })),
  ...Object.entries(REVEAL_SPRITES).map(([god, sprite]) => ({
    id: `reveal-${god.toLowerCase()}`,
    group: "Family reveal",
    note: `${god}, as /olympus reveals them`,
    sprite,
  })),
  ...GOD_VARIANTS,
];
