import { cn } from "@/lib/utils";

/**
 * The Who we serve pictures: pixel art on the same cell grid as the footer T-rex and the
 * process scene (brand/dino-pixels, home/ProcessSprites), drawn the same way: solid cells,
 * no outlines, details carved as empty cells (the title bar on each spine), the object white
 * and the accent green like the scene's props and gift. A stack of books for students, a
 * heart floating over an open hand for nonprofits. Both maps are 24 × 22 cells so the two
 * panels' pictures share one scale and one baseline. Static, decoration only: hidden from assistive
 * tech (the panel's eyebrow and title say who it is for).
 */
export type AudienceGraphicName = "books" | "heart";

/** Four books, spines toward the reader, each offset like a real stack; the title bars carved. */
const BOOKS: readonly string[] = [
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "....ooooooooooooooo.....",
  "....ooooooooooooooo.....",
  "....oo...oooooooooo.....",
  "....ooooooooooooooo.....",
  "..################......",
  "..################......",
  "..##...###########......",
  "..################......",
  ".....ooooooooooooooooo..",
  ".....ooooooooooooooooo..",
  ".....oo...oooooooooooo..",
  ".....ooooooooooooooooo..",
  "...##################...",
  "...##################...",
  "...##...#############...",
  "...##################...",
  "........................",
];

/**
 * A heart floating over an open hand seen from the side, palm up (the "hand holding heart"
 * icon): the cuff at the left, the knuckle of the thumb as the bump on top, the thumb lying
 * across the palm toward the fingers, which rise at the right. The palm's hollow and the
 * underside of the thumb are carved so the thumb, the cuff and the fingers read as parts.
 */
const HEART_OVER_HAND: readonly string[] = [
  "........................",
  "........................",
  "........................",
  "..........###...###.....",
  ".........#####.#####....",
  "........#############...",
  "........#############...",
  ".........###########....",
  "..........#########.....",
  "...........#######......",
  "............#####.......",
  ".............###........",
  "...oooooo.....#......oo.",
  ".ooooooooooo........oooo",
  "oooooo...oooooo....ooooo",
  "oooooo.........ooooooooo",
  "ooooooooooooooooo...ooo.",
  "oooooooooooooooooo..ooo.",
  "oooooo..............ooo.",
  "oooooooooooooooooooo.oo.",
  ".ooooooooooooooooooooo..",
  ".......oooooooooooooo...",
];

const INK: Record<string, string> = { "#": "var(--green)", o: "var(--text)" };
const MAPS: Record<AudienceGraphicName, readonly string[]> = {
  books: BOOKS,
  heart: HEART_OVER_HAND,
};

/** One <path> per ink, the cells merged into row runs (as the process scene draws its pieces). */
function pathsOf(rows: readonly string[]): { ink: string; d: string }[] {
  const byInk = new Map<string, string>();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const cell = row[x]!;
      const ink = INK[cell];
      if (!ink) {
        x += 1;
        continue;
      }
      let width = 1;
      while (row[x + width] === cell) width += 1;
      byInk.set(ink, `${byInk.get(ink) ?? ""}M${x} ${y}h${width}v1h-${width}z`);
      x += width;
    }
  });
  return [...byInk].map(([ink, d]) => ({ ink, d }));
}

const PATHS: Record<AudienceGraphicName, ReturnType<typeof pathsOf>> = {
  books: pathsOf(BOOKS),
  heart: pathsOf(HEART_OVER_HAND),
};

type AudienceGraphicProps = {
  name: AudienceGraphicName;
  /** Sets the width; the height follows the 24 × 22 grid. */
  className?: string;
};

/** One of the two pictures, crisp at any size (whole cells, no anti-aliasing). */
export function AudienceGraphic({ name, className }: AudienceGraphicProps) {
  const map = MAPS[name];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${map[0]!.length} ${map.length}`}
      shapeRendering="crispEdges"
      className={cn("block h-auto", className)}
    >
      {PATHS[name].map((piece) => (
        <path key={piece.ink} d={piece.d} fill={piece.ink} />
      ))}
    </svg>
  );
}
