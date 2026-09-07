"use client";

import { useEffect, useId, useRef } from "react";
import type { ProcessStep } from "@/lib/content/schemas";
import { Globe } from "@/components/home/Globe";
import { projectOrthographic } from "@/lib/geo";
import { cn } from "@/lib/utils";

export type Stage = ProcessStep["graphic"];

/**
 * Tiny external store for the scene's progress (a float from 0 to steps − 1). ProcessScroll
 * writes it every animation frame; ProcessScene subscribes and patches the SVG directly, so
 * React never re-renders forty elements sixty times a second.
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
   Formations. Twelve particles (small squares) on a 400 × 400 grid; each stage places every
   particle somewhere, and particles a stage does not need fade out at its edges.
------------------------------------------------------------------------------------------- */

const N = 12;
const C = 200;

type Particle = { x: number; y: number; s: number; o: number; fill: number; dash: boolean };
type Formation = Particle[];

const particle = (x: number, y: number, s: number, o = 1, fill = 1, dash = false): Particle => ({
  x,
  y,
  s,
  o,
  fill,
  dash,
});

const RADAR_POINTS: [number, number][] = [
  [252, 118],
  [118, 236],
  [282, 262],
  [150, 130],
  [228, 296],
  [96, 180],
  [312, 176],
  [200, 200],
  [176, 262],
  [262, 332],
  [128, 318],
  [318, 122],
];
/** Ping rings sit on three of the blips. */
const RADAR_PINGS = [0, 1, 2];

const radar: Formation = RADAR_POINTS.map(([x, y], i) => particle(x, y, i === 7 ? 8 : 6));

// Team: the lead (particle 7) in the middle, seven members on a ring, paired with the blips
// by angle so nobody crosses the centre on the way; the four spare blips drift out.
const RING_R = 128;
const angleOf = (i: number) => Math.atan2(RADAR_POINTS[i]![1] - C, RADAR_POINTS[i]![0] - C);
const RING_INDICES = [0, 1, 2, 3, 4, 5, 6].sort((a, b) => angleOf(a) - angleOf(b));
const RING_ANGLES = Array.from({ length: 7 }, (_, i) => {
  let a = ((-90 + (i * 360) / 7) * Math.PI) / 180;
  if (a > Math.PI) a -= Math.PI * 2;
  return a;
}).sort((a, b) => a - b);
const DESIGNERS = new Set([RING_INDICES[2], RING_INDICES[5]]);

const network: Formation = radar.map((p, i) => {
  if (i === 7) return particle(C, C, 22);
  const slot = RING_INDICES.indexOf(i);
  if (slot >= 0) {
    const a = RING_ANGLES[slot]!;
    return particle(C + Math.cos(a) * RING_R, C + Math.sin(a) * RING_R, 16, 1, 0, DESIGNERS.has(i));
  }
  const a = angleOf(i);
  return particle(C + Math.cos(a) * 196, C + Math.sin(a) * 196, 6, 0);
});

// Terminal: six row markers, three window dots, the cursor.
const BARS = [168, 232, 120, 256, 188, 96];
const BAR_Y = (i: number) => 123 + i * 30;
const terminal: Formation = Array.from({ length: N }, (_, i) => {
  if (i < 6) return particle(67, BAR_Y(i), 6);
  if (i < 9) return particle(64 + (i - 6) * 14, 80, 8);
  if (i === 9) return particle(68, 311, 8);
  return particle(i === 10 ? 336 : 64, 336, 6, 0);
});

// Globe: pins on the front of the wireframe globe (radius 149 inside the 400 box).
const GLOBE_R = 149;
const PLACES: [number, number][] = [
  [40, -86], // Indiana
  [52, -1], // United Kingdom
  [21, 78], // India
  [7, -1], // Ghana
  [-22, 24], // Botswana
  [37, -120], // California
  [41, -78], // Pennsylvania
  [40, -89], // Illinois
];
const PINS = PLACES.map(([lat, lng]) => {
  const { x, y } = projectOrthographic(lat, lng, 0);
  return [C + x * GLOBE_R, C + y * GLOBE_R] as [number, number];
});
const DELIVERY = PINS[2]!;
const globe: Formation = Array.from({ length: N }, (_, i) => {
  if (i < PINS.length) return particle(PINS[i]![0], PINS[i]![1], 8);
  const [x, y] = PINS[i - PINS.length]!;
  return particle(x, y, 6, 0);
});

const FORMATIONS: Record<Stage, Formation> = { radar, network, terminal, globe };

/* ------------------------------------------------------------------------------------------
   Interpolation
------------------------------------------------------------------------------------------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Where a link from the centre to a particle should stop: just outside the square. */
function linkEnd(q: Particle): [number, number] {
  const dx = q.x - C;
  const dy = q.y - C;
  const d = Math.hypot(dx, dy);
  if (d < 1) return [C, C];
  const r = Math.max(0, d - q.s / 2 - 1.5) / d;
  return [C + dx * r, C + dy * r];
}
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const STAGGER = 0.025;

