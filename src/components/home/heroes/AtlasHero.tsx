"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import { hero } from "@content/hero";
import { HeroShell } from "@/components/home/heroes/HeroShell";
import type { HeroProps } from "@/components/home/heroes/types";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { DottedMap } from "@/components/ui/DottedMap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { cn } from "@/lib/utils";

/**
 * public/maps/world-dots.svg is an equirectangular grid: 1.25° per 4 units, longitude −180
 * at x = 0, latitude 84 at y = 0 (see scripts/gen-world-dots.mjs). 3.2 units per degree.
 */
const MAP_W = 1152;
const MAP_H = 456;
const toMap = (lat: number, lng: number) => ({ x: (lng + 180) * 3.2, y: (84 - lat) * 3.2 });
const toPercent = (lat: number, lng: number) => {
  const { x, y } = toMap(lat, lng);
  return { left: `${((x / MAP_W) * 100).toFixed(3)}%`, top: `${((y / MAP_H) * 100).toFixed(3)}%` };
};

/** Purdue's West Lafayette campus, where every route starts. */
const ORIGIN = { lat: 40.4237, lng: -86.9212 };

/** A route from the origin to a pin: a quadratic curve bowing upward like a flight path. */
function routePath(lat: number, lng: number): string {
  const a = toMap(ORIGIN.lat, ORIGIN.lng);
  const b = toMap(lat, lng);
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2 - dist * 0.22;
  return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/**
 * "Atlas": the statement centred over the dotted world map. Routes draw out from Purdue to
 * every partner location and a pin pops in as each one arrives; pointing at a pin brings its
 * route forward. The pins are the same data as the partner globe on /nonprofits. Decoration:
 * hidden from assistive tech, static under prefers-reduced-motion, pings paused off-screen.
 */
export function AtlasHero({ pins }: HeroProps) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.05 });
  const [active, setActive] = useState<string | null>(null);
  const origin = toPercent(ORIGIN.lat, ORIGIN.lng);

  return (
    <HeroShell ref={ref} grid={false} data-live={inView}>
      <RevealGroup
        mode="mount"
        stagger={0.12}
        className="relative container-max flex w-full flex-1 flex-col container-x pt-8 pb-10 md:pt-10 lg:frame-marks lg:mt-6 lg:border-x lg:border-line"
      >
        <Reveal>
          <Eyebrow>{hero.eyebrow}</Eyebrow>
        </Reveal>

        <Reveal className="my-auto py-12 md:py-16">
          <Headline
            as="h1"
            id="hero-title"
            size="display-fluid"
            align="center"
            lines={[...hero.lines]}
            className="mx-auto max-w-5xl"
          />
        </Reveal>

        {/* the map, bottom of the frame, edges faded so it floats */}
        <Reveal className="mt-auto">
          <div
            aria-hidden="true"
            className="relative mx-auto w-full max-w-[min(100%,72rem)] [mask-image:radial-gradient(70%_75%_at_50%_50%,#000_45%,transparent_100%)]"
          >
            <DottedMap className="opacity-40" />

            {/* routes */}
            <svg
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              className="pointer-events-none absolute inset-0 size-full overflow-visible"
              fill="none"
            >
              {pins.map((pin, i) => (
                <path
                  key={pin.id}
                  d={routePath(pin.lat, pin.lng)}
                  pathLength={1}
                  stroke="var(--green)"
                  strokeOpacity={active === pin.id ? 1 : 0.45}
                  strokeWidth={active === pin.id ? 2 : 1.25}
                  vectorEffect="non-scaling-stroke"
                  className={cn(
                    "transition-[stroke-opacity,stroke-width] duration-200",
                    !reduce && "anim-draw",
                  )}
                  style={{ animationDelay: `${0.4 + i * 0.14}s` }}
                />
              ))}
            </svg>

            {/* origin */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: origin.left, top: origin.top }}
            >
              <span className="block size-2.5 bg-green" />
              <span className="absolute top-full left-1/2 mt-2 hidden -translate-x-1/2 text-eyebrow font-medium whitespace-nowrap text-text uppercase md:block">
                Purdue
              </span>
            </div>

            {/* pins */}
            {pins.map((pin, i) => {
              const pos = toPercent(pin.lat, pin.lng);
              const isActive = active === pin.id;
              return (
                <div
                  key={pin.id}
                  data-pin={pin.id}
                  onPointerEnter={() => setActive(pin.id)}
                  onPointerLeave={() => setActive((v) => (v === pin.id ? null : v))}
                  className={cn(
                    "pointer-events-auto absolute size-6 -translate-x-1/2 -translate-y-1/2",
                    !reduce && "anim-pop",
                  )}
                  style={{ left: pos.left, top: pos.top, animationDelay: `${1.3 + i * 0.14}s` }}
                >
                  {reduce ? null : (
                    <span
                      className="anim-hero-ping absolute inset-1.5 border border-green"
                      style={{ animationDelay: `${2 + i * 0.35}s` }}
                    />
                  )}
                  <span
                    className={cn(
                      "absolute inset-0 border transition-colors duration-200",
                      isActive ? "border-green" : "border-transparent",
                    )}
                  />
                  <span className="absolute inset-2 bg-green" />
                </div>
              );
            })}
          </div>
        </Reveal>
      </RevealGroup>
    </HeroShell>
  );
}
