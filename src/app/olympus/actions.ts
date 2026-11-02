"use server";

import { CLUE, FAMILIES } from "@content/olympus";
import { FAMILIES as SNAPSHOT } from "@content/olympuz";
import { REVEAL_SPRITES } from "@/components/dino/reveal";
import { inscriptionKey, polybius, vigenere, type Mark } from "@/components/olympus/journey/cipher";
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

function family(n: unknown) {
  return typeof n === "number" && Number.isInteger(n) ? FAMILIES[n - 1] : undefined;
}

/** Whether `key` is family n's word: every step after the Wordle asks for it again. */
function keyed(n: number, key: unknown) {
  const f = family(n);
  return f && typeof key === "string" && normalize(key) === normalize(f.word) ? f : undefined;
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

/**
 * One Wordle guess at the family's word: a mark per letter (green "hit", yellow "near", "miss"),
 * counted the way Wordle counts repeated letters. Right, it also carries the word and the
 * inscription it unlocks, still carved (the family decodes it with the word).
 */
export async function guessWord(
  n: number,
  guess: string,
  names: string[],
): Promise<{ marks: Mark[]; word?: string; inscription?: string } | null> {
  const f = family(n);
  const g = typeof guess === "string" ? guess.toUpperCase().replace(/[^A-Z]/g, "") : "";
  if (!f || g.length !== f.word.length) return null;
  const marks: Mark[] = [...g].map((c, i) => (c === f.word[i] ? "hit" : "miss"));
  const left = [...f.word].filter((c, i) => g[i] !== c);
  marks.forEach((mark, i) => {
    const at = mark === "miss" ? left.indexOf(g[i]!) : -1;
    if (at < 0) return;
    marks[i] = "near";
    left.splice(at, 1);
  });
  if (g !== f.word) return { marks };
  return { marks, word: f.word, inscription: vigenere(f.hiding, stoneKey(n, names)!, 1) };
}

/** The inscription's key for family n: its word moved on by the five counts (cipher.ts). */
function stoneKey(n: number, names: unknown) {
  const f = family(n);
  return f ? inscriptionKey(f.word, cleanNames(names), n) : undefined;
}

/** Whether `key` reads family n's stone (its word moved by the five counts). */
export async function readInscription(n: number, key: string, names: string[]) {
  return !!family(n) && typeof key === "string" && key === stoneKey(n, names);
}

/**
 * The seal on the family's letter (found in the room, step V), typed on the laptop. Right, the
 * letter's message and the torch signal of the final word, one [row, column] per letter;
 * otherwise null. Another family's seal is wrong too.
 */
export async function breakSeal(n: number, key: string, seal: string) {
  const f = keyed(n, key);
  if (!f || typeof seal !== "string" || normalize(seal) !== normalize(f.seal)) return null;
  return { clue: CLUE, torches: polybius(f.finalWord) };
}

/**
 * The final word as written when the family has read the torches right, otherwise null. Never
 * the god: the family takes the word to the Oracle (/oracle), which reveals it to the room.
 */
export async function checkFinal(n: number, key: string, guess: string) {
  const f = keyed(n, key);
  if (!f || typeof guess !== "string" || normalize(guess) !== normalize(f.finalWord)) return null;
  return f.finalWord;
}

/**
 * The Oracle (/oracle): the god behind whichever family's final word this is, otherwise null.
 * The /olympuz snapshot's words (content/olympuz.ts) still open their gods too.
 */
export async function consultOracle(guess: string): Promise<GodReveal | null> {
  if (typeof guess !== "string" || !normalize(guess)) return null;
  const g = normalize(guess);
  let i = FAMILIES.findIndex((f) => normalize(f.finalWord) === g);
  let word = FAMILIES[i]?.finalWord;
  if (i < 0) {
    i = SNAPSHOT.findIndex((f) => normalize(f.word) === g);
    word = SNAPSHOT[i]?.word;
  }
  const f = FAMILIES[i];
  if (!f || !word) return null;
  const sprite = REVEAL_SPRITES[f.god]!;
  // The body is the colour most cells share.
  const counts = sprite.palette.map((_, c) => sprite.cells.filter((v) => v === c + 1).length);
  const color = sprite.palette[counts.indexOf(Math.max(...counts))]!;
  const scene = SCENES[f.god]!;
  return { family: i + 1, god: f.god, exec: f.exec, word, sprite, color, scene };
}
