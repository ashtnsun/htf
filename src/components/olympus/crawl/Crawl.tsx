"use client";

import "@/components/olympus/journey/journey.css";
import "@/components/olympus/crawl/crawl.css";
import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { carveStone } from "@/app/olympus3/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { stoneTexture } from "@/components/olympus/crawl/art";
import { CrawlEngine, type WorldEvent } from "@/components/olympus/crawl/engine";
import { TombSound } from "@/components/olympus/crawl/sound";
import { loadSave, writeSave, type TombSave } from "@/components/olympus/crawl/save";
import { MuralTrial } from "@/components/olympus/crawl/trials/MuralTrial";
import { RiddleTablet } from "@/components/olympus/crawl/trials/RiddleTablet";
import { SealDoor } from "@/components/olympus/crawl/trials/SealDoor";
import { TrialShell } from "@/components/olympus/crawl/trials/Shell";
import { StoneWheels } from "@/components/olympus/crawl/trials/StoneWheels";
import { WordGate } from "@/components/olympus/crawl/trials/WordGate";
import { ROOM_LIST, ROOMS, type RoomId, type Target } from "@/components/olympus/crawl/world";
import { Finale } from "@/components/olympus/journey/Finale";
import { roman } from "@/components/olympus/shared";

type Open = Exclude<Target, { kind: "note" }>;

/** Milliseconds: the close-up fading out, and the camera coming back. */
const LEAVE = 240;
const RETURN = 620;

const LABELS: Record<Open["kind"], string> = {
  tablet: "A riddle on the wall",
  mural: "The mural",
  gate: "The Word Gate",
  stone: "The stone",
  door: "The great door",
  altar: "The altar",
};

/**
 * A family's tomb: the same trials as /olympus, walked as a game. A T-rex in a hat, nine rooms,
 * every trial open from the first step, and nothing that says which comes first. The canvas
 * (engine.ts) is the world; pressing E on something closes the camera in on it and its close-up
 * opens over the world (trials/*). When a trial is solved the camera comes back and the world has
 * changed: the photo on the mural, a stone in the gate, letters rising in the floor.
 *
 * The chain itself holds the order, checked on the server (app/olympus3/actions.ts): the five
 * riddles fill the gate, the gate's word and the family's names carve the stone, the stone says
 * where the letter is, the letter breaks the seal, and the seal shows the square the fires have
 * been counting on since the first step.
 */
