"use client";

import { useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The hero's grid, made playable: the cells behind the pointer light up and fade out behind it,
 * holding the button down paints cells that stay, and holding the right button rubs them out.
 * The painting is kept per page in localStorage.
 *
 * One canvas rather than a few thousand elements, lined up with the CSS grid the hero already
 * draws (`--px` is the cell, offset a pixel up like the background). It listens on its parent
 * section, not on itself, so the copy and its links keep every pointer event while the whole
 * hero still paints — the canvas never takes the pointer. Decoration only: no keyboard path,
 * `aria-hidden`, and nothing here is content.
 */

const FADE_MS = 700;
/** Painted cells kept per page; the oldest fall off the end. */
const MAX_PAINTED = 4000;
const STORAGE_PREFIX = "htf:hero-pixels:";
/** Light every cell along the pointer's path, so a fast sweep does not leave gaps. */
const SAMPLE_FRACTION = 0.4;

type Cell = `${number},${number}`;

export function PixelField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !section || !ctx) return;

    const storageKey = `${STORAGE_PREFIX}${pathname}`;
    const painted = new Set<Cell>();
    /** Cell -> the time it was lit, for the fade. */
    const lit = new Map<Cell, number>();
    let cell = 12;
    let green = "#03C652";
    let width = 0;
    let height = 0;
    /** What the held button is doing: the left one paints, the right one rubs out. */
    let stroke: "paint" | "erase" | null = null;
    let last: { x: number; y: number } | null = null;
    let frame = 0;
    let saveTimer = 0;

    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved)) {
        for (const key of saved) if (typeof key === "string") painted.add(key as Cell);
      }
    } catch {
      // a blocked or corrupt store just means an empty canvas
    }

    const save = () => {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify([...painted]));
        } catch {
          // out of quota or blocked: the painting simply does not outlive the visit
        }
      }, 400);
    };

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const styles = getComputedStyle(section);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = Number.parseFloat(styles.getPropertyValue("--px")) || 12;
      green = styles.getPropertyValue("--green").trim() || green;
    };

    /** The cell under a point in the section's box; the grid sits a pixel high (see FinalHero). */
    const cellAt = (x: number, y: number): Cell =>
      `${Math.floor(x / cell)},${Math.floor((y + 1) / cell)}`;

    const fill = (key: Cell, alpha: number) => {
      const [col = 0, row = 0] = key.split(",").map(Number);
      ctx.globalAlpha = alpha;
      ctx.fillRect(col * cell, row * cell - 1, cell - 1, cell - 1);
    };

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = green;
      for (const key of painted) fill(key, 0.55);
      for (const [key, at] of lit) {
        if (reduce) {
          fill(key, 0.7);
          continue;
        }
        const t = (now - at) / FADE_MS;
        if (t >= 1) {
          lit.delete(key);
          continue;
        }
        fill(key, (1 - t) * 0.8);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      render(now);
      // under reduced motion the lit cell does not decay, so there is nothing to animate
      frame = !reduce && lit.size > 0 ? requestAnimationFrame(tick) : 0;
    };

    const invalidate = () => {
      if (frame) return;
      frame = requestAnimationFrame(tick);
    };

    /** Light, paint or rub out every cell between the last point and this one. */
    const trace = (x: number, y: number) => {
      const from = last ?? { x, y };
      const distance = Math.hypot(x - from.x, y - from.y);
      const steps = Math.max(1, Math.ceil(distance / (cell * SAMPLE_FRACTION)));
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        const key = cellAt(from.x + (x - from.x) * t, from.y + (y - from.y) * t);
        if (stroke === "paint") {
          painted.add(key);
          if (painted.size > MAX_PAINTED) {
            const oldest = painted.values().next();
            if (!oldest.done) painted.delete(oldest.value);
          }
          lit.delete(key);
        } else if (stroke === "erase") {
          painted.delete(key);
          lit.delete(key);
        } else {
          if (reduce) lit.clear();
          lit.set(key, performance.now());
        }
      }
      last = { x, y };
      invalidate();
    };

    /** Mice and pens only: on a touch screen this would fight the page's own scrolling. */
    const fromPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return null;
      const rect = section.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onMove = (event: PointerEvent) => {
      const point = fromPointer(event);
      if (!point) return;
      trace(point.x, point.y);
    };

    const onDown = (event: PointerEvent) => {
      const point = fromPointer(event);
      if (!point) return;
      if (event.button === 0) stroke = "paint";
      else if (event.button === 2) stroke = "erase";
      else return;
      last = point;
      trace(point.x, point.y);
      save();
    };

    const onUp = () => {
      if (!stroke) return;
      stroke = null;
      save();
    };

    /** The right button is the rubber here, so the hero never opens the browser's menu. */
    const onContextMenu = (event: MouseEvent) => event.preventDefault();

    const onLeave = () => {
      stroke = null;
      last = null;
      if (reduce) {
        lit.clear();
        invalidate();
      }
      save();
    };

    measure();
    invalidate();

    const observer = new ResizeObserver(() => {
      measure();
      invalidate();
    });
    observer.observe(section);
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerdown", onDown);
    section.addEventListener("pointerleave", onLeave);
    section.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("pointerup", onUp);

    return () => {
      observer.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerdown", onDown);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("pointerup", onUp);
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(saveTimer);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...painted]));
      } catch {
        // as above
      }
    };
  }, [pathname, reduce]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
