"use client";

import "@/components/olympus/journey/journey.css";
import "@/components/olympus/crawl/crawl.css";
import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { carveStone, speakWord } from "@/app/olympus3/actions";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { bronzeTexture, stoneTexture } from "@/components/olympus/crawl/art";
import { CrawlEngine, type WorldEvent } from "@/components/olympus/crawl/engine";
import { TombSound } from "@/components/olympus/crawl/sound";
import { loadSave, writeSave, type TombSave } from "@/components/olympus/crawl/save";
import { MuralTrial } from "@/components/olympus/crawl/trials/MuralTrial";
import { RiddleTablet } from "@/components/olympus/crawl/trials/RiddleTablet";
import { SealDoor } from "@/components/olympus/crawl/trials/SealDoor";
import { TrialShell } from "@/components/olympus/crawl/trials/Shell";
import { StoneWheels } from "@/components/olympus/crawl/trials/StoneWheels";
import { WordGate } from "@/components/olympus/crawl/trials/WordGate";
import {
  CELL,
  ROOM_LIST,
  ROOMS,
  type Room,
  type RoomId,
  type Target,
} from "@/components/olympus/crawl/world";
import { Finale } from "@/components/olympus/journey/Finale";
import { roman } from "@/components/olympus/shared";

type Open = Exclude<Target, { kind: "note" }>;

/** Milliseconds: the close-up fading out, and the camera coming back. */
const LEAVE = 240;
const RETURN = 620;

const LABELS: Record<Open["kind"], string> = {
  tablet: "A riddle",
  mural: "The mural",
  gate: "The mask",
  stone: "The mechanism",
  door: "The great door",
  altar: "The altar",
};

