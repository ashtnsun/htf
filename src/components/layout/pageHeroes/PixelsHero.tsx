"use client";

import type { CSSProperties } from "react";
import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import { PIXEL_ICONS } from "@/components/layout/pageHeroes/pixelIcons";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";
import { usePageKey } from "@/components/layout/pageHeroes/usePageKey";

/** Seconds: when the first cell lights, and how long the whole picture takes to print. */
const START = 0.5;
const PRINT = 1.4;
const INK = { o: "var(--text)", "#": "var(--green)" } as const;

/**
 * "Pixels": the hero's grid is fine and square, and the page's own picture prints into it a
 * cell at a time, in reading order, like a raster: a window of code on Projects, a heart on
 * About, a rocket on Students, a toolbox on Nonprofits, an envelope on Contact
 * (layout/pageHeroes/pixelIcons). A green block cursor then blinks after the last row. The
 * picture is placed a whole number of cells from the hero's right and bottom edges, where the
 * grid is anchored, so every lit cell sits exactly in a grid square; the hairlines are drawn
 * over the cells. Below 90rem (where the longest headlines would reach it) the column leaves room under the copy for it. Under reduced motion the picture is simply there. Decoration only.
 */
export function PixelsHero(props: PageHeroProps) {
  const key = usePageKey();
  const map = PIXEL_ICONS[key ?? "projects"];
  const cols = map[0]!.length;
  const rows = map.length;
  const cells = map.flatMap((row, y) =>
    Array.from(row).flatMap((ch, x) => (ch === "o" || ch === "#" ? [{ x, y, ink: INK[ch] }] : [])),
  );

  return (
    <PageHeroSection
      data-pixels=""
      className="[--px:0.75rem] md:[--px:1rem] min-[90rem]:[--px:1.25rem]"
      style={{ "--pixel-rows": rows } as CSSProperties}
    >
      <PageHeroGlow className="h-[45%] opacity-60" />
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${cols + 2} ${rows}`}
        shapeRendering="crispEdges"
        className="pointer-events-none absolute bottom-[calc(var(--px)*2)] h-auto"
        style={{
          width: `calc(var(--px) * ${cols + 2})`,
          right: "round(up, max(var(--gutter), (100% - 90rem) / 2 + var(--gutter)), var(--px))",
        }}
      >
        {cells.map(({ x, y, ink }, i) => (
          <rect
            key={`${x}-${y}`}
            className="anim-pixel-on"
            style={{ animationDelay: `${(START + (i / cells.length) * PRINT).toFixed(3)}s` }}
            x={x}
            y={y}
            width={1}
            height={1}
            fill={ink}
          />
        ))}
        <g className="anim-pixel-on" style={{ animationDelay: `${START + PRINT + 0.1}s` }}>
          <rect
            className="anim-blink"
            x={cols + 1}
            y={rows - 1}
            width={1}
            height={1}
            fill={INK["#"]}
          />
        </g>
      </svg>
      {/* the square grid, anchored to the bottom right corner and drawn over the cells */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_90%_at_80%_70%,#000_25%,transparent_100%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
          backgroundSize: "var(--px) var(--px)",
          backgroundPosition: "right bottom",
        }}
      />
      {/* Below 90rem the picture sits under the copy, in room the column leaves for it. */}
      <PageHeroContent
        {...props}
        stagger={false}
        className="z-10 max-[90rem]:pb-[calc(var(--px)*(var(--pixel-rows)+4))]!"
      />
    </PageHeroSection>
  );
}
