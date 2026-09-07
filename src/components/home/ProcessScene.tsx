"use client";

import { useEffect, useRef, type JSX } from "react";
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
   Placement. Each step has its own picture on the same 400 × 400 stage; as the progress
   moves from one step to the next, the current picture rises and fades while the next one
   comes up from below, so the hand-off is continuous rather than a cut.
------------------------------------------------------------------------------------------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Placement = { o: number; dy: number; s: number };

function sceneAt(p: number, stages: Stage[]): Placement[] {
  const last = Math.max(0, stages.length - 1);
  const q = Math.min(last, Math.max(0, p));
  return stages.map((_, j) => {
    const d = Math.max(-1, Math.min(1, q - j));
    return {
      o: clamp01(1 - (Math.abs(d) - 0.2) / 0.5),
      dy: -36 * d,
      s: 1 - 0.08 * Math.abs(d),
    };
  });
}

const placeTransform = ({ dy, s }: Placement) =>
  `translate(200 ${(200 + dy).toFixed(2)}) scale(${s.toFixed(3)}) translate(-200 -200)`;

/* ------------------------------------------------------------------------------------------
   The pictures. Line art in the site's wireframe style: green strokes, dark fills. The
   animation classes are only applied on the live scene, so the stills show every stroke
   complete.
------------------------------------------------------------------------------------------- */

type PictureProps = { animate: boolean };
const cls = (animate: boolean, name: string) => (animate ? name : undefined);

const STROKE = { stroke: "var(--green)", strokeWidth: 1.5 } as const;

/** Discover: the intake form under a magnifying glass. */
function FormPicture({ animate }: PictureProps) {
  const lines: [number, number][] = [
    [134, 124],
    [152, 100],
    [170, 116],
    [188, 84],
  ];
  return (
    <g>
      <path d="M116 78H256L292 114V322H116Z" fill="var(--surface)" {...STROKE} />
      <path d="M256 78V114H292" fill="var(--bg)" {...STROKE} />
      <rect x="140" y="106" width="76" height="8" fill="var(--green)" />
      {lines.map(([y, w]) => (
        <rect key={y} x="140" y={y} width={w} height="4" fill="var(--line-strong)" />
      ))}
      <rect x="140" y="214" width="16" height="16" fill="none" {...STROKE} />
      <path d="M143 222l4 4 7-8" fill="none" stroke="var(--green)" strokeWidth="2" />
      <rect x="166" y="220" width="72" height="4" fill="var(--line-strong)" />
      <rect x="140" y="242" width="16" height="16" fill="none" {...STROKE} />
      <path
        d="M143 250l4 4 7-8"
        pathLength="1"
        fill="none"
        stroke="var(--green)"
        strokeWidth="2"
        className={cls(animate, "anim-draw")}
        style={{ animationDelay: "0.7s" }}
      />
      <rect x="166" y="248" width="56" height="4" fill="var(--line-strong)" />
      {/* the magnifying glass, gliding over the form */}
      <g className={cls(animate, "anim-magnify")}>
        <circle
          cx="258"
          cy="252"
          r="42"
          fill="var(--green)"
          fillOpacity="0.1"
          stroke="var(--green)"
          strokeWidth="3"
        />
        <path
          d="M232 242a28 28 0 0 1 16-18"
          fill="none"
          stroke="var(--green)"
          strokeOpacity="0.6"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="289"
          y1="283"
          x2="332"
          y2="326"
          stroke="var(--green)"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}

const PEOPLE: { x: number; y: number; r: number; lead?: boolean }[] = [
  { x: 116, y: 156, r: 15 },
  { x: 284, y: 156, r: 15 },
  { x: 92, y: 240, r: 15 },
  { x: 308, y: 240, r: 15 },
  { x: 140, y: 302, r: 15 },
  { x: 260, y: 302, r: 15 },
  { x: 200, y: 206, r: 20, lead: true },
];

/** Match: the team, the lead in front. */
function TeamPicture({ animate }: PictureProps) {
  return (
    <g>
      <ellipse
        cx="200"
        cy="232"
        rx="146"
        ry="98"
        fill="none"
        stroke="var(--line-strong)"
        strokeDasharray="2 6"
      />
      {PEOPLE.map((person, i) => {
        const { x, y, r } = person;
        const w = 2.1 * r;
        return (
          <g
            key={i}
            className={cls(animate, "anim-pop")}
            style={{ animationDelay: `${0.1 + i * 0.12}s` }}
          >
            <path
              d={`M${x - w} ${y + 1.9 * r}A${w} ${w} 0 0 1 ${x + w} ${y + 1.9 * r}Z`}
              fill="var(--surface)"
              {...STROKE}
            />
            <circle
              cx={x}
              cy={y - 0.9 * r}
              r={r}
              fill={person.lead ? "var(--green)" : "var(--surface)"}
              {...STROKE}
            />
          </g>
        );
      })}
    </g>
  );
}

/** Code rows: indent and the width of the line after the green keyword. */
const CODE: [number, number][] = [
  [0, 72],
  [14, 96],
  [28, 60],
  [28, 84],
  [14, 52],
  [0, 76],
];

/** Build: a laptop with code being written. */
function LaptopPicture({ animate }: PictureProps) {
  const rowY = (i: number) => 106 + i * 16;
  const lastRow = CODE.length - 1;
  const [lastIndent, lastWidth] = CODE[lastRow] ?? [0, 0];
  return (
    <g>
      <rect x="88" y="82" width="224" height="152" fill="var(--bg)" {...STROKE} />
      <rect x="98" y="92" width="204" height="132" fill="var(--surface)" />
      <line x1="122" y1="92" x2="122" y2="224" stroke="var(--line-strong)" />
      {CODE.map(([indent, width], i) => (
        <g
          key={i}
          className={cls(animate, "anim-type")}
          style={{ animationDelay: `${0.15 + i * 0.16}s` }}
        >
          <rect x={132 + indent} y={rowY(i)} width="20" height="5" fill="var(--green)" />
          <rect x={158 + indent} y={rowY(i)} width={width} height="5" fill="var(--line-strong)" />
        </g>
      ))}
      <rect
        x={162 + lastIndent + lastWidth}
        y={rowY(lastRow) - 2}
        width="2"
        height="9"
        fill="var(--green)"
        className={cls(animate, "anim-blink")}
      />
      {/* the check-in bar at the foot of the screen */}
      <rect x="104" y="212" width="192" height="4" fill="var(--line-strong)" />
      <rect
        x="104"
        y="212"
        width="128"
        height="4"
        fill="var(--green)"
        className={cls(animate, "anim-type")}
        style={{ animationDelay: "1.2s" }}
      />
      <path d="M56 236H344L336 254H64Z" fill="var(--surface)" {...STROKE} />
      <rect x="178" y="240" width="44" height="4" fill="var(--line-strong)" />
    </g>
  );
}

/** Deliver: launch. */
function RocketPicture({ animate }: PictureProps) {
  return (
    <g>
      <g
        stroke="var(--line-strong)"
        strokeWidth="2"
        strokeLinecap="round"
        className={cls(animate, "anim-trail")}
      >
        <line x1="150" y1="262" x2="150" y2="298" />
        <line x1="250" y1="276" x2="250" y2="320" />
        <line x1="130" y1="314" x2="130" y2="338" />
        <line x1="270" y1="330" x2="270" y2="350" />
      </g>
      <path d="M170 214L134 268L170 254Z" fill="var(--bg)" strokeLinejoin="round" {...STROKE} />
      <path d="M230 214L266 268L230 254Z" fill="var(--bg)" strokeLinejoin="round" {...STROKE} />
      <path
        d="M200 70C236 104 240 190 230 250H170C160 190 164 104 200 70Z"
        fill="var(--surface)"
        stroke="var(--green)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="200" cy="158" r="20" fill="var(--bg)" stroke="var(--green)" strokeWidth="2" />
      <circle cx="200" cy="158" r="11" fill="var(--green)" fillOpacity="0.35" />
      <path d="M182 250H218L224 262H176Z" fill="var(--green)" />
      <g className={cls(animate, "anim-flame")}>
        <path d="M180 262C186 300 214 300 220 262Z" fill="var(--green)" fillOpacity="0.85" />
        <path d="M190 262C194 284 206 284 210 262Z" fill="var(--bg)" fillOpacity="0.6" />
      </g>
    </g>
  );
}

const PICTURES: Record<Stage, (props: PictureProps) => JSX.Element> = {
  form: FormPicture,
  team: TeamPicture,
  laptop: LaptopPicture,
  rocket: RocketPicture,
};

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
  /** Run the pictures' animations (the magnifier, typing, the flame …). Off for the stills. */
  animate?: boolean;
  className?: string;
};

