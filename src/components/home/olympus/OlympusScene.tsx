"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { DINO_EYE, DINO_PIXELS } from "@/components/brand/dino-pixels";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { renderAccent } from "@/components/ui/Headline";

/**
 * The way into the family reveal, under the home hero, drawn the way /olympus draws its temple
 * (components/olympus/Temple): one SVG on a grid of cells, solid cells, details carved out,
 * white with a dark fill inside its outlines. Olympus is an island floating in the night sky:
 * a rock with a green crown of grass and vines hanging off its underside, a temple on top
 * between two braziers with green flames, a broken column and a fallen drum, clouds banked
 * around it and drifting behind, a crescent moon and a few stars. The T-rex stands on a
 * smaller rock at the left, and three stepping stones float up from it to the island. The
 * island, the stones and the T-rex's rock each bob by one cell, out of step with each other.
 * Hovering the temple itself turns it green (as the /olympus columns do); focusing the link
 * does too.
 *
 * Like the /olympus temple it builds itself, cell group by cell group from the bottom up, the
 * first time it scrolls into view. A plain click takes it apart again, top down, while the rest
 * of the page fades out around it (`data-olympus-leaving` on <html>, globals.css), and then the
 * router goes to /olympus with no page crossfade, which builds its own temple out of the black
 * (TempleBuild clears the mark once it stands). Under reduced motion it is simply there, still,
 * and the link is a link.
 */

const W = 120;
const H = 60;

type Cell = { x: number; y: number };
const cellsOf = (rows: readonly string[], x0 = 0, y0 = 0): Cell[] =>
  rows.flatMap((row, y) =>
    [...row].flatMap((ch, x) => (ch === "#" ? [{ x: x0 + x, y: y0 + y }] : [])),
  );
const row = (y: number, a: number, b: number): Cell[] =>
  Array.from({ length: b - a + 1 }, (_, k) => ({ x: a + k, y }));

/* ------------------------------------------------------------ the drawing */

/**
 * A floating rock: a span of columns from `l` to `r` under a grass row at `top`. Its underside
 * is a rounded belly `belly` cells deep at the middle, with points hanging lower (a point is a
 * column, a depth and how fast it climbs back up either side); no column is less than `min`
 * deep. The outline is white, the inside dark; `bottom` is the lowest cell of each column.
 */
type Rock = {
  l: number;
  r: number;
  top: number;
  belly: number;
  min: number;
  points: readonly { x: number; depth: number; slope: number }[];
};

const ISLAND: Rock = {
  l: 40,
  r: 114,
  top: 28,
  belly: 15,
  min: 3,
  points: [
    { x: 74, depth: 24, slope: 1.1 },
    { x: 58, depth: 17, slope: 1.6 },
    { x: 96, depth: 18, slope: 1.5 },
  ],
};
/** The T-rex's rock, and the T-rex standing on it facing the island. */
const LEDGE: Rock = {
  l: 1,
  r: 25,
  top: 44,
  belly: 5,
  min: 2,
  points: [{ x: 12, depth: 9, slope: 1.2 }],
};
const DINO = { x: 3, y: LEDGE.top - DINO_PIXELS.length };
/** Stepping stones from the ledge up to the island, small rocks of their own. */
const STONES: Rock[] = [
  { x: 26, y: 40 },
  { x: 31, y: 36 },
  { x: 36, y: 32 },
].map(({ x, y }) => ({
  l: x,
  r: x + 5,
  top: y,
  belly: 3,
  min: 2,
  points: [{ x: x + 2.5, depth: 4, slope: 1.5 }],
}));

/** The temple: its outer columns and its top row (the pediment's apex); it stands on the grass. */
const TEMPLE = { x0: 59, x1: 96, top: ISLAND.top - 20 };
const COLUMN = ["####", ...Array.from({ length: 7 }, () => ".##."), "####"];
const BRAZIER = ["#####", ".###.", "..#..", "..#..", ".###."];
/** The flame over each brazier, two frames that take turns. */
const FLAMES = [
  ["..#..", ".##..", ".###."],
  ["..#..", "..##.", ".###."],
];
const BROKEN = ["#...", "##.#", "####", ".##.", ".##.", ".##.", ".##.", "####"];
const FALLEN = ["..#####", ".######", "###.###"];

