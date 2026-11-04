"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { checkFinal } from "@/app/archive/olympus/actions";
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

/** `flare`: the opening flare, burning red so it reads apart from the letters. */
function Torch({ lit, flare, cell }: { lit: boolean; flare: boolean; cell: number }) {
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
            className={cn("opacity-15 [filter:blur(4px)]", flare ? "fill-(--red)" : "fill-green")}
          />
          <g className="journey-flame">
            {FLAME_CELLS.map((f, i) => (
              <g key={i}>
                {f.bright.map(({ x, y }) => (
                  <rect
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    width={1}
                    height={1}
                    className={flare ? "fill-(--red)" : "fill-green"}
                  />
                ))}
                {f.edge.map(({ x, y }) => (
                  <rect
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    width={1}
                    height={1}
                    className={flare ? "fill-(--red) opacity-55" : "fill-green-deep"}
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
function Wall({ lit, flare, cell }: { lit: number; flare: boolean; cell: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex h-16 items-center">
          <Torch lit={i < lit} flare={flare} cell={cell} />
        </div>
      ))}
    </div>
  );
}

/** Polybius's square: the alphabet in rows of five, I and J sharing row 2, column 4. */
const SQUARE = [
  ["A", "B", "C", "D", "E"],
  ["F", "G", "H", "I/J", "K"],
  ["L", "M", "N", "O", "P"],
  ["Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z"],
];

/** The square written out, each row level with a torch. */
function Square({ className }: { className?: string }) {
  return (
    <table
      aria-label="Polybius's square"
      className={cn("border-collapse border-t border-l border-line-strong", className)}
    >
      <tbody>
        {SQUARE.map((row, r) => (
          <tr key={r}>
            {row.map((letter, c) => (
              <td
                key={c}
                aria-label={`Row ${r + 1}, column ${c + 1}: ${letter}`}
                className={cn(
                  "size-16 border-r border-b border-line-strong text-center align-middle font-olympus text-body-lg font-semibold text-text",
                  letter.length > 1 && "tracking-[0.1em]",
                )}
              >
                {letter}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Step VI: Polybius's fires. Two walls of five braziers signal the final word one letter at a
 * time: the left wall's lit torches count the row of Polybius's square, the right wall's the
 * column. The square sits between the walls, written out in full. Every torch flares red once
 * to say the signal begins (red so it cannot be read as a letter, 5 and 5 being Z); then each
 * letter burns green and goes dark, and a long dark ends the word before it loops.
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
  const flare = !solved && beat === 0;

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
        <Wall lit={now.left} flare={flare} cell={4} />
        <Square className="order-last col-span-2 sm:order-none sm:col-span-1" />
        <Wall lit={now.right} flare={flare} cell={4} />
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
