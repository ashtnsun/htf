"use server";

import { FAMILIES } from "@content/olympus";
import { GOD_VARIANTS } from "@/components/dino/gods";
import type { GodReveal } from "@/components/olympus/shared";

/** Lower case, letters and digits only, without leading words like "a", "the", "in", "mount". */
function normalize(text: string) {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/^((a|an|the|your|my|in|mount|mt)\s+)+/, "")
    .replace(/\s+/g, "");
}

function matches(guess: string, answers: readonly string[]) {
  const g = normalize(guess);
  return answers.some((answer) => {
    const a = normalize(answer);
    return g === a || g === `${a}s` || g === `${a}es`;
  });
}

function family(n: unknown) {
  return typeof n === "number" && Number.isInteger(n) ? FAMILIES[n - 1] : undefined;
}

/** The answer as written in content/olympus.ts when the guess is right, otherwise null. */
export async function checkRiddle(n: number, index: number, guess: string) {
  const riddle = Number.isInteger(index) ? family(n)?.riddles[index] : undefined;
  if (!riddle || typeof guess !== "string") return null;
  return matches(guess, [riddle.answer, ...(riddle.also ?? [])]) ? riddle.answer : null;
}

/** The god behind the family when the unscrambled word is right, otherwise null. */
export async function checkWord(n: number, guess: string): Promise<GodReveal | null> {
  const f = family(n);
  if (!f || typeof guess !== "string" || normalize(guess) !== normalize(f.word)) return null;
  const sprite = GOD_VARIANTS.find((v) => v.id === f.dino)!.sprite;
  // The body is the colour most cells share.
  const counts = sprite.palette.map((_, i) => sprite.cells.filter((c) => c === i + 1).length);
  const color = sprite.palette[counts.indexOf(Math.max(...counts))]!;
  return { god: f.god, exec: f.exec, word: f.word, sprite, color };
}
