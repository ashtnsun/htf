"use client";

import { useEffect, useRef } from "react";
import {
  ALL_STAGES,
  LAYERS,
  SCENE,
  type Cell,
  type Ink,
  type Layer,
  type Stage,
} from "@/components/home/ProcessSprites";
import { cn } from "@/lib/utils";

export type { Stage };

/**
 * Tiny external store for the step the scene shows (an index into `stages`). ProcessScroll
 * sets it from the scroll position; ProcessScene subscribes and patches the SVG directly, so
 * React never re-renders the scene as the page scrolls.
 */
export class StepStore {
  private value = 0;
  private listeners = new Set<(step: number) => void>();
  get() {
    return this.value;
  }
  set(step: number) {
    if (step === this.value) return;
    this.value = step;
    this.listeners.forEach((fn) => fn(step));
  }
  subscribe(fn: (step: number) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}

/* ------------------------------------------------------------------------------------------
   The dissolve. The T-rex stands through every step; what changes between steps (hats, tools,
   the team, the gift …) dissolves cell by cell on the scene's own clock: when the step
   changes, every cell of the outgoing layers flips off and every cell of the incoming layers
   flips on at its own moment within DISSOLVE_MS, in an order set by a hash of the cell's
   position (one of BUCKETS groups, the incoming half a beat behind the outgoing). Cells are
   never half-visible, so the picture stays pixel art all the way through, and because the
   clock is the scene's own the scroll can never stop it halfway: the scene is always either a
   finished step or a dissolve a fraction of a second from finishing. A new step mid-dissolve
   simply retargets it.
------------------------------------------------------------------------------------------- */

const BUCKETS = 12;
const DISSOLVE_MS = 600;
const INK: Record<Ink, string> = {
  green: "var(--green)",
  white: "var(--text)",
  tint: "var(--green)",
  pink: "var(--pink)",
  blue: "var(--blue)",
};
const TINT_OPACITY = 0.28;

function bucketOf(x: number, y: number): number {
  let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) % BUCKETS;
}

/** When a piece flips, in ms after the step changed. */
const delayOf = (bucket: number, incoming: boolean) =>
  ((bucket + (incoming ? 0.5 : 0)) / BUCKETS) * DISSOLVE_MS;

/** One <path> of the scene: the cells of a layer that share an ink and (live) a bucket. */
type Piece = { ink: Ink; bucket: number; d: string };

function piecesOf(cells: readonly Cell[], bucketed: boolean): Piece[] {
  const groups = new Map<string, { ink: Ink; bucket: number; rows: Map<number, Set<number>> }>();
  for (const [x, y, ink = "green"] of cells) {
    const bucket = bucketed ? bucketOf(x, y) : 0;
    const key = `${ink}:${bucket}`;
    let group = groups.get(key);
    if (!group) {
      group = { ink, bucket, rows: new Map() };
      groups.set(key, group);
    }
    let row = group.rows.get(y);
    if (!row) {
      row = new Set();
      group.rows.set(y, row);
    }
    row.add(x);
  }
  return Array.from(groups.values()).map(({ ink, bucket, rows }) => {
    let d = "";
    for (const [y, set] of rows) {
      const xs = Array.from(set).sort((a, b) => a - b);
      let start = xs[0]!;
      let prev = start;
      for (let i = 1; i <= xs.length; i += 1) {
        const x = xs[i];
        if (x === prev + 1) {
          prev = x;
          continue;
        }
        const w = prev - start + 1;
        d += `M${start} ${y}h${w}v1h-${w}z`;
        if (x !== undefined) {
          start = x;
          prev = x;
        }
      }
    }
    return { ink, bucket, d };
  });
}

/** Layers in every step never flip, so they need no buckets (one path per ink). */
const LIVE_PIECES = new Map(
  LAYERS.map((layer) => [
    layer.key,
    piecesOf(layer.cells, layer.stages.length < ALL_STAGES.length),
  ]),
);
const STILL_PIECES = new Map(LAYERS.map((layer) => [layer.key, piecesOf(layer.cells, false)]));

const clampStep = (step: number, last: number) => Math.min(last, Math.max(0, Math.round(step)));

/** The layer's steps as a bitmask over the given stage order. */
const maskOf = (layer: Layer, stages: readonly Stage[]) =>
  stages.reduce((mask, stage, i) => (layer.stages.includes(stage) ? mask | (1 << i) : mask), 0);

const inStep = (mask: number, step: number) => ((mask >> step) & 1) === 1;

/* ------------------------------------------------------------------------------------------
   Component
------------------------------------------------------------------------------------------- */

type ProcessSceneProps = {
  /** The stage order (each step's `graphic`). */
  stages: Stage[];
  /** The step rendered on the server and before the store sends its first value. */
  step: number;
  /** Live step (home page). Without it the scene is a still of `step`. */
  store?: StepStore;
  /** Run the dinos' own motion (the blink, the wave, the hammer …). Off for the stills. */
  animate?: boolean;
  className?: string;
};

