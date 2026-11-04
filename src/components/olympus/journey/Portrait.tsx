"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { nameLength } from "@/components/olympus/journey/cipher";
import { findFaces, loadFaceFinder } from "@/components/olympus/journey/faces";
import { Mural } from "@/components/olympus/journey/Mural";
import { StageHeading, wrong } from "@/components/olympus/journey/parts";
import type { Face } from "@/components/olympus/journey/save";
import { roman } from "@/components/olympus/journey/numeral";
import { OlympusButton } from "@/components/olympus/OlympusButton";
import { cn } from "@/lib/utils";

type Phase = "intro" | "camera" | "carving" | "review" | "naming" | "named";

export type PortraitResult = { photo: string | null; faces: Face[]; names: string[] };

/** The stored photo's width: enough for every face to stay sharp when zoomed, small to keep. */
const STORED = 1280;
/** The search shows for at least this long, even when the faces are found sooner. */
const CARVING = 1500;
/** The preview and the photo are both cut to this, so the photo is what the camera showed. */
const ASPECT = 16 / 9;

function validName(name: string) {
  return nameLength(name) >= 2 && name.trim().length <= 24;
}

/**
 * The camera's frame as the family sees it: mirrored, and cut to 16:9 from the middle the way
 * the preview's object-cover cuts it, at most `width` across.
 */