export function Crawl({
  family,
  riddles,
  signal,
}: {
  family: number;
  riddles: string[];
  signal: [number, number][];
}) {
  const reduce = useReducedMotionSafe();
  const [save, setSave] = useState(() => loadSave(family, riddles.length));
  const [trial, setTrial] = useState<Open | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [bark, setBark] = useState<{ text: string; id: number } | null>(null);
  const [title, setTitle] = useState<{ text: string; id: number } | null>(null);
  const [room, setRoom] = useState<RoomId>(save.place?.room ?? "ante");
  const [stamped, setStamped] = useState("");
  const [moved, setMoved] = useState(!!save.place);
  const [muted, setMuted] = useState(false);
  const [score] = useState(() => new TombSound());
  // Where this visit began: React's double mount in dev must not count as a return.
  const [opening] = useState(save);

  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CrawlEngine | null>(null);
  const latest = useRef(save);
  const closing = useRef(false);
  const pendingEvent = useRef<WorldEvent | null>(null);
  const openKind = useRef<Open["kind"] | null>(null);
  const settleTimer = useRef(0);

  const patch = useCallback(
    (p: Partial<TombSave> | ((s: TombSave) => Partial<TombSave>)) => {
      const change = typeof p === "function" ? p(latest.current) : p;
      const next = { ...latest.current, ...change };
      latest.current = next;
      setSave(next);
      writeSave(family, next);
    },
    [family],
  );

  const say = useCallback((text: string) => {
    setBark((b) => ({ text, id: (b?.id ?? 0) + 1 }));
  }, []);

  const closeTrial = useCallback((event?: WorldEvent) => {
    if (closing.current) return;
    closing.current = true;
    window.clearTimeout(settleTimer.current);
    openKind.current = null;
    const engine = engineRef.current;
    const settled = event ?? pendingEvent.current;
    pendingEvent.current = null;
    setLeaving(true);
    const instant = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => {
        setTrial(null);
        setLeaving(false);
        engine?.wake();
        if (worldRef.current) delete worldRef.current.dataset.zoom;
        if (settled) engine?.play(settled);
        rootRef.current?.focus();
        window.setTimeout(
          () => {
            closing.current = false;
            engine?.resume();
          },
          instant ? 0 : RETURN,
        );
      },
      instant ? 0 : LEAVE,
    );
  }, []);

  const openTrial = useCallback(
    (target: Target) => {
      const engine = engineRef.current;
      if (!engine || closing.current) return;
      const s = latest.current;
      if (target.kind === "note") return say(target.text);
      if (target.kind === "gate") {
        if (s.word) return say("It has heard you.");
        const empty = s.solved.filter((answer) => !answer).length;
        if (empty) {
          return say(
            empty === riddles.length
              ? "Five sockets, all of them empty."
              : `${roman(empty)} ${empty === 1 ? "socket is" : "sockets are"} still empty.`,
          );
        }
      }
      const at = engine.focus(target);
      if (worldRef.current) {
        worldRef.current.style.transformOrigin = `${at.x * 100}% ${at.y * 100}%`;
        worldRef.current.dataset.zoom = "";
      }
      setBark(null);
      // The camera and the face finder need the machine: the world stops drawing behind them.
      engine.pause(target.kind === "mural" && !s.photo);
      score.whoosh(0.06, 0.5);
      openKind.current = target.kind;
      setTrial(target);
    },
    [riddles.length, say, score],
  );

  /** A trial solved after a delay: it may have been stepped away from in the meantime. */
  const settle = useCallback(
    (kind: Open["kind"], event: WorldEvent) => {
      if (openKind.current === kind) closeTrial(event);
      else engineRef.current?.play(event);
    },
    [closeTrial],
  );

  // The engine calls these; they always see the latest closures.
  const handlers = useRef({ openTrial, patch });
  useEffect(() => {
    handlers.current = { openTrial, patch };
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const start = opening;
    const engine = new CrawlEngine(
      canvas,
      signal,
      {
        onPrompt: setPrompt,
        onInteract: (target) => handlers.current.openTrial(target),
        onRoom: (id, x, y) => {
          setRoom(id);
          const seen = latest.current.visited.includes(id);
          if (!seen) setTitle((t) => ({ text: ROOMS[id].title, id: (t?.id ?? 0) + 1 }));
          handlers.current.patch((s) => ({
            place: { room: id, x, y },
            visited: seen ? s.visited : [...s.visited, id],
          }));
        },
        onStamp: setStamped,
        onFirstMove: () => setMoved(true),
      },
      score,
      {
        photo: null,
        solved: start.solved.map(Boolean),
        word: start.word,
        carved: !!start.carved,
        stoneRead: start.stoneRead,
        square: start.square,
        final: start.finalWord,
      },
      start.place,
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    engineRef.current = engine;
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __crawl: CrawlEngine }).__crawl = engine;
    }
    engine.start();
    return () => {
      engine.stop();
      engineRef.current = null;
      score.close();
    };
  }, [opening, score, signal]);

  useEffect(() => {
    engineRef.current?.setReduce(reduce);
  }, [reduce]);

  // The world follows the save.
  useEffect(() => {
    engineRef.current?.setFlags({
      solved: save.solved.map(Boolean),
      word: save.word,
      carved: !!save.carved,
      stoneRead: save.stoneRead,
      square: save.square,
      final: save.finalWord,
    });
  }, [save]);

  // The photo is an image the canvas can draw.
  useEffect(() => {
    if (!save.photo) return;
    const image = new Image();
    image.onload = () => engineRef.current?.setFlags({ photo: image });
    image.src = save.photo;
  }, [save.photo]);

  // The stone can be carved once the family has both things it is carved from.
  useEffect(() => {
    if (!save.word || !save.names.length || save.carved) return;
    let stale = false;
    void carveStone(family, save.word, save.names).then((carved) => {
      if (!stale && carved) patch({ carved });
    });
    return () => {
      stale = true;
    };
  }, [family, patch, save.carved, save.names, save.word]);

  useEffect(() => {
    rootRef.current?.style.setProperty("--crawl-stone", `url(${stoneTexture()})`);
    rootRef.current?.focus();
  }, []);

  // A line said by the room fades by itself, and so does a room's name.
  useEffect(() => {
    if (!bark) return;
    const id = window.setTimeout(() => setBark(null), 3800);
    return () => window.clearTimeout(id);
  }, [bark]);
  useEffect(() => {
    if (!title) return;
    const id = window.setTimeout(() => setTitle(null), 2800);
    return () => window.clearTimeout(id);
  }, [title]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.code === "KeyM" && !trial) setMuted(!score.toggle());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [score, trial]);

  const answers = save.solved.filter((a): a is string => !!a);
  const onClose = useCallback(() => closeTrial(), [closeTrial]);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className="crawl fixed inset-0 overflow-hidden bg-black outline-none"
      onPointerDown={() => score.arm()}
    >
      <p className="sr-only">
        A game seen from above. Arrow keys or W A S D move, E looks at what is nearby, Space dashes,
        M turns the sound off.
      </p>
      <div ref={worldRef} className="crawl-world">
        <canvas ref={canvasRef} aria-hidden="true" className="crawl-canvas block" />
      </div>
      <div aria-hidden="true" className="crawl-vignette" />

      {/* What stays on screen: whose tomb this is, the map, what the dinosaur can do right here. */}
      <div className={trial ? "crawl-hud crawl-hud-hidden" : "crawl-hud"}>
        <p aria-hidden="true" className="crawl-group font-olympus">
          <span>Group</span> {roman(family)}
        </p>
        <TombMap room={room} visited={save.visited} solved={save} />
        <button
          type="button"
          onClick={() => setMuted(!score.toggle())}
          aria-label={muted ? "Turn the sound on" : "Turn the sound off"}
          aria-pressed={muted}
          className="crawl-sound"
        >
          {muted ? (
            <VolumeX className="size-4" aria-hidden="true" />
          ) : (
            <Volume2 className="size-4" aria-hidden="true" />
          )}
          <kbd className="crawl-key" aria-hidden="true">
            M
          </kbd>
        </button>

        {title ? (
          <p key={title.id} aria-hidden="true" className="crawl-title font-olympus">
            {title.text}
          </p>
        ) : null}
        {stamped && room === "hall" ? (
          <ol aria-label={`Pressed: ${stamped}`} className="crawl-stamps">
            {[...stamped].map((letter, i) => (
              <li key={i} className="font-olympus">
                {letter}
              </li>
            ))}
          </ol>
        ) : null}

        <div className="crawl-foot">
          <p key={bark?.id} role="status" className="crawl-bark font-oracle">
            {bark?.text}
          </p>
          <p aria-live="polite" className="crawl-prompt font-olympus">
            {prompt ? (
              <>
                <kbd className="crawl-key" aria-hidden="true">
                  E
                </kbd>{" "}
                {prompt}
              </>
            ) : null}
          </p>
        </div>
        <div
          aria-hidden="true"
          data-moved={moved ? "" : undefined}
          className="crawl-legend font-olympus"
        >
          <span>
            <kbd className="crawl-key">W</kbd>
            <kbd className="crawl-key">A</kbd>
            <kbd className="crawl-key">S</kbd>
            <kbd className="crawl-key">D</kbd> Walk
          </span>
          <span>
            <kbd className="crawl-key">Space</kbd> Dash
          </span>
          {stamped && room === "hall" ? (
            <span>
              <kbd className="crawl-key">⌫</kbd> Lift a letter
            </span>
          ) : null}
        </div>
      </div>

      {trial ? (
        <TrialShell
          label={LABELS[trial.kind]}
          leaving={leaving}
          onClose={onClose}
          wide={trial.kind === "gate" || trial.kind === "stone"}
          bare={trial.kind === "mural"}
        >
          {trial.kind === "tablet" ? (
            <RiddleTablet
              family={family}
              index={trial.index}
              riddle={riddles[trial.index]!}
              answer={save.solved[trial.index] ?? null}
              onSolved={(answer) => {
                const index = trial.index;
                patch((s) => ({ solved: s.solved.map((a, i) => (i === index ? answer : a)) }));
                pendingEvent.current = { kind: "tablet", index };
                settleTimer.current = window.setTimeout(() => closeTrial(), reduce ? 500 : 1500);
              }}
            />
          ) : trial.kind === "mural" ? (
            <MuralTrial
              photo={save.photo}
              faces={save.faces}
              names={save.names}
              onDone={(result) => {
                patch({ photo: result.photo, faces: result.faces, names: result.names });
                closeTrial({ kind: "mural" });
              }}
            />
          ) : trial.kind === "gate" ? (
            <WordGate
              family={family}
              answers={answers}
              guesses={save.guesses}
              quietUntil={save.quietUntil}
              onGuess={(g) => patch((s) => ({ guesses: [...s.guesses, g] }))}
              onSilence={(until) => patch({ guesses: [], quietUntil: until })}
              onSolved={(word) => {
                patch({ word });
                settle("gate", { kind: "word" });
              }}
            />
          ) : trial.kind === "stone" ? (
            <StoneWheels
              family={family}
              word={save.word}
              names={save.names}
              carved={save.carved}
              read={save.stoneRead}
              onRead={() => {
                patch({ stoneRead: true });
                pendingEvent.current = { kind: "stone" };
              }}
            />
          ) : trial.kind === "door" ? (
            <SealDoor
              family={family}
              word={save.word}
              names={save.names}
              stoneRead={save.stoneRead}
              seal={save.seal}
              clue={save.clue}
              stamped={stamped}
              signal={signal}
              onBroken={({ seal, clue, square }) => {
                patch({ seal, clue, square });
                pendingEvent.current = { kind: "square" };
              }}
              onWrongWord={() => engineRef.current?.clearStamps()}
              onSpoken={(finalWord) => {
                patch({ finalWord });
                engineRef.current?.clearStamps();
                closeTrial({ kind: "door" });
              }}
            />
          ) : save.finalWord ? (
            <Finale word={save.finalWord} />
          ) : null}
        </TrialShell>
      ) : null}
    </div>
  );
}