/**
 * The process as pixel art on the footer T-rex's own grid: the detective peering through a
 * magnifying glass at a trail (discover), two smaller T-rexes, one pink and one blue,
 * gathered around it as the team (match), the builder in a hard hat hammering bricks
 * (build) and the party dino holding out a gift (deliver). The T-rex stands through every
 * step; everything else dissolves cell by cell when the step changes, on the scene's own
 * clock, and each step's own motion runs while the scene is on that step (`data-mode`).
 * Renders the given step on the server; a `store` then patches the DOM directly.
 * Decoration only, hidden from assistive tech.
 */
export function ProcessScene({
  stages,
  step,
  store,
  animate = true,
  className,
}: ProcessSceneProps) {
  const rootRef = useRef<SVGSVGElement>(null);
  const last = Math.max(0, stages.length - 1);
  const live = store !== undefined;
  const shown = clampStep(step, last);
  const mode = stages[shown];
  const every = (1 << stages.length) - 1;
  const layers = LAYERS.filter((layer) =>
    live
      ? animate || layer.rest !== false
      : layer.rest !== false && mode !== undefined && layer.stages.includes(mode),
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!store || !root) return;
    const pieces = Array.from(root.querySelectorAll<SVGPathElement>("path[data-m]")).map((el) => ({
      el,
      mask: Number(el.dataset.m),
      bucket: Number(el.dataset.b),
      shown: el.getAttribute("opacity") !== "0",
      due: Number.NaN,
    }));
    let frame = 0;
    const flip = (piece: (typeof pieces)[number], on: boolean) => {
      piece.shown = on;
      piece.due = Number.NaN;
      piece.el.setAttribute("opacity", on ? "1" : "0");
    };
    const tick = (now: number) => {
      let pending = false;
      for (const piece of pieces) {
        if (Number.isNaN(piece.due)) continue;
        if (now >= piece.due) flip(piece, !piece.shown);
        else pending = true;
      }
      frame = pending ? requestAnimationFrame(tick) : 0;
    };
    const show = (value: number) => {
      const target = clampStep(value, last);
      const next = stages[target];
      if (next !== undefined && root.dataset.mode !== next) root.dataset.mode = next;
      const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const now = performance.now();
      let pending = false;
      for (const piece of pieces) {
        const wanted = inStep(piece.mask, target);
        if (wanted === piece.shown) {
          piece.due = Number.NaN;
        } else if (instant) {
          flip(piece, wanted);
        } else {
          const due = now + delayOf(piece.bucket, wanted);
          piece.due = Number.isNaN(piece.due) ? due : Math.min(piece.due, due);
          pending = true;
        }
      }
      if (pending && !frame) frame = requestAnimationFrame(tick);
    };
    show(store.get());
    const unsubscribe = store.subscribe(show);
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [store, stages, last]);

  return (
    <div aria-hidden="true" className={cn("relative aspect-[8/5] w-full select-none", className)}>
      <svg
        ref={rootRef}
        viewBox={`0 0 ${SCENE.cols} ${SCENE.rows}`}
        shapeRendering="crispEdges"
        focusable="false"
        data-dino=""
        data-mode={mode}
        className="absolute inset-0 size-full overflow-visible"
      >
        {layers.map((layer) => {
          const mask = maskOf(layer, stages);
          const shared = mask === every;
          const pieces = (live ? LIVE_PIECES : STILL_PIECES).get(layer.key) ?? [];
          return (
            <g
              key={layer.key}
              className={animate ? layer.anim : undefined}
              style={
                animate && layer.delay !== undefined
                  ? { animationDelay: `${layer.delay}s` }
                  : undefined
              }
              opacity={layer.rest === false ? 0 : undefined}
            >
              {pieces.map((piece) => (
                <path
                  key={`${piece.ink}-${piece.bucket}`}
                  d={piece.d}
                  fill={INK[piece.ink]}
                  fillOpacity={piece.ink === "tint" ? TINT_OPACITY : undefined}
                  data-m={live ? mask : undefined}
                  data-b={live ? piece.bucket : undefined}
                  opacity={live && !inStep(mask, shown) ? 0 : undefined}
                />
              ))}
              {layer.eye && animate ? (
                /* The eyelid: the shared T-rex blinks all the time, a teammate only in its step. */
                <rect
                  className={shared ? "anim-eyelid" : "anim-dino-blink"}
                  x={layer.eye.x}
                  y={layer.eye.y}
                  width={1}
                  height={1}
                  fill={INK[layer.eye.ink ?? "green"]}
                  opacity={shared ? undefined : 0}
                  style={
                    layer.eye.delay !== undefined
                      ? { animationDelay: `${layer.eye.delay}s` }
                      : undefined
                  }
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
