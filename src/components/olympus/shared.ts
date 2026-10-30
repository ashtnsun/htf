import type { Sprite } from "@/components/dino/sprite";

/** What the server hands back once a family's word is right (app/olympus/actions.ts). */
export type GodReveal = {
  god: string;
  exec: string;
  word: string;
  sprite: Sprite;
  /** The dinosaur's own colour, for the glow behind it. Decoration only, never text. */
  color: string;
};

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/** 1 → "I" … 10 → "X": the families and riddles are numbered the old way. */
export function roman(n: number) {
  return NUMERALS[n - 1] ?? String(n);
}
