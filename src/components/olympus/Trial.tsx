"use client";

import "@/components/olympus/journey/journey.css";
import { useRef, useState } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { Colonnade } from "@/components/olympus/Colonnade";
import { inscriptionKey, sentence, vigenere } from "@/components/olympus/journey/cipher";
import { Curtain } from "@/components/olympus/journey/Curtain";
import { Finale } from "@/components/olympus/journey/Finale";
import { Inscription } from "@/components/olympus/journey/Inscription";
import { Herald } from "@/components/olympus/journey/Herald";
import { Portrait } from "@/components/olympus/journey/Portrait";
import { Riddles } from "@/components/olympus/journey/Riddles";
import { load, save, type Journey, type Stage } from "@/components/olympus/journey/save";
import { Torches } from "@/components/olympus/journey/Torches";
import { Wordle } from "@/components/olympus/journey/Wordle";
import { OlympusButton } from "@/components/olympus/OlympusButton";

type Patch = Partial<Journey> | ((journey: Journey) => Partial<Journey>);

/**
 * A family's trial, on the family's laptop: a chain of steps, each the key to the next
 * (content/olympus.ts has the whole chain). I the mural (the family photo and every first
 * name), II the riddles, III their word as Wordle, IV the inscription the word unlocks, V the
 * herald's letter its message hides in the room, VI the fires the letter explains, and VII the final word, which the
 * family takes to the Oracle (/oracle, on the projectors), where the god is revealed to the room.
 * The god never reaches this laptop.
 *
 * Between steps the curtain (journey/Curtain) closes, shows the next step's title card and opens
 * on it; the step's parts rise in as it opens (`data-held` pauses them until then). Under reduced
 * motion the step changes at once. Progress is kept per tab (journey/save): a refresh keeps the
 * family's place, a new tab starts over.
 */
export function Trial({ family, riddles }: { family: number; riddles: string[] }) {
  const reduce = useReducedMotionSafe();
  const [journey, setJourney] = useState(() => load(family));
  const [view, setView] = useState<Stage>(journey.stage);
  const [curtain, setCurtain] = useState<Stage | null>(null);
  // The latest journey and step, for steps that report back after a delay (a flip, a glow).
  const latest = useRef(journey);
  const shown = useRef(view);

  function show(stage: Stage) {
    shown.current = stage;
    setView(stage);
  }

  function go(patch: Patch) {
    const p = typeof patch === "function" ? patch(latest.current) : patch;
    const next = { ...latest.current, ...p };
    latest.current = next;
    setJourney(next);
    save(family, next);
    if (p.stage && p.stage !== shown.current) {
      if (reduce) show(p.stage);
      else setCurtain(p.stage);
    }
  }

  function restart() {
    try {
      sessionStorage.removeItem(`olympus-journey:${family}`);
    } catch {}
    window.location.reload();
  }

  const { word, inscription, message, torches, finalWord, names } = journey;

  let step: React.ReactNode;
  if (view === "mural") {
    step = <Portrait onDone={(r) => go({ ...r, stage: "riddles" })} />;
  } else if (view === "riddles") {
    step = (
      <Riddles
        family={family}
        riddles={riddles}
        solved={journey.solved}
        onSolved={(answer) =>
          go((j) => {
            const solved = [...j.solved, answer];
            return solved.length >= riddles.length ? { solved, stage: "word" } : { solved };
          })
        }
      />
    );
  } else if (view === "word") {
    step = (
      <Wordle
        family={family}
        solved={journey.solved}
        names={names}
        guesses={journey.guesses}
        quietUntil={journey.quietUntil}
        onGuess={(g) => go((j) => ({ guesses: [...j.guesses, g] }))}
        onSilence={(until) => go({ guesses: [], quietUntil: until })}
        onSolved={(w, carved) => go({ word: w, inscription: carved, stage: "inscription" })}
      />
    );
  } else if (view === "inscription" && word && inscription) {
    step = (
      <Inscription
        family={family}
        word={word}
        names={names}
        inscription={inscription}
        onRead={() => go({ stage: "herald" })}
      />
    );
  } else if (view === "herald" && word && inscription) {
    step = (
      <Herald
        family={family}
        word={word}
        stone={sentence(vigenere(inscription, inscriptionKey(word, names, family), -1))}
        onBroken={(t, m) => go({ torches: t, message: m, stage: "fires" })}
      />
    );
  } else if (view === "fires" && word && torches && message) {
    step = (
      <Torches
        family={family}
        word={word}
        message={message}
        torches={torches}
        onRead={(f) => go({ finalWord: f, stage: "oracle" })}
      />
    );
  } else if (view === "oracle" && finalWord) {
    step = <Finale word={finalWord} />;
  } else {
    // A save that lost a step's data (a cleared tab, an old version): begin again.
    step = (
      <div className="flex flex-col items-center gap-8">
        <p className="font-oracle text-2xl text-muted italic">The trail has gone cold.</p>
        <OlympusButton onClick={restart}>Begin again</OlympusButton>
      </div>
    );
  }

  return (
    <>
      <div
        data-held={curtain ? "" : undefined}
        className={`flex flex-1 flex-col items-center text-center${view === "oracle" ? " justify-center" : ""}`}
      >
        <div key={view} className="flex w-full flex-col items-center">
          {step}
        </div>
        {view === "riddles" ? (
          <div className="mt-auto w-full pt-16">
            <Colonnade total={riddles.length} words={journey.solved} />
          </div>
        ) : null}
      </div>
      {curtain ? (
        <Curtain to={curtain} onCovered={() => show(curtain)} onDone={() => setCurtain(null)} />
      ) : null}
    </>
  );
}
