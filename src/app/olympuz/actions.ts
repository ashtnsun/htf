"use server";

import { FAMILIES } from "@content/olympuz";
import { matches, normalize } from "@/lib/olympus/match";

/**
 * The /olympuz snapshot's checks (the family reveal before the cipher chain). Its words still
 * open the Oracle: consultOracle in app/olympus/actions.ts accepts them.
 */
function family(n: unknown) {
  return typeof n === "number" && Number.isInteger(n) ? FAMILIES[n - 1] : undefined;
}

/** The answer as written in content/olympuz.ts when the guess is right, otherwise null. */
export async function checkRiddle(n: number, index: number, guess: string) {
  const riddle = Number.isInteger(index) ? family(n)?.riddles[index] : undefined;
  if (!riddle || typeof guess !== "string") return null;
  return matches(guess, [riddle.answer, ...(riddle.also ?? [])]) ? riddle.answer : null;
}

/** The word as written when a family's unscrambled word is right, otherwise null. */
export async function checkWord(n: number, guess: string) {
  const f = family(n);
  if (!f || typeof guess !== "string" || normalize(guess) !== normalize(f.word)) return null;
  return f.word;
}
