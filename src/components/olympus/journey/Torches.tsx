"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { checkFinal } from "@/app/olympus/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { OFFLINE, StageHeading, shake, wrong } from "@/components/olympus/journey/parts";
import { roman } from "@/components/olympus/journey/numeral";
import { OlympusButton } from "@/components/olympus/OlympusButton";
import { cn } from "@/lib/utils";

/** The brazier, 9 × 7 cells under its flame: bowl, stem, foot. White. */
const BRAZIER = [
  "#########",
  ".#######.",
  "..#####..",
  "....#....",
  "....#....",
  "...###...",
  "..#####..",
];
/** Three frames of flame, 9 × 7 cells over the bowl: `#` green, `+` deep green at the edges. */
const FLAMES = [
  ["....#....", "...+#....", "...##+...", "..+###...", "..####+..", ".+#####+.", ".#######."],
  ["....#....", "....#+...", "...+##...", "...###+..", "..+####..", ".+#####+.", ".#######."],
  ["...#.....", "...#+....", "..+##.#..", "..####+..", "..+####..", ".+#####+.", ".#######."],
];
const cellsOf = (rows: readonly string[], ch: string, top = 0) =>
  rows.flatMap((row, y) => [...row].flatMap((c, x) => (c === ch ? [{ x, y: y + top }] : [])));
const BRAZIER_CELLS = cellsOf(BRAZIER, "#", 7);
const FLAME_CELLS = FLAMES.map((f) => ({ bright: cellsOf(f, "#"), edge: cellsOf(f, "+") }));
const EMBERS = [
  { x: 3, y: 6 },
  { x: 5, y: 6 },
];

/** Milliseconds: the opening flare, each letter's fires, the dark between, the pause at the end. */
const T = { FLARE: 900, AFTER_FLARE: 1400, LIT: 2000, DARK: 700, END: 3200 };

type Beat = { left: number; right: number; ms: number };

/** The whole signal as beats: a flare of every torch to say it begins, then each letter. */
function signal(torches: readonly [number, number][]): Beat[] {
  return [
    { left: 5, right: 5, ms: T.FLARE },
    { left: 0, right: 0, ms: T.AFTER_FLARE },
    ...torches.flatMap(([r, c]) => [
      { left: r, right: c, ms: T.LIT },
      { left: 0, right: 0, ms: T.DARK },
    ]),
    { left: 0, right: 0, ms: T.END },
  ];
}

function Torch({ lit, cell }: { lit: boolean; cell: number }) {
  return (
    <svg
      viewBox="0 0 9 14"
      width={9 * cell}
      height={14 * cell}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className="block overflow-visible"
    >
      {lit ? (
        <>
          <rect
            x={-4}
            y={-3}
            width={17}
            height={14}
            className="fill-green opacity-15 [filter:blur(4px)]"
          />
          <g className="journey-flame">
            {FLAME_CELLS.map((f, i) => (
              <g key={i}>
                {f.bright.map(({ x, y }) => (
                  <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} className="fill-green" />
                ))}
                {f.edge.map(({ x, y }) => (
                  <rect
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    width={1}
                    height={1}
                    className="fill-green-deep"
                  />
                ))}
              </g>
            ))}
          </g>
        </>
      ) : (
        EMBERS.map(({ x, y }) => (
          <rect key={x} x={x} y={y} width={1} height={1} className="fill-green-deep" />
        ))
      )}
      {BRAZIER_CELLS.map(({ x, y }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          className={cn("transition-colors duration-300", lit ? "fill-text" : "fill-line-strong")}
        />
      ))}
    </svg>
  );
}

/** One wall: five braziers, the first `lit` burning, counted from the top, one to a row of the square. */
function Wall({ lit, cell }: { lit: number; cell: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex h-16 items-center">
          <Torch lit={i < lit} cell={cell} />
        </div>
      ))}
    </div>
  );
}

/** The one cell written in: I and J, row 2, column 4. */
const IJ = 8;
const CELL =
  "flex size-16 items-center justify-center border-r border-b border-line-strong font-olympus text-body-lg font-semibold text-text";

/**
 * Polybius's square, empty for the family to fill: five rows of five, each row level with a
 * torch, and only the cell I and J share written in. Each other cell takes one letter; typing
 * moves on to the next cell, Backspace in an empty cell goes back, the arrows move about.
 * Nothing is checked: a wrong square only gives a wrong word.
 */
function Square({ className }: { className?: string }) {
  const [letters, setLetters] = useState<string[]>(() => Array(25).fill(""));
  const cells = useRef<(HTMLInputElement | null)[]>([]);

  /** Focus the nearest open cell from `i` in `step`'s direction, if there is one. */
  function move(i: number, step: number) {
    let next = i + step;
    if (next === IJ) next += step;
    if (next >= 0 && next < 25) cells.current[next]?.focus();
  }

  return (
    <div
      role="group"
      aria-label="Polybius's square"
      className={cn("grid grid-cols-5 border-t border-l border-line-strong", className)}
    >
      {letters.map((letter, i) =>
        i === IJ ? (
          <div key={i} className={cn(CELL, "tracking-[0.1em]")}>
            I/J
          </div>
        ) : (
          <input
            key={i}
            ref={(el) => {
              cells.current[i] = el;
            }}
            value={letter}
            onChange={(e) => {
              const ch = e.target.value
                .toUpperCase()
                .replace(/[^A-Z]/g, "")
                .slice(-1);
              setLetters((all) => all.map((l, j) => (j === i ? ch : l)));
              if (ch) move(i, 1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !letter) {
                e.preventDefault();
                move(i, -1);
              } else if (e.key === "ArrowRight") move(i, 1);
              else if (e.key === "ArrowLeft") move(i, -1);
              else if (e.key === "ArrowDown") move(i, 5);
              else if (e.key === "ArrowUp") move(i, -5);
            }}
            onFocus={(e) => e.target.select()}
            aria-label={`Row ${Math.floor(i / 5) + 1}, column ${(i % 5) + 1}`}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className={cn(
              CELL,
              "bg-transparent text-center uppercase transition-[background-color,box-shadow] focus:bg-surface-2 focus:shadow-[inset_0_-2px_0_var(--green)] focus-visible:outline-none",
            )}
          />
        ),
      )}
    </div>
  );
}

