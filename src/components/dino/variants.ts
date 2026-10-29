import { DINO_PIXELS } from "@/components/brand/dino-pixels";
import { LAYERS, TREX_ORIGIN, type Ink } from "@/components/home/ProcessSprites";
import { BRAND_COLORS, flipX, fromRows, type Sprite } from "@/components/dino/sprite";

/**
 * The starting points in the dinosaur editor (/dino). The first is the T-rex itself
 * (brand/dino-pixels); the scenes and props reuse the process scene's sprites
 * (home/ProcessSprites) so a hat here is the hat on the home page; the rest are new drawings
 * on the same grid, following the pixel-art rules (solid cells, details carved, the dinosaur
 * green and props white with green accents). To add a variant, draw it in T-rex-local
 * cells with `local` (the map's own coordinates: the head's top row is row 0, columns 11-18)
 * and append it to VARIANTS; the editor lists it on the next load.
 */
export type Variant = { id: string; note: string; sprite: Sprite };

const hex = (name: string) => BRAND_COLORS.find((c) => c.name === name)!.hex;
const INK_HEX: Record<Ink, string> = {
  green: hex("Green"),
  white: hex("White"),
  tint: hex("Tint"),
  pink: hex("Pink"),
  blue: hex("Blue"),
};
const INK_ORDER: readonly Ink[] = ["green", "white", "tint", "pink", "blue"];

/** One placed cell in scene coordinates; a null ink carves the cell out. */
type Part = { x: number; y: number; ink: Ink | null };

function layer(key: string): Part[] {
  const found = LAYERS.find((l) => l.key === key);
  if (!found) throw new Error(`No process-scene layer "${key}"`);
  return found.cells.map(([x, y, ink]) => ({ x, y, ink: ink ?? "green" }));
}

const LOCAL_INKS: Record<string, Ink | null> = {
  "#": "green",
  o: "white",
  "+": "tint",
  p: "pink",
  b: "blue",
  x: null,
};

/** A string map placed with its top-left cell at (ox, oy) in T-rex-local cells. */
function local(rows: readonly string[], ox: number, oy: number): Part[] {
  return rows.flatMap((row, y) =>
    Array.from(row).flatMap((ch, x) =>
      ch in LOCAL_INKS
        ? [{ x: TREX_ORIGIN.x + ox + x, y: TREX_ORIGIN.y + oy + y, ink: LOCAL_INKS[ch]! }]
        : [],
    ),
  );
}

/** Layers the parts in order (later ones cover earlier ones) and crops to the drawing. */
function compose(name: string, ...parts: Part[][]): Sprite {
  const placed = new Map<string, Part>();
  for (const part of parts.flat()) {
    const key = `${part.x},${part.y}`;
    if (part.ink) placed.set(key, part);
    else placed.delete(key);
  }
  const all = [...placed.values()];
  const minX = Math.min(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const width = Math.max(...all.map((p) => p.x)) - minX + 1;
  const height = Math.max(...all.map((p) => p.y)) - minY + 1;
  const inks = INK_ORDER.filter((ink) => all.some((p) => p.ink === ink));
  const cells = Array<number>(width * height).fill(0);
  for (const p of all) cells[(p.y - minY) * width + (p.x - minX)] = inks.indexOf(p.ink!) + 1;
  return { name, width, height, palette: inks.map((ink) => INK_HEX[ink]), cells };
}

const TREX = [...layer("trex"), ...layer("arm")];

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
);
const CROWN = local(["o..oo..o", "oo.oo.oo", "oooooooo", "oo#oo#oo", "oooooooo"], 11, -4);
/** Wraparound shades carved out of the head over the eye, the strap running back, one white glint. */
const SHADES = local(["xxxxxxx", "..xoxxx", "...xxx."], 10, 2);
/** A mug in the hand (the arm reaches its side), the handle facing out. */
const MUG = local(["oooo..", "oooooo", "oooo.o", "oooooo", "oooo.."], 16, 8);

const recolor = (sprite: Sprite, name: string, color: string): Sprite => ({
  ...sprite,
  name,
  palette: [color],
});

const classic = fromRows("Classic", DINO_PIXELS, { "#": INK_HEX.green });

export const VARIANTS: readonly Variant[] = [
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