/** Vines off the island's underside: the column they hang from and how many cells long. */
const VINES = [
  [43, 4],
  [47, 7],
  [50, 3],
  [53, 5],
  [61, 4],
  [70, 3],
  [85, 6],
  [91, 3],
  [96, 5],
  [106, 8],
  [110, 3],
] as const;
/** Short lines in the rock's face, where it has cracked: a cell inside and how long. */
const CRACKS = [
  [48, 31, 3],
  [62, 34, 4],
  [83, 33, 3],
  [74, 39, 3],
  [97, 37, 2],
  [79, 45, 2],
  [9, 47, 3],
] as const;

/**
 * Clouds: puffs (a centre and a radius, cut flat at the bottom), outlined like the rest and
 * filled dark. The banks sit in front of the rocks; the drifting ones go left behind
 * everything, each drawn twice, a picture's width apart, so the drift wraps.
 */
type Cloud = readonly (readonly [x: number, y: number, r: number])[];
const BANKS: Cloud[] = [
  [
    [31, 48, 2],
    [35, 46, 3],
    [41, 44, 4.5],
    [48, 45, 3.5],
    [53, 47, 2.5],
  ],
  [
    [100, 38, 2],
    [104, 36, 3],
    [110, 34, 4.5],
    [116, 36, 3],
  ],
  [
    [82, 55, 2],
    [86, 53, 3],
    [92, 51, 4.5],
    [99, 52, 3.5],
    [104, 54, 2.5],
  ],
  [
    [2, 54, 2],
    [6, 52, 3],
    [12, 51, 3.5],
    [17, 53, 2.5],
  ],
];
const CLOUDS = [
  {
    puffs: [
      [2, 6, 2],
      [6, 4, 3],
      [12, 3, 3.5],
      [17, 5, 2.5],
    ] as Cloud,
    x: 26,
    y: 9,
    speed: 0.6,
  },
  {
    puffs: [
      [2, 4, 2],
      [6, 3, 2.5],
      [10, 4, 2],
    ] as Cloud,
    x: 94,
    y: 0,
    speed: 0.4,
  },
  {
    puffs: [
      [2, 5, 2],
      [7, 3, 3.5],
      [13, 4, 3],
      [17, 5, 2],
    ] as Cloud,
    x: 104,
    y: 13,
    speed: 0.8,
  },
];

const STARS = [
  [28, 3],
  [44, 7],
  [53, 2],
  [66, 4],
  [84, 2],
  [104, 9],
  [113, 4],
  [3, 20],
  [24, 18],
  [116, 24],
] as const;

/** A crescent: a disc with a smaller disc taken out of its upper right. */
const MOON = { x: 13, y: 9, r: 6, cut: { x: 16, y: 7, r: 5 } };

