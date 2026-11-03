"use client";

import { useRef, useState } from "react";
import { consultOracle } from "@/app/olympus/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { GodRevealView } from "@/components/olympus/GodRevealView";
import { RevealGate } from "@/components/olympus/RevealGate";
import type { GodReveal } from "@/components/olympus/shared";
import { OlympusButton } from "@/components/olympus/OlympusButton";

/**
 * The Oracle (/oracle): the exec laptop on the projectors. Nothing on screen but a box for the
 * word a family solved on /olympus and the REVEAL button under it. Holding REVEAL asks the server
 * as the hold starts: for the right word the god's scene builds over the screen as the button
 * fills and a full hold opens the god to the whole room; a wrong one builds nothing, then shakes
 * the box and the charge drains away.
 * "Next group" clears it for the next family. Nothing is kept: a refresh starts over.
 */
export function Oracle() {
  const reduce = useReducedMotionSafe();
  const [reveal, setReveal] = useState<GodReveal | null>(null);
  /** Pixels per sprite cell on the reveal: as big as fits the screen's height, up to 16. */
  const [cell, setCell] = useState(16);
  // The Oracle's answer to the word being held: its scene builds while REVEAL fills.
  const [answer, setAnswer] = useState<GodReveal | null>(null);
  const [guess, setGuess] = useState("");
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const askingRef = useRef<Promise<GodReveal | null>>(null);

  function press() {
    if (!guess.trim()) {
      inputRef.current?.focus();
      return false;
    }
    setStatus("");
    const asking = consultOracle(guess)
      .catch(() => null)
      .then((found) => {
        // Only the latest hold's answer counts.
        if (askingRef.current === asking) setAnswer(found);
        return found;
      });
    askingRef.current = asking;
    return true;
  }

  async function open() {
    const found = await askingRef.current;
    if (found) {
      // Room for the name and the exec under the dinosaur (about 390px with the frame above).
      const fit = Math.floor((window.innerHeight - 390) / found.sprite.height);
      setCell(Math.max(6, Math.min(16, fit)));
      setReveal(found);
      return true;
    }
    setStatus("The Oracle does not know this word.");
    if (!reduce) {
      inputRef.current?.animate(
        [0, -8, 8, -6, 6, 0].map((x) => ({ transform: `translateX(${x}px)` })),
        { duration: 420, easing: "ease-out" },
      );
    }
    return false;
  }

  function next() {
    window.scrollTo(0, 0);
    setReveal(null);
    setAnswer(null);
    setGuess("");
    setStatus("");
  }

  if (reveal) {
    return (
      <div className="flex flex-col items-center">
        <h1 className="sr-only">The Oracle</h1>
        {/* a full screen tall, so the projectors show only the god; the exec scrolls to Next group */}
        <div className="flex min-h-dvh w-full flex-col items-center">
          <GodRevealView reveal={reveal} cell={cell} />
        </div>
        <div className="pt-16">
          <OlympusButton variant="secondary" onClick={next}>
            Next group
          </OlympusButton>
        </div>
      </div>
    );
  }

  return (
    <RevealGate scene={answer?.scene ?? null} onPress={press} onOpen={open}>
      <h1 className="sr-only">The Oracle</h1>
      {/* Up for the room between families; it steps aside once a word is being typed. */}
      <p
        className={`mb-16 font-olympus text-h3 leading-tight font-semibold text-balance transition-opacity duration-700 md:text-h2 ${guess ? "opacity-0" : ""}`}
      >
        Bring your final word to the <span className="text-green">Oracle.</span>
      </p>
      <label htmlFor="oracle-word" className="sr-only">
        Your family&apos;s word
      </label>
      <input
        ref={inputRef}
        id="oracle-word"
        value={guess}
        onChange={(e) => {
          setGuess(e.target.value);
          setStatus("");
          setAnswer(null);
        }}
        aria-describedby="oracle-status"
        autoFocus
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        maxLength={24}
        className="w-[min(36rem,80vw)] border-b-2 border-line-strong bg-transparent pb-3 text-center font-olympus text-display font-semibold tracking-[0.25em] uppercase transition-colors focus:border-green focus-visible:outline-none"
      />
      <p id="oracle-status" role="status" className="sr-only">
        {status}
      </p>
    </RevealGate>
  );
}
