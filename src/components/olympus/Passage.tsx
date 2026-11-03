"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Meander } from "@/components/olympus/Meander";
import { roman } from "@/components/olympus/shared";

/**
 * Milliseconds from the click. The temple falls away roof first, leaving the chosen column lit
 * (until DISSOLVE); the column gathers light, then bursts (BURST): its cells scatter, a ring of
 * light sweeps the screen and the column's numeral flies to the middle as the title card. The
 * trial mounts behind the card once the burst is over (NAV), so whatever it costs the main thread
 * cannot stutter the ring, and is uncovered cell by cell from REVEAL, once it is on screen: the
 * card fades, then the cells open over OPEN.
 */
const T = {
  DISSOLVE: 650,
  BURST: 1000,
  NAV: 2150,
  REVEAL: 3400,
  RING: 1100,
  SCATTER: 900,
  OPEN: 900,
  /** Between the card fading and the cells starting to open. */
  HUSH: 300,
};
/** The longest the card waits for a slow trial before it opens anyway. */
const CAP = 8000;
/** The list page has been built by now (TempleBuild), so fetching the code cannot jank it. */
const PRELOAD_AFTER = 2500;

const BG = "#0B0B0B";
const GREEN = "#03C652";
const GREEN_DEEP = "#277D4A";
const WHITE = "#F5F5F5";

type Run = { n: number; href: string; link: Element };

let begin: ((link: Element) => void) | null = null;

/** The code behind a column, fetched ahead so that nothing waits for it behind the card. */
const preload = (path: string) =>
  path.startsWith("/olympus3")
    ? import("@/components/olympus/crawl/Crawl")
    : import("@/components/olympus/Trial");

/** Who is waiting behind the card; null when no card is up. */
let behindCard: Set<() => void> | null = null;

function liftCard() {
  const waiting = behindCard;
  behindCard = null;
  waiting?.forEach((then) => then());
}

/**
 * For a page that has an opening of its own to save: runs `then` as the cells start to open over
 * it. Null when no card is up, so the page opens straight away; otherwise a function to cancel.
 */
export function whenPassageLifts(then: () => void) {
  const waiting = behindCard;
  if (!waiting) return null;
  waiting.add(then);
  return () => waiting.delete(then);
}

/**
 * Plays the passage from a temple column (components/olympus/Temple) into its trial. False when
 * it cannot (reduced motion, or no Passage mounted): the caller then navigates as usual.
 */
