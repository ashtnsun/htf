/**
 * The fires' square. On the archived flow the fires only start once the seal is broken; here
 * they burn from the first step, so the square they count on is keyed: the family's seal word
 * first (repeats dropped), then the rest of the alphabet. Without the seal the counts spell
 * nothing, even to someone who knows Polybius. Nothing secret lives here; the words stay in
 * content/olympus.ts.
 */
const ALPHABET = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

export function keyedSquare(key: string) {
  const letters = [...new Set([...key.toUpperCase().replace(/J/g, "I"), ...ALPHABET])].filter((c) =>
    ALPHABET.includes(c),
  );
  return Array.from({ length: 5 }, (_, r) => letters.slice(r * 5, r * 5 + 5).join(""));
}

/** A word as the fires signal it on `square`: [row, column], each counted from 1. */
export function signalOn(word: string, square: readonly string[]): [number, number][] {
  return [...word.toUpperCase().replace(/J/g, "I")].flatMap((ch) => {
    const r = square.findIndex((row) => row.includes(ch));
    return r < 0 ? [] : [[r + 1, square[r]!.indexOf(ch) + 1] as [number, number]];
  });
}
