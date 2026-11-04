"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import type { RevealSound } from "@/components/olympus/revealSound";
import { buildScene, rgb, SCENE_GLOW } from "@/components/olympus/scenes";
import type { SceneId } from "@/components/olympus/shared";

/** Milliseconds: a full hold, and how long a let-go takes to drain back to nothing. */
const HOLD = 3600;
const DRAIN = 1100;
/** Pixels: the size of the lit cells that gather on screen. */
const CELL = 14;
const GREEN = "3, 198, 82";

/** One cell of the god's scene: where it sits, where it flies in from, and how far along it is. */
type FlyingCell = {
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  /** 0 → 1: when in the charge the cell is called (scenes.ts sets the build order). */
  order: number;
  /** "r, g, b" */
  ink: string;
  /** Fixed per cell: when it twinkles as the charge peaks, or null for the most that never do. */
  glint: number | null;
  /** 0 → 1 as the cell flies home; back to 0 when it leaves. */
  t: number;
};

/**
 * The god's scene over the whole screen, edge to edge: the word and the button sit on top of it.
 * Built per screen size; each cell flies in from far outside the screen.
 */
function layoutScene(scene: SceneId, w: number, h: number): FlyingCell[] {
  const cols = Math.ceil(w / CELL);
  const rows = Math.ceil(h / CELL);
  const reach = Math.hypot(cols, rows) / 2;
  return buildScene(scene, cols, rows).map((c) => {
    const angle = Math.random() * Math.PI * 2;
    const r = reach * (1 + Math.random() * 0.4);
    return {
      ...c,
      fromX: cols / 2 + Math.cos(angle) * r,
      fromY: rows / 2 + Math.sin(angle) * r,
      glint: Math.random() < 0.05 ? Math.random() * Math.PI * 2 : null,
      t: 0,
    };
  });
}

/**
 * The charge behind the REVEAL button, kept outside React (it changes every frame): the progress
 * rises while the button is held and drains when it is let go. Once the Oracle knows the god, the
 * god's scene builds over the screen with the charge: cells fly in from past the edges and lock
 * into place in the scene's own order, glinting as it peaks; a let-go sends them back out. A little
 * loose dust in the scene's colours drifts over it (green before the god is known, or for a word
 * the Oracle does not know).
 */
class Charge {
  progress = 0;
  private holding = false;
  private sinceBuzz = 0;
  private dust: { x: number; y: number; life: number; ink: string }[] = [];
  private scene: SceneId | null = null;
  private cells: FlyingCell[] = [];
  private inks: string[] = [GREEN];
  private size = { w: 0, h: 0 };

  press() {
    this.holding = true;
  }

  release() {
    this.holding = false;
  }

  layout(w: number, h: number) {
    this.size = { w, h };
    this.cells = this.scene ? layoutScene(this.scene, w, h) : [];
    // The dust takes a sample of the scene's own inks.
    const inks = [...new Set(this.cells.map((c) => c.ink))];
    this.inks = inks.length ? inks : [GREEN];
  }

  setScene(scene: SceneId | null) {
    if (scene === this.scene) return;
    this.scene = scene;
    this.layout(this.size.w, this.size.h);
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

  /** `still`: reduced motion, so the scene's cells appear in place instead of flying in. */
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, dt: number, still: boolean) {
    const p = this.progress;
    ctx.clearRect(0, 0, w, h);
    const cell = (x: number, y: number, ink: string, alpha: number) => {
      ctx.fillStyle = `rgba(${ink}, ${alpha})`;
      ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    };

    if (!still) {
      const born = this.holding ? Math.floor(p * p * 8 + Math.random() * 1.5) : 0;
      for (let i = 0; i < born; i += 1) {
        this.dust.push({
          x: Math.floor(Math.random() * (w / CELL)),
          y: Math.floor(Math.random() * (h / CELL)),
          life: 1,
          ink: this.inks[Math.floor(Math.random() * this.inks.length)]!,
        });
      }
      for (const d of this.dust) {
        d.life -= dt / 700;
        if (d.life > 0) cell(d.x, d.y, d.ink, d.life * (0.15 + 0.35 * p));
      }
      this.dust = this.dust.filter((d) => d.life > 0);
    }

    // The whole scene is called by 87% of the charge, so its last cells land before the reveal.
    const called = p * 1.15;
    // From just past half the charge, a few cells twinkle (steady under reduced motion).
    const shine = Math.min(1, Math.max(0, (p - 0.55) / 0.4)) * 0.7;
    const now = performance.now();
    for (const c of this.cells) {
      c.t = Math.min(1, Math.max(0, c.t + (c.order < called ? dt / 380 : -dt / 320)));
      if (c.t <= 0) continue;
      // Ease out, then whole cells only: the flight never lands between pixels.
      const e = still ? 1 : 1 - (1 - c.t) ** 3;
      const x = Math.round(c.fromX + (c.x - c.fromX) * e);
      const y = Math.round(c.fromY + (c.y - c.fromY) * e);
      const alpha = Math.min(1, c.t * 1.4);
      cell(x, y, c.ink, alpha);
      if (c.glint !== null && shine > 0) {
        const twinkle = still ? 0.6 : Math.max(0, Math.sin(now / 160 + c.glint));
        cell(x, y, "255, 255, 255", alpha * shine * twinkle);
      }
    }
  }
}

