"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { checkRiddle, checkWord } from "@/app/olympus/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { GodRevealView } from "@/components/olympus/GodRevealView";
import { roman, type GodReveal } from "@/components/olympus/shared";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TextField } from "@/components/ui/Field";
import { SplitButton } from "@/components/ui/SplitButton";
import { DURATION, EASE_GLIDE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Progress = { solved: string[]; reveal: GodReveal | null };

const OFFLINE = "Couldn't check that. Try again in a moment.";

/** Per tab: a refresh keeps a family's place, a new tab (or another phone) starts over. */
function load(family: number): Progress {
  try {
    const saved = JSON.parse(sessionStorage.getItem(`olympus:${family}`) ?? "null") as Progress;
    if (Array.isArray(saved?.solved)) return saved;
  } catch {}
  return { solved: [], reveal: null };
}

function save(family: number, progress: Progress) {
  try {
    sessionStorage.setItem(`olympus:${family}`, JSON.stringify(progress));
  } catch {}
}

/** A wrong answer: the element shakes by whole pixels, once. */
function shake(el: HTMLElement | null, reduce: boolean) {
  if (!el || reduce) return;
  el.animate(
    [0, -8, 8, -6, 6, 0].map((x) => ({ transform: `translateX(${x}px)` })),
    { duration: 420, easing: "ease-out" },
  );
}

/**
 * A family's trial: the riddles one at a time (each checked on the server before the next
 * appears), the solved words collecting below with their first letters, then the letters to
 * unscramble, then the reveal.
 */
export function Trial({ family, riddles }: { family: number; riddles: string[] }) {
  const reduce = useReducedMotionSafe();
  const [progress, setProgress] = useState(() => load(family));
  const update = (next: Progress) => {
    setProgress(next);
    save(family, next);
  };
  const { solved, reveal } = progress;

  if (reveal) return <GodRevealView reveal={reveal} />;

  const index = solved.length;
  const step = {
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: reduce ? undefined : { opacity: 0, y: -16 },
    transition: { duration: DURATION.base, ease: EASE_GLIDE },
  } as const;

  return (
    <div className="mt-10">
      <div
        role="img"
        aria-label={`${index} of ${riddles.length} riddles solved`}
        className="flex gap-1.5"
      >
        {riddles.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 transition-colors duration-600",
              i < index ? "bg-green" : "bg-line-strong",
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {index < riddles.length ? (
          <motion.div key={index} className="mt-10" {...step}>
            <RiddleStep
              family={family}
              index={index}
              total={riddles.length}
              riddle={riddles[index]!}
              onSolved={(answer) => update({ solved: [...solved, answer], reveal: null })}
            />
          </motion.div>
        ) : (
          <motion.div key="word" className="mt-10" {...step}>
            <Unscramble
              family={family}
              letters={solved.map((word) => word[0]!.toUpperCase())}
              onSolved={(r) => update({ solved, reveal: r })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {solved.length > 0 ? (
        <section aria-labelledby="solved" className="mt-14 border-t border-line pt-8">
          <Eyebrow as="h2" id="solved" tone="muted">
            Solved
          </Eyebrow>
          <ol className="mt-5 flex flex-col gap-3">
            {solved.map((word, i) => (
              <motion.li
                key={i}
                className="flex items-center gap-4"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: DURATION.reveal, ease: EASE_GLIDE }}
              >
                <span className="flex size-10 shrink-0 items-center justify-center bg-green font-display text-xl font-medium text-bg">
                  {word[0]!.toUpperCase()}
                </span>
                <span className="text-body-lg tracking-[0.12em] text-muted uppercase">{word}</span>
              </motion.li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

function RiddleStep({
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
        setError("Not quite. Try again.");
      } catch {
        setError(OFFLINE);
      }
      shake(formRef.current, reduce);
    });
  }

  return (
    <>
      <Eyebrow tone="green">
        Riddle {roman(index + 1)} of {roman(total)}
      </Eyebrow>
      <p className="mt-5 font-display text-xl leading-snug font-medium text-balance md:text-2xl">
        {riddle}
      </p>
      <form ref={formRef} onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <TextField
          id="answer"
          label="Your answer"
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value);
            setError(undefined);
          }}
          error={error}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
        />
        <SplitButton type="submit" pending={pending} className="self-start">
          Check
        </SplitButton>
      </form>
    </>
  );
}

function Unscramble({
  family,
  letters,
  onSolved,
}: {
  family: number;
  letters: string[];
  onSolved: (reveal: GodReveal) => void;
}) {
  const reduce = useReducedMotionSafe();
  const empty = letters.map(() => null);
  /** Which letter (its index in `letters`) sits in each slot of the word. */
  const [placed, setPlaced] = useState<(number | null)[]>(empty);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const wordRef = useRef<HTMLOListElement>(null);

  function place(i: number) {
    const slot = placed.indexOf(null);
    if (pending || slot < 0 || placed.includes(i)) return;
    const next = placed.with(slot, i);
    setPlaced(next);
    setError(undefined);
    if (!next.includes(null)) check(next.map((j) => letters[j!]).join(""));
  }

  function remove(slot: number) {
    if (!pending) setPlaced(placed.with(slot, null));
  }

  function check(word: string) {
    startTransition(async () => {
      try {
        const reveal = await checkWord(family, word);
        if (reveal) return onSolved(reveal);
        setError("Not the word. Try again.");
      } catch {
        setError(OFFLINE);
      }
      shake(wordRef.current, reduce);
      window.setTimeout(() => setPlaced(empty), reduce ? 0 : 500);
    });
  }

  // On a keyboard, typing a letter places it and Backspace takes the last one back.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Backspace") {
        const last = placed.findLastIndex((p) => p !== null);
        if (last >= 0) remove(last);
        return;
      }
      const i = letters.findIndex(
        (letter, j) => letter === event.key.toUpperCase() && !placed.includes(j),
      );
      if (i >= 0) place(i);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const tile =
    "flex size-14 items-center justify-center border font-display text-h3 font-medium transition-colors";

  return (
    <>
      <Eyebrow tone="green">Final clue</Eyebrow>
      <h2 className="mt-5 font-display text-h3">Unscramble the letters.</h2>
      <p className="mt-3 text-body-lg text-muted">The word points to your god.</p>

      <ol ref={wordRef} aria-label="Your word" className="mt-10 flex gap-2">
        {placed.map((i, slot) => (
          <li key={slot}>
            {i === null ? (
              <span className={cn(tile, "border-dashed border-line-strong")} />
            ) : (
              <button
                type="button"
                onClick={() => remove(slot)}
                aria-label={`Take back ${letters[i]}`}
                className={cn(tile, "border-green bg-green text-bg")}
              >
                {letters[i]}
              </button>
            )}
          </li>
        ))}
      </ol>

      <ul aria-label="Letters" className="mt-4 flex gap-2">
        {letters.map((letter, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => place(i)}
              disabled={placed.includes(i)}
              className={cn(
                tile,
                "hover-corners border-line-strong bg-surface hover:bg-surface-2 disabled:invisible",
              )}
            >
              {letter}
            </button>
          </li>
        ))}
      </ul>

      <p role="status" className="mt-6 min-h-6 text-sm text-cyan">
        {error}
      </p>
    </>
  );
}
