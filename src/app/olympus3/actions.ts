"use server";

import { CLUE, FAMILIES } from "@content/olympus";
import { inscriptionKey, vigenere, type Mark } from "@/components/olympus/journey/cipher";
import { keyedSquare } from "@/components/olympus/crawl/square";
import { normalize } from "@/lib/olympus/match";

/**
 * The tomb's checks (/olympus3). Every trial is open from the first step, so each of these asks
 * for proof of what comes before it instead of trusting the order: the gate wants the five
 * answers, the stone wants the word and the names, the seal wants the stone's key, the fires'
 * word wants the seal. The riddles and the Oracle use the same checks as /olympus.
 */

function family(n: unknown) {
  return typeof n === "number" && Number.isInteger(n) ? FAMILIES[n - 1] : undefined;
}

function cleanNames(names: unknown) {
  return Array.isArray(names) && names.length > 0 && names.length <= 40
    ? names.filter((name): name is string => typeof name === "string" && name.length <= 40)
    : [];
}

/** One Wordle guess at the Word Gate. No marks at all until all five riddles are answered. */
export async function guessGate(
  n: number,
  guess: string,
  answers: readonly string[],
): Promise<{ marks: Mark[]; word?: string } | null> {
  const f = family(n);
  const g = typeof guess === "string" ? guess.toUpperCase().replace(/[^A-Z]/g, "") : "";
  if (!f || g.length !== f.word.length || !Array.isArray(answers)) return null;
  if (!f.riddles.every((r, i) => r.answer === answers[i])) return null;
  const marks: Mark[] = [...g].map((c, i) => (c === f.word[i] ? "hit" : "miss"));
  const left = [...f.word].filter((c, i) => g[i] !== c);
  marks.forEach((mark, i) => {
    const at = mark === "miss" ? left.indexOf(g[i]!) : -1;
    if (at < 0) return;
    marks[i] = "near";
    left.splice(at, 1);
  });
  return g === f.word ? { marks, word: f.word } : { marks };
}

/** The stone's carving: it stays blank until the family has both the word and their names. */
export async function carveStone(n: number, word: string, names: string[]) {
  const f = family(n);
  const clean = cleanNames(names);
  if (!f || !clean.length || typeof word !== "string" || normalize(word) !== normalize(f.word)) {
    return null;
  }
  return vigenere(f.hiding, inscriptionKey(f.word, clean, n), 1);
}

/**
 * The seal on the great door, with the word out of the family's letter. It only breaks for a
 * family who has read the stone, and hands back the square the fires have been counting on.
 */
export async function breakDoorSeal(n: number, stoneKey: string, names: string[], seal: string) {
  const f = family(n);
  const clean = cleanNames(names);
  if (!f || !clean.length || typeof seal !== "string") return null;
  if (stoneKey !== inscriptionKey(f.word, clean, n)) return null;
  if (normalize(seal) !== normalize(f.seal)) return null;
  return { clue: CLUE, square: keyedSquare(f.seal) };
}

/** The final word, spoken at the door. Never the god: that waits at the Oracle. */
export async function speakWord(n: number, seal: string, guess: string) {
  const f = family(n);
  if (!f || typeof seal !== "string" || typeof guess !== "string") return null;
  if (normalize(seal) !== normalize(f.seal)) return null;
  return normalize(guess) === normalize(f.finalWord) ? f.finalWord : null;
}