/**
 * The Oracle's screen (/oracle): `children` (the word) above a REVEAL button that has to be held.
 * Holding fills it with green while light gathers behind it, the god's `scene` (once the Oracle
 * knows it) builds over the whole screen in the god's colours, the screen rumbles harder, the phone
 * buzzes faster and `sound` follows the charge; letting go drains it all back. A hold only starts
 * when `onPress` says so, and a full one asks `onOpen`: true opens the reveal, false (a wrong word)
 * lets the charge drain away as if let go. Under reduced motion nothing shakes or flies: the fill,
 * the light and the scene build in place.
 */
export function RevealGate({
  children,
  scene,
  sound,
  onPress,
  onOpen,
}: {
  children?: ReactNode;
  scene: SceneId | null;
  sound: RevealSound;
  onPress: () => boolean;
  onOpen: () => boolean | Promise<boolean>;
}) {
  const reduce = useReducedMotionSafe();
  const [charge] = useState(() => new Charge());
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const openRef = useRef(onOpen);
  const pressRef = useRef(onPress);
  useEffect(() => {
    openRef.current = onOpen;
    pressRef.current = onPress;
  });
  useEffect(() => {
    charge.setScene(scene);
    sound.setKnown(scene !== null);
  }, [charge, scene, sound]);
  const glow = rgb(scene ? SCENE_GLOW[scene] : "#f5f5f5");

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
      charge.layout(window.innerWidth, window.innerHeight);
    };
    fit();
    window.addEventListener("resize", fit);

    let raf = 0;
    let alive = true;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const p = charge.tick(dt);
      root.style.setProperty("--p", p.toFixed(4));
      sound.follow(p);
      if (!reduce) {
        // The rumble: whole-pixel jolts that grow with the square of the charge.
        const a = Math.round(p * p * 7);
        const jolt = () => Math.round((Math.random() * 2 - 1) * a);
        stage.style.transform = a ? `translate(${jolt()}px, ${jolt()}px)` : "";
      }
      charge.draw(ctx, window.innerWidth, window.innerHeight, dt, reduce);
      if (p >= 1) {
        // The rumble stops. The loop waits on the answer (already in, by now); a wrong word drains
        // away from full.
        stage.style.transform = "";
        Promise.resolve(openRef.current())
          .catch(() => false)
          .then((opened) => {
            if (opened) return navigator.vibrate?.(120);
            if (!alive) return;
            charge.release();
            sound.release();
            last = performance.now();
            raf = requestAnimationFrame(frame);
          });
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [charge, reduce, sound]);

  const press = () => {
    if (pressRef.current()) {
      charge.press();
      sound.press();
    }
  };
  const release = () => {
    charge.release();
    sound.release();
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-bg px-6 text-center"
      style={{ "--p": 0 } as React.CSSProperties}
    >
      {/* the light gathering behind the button, under the scene's cells */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute size-[90vmin]"
        style={{
          opacity: "var(--p)",
          transform: "scale(calc(0.3 + var(--p) * 0.9))",
          background: `radial-gradient(closest-side, rgba(${glow}, 0.2), rgba(${GREEN}, 0.18) 45%, transparent)`,
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
      />
      <div ref={stageRef} className="relative flex flex-col items-center">
        {children}
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
      </div>
    </div>
  );
}
