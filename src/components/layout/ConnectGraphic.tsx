"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useRef, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const C = 200; // centre of the 400 grid
const S = 128; // module size
const GAP = 96; // distance between the modules before they dock
const SEAM = 6; // the lit seam between them once docked
const TOP = C - S / 2;
const RAIL = C + S / 2 + 22;
const MARK = { x: C - 20, y: TOP - 66, size: 40 };
const TICKS = Array.from({ length: 17 }, (_, i) => 40 + i * 20);
const PINS = [44, 64, 84];

const MODULES = [
  { id: "students", label: "Students", x: C - GAP / 2 - S, dx: (GAP - SEAM) / 2 },
  { id: "nonprofits", label: "Nonprofits", x: C + GAP / 2, dx: -(GAP - SEAM) / 2 },
] as const;

/**
 * "Get involved" graphic: two modules, one per audience, docking into one unit. They sit
 * apart on a rail until the section scrolls into view, then slide together; the seam
 * between them lights up, the HTF mark above connects to it and starts to ping. The whole
 * thing floats (no card, a soft glow, a few degrees of tilt toward the pointer).
 * Decoration only; docked and static under prefers-reduced-motion.
 */
export function ConnectGraphic({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { once: true, margin: "0px 0px -15% 0px" });
  const docked = inView || Boolean(reduce);
  const t = (prop: string, ms: number, delay = 0) =>
    reduce ? "none" : `${prop} ${ms}ms ${EASE} ${docked ? delay : 0}ms`;

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = tiltRef.current;
    if (!el || reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - rect.left) / rect.width - 0.5;
    const dy = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transition = "none";
    el.style.transform = `rotateX(${(-dy * 10).toFixed(2)}deg) rotateY(${(dx * 10).toFixed(2)}deg)`;
  }

  function onPointerLeave() {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transition = `transform 700ms ${EASE}`;
    el.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  return (
    <div
      ref={frameRef}
      data-active={docked}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("relative aspect-square w-full select-none [perspective:1200px]", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[14%] bg-[radial-gradient(closest-side,rgba(3,198,82,0.18),transparent)]"
      />
      <div ref={tiltRef} className="anim-float size-full will-change-transform">
        <svg
          viewBox="0 0 400 400"
          aria-hidden="true"
          focusable="false"
          className="absolute inset-0 size-full overflow-visible"
        >
          {/* viewfinder corners */}
          <path
            d="M16 44V16H44M356 16H384V44M384 356V384H356M44 384H16V356"
            fill="none"
            stroke="var(--line-strong)"
          />

          {/* the rail the modules travel on */}
          <g stroke="var(--line-strong)">
            <line x1="40" y1={RAIL} x2="360" y2={RAIL} />
            {TICKS.map((x) => (
              <line key={x} x1={x} y1={RAIL} x2={x} y2={RAIL + (x === C ? 10 : 5)} />
            ))}
          </g>

          {/* the dashed link across the gap, gone once the modules meet */}
          <line
            x1={C - GAP / 2}
            y1={C}
            x2={C + GAP / 2}
            y2={C}
            stroke="var(--green)"
            strokeOpacity="0.6"
            strokeDasharray="2 6"
            style={{ opacity: docked ? 0 : 1, transition: t("opacity", 300) }}
          />

          {/* the seam lights up once they meet */}
          <g style={{ opacity: docked ? 1 : 0, transition: t("opacity", 600, 750) }}>
            <rect
              x={C - SEAM / 2 - 12}
              y={TOP - 6}
              width={SEAM + 24}
              height={S + 12}
              fill="var(--green)"
              fillOpacity="0.16"
              style={{ filter: "blur(10px)" }}
            />
            <rect x={C - SEAM / 2} y={TOP} width={SEAM} height={S} fill="var(--green)" />
          </g>

          {/* the two modules */}
          {MODULES.map((m) => (
            <g
              key={m.id}
              style={{
                transform: `translate(${docked ? m.dx : 0}px, 0)`,
                transition: t("transform", 900, 100),
              }}
            >
              <rect
                x={m.x}
                y={TOP}
                width={S}
                height={S}
                fill="var(--surface)"
                strokeWidth="1.5"
                style={{
                  stroke: docked ? "var(--green)" : "var(--line-strong)",
                  transition: t("stroke", 500, 750),
                }}
              />
              {/* the plug on the students module; it disappears into the seam once docked */}
              {m.dx > 0
                ? PINS.map((y) => (
                    <line
                      key={y}
                      x1={m.x + S}
                      y1={TOP + y}
                      x2={m.x + S + SEAM}
                      y2={TOP + y}
                      stroke="var(--green)"
                      strokeWidth="2"
                    />
                  ))
                : null}
              <rect
                x={m.x + 14}
                y={TOP + 14}
                width="8"
                height="8"
                style={{
                  fill: docked ? "var(--green)" : "var(--line-strong)",
                  transition: t("fill", 500, 750),
                }}
              />
              <text
                x={m.x + 14}
                y={TOP + S - 16}
                fill="var(--text)"
                fontSize="11"
                fontWeight="500"
                letterSpacing="0.12em"
                style={{ fontFamily: "var(--font-body)", textTransform: "uppercase" }}
              >
                {m.label}
              </text>
            </g>
          ))}

          {/* the mark connects to the seam and pings */}
          <g style={{ opacity: docked ? 1 : 0, transition: t("opacity", 500, 900) }}>
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={C}
                cy={MARK.y + MARK.size / 2}
                r="30"
                fill="none"
                stroke="var(--green)"
                className="anim-ping-slow"
                style={{ animationDelay: `${i * 1.2}s` }}
              />
            ))}
            <line
              x1={C}
              y1={MARK.y + MARK.size}
              x2={C}
              y2={TOP}
              pathLength="1"
              stroke="var(--green)"
              className="anim-draw"
              style={{ animationDelay: "0.9s" }}
            />
          </g>
          <rect
            x={MARK.x}
            y={MARK.y}
            width={MARK.size}
            height={MARK.size}
            fill="var(--surface)"
            stroke="var(--green)"
            strokeWidth="1.5"
          />
          <text
            x={C}
            y={MARK.y + MARK.size / 2 + 5}
            textAnchor="middle"
            fill="var(--green)"
            fontSize="13"
            fontWeight="600"
            letterSpacing="0.06em"
            style={{ fontFamily: "var(--font-display)" }}
          >
            HTF
          </text>
        </svg>
      </div>
    </div>
  );
}
