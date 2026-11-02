/**
 * The HTF T-rex as a pixel map: the offline-page icon traced onto a 20 × 22 grid (a majority
 * vote of the icon's dark pixels per cell; its diagonals are not quite on the grid, so the
 * back steps two cells once). `#` is a filled cell. The map faces right, as the icon does;
 * the footer mirrors it. Everything drawn with the dinosaur (the footer, the process scene's
 * detective, team, builder and party dinos) reads from this one map so the cell grid, the
 * silhouette and the carved eye stay identical everywhere.
 */
export const DINO_PIXELS: readonly string[] = [
  "...........########.",
  "..........##########",
  "..........##.#######",
  "..........##########",
  "..........##########",
  "..........##########",
  "..........#####.....",
  "..........########..",
  "#........#####......",
  "#......#######......",
  "##....##########....",
  "###..#########.#....",
  "##############......",
  "##############......",
  ".############.......",
  "..###########.......",
  "...#########........",
  "....#######.........",
  ".....###.##.........",
  ".....##...#.........",
  ".....#....#.........",
  ".....##...##........",
];
export const DINO_COLS = DINO_PIXELS[0]!.length;
export const DINO_ROWS = DINO_PIXELS.length;
/** The eye is the one empty cell inside the head (row 2, column 12); an eyelid covers it to blink. */
export const DINO_EYE = { x: 12, y: 2 } as const;
/** The tiny arm (the scenes swap it for a raised, waving or tool-holding one). */
export const DINO_ARM: readonly (readonly [x: number, y: number])[] = [
  [14, 10],
  [15, 10],
  [15, 11],
];

/**
 * The T-rex at about two thirds of its size, reduced by hand from the 20 × 22 map so it keeps
 * the same features on the same grid: the carved eye, the open mouth, the tiny arm, the tail
 * and the two legs. Faces right like the big map. The process scene's teammates (mirrored to face the lead) and
 * the climber on the home page's Olympus scene.
 */
export const SMALL_DINO_PIXELS: readonly string[] = [
  "........#####.",
  ".......#######",
  ".......##.####",
  ".......#######",
  ".......#######",
  ".......####...",
  ".......######.",
  "#.....####....",
  "#...#######...",
  "##.#########..",
  "##########.#..",
  ".#########....",
  "..#######.....",
  "...##.##......",
  "...#...#......",
  "...##..##.....",
];
/** The small T-rex's carved eye. */
export const SMALL_DINO_EYE = { x: 9, y: 2 } as const;

/** Every filled cell of the map, optionally without the arm. */
export function dinoCells(options: { withoutArm?: boolean } = {}): { x: number; y: number }[] {
  const arm = new Set(DINO_ARM.map(([x, y]) => `${x},${y}`));
  return DINO_PIXELS.flatMap((row, y) =>
    Array.from(row).flatMap((cell, x) =>
      cell === "#" && !(options.withoutArm && arm.has(`${x},${y}`)) ? [{ x, y }] : [],
    ),
  );
}