const inDisc = (x: number, y: number, cx: number, cy: number, r: number) =>
  (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r;

function rock({ l, r, top, belly, min, points }: Rock) {
  const mid = (l + r) / 2;
  const half = (r - l) / 2 + 1;
  const depth = (x: number) =>
    x < l || x > r
      ? 0
      : Math.max(
          min,
          Math.round(belly * Math.sqrt(1 - ((x - mid) / half) ** 2)),
          ...points.map((p) => Math.round(p.depth - p.slope * Math.abs(x - p.x))),
        );
  const grass: Cell[] = [];
  const edge: Cell[] = [];
  const fill: Cell[] = [];
  const bottom = new Map<number, number>();
  for (let x = l; x <= r; x += 1) {
    const d = depth(x);
    bottom.set(x, top + d - 1);
    for (let k = 0; k < d; k += 1) {
      const cell = { x, y: top + k };
      if (k === 0) grass.push(cell);
      else if (k === d - 1 || k >= depth(x - 1) || k >= depth(x + 1)) edge.push(cell);
      else fill.push(cell);
    }
  }
  return { grass, edge, fill, bottom };
}

/**
 * A cloud: the cells inside any of its puffs, and a body two cells deep from its first puff's
 * centre to its last one's, cut flat a cell above the lowest point of its puffs, the two end
 * cells of that bottom row taken off so its corners round.
 */
function cloud(puffs: Cloud, dx = 0, dy = 0) {
  const base = Math.floor(Math.max(...puffs.map(([, y, r]) => y + r))) - 1;
  const [first, last] = [puffs[0]!, puffs[puffs.length - 1]!];
  const solid = (x: number, y: number) =>
    y <= base &&
    ((x >= first[0] && x <= last[0] && y >= base - 2) ||
      puffs.some(([cx, cy, r]) => inDisc(x, y, cx, cy, r)));
  const inside = (x: number, y: number) =>
    solid(x, y) && (y < base || (solid(x - 1, y) && solid(x + 1, y)));
  const edge: Cell[] = [];
  const fill: Cell[] = [];
  const x0 = Math.floor(Math.min(...puffs.map(([x, , r]) => x - r)));
  const x1 = Math.ceil(Math.max(...puffs.map(([x, , r]) => x + r)));
  const y0 = Math.floor(Math.min(...puffs.map(([, y, r]) => y - r)));
  for (let y = y0; y <= base; y += 1)
    for (let x = x0; x <= x1; x += 1) {
      if (!inside(x, y)) continue;
      const rim = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      (rim ? edge : fill).push({ x: x + dx, y: y + dy });
    }
  return { edge, fill };
}

function temple() {
  const { x0, x1 } = TEMPLE;
  const white: Cell[] = [];
  const dark: Cell[] = [];
  const base = ISLAND.top - 1;
  // two steps, six columns, the architrave, a row of dentils, the cornice
  white.push(...row(base, x0, x1), ...row(base - 1, x0 + 1, x1 - 1));
  for (let k = 0; k < 6; k += 1) white.push(...cellsOf(COLUMN, x0 + 2 + k * 6, base - 10));
  white.push(...row(base - 11, x0 + 1, x1 - 1));
  for (let x = x0 + 1; x <= x1 - 1; x += 2) white.push({ x, y: base - 12 });
  white.push(...row(base - 13, x0, x1));
  // the pediment: its sloped edges a staircase of whole cells, the tympanum dark
  const ped = 6;
  const cx = (x0 + x1) / 2;
  const span = (x1 - x0 + 1) / 2;
  let prev = 0;
  for (let k = 0; k < ped; k += 1) {
    const y = base - 13 - ped + k;
    const half = Math.round(((k + 1) / ped) * span);
    for (let x = Math.ceil(cx - half); x <= Math.floor(cx + half); x += 1)
      (Math.abs(x - cx) > prev - 1 || k === 0 ? white : dark).push({ x, y });
    prev = half;
  }
  return { white, dark };
}

function build() {
  const island = rock(ISLAND);
  const ledge = rock(LEDGE);
  const shrine = temple();
  const ground = ISLAND.top;

  // vines hang from the column's lowest cell, a leaf off to one side every third cell
  const vines = VINES.flatMap(([x, length], v) => {
    const from = island.bottom.get(x)! + 1;
    return Array.from({ length }, (_, k) => {
      const y = from + k;
      const leaf = k % 3 === 1 ? [{ x: x + (v % 2 ? 1 : -1), y }] : [];
      return [{ x, y }, ...leaf];
    }).flat();
  });
  const cracksIn = (inside: readonly Cell[]) => {
    const dark = new Set(inside.map(({ x, y }) => `${x},${y}`));
    return CRACKS.flatMap(([x, y, length]) =>
      row(y, x, x + length - 1).filter((c) => dark.has(`${c.x},${c.y}`)),
    );
  };

  const braziers = [52, 99];
  const props = [
    ...braziers.flatMap((x) => cellsOf(BRAZIER, x, ground - BRAZIER.length)),
    ...cellsOf(BROKEN, 45, ground - BROKEN.length),
    ...cellsOf(FALLEN, 105, ground - FALLEN.length),
  ];
  const flames = FLAMES.map((frame) =>
    braziers.flatMap((x) => cellsOf(frame, x, ground - BRAZIER.length - frame.length)),
  );

  const moon: Cell[] = [];
  const { r, cut } = MOON;
  for (let y = MOON.y - r; y <= MOON.y + r; y += 1)
    for (let x = MOON.x - r; x <= MOON.x + r; x += 1)
      if (inDisc(x, y, MOON.x, MOON.y, r) && !inDisc(x, y, cut.x, cut.y, cut.r))
        moon.push({ x, y });

  const banks = BANKS.map((puffs) => cloud(puffs));
  return {
    island: {
      grass: island.grass,
      white: [...island.edge, ...props],
      fill: [...island.fill, ...shrine.dark],
      vines,
      flames,
      cracks: cracksIn(island.fill),
    },
    temple: shrine.white,
    ledge: { ...ledge, cracks: cracksIn(ledge.fill) },
    stones: STONES.map(rock),
    moon,
    banks: {
      edge: banks.flatMap((b) => b.edge),
      fill: banks.flatMap((b) => b.fill),
    },
    clouds: CLOUDS.map((c) => {
      const once = cloud(c.puffs, c.x, c.y);
      const twice = cloud(c.puffs, c.x + W, c.y);
      return [...once.edge, ...once.fill, ...twice.edge, ...twice.fill];
    }),
  };
}

const DRAWING = build();

/** Cells grouped by the moment they switch on (bottom to top, a little scatter), one path each. */
const BUILD_S = 1.4;
const BUCKET = 0.04;
function paths(cells: readonly Cell[]) {
  const groups = new Map<number, string[]>();
  for (const { x, y } of cells) {
    const scatter = (((x * 7919 + y * 104729) % 97) / 97 - 0.5) * 0.3;
    const at = Math.max(0, (1 - y / H) * BUILD_S + scatter);
    const bucket = Math.round(at / BUCKET);
    const d = groups.get(bucket) ?? [];
    d.push(`M${x} ${y}h1v1h-1z`);
    groups.set(bucket, d);
  }
  return [...groups].map(([bucket, d]) => ({ at: bucket * BUCKET, d: d.join("") }));
}

function Cells({ cells, className }: { cells: readonly Cell[]; className: string }) {
  return paths(cells).map(({ at, d }) => (
    <path key={at} d={d} data-at={at.toFixed(2)} className={className} />
  ));
}

/** A group that bobs by one cell, `delay` seconds into its cycle. */
function Bob({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <g className="olympus-bob" style={{ "--bob-delay": `${-delay}s` } as CSSProperties}>
      {children}
    </g>
  );
}

/** Switches each group on (or off) at its moment, from a frame loop (as TempleBuild does). */
function play(root: Element, show: boolean, speed: number, done: () => void) {
  const groups = [...root.querySelectorAll<SVGPathElement>("path[data-at]")]
    .map((el) => ({ el, at: (Number(el.dataset.at) * 1000) / speed }))
    .sort((a, b) => (show ? a.at - b.at : b.at - a.at));
  const end = Math.max(0, ...groups.map((g) => g.at));
  let next = 0;
  let raf = 0;
  const start = performance.now();
  const frame = (now: number) => {
    const t = now - start;
    while (next < groups.length && (show ? groups[next]!.at : end - groups[next]!.at) <= t) {
      groups[next]!.el.style.opacity = show ? "1" : "0";
      next += 1;
    }
    if (next < groups.length) raf = requestAnimationFrame(frame);
    else done();
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

export function OlympusScene() {
  const router = useRouter();
  const reduced = useReducedMotionSafe();
  const svgRef = useRef<SVGSVGElement>(null);
  const leaving = useRef(false);

  // a hand-off that never reached /olympus (back to the home page mid-build) must not hide this page
  useEffect(() => {
    delete document.documentElement.dataset.olympusLeaving;
  }, []);

  // build the scene the first time it comes into view
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || reduced) return;
    svg.dataset.pending = "";
    let stop = () => {};
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        stop = play(svg, true, 1, () => delete svg.dataset.pending);
      },
      { threshold: 0.35 },
    );
    observer.observe(svg);
    return () => {
      observer.disconnect();
      stop();
      delete svg.dataset.pending;
    };
  }, [reduced]);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const svg = svgRef.current;
    if (
      !svg ||
      reduced ||
      leaving.current ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    leaving.current = true;
    document.documentElement.dataset.olympusLeaving = "";
    play(svg, false, 2.2, () => router.push("/olympus"));
  };

  const { island, ledge } = DRAWING;
  return (
    <Link
      href="/olympus"
      onClick={onClick}
      className="group flex flex-col items-center text-center"
    >
      <Eyebrow tone="green">Family reveal</Eyebrow>
      <h2
        id="olympus-title"
        className="mt-5 font-olympus text-[2.5rem] leading-[1.05] font-semibold text-text sm:text-h2"
      >
        {renderAccent("Climb *Olympus*")}
      </h2>
      <svg
        ref={svgRef}
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${W} ${H}`}
        shapeRendering="crispEdges"
        className="olympus-scene mt-10 block h-auto md:mt-14"
        data-olympus-scene
      >
        {STARS.map(([x, y], k) => (
          <g
            key={k}
            className="olympus-star"
            style={{ "--star-delay": `${-k * 0.7}s` } as CSSProperties}
          >
            <Cells cells={[{ x, y }]} className="fill-muted" />
          </g>
        ))}
        <Cells cells={DRAWING.moon} className="fill-text" />
        {DRAWING.clouds.map((cells, k) => (
          <g
            key={k}
            className="olympus-cloud"
            style={{ "--cloud-speed": `${W / CLOUDS[k]!.speed}s` } as CSSProperties}
          >
            <Cells cells={cells} className="fill-surface-2" />
          </g>
        ))}

        <Bob delay={0}>
          <Cells cells={island.fill} className="fill-surface" />
          <Cells cells={island.cracks} className="fill-line-strong" />
          <Cells cells={island.white} className="fill-text" />
          <Cells cells={island.grass} className="fill-green" />
          <Cells cells={island.vines} className="fill-green-deep" />
          {island.flames.map((cells, k) => (
            <g key={k} className="olympus-flame" data-frame={k}>
              <Cells cells={cells} className="fill-green" />
            </g>
          ))}
          <g className="text-text transition-colors group-focus-visible:text-green hover:text-green">
            {/* the hover target is the whole building, not only its drawn cells */}
            <rect
              x={TEMPLE.x0}
              y={TEMPLE.top}
              width={TEMPLE.x1 - TEMPLE.x0 + 1}
              height={ISLAND.top - TEMPLE.top}
              fill="transparent"
            />
            <Cells cells={DRAWING.temple} className="fill-current" />
          </g>
        </Bob>

        {DRAWING.stones.map((stone, k) => (
          <Bob key={k} delay={0.6 + k * 0.6}>
            <Cells cells={stone.fill} className="fill-surface" />
            <Cells cells={stone.edge} className="fill-text" />
            <Cells cells={stone.grass} className="fill-green" />
          </Bob>
        ))}

        <Bob delay={2.4}>
          <Cells cells={ledge.fill} className="fill-surface" />
          <Cells cells={ledge.cracks} className="fill-line-strong" />
          <Cells cells={ledge.edge} className="fill-text" />
          <Cells cells={ledge.grass} className="fill-green" />
          <Cells cells={cellsOf(DINO_PIXELS, DINO.x, DINO.y)} className="fill-green" />
          <rect
            className="anim-eyelid fill-green"
            x={DINO.x + DINO_EYE.x}
            y={DINO.y + DINO_EYE.y}
            width={1}
            height={1}
          />
        </Bob>

        <Cells cells={DRAWING.banks.fill} className="fill-surface" />
        <Cells cells={DRAWING.banks.edge} className="fill-muted" />
      </svg>
    </Link>
  );
}
