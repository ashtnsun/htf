"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, useTransition } from "react";
import { readInscription } from "@/app/olympus/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { Meander } from "@/components/olympus/Meander";
import {
  inscriptionKey,
  KEY_STEPS,
  keyColumns,
  vigenere,
} from "@/components/olympus/journey/cipher";
import { roman } from "@/components/olympus/journey/numeral";
import { OFFLINE, StageHeading } from "@/components/olympus/journey/parts";
import { OlympusButton } from "@/components/olympus/OlympusButton";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** A wheel not yet turned: its column stays as carved. */
const UNSET = "·";

/**
 * Step IV: a stone carved in a Vigenère cipher, and under it a device of five wheels. Each wheel
 * turns the letters of its own column of the stone (every fifth letter), so the stone reads only
 * when all five stand on the key: the family's word, each letter moved on by the count written
 * under its wheel (cipher.ts `KEY_STEPS`: the names, the group, the exec board). Nothing says
 * the counts start from the word: five wheels after a five-letter word is the hint. A family
 * that misses it can still crack the stone by eye, wheel by wheel, hunting for words (slowly). The letters the focused wheel turns are underlined. Once it reads,
 * the stone wakes and its message (where in the room the family's letter is hidden) sends
 * them looking for it (step V, the herald).
 */
export function Inscription({
  family,
  word,
  names,
  inscription,
  onRead,
}: {
  family: number;
  word: string;
  names: string[];
  inscription: string;
  onRead: () => void;
}) {
  const reduce = useReducedMotionSafe();
  const period = word.length;
  const [wheels, setWheels] = useState<string[]>(() => Array.from({ length: period }, () => UNSET));
  const [focused, setFocused] = useState<number | null>(null);
  const [read, setRead] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const key = wheels.join("");
  const columns = keyColumns(inscription, period);
  const shown = vigenere(inscription, key, -1, period);
  const target = inscriptionKey(word, names, family);
  const awake = key === target;

  function turn(i: number, to: string) {
    if (awake) return;
    const next = wheels.map((w, j) => (j === i ? to : w));
    setWheels(next);
    setError(undefined);
    if (next.join("") !== target) return;
    startTransition(async () => {
      try {
        const found = await readInscription(family, next.join(""), names);
        if (found) setRead(true);
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

  // Words stay whole when the stone wraps; each letter keeps a fixed width so nothing jumps.
  const words = [...inscription.matchAll(/\S+/g)].map((m) => ({
    start: m.index,
    length: m[0].length,
  }));

  return (
    <div className="flex w-full flex-col items-center">
      {/* The word from step III, kept in the page's top-left corner: under the logo bar and its
          Greek key (4rem + 12px), in line with the Families link. On a phone it would crowd the
          heading, so there it heads the column instead. */}
      <div
        className="journey-rise mb-8 self-start md:absolute md:top-[calc(4rem+12px+1.5rem)] md:left-10 md:mb-0"
        style={{ "--d": "100ms" } as React.CSSProperties}
      >
        <p className="sr-only">The word: {word}</p>
        <div aria-hidden="true" className="flex gap-1">
          {[...word].map((ch, i) => (
            <span
              key={i}
              className="flex size-7 items-center justify-center bg-green font-olympus text-sm font-semibold text-bg md:size-9 md:text-base"
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
      <StageHeading stage="inscription" title="The stone" />

      <div
        className={cn(
          "journey-rise mt-8 w-[min(48rem,calc(100vw-2rem))] self-center border border-line-strong bg-surface px-4 py-6 transition-colors duration-1000 sm:px-10 sm:py-8",
          awake && "journey-wake border-green",
        )}
        style={{ "--d": "200ms" } as React.CSSProperties}
      >
        <Meander cell={2} className="text-green-deep" />
        <p className="sr-only">{awake ? inscription : `The stone reads: ${shown}`}</p>
        <p
          aria-hidden="true"
          className="flex flex-wrap justify-center gap-x-[1.1em] gap-y-3 py-8 font-olympus text-[clamp(1.1rem,3.4vw,1.75rem)] font-semibold"
        >
          {words.map(({ start, length }) => (
            <span key={start} aria-hidden="true" className="flex">
              {Array.from({ length }, (_, j) => {
                const i = start + j;
                const column = columns[i];
                const turned = column != null && wheels[column] !== UNSET;
                return (
                  <span
                    key={`${i}-${shown[i]}`}
                    className={cn(
                      "inline-block w-[0.95em] border-b-2 text-center transition-colors duration-500",
                      turned && !reduce && "journey-turn",
                      awake ? "text-green" : turned ? "text-text" : "text-muted/70",
                      !awake && focused !== null && column === focused
                        ? "border-green"
                        : "border-transparent",
                    )}
                    style={{ "--d": `${(i % 12) * 18}ms` } as React.CSSProperties}
                  >
                    {shown[i]}
                  </span>
                );
              })}
            </span>
          ))}
        </p>
        <Meander cell={2} className="text-green-deep" />
      </div>

      <div
        role="group"
        aria-label="The wheels"
        className="journey-rise mt-8 flex items-start justify-center gap-1 sm:gap-3"
        style={{ "--d": "400ms" } as React.CSSProperties}
      >
        {wheels.map((w, i) => (
          <div key={i} className="flex w-[17vw] max-w-32 flex-col items-center">
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              disabled={awake}
              onClick={() => step(i, -1)}
              className="flex h-9 w-12 items-center justify-center text-muted transition-colors hover:text-green disabled:opacity-0 sm:w-14"
            >
              <ChevronUp className="size-5" />
            </button>
            <label htmlFor={`wheel-${i}`} className="sr-only">
              Wheel {roman(i + 1)}, {KEY_STEPS[i]}: type a letter, or turn it with the arrow keys
            </label>
            <input
              id={`wheel-${i}`}
              value={w === UNSET ? "" : w}
              placeholder={UNSET}
              disabled={awake}
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
                "size-12 border-2 bg-surface text-center font-olympus text-2xl font-semibold uppercase caret-transparent transition-colors placeholder:text-muted/50 focus:border-b-green focus-visible:outline-none sm:size-14 sm:text-h3",
                awake ? "anim-olympus-flip border-green" : "border-line-strong",
              )}
              style={awake ? { animationDelay: `${i * 160}ms` } : undefined}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              disabled={awake}
              onClick={() => step(i, 1)}
              className="flex h-9 w-12 items-center justify-center text-muted transition-colors hover:text-green disabled:opacity-0 sm:w-14"
            >
              <ChevronDown className="size-5" />
            </button>
            <p
              aria-hidden="true"
              className={cn(
                "mt-2 text-xs leading-snug text-balance transition-colors duration-500 sm:text-sm",
                awake ? "text-green" : focused === i ? "text-text" : "text-muted",
              )}
            >
              {KEY_STEPS[i]}
            </p>
          </div>
        ))}
      </div>

      <p role="status" className="mt-2 min-h-6 text-sm text-cyan">
        {error}
      </p>

      {awake && read ? (
        <div className="journey-rise mt-2" style={{ "--d": "900ms" } as React.CSSProperties}>
          <OlympusButton onClick={onRead}>Seek the letter</OlympusButton>
        </div>
      ) : awake && pending ? (
        <p role="status" className="mt-2 font-oracle text-xl text-muted italic">
          The stone speaks…
        </p>
      ) : null}
    </div>
  );
}
