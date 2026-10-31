"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Delete } from "lucide-react";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { checkRiddle, checkWord } from "@/app/olympus/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { Colonnade } from "@/components/olympus/Colonnade";
import { GodRevealView } from "@/components/olympus/GodRevealView";
import { roman, type GodReveal } from "@/components/olympus/shared";
import { TextField } from "@/components/ui/Field";
import { SplitButton } from "@/components/ui/SplitButton";
import { EASE_GLIDE, EASE_SMOOTH } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Progress = { solved: string[]; reveal: GodReveal | null };

const OFFLINE = "The Oracle is silent. Try again in a moment.";

/**
 * Per tab: a refresh keeps a family's place, a new tab (or another phone) starts over. Only the
 * solved word is kept once the family is through, never the reveal itself: the god, the exec and
 * the dinosaur are asked of the server again on every load, so a changed sprite or name shows up
 * on a refresh instead of a stale copy.
 */
type Saved = { solved: string[]; word: string | null };

function load(family: number): Saved {
  try {
    const saved = JSON.parse(sessionStorage.getItem(`olympus:${family}`) ?? "null") as {
      solved?: unknown;
      word?: string | null;
      reveal?: { word?: string } | null;
    } | null;
    if (Array.isArray(saved?.solved)) {
      // `reveal` is how the first version saved a finished family.
      return { solved: saved.solved as string[], word: saved.word ?? saved.reveal?.word ?? null };
    }
  } catch {}
  return { solved: [], word: null };
}

function save(family: number, progress: Progress) {
  try {
    const saved: Saved = { solved: progress.solved, word: progress.reveal?.word ?? null };
    sessionStorage.setItem(`olympus:${family}`, JSON.stringify(saved));
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
 * appears), then the final word, then the reveal. The solved words stand on their columns at the
 * foot of the page (every column there from the start, held at the bottom by `mt-auto`, so
 * nothing moves as words arrive or riddles change length).
 */
export function Trial({ family, riddles }: { family: number; riddles: string[] }) {
  const reduce = useReducedMotionSafe();
  const [saved] = useState(() => load(family));
  const [progress, setProgress] = useState<Progress>({ solved: saved.solved, reveal: null });
  // A family that was already through: fetch its reveal fresh (the page waits blank meanwhile).
  const [restoring, setRestoring] = useState(saved.word !== null);
  useEffect(() => {
    if (saved.word === null) return;
    checkWord(family, saved.word)
      .then((reveal) => setProgress((p) => ({ ...p, reveal })))
      .catch(() => {})
      .finally(() => setRestoring(false));
  }, [family, saved.word]);
  const update = (next: Progress) => {
    setProgress(next);
    save(family, next);
  };
  const { solved, reveal } = progress;

  if (reveal) return <GodRevealView reveal={reveal} />;
  if (restoring) return <div className="min-h-80" aria-hidden="true" />;

  const index = solved.length;
  // The answered riddle fades out quickly; the next one rises in slowly and settles.
  const step = {
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_GLIDE } },
    exit: reduce ? undefined : { opacity: 0, transition: { duration: 0.25, ease: EASE_SMOOTH } },
  } as const;

  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <AnimatePresence mode="wait" initial={false}>
        {index < riddles.length ? (
          <motion.div key={index} className="flex w-full flex-col items-start text-left" {...step}>
            <RiddleStep
              family={family}
              index={index}
              total={riddles.length}
              riddle={riddles[index]!}
              onSolved={(answer) => update({ solved: [...solved, answer], reveal: null })}
            />
          </motion.div>
        ) : (
          <motion.div key="word" className="flex w-full flex-col items-center" {...step}>
            <FinalWord
              family={family}
              length={riddles.length}
              onSolved={(r) => update({ solved, reveal: r })}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-auto w-full pt-16">
        <Colonnade total={riddles.length} words={solved} scramble={index === riddles.length} />
      </div>
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
        setError("The Oracle denies your answer.");
      } catch {
        setError(OFFLINE);
      }
      shake(formRef.current, reduce);
    });
  }

  return (
    <>
      <p className="mb-6 font-olympus text-sm font-semibold tracking-[0.15em] text-green">
        {roman(index + 1)} of {roman(total)}
      </p>
      <p className="font-oracle text-[1.625rem] leading-snug font-medium text-balance md:text-[2rem]">
        {riddle}
      </p>
      <form ref={formRef} onSubmit={submit} className="mt-8 flex w-full flex-col items-start gap-8">
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
          className="w-full [&_label]:sr-only"
        />
        <SplitButton type="submit" pending={pending}>
          Ask the Oracle
        </SplitButton>
      </form>
    </>
  );
}

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
/** Milliseconds: each tile's flip, and the wait before the next one starts. */
const FLIP = 500;
const STAGGER = 250;

