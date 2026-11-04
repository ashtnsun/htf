"use client";

import { Delete } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { guessGate } from "@/app/olympus/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { Colonnade } from "@/components/olympus/Colonnade";
import { MASK_QUIET, MASK_TRIES } from "@/components/olympus/crawl/save";
import type { Mark } from "@/components/olympus/journey/cipher";
import { OFFLINE, Silence, shake, useQuiet, wrong } from "@/components/olympus/journey/parts";
import { cn } from "@/lib/utils";

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const LENGTH = 5;
const ROWS = MASK_TRIES;
const QUIET = MASK_QUIET;
const FLIP = 520;
const STAGGER = 260;

/** Wordle's marks: gold only ever a tile behind dark text. */
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
 * The Mask, up close: Wordle, nothing but its grid, the five columns and the
 * keys. Nothing says the word comes from the answers on the columns. The server gives no marks
 * until all five riddles are answered, so it cannot be played instead of them; the shell keeps the
 * mask silent until then. Six tries, then a minute's silence, kept through a refresh.
 */
export function WordGate({
  family,
  answers,
  guesses,
  quietUntil,
  onGuess,
  onSilence,
  onSolved,
}: {
  family: number;
  answers: string[];
  guesses: Guess[];
  quietUntil: number | null;
  onGuess: (guess: Guess) => void;
  onSilence: (until: number) => void;
  onSolved: (word: string) => void;
}) {
  const reduce = useReducedMotionSafe();
  const [letters, setLetters] = useState("");
  const [error, setError] = useState<string>();
  const [won, setWon] = useState(false);
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
        const result = await guessGate(family, letters, answers);
        if (!result) throw new Error("no answer");
        setFresh(guesses.length);
        onGuess({ guess: letters, marks: result.marks });
        setLetters("");
        const after = reduce ? 300 : STAGGER * (LENGTH - 1) + FLIP + 900;
        if (result.word) {
          setWon(true);
          const word = result.word;
          window.setTimeout(() => onSolved(word), after);
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

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // Only Backspace repeats: E held as the mask opened must not fill the row.
      if (event.repeat && event.key !== "Backspace") return;
      if (event.key === "Enter") {
        if (!(event.target instanceof HTMLButtonElement)) enter();
      } else if (event.key === "Backspace") back();
      else if (/^[a-z]$/i.test(event.key)) type(event.key.toUpperCase());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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
    "crawl-tile flex size-11 items-center justify-center font-olympus text-2xl font-semibold";
  const key =
    "flex h-11 min-w-0 flex-1 items-center justify-center border transition-colors hover:border-line-strong";

  return (
    <div className="m-auto flex w-full flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
      <div className="flex flex-col items-center">
        <ol
          aria-label={`Your guesses, ${ROWS - guesses.length} left this round`}
          data-olympus
          className="journey-rise flex flex-col gap-1.5"
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
                  className={cn(tile, letters[i] && quiet === 0 && "anim-olympus-pop")}
                >
                  {letters[i]}
                </span>
              ))}
            </li>
          ) : null}
          {Array.from({ length: empty }, (_, r) => (
            <li key={`empty-${r}`} aria-hidden="true" className="flex gap-1.5">
              {Array.from({ length: LENGTH }, (_, i) => (
                <span key={i} className="crawl-tile crawl-tile-empty size-11" />
              ))}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex min-h-7 items-center">
          {quiet > 0 ? (
            <Silence seconds={quiet} line="The mask has gone cold." />
          ) : (
            <p role="status" className={error === OFFLINE ? "text-sm text-cyan" : "sr-only"}>
              {error}
            </p>
          )}
        </div>
        <div className="journey-rise w-full" style={{ "--d": "150ms" } as React.CSSProperties}>
          <Colonnade total={answers.length} words={answers} scramble />
        </div>
        {/* A key clicked with the mouse keeps no focus, or Enter would press it again, not submit. */}
        <div
          role="group"
          aria-label="Keyboard"
          onMouseDown={(event) => event.preventDefault()}
          className="journey-rise flex w-full flex-col gap-1.5"
          style={{ "--d": "300ms" } as React.CSSProperties}
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
  );
}
