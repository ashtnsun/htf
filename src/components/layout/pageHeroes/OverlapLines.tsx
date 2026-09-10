"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** How much of the shorter line has to sit under the line above it. */
const MIN_OVERLAP = 0.25;
/** Tailwind's `md`, where <Headline stagger> starts pushing the later lines right. */
const STAGGERED = "(min-width: 48rem)";

/**
 * Keeps a staggered headline locked together: the second line is right-aligned to the column,
 * so on a short line ("*for good.*") it can drift clear of the line above and the two read as
 * separate blocks. This measures the rendered lines and pulls a line left until at least a
 * quarter of the shorter one sits under the line above — never past the column's left edge,
 * and never below `md`, where the lines stack. It is a transform, so nothing re-wraps.
 */
export function OverlapLines({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const heading = ref.current?.querySelector("h1");
    if (!heading) return;
    const lines = Array.from(heading.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    if (lines.length < 2) return;
    const staggered = window.matchMedia(STAGGERED);

    const apply = () => {
      for (const line of lines) line.style.transform = "";
      if (!staggered.matches) return;
      const column = heading.getBoundingClientRect();
      for (let i = 1; i < lines.length; i++) {
        const above = lines[i - 1]!.getBoundingClientRect();
        const line = lines[i]!;
        const rect = line.getBoundingClientRect();
        const wanted = MIN_OVERLAP * Math.min(above.width, rect.width);
        const missing = wanted - (above.right - rect.left);
        const shift = Math.min(Math.max(0, missing), rect.left - column.left);
        if (shift > 0.5) line.style.transform = `translateX(${-Math.round(shift)}px)`;
      }
    };

    apply();
    // The lines move with the viewport (the display size is fluid) and once the face loads.
    const observer = new ResizeObserver(apply);
    observer.observe(heading);
    staggered.addEventListener("change", apply);
    void document.fonts?.ready.then(apply);
    return () => {
      observer.disconnect();
      staggered.removeEventListener("change", apply);
      for (const line of lines) line.style.transform = "";
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
