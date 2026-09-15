"use client";

import { useEffect, useRef, useState } from "react";
import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";

/** --bg and --green from globals.css; the canvas cannot read CSS variables cheaply. */
const BG = "#0B0B0B";
const GREEN = "3, 198, 82";
/**
 * When a cell goes, as scroll progress through the hero (0 = the hero's top under the header,
 * 1 = scrolled away): its row sets the order top to bottom over SPAN, and a per-cell jitter of up
 * to JITTER breaks the line into a dither. START is minus half the jitter, so the front runs at
 * about twice the scroll: always below the header, in the part of the hero still on screen.
 */
const SPAN = 0.5;
const JITTER = 0.3;
const START = -JITTER / 2;
/** How far ahead of a cell's moment it lights green (bright for the nearer half). */
const EDGE = 0.05;
/** The share of cells that light green on their way out; the rest simply go. */
const LIT = 0.45;

function seedOf(x: number, y: number): number {
  let h = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** The dissolve's state, kept out of React: the cell field and the last progress drawn. */
class Dissolve {
  cols = 0;
  rows = 0;
  cell = 12;
  width = 0;
  height = 0;
  dpr = 1;
  moments = new Float32Array(0);
  lit = new Uint8Array(0);
  private drawn = Number.NaN;

  resize(width: number, height: number, cell: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.cell = cell;
    this.dpr = dpr;
    this.cols = Math.ceil(width / cell);
    this.rows = Math.ceil(height / cell) + 1;
    this.moments = new Float32Array(this.cols * this.rows);
    this.lit = new Uint8Array(this.cols * this.rows);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.moments[r * this.cols + c] =
          START + (r / Math.max(1, this.rows - 1)) * SPAN + seedOf(c, r) * JITTER;
        this.lit[r * this.cols + c] = seedOf(c + 7919, r + 104729) < LIT ? 1 : 0;
      }
    }
    this.drawn = Number.NaN;
  }

  draw(ctx: CanvasRenderingContext2D, progress: number) {
    const p = Math.min(1, Math.max(0, progress));
    if (p === this.drawn) return;
    this.drawn = p;
    const { cols, rows, cell, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    if (p === 0) return;

    const gone = new Path2D();
    const near = new Path2D();
    const far = new Path2D();
    for (let r = 0; r < rows; r++) {
      // Rows start a pixel up, as the grid's lines do, so each cell fills one grid square.
      const y = r * cell - 1;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const ahead = this.moments[i]! - p;
        if (ahead > EDGE || (ahead > 0 && !this.lit[i])) continue;
        const target = ahead <= 0 ? gone : ahead <= EDGE / 2 ? near : far;
        target.rect(c * cell, y, cell, cell);
      }
    }
    ctx.fillStyle = BG;
    ctx.fill(gone);
    ctx.fillStyle = `rgba(${GREEN}, 0.8)`;
    ctx.fill(near);
    ctx.fillStyle = `rgba(${GREEN}, 0.18)`;
    ctx.fill(far);
  }
}

/**
 * "Final": the Pixels hero's fine square grid and glow around the copy, with no picture. As the
 * page scrolls the hero dissolves into its own grid, a cell at a time: a dithered front of green
 * cells runs down the hero ahead of the scroll and every cell it passes goes back to the empty
 * square, copy and glow included, until only the grid is left. It is drawn on one canvas between
 * the copy and the grid's hairlines, straight from the scroll position, so it runs the same both
 * ways and stops wherever the scroll stops. The first paint and reduced motion show the hero
 * untouched (the canvas stays empty). Decoration only.
 */
export function FinalHero(props: PageHeroProps) {
  const reduce = useReducedMotionSafe();
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [field] = useState(() => new Dissolve());

  useEffect(() => {
    const section = ref.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !canvas || !ctx || reduce) return;

    let frame = 0;
    const progress = () => {
      const rect = section.getBoundingClientRect();
      const headerH =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) *
          16 || 56;
      return rect.height > 0 ? (headerH - rect.top) / rect.height : 0;
    };
    const render = () => {
      frame = 0;
      field.draw(ctx, progress());
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(render);
    };
    const resize = () => {
      const rect = section.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cell = parseFloat(getComputedStyle(section).getPropertyValue("--px")) || 12;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      field.resize(rect.width, rect.height, cell, dpr);
      schedule();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(section);
    resize();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [field, reduce]);

  return (
    <PageHeroSection ref={ref} className="[--px:12px] md:[--px:16px] min-[90rem]:[--px:20px]">
      <PageHeroGlow className="h-[45%] opacity-60" />
      <PageHeroContent {...props} stagger={false} className="z-10" />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 size-full"
      />
      {/* the square grid, over the copy and the dissolve so every cleared cell keeps its lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 [mask-image:radial-gradient(120%_100%_at_50%_40%,#000_35%,transparent_100%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
          backgroundSize: "var(--px) var(--px)",
          backgroundPosition: "0 -1px",
        }}
      />
    </PageHeroSection>
  );
}
