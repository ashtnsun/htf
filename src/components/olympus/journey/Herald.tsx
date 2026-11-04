"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { breakSeal } from "@/app/archive/olympus/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { sentence } from "@/components/olympus/journey/cipher";
import { OFFLINE, StageHeading, shake } from "@/components/olympus/journey/parts";
import { Seal } from "@/components/olympus/journey/Seal";
import { OlympusButton } from "@/components/olympus/OlympusButton";

/**
 * Step V: the herald's letter. The stone told the family where in the room their letter is
 * hidden (a folded A4 sheet printed from /olympus/letters, addressed to their group); this step
 * is only the seal waiting for the word printed inside. Nothing says the letter exists: the
 * stone's line is quoted, and the seal sits there. The server checks the word for this group,
 * so another family's letter does not open it. A wrong word shakes the form, with no silence
 * (they are copying it off paper). Right, the seal lights and the letter's message reads under
 * it, then on to the fires.
 */
export function Herald({
  family,
  word,
  stone,
  onBroken,
}: {
  family: number;
  word: string;
  /** The stone's message (where the letter is), quoted under the heading. */
  stone: string;
  onBroken: (torches: [number, number][], clue: string) => void;
}) {
  const reduce = useReducedMotionSafe();
  const [guess, setGuess] = useState("");
  const [error, setError] = useState<string>();
  const [opened, setOpened] = useState<{ torches: [number, number][]; clue: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (opened)
      messageRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [opened, reduce]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!guess.trim() || pending || opened) return;
    startTransition(async () => {
      try {
        const found = await breakSeal(family, word, guess);
        if (found) {
          setOpened({ torches: found.torches, clue: sentence(found.clue) });
          setError(undefined);
          return;
        }
        setError("The seal holds.");
      } catch {
        setError(OFFLINE);
      }
      shake(formRef.current, reduce);
    });
  }

  return (
    <div className="flex w-full flex-col items-center">
      <StageHeading stage="herald" title="The seal" line={`“${stone}”`} />

      <div className="journey-rise mt-10" style={{ "--d": "250ms" } as React.CSSProperties}>
        <Seal
          cell={10}
          broken={!!opened}
          className={opened ? "seal-lit seal-wake" : "seal-dormant"}
        />
      </div>

      {opened ? (
        <div ref={messageRef} className="mt-8 flex flex-col items-center gap-8">
          <p className="journey-rise max-w-xl text-center font-olympus text-xl leading-relaxed font-semibold tracking-[0.12em] text-green uppercase">
            {opened.clue}
          </p>
          <div className="journey-rise" style={{ "--d": "500ms" } as React.CSSProperties}>
            <OlympusButton onClick={() => onBroken(opened.torches, opened.clue)}>
              Light the fires
            </OlympusButton>
          </div>
        </div>
      ) : (
        <form
          ref={formRef}
          onSubmit={submit}
          className="journey-rise mt-8 flex w-full max-w-sm flex-col items-center gap-3"
          style={{ "--d": "450ms" } as React.CSSProperties}
        >
          <label htmlFor="seal-word" className="sr-only">
            The seal
          </label>
          <input
            id="seal-word"
            value={guess}
            onChange={(e) => {
              setGuess(e.target.value);
              setError(undefined);
            }}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-describedby="seal-word-caption"
            className="w-full border-b-2 border-line-strong bg-transparent pb-2 pl-[0.12em] text-center font-olympus text-h3 font-semibold tracking-[0.12em] uppercase transition-colors focus:border-green focus-visible:outline-none"
          />
          <p
            id="seal-word-caption"
            className="font-olympus text-xs font-semibold tracking-[0.2em] text-muted uppercase"
          >
            The seal
          </p>
          <p role="status" className="min-h-6 text-sm text-cyan">
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
