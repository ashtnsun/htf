"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

/** Milliseconds: a full hold, and how long a let-go takes to drain back to nothing. */
const HOLD = 2800;
const DRAIN = 900;
/** Pixels: the size of the lit cells that gather on screen. */
const CELL = 14;
const GREEN = "3, 198, 82";

/**
 * The charge behind the REVEAL button, kept outside React (it changes every frame): the progress
 * rises while the button is held and drains when it is let go, and the lit cells on the canvas
 * are born, fade and die with it.
 */
class Charge {
  progress = 0;
  private holding = false;
  private sinceBuzz = 0;
  private cells: { x: number; y: number; life: number; white: boolean }[] = [];

  press() {
    this.holding = true;
  }

  release() {
    this.holding = false;
  }

  tick(dt: number) {
    this.progress = Math.min(
      1,
      Math.max(0, this.progress + (this.holding ? dt / HOLD : -dt / DRAIN)),
    );
    // A buzz that quickens as the charge builds, where the phone can vibrate.
    this.sinceBuzz += dt;
    if (this.holding && this.sinceBuzz > 260 - 200 * this.progress) {
      this.sinceBuzz = 0;
      navigator.vibrate?.(Math.round(10 + 30 * this.progress));
    }
    return this.progress;
  }

  /** Lit cells, more of them and closer to the middle the fuller the charge. */
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) {
    const p = this.progress;
    const cols = Math.ceil(w / CELL);
    const rows = Math.ceil(h / CELL);
    const born = this.holding ? Math.floor(p * p * 26 + Math.random() * 2) : 0;
    for (let i = 0; i < born; i += 1) {
      // Two dice: the spread narrows toward the centre as the charge grows.
      const spread = 1 - 0.6 * p;
      const gx = ((Math.random() + Math.random()) / 2 - 0.5) * spread + 0.5;
      const gy = ((Math.random() + Math.random()) / 2 - 0.5) * spread + 0.5;
      this.cells.push({
        x: Math.floor(gx * cols),
        y: Math.floor(gy * rows),
        life: 1,
        white: Math.random() < p * p * 0.5,
      });
    }
    ctx.clearRect(0, 0, w, h);
    for (const cell of this.cells) {
      cell.life -= dt / 700;
      if (cell.life <= 0) continue;
      const alpha = cell.life * (0.25 + 0.6 * p);
      ctx.fillStyle = cell.white ? `rgba(245, 245, 245, ${alpha})` : `rgba(${GREEN}, ${alpha})`;
      ctx.fillRect(cell.x * CELL + 1, cell.y * CELL + 1, CELL - 2, CELL - 2);
    }
    this.cells = this.cells.filter((cell) => cell.life > 0);
  }
}

/**
 * Between the right word and the reveal: a blank screen asking for an exec, and a REVEAL button
 * that has to be held. Holding fills it with green while light gathers behind it, lit cells crowd
 * in toward the middle, the screen rumbles harder and the phone buzzes faster; letting go drains it
 * all back. A full hold opens the reveal. Under reduced motion only the fill and the light build.
 */
export function RevealGate({ onOpen }: { onOpen: () => void }) {
  const reduce = useReducedMotionSafe();
  const [charge] = useState(() => new Charge());
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const openRef = useRef(onOpen);
  useEffect(() => {
    openRef.current = onOpen;
  });

  useEffect(() => {
    const root = rootRef.current!;
    const stage = stageRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const fit = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const p = charge.tick(dt);
      root.style.setProperty("--p", p.toFixed(4));
      if (!reduce) {
        // The rumble: whole-pixel jolts that grow with the square of the charge.
        const a = Math.round(p * p * 7);
        const jolt = () => Math.round((Math.random() * 2 - 1) * a);
        stage.style.transform = a ? `translate(${jolt()}px, ${jolt()}px)` : "";
        charge.draw(ctx, window.innerWidth, window.innerHeight, dt);
      }
      if (p >= 1) {
        navigator.vibrate?.(120);
        openRef.current();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [charge, reduce]);

  const press = () => charge.press();
  const release = () => charge.release();

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-bg px-6 text-center"
      style={{ "--p": 0 } as React.CSSProperties}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
      />
      {/* the light gathering behind the button */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute size-[90vmin]"
        style={{
          opacity: "var(--p)",
          transform: "scale(calc(0.3 + var(--p) * 0.9))",
          background: `radial-gradient(closest-side, rgba(245, 245, 245, 0.18), rgba(${GREEN}, 0.22) 45%, transparent)`,
        }}
      />
      <div ref={stageRef} className="relative flex flex-col items-center">
        <p className="font-olympus text-h3 leading-tight font-semibold">Call over an exec member</p>
        <button
          type="button"
          aria-label="Reveal: press and hold"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            press();
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          onKeyDown={(event) => {
            if ((event.key === " " || event.key === "Enter") && !event.repeat) {
              event.preventDefault();
              press();
            }
          }}
          onKeyUp={(event) => {
            if (event.key === " " || event.key === "Enter") release();
          }}
          onBlur={release}
          onContextMenu={(event) => event.preventDefault()}
          className="relative mt-14 h-16 w-64 touch-none overflow-hidden border-2 border-green bg-bg font-olympus text-xl font-semibold tracking-[0.35em] select-none [-webkit-touch-callout:none]"
        >
          <span className="pl-[0.35em] text-text">REVEAL</span>
          {/* the fill: the same word in the dark colour on green, uncovered left to right */}
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-green pl-[0.35em] text-bg"
            style={{ clipPath: "inset(0 calc((1 - var(--p)) * 100%) 0 0)" }}
          >
            REVEAL
          </span>
        </button>
        <p className="mt-4 text-sm text-muted">Press and hold</p>
      </div>
    </div>
  );
}
