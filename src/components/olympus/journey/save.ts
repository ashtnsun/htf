import type { Mark } from "@/components/olympus/journey/cipher";

/** The steps of a family's journey, in order. */
export const STAGES = [
  "mural",
  "riddles",
  "word",
  "inscription",
  "herald",
  "fires",
  "oracle",
] as const;
export type Stage = (typeof STAGES)[number];

/** Each step's title card (journey/Curtain). Atmosphere, never instructions: no step explains itself. */
export const STAGE_TITLES: Record<Stage, { title: string; line: string }> = {
  mural: { title: "The Mural", line: "Every face is carved into the temple wall." },
  riddles: { title: "The Riddles", line: "The Oracle asks. Answer well." },
  word: { title: "The Word", line: "The Oracle wants a single word." },
  inscription: { title: "The Inscription", line: "A stone, carved in a tongue no one speaks." },
  herald: { title: "The Herald", line: "A sealed letter waits for you. It will not come to you." },
  fires: { title: "The Fires", line: "The fires speak in pairs." },
  oracle: { title: "The Oracle", line: "The Oracle awaits you." },
};

/** A face in the family photo, as fractions of the photo's width and height. */
export type Face = { x: number; y: number; w: number; h: number };

export type Journey = {
  stage: Stage;
  /** The family photo, a JPEG data URL; null when they went on without the camera. */
  photo: string | null;
  /** In naming order, left to right; `names[i]` belongs to `faces[i]`. */
  faces: Face[];
  names: string[];
  /** The riddles' answers as written, in riddle order. */
  solved: string[];
  guesses: { guess: string; marks: Mark[] }[];
  word: string | null;
  /** The inscription as carved, from the server once the word is right. */
  inscription: string | null;
  /** The herald's letter's message, in sentence case, once its seal is broken. */
  message: string | null;
  /** The torch signal, once the seal is broken. */
  torches: [number, number][] | null;
  finalWord: string | null;
  /**
   * When the Oracle speaks again after too many wrong tries (a time from Date.now()); kept in
   * the save so a refresh cannot skip the wait.
   */
  quietUntil: number | null;
};

const EMPTY: Journey = {
  stage: "mural",
  photo: null,
  faces: [],
  names: [],
  solved: [],
  guesses: [],
  word: null,
  inscription: null,
  message: null,
  torches: null,
  finalWord: null,
  quietUntil: null,
};

const keyOf = (family: number) => `olympus-journey:${family}`;

/** Per tab: a refresh keeps a family's place, a new tab (or another laptop) starts over. */
export function load(family: number): Journey {
  try {
    const saved = JSON.parse(sessionStorage.getItem(keyOf(family)) ?? "null") as Journey | null;
    if (saved && STAGES.includes(saved.stage)) return { ...EMPTY, ...saved };
  } catch {}
  return EMPTY;
}

/** The photo is the one large thing kept; if the tab's storage is full, it is the one dropped. */
export function save(family: number, journey: Journey) {
  try {
    sessionStorage.setItem(keyOf(family), JSON.stringify(journey));
  } catch {
    try {
      sessionStorage.setItem(keyOf(family), JSON.stringify({ ...journey, photo: null }));
    } catch {}
  }
}
