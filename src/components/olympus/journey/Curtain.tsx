"use client";

import { useEffect, useRef, useState } from "react";
import { Meander } from "@/components/olympus/Meander";
import { STAGES, STAGE_TITLES, type Stage } from "@/components/olympus/journey/save";
import { roman } from "@/components/olympus/journey/numeral";

/** Milliseconds: the screen closes in cells, the title card holds, the cells open again. */
const T = { CLOSE: 750, HOLD: 2400, OPEN: 950 };

const BG = "#0B0B0B";
const GREEN = "#03C652";
const GREEN_DEEP = "#277D4A";

const ease = (u: number) => {
  const v = Math.min(1, Math.max(0, u));
  return v < 0.5 ? 4 * v ** 3 : 1 - (-2 * v + 2) ** 3 / 2;
};

/**
 * The passage between two steps of the journey: the screen closes in whole cells from the edges
 * in (each cell burning green as it lands), the next step's title card comes up (its numeral,
 * its name, the Greek key, its line), and the cells open again from the middle out on the step
 * behind. `onCovered` fires once the screen is black, which is when the trial swaps the step;
 * a click or a key skips the card. Decoration only (aria-hidden): each step has its own heading.
 * Never drawn under reduced motion (the trial swaps the step at once).
 */
export function Curtain({
  to,
  onCovered,
  onDone,
}: {
  to: Stage;
  onCovered: () => void;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"close" | "title" | "open">("close");
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handlers = useRef({ onCovered, onDone });
  useEffect(() => {
    handlers.current = { onCovered, onDone };
  });

  useEffect(() => {
    const root = rootRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.scale(dpr, dpr);

    const G = w < 640 ? 10 : 14;
    const cols = Math.ceil(w / G);
    const rows = Math.ceil(h / G);
    const shut = new Float32Array(cols * rows);
    const open = new Float32Array(cols * rows);
    const far = Math.hypot(w / 2, h / 2);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const d = Math.hypot(x * G + G / 2 - w / 2, y * G + G / 2 - h / 2) / far;
        const i = y * cols + x;
        // Edges first on the way in, the middle first on the way out; both ragged.
        shut[i] = (1 - d) * 0.72 + Math.random() * 0.28;
        open[i] = d * 0.72 + Math.random() * 0.28;
      }
    }

    function cells(order: Float32Array, v: number, covered: (o: number) => boolean) {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < order.length; i += 1) {
        const o = order[i]!;
        if (!covered(o)) continue;
        const edge = Math.abs(o - v) < 0.025;
        ctx.fillStyle = edge ? (Math.random() < 0.3 ? GREEN : GREEN_DEEP) : BG;
        ctx.fillRect((i % cols) * G, Math.floor(i / cols) * G, G, G);
      }
    }

    let skip = 0;
    let covered = false;
    let opening = false;
    let raf = 0;
    const start = performance.now();
    const clock = () => performance.now() - start + skip;
    const onSkip = () => {
      const t = clock();
      if (t > T.CLOSE + 300 && t < T.CLOSE + T.HOLD) skip += T.CLOSE + T.HOLD - t;
    };
    const onKey = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) onSkip();
    };
    root.addEventListener("pointerdown", onSkip);
    window.addEventListener("keydown", onKey);

    const frame = () => {
      const t = clock();
      if (t < T.CLOSE) {
        const v = ease(t / T.CLOSE) * 1.03;
        cells(shut, v, (o) => o <= v);
      } else if (t < T.CLOSE + T.HOLD) {
        if (!covered) {
          covered = true;
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = BG;
          ctx.fillRect(0, 0, w, h);
          setPhase("title");
          handlers.current.onCovered();
        }
      } else {
        if (!opening) {
          opening = true;
          setPhase("open");
        }
        const u = (t - T.CLOSE - T.HOLD) / T.OPEN;
        if (u >= 1) {
          handlers.current.onDone();
          return;
        }
        const v = ease(u) * 1.03;
        cells(open, v, (o) => o > v);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointerdown", onSkip);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const { title, line } = STAGE_TITLES[to];
  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-phase={phase}
      className="fixed inset-0 z-50 cursor-pointer"
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      {phase !== "close" ? (
        <div className="curtain-card absolute inset-0 flex flex-col items-center justify-center container-x text-center">
          <p className="curtain-numeral font-olympus text-[clamp(6rem,18vw,11rem)] leading-none font-semibold text-green">
            {roman(STAGES.indexOf(to) + 1)}
          </p>
          <p className="curtain-title mt-6 font-olympus text-h3 font-semibold tracking-[0.2em] uppercase">
            {title}
          </p>
          <div className="curtain-key mt-8 w-[252px] text-green-deep">
            <Meander cell={3} />
          </div>
          <p className="curtain-line mt-8 max-w-xl font-oracle text-[1.625rem] leading-snug text-muted italic">
            {line}
          </p>
        </div>
      ) : null}
    </div>
  );
}
