"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { breakDoorSeal } from "@/app/olympus3/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { inscriptionKey, sentence } from "@/components/olympus/journey/cipher";
import { roman } from "@/components/olympus/journey/numeral";
import { OFFLINE, shake, wrong } from "@/components/olympus/journey/parts";
import { Seal } from "@/components/olympus/journey/Seal";
import { OlympusButton } from "@/components/olympus/OlympusButton";
import { cn } from "@/lib/utils";

/**
 * The great door's seal, up close, waiting for the word printed inside the family's letter (found in
 * the room, as the stone says), which only breaks for a family who has read the stone. Broken, this
 * shows the clue and nothing to answer: the door opens only from the floor, by pressing the fires'
 * word on the square that rises when this is closed. The counts are written out under reduced
 * motion, and always for screen readers.
 */
export function SealDoor({
  family,
  word,
  names,
  stoneRead,
  seal,
  clue,
  signal,
  onBroken,
}: {
  family: number;
  word: string | null;
  names: string[];
  stoneRead: boolean;
  /** The seal word, once it is broken. */
  seal: string | null;
  clue: string | null;
  signal: readonly [number, number][];
  onBroken: (result: { seal: string; clue: string; square: string[] }) => void;
}) {
  const reduce = useReducedMotionSafe();
  const [guess, setGuess] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const clueRef = useRef<HTMLParagraphElement>(null);
  const broken = !!seal;

  // The field the focus was in has gone, so it moves to what took its place.
  useEffect(() => {
    if (broken) clueRef.current?.focus();
  }, [broken]);

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

  return (
    <div className="flex flex-col items-center text-center">
      <div className="journey-rise">
        <Seal cell={8} broken={broken} className={broken ? "seal-lit" : "seal-dormant"} />
      </div>
      {broken ? (
        <>
          {clue ? (
            <p
              ref={clueRef}
              tabIndex={-1}
              className="journey-rise mt-6 max-w-xl font-olympus text-lg leading-relaxed font-semibold tracking-[0.1em] text-green uppercase focus:outline-none"
              style={{ "--d": "150ms" } as React.CSSProperties}
            >
              {sentence(clue)}
            </p>
          ) : null}
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
        </>
      ) : (
        <form
          ref={formRef}
          onSubmit={submitSeal}
          className="journey-rise mt-6 flex w-full max-w-md flex-col items-center gap-4"
          style={{ "--d": "250ms" } as React.CSSProperties}
        >
          <label htmlFor="door-word" className="sr-only">
            The seal
          </label>
          <input
            id="door-word"
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value);
              setError(undefined);
            }}
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={24}
            aria-describedby="door-status"
            className="crawl-input w-full pl-[0.12em] text-center font-olympus text-h3 font-semibold tracking-[0.12em] uppercase"
          />
          <p
            id="door-status"
            role="status"
            className={error === OFFLINE ? "text-sm text-cyan" : "sr-only"}
          >
            {error}
          </p>
          <OlympusButton type="submit" pending={pending}>
            Break the seal
          </OlympusButton>
        </form>
      )}
    </div>
  );
}
