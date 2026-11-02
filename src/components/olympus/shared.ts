import type { Sprite } from "@/components/dino/sprite";

/** What the Oracle hands back once a family's word is right (consultOracle in app/olympus/actions.ts). */
export type GodReveal = {
  /** 1-based: Group I is 1. */
  family: number;
  god: string;
  exec: string;
  word: string;
  sprite: Sprite;
  /** The dinosaur's own colour, for the glow behind it. Decoration only, never text. */
  color: string;
  /** The scene the Oracle builds while REVEAL is held (components/olympus/scenes.ts). */
  scene: SceneId;
};

/** The Oracle's scenes, named for what they show, never for a god. */
export type SceneId =
  "ocean" | "caduceus" | "army" | "olympus" | "sun" | "forest" | "temple" | "shell" | "underworld";

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/** 1 → "I" … 10 → "X": the families and riddles are numbered the old way. */
export function roman(n: number) {
  return NUMERALS[n - 1] ?? String(n);
}