/** The map in the corner: rooms seen, and the doors out of them, like any dungeon's. */
function TombMap({ room, visited, solved }: { room: RoomId; visited: RoomId[]; solved: TombSave }) {
  const CELL_W = 16;
  const CELL_H = 11;
  const GAP = 3;
  const cols = ROOM_LIST.map((r) => r.at[0]);
  const rows = ROOM_LIST.map((r) => r.at[1]);
  const minCol = Math.min(...cols);
  const minRow = Math.min(...rows);
  const W = (Math.max(...cols) - minCol + 1) * (CELL_W + GAP) - GAP;
  const H = (Math.max(...rows) - minRow + 1) * (CELL_H + GAP) - GAP;
  const seen = new Set(visited);
  const known = new Set<RoomId>(visited);
  for (const id of visited) {
    for (const door of Object.values(ROOMS[id].doors)) known.add(door.to);
  }
  const done: Partial<Record<RoomId, boolean>> = {
    mural: !!solved.photo,
    gate: !!solved.word,
    chasm: solved.stoneRead,
    hall: !!solved.finalWord,
  };
  return (
    <svg
      aria-hidden="true"
      className="crawl-map"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      shapeRendering="crispEdges"
    >
      {ROOM_LIST.filter((r) => known.has(r.id)).map((r) => {
        const x = (r.at[0] - minCol) * (CELL_W + GAP);
        const y = (r.at[1] - minRow) * (CELL_H + GAP);
        const here = r.id === room;
        return (
          <g key={r.id}>
            <rect
              x={x}
              y={y}
              width={CELL_W}
              height={CELL_H}
              fill={here ? "var(--green)" : seen.has(r.id) ? "var(--line-strong)" : "transparent"}
              stroke={here ? "var(--green)" : "var(--line-strong)"}
              strokeWidth={1}
            />
            {done[r.id] ? (
              <rect
                x={x + 6}
                y={y + 4}
                width={4}
                height={3}
                fill={here ? "var(--bg)" : "var(--green)"}
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