/**
 * The final word, played like Wordle: one row of empty tiles (a letter pops in as it is typed),
 * an on-screen keyboard, Enter to ask. Nothing gives the letters away; the family has to see
 * that the first letters of its answers spell it. A wrong word shakes the row and stays to be
 * edited (no per-letter colours, which would hand over the order); the right one flips to
 * green tile by tile, then the reveal takes over.
 */
function FinalWord({
  family,
  length,
  onSolved,
}: {
  family: number;
  length: number;
  onSolved: (reveal: GodReveal) => void;
}) {
  const reduce = useReducedMotionSafe();
  const [letters, setLetters] = useState("");
  const [error, setError] = useState<string>();
  const [won, setWon] = useState(false);
  const [pending, startTransition] = useTransition();
  const rowRef = useRef<HTMLOListElement>(null);
  const busy = pending || won;

  function type(letter: string) {
    if (busy || letters.length >= length) return;
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
    if (letters.length < length) {
      setError("Not enough letters.");
      shake(rowRef.current, reduce);
      return;
    }
    startTransition(async () => {
      try {
        const reveal = await checkWord(family, letters);
        if (reveal) {
          setWon(true);
          // The reveal waits for the last tile to finish flipping.
          window.setTimeout(
            () => onSolved(reveal),
            reduce ? 0 : STAGGER * (length - 1) + FLIP + 600,
          );
          return;
        }
        setError("The Oracle denies your word.");
      } catch {
        setError(OFFLINE);
      }
      shake(rowRef.current, reduce);
    });
  }

  // A physical keyboard types too. A focused on-screen key answers Enter itself, as a click.
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

  const key =
    "flex h-14 min-w-0 flex-1 items-center justify-center border border-line bg-surface-2 transition-colors hover:border-line-strong hover:bg-surface";

  return (
    <>
      <h2 className="font-olympus text-h3 font-semibold">The final word</h2>
      <p className="mt-3 text-body-lg text-muted">One word, the sign of your god.</p>

      <ol
        ref={rowRef}
        aria-label={`Your word, ${length} letters`}
        data-olympus
        className="mt-10 flex justify-center gap-2"
      >
        {Array.from({ length }, (_, i) => (
          <li
            key={i}
            className={cn(
              "flex size-14 items-center justify-center border-2 font-olympus text-h3 font-semibold sm:size-16",
              won
                ? "anim-olympus-flip border-muted"
                : letters[i]
                  ? "anim-olympus-pop border-muted"
                  : "border-line-strong",
            )}
            style={won ? { animationDelay: `${i * STAGGER}ms` } : undefined}
          >
            {letters[i]}
          </li>
        ))}
      </ol>

      <p role="status" className="mt-5 min-h-6 text-sm text-cyan">
        {error}
      </p>

      <div
        role="group"
        aria-label="Keyboard"
        className="mt-6 flex w-full max-w-lg flex-col gap-1.5"
      >
        {KEY_ROWS.map((row, r) => (
          <div key={row} className="flex gap-1.5">
            {r === 1 ? <span aria-hidden="true" className="flex-[0.5]" /> : null}
            {r === 2 ? (
              <button
                type="button"
                onClick={enter}
                className={cn(key, "flex-[1.5] text-xs font-medium tracking-wide uppercase")}
              >
                Enter
              </button>
            ) : null}
            {[...row].map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => type(letter)}
                className={cn(key, "font-olympus text-lg font-semibold")}
              >
                {letter}
              </button>
            ))}
            {r === 2 ? (
              <button
                type="button"
                onClick={back}
                aria-label="Delete"
                className={cn(key, "flex-[1.5]")}
              >
                <Delete className="size-5" aria-hidden="true" />
              </button>
            ) : null}
            {r === 1 ? <span aria-hidden="true" className="flex-[0.5]" /> : null}
          </div>
        ))}
      </div>
    </>
  );
}
