"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useTransition } from "react";
import { readInscription } from "@/app/olympus/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { Meander } from "@/components/olympus/Meander";
import {
  inscriptionKey,
  KEY_STEPS,
  keyColumns,
  sentence,
  vigenere,
} from "@/components/olympus/journey/cipher";
import { roman } from "@/components/olympus/journey/numeral";
import { OFFLINE } from "@/components/olympus/journey/parts";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const UNSET = "·";
/** How wide a blank stone looks: a few rows of worn stone, no count of letters. */
const BLANK_ROWS = [34, 28, 31];

/**
 * The stone across the chasm, up close: five wheels under a Vigenère carving, as on /olympus (each
 * wheel turns every fifth letter; the counts under them are never explained). The stone stays blank
 * until the family has both the word and their names, because it is carved from them. The counts
 * are readable from the start: they are how a family learns what else they need. The wheels start
 * on the word once they have it. Read, the stone stays awake for the next visit.
 */
export function StoneWheels({
  family,
  word,
  names,
  carved,
  read,
  onRead,
}: {
  family: number;
  word: string | null;
  names: string[];
  /** Null while the stone is blank. */
  carved: string | null;
  read: boolean;
  onRead: () => void;
}) {
  const reduce = useReducedMotionSafe();
  const live = !!(carved && word && names.length);
  const target = live ? inscriptionKey(word!, names, family) : "";
  const [wheels, setWheels] = useState<string[]>(() =>
    read ? [...target] : word ? [...word] : Array.from({ length: 5 }, () => UNSET),
  );
  const [focused, setFocused] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();
  const key = wheels.join("");
  const awake = read || (live && key === target);
  const columns = carved ? keyColumns(carved, 5) : [];
  const shown = carved ? vigenere(carved, key, -1, 5) : "";

  function turn(i: number, to: string) {
    if (awake || !live) return;
    const next = wheels.map((w, j) => (j === i ? to : w));
    setWheels(next);
    setError(undefined);
    if (next.join("") !== target) return;
    startTransition(async () => {
      try {
        if (await readInscription(family, next.join(""), names)) onRead();
        else setError(OFFLINE);
      } catch {
        setError(OFFLINE);
      }
    });
  }

  function step(i: number, by: 1 | -1) {
    const at = ALPHABET.indexOf(wheels[i]!);
    turn(i, ALPHABET[at < 0 ? (by > 0 ? 0 : 25) : (at + by + 26) % 26]!);
  }

  const words = carved
    ? [...carved.matchAll(/\S+/g)].map((m) => ({ start: m.index, length: m[0].length }))
    : [];

  return (
    <div className="flex w-full flex-col items-center">
      <div
        className={cn(
          "journey-rise w-full transition-colors duration-1000",
          awake && "journey-wake",
        )}
      >
        <Meander cell={2} className="text-green-deep" />
        {carved ? (
          <>
            <p className="sr-only">{awake ? sentence(carved) : `The stone reads: ${shown}`}</p>
            <p
              aria-hidden="true"
              className="flex flex-wrap justify-center gap-x-[1.1em] gap-y-3 py-6 font-olympus text-[clamp(1.1rem,3vw,1.625rem)] font-semibold"
            >
              {words.map(({ start, length }) => (
                <span key={start} className="flex">
                  {Array.from({ length }, (_, j) => {
                    const i = start + j;
                    const column = columns[i];
                    const turned = column != null && wheels[column] !== UNSET;
                    const letter = shown[i];
                    return (
                      <span
                        key={`${i}-${letter}`}
                        className={cn(
                          "inline-block w-[0.95em] border-b-2 text-center transition-colors duration-500",
                          turned && !reduce && "journey-turn",
                          awake ? "text-green" : turned ? "text-text" : "text-muted",
                          !awake && focused !== null && column === focused
                            ? "border-green"
                            : "border-transparent",
                        )}
                        style={{ "--d": `${(i % 12) * 18}ms` } as React.CSSProperties}
                      >
                        {letter}
                      </span>
                    );
                  })}
                </span>
              ))}
            </p>
          </>
        ) : (
          <div aria-hidden="true" className="flex flex-col items-center gap-4 py-8">
            {BLANK_ROWS.map((w) => (
              <span
                key={w}
                className="crawl-worn h-2"
                style={{ width: `${w}rem`, maxWidth: "100%" }}
              />
            ))}
          </div>
        )}
        <Meander cell={2} className="text-green-deep" />
      </div>

      <div
        role="group"
        aria-label="The wheels"
        className="journey-rise mt-6 flex w-full flex-wrap items-start justify-center gap-x-1 gap-y-4 sm:gap-x-2"
        style={{ "--d": "200ms" } as React.CSSProperties}
      >
        {wheels.map((w, i) => (
          <div key={i} className="flex w-26 flex-col items-center sm:w-30">
            <div className="flex items-center">
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                disabled={awake || !live}
                onClick={() => step(i, -1)}
                className="flex h-12 w-7 items-center justify-center text-muted transition-colors hover:text-green disabled:opacity-0"
              >
                <ChevronLeft className="size-5" />
              </button>
              <label htmlFor={`wheel-${i}`} className="sr-only">
                Wheel {roman(i + 1)}, {KEY_STEPS[i]}: type a letter, or turn it with the arrow keys
              </label>
              <input
                id={`wheel-${i}`}
                value={w === UNSET ? "" : w}
                placeholder={UNSET}
                disabled={awake || !live}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={2}
                onFocus={(e) => {
                  setFocused(i);
                  e.currentTarget.select();
                }}
                onBlur={() => setFocused(null)}
                onChange={(e) => {
                  const letter = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z]/g, "")
                    .slice(-1);
                  turn(i, letter || UNSET);
                  if (letter) document.getElementById(`wheel-${i + 1}`)?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    step(i, -1);
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    step(i, 1);
                  } else if (e.key === "ArrowLeft") {
                    document.getElementById(`wheel-${i - 1}`)?.focus();
                  } else if (e.key === "ArrowRight") {
                    document.getElementById(`wheel-${i + 1}`)?.focus();
                  }
                }}
                className={cn(
                  "crawl-tile size-12 text-center font-olympus text-2xl font-semibold uppercase caret-transparent placeholder:text-muted/50 focus:border-b-green focus-visible:outline-none",
                  awake && "anim-olympus-flip border-green text-green",
                )}
                style={awake ? { animationDelay: `${i * 160}ms` } : undefined}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                disabled={awake || !live}
                onClick={() => step(i, 1)}
                className="flex h-12 w-7 items-center justify-center text-muted transition-colors hover:text-green disabled:opacity-0"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
            <p
              aria-hidden="true"
              className={cn(
                "mt-2 text-center text-xs leading-snug text-balance transition-colors duration-500 sm:text-sm",
                awake ? "text-green" : focused === i ? "text-text" : "text-muted",
              )}
            >
              {KEY_STEPS[i]}
            </p>
          </div>
        ))}
      </div>

      <p role="status" className="mt-1 min-h-6 text-sm text-cyan">
        {error}
      </p>
    </div>
  );
}
