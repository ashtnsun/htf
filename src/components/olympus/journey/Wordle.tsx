"use client";

import { Delete } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { guessWord } from "@/app/archive/olympus/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { Colonnade } from "@/components/olympus/Colonnade";
import type { Mark } from "@/components/olympus/journey/cipher";
import {
  OFFLINE,
  Silence,
  StageHeading,
  shake,
  useQuiet,
  wrong,
} from "@/components/olympus/journey/parts";
import { cn } from "@/lib/utils";

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const LENGTH = 5;
/** Tries in a round. Six wrong and the board clears and the Oracle falls silent for QUIET. */
const ROWS = 6;
const QUIET = 60_000;
/** Milliseconds: each tile's flip, and the wait before the next one turns. */
const FLIP = 520;
const STAGGER = 260;

/**
 * Wordle's marks. "Near" is the board's own gold (the site's palette has no yellow), only ever a
 * tile behind dark text, never text itself. Contrast: dark text on green 8.6:1, on gold 11:1.
 */
const MARK_STYLE: Record<Mark, React.CSSProperties> = {
  hit: { "--mark-bg": "var(--green)", "--mark-fg": "var(--bg)" } as React.CSSProperties,
  near: { "--mark-bg": "#E9C46A", "--mark-fg": "var(--bg)" } as React.CSSProperties,
  miss: { "--mark-bg": "var(--surface-2)", "--mark-fg": "var(--muted)" } as React.CSSProperties,
};
const RANK: Record<Mark, number> = { miss: 1, near: 2, hit: 3 };
const SAY: Record<Mark, string> = {
  hit: "in place",
  near: "elsewhere",
  miss: "not in the word",
};

export type Guess = { guess: string; marks: Mark[] };

/**
 * Step III: the word, played as Wordle. Nothing says where it comes from: seeing that the first
 * letters of the answers on the columns spell it is the puzzle (the columns stand beside the
 * board, and can be scrambled). Marks come from the server, so the word never reaches the
 * browser until it is guessed. Six tries a round; the sixth wrong one clears the board and
 * silences the Oracle for a minute (kept through a refresh). The right word flips green tile by
 * tile, then the inscription.
 */
