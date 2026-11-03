"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { checkRiddle } from "@/app/olympus/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { OFFLINE, shake, wrong } from "@/components/olympus/journey/parts";
import { OlympusButton } from "@/components/olympus/OlympusButton";

/**
 * A riddle carved on a wall of the tomb. Any of the five can be read first; each is checked on the
 * server by itself. Answered, the answer is carved under it in green and stays for the next visit.
 */
export function RiddleTablet({
  family,
  index,
  riddle,
  answer,
  onSolved,
}: {
  family: number;
  index: number;
  riddle: string;
  answer: string | null;
  onSolved: (answer: string) => void;
}) {
  const reduce = useReducedMotionSafe();
  const [guess, setGuess] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!guess.trim()) return;
    startTransition(async () => {
      try {
        const found = await checkRiddle(family, index, guess);
        if (found) return onSolved(found);
        setError("The wall does not answer.");
        wrong(formRef.current, reduce);
      } catch {
        setError(OFFLINE);
        shake(formRef.current, reduce);
      }
    });
  }

  return (
    <div className="flex flex-col items-center text-center">
      <p className="journey-rise crawl-carved font-oracle text-[1.625rem] leading-snug font-medium text-balance md:text-[2rem]">
        {riddle}
      </p>
      {answer ? (
        <p
          className="journey-rise mt-8 font-olympus text-h3 font-semibold tracking-[0.12em] text-green uppercase"
          style={{ "--d": "150ms" } as React.CSSProperties}
        >
          {answer}
        </p>
      ) : (
        <form
          ref={formRef}
          onSubmit={submit}
          className="journey-rise mt-8 flex w-full max-w-md flex-col items-center gap-6"
          style={{ "--d": "200ms" } as React.CSSProperties}
        >
          <label htmlFor="tablet-answer" className="sr-only">
            Your answer
          </label>
          <input
            id="tablet-answer"
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value);
              setError(undefined);
            }}
            aria-describedby="tablet-status"
            required
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            className="crawl-input w-full text-center font-oracle text-2xl"
          />
          <p
            id="tablet-status"
            role="status"
            className={error === OFFLINE ? "-mt-3 text-sm text-cyan" : "sr-only"}
          >
            {error}
          </p>
          <OlympusButton type="submit" pending={pending}>
            Carve it
          </OlympusButton>
        </form>
      )}
    </div>
  );
}