function still(video: HTMLVideoElement, width = Infinity) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const cw = Math.min(vw, vh * ASPECT);
  const ch = cw / ASPECT;
  const k = Math.min(1, width / cw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cw * k);
  canvas.height = Math.round(ch * k);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
  ctx.drawImage(video, (vw - cw) / 2, (vh - ch) / 2, cw, ch, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Step I, the mural: the family's photo, taken on the laptop's camera, set into the temple
 * wall. The faces are found on the laptop (journey/faces), the family fixes any the finder got
 * wrong (tap a face it missed, tap a frame to take it away), then the mural zooms onto each
 * face in turn and asks for that person's first name. The names
 * are the key to the stone later on (its wheels count the shortest and the longest).
 *
 * From the live camera to the last name the step is one stage (`.portrait-stage`): the frame
 * holds the middle of the screen whatever it shows, the heading above it and the controls
 * under it change in place, so the photo replaces the preview under the flash and nothing moves.
 */
export function Portrait({
  onDone,
  unnumbered = false,
  doneLabel = "Begin the riddles",
  inWorld = false,
}: {
  onDone: (result: PortraitResult) => void;
  /** /olympus3: no step numeral, and the last button says what it does there. */
  unnumbered?: boolean;
  doneLabel?: string;
  /**
   * /olympus3: the frame is the mural on the tomb's wall, from before the camera is even asked
   * for, so there is no first screen of its own: the bare wall shows through the empty frame.
   */
  inWorld?: boolean;
}) {
  const reduce = useReducedMotionSafe();
  const [phase, setPhase] = useState<Phase>("intro");
  const [photo, setPhoto] = useState<string | null>(null);
  const [faces, setFaces] = useState<Face[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [focus, setFocus] = useState(0);
  const [error, setError] = useState<string>();
  const [flash, setFlash] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // The finder loads while the family reads the first screen.
  useEffect(() => {
    loadFaceFinder().catch(() => {});
  }, []);

  async function captured(canvas: HTMLCanvasElement) {
    if (!reduce) setFlash((n) => n + 1);
    const small = document.createElement("canvas");
    small.width = Math.min(STORED, canvas.width);
    small.height = Math.round((small.width * canvas.height) / canvas.width);
    small.getContext("2d")!.drawImage(canvas, 0, 0, small.width, small.height);
    setPhoto(small.toDataURL("image/jpeg", 0.86));
    setFaces([]);
    setNames([]);
    setPhase("carving");
    // The photo paints under the flash before the search holds the main thread.
    await new Promise((done) => window.setTimeout(done, 120));
    const [found] = await Promise.all([
      findFaces(canvas).catch(() => [] as Face[]),
      new Promise((done) => window.setTimeout(done, reduce ? 0 : CARVING)),
    ]);
    setFaces(found);
    setPhase("review");
  }

  const camera = useCamera({
    live: phase === "camera",
    videoRef,
    onFail: (message) => {
      setError(message);
      setPhase("intro");
    },
    onCapture: captured,
  });

  function addFace(at: { x: number; y: number }) {
    const w = faces.length
      ? [...faces.map((f) => f.w)].sort((a, b) => a - b)[Math.floor(faces.length / 2)]!
      : 0.09;
    const h = w * ASPECT;
    const face = {
      x: Math.min(1 - w, Math.max(0, at.x - w / 2)),
      y: Math.min(1 - h, Math.max(0, at.y - h / 2)),
      w,
      h,
    };
    setFaces([...faces, face].sort((a, b) => a.x + a.w / 2 - (b.x + b.w / 2)));
  }

  if (phase === "intro" && !inWorld) {
    return (
      <div className="flex w-full flex-col items-center">
        <StageHeading stage="mural" title="Family Photo" unnumbered={unnumbered} />
        <div className="journey-rise mt-10 flex flex-col items-center gap-6" style={rise(500)}>
          <OlympusButton
            onClick={() => {
              setError(undefined);
              setPhase("camera");
            }}
          >
            Allow camera
          </OlympusButton>
          {error ? (
            <p role="alert" className="max-w-md text-center text-sm text-cyan">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const heading =
    phase === "intro"
      ? { title: "Family Photo" }
      : phase === "camera"
        ? {
            title: camera.seen.length
              ? `${roman(camera.seen.length)} in the frame`
              : "Into the frame",
            line: "Make sure all members are in frame.",
          }
        : phase === "carving"
          ? { title: "Finding every face", line: "Hold still." }
          : phase === "review"
            ? faces.length
              ? {
                  title: `${roman(faces.length)} faces in the stone`,
                  line: "(If anyone was not identified, click on their face to add them)",
                  smallLine: true,
                }
              : {
                  title: "Mark every face",
                  line: "The stone found no one. Tap each face to mark it.",
                }
            : phase === "naming"
              ? { title: "Who is this?" }
              : { title: "Remember these names" };

  const named = names.filter(Boolean).length;
  return (
    <div className="portrait-stage">
      <div className="self-end pb-6">
        <StageHeading stage="mural" steady unnumbered={unnumbered} {...heading} />
      </div>

      <div
        data-frame
        className="journey-rise w-full border border-line-strong p-2"
        style={rise(200)}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-surface">
          {phase === "intro" ? null : phase === "camera" ? (
            <CameraView
              videoRef={videoRef}
              ready={camera.ready}
              seen={camera.seen}
              count={camera.count}
            />
          ) : (
            <Mural
              photo={photo!}
              faces={faces}
              names={phase === "named" ? names : undefined}
              focus={phase === "naming" ? focus : null}
              fade={false}
              onPhotoClick={phase === "review" ? addFace : undefined}
              className={phase === "review" ? "cursor-crosshair" : undefined}
            >
              {phase === "review"
                ? faces.map((f, i) => (
                    <button
                      key={`${f.x}-${f.y}`}
                      type="button"
                      aria-label={`Take away face ${roman(i + 1)}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setFaces(faces.filter((_, j) => j !== i));
                      }}
                      className="group journey-fade absolute border-2 border-green transition-colors hover:border-(--red)"
                      style={{
                        left: `${f.x * 100}%`,
                        top: `${f.y * 100}%`,
                        width: `${f.w * 100}%`,
                        height: `${f.h * 100}%`,
                      }}
                    >
                      <span className="absolute -top-0.5 left-1/2 flex -translate-x-1/2 -translate-y-full items-center gap-1 bg-green px-1.5 font-olympus text-[0.7rem] leading-5 font-semibold text-bg transition-colors group-hover:bg-(--red)">
                        {roman(i + 1)}
                        <X className="size-3" aria-hidden="true" />
                      </span>
                    </button>
                  ))
                : null}
            </Mural>
          )}
          {flash ? (
            <span
              key={flash}
              aria-hidden="true"
              onAnimationEnd={() => setFlash(0)}
              className="journey-flash pointer-events-none absolute inset-0 bg-text"
            />
          ) : null}
        </div>
      </div>

      <div
        key={phase === "naming" ? `naming-${focus}` : phase}
        className="journey-fade flex w-[min(56rem,calc(100vw-2rem))] justify-center self-start pt-8"
        style={phase === "named" ? rise(400 + named * 120) : undefined}
      >
        {phase === "intro" ? (
          <div className="flex flex-col items-center gap-4">
            <OlympusButton
              onClick={() => {
                setError(undefined);
                setPhase("camera");
              }}
            >
              Allow camera
            </OlympusButton>
            {error ? (
              <p role="alert" className="max-w-md text-center text-sm text-cyan">
                {error}
              </p>
            ) : null}
          </div>
        ) : phase === "camera" ? (
          <Shutter disabled={!camera.ready || camera.count !== null} onClick={camera.countdown} />
        ) : phase === "review" ? (
          <div className="flex flex-wrap justify-center gap-4">
            <OlympusButton variant="secondary" onClick={() => setPhase("camera")}>
              Take it again
            </OlympusButton>
            <OlympusButton
              onClick={() => {
                if (!faces.length) return;
                setNames(faces.map(() => ""));
                setFocus(0);
                setPhase("naming");
              }}
            >
              Everyone is here
            </OlympusButton>
          </div>
        ) : phase === "naming" ? (
          <NameFace
            index={focus}
            initial={names[focus] ?? ""}
            onBack={focus > 0 ? () => setFocus(focus - 1) : () => setPhase("review")}
            onName={(name) => {
              const next = names.map((n, i) => (i === focus ? name : n));
              setNames(next);
              if (focus + 1 < faces.length) setFocus(focus + 1);
              else setPhase("named");
            }}
          />
        ) : phase === "named" ? (
          <div className="flex flex-wrap justify-center gap-4">
            <OlympusButton variant="secondary" onClick={() => setPhase("naming")}>
              Change a name
            </OlympusButton>
            <OlympusButton onClick={() => onDone({ photo, faces, names })}>
              {doneLabel}
            </OlympusButton>
          </div>
        ) : (
          <p role="status" className="h-12 font-oracle text-xl text-muted italic">
            Finding every face…
          </p>
        )}
      </div>
    </div>
  );
}

const rise = (d: number) => ({ "--d": `${d}ms` }) as React.CSSProperties;

/**
 * The live camera: the stream while `live`, the faces in view marked twice a second so the
 * family can see who is in the frame, and the countdown (three, two, one, the photo).
 */
function useCamera({
  live,
  videoRef,
  onFail,
  onCapture,
}: {
  live: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onFail: (message: string) => void;
  onCapture: (canvas: HTMLCanvasElement) => void;
}) {
  const reduce = useReducedMotionSafe();
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState<Face[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const handlers = useRef({ onFail, onCapture });
  useEffect(() => {
    handlers.current = { onFail, onCapture };
  });

  useEffect(() => {
    if (!live) return;
    let stream: MediaStream | null = null;
    let stopped = false;
    let busy = false;
    let looking = 0;
    const video = videoRef.current!;

    navigator.mediaDevices
      ?.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
        audio: false,
      })
      .then(async (s) => {
        if (stopped) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        video.srcObject = s;
        await video.play();
        setReady(true);
        looking = window.setInterval(async () => {
          if (busy || !video.videoWidth) return;
          busy = true;
          try {
            const found = await findFaces(still(video, 640), false);
            if (!stopped) setSeen(found);
          } catch {}
          busy = false;
        }, 500);
      })
      .catch((e: unknown) => {
        if (stopped) return;
        const denied = e instanceof DOMException && e.name === "NotAllowedError";
        handlers.current.onFail(
          denied
            ? "The camera was not allowed. Allow it in the address bar, then try again."
            : "The camera would not open.",
        );
      });
    if (!navigator.mediaDevices) handlers.current.onFail("This browser has no camera here.");

    return () => {
      stopped = true;
      window.clearInterval(looking);
      stream?.getTracks().forEach((t) => t.stop());
      setReady(false);
      setSeen([]);
      setCount(null);
    };
  }, [live, videoRef]);

  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  function countdown() {
    const beat = reduce ? 400 : 1000;
    const later = (ms: number, run: () => void) => timers.current.push(window.setTimeout(run, ms));
    setCount(3);
    later(beat, () => setCount(2));
    later(beat * 2, () => setCount(1));
    later(beat * 3, () => {
      const video = videoRef.current;
      if (video) handlers.current.onCapture(still(video));
    });
  }

  return { ready, seen, count, countdown };
}

/** What the frame shows while the camera is live: the mirrored stream, the faces, the count. */
function CameraView({
  videoRef,
  ready,
  seen,
  count,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  ready: boolean;
  seen: Face[];
  count: number | null;
}) {
  return (
    <>
      <video
        ref={videoRef}
        muted
        playsInline
        aria-label="The camera, mirrored"
        className={cn(
          "absolute inset-0 size-full -scale-x-100 object-cover transition-opacity duration-1000",
          ready ? "opacity-100" : "opacity-0",
        )}
      />
      {seen.map((f, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute"
          style={{
            left: `${f.x * 100}%`,
            top: `${f.y * 100}%`,
            width: `${f.w * 100}%`,
            height: `${f.h * 100}%`,
          }}
        >
          <span className="corner-brackets block size-full [--corner-size:0.75rem]" />
        </span>
      ))}
      {count !== null && count > 0 ? (
        <span
          key={count}
          aria-live="assertive"
          className="journey-count absolute inset-0 flex items-center justify-center font-olympus text-[clamp(6rem,20vw,12rem)] font-semibold text-text [text-shadow:0_0_40px_rgb(0_0_0/0.8)]"
        >
          {roman(count)}
        </span>
      ) : null}
      {!ready ? (
        <p className="absolute inset-0 flex items-center justify-center font-oracle text-xl text-muted italic">
          Opening the camera…
        </p>
      ) : null}
    </>
  );
}

/** The shutter's cells: a ring (`#`) round a disc (`o`), 17 × 17. */
const SHUTTER = [
  "......#####......",
  "....#########....",
  "...###.....###...",
  "..##.........##..",
  ".##...ooooo...##.",
  ".##..ooooooo..##.",
  "##..ooooooooo..##",
  "##..ooooooooo..##",
  "##..ooooooooo..##",
  "##..ooooooooo..##",
  "##..ooooooooo..##",
  ".##..ooooooo..##.",
  ".##...ooooo...##.",
  "..##.........##..",
  "...###.....###...",
  "....#########....",
  "......#####......",
];
const SHUTTER_CELL = 4;

function cells(mark: string) {
  return SHUTTER.flatMap((row, y) =>
    [...row].map((ch, x) =>
      ch === mark ? (
        <rect
          key={`${x}-${y}`}
          x={x * SHUTTER_CELL}
          y={y * SHUTTER_CELL}
          width={SHUTTER_CELL}
          height={SHUTTER_CELL}
        />
      ) : null,
    ),
  );
}

/**
 * The camera's shutter in pixel cells: a white ring round a green disc that lights on hover or
 * focus, with the timer named under it.
 */
function Shutter({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  const size = SHUTTER.length * SHUTTER_CELL;
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label="Take the photo"
        aria-describedby="shutter-timer"
        disabled={disabled}
        onClick={onClick}
        className="group p-1 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint disabled:pointer-events-none disabled:opacity-60"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          width={size}
          height={size}
          shapeRendering="crispEdges"
          className="block"
        >
          <g className="fill-text">{cells("#")}</g>
          <g className="fill-green-deep transition-colors group-hover:fill-green group-focus-visible:fill-green">
            {cells("o")}
          </g>
        </svg>
      </button>
      <p
        id="shutter-timer"
        className="font-olympus text-xs font-semibold tracking-[0.2em] text-muted uppercase"
      >
        Three second timer
      </p>
    </div>
  );
}

/** One face's name, asked while the mural is zoomed onto it. */
function NameFace({
  index,
  initial,
  onBack,
  onName,
}: {
  index: number;
  initial: string;
  onBack: () => void;
  onName: (name: string) => void;
}) {
  const reduce = useReducedMotionSafe();
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validName(name)) {
      setError("A first name, at least two letters.");
      wrong(formRef.current, reduce);
      return;
    }
    onName(name.trim());
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-4 sm:flex-nowrap sm:gap-6"
    >
      <OlympusButton variant="secondary" onClick={onBack}>
        Back
      </OlympusButton>
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(undefined);
        }}
        autoFocus
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        maxLength={24}
        placeholder="First name"
        aria-label={`First name of face ${roman(index + 1)}`}
        aria-describedby={error ? `face-${index}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className="order-first w-full min-w-0 border-b-2 border-line-strong bg-transparent pb-2 pl-[0.12em] text-center font-olympus text-h3 font-semibold tracking-[0.12em] uppercase transition-colors placeholder:text-text placeholder:opacity-100 focus:border-green focus-visible:outline-none sm:order-none sm:w-auto sm:flex-1"
      />
      <OlympusButton type="submit">Next face</OlympusButton>
      {/* A wrong name is the shake and the red flash; only a screen reader hears it said. */}
      <p id={`face-${index}-error`} role="status" className="sr-only">
        {error}
      </p>
    </form>
  );
}