type Scene = {
  particles: Particle[];
  /** 0–1 visibility of each stage's decoration. */
  decor: number[];
  tilt: { rx: number; ry: number };
};

/** The scene at a continuous progress `p` (0 = first stage, stages.length − 1 = last). */
export function sceneAt(p: number, stages: Stage[]): Scene {
  const last = Math.max(0, stages.length - 1);
  const q = Math.min(last, Math.max(0, p));
  const i = Math.min(Math.floor(q), last);
  const f = q - i;
  const A = FORMATIONS[stages[i] ?? "radar"];
  const B = FORMATIONS[stages[Math.min(i + 1, last)] ?? stages[i] ?? "radar"];
  const particles = A.map((a, k) => {
    const b = B[k]!;
    const t = smooth(clamp01((f - k * STAGGER) / (1 - (N - 1) * STAGGER)));
    const lift = Math.sin(Math.PI * t) * 14;
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t) - lift,
      s: lerp(a.s, b.s, t),
      o: lerp(a.o, b.o, t),
      fill: lerp(a.fill, b.fill, t),
      dash: t < 0.5 ? a.dash : b.dash,
    };
  });
  const decor = stages.map((_, j) => clamp01(1 - Math.max(0, Math.abs(q - j) - 0.15) / 0.45));
  const tilt = { rx: 5, ry: last > 0 ? -7 + (14 * q) / last : 0 };
  return { particles, decor, tilt };
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
  /** Run the stage animations (sweep, pings, draws). Off for the static cards. */
  animate?: boolean;
  className?: string;
};

