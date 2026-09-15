import type { PageKey } from "@/components/layout/pageHeroes/usePageKey";

/**
 * The Pixels hero's picture for each inner page, as string maps in the pixel-art language of
 * brand/dino-pixels: `o` a white cell, `#` a green one, `.` empty. White objects, green accents,
 * details carved as empty cells.
 */
export const PIXEL_ICONS: Record<PageKey, readonly string[]> = {
  /** Projects: a window of code, `</>` in green. */
  projects: [
    "oooooooooooooooo",
    "o#o#o#oooooooooo",
    "oooooooooooooooo",
    "o..............o",
    "o....#...#.#...o",
    "o...#...#...#..o",
    "o..#....#....#.o",
    "o...#..#....#..o",
    "o....#.#...#...o",
    "o..............o",
    "oooooooooooooooo",
  ],
  /** About: students building for good, a heart with a green glint. */
  about: [
    "..ooo.....ooo..",
    ".ooooo...ooooo.",
    "oo#oooo.ooooooo",
    "o#ooooooooooooo",
    "ooooooooooooooo",
    "ooooooooooooooo",
    ".ooooooooooooo.",
    "..ooooooooooo..",
    "...ooooooooo...",
    "....ooooooo....",
    ".....ooooo.....",
    "......ooo......",
    ".......o.......",
  ],
  /** Students: a rocket with a green porthole and flame. */
  students: [
    "......o......",
    ".....ooo.....",
    "....ooooo....",
    "....ooooo....",
    "...ooooooo...",
    "...oo###oo...",
    "...oo###oo...",
    "...ooooooo...",
    "...ooooooo...",
    "...ooooooo...",
    "..ooooooooo..",
    ".ooooooooooo.",
    "ooo.ooooo.ooo",
    "oo...###...oo",
    ".....###.....",
    "......#......",
  ],
  /** Nonprofits: we build the tool, a toolbox with a green band and a white latch. */
  nonprofits: [
    ".....ooooo.....",
    ".....o...o.....",
    ".....o...o.....",
    ".ooooooooooooo.",
    "ooooooooooooooo",
    "ooooooooooooooo",
    "######ooo######",
    "ooooooooooooooo",
    "ooooooooooooooo",
    "ooooooooooooooo",
    "ooooooooooooooo",
  ],
  /** Contact: an envelope, its flap in green. */
  contact: [
    "ooooooooooooooooo",
    "o#ooooooooooooo#o",
    "oo#ooooooooooo#oo",
    "ooo#ooooooooo#ooo",
    "oooo#ooooooo#oooo",
    "ooooo#ooooo#ooooo",
    "oooooo#ooo#oooooo",
    "ooooooo###ooooooo",
    "ooooooooooooooooo",
    "ooooooooooooooooo",
    "ooooooooooooooooo",
  ],
};