export function playPassage(link: Element) {
  if (!begin || matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  begin(link);
  return true;
}

const ease = (u: number) => 1 - (1 - Math.min(1, Math.max(0, u))) ** 3;

/**
 * The cinematic hand-off from the temple to a group's riddles, mounted in the olympus layout so
 * it outlives the route change: one full-screen canvas (the dissolve, the burst, the ring, the
 * uncovering, all in whole cells) under a title card ("Group III"). The overlay keeps its own
 * view-transition name, so the site's page crossfade never ghosts it. A click or a key skips to
 * the uncovering. Decoration only (aria-hidden): the trial's own heading names the group.
 */
export function Passage() {
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const numeralRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    begin = (link) => {
      const href = link.getAttribute("href") ?? "";
      setRun((r) => r ?? { n: Number(href.split("/").pop()), href, link });
    };
    return () => {
      begin = null;
    };
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void preload(window.location.pathname), PRELOAD_AFTER);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!run) return;
    const root = rootRef.current!;
    const canvas = canvasRef.current!;
    const numeral = numeralRef.current!;
    const ctx = canvas.getContext("2d")!;
    const temple = document.querySelector<HTMLElement>("[data-temple]");
    const svg = run.link.closest("svg")!;
    temple?.setAttribute("data-leaving", "");
    run.link.setAttribute("data-chosen", "");
    router.prefetch(run.href);
    void preload(run.href);
    behindCard = new Set();

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.scale(dpr, dpr);

    // The chosen column's cells on screen, read off its paths (`M{x} {y}h1v1h-1z` per cell).
    const box = svg.getBoundingClientRect();
    const s = box.width / svg.viewBox.baseVal.width;
    const column = [...run.link.querySelectorAll("path")].flatMap((p) =>
      [...(p.getAttribute("d") ?? "").matchAll(/M(\d+) (\d+)/g)].map((m) => ({
        x: box.left + Number(m[1]) * s,
        y: box.top + Number(m[2]) * s,
      })),
    );
    const cx = column.reduce((a, c) => a + c.x, 0) / column.length + s / 2;
    const cy = column.reduce((a, c) => a + c.y, 0) / column.length + s / 2;
    const reach = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(w - cx, cy),
      Math.hypot(cx, h - cy),
      Math.hypot(w - cx, h - cy),
    );

    // The rest of the temple, roof first.
    const rest = [...(temple?.querySelectorAll<SVGPathElement>("path[data-at]") ?? [])].filter(
      (p) => !run.link.contains(p),
    );
    const top = Math.max(...rest.map((p) => Number(p.dataset.at)), 0.01);
    const fall = rest
      .map((el) => ({ el, at: (1 - Number(el.dataset.at) / top) * (T.DISSOLVE - 150) }))
      .sort((a, b) => a.at - b.at);
    let fallen = 0;

    // The screen's own grid for the ring and the uncovering.
    const G = Math.max(8, Math.round(s));
    const cols = Math.ceil(w / G);
    const rows = Math.ceil(h / G);
    const dist = new Float32Array(cols * rows);
    const open = new Float32Array(cols * rows);
    const maxCentre = Math.hypot(w / 2, h / 2);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const px = x * G + G / 2;
        const py = y * G + G / 2;
        const i = y * cols + x;
        dist[i] = Math.hypot(px - cx, py - cy) + Math.random() * G * 2.5;
        // From the middle out, ragged.
        open[i] = (Math.hypot(px - w / 2, py - h / 2) / maxCentre) * 0.75 + Math.random() * 0.25;
      }
    }

    const shards = column.map((c) => {
      const angle = Math.atan2(c.y - cy, c.x - cx) + (Math.random() - 0.5) * 0.9;
      const far = (0.2 + Math.random() * 0.9) * reach * 0.55;
      return {
        ...c,
        dx: Math.cos(angle) * far,
        dy: Math.sin(angle) * far,
        white: Math.random() < 0.2,
      };
    });

    function glow(x: number, y: number, r: number, alpha: number, rgb: string) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    function draw(t: number, revealAt: number) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      if (t < T.BURST) {
        // The lone column gathers light: a bloom, and its cells flicker white.
        const k = Math.min(1, Math.max(0, (t - 250) / (T.BURST - 250)));
        ctx.globalCompositeOperation = "lighter";
        glow(cx, cy, box.height * 0.6, k * 0.3, "3, 198, 82");
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = WHITE;
        for (const c of column) {
          if (Math.random() >= k * k * 0.4) continue;
          ctx.globalAlpha = 0.4 + Math.random() * 0.6;
          ctx.fillRect(Math.round(c.x), Math.round(c.y), Math.ceil(s), Math.ceil(s));
        }
        ctx.globalAlpha = 1;
        return;
      }
      const b = t - T.BURST;

      if (!revealAt) {
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, w, h);
      } else {
        // The card opens from the middle out; each cell burns green for a moment as it goes.
        const v = ease((t - revealAt - T.HUSH) / T.OPEN) * 1.03;
        for (let i = 0; i < open.length; i += 1) {
          const o = open[i]!;
          if (o <= v) continue;
          ctx.fillStyle = o - v < 0.02 ? GREEN_DEEP : BG;
          ctx.fillRect((i % cols) * G, Math.floor(i / cols) * G, G, G);
        }
      }

      if (b < 380) glow(cx, cy, reach * 0.8, (1 - b / 380) * 0.3, "3, 198, 82");

      if (b < T.RING) {
        const u = b / T.RING;
        const R = reach * 1.1 * ease(u);
        const band = G * (3 + 7 * u);
        for (let i = 0; i < dist.length; i += 1) {
          const behind = R - dist[i]!;
          if (behind < 0 || behind >= band) continue;
          ctx.fillStyle = behind < G * 1.2 ? WHITE : GREEN;
          ctx.globalAlpha = (1 - behind / band) * (1 - u * 0.7);
          ctx.fillRect((i % cols) * G, Math.floor(i / cols) * G, G, G);
        }
        ctx.globalAlpha = 1;
      }

      if (b < T.SCATTER) {
        // The column's cells fly apart by whole cells.
        const u = b / T.SCATTER;
        const e = ease(u);
        const size = Math.ceil(s);
        ctx.globalAlpha = (1 - u) ** 1.5;
        for (const c of shards) {
          ctx.fillStyle = c.white ? WHITE : GREEN;
          const x = c.x + Math.round((c.dx * e) / s) * s;
          const y = c.y + Math.round((c.dy * e) / s) * s;
          ctx.fillRect(Math.round(x), Math.round(y), size, size);
        }
        ctx.globalAlpha = 1;
      }
    }

    let skip = 0;
    let pushed = false;
    let titled = false;
    let revealAt = 0;
    let lifted = false;
    let raf = 0;
    const start = performance.now();
    const clock = () => performance.now() - start + skip;

    const onSkip = () => {
      const t = clock();
      if (t < T.REVEAL) skip += T.REVEAL - t;
    };
    const onKey = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) onSkip();
    };
    root.addEventListener("pointerdown", onSkip);
    window.addEventListener("keydown", onKey);

    const frame = () => {
      const t = clock();
      while (fallen < fall.length && fall[fallen]!.at <= t) {
        fall[fallen]!.el.style.opacity = "0";
        fallen += 1;
      }
      if (!titled && t >= T.BURST) {
        // The numeral leaves its column: start the card's copy from the column's place and size.
        titled = true;
        const from = run.link.querySelector("text")?.getBoundingClientRect();
        const to = numeral.getBoundingClientRect();
        if (from) {
          numeral.style.setProperty(
            "--from-x",
            `${from.left + from.width / 2 - (to.left + to.width / 2)}px`,
          );
          numeral.style.setProperty(
            "--from-y",
            `${from.top + from.height / 2 - (to.top + to.height / 2)}px`,
          );
          numeral.style.setProperty(
            "--from-scale",
            String((5 * s) / parseFloat(getComputedStyle(numeral).fontSize)),
          );
        }
        root.dataset.phase = "title";
      }
      if (!pushed && t >= T.NAV) {
        pushed = true;
        router.push(run.href);
      }
      const ready =
        window.location.pathname === run.href && !document.querySelector("[data-trial-pending]");
      if (!revealAt && t >= T.REVEAL && (ready || t >= CAP)) {
        revealAt = t;
        root.dataset.phase = "reveal";
      }
      if (revealAt && !lifted && t - revealAt >= T.HUSH) {
        lifted = true;
        liftCard();
      }
      draw(t, revealAt);
      if (revealAt && t - revealAt >= T.HUSH + T.OPEN) {
        setRun(null);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      // Never leave a page waiting on a card that has gone.
      liftCard();
      root.removeEventListener("pointerdown", onSkip);
      window.removeEventListener("keydown", onKey);
    };
  }, [run, router]);

  if (!run) return null;
  return (
    <div ref={rootRef} aria-hidden="true" className="olympus-passage fixed inset-0 z-50">
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <div className="passage-title absolute inset-0 flex flex-col items-center justify-center container-x text-center">
        <p className="passage-eyebrow font-olympus text-sm font-semibold text-green">Group</p>
        <p
          ref={numeralRef}
          className="passage-numeral mt-2 font-olympus text-[clamp(7rem,22vw,13rem)] leading-none font-semibold"
        >
          {roman(run.n)}
        </p>
        <div className="passage-key mt-8 w-[252px] text-green-deep">
          <Meander cell={3} />
        </div>
        <p className="passage-line mt-8 font-oracle text-[1.625rem] text-muted italic">
          Your trial begins.
        </p>
      </div>
    </div>
  );
}