/**
 * Step VI: Polybius's fires. Two walls of five braziers signal the final word one letter at a
 * time: the left wall's lit torches count the row of Polybius's square, the right wall's the
 * column. The square sits between the walls, drawn empty but for the cell I and J share: the
 * family fills in the other 24 letters themselves. Every torch flares once to say the signal
 * begins; then each letter burns and goes dark, and a long dark ends the word before it loops.
 * Nothing gives away the word's length. A wrong reading costs nothing but the shake: the family
 * can try again at once. Under reduced motion the flames stand still and the whole signal is
 * also written out as counts (always, for screen readers).
 */
export function Torches({
  family,
  word,
  message,
  torches,
  onRead,
}: {
  family: number;
  word: string;
  /** The herald's letter, quoted under the heading. */
  message: string;
  torches: [number, number][];
  onRead: (finalWord: string) => void;
}) {
  const reduce = useReducedMotionSafe();
  const beats = useMemo(() => signal(torches), [torches]);
  const [beat, setBeat] = useState(0);
  const [run, setRun] = useState(0);
  const [guess, setGuess] = useState("");
  const [error, setError] = useState<string>();
  const [solved, setSolved] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (solved) return;
    const id = window.setTimeout(() => setBeat((b) => (b + 1) % beats.length), beats[beat]!.ms);
    return () => window.clearTimeout(id);
  }, [beat, beats, run, solved]);

  const now = solved ? { left: 5, right: 5 } : beats[beat]!;

  function ask(event: FormEvent) {
    event.preventDefault();
    if (!guess.trim() || pending || solved) return;
    startTransition(async () => {
      try {
        const final = await checkFinal(family, word, guess);
        if (final) {
          setSolved(true);
          setGuess(final);
          window.setTimeout(() => onRead(final), reduce ? 300 : 2200);
          return;
        }
        setError("The fires say otherwise.");
        wrong(formRef.current, reduce);
      } catch {
        setError(OFFLINE);
        shake(formRef.current, reduce);
      }
    });
  }

  return (
    <div className="flex w-[min(56rem,calc(100vw-2rem))] flex-col items-center self-center">
      <StageHeading stage="fires" title="The fires" line={`“${message}”`} />

      <div
        className="journey-rise mt-10 grid w-full grid-cols-2 items-start justify-items-center gap-y-8 sm:grid-cols-[auto_auto_auto] sm:justify-between"
        style={{ "--d": "300ms" } as React.CSSProperties}
      >
        <Wall lit={now.left} cell={4} />
        <Square className="order-last col-span-2 sm:order-none sm:col-span-1" />
        <Wall lit={now.right} cell={4} />
      </div>

      <div className="journey-rise mt-6" style={{ "--d": "450ms" } as React.CSSProperties}>
        <OlympusButton
          variant="secondary"
          onClick={() => {
            setBeat(0);
            setRun(run + 1);
          }}
          disabled={solved}
        >
          From the start
        </OlympusButton>
      </div>

      {/* The signal in words, for screen readers always and on screen under reduced motion. */}
      <ol
        className={cn(
          "mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted",
          !reduce && "sr-only",
        )}
      >
        {torches.map(([r, c], i) => (
          <li key={i}>
            Fire {roman(i + 1)}: left {r}, right {c}
          </li>
        ))}
      </ol>

      <form
        ref={formRef}
        onSubmit={ask}
        className="journey-rise mt-8 flex w-full max-w-md flex-col items-center gap-4"
        style={{ "--d": "600ms" } as React.CSSProperties}
      >
        <label
          htmlFor="fires-word"
          className="font-olympus text-sm font-semibold tracking-[0.15em] text-muted uppercase"
        >
          What the fires say
        </label>
        <input
          id="fires-word"
          value={guess}
          onChange={(e) => {
            setGuess(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""));
            setError(undefined);
          }}
          disabled={solved}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={16}
          className={cn(
            "w-full border-b-2 bg-transparent pb-3 text-center font-olympus text-h3 font-semibold tracking-[0.25em] uppercase transition-colors focus:border-green focus-visible:outline-none disabled:opacity-60",
            solved ? "border-green text-green" : "border-line-strong",
          )}
        />
        <div className="flex min-h-7 items-center">
          <p role="status" className={error === OFFLINE ? "text-sm text-cyan" : "sr-only"}>
            {error}
          </p>
        </div>
        <OlympusButton type="submit" pending={pending} disabled={solved}>
          Speak it
        </OlympusButton>
      </form>
    </div>
  );
}
