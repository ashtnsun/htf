"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { breakDoorSeal, speakWord } from "@/app/olympus3/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { inscriptionKey, sentence } from "@/components/olympus/journey/cipher";
import { roman } from "@/components/olympus/journey/numeral";
import { OFFLINE, shake, wrong } from "@/components/olympus/journey/parts";
import { Seal } from "@/components/olympus/journey/Seal";
import { OlympusButton } from "@/components/olympus/OlympusButton";
import { cn } from "@/lib/utils";

/**
 * The great door of the Hall, up close. First its seal, waiting for the word printed inside the
 * family's letter (found in the room, as the stone says), which only breaks for a family who has
 * read the stone. Broken, the door listens for the word the fires have been spelling since the
 * family walked in; the letters they pressed on the floor are already in the line, and it can be
 * typed instead. The counts are written out under reduced motion, and always for screen readers.
 */
export function SealDoor({
  family,
  word,
  names,
  stoneRead,
  seal,
  clue,
  stamped,
  signal,
  onBroken,
  onWrongWord,
  onSpoken,
}: {
  family: number;
  word: string | null;
  names: string[];
  stoneRead: boolean;
  /** The seal word, once it is broken. */
  seal: string | null;
  clue: string | null;
  stamped: string;
  signal: readonly [number, number][];
  onBroken: (result: { seal: string; clue: string; square: string[] }) => void;
  onWrongWord: () => void;
  onSpoken: (finalWord: string) => void;
}) {
  const reduce = useReducedMotionSafe();
  const [guess, setGuess] = useState(stamped);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submitSeal(event: FormEvent) {
    event.preventDefault();
    const typed = guess.trim();
    if (!typed || pending) return;
    startTransition(async () => {
      try {
        // A family who has not read the stone has no key to send, so the seal holds for them.
        const key = word && stoneRead ? inscriptionKey(word, names, family) : "";
        const opened = await breakDoorSeal(family, key, names, typed);
        if (opened) {
          setGuess("");
          setError(undefined);
          return onBroken({ seal: typed, clue: opened.clue, square: opened.square });
        }
        setError("The seal holds.");
        wrong(formRef.current, reduce);
      } catch {
        setError(OFFLINE);
        shake(formRef.current, reduce);
      }
    });
  }

  function submitWord(event: FormEvent) {
    event.preventDefault();
    if (!guess.trim() || pending || !seal) return;
    startTransition(async () => {
      try {
        const final = await speakWord(family, seal, guess);
        if (final) return onSpoken(final);
        setError("The door does not hear it.");
        wrong(formRef.current, reduce);
        onWrongWord();
        setGuess("");
      } catch {
        setError(OFFLINE);
        shake(formRef.current, reduce);
      }
    });
  }

  const broken = !!seal;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="journey-rise">
        <Seal cell={8} broken={broken} className={broken ? "seal-lit" : "seal-dormant"} />
      </div>
      {broken && clue ? (
        <p
          className="journey-rise mt-6 max-w-xl font-olympus text-lg leading-relaxed font-semibold tracking-[0.1em] text-green uppercase"
          style={{ "--d": "150ms" } as React.CSSProperties}
        >
          {sentence(clue)}
        </p>
      ) : null}
      <form
        ref={formRef}
        onSubmit={broken ? submitWord : submitSeal}
        className="journey-rise mt-6 flex w-full max-w-md flex-col items-center gap-4"
        style={{ "--d": "250ms" } as React.CSSProperties}
      >
        <label htmlFor="door-word" className="sr-only">
          {broken ? "What the fires say" : "The seal"}
        </label>
        <input
          id="door-word"
          value={guess}
          onChange={(e) => {
            setGuess(broken ? e.target.value.toUpperCase().replace(/[^A-Z]/g, "") : e.target.value);
            setError(undefined);
          }}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={24}
          aria-describedby="door-status"
          className={cn(
            "crawl-input w-full pl-[0.12em] text-center font-olympus text-h3 font-semibold tracking-[0.12em] uppercase",
          )}
        />
        <p
          id="door-status"
          role="status"
          className={error === OFFLINE ? "text-sm text-cyan" : "sr-only"}
        >
          {error}
        </p>
        <OlympusButton type="submit" pending={pending}>
          {broken ? "Speak it" : "Break the seal"}
        </OlympusButton>
      </form>
      {broken ? (
        <ol
          className={cn(
            "mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted",
            !reduce && "sr-only",
          )}
        >
          {signal.map(([r, c], i) => (
            <li key={i}>
              Fire {roman(i + 1)}: left {r}, right {c}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
