"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { checkRiddle } from "@/app/archive/olympus/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { OFFLINE, shake, wrong } from "@/components/olympus/journey/parts";
import { roman } from "@/components/olympus/journey/numeral";
import { OlympusButton } from "@/components/olympus/OlympusButton";
import { EASE_GLIDE, EASE_SMOOTH } from "@/lib/motion";

/**
 * Step II: the riddles one at a time, each checked on the server before the next appears. The
 * answered riddle fades out quickly; the next one rises in slowly and settles. The answers
 * collect on the columns at the foot of the page (the trial draws those).
 */
export function Riddles({
  family,
  riddles,
  solved,
  onSolved,
}: {
  family: number;
  riddles: string[];
  solved: string[];
  onSolved: (answer: string) => void;
}) {
  const reduce = useReducedMotionSafe();
  const index = solved.length;
  const step = {
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_GLIDE } },
    exit: reduce ? undefined : { opacity: 0, transition: { duration: 0.25, ease: EASE_SMOOTH } },
  } as const;
  return (
    <AnimatePresence mode="wait" initial={false}>
      {index < riddles.length ? (
        <motion.div key={index} className="flex w-full flex-col items-start text-left" {...step}>
          <Riddle
            family={family}
            index={index}
            total={riddles.length}
            riddle={riddles[index]!}
            onSolved={onSolved}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Riddle({
  family,
  index,
  total,
  riddle,
  onSolved,
}: {
  family: number;
  index: number;
  total: number;
  riddle: string;
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
        const answer = await checkRiddle(family, index, guess);
        if (answer) return onSolved(answer);
        setError("The Oracle denies your answer.");
        wrong(formRef.current, reduce);
      } catch {
        setError(OFFLINE);
        shake(formRef.current, reduce);
      }
    });
  }

  return (
    <>
      <p className="journey-rise mb-6 font-olympus text-sm font-semibold tracking-[0.15em] text-green">
        {roman(index + 1)} of {roman(total)}
      </p>
      <p
        className="journey-rise font-oracle text-[1.625rem] leading-snug font-medium text-balance md:text-[2rem]"
        style={{ "--d": "120ms" } as React.CSSProperties}
      >
        {riddle}
      </p>
      <form
        ref={formRef}
        onSubmit={submit}
        className="journey-rise mt-8 flex w-full flex-col items-start gap-8"
        style={{ "--d": "260ms" } as React.CSSProperties}
      >
        <label htmlFor="answer" className="sr-only">
          Your answer
        </label>
        <input
          id="answer"
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value);
            setError(undefined);
          }}
          aria-describedby="answer-status"
          required
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          className="w-full border-b-2 border-line-strong bg-transparent pb-2 text-body-lg text-text transition-colors focus:border-green focus-visible:outline-none"
        />
        {/* A wrong answer is the shake and the red flash; only a screen reader hears it said. */}
        <p
          id="answer-status"
          role="status"
          className={error === OFFLINE ? "-mt-6 text-sm text-cyan" : "sr-only"}
        >
          {error}
        </p>
        <OlympusButton type="submit" pending={pending}>
          Ask the Oracle
        </OlympusButton>
      </form>
    </>
  );
}