/**
 * A family's tomb: the same trials as /olympus, walked as a game. A T-rex in a hat falls through the
 * roof into the Mural; the doors open once the family has stood before it, and from there every
 * trial is open, with nothing that says which comes first. The canvas (engine.ts) is the world;
 * pressing E on something closes the camera in on it and its close-up opens over the world
 * (trials/*). When a trial is solved the camera comes back and the world has changed, and the big
 * changes get a moment: the camera holds, the bars come in, the controls wait.
 *
 * The chain itself holds the order, checked on the server (app/olympus3/actions.ts): the five
 * riddles fill the mask's crown, its word and the family's names carve the mechanism's plate, the
 * plate says where the letter is, the letter breaks the seal, and the seal shows the square the
 * fires have been counting on since the first step. Pressing the fires' word out on that floor
 * opens the great door by itself.
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
  const [room, setRoom] = useState<RoomId>(save.place?.room ?? "mural");
  const [stamped, setStamped] = useState("");
  const [moved, setMoved] = useState(!!save.place);
  const [muted, setMuted] = useState(false);
  const [cine, setCine] = useState(false);
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
  const dotRef = useRef<SVGRectElement>(null);

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
        engine?.releaseLook();
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
      // The mural lines itself up under its frame instead, once the frame exists (`fitMural`).
      if (worldRef.current && target.kind !== "mural") {
        const at = engine.focus(target);
        worldRef.current.style.removeProperty("--zoom");
        worldRef.current.style.transformOrigin = `${at.x * 100}% ${at.y * 100}%`;
        worldRef.current.dataset.zoom = "";
      }
      setBark(null);
      engine.pause();
      if (target.kind === "mural") {
        engine.faceMural();
        // The camera and the face finder need the machine: once settled, the world burns slowly.
        if (!s.photo) {
          window.setTimeout(() => {
            if (openKind.current === "mural") engine.pause(true);
          }, 1000);
        }
      }
      score.whoosh(0.06, 0.5);
      openKind.current = target.kind;
      setTrial(target);
    },
    [riddles.length, say, score],
  );

  /**
   * Moves the camera so the mural's picture lands exactly under the frame on screen: the scale that
   * makes their widths match, and the one origin that scale leaves the frame's middle fixed on.
   */
  const fitMural = useCallback((frame: DOMRect) => {
    const world = worldRef.current;
    const engine = engineRef.current;
    if (!world || !engine) return;
    const m = engine.muralRect();
    let k = frame.width / m.w;
    if (Math.abs(k - 1) < 0.01) k = 1.01;
    const origin = (from: number, to: number) => (k * from - to) / (k - 1);
    const x = origin(m.x + m.w / 2, frame.x + frame.width / 2);
    const y = origin(m.y + m.h / 2, frame.y + frame.height / 2);
    world.style.transformOrigin = `${x}px ${y}px`;
    world.style.setProperty("--zoom", String(k));
    world.dataset.zoom = "";
    rootRef.current?.style.setProperty("--stone", `${m.stone * k}px`);
  }, []);

  /** A trial solved after a delay: it may have been stepped away from in the meantime. */
  const settle = useCallback(
    (kind: Open["kind"], event: WorldEvent) => {
      if (openKind.current === kind) closeTrial(event);
      else engineRef.current?.play(event);
    },
    [closeTrial],
  );

  // The engine calls these; they always see the latest closures.
  /**
   * Letters pressed on the floor. The server is asked after every press, so the door opens the
   * moment the word is whole; nothing answers for a wrong one, so length gives nothing away.
   */
  const pressed = useCallback(
    (letters: string) => {
      setStamped(letters);
      const { seal, finalWord } = latest.current;
      if (!seal || finalWord || letters.length < 3) return;
      void speakWord(family, seal, letters)
        .then((final) => {
          if (!final || latest.current.finalWord) return;
          patch({ finalWord: final });
          settle(openKind.current ?? "door", { kind: "door" });
          window.setTimeout(() => engineRef.current?.clearStamps(), 3200);
        })
        .catch(() => {});
    },
    [family, patch, settle],
  );

  const handlers = useRef({ openTrial, patch, pressed });
  useEffect(() => {
    handlers.current = { openTrial, patch, pressed };
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
        onStamp: (letters) => handlers.current.pressed(letters),
        onFirstMove: () => setMoved(true),
        onCine: (focus) => {
          const world = worldRef.current;
          if (!world) return;
          setCine(!!focus);
          if (focus) {
            world.style.transformOrigin = `${focus.x * 100}% ${focus.y * 100}%`;
            world.dataset.cine = "";
          } else delete world.dataset.cine;
        },
        onPlace: (x, y) => {
          dotRef.current?.setAttribute("x", String(Math.round(x - 12)));
          dotRef.current?.setAttribute("y", String(Math.round(y - 12)));
        },
      },
      score,
      {
        pictured: start.names.length > 0,
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
      pictured: save.names.length > 0,
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
    rootRef.current?.style.setProperty("--crawl-bronze", `url(${bronzeTexture()})`);
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
        A game seen from above. Arrow keys or W A S D move, E looks at what is nearby, M turns the
        sound off.
      </p>
      <div ref={worldRef} className="crawl-world">
        <canvas ref={canvasRef} aria-hidden="true" className="crawl-canvas block" />
      </div>
      <div aria-hidden="true" className="crawl-vignette" />
      <div aria-hidden="true" data-on={cine ? "" : undefined} className="crawl-bars" />

      {/* What stays on screen: whose tomb this is, the map, what the dinosaur can do right here. */}
      <div className={trial || cine ? "crawl-hud crawl-hud-hidden" : "crawl-hud"}>
        <p aria-hidden="true" className="crawl-group font-olympus">
          <span>Group</span> {roman(family)}
        </p>
        <TombMap room={room} visited={save.visited} solved={save} dotRef={dotRef} />
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
            <kbd className="crawl-key">D</kbd>
            <i>or</i>
            <kbd className="crawl-key">←</kbd>
            <kbd className="crawl-key">↑</kbd>
            <kbd className="crawl-key">↓</kbd>
            <kbd className="crawl-key">→</kbd> Move
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
          wide={trial.kind === "stone"}
          bare={trial.kind === "mural"}
          plain={trial.kind === "gate"}
          bronze={trial.kind === "stone"}
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
              onFrame={fitMural}
              onDone={(result) => {
                // The picture is on the wall before the frame over it fades, so nothing flickers.
                const settleIn = () => {
                  patch({ photo: result.photo, faces: result.faces, names: result.names });
                  closeTrial({ kind: "mural" });
                };
                if (!result.photo) return settleIn();
                const image = new Image();
                image.onload = () => {
                  engineRef.current?.setFlags({ photo: image });
                  settleIn();
                };
                image.onerror = settleIn;
                image.src = result.photo;
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

/** A room's floor as a path, for the map: its true shape, a run of cells at a time. */
function shapePath(room: Room) {
  let d = "";
  for (let r = 0; r < room.rows; r += 1) {
    let run = -1;
    for (let c = 0; c <= room.cols; c += 1) {
      const on = c < room.cols && room.grid[c + r * room.cols];
      if (on && run < 0) run = c;
      if (!on && run >= 0) {
        d += `M${room.at[0] + run * CELL} ${room.at[1] + r * CELL}h${(c - run) * CELL}v${CELL}h${(run - c) * CELL}z`;
        run = -1;
      }
    }
  }
  return d;
}

const MAP_BOX = (() => {
  const x0 = Math.min(...ROOM_LIST.map((r) => r.at[0]));
  const y0 = Math.min(...ROOM_LIST.map((r) => r.at[1]));
  const x1 = Math.max(...ROOM_LIST.map((r) => r.at[0] + r.W));
  const y1 = Math.max(...ROOM_LIST.map((r) => r.at[1] + r.H));
  return { x0, y0, w: x1 - x0, h: y1 - y0 };
})();
const MAP_PATHS = Object.fromEntries(ROOM_LIST.map((r) => [r.id, shapePath(r)])) as Record<
  RoomId,
  string
>;

/** The map in the corner: every room in its true shape, once seen; the doors out of them, faint. */
function TombMap({
  room,
  visited,
  solved,
  dotRef,
}: {
  room: RoomId;
  visited: RoomId[];
  solved: TombSave;
  dotRef: React.RefObject<SVGRectElement | null>;
}) {
  const seen = new Set(visited);
  const known = new Set<RoomId>(visited);
  for (const id of visited) {
    if (id === "mural" && !solved.names.length) continue;
    for (const door of Object.values(ROOMS[id].doors)) known.add(door.to);
  }
  const done: Partial<Record<RoomId, boolean>> = {
    mural: !!solved.names.length,
    gate: !!solved.word,
    chasm: solved.stoneRead,
    hall: !!solved.square,
    sanctum: !!solved.finalWord,
  };
  return (
    <svg
      aria-hidden="true"
      className="crawl-map"
      viewBox={`${MAP_BOX.x0} ${MAP_BOX.y0} ${MAP_BOX.w} ${MAP_BOX.h}`}
      shapeRendering="crispEdges"
    >
      {ROOM_LIST.filter((r) => known.has(r.id)).map((r) => (
        <g key={r.id}>
          <path
            d={MAP_PATHS[r.id]}
            fill={
              r.id === room
                ? "var(--green-deep)"
                : seen.has(r.id)
                  ? "rgb(255 255 255 / 0.32)"
                  : "rgb(255 255 255 / 0.1)"
            }
          />
          {done[r.id] && r.id !== room ? (
            <rect
              x={r.at[0] + r.W / 2 - 20}
              y={r.at[1] + r.H / 2 - 20}
              width={40}
              height={40}
              fill="var(--green)"
            />
          ) : null}
        </g>
      ))}
      <rect ref={dotRef} width={24} height={24} fill="var(--text)" />
    </svg>
  );
}