export function Wordle({
  family,
  solved,
  names,
  guesses,
  quietUntil,
  onGuess,
  onSilence,
  onSolved,
}: {
  family: number;
  /** The riddles' answers, for the columns. */
  solved: string[];
  /** The family's first names: the server carves the inscription with a key made from them. */
  names: string[];
  guesses: Guess[];
  quietUntil: number | null;
  onGuess: (guess: Guess) => void;
  /** Six wrong: clear the board, silent until `until`. */
  onSilence: (until: number) => void;
  onSolved: (word: string, inscription: string) => void;
}) {
  const reduce = useReducedMotionSafe();
  const [letters, setLetters] = useState("");
  const [error, setError] = useState<string>();
  const [won, setWon] = useState(false);
  /** The guess that just came back: its tiles flip; older ones are already turned. */
  const [fresh, setFresh] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const rowRef = useRef<HTMLLIElement>(null);
  const quiet = useQuiet(quietUntil);
  const spent = guesses.length >= ROWS;
  const busy = pending || won || quiet > 0 || spent;

  function type(letter: string) {
    if (busy || letters.length >= LENGTH) return;
    setLetters(letters + letter);
    setError(undefined);
  }

  function back() {
    if (busy) return;
    setLetters(letters.slice(0, -1));
    setError(undefined);
  }

  function enter() {
    if (busy) return;
    if (letters.length < LENGTH) {
      setError("Five letters.");
      wrong(rowRef.current, reduce);
      return;
    }
    startTransition(async () => {
      try {
        const result = await guessWord(family, letters, names);
        if (!result) throw new Error("no answer");
        setFresh(guesses.length);
        onGuess({ guess: letters, marks: result.marks });
        setLetters("");
        const after = reduce ? 300 : STAGGER * (LENGTH - 1) + FLIP + 900;
        if (result.word && result.inscription) {
          setWon(true);
          const word = result.word;
          const inscription = result.inscription;
          window.setTimeout(() => onSolved(word, inscription), after);
        } else if (guesses.length + 1 >= ROWS) {
          window.setTimeout(() => {
            setFresh(null);
            onSilence(Date.now() + QUIET);
          }, after);
        }
      } catch {
        setError(OFFLINE);
        shake(rowRef.current, reduce);
      }
    });
  }

  // The laptop's keyboard types too. A focused on-screen key answers Enter itself, as a click.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Enter") {
        if (!(event.target instanceof HTMLButtonElement)) enter();
      } else if (event.key === "Backspace") back();
      else if (/^[a-z]$/i.test(event.key)) type(event.key.toUpperCase());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Each key in its best mark this round.
  const keyMarks = new Map<string, Mark>();
  for (const { guess, marks } of guesses) {
    [...guess].forEach((ch, i) => {
      const m = marks[i]!;
      if (!keyMarks.has(ch) || RANK[m] > RANK[keyMarks.get(ch)!]) keyMarks.set(ch, m);
    });
  }

  const typing = !won && !spent;
  const empty = Math.max(0, ROWS - guesses.length - (typing ? 1 : 0));
  const tile =
    "flex size-11 items-center justify-center border-2 font-olympus text-2xl font-semibold sm:size-13";
  const key =
    "flex h-12 min-w-0 flex-1 items-center justify-center border transition-colors hover:border-line-strong";

  return (
    <div
      data-reads-keys
      className="flex w-[min(60rem,calc(100vw-2rem))] flex-col items-center self-center"
    >
      <StageHeading stage="word" title="Five letters" />

      <div className="mt-8 flex w-full flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
        <div className="flex flex-col items-center">
          <ol
            aria-label={`Your guesses, ${ROWS - guesses.length} left this round`}
            data-olympus
            className="journey-rise flex flex-col gap-1.5"
            style={{ "--d": "200ms" } as React.CSSProperties}
          >
            {guesses.map(({ guess, marks }, r) => {
              const turning = r === fresh;
              return (
                <li
                  key={r}
                  aria-label={`${guess}: ${marks.map((m, i) => `${guess[i]} ${SAY[m]}`).join(", ")}`}
                  className="flex gap-1.5"
                >
                  {[...guess].map((ch, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className={cn(tile, turning && "journey-flip")}
                      style={{
                        ...MARK_STYLE[marks[i]!],
                        ...(turning
                          ? { "--d": `${i * STAGGER}ms` }
                          : {
                              backgroundColor: "var(--mark-bg)",
                              borderColor: "var(--mark-bg)",
                              color: "var(--mark-fg)",
                            }),
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </li>
              );
            })}
            {typing ? (
              <li
                ref={rowRef}
                aria-label={`Your next guess: ${letters || "empty"}`}
                className="flex gap-1.5"
              >
                {Array.from({ length: LENGTH }, (_, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    data-flash
                    className={cn(
                      tile,
                      quiet > 0
                        ? "border-line"
                        : letters[i]
                          ? "anim-olympus-pop border-muted"
                          : "border-line-strong",
                    )}
                  >
                    {letters[i]}
                  </span>
                ))}
              </li>
            ) : null}
            {Array.from({ length: empty }, (_, r) => (
              <li key={`empty-${r}`} aria-hidden="true" className="flex gap-1.5">
                {Array.from({ length: LENGTH }, (_, i) => (
                  <span key={i} className="size-11 border-2 border-line sm:size-13" />
                ))}
              </li>
            ))}
          </ol>
          <div className="mt-4 flex min-h-7 items-center">
            {quiet > 0 ? (
              <Silence seconds={quiet} line="The Oracle has turned away." />
            ) : (
              <p role="status" className={error === OFFLINE ? "text-sm text-cyan" : "sr-only"}>
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full max-w-md flex-col items-center gap-8">
          <div className="journey-rise w-full" style={{ "--d": "350ms" } as React.CSSProperties}>
            <Colonnade total={solved.length} words={solved} scramble />
          </div>
          <div
            role="group"
            aria-label="Keyboard"
            className="journey-rise flex w-full flex-col gap-1.5"
            style={{ "--d": "500ms" } as React.CSSProperties}
          >
            {KEY_ROWS.map((row, r) => (
              <div key={row} className="flex gap-1.5">
                {r === 1 ? <span aria-hidden="true" className="flex-[0.5]" /> : null}
                {r === 2 ? (
                  <button
                    type="button"
                    onClick={enter}
                    className={cn(
                      key,
                      "flex-[1.5] border-line bg-surface-2 text-xs font-medium tracking-wide uppercase hover:bg-surface",
                    )}
                  >
                    Enter
                  </button>
                ) : null}
                {[...row].map((letter) => {
                  const m = keyMarks.get(letter);
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => type(letter)}
                      aria-label={m ? `${letter}, ${SAY[m]}` : letter}
                      className={cn(
                        key,
                        "font-olympus text-lg font-semibold",
                        m ? "" : "border-line bg-surface-2 hover:bg-surface",
                      )}
                      style={
                        m
                          ? {
                              backgroundColor: MARK_STYLE[m]["--mark-bg" as never],
                              borderColor: "transparent",
                              color: MARK_STYLE[m]["--mark-fg" as never],
                            }
                          : undefined
                      }
                    >
                      {letter}
                    </button>
                  );
                })}
                {r === 2 ? (
                  <button
                    type="button"
                    onClick={back}
                    aria-label="Delete"
                    className={cn(key, "flex-[1.5] border-line bg-surface-2 hover:bg-surface")}
                  >
                    <Delete className="size-5" aria-hidden="true" />
                  </button>
                ) : null}
                {r === 1 ? <span aria-hidden="true" className="flex-[0.5]" /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
