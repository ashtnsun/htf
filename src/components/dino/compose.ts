import { DINO_ARM, dinoCells } from "@/components/brand/dino-pixels";
import { LAYERS, TREX_ORIGIN, type Ink } from "@/components/home/ProcessSprites";
import { BRAND_COLORS, type Sprite } from "@/components/dino/sprite";

/**
 * Building blocks for the editor's premade variants (variants.ts, gods.ts). Everything is in
 * T-rex-local cells, the footer map's own coordinates: the head's top row is row 0 (columns
 * 11-18), the snout ends at column 19, the carved eye is (12, 2), the jaw is row 7 (columns
 * 10-17), the tiny arm is (14, 10), (15, 10), (15, 11), the tail tip is column 0 and the feet
 * stand on row 21. Cells above or left of the map have negative coordinates; compose crops.
 */

/** One placed cell; a null colour carves the cell out of whatever is under it. */
export type Part = { x: number; y: number; color: string | null };

const hex = (name: string) => BRAND_COLORS.find((c) => c.name === name)!.hex;
export const GREEN = hex("Green");
export const WHITE = hex("White");
export const INK_HEX: Record<Ink, string> = {
  green: GREEN,
  white: WHITE,
  tint: hex("Tint"),
  pink: hex("Pink"),
  blue: hex("Blue"),
};

/** A layer of the home page's process scene (home/ProcessSprites), in T-rex-local cells. */
export function layer(key: string): Part[] {
  const found = LAYERS.find((l) => l.key === key);
  if (!found) throw new Error(`No process-scene layer "${key}"`);
  return found.cells.map(([x, y, ink]) => ({
    x: x - TREX_ORIGIN.x,
    y: y - TREX_ORIGIN.y,
    color: INK_HEX[ink ?? "green"],
  }));
}

/**
 * A string map with its top-left cell at (ox, oy). `inks` gives each character's colour
 * (null carves); characters it does not name, `.` included, are left as they are.
 */
export function local(
  rows: readonly string[],
  ox: number,
  oy: number,
  inks: Readonly<Record<string, string | null>>,
): Part[] {
  return rows.flatMap((row, y) =>
    Array.from(row).flatMap((ch, x) =>
      ch in inks ? [{ x: ox + x, y: oy + y, color: inks[ch]! }] : [],
    ),
  );
}

/** Single cells, for strokes too short to be worth a map. */
export function cells(points: readonly (readonly [number, number])[], color: string | null) {
  return points.map(([x, y]) => ({ x, y, color }));
}

/** A one-cell line between two cells (Bresenham), for stems, staffs and rays. */
export function line(x0: number, y0: number, x1: number, y1: number, color: string): Part[] {
  const out: Part[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    out.push({ x, y, color });
    if (x === x1 && y === y1) return out;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

/** The arm raised forward to a grip at (19, 8), for anything held upright at column 20. */
export const ARM_RAISED: readonly (readonly [number, number])[] = [
  [14, 10],
  [15, 10],
  [16, 9],
  [17, 9],
  [18, 8],
  [19, 8],
];

/** The footer T-rex in one colour, with its arm at rest, raised to column 20, or left off. */
export function dino(color: string, arm: "rest" | "raised" | "none" = "rest"): Part[] {
  const body = dinoCells({ withoutArm: true }).map(({ x, y }) => ({ x, y, color }));
  if (arm === "none") return body;
  return [...body, ...cells(arm === "rest" ? DINO_ARM : ARM_RAISED, color)];
}

/** A fixed canvas in T-rex-local cells, inclusive at both ends. */
export type Frame = { x0: number; y0: number; x1: number; y1: number };

/** The dinosaur's own cells in the given rows, in another colour (a helmet that fits the head). */
export function fitted(rows: readonly number[], color: string): Part[] {
  return dinoCells()
    .filter(({ y }) => rows.includes(y))
    .map(({ x, y }) => ({ x, y, color }));
}

export function compose(name: string, ...parts: Part[][]): Sprite {
  return composeIn(name, null, ...parts);
}

/**
 * Layers the parts in order (later ones cover earlier ones) and crops to the drawing, or to
 * `frame` when one is given, so sprites drawn in the same frame share a size and the dinosaur
 * sits in the same cells in each. The palette runs from the most used colour down, so the
 * dinosaur's colour is `#` in the map.
 */
export function composeIn(name: string, frame: Frame | null, ...parts: Part[][]): Sprite {
  const placed = new Map<string, Part>();
  for (const part of parts.flat()) {
    const key = `${part.x},${part.y}`;
    if (part.color) placed.set(key, part);
    else placed.delete(key);
  }
  const all = [...placed.values()].filter(
    (p) => !frame || (p.x >= frame.x0 && p.x <= frame.x1 && p.y >= frame.y0 && p.y <= frame.y1),
  );
  const minX = frame?.x0 ?? Math.min(...all.map((p) => p.x));
  const minY = frame?.y0 ?? Math.min(...all.map((p) => p.y));
  const width = (frame?.x1 ?? Math.max(...all.map((p) => p.x))) - minX + 1;
  const height = (frame?.y1 ?? Math.max(...all.map((p) => p.y))) - minY + 1;
  const counts = new Map<string, number>();
  for (const p of all) counts.set(p.color!, (counts.get(p.color!) ?? 0) + 1);
  const palette = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)!);
  const grid = Array<number>(width * height).fill(0);
  for (const p of all) grid[(p.y - minY) * width + (p.x - minX)] = palette.indexOf(p.color!) + 1;
  return { name, width, height, palette, cells: grid };
}
