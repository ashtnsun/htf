/**
 * The family reveal's ciphers, shared by the server (app/olympus/actions.ts, which carves) and
 * the trial (which decodes as the family types or turns). Nothing secret lives here: the
 * messages and keys stay in content/olympus.ts.
 */

/** A Wordle letter: in its place, in the word elsewhere, or not in it. */
export type Mark = "hit" | "near" | "miss";

const A = 65;

/**
 * Vigenère: each letter shifted by the key letter under it (A shifts by 1, so no key letter
 * leaves its column as it was). The key advances on letters only; spaces stay. `dir` 1 carves,
 * -1 reads. `period` is the whole key's length: a key typed only partway reads the columns it
 * covers, and the rest stay carved.
 */
export function vigenere(text: string, key: string, dir: 1 | -1, period = key.length) {
  let k = 0;
  return [...text]
    .map((ch) => {
      if (ch < "A" || ch > "Z") return ch;
      const shift = key[k % Math.max(1, period)];
      k += 1;
      // An unset key letter (a wheel not yet turned) leaves its column as carved.
      if (!shift || shift < "A" || shift > "Z") return ch;
      const s = ((shift.charCodeAt(0) - A + 1) * dir + 26) % 26;
      return String.fromCharCode(((ch.charCodeAt(0) - A + s) % 26) + A);
    })
    .join("");
}

/** Which key letter carves each character of `text` (null for spaces). */
export function keyColumns(text: string, period: number) {
  let k = 0;
  return [...text].map((ch) => (ch < "A" || ch > "Z" ? null : k++ % period));
}

/** Polybius's square: five rows of five letters, I and J sharing a cell. */
export const POLYBIUS = ["ABCDE", "FGHIK", "LMNOP", "QRSTU", "VWXYZ"];

/** A word as torch signals: [row, column], each counted from 1. */
export function polybius(word: string): [number, number][] {
  return [...word.toUpperCase().replace(/J/g, "I")].flatMap((ch) => {
    const r = POLYBIUS.findIndex((row) => row.includes(ch));
    return r < 0 ? [] : [[r + 1, POLYBIUS[r]!.indexOf(ch) + 1] as [number, number]];
  });
}

/** Letters in a first name, ignoring spaces, hyphens and apostrophes. */
export function nameLength(name: string) {
  return (name.match(/\p{L}/gu) ?? []).length;
}

/**
 * The inscription's key is not the word itself: each wheel stands on its letter of the word moved
 * on (or back) by a count only the family can make (Z runs on to A, A back to Z). The same five
 * for every family, written under the wheels and never explained.
 */
export const KEY_STEPS = [
  "+ letters in the shortest name",
  "− faces in the family photo",
  "+ group number × 2",
  "+ letters in the longest name",
  "− number of exec members",
] as const;

/** The exec board: nine members, one god each (content/olympus.ts `FAMILIES`). */
const EXEC_MEMBERS = 9;

/** Each wheel's count, from the family's first names and their group (1-9). */
export function keyShifts(names: readonly string[], group: number) {
  const lengths = names.map(nameLength).filter((n) => n > 0);
  return [
    lengths.length ? Math.min(...lengths) : 0,
    -lengths.length,
    group * 2,
    Math.max(0, ...lengths),
    -EXEC_MEMBERS,
  ];
}

/** The word moved by `keyShifts`: what the wheels must read. */
export function inscriptionKey(word: string, names: readonly string[], group: number) {
  const shifts = keyShifts(names, group);
  return [...word]
    .map((ch, i) => {
      const at = (ch.charCodeAt(0) - A + (shifts[i] ?? 0)) % 26;
      return String.fromCharCode(((at + 26) % 26) + A);
    })
    .join("");
}

/** Names the carvings use, kept capitalised in sentence case. */
const PROPER = ["Polybius", "Lawson Commons", "Olympus"];

/** A carved line in sentence case: "SEEK POLYBIUS…" → "Seek Polybius…". */
export function sentence(text: string) {
  const lower = text.toLowerCase();
  const out = `${lower.charAt(0).toUpperCase()}${lower.slice(1)}.`;
  return PROPER.reduce((line, name) => line.replaceAll(name.toLowerCase(), name), out);
}
