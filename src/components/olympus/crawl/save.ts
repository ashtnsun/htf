import type { Mark } from "@/components/olympus/journey/cipher";
import type { Face } from "@/components/olympus/journey/save";
import type { RoomId } from "@/components/olympus/crawl/world";

/** A family's place in the tomb, kept per tab: a refresh keeps it, a new tab starts over. */
export type TombSave = {
  /** The family photo, a JPEG data URL, once it is on the wall. */
  photo: string | null;
  faces: Face[];
  names: string[];
  /** Each riddle's answer as written, by riddle, or null. */
  solved: (string | null)[];
  guesses: { guess: string; marks: Mark[] }[];
  quietUntil: number | null;
  word: string | null;
  /** The stone as carved, from the server once the word and the names are both known. */
  carved: string | null;
  stoneRead: boolean;
  seal: string | null;
  clue: string | null;
  square: string[] | null;
  finalWord: string | null;
  place: { room: RoomId; x: number; y: number } | null;
  visited: RoomId[];
};

export const emptySave = (riddles: number): TombSave => ({
  photo: null,
  faces: [],
  names: [],
  solved: Array.from({ length: riddles }, () => null),
  guesses: [],
  quietUntil: null,
  word: null,
  carved: null,
  stoneRead: false,
  seal: null,
  clue: null,
  square: null,
  finalWord: null,
  place: null,
  visited: [],
});

const keyOf = (family: number) => `olympus3:${family}`;

export function loadSave(family: number, riddles: number): TombSave {
  try {
    const saved = JSON.parse(sessionStorage.getItem(keyOf(family)) ?? "null") as TombSave | null;
    if (saved) return { ...emptySave(riddles), ...saved };
  } catch {}
  return emptySave(riddles);
}

/** The photo is the one large thing kept; if the tab's storage is full, it is the one dropped. */
export function writeSave(family: number, save: TombSave) {
  try {
    sessionStorage.setItem(keyOf(family), JSON.stringify(save));
  } catch {
    try {
      sessionStorage.setItem(keyOf(family), JSON.stringify({ ...save, photo: null }));
    } catch {}
  }
}