/**
 * One floating wireframe that evolves through the process: twelve squares travel between
 * four formations (radar blips → the team → terminal rows → pins on the globe) while each
 * stage's decoration fades in around them, driven by scroll progress rather than by
 * switching graphics. Renders the given progress on the server; a `store` then patches the
 * DOM directly. Decoration only, hidden from assistive tech.
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
  const ringIndices = stages.includes("network") ? RING_INDICES : [];

  useEffect(() => {
    const root = rootRef.current;
    if (!store || !root) return;
    const particles = Array.from(root.querySelectorAll<SVGRectElement>("[data-particle]"));
    const links = Array.from(root.querySelectorAll<SVGLineElement>("[data-link]"));
    const decors = Array.from(root.querySelectorAll<SVGGElement>("[data-decor]"));
    const globeEl = root.querySelector<HTMLDivElement>("[data-globe]");
    const tiltEl = root.querySelector<HTMLDivElement>("[data-tilt]");
    const apply = (p: number) => {
      const s = sceneAt(p, stages);
      s.particles.forEach((q, k) => {
        const el = particles[k];
        if (!el) return;
        const half = (q.s / 2).toFixed(2);
        el.setAttribute("x", `-${half}`);
        el.setAttribute("y", `-${half}`);
        el.setAttribute("width", q.s.toFixed(2));
        el.setAttribute("height", q.s.toFixed(2));
        el.setAttribute("transform", `translate(${q.x.toFixed(2)} ${q.y.toFixed(2)})`);
        el.setAttribute("opacity", q.o.toFixed(3));
        el.setAttribute("fill-opacity", q.fill.toFixed(3));
        if (q.dash) el.setAttribute("stroke-dasharray", "3 3");
        else el.removeAttribute("stroke-dasharray");
      });
      links.forEach((el) => {
        const q = s.particles[Number(el.dataset.link)];
        if (!q) return;
        const [x2, y2] = linkEnd(q);
        el.setAttribute("x2", x2.toFixed(2));
        el.setAttribute("y2", y2.toFixed(2));
      });
      decors.forEach((el) => {
        const v = s.decor[Number(el.dataset.decor)] ?? 0;
        el.setAttribute("opacity", v.toFixed(3));
        el.dataset.active = String(animate && v > 0.5);
      });
      const gi = stages.indexOf("globe");
      if (globeEl && gi >= 0) {
        const v = s.decor[gi] ?? 0;
        globeEl.style.opacity = v.toFixed(3);
        globeEl.style.transform = `scale(${(0.85 + 0.15 * v).toFixed(3)})`;
      }
      if (tiltEl) {
        tiltEl.style.transform = `rotateX(${s.tilt.rx}deg) rotateY(${s.tilt.ry.toFixed(2)}deg)`;
      }
    };
    apply(store.get());
    return store.subscribe(apply);
  }, [store, stages, animate]);

  const globeIndex = stages.indexOf("globe");
  const globeVisible = globeIndex >= 0 ? (scene.decor[globeIndex] ?? 0) : 0;
  const isActive = (j: number) => animate && (scene.decor[j] ?? 0) > 0.5;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={cn("relative aspect-square w-full select-none [perspective:1200px]", className)}
    >
      <div
        className="pointer-events-none absolute inset-[16%] bg-[radial-gradient(closest-side,rgba(3,198,82,0.16),transparent)]"
        style={{ opacity: 1 }}
      />
      <div
        data-tilt=""
        className="anim-float size-full [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${scene.tilt.rx}deg) rotateY(${scene.tilt.ry}deg)` }}
      >
        {globeIndex >= 0 ? (
          <div
            data-globe=""
            className="absolute inset-[9%] transition-none"
            style={{ opacity: globeVisible, transform: `scale(${0.85 + 0.15 * globeVisible})` }}
          >
            <Globe animate={false} />
          </div>
        ) : null}

        <svg
          viewBox="0 0 400 400"
          focusable="false"
          className="absolute inset-0 size-full overflow-visible"
        >
          <defs>
            <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--green)" stopOpacity="0.32" />
              <stop offset="1" stopColor="var(--green)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {stages.map((stage, j) => {
            const props = {
              "data-decor": j,
              "data-active": isActive(j),
              opacity: scene.decor[j] ?? 0,
            } as const;
            if (stage === "radar") {
              return (
                <g key={j} {...props}>
                  <g fill="none" stroke="var(--line-strong)" strokeWidth="1">
                    <circle cx={C} cy={C} r="50" />
                    <circle cx={C} cy={C} r="100" />
                    <circle cx={C} cy={C} r="150" strokeDasharray="3 6" />
                    <path d="M200 30V370M30 200H370" />
                  </g>
                  <circle
                    cx={C}
                    cy={C}
                    r="160"
                    fill="none"
                    stroke="var(--green)"
                    strokeOpacity="0.7"
                  />
                  <g className="anim-sweep">
                    <path d="M200 200V40A160 160 0 0 1 313.1 86.9Z" fill={`url(#${id}-sweep)`} />
                    <path d="M200 200V40" stroke="var(--green)" strokeWidth="1.5" />
                  </g>
                  {RADAR_PINGS.map((k, n) => (
                    <circle
                      key={k}
                      cx={RADAR_POINTS[k]![0]}
                      cy={RADAR_POINTS[k]![1]}
                      r="9"
                      fill="none"
                      stroke="var(--green)"
                      className="anim-ping"
                      style={{ animationDelay: `${n * 0.9}s` }}
                    />
                  ))}
                </g>
              );
            }
            if (stage === "network") {
              return (
                <g key={j} {...props}>
                  <circle
                    cx={C}
                    cy={C}
                    r={RING_R}
                    fill="none"
                    stroke="var(--line-strong)"
                    strokeDasharray="2 6"
                  />
                  {ringIndices.map((k) => (
                    <line
                      key={k}
                      data-link={k}
                      x1={C}
                      y1={C}
                      x2={linkEnd(scene.particles[k]!)[0]}
                      y2={linkEnd(scene.particles[k]!)[1]}
                      stroke="var(--green)"
                      strokeOpacity="0.7"
                    />
                  ))}
                </g>
              );
            }
            if (stage === "terminal") {
              return (
                <g key={j} {...props}>
                  <rect
                    x="48"
                    y="64"
                    width="304"
                    height="272"
                    fill="none"
                    stroke="var(--line-strong)"
                  />
                  <path d="M48 96H352M80 311H120" stroke="var(--line-strong)" />
                  {BARS.map((width, i) => (
                    <g key={i}>
                      <rect
                        x="80"
                        y={BAR_Y(i) - 3}
                        width="256"
                        height="6"
                        fill="var(--surface-2)"
                      />
                      <rect
                        x="80"
                        y={BAR_Y(i) - 3}
                        width={width}
                        height="6"
                        fill="var(--green)"
                        className="anim-grow"
                        style={{ animationDelay: `${0.1 + i * 0.18}s` }}
                      />
                    </g>
                  ))}
                </g>
              );
            }
            return (
              <g key={j} {...props}>
                <circle
                  cx={DELIVERY[0]}
                  cy={DELIVERY[1]}
                  r="12"
                  fill="none"
                  stroke="var(--green)"
                  className="anim-ping"
                />
                <path
                  d={`M${DELIVERY[0].toFixed(1)} ${DELIVERY[1].toFixed(1)}H336V88`}
                  pathLength="1"
                  fill="none"
                  stroke="var(--green)"
                  className="anim-draw"
                  style={{ animationDelay: "0.3s" }}
                />
                <rect
                  x="318"
                  y="52"
                  width="36"
                  height="36"
                  fill="var(--surface)"
                  stroke="var(--green)"
                />
                <path
                  d="M327 71l6 6 12-13"
                  pathLength="1"
                  fill="none"
                  stroke="var(--green)"
                  strokeWidth="2"
                  className="anim-draw"
                  style={{ animationDelay: "0.9s" }}
                />
              </g>
            );
          })}

          {scene.particles.map((q, k) => (
            <rect
              key={k}
              data-particle={k}
              x={-q.s / 2}
              y={-q.s / 2}
              width={q.s}
              height={q.s}
              transform={`translate(${q.x} ${q.y})`}
              fill="var(--green)"
              fillOpacity={q.fill}
              stroke="var(--green)"
              strokeWidth="1.5"
              strokeDasharray={q.dash ? "3 3" : undefined}
              opacity={q.o}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
