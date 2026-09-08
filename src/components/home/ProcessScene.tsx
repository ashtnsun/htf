"use client";

import { useEffect, useRef } from "react";
import { DINO_EYE } from "@/components/brand/dino-pixels";
import {
  LAYERS,
  SCENE,
  TREX_ORIGIN,
  type Cell,
  type Ink,
  type Layer,
  type Stage,
} from "@/components/home/ProcessSprites";
import { cn } from "@/lib/utils";

export type { Stage };

/**
 * Tiny external store for the scene's progress (a float from 0 to steps − 1). ProcessScroll
 * writes it every animation frame; ProcessScene subscribes and patches the SVG directly, so
 * React never re-renders the scene sixty times a second.
 */
export class ProgressStore {
  private value = 0;
  private listeners = new Set<(p: number) => void>();
  get() {
    return this.value;
  }
  set(p: number) {
    this.value = p;
    this.listeners.forEach((fn) => fn(p));
  }
  subscribe(fn: (p: number) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}

/* ------------------------------------------------------------------------------------------
   The dissolve. The T-rex stands through every step; what changes between steps (hats, tools,
   the team, the gift …) dissolves cell by cell: every cell belongs to one of BUCKETS groups
   by a hash of its position, and as the progress crosses from one step to the next each
   group flips at its own point of the crossing, outgoing cells off and incoming cells on.
   Cells are never half-visible, so the picture stays pixel art all the way through.
------------------------------------------------------------------------------------------- */

const BUCKETS = 10;
const INK: Record<Ink, string> = {
  green: "var(--green)",
  white: "var(--text)",
  tint: "var(--green)",
};
const TINT_OPACITY = 0.28;

function bucketOf(x: number, y: number): number {
  let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) % BUCKETS;
}

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

const LIVE_PIECES = new Map(LAYERS.map((layer) => [layer.key, piecesOf(layer.cells, true)]));
const STILL_PIECES = new Map(LAYERS.map((layer) => [layer.key, piecesOf(layer.cells, false)]));

const clampProgress = (p: number, last: number) => Math.min(last, Math.max(0, p));

/** The layer's steps as a bitmask over the given stage order. */
const maskOf = (layer: Layer, stages: readonly Stage[]) =>
  stages.reduce((mask, stage, i) => (layer.stages.includes(stage) ? mask | (1 << i) : mask), 0);

/** Whether a piece shows at progress p, from its layer's mask and its bucket. */
function shows(p: number, mask: number, bucket: number, last: number): boolean {
  const q = clampProgress(p, last);
  const j = Math.floor(q);
  const k = Math.min(last, j + 1);
  const t = q - j;
  const inJ = (mask >> j) & 1;
  const inK = (mask >> k) & 1;
  if (inJ && inK) return true;
  const edge = (bucket + 0.5) / BUCKETS;
  if (inJ) return t < edge;
  if (inK) return t >= edge;
  return false;
}

/* ------------------------------------------------------------------------------------------
   Component
------------------------------------------------------------------------------------------- */

type ProcessSceneProps = {
  /** The stage order (each step's `graphic`). */
  stages: Stage[];
  /** Progress rendered on the server and before the store sends its first value. */
  progress: number;
  /** Live progress (home page). Without it the scene is a still of the nearest step. */
  store?: ProgressStore;
  /** Run the dinos' own motion (the blink, the wave, the hammer …). Off for the stills. */
  animate?: boolean;
  className?: string;
};

/**
 * The process as pixel art on the footer T-rex's own grid: the detective peering through a
 * magnifying glass at a trail (discover), the team gathering around it: a triceratops, a
 * stegosaurus and a pterodactyl (match), the builder in a hard hat hammering bricks (build)
 * and the party dino handing a gift to the partner (deliver). The T-rex stands through every
 * step; everything else dissolves cell by cell as the scroll progress crosses from one step
 * to the next, and each step's own motion runs while the scene is on that step (`data-mode`).
 * Renders the given progress on the server; a `store` then patches the DOM directly.
 * Decoration only, hidden from assistive tech.
 */
export function ProcessScene({
  stages,
  progress,
  store,
  animate = true,
  className,
}: ProcessSceneProps) {
  const rootRef = useRef<SVGSVGElement>(null);
  const last = Math.max(0, stages.length - 1);
  const live = store !== undefined;
  const p = clampProgress(progress, last);
  const mode = stages[Math.round(p)];
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
    }));
    let shownMode = root.dataset.mode;
    const apply = (value: number) => {
      for (const piece of pieces) {
        const on = shows(value, piece.mask, piece.bucket, last);
        if (on !== piece.shown) {
          piece.shown = on;
          piece.el.setAttribute("opacity", on ? "1" : "0");
        }
      }
      const next = stages[Math.round(clampProgress(value, last))];
      if (next !== undefined && next !== shownMode) {
        shownMode = next;
        root.dataset.mode = next;
      }
    };
    apply(store.get());
    return store.subscribe(apply);
  }, [store, stages, last]);

  return (
    <div aria-hidden="true" className={cn("relative aspect-[8/5] w-full select-none", className)}>
      <div className="pointer-events-none absolute inset-x-[12%] -inset-y-[4%] bg-[radial-gradient(closest-side,rgba(3,198,82,0.16),transparent)]" />
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
                  opacity={live && !shows(p, mask, piece.bucket, last) ? 0 : undefined}
                />
              ))}
              {layer.key === "trex" && animate ? (
                <rect
                  className="anim-eyelid"
                  x={TREX_ORIGIN.x + DINO_EYE.x}
                  y={TREX_ORIGIN.y + DINO_EYE.y}
                  width={1}
                  height={1}
                  fill={INK.green}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
