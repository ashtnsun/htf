"use client";

import { useId } from "react";
import type { ProcessStep } from "@/lib/content/schemas";
import { Globe } from "@/components/home/Globe";
import { cn } from "@/lib/utils";

type Graphic = ProcessStep["graphic"];

type ProcessGraphicProps = {
  graphic: Graphic;
  /** Runs the step's animation; inactive graphics are paused / reset (see globals.css). */
  active: boolean;
  className?: string;
};

/**
 * Wireframe illustrations for the four process steps, all on one 400×400 grid in the brand
 * green: a radar sweep (discover), a team network (match), a terminal filling with progress
 * bars (build) and the globe with a delivery pin (deliver). Decoration only.
 */
export function ProcessGraphic({ graphic, active, className }: ProcessGraphicProps) {
  return (
    <div
      data-active={active}
      aria-hidden="true"
      className={cn("relative aspect-square w-full select-none", className)}
    >
      {graphic === "radar" ? <Radar /> : null}
      {graphic === "network" ? <Network /> : null}
      {graphic === "terminal" ? <Terminal /> : null}
      {graphic === "globe" ? <Delivery active={active} /> : null}
    </div>
  );
}

const svgProps = {
  viewBox: "0 0 400 400",
  className: "absolute inset-0 size-full",
  focusable: "false",
} as const;

/** Faint ticks at the four corners of the 400 grid, shared by every graphic. */
function CornerTicks() {
  return (
    <g stroke="var(--line-strong)" strokeWidth="1">
      <path d="M24 40V24H40M360 24H376V40M376 360V376H360M40 376H24V360" fill="none" />
    </g>
  );
}

function Radar() {
  const id = useId();
  const blips = [
    { x: 252, y: 118, delay: "0s" },
    { x: 118, y: 236, delay: "0.9s" },
    { x: 282, y: 262, delay: "1.7s" },
  ];
  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--green)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--green)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <CornerTicks />
      <g fill="none" stroke="var(--line-strong)" strokeWidth="1">
        <circle cx="200" cy="200" r="50" />
        <circle cx="200" cy="200" r="100" />
        <circle cx="200" cy="200" r="150" strokeDasharray="3 6" />
        <path d="M200 30V370M30 200H370" />
      </g>
      <circle cx="200" cy="200" r="160" fill="none" stroke="var(--green)" strokeOpacity="0.7" />
      <g className="anim-sweep">
        <path d="M200 200V40A160 160 0 0 1 313.1 86.9Z" fill={`url(#${id}-sweep)`} />
        <path d="M200 200V40" stroke="var(--green)" strokeWidth="1.5" />
      </g>
      {blips.map((b) => (
        <g key={b.delay}>
          <rect x={b.x - 3} y={b.y - 3} width="6" height="6" fill="var(--green)" />
          <circle
            cx={b.x}
            cy={b.y}
            r="9"
            fill="none"
            stroke="var(--green)"
            className="anim-ping"
            style={{ animationDelay: b.delay }}
          />
        </g>
      ))}
      <rect x="196" y="196" width="8" height="8" fill="var(--green)" />
    </svg>
  );
}

/** One project lead (filled), five developers (outline), two designers (dashed outline). */
function Network() {
  const kinds = ["lead", "dev", "design", "dev", "dev", "design", "dev", "dev"] as const;
  const nodes = kinds.map((kind, i) => {
    const angle = (-90 + i * 45) * (Math.PI / 180);
    return { kind, x: 200 + Math.cos(angle) * 128, y: 200 + Math.sin(angle) * 128, i };
  });
  return (
    <svg {...svgProps}>
      <CornerTicks />
      <circle
        cx="200"
        cy="200"
        r="128"
        fill="none"
        stroke="var(--line-strong)"
        strokeDasharray="2 6"
      />
      {nodes.map((n) => (
        <line
          key={`l-${n.i}`}
          x1="200"
          y1="200"
          x2={n.x}
          y2={n.y}
          pathLength="1"
          stroke="var(--green)"
          strokeOpacity="0.8"
          className="anim-draw"
          style={{ animationDelay: `${0.15 + n.i * 0.12}s` }}
        />
      ))}
      <rect
        x="182"
        y="182"
        width="36"
        height="36"
        fill="var(--surface)"
        stroke="var(--green)"
        strokeWidth="1.5"
      />
      <path d="M192 200H208M200 192V208" stroke="var(--green)" strokeWidth="1.5" />
      {nodes.map((n) => {
        const size = n.kind === "lead" ? 22 : 16;
        return (
          <rect
            key={`n-${n.i}`}
            x={n.x - size / 2}
            y={n.y - size / 2}
            width={size}
            height={size}
            fill={n.kind === "lead" ? "var(--green)" : "var(--surface)"}
            stroke="var(--green)"
            strokeWidth="1.5"
            strokeDasharray={n.kind === "design" ? "3 3" : undefined}
          />
        );
      })}
    </svg>
  );
}

function Terminal() {
  const bars = [168, 232, 120, 256, 188, 96];
  return (
    <svg {...svgProps}>
      <CornerTicks />
      <rect x="48" y="64" width="304" height="272" fill="none" stroke="var(--line-strong)" />
      <path d="M48 96H352" stroke="var(--line-strong)" />
      <g fill="var(--line-strong)">
        <rect x="60" y="76" width="8" height="8" />
        <rect x="74" y="76" width="8" height="8" />
        <rect x="88" y="76" width="8" height="8" />
      </g>
      {bars.map((width, i) => {
        const y = 120 + i * 30;
        return (
          <g key={y}>
            <rect x="64" y={y} width="6" height="6" fill="var(--green)" />
            <rect x="80" y={y} width="256" height="6" fill="var(--surface-2)" />
            <rect
              x="80"
              y={y}
              width={width}
              height="6"
              fill="var(--green)"
              className="anim-grow"
              style={{ animationDelay: `${0.1 + i * 0.18}s` }}
            />
          </g>
        );
      })}
      <rect x="64" y="304" width="8" height="14" fill="var(--green)" className="anim-blink" />
      <path d="M80 311H120" stroke="var(--line-strong)" />
    </svg>
  );
}

function Delivery({ active }: { active: boolean }) {
  return (
    <>
      <Globe animate={active} className="absolute inset-[9%] size-[82%]" />
      <svg {...svgProps}>
        <CornerTicks />
        <g transform="translate(262 128)">
          <circle r="12" fill="none" stroke="var(--green)" className="anim-ping" />
          <rect x="-5" y="-5" width="10" height="10" fill="var(--green)" />
        </g>
        <path
          d="M262 128H330V88"
          pathLength="1"
          fill="none"
          stroke="var(--green)"
          className="anim-draw"
          style={{ animationDelay: "0.3s" }}
        />
        <rect x="318" y="52" width="36" height="36" fill="var(--surface)" stroke="var(--green)" />
        <path
          d="M327 71l6 6 12-13"
          pathLength="1"
          fill="none"
          stroke="var(--green)"
          strokeWidth="2"
          className="anim-draw"
          style={{ animationDelay: "0.9s" }}
        />
      </svg>
    </>
  );
}