/**
 * One floating stage that shows each step as a recognizable picture: the intake form under
 * a magnifying glass (discover), the team (match), a laptop with code being written (build)
 * and a rocket (deliver). Scroll progress cross-fades the pictures, the outgoing one rising
 * as the next comes up, so the scene stays one continuous object. Renders the given
 * progress on the server; a `store` then patches the DOM directly. Decoration only, hidden
 * from assistive tech.
 */
export function ProcessScene({
  stages,
  progress,
  store,
  animate = true,
  className,
}: ProcessSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scene = sceneAt(progress, stages);

  useEffect(() => {
    const root = rootRef.current;
    if (!store || !root) return;
    const groups = Array.from(root.querySelectorAll<SVGGElement>("[data-stage]"));
    const apply = (p: number) => {
      const s = sceneAt(p, stages);
      groups.forEach((el) => {
        const place = s[Number(el.dataset.stage)];
        if (!place) return;
        el.setAttribute("opacity", place.o.toFixed(3));
        el.setAttribute("transform", placeTransform(place));
        el.dataset.active = String(animate && place.o > 0.5);
      });
    };
    apply(store.get());
    return store.subscribe(apply);
  }, [store, stages, animate]);

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
          <path
            d="M16 44V16H44M356 16H384V44M384 356V384H356M44 384H16V356"
            fill="none"
            stroke="var(--line-strong)"
          />
          {stages.map((stage, j) => {
            const Picture = PICTURES[stage];
            const place = scene[j] ?? { o: 0, dy: 0, s: 1 };
            return (
              <g
                key={j}
                data-stage={j}
                data-active={animate && place.o > 0.5}
                opacity={place.o.toFixed(3)}
                transform={placeTransform(place)}
              >
                <Picture animate={animate} />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
