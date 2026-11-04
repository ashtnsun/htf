"use server";

import { CLUE, FAMILIES } from "@content/olympus";
import { REVEAL_SPRITES } from "@/components/dino/reveal";
import { inscriptionKey, vigenere, type Mark } from "@/components/olympus/journey/cipher";
import { keyedSquare } from "@/components/olympus/crawl/square";
import type { GodReveal, SceneId } from "@/components/olympus/shared";
import { matches, normalize } from "@/lib/olympus/match";

/** What the Oracle builds for each god while REVEAL is held (components/olympus/scenes.ts). */
const SCENES: Record<string, SceneId> = {
  Apollo: "sun",
  Hades: "underworld",
  Athena: "temple",
  Zeus: "olympus",
  Aphrodite: "shell",
  Ares: "army",
  Poseidon: "ocean",
  Hermes: "caduceus",
  Artemis: "forest",
};

/**
 * The tomb's checks (/olympus), and the Oracle's. Every trial is open from the first step, so each of these asks
 * for proof of what comes before it instead of trusting the order: the gate wants the five
 * answers, the stone wants the word and the names, the seal wants the stone's key, the fires'
 * word wants the seal, the altar wants the fires' word. The flow from before the game keeps its
 * own checks in app/archive/olympus/actions.ts, which nothing in a deploy imports.
 */

function family(n: unknown) {
  return typeof n === "number" && Number.isInteger(n) ? FAMILIES[n - 1] : undefined;
}

function cleanNames(names: unknown) {
  return Array.isArray(names) && names.length > 0 && names.length <= 40
    ? names.filter((name): name is string => typeof name === "string" && name.length <= 40)
    : [];
}

/** The answer as written in content/olympus.ts when the guess is right, otherwise null. */
export async function checkRiddle(n: number, index: number, guess: string) {
  const riddle = Number.isInteger(index) ? family(n)?.riddles[index] : undefined;
  if (!riddle || typeof guess !== "string") return null;
  return matches(guess, [riddle.answer, ...(riddle.also ?? [])]) ? riddle.answer : null;
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

/** Whether `key` reads family n's stone (its word moved by the five counts). */
export async function readInscription(n: number, key: string, names: string[]) {
  const f = family(n);
  return !!f && typeof key === "string" && key === inscriptionKey(f.word, cleanNames(names), n);
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

/** The fires' word, spoken at the door. It opens the door and is worth nothing at the Oracle. */
export async function speakWord(n: number, seal: string, guess: string) {
  const f = family(n);
  if (!f || typeof seal !== "string" || typeof guess !== "string") return null;
  if (normalize(seal) !== normalize(f.seal)) return null;
  return normalize(guess) === normalize(f.doorWord) ? f.doorWord : null;
}

/** The word for the Oracle, from the altar past the door. Never the god: that waits at the Oracle. */
export async function takeWord(n: number, seal: string, doorWord: string) {
  const f = family(n);
  if (!f || typeof seal !== "string" || typeof doorWord !== "string") return null;
  if (normalize(seal) !== normalize(f.seal)) return null;
  return normalize(doorWord) === normalize(f.doorWord) ? f.finalWord : null;
}

/**
 * The Oracle (/oracle): the god behind whichever family's final word this is, otherwise null.
 * Only `finalWord` opens it: the archived snapshot's words stopped working on 2026-11-03.
 */
export async function consultOracle(guess: string): Promise<GodReveal | null> {
  if (typeof guess !== "string" || !normalize(guess)) return null;
  const g = normalize(guess);
  const i = FAMILIES.findIndex((f) => normalize(f.finalWord) === g);
  const f = FAMILIES[i];
  if (!f) return null;
  const sprite = REVEAL_SPRITES[f.god]!;
  // The body is the colour most cells share.
  const counts = sprite.palette.map((_, c) => sprite.cells.filter((v) => v === c + 1).length);
  const color = sprite.palette[counts.indexOf(Math.max(...counts))]!;
  const scene = SCENES[f.god]!;
  return { family: i + 1, god: f.god, exec: f.exec, word: f.finalWord, sprite, color, scene };
}
