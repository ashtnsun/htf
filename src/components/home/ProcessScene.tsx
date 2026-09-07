"use client";

import { useEffect, useId, useRef } from "react";
import type { ProcessStep } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

export type Stage = ProcessStep["graphic"];

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
   Isometric geometry. A floating plane of 5 × 5 cells; one unit is U viewBox pixels and z
   points up. iso() projects a plane point onto the 400 × 400 viewBox.
------------------------------------------------------------------------------------------- */

const U = 30;
const COS = Math.cos(Math.PI / 6);
const CELLS = 5;
const CX = 200;
const CY = 145;

type Pt = [number, number];
const iso = (x: number, y: number, z = 0): Pt => [
  CX + (x - y) * U * COS,
  CY + (x + y) * U * 0.5 - z * U,
];
/** Screen offset of a plane point from the plane's origin (for translating groups). */
const off = (x: number, y: number): Pt => [(x - y) * U * COS, (x + y) * U * 0.5];
const pts = (list: Pt[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const fix = (n: number) => n.toFixed(2);

/** The three visible faces of a box over the square x0..x1 × y0..y1, from z0 up to z1. */
function box(x0: number, y0: number, x1: number, y1: number, z0: number, z1: number) {
  return {
    top: pts([iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)]),
    left: pts([iso(x0, y1, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x0, y1, z1)]),
    right: pts([iso(x1, y0, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x1, y0, z1)]),
  };
}

/** The target cell: the problem the project is about, in the middle of the plane. */
const T: Pt = [2.5, 2.5];
const CELL = pts([iso(2, 2), iso(3, 2), iso(3, 3), iso(2, 3)]);
const PLANE = pts([iso(0, 0), iso(CELLS, 0), iso(CELLS, CELLS), iso(0, CELLS)]);
const GRID = Array.from({ length: CELLS + 1 }, (_, i) => i);
const CORNERS: Pt[] = [iso(0, 0), iso(CELLS, 0), iso(CELLS, CELLS), iso(0, CELLS)];

// The team: seven boxes on a ring around the target, the lead (a little bigger) at the back.
const TEAM = 7;
const ANGLES = Array.from({ length: TEAM }, (_, k) => ((-90 + (k * 360) / TEAM) * Math.PI) / 180);
const RING = 1.9;
const FAR = 4.4;
const BACK = 2.7;
const cubeSize = (k: number) => (k === 0 ? 0.66 : 0.5);
const ringPos = (k: number, r: number): Pt => [
  T[0] + Math.cos(ANGLES[k] ?? 0) * r,
  T[1] + Math.sin(ANGLES[k] ?? 0) * r,
];
const depthOf = (k: number) => ringPos(k, RING)[0] + ringPos(k, RING)[1];
const byDepth = (a: number, b: number) => depthOf(a) - depthOf(b);
/** Boxes are painted back to front; the stack sits at the target's depth. */
const BEHIND = Array.from({ length: TEAM }, (_, k) => k)
  .filter((k) => depthOf(k) < T[0] + T[1])
  .sort(byDepth);
const IN_FRONT = Array.from({ length: TEAM }, (_, k) => k)
  .filter((k) => depthOf(k) >= T[0] + T[1])
  .sort(byDepth);
const CUBES = Array.from({ length: TEAM }, (_, k) => {
  const s = cubeSize(k);
  return box(-s / 2, -s / 2, s / 2, s / 2, 0, s * 0.9);
});

// The product: four slabs on the target cell, 0.5 high on a 0.6 pitch, lifted at handoff.
const LAYERS = 4;
const SLAB = 0.9;
const SLAB_H = 0.5;
const PITCH = 0.6;
const LIFT = 0.8;
const STACK_TOP = (LAYERS - 1) * PITCH + SLAB_H;
const slabBox = (k: number, grow: number) =>
  box(
    T[0] - SLAB / 2,
    T[1] - SLAB / 2,
    T[0] + SLAB / 2,
    T[1] + SLAB / 2,
    k * PITCH,
    k * PITCH + SLAB_H * grow,
  );
const SLAB_IDS = Array.from({ length: LAYERS }, (_, k) => k);

// The gauge beside the stack (build stage): a rail with one tick per layer, clear of the
// front-right box of the team.
const RAIL_X = iso(T[0] + SLAB / 2, T[1] - SLAB / 2)[0] + 34;
const RAIL_Y = iso(T[0] + SLAB / 2, T[1] - SLAB / 2)[1];
const tickY = (k: number) => RAIL_Y - (k * PITCH + SLAB_H) * U;

// Viewfinder brackets around the lifted product (handoff stage).
const BRACKET = (() => {
  const pad = 14;
  const x0 = iso(T[0] - SLAB / 2, T[1] + SLAB / 2)[0] - pad;
  const x1 = iso(T[0] + SLAB / 2, T[1] - SLAB / 2)[0] + pad;
  const y0 = iso(T[0] - SLAB / 2, T[1] - SLAB / 2, STACK_TOP + LIFT)[1] - pad;
  const y1 = iso(T[0] + SLAB / 2, T[1] + SLAB / 2, LIFT)[1] + pad;
  const arm = 12;
  return {
    d: [
      `M${fix(x0)} ${fix(y0 + arm)}V${fix(y0)}H${fix(x0 + arm)}`,
      `M${fix(x1 - arm)} ${fix(y0)}H${fix(x1)}V${fix(y0 + arm)}`,
      `M${fix(x1)} ${fix(y1 - arm)}V${fix(y1)}H${fix(x1 - arm)}`,
      `M${fix(x0 + arm)} ${fix(y1)}H${fix(x0)}V${fix(y1 - arm)}`,
    ].join(""),
    chip: { x: x1 + 10, y: y0 - 26 },
  };
})();

/* ------------------------------------------------------------------------------------------
   The scene at a continuous progress
------------------------------------------------------------------------------------------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0 before `a`, 1 after `b`, eased in between. */
const seg = (p: number, a: number, b: number) => smooth(clamp01((p - a) / (b - a)));

type Scene = {
  cubes: { x: number; y: number; o: number }[];
  /** 0–1 height of each slab. */
  slabs: number[];
  /** 0–1 lift of the finished product. */
  lift: number;
  /** 0–1 visibility of each stage's decoration. */
  decor: number[];
};

function sceneAt(p: number, stages: Stage[]): Scene {
  const last = Math.max(0, stages.length - 1);
  const q = Math.min(last, Math.max(0, p));
  const at = (stage: Stage) => {
    const i = stages.indexOf(stage);
    return i < 0 ? Number.POSITIVE_INFINITY : i;
  };
  const team = at("team");
  const stack = at("stack");
  const ship = at("ship");

  const cubes = ANGLES.map((_, k) => {
    const arrive = seg(q, team - 0.9 + k * 0.06, team - 0.36 + k * 0.06);
    const recede = seg(q, ship - 0.9, ship - 0.1);
    const r = lerp(lerp(FAR, RING, arrive), BACK, recede);
    const [x, y] = ringPos(k, r);
    return { x, y, o: arrive * (1 - 0.7 * recede) };
  });
  const slabs = SLAB_IDS.map((k) => seg(q, stack - 0.98 + k * 0.2, stack - 0.6 + k * 0.2));
  const lift = seg(q, ship - 0.8, ship - 0.1);
  const decor = stages.map((_, j) => clamp01(1 - Math.max(0, Math.abs(q - j) - 0.15) / 0.45));
  return { cubes, slabs, lift, decor };
}

/* ------------------------------------------------------------------------------------------
   Component
------------------------------------------------------------------------------------------- */

type ProcessSceneProps = {
  /** The stage order (each step's `graphic`). */
  stages: Stage[];
  /** Progress rendered on the server and before the store sends its first value. */
  progress: number;
  /** Live progress (home page). Without it the scene is a still. */
  store?: ProgressStore;
  /** Run the stage animations (scan, ping, draws). Off for the static cards. */
  animate?: boolean;
  className?: string;
};

const FACE = { fill: "var(--bg)", stroke: "var(--green)", strokeOpacity: 0.55 } as const;
const TOP = { fill: "var(--green)", fillOpacity: 0.9, stroke: "var(--green)" } as const;

function Cube({ k, scene }: { k: number; scene: Scene }) {
  const c = scene.cubes[k];
  const faces = CUBES[k];
  if (!c || !faces) return null;
  const [dx, dy] = off(c.x, c.y);
  return (
    <g data-cube={k} transform={`translate(${fix(dx)} ${fix(dy)})`} opacity={fix(c.o)}>
      <polygon points={faces.left} {...FACE} />
      <polygon points={faces.right} {...FACE} />
      <polygon points={faces.top} {...TOP} />
    </g>
  );
}

/**
 * One floating isometric scene that builds through the process: a scan sweeps a plane and
 * locks onto a cell (discover), the team's boxes gather around it (match), the product
 * rises on it layer by layer against a gauge (build), and the finished stack lifts off
 * inside viewfinder brackets (deliver). Driven by scroll progress rather than by switching
 * graphics. Renders the given progress on the server; a `store` then patches the DOM
 * directly. Decoration only, hidden from assistive tech.
 */
export function ProcessScene({
  stages,
  progress,
  store,
  animate = true,
  className,
}: ProcessSceneProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const scene = sceneAt(progress, stages);

  useEffect(() => {
    const root = rootRef.current;
    if (!store || !root) return;
    const q = <E extends Element>(sel: string) => Array.from(root.querySelectorAll<E>(sel));
    const cubes = q<SVGGElement>("[data-cube]");
    const links = q<SVGLineElement>("[data-link]");
    const slabs = q<SVGGElement>("[data-slab]");
    const ticks = q<SVGLineElement>("[data-tick]");
    const decors = q<SVGGElement>("[data-decor]");
    const stackEl = root.querySelector<SVGGElement>("[data-stack]");
    const shadowEl = root.querySelector<SVGPolygonElement>("[data-shadow]");
    const apply = (p: number) => {
      const s = sceneAt(p, stages);
      cubes.forEach((el) => {
        const c = s.cubes[Number(el.dataset.cube)];
        if (!c) return;
        const [dx, dy] = off(c.x, c.y);
        el.setAttribute("transform", `translate(${fix(dx)} ${fix(dy)})`);
        el.setAttribute("opacity", fix(c.o));
      });
      links.forEach((el) => {
        const c = s.cubes[Number(el.dataset.link)];
        if (!c) return;
        const [x, y] = iso(c.x, c.y);
        el.setAttribute("x1", fix(x));
        el.setAttribute("y1", fix(y));
      });
      slabs.forEach((el) => {
        const k = Number(el.dataset.slab);
        const grow = s.slabs[k] ?? 0;
        const faces = slabBox(k, grow);
        el.setAttribute("opacity", grow > 0.001 ? "1" : "0");
        el.querySelector('[data-face="left"]')?.setAttribute("points", faces.left);
        el.querySelector('[data-face="right"]')?.setAttribute("points", faces.right);
        el.querySelector('[data-face="top"]')?.setAttribute("points", faces.top);
      });
      ticks.forEach((el) => {
        el.setAttribute("opacity", fix(s.slabs[Number(el.dataset.tick)] ?? 0));
      });
      decors.forEach((el) => {
        const v = s.decor[Number(el.dataset.decor)] ?? 0;
        el.setAttribute("opacity", v.toFixed(3));
        el.dataset.active = String(animate && v > 0.5);
      });
      stackEl?.setAttribute("transform", `translate(0 ${fix(-s.lift * LIFT * U)})`);
      shadowEl?.setAttribute("opacity", fix(0.3 * s.lift));
    };
    apply(store.get());
    return store.subscribe(apply);
  }, [store, stages, animate]);

  const isActive = (j: number) => animate && (scene.decor[j] ?? 0) > 0.5;
  /** Draw-in strokes animate on the live scene and are simply complete on the stills. */
  const draw = animate ? "anim-draw" : undefined;
  const decorProps = (stage: Stage) => {
    const j = stages.indexOf(stage);
    return {
      "data-decor": j,
      "data-active": isActive(j),
      opacity: j < 0 ? 0 : (scene.decor[j] ?? 0),
    } as const;
  };
  const scanBand = pts([iso(-1.3, 0), iso(0, 0), iso(0, CELLS), iso(-1.3, CELLS)]);
  const [gx1, gy1] = iso(-1.3, CELLS / 2);
  const [gx2, gy2] = iso(0, CELLS / 2);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={cn("relative aspect-square w-full select-none", className)}
    >
      <div className="pointer-events-none absolute inset-[18%] bg-[radial-gradient(closest-side,rgba(3,198,82,0.16),transparent)]" />
      <div className="anim-float size-full">
        <svg
          viewBox="0 0 400 400"
          focusable="false"
          className="absolute inset-0 size-full overflow-visible"
        >
          <defs>
            <clipPath id={`${id}-plane`}>
              <polygon points={PLANE} />
            </clipPath>
            <linearGradient
              id={`${id}-scan`}
              gradientUnits="userSpaceOnUse"
              x1={gx1}
              y1={gy1}
              x2={gx2}
              y2={gy2}
            >
              <stop offset="0" stopColor="var(--green)" stopOpacity="0" />
              <stop offset="1" stopColor="var(--green)" stopOpacity="0.32" />
            </linearGradient>
          </defs>

          {/* the plane: a grid of cells with crosshairs on its corners */}
          <g fill="none" stroke="var(--line-strong)" strokeWidth="1">
            {GRID.map((i) => {
              const [ax, ay] = iso(i, 0);
              const [bx, by] = iso(i, CELLS);
              const [cx, cy] = iso(0, i);
              const [dx, dy] = iso(CELLS, i);
              return (
                <g key={i} strokeOpacity={i === 0 || i === CELLS ? 1 : 0.55}>
                  <line x1={ax} y1={ay} x2={bx} y2={by} />
                  <line x1={cx} y1={cy} x2={dx} y2={dy} />
                </g>
              );
            })}
            {CORNERS.map(([x, y], i) => (
              <path key={i} d={`M${x - 7} ${y}H${x + 7}M${x} ${y - 7}V${y + 7}`} />
            ))}
          </g>

          {/* the target cell */}
          <polygon
            points={CELL}
            fill="var(--green)"
            fillOpacity="0.18"
            stroke="var(--green)"
            strokeOpacity="0.8"
          />

          {/* discover: a scan sweeps the plane and the cell pings */}
          <g {...decorProps("scan")}>
            <g clipPath={`url(#${id}-plane)`}>
              <g className="anim-scan">
                <polygon points={scanBand} fill={`url(#${id}-scan)`} />
                <line
                  x1={iso(0, 0)[0]}
                  y1={iso(0, 0)[1]}
                  x2={iso(0, CELLS)[0]}
                  y2={iso(0, CELLS)[1]}
                  stroke="var(--green)"
                  strokeWidth="1.5"
                />
              </g>
            </g>
            <polygon
              points={CELL}
              fill="none"
              stroke="var(--green)"
              className="anim-ping"
              style={{ animationDuration: "3s" }}
            />
          </g>

          {/* match: each box links to the cell */}
          <g {...decorProps("team")}>
            {scene.cubes.map((c, k) => {
              const [x, y] = iso(c.x, c.y);
              const [tx, ty] = iso(T[0], T[1]);
              return (
                <line
                  key={k}
                  data-link={k}
                  x1={x}
                  y1={y}
                  x2={tx}
                  y2={ty}
                  pathLength="1"
                  stroke="var(--green)"
                  strokeOpacity="0.6"
                  className={draw}
                  style={{ animationDelay: `${0.1 + k * 0.08}s` }}
                />
              );
            })}
          </g>

          {/* deliver: the shadow the lifted product throws on the plane */}
          <polygon
            data-shadow=""
            points={CELL}
            fill="var(--green)"
            opacity={fix(0.3 * scene.lift)}
          />

          {/* build: the gauge beside the stack */}
          <g {...decorProps("stack")} stroke="var(--line-strong)">
            <line x1={RAIL_X} y1={RAIL_Y} x2={RAIL_X} y2={tickY(LAYERS - 1)} />
            {SLAB_IDS.map((k) => (
              <g key={k}>
                <line x1={RAIL_X - 4} y1={tickY(k)} x2={RAIL_X + 8} y2={tickY(k)} />
                <line
                  data-tick={k}
                  x1={RAIL_X - 4}
                  y1={tickY(k)}
                  x2={RAIL_X + 8}
                  y2={tickY(k)}
                  stroke="var(--green)"
                  strokeWidth="2"
                  opacity={fix(scene.slabs[k] ?? 0)}
                />
              </g>
            ))}
          </g>

          {BEHIND.map((k) => (
            <Cube key={k} k={k} scene={scene} />
          ))}

          {/* the product */}
          <g data-stack="" transform={`translate(0 ${fix(-scene.lift * LIFT * U)})`}>
            {SLAB_IDS.map((k) => {
              const grow = scene.slabs[k] ?? 0;
              const faces = slabBox(k, grow);
              return (
                <g key={k} data-slab={k} opacity={grow > 0.001 ? 1 : 0}>
                  <polygon data-face="left" points={faces.left} {...FACE} />
                  <polygon data-face="right" points={faces.right} {...FACE} />
                  <polygon data-face="top" points={faces.top} {...TOP} />
                </g>
              );
            })}
          </g>

          {IN_FRONT.map((k) => (
            <Cube key={k} k={k} scene={scene} />
          ))}

          {/* deliver: brackets lock onto the product and the status light draws its check */}
          <g {...decorProps("ship")} fill="none" stroke="var(--green)">
            <path d={BRACKET.d} strokeWidth="1.5" />
            <rect
              x={BRACKET.chip.x}
              y={BRACKET.chip.y}
              width="22"
              height="22"
              fill="var(--surface)"
            />
            <path
              d={`M${fix(BRACKET.chip.x + 5)} ${fix(BRACKET.chip.y + 11.5)}l4 4 8-9`}
              pathLength="1"
              strokeWidth="2"
              className={draw}
              style={{ animationDelay: "0.5s" }}
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
