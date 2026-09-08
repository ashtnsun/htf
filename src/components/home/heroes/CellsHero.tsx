"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { hero } from "@content/hero";
import { HeroShell } from "@/components/home/heroes/HeroShell";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";

/** --green and --line from globals.css; the canvas cannot read CSS variables cheaply. */
const GREEN = "3, 198, 82";
const LINE = "rgba(255, 255, 255, 0.08)";
/** Per-frame decay at 60 fps: a lit cell takes about three seconds to fade out. */
const DECAY = 0.972;
/** Milliseconds between diagonals in the opening sweep. */
const SWEEP_STEP = 34;

/**
 * The grid's state, kept out of React: cell brightness, the opening sweep, sizing. The
 * component owns one instance and drives it from a requestAnimationFrame loop that stops
 * as soon as everything has faded.
 */
class CellField {
  cols = 0;
  rows = 0;
  cell = 0;
  width = 0;
  height = 0;
  dpr = 1;
  alpha = new Float32Array(0);
  sweepStart = -1;
  swept = false;
  private last = 0;

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.cell = Math.min(112, Math.max(56, width / 12));
    this.cols = Math.ceil(width / this.cell);
    this.rows = Math.ceil(height / this.cell);
    this.alpha = new Float32Array(this.cols * this.rows);
  }

  startSweep(now: number) {
    if (this.swept) return;
    this.swept = true;
    this.sweepStart = now;
  }

  /** Light the cell under (x, y). `only` clears everything else first (reduced motion). */
  light(x: number, y: number, only: boolean) {
    const c = Math.floor(x / this.cell);
    const r = Math.floor(y / this.cell);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return;
    if (only) this.alpha.fill(0);
    const set = (cc: number, rr: number, v: number) => {
      if (cc < 0 || rr < 0 || cc >= this.cols || rr >= this.rows) return;
      const i = rr * this.cols + cc;
      this.alpha[i] = Math.max(this.alpha[i]!, v);
    };
    set(c, r, 1);
    if (only) return;
    set(c - 1, r, 0.35);
    set(c + 1, r, 0.35);
    set(c, r - 1, 0.35);
    set(c, r + 1, 0.35);
  }

  /** Advances decay and the sweep. Returns true while anything is still lit or sweeping. */
  step(now: number): boolean {
    const dt = this.last ? Math.min(64, now - this.last) : 16.7;
    this.last = now;
    const decay = Math.pow(DECAY, dt / 16.7);
    let alive = false;
    const sweeping = this.sweepStart >= 0;
    const t = sweeping ? now - this.sweepStart : 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = r * this.cols + c;
        let a = this.alpha[i]! * decay;
        if (sweeping) {
          const d = (c + r) * SWEEP_STEP;
          if (t >= d && t < d + 70) a = Math.max(a, 0.6);
        }
        if (a < 0.01) a = 0;
        else alive = true;
        this.alpha[i] = a;
      }
    }
    if (sweeping && t > (this.cols + this.rows) * SWEEP_STEP + 100) this.sweepStart = -1;
    return alive || this.sweepStart >= 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { width, height, cell, cols, rows, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = this.alpha[r * cols + c]!;
        if (a <= 0) continue;
        ctx.fillStyle = `rgba(${GREEN}, ${(a * 0.4).toFixed(3)})`;
        ctx.fillRect(c * cell + 1, r * cell + 1, cell - 1, cell - 1);
      }
    }
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= cols; c++) {
      const x = Math.round(c * cell) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    // Skip the top rule (r = 0): flush under the sticky header it reads as the header's border.
    for (let r = 1; r <= rows; r++) {
      const y = Math.round(r * cell) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }
}

/**
 * "Cells": the technical grid behind the hero is a canvas whose cells light green under the
 * pointer and fade over a second or so, after a single diagonal sweep when the page opens.
 * The loop runs only while something is lit and the hero is on screen. Under
 * prefers-reduced-motion there is no sweep and only the cell under the pointer is lit.
 */
export function CellsHero() {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inView = useInView(ref, { amount: 0.05 });
  const [field] = useState(() => new CellField());

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = ref.current;
    if (!canvas || !section || !inView) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let running = false;
    const loop = (now: number) => {
      const alive = field.step(now);
      field.draw(ctx);
      if (alive) frame = requestAnimationFrame(loop);
      else running = false;
    };
    const wake = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };
    const resize = () => {
      const r = section.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      field.resize(r.width, r.height, dpr);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      field.draw(ctx);
    };
    const onMove = (e: globalThis.PointerEvent) => {
      const r = section.getBoundingClientRect();
      field.light(e.clientX - r.left, e.clientY - r.top, reduce);
      if (reduce) field.draw(ctx);
      else wake();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(section);
    resize();
    if (!reduce) {
      field.startSweep(performance.now());
      wake();
    }
    section.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(frame);
      running = false;
      observer.disconnect();
      section.removeEventListener("pointermove", onMove);
    };
  }, [field, reduce, inView]);

  return (
    <HeroShell ref={ref} grid={false} glow>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full [mask-image:radial-gradient(120%_100%_at_50%_40%,#000_35%,transparent_100%)]"
      />
      <RevealGroup
        mode="mount"
        stagger={0.12}
        className="relative z-10 container-max flex w-full flex-1 flex-col container-x pt-8 pb-24 md:pt-10 md:pb-32 lg:frame-marks lg:mt-6 lg:border-x lg:border-line"
      >
        <Reveal>
          <Eyebrow>{hero.eyebrow}</Eyebrow>
        </Reveal>
        <Reveal className="my-auto py-16 md:py-20">
          <Headline as="h1" id="hero-title" size="display-fluid" stagger lines={[...hero.lines]} />
        </Reveal>
      </RevealGroup>
    </HeroShell>
  );
}
