"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useRef, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

const C = 200; // centre of the 400 grid
const ORBIT = 138;
const NODES = [
  { id: "students", label: "Students", angle: 205 },
  { id: "nonprofits", label: "Nonprofits", angle: 25 },
] as const;
const TICKS = Array.from({ length: 36 }, (_, i) => i * 10);

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * "Get involved" graphic: a beacon. The HTF mark sits at the centre sending out ping rings,
 * the two audiences orbit it on a dashed ring (labels stay upright), their links draw in
 * when the section scrolls into view, and a ticked dial turns slowly behind everything.
 * The whole thing floats: no card, a soft glow underneath, and it tilts a few degrees
 * toward the pointer. Decoration only; static under prefers-reduced-motion.
 */
export function SignalGraphic({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { once: true, margin: "0px 0px -15% 0px" });
  const active = inView || Boolean(reduce);

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
      data-active={active}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("relative aspect-square w-full select-none [perspective:1200px]", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[14%] bg-[radial-gradient(closest-side,rgba(3,198,82,0.2),transparent)]"
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

          {/* ticked dial, turning slowly */}
          <g className="anim-dial" stroke="var(--line-strong)">
            <circle cx={C} cy={C} r="176" fill="none" strokeOpacity="0.6" />
            {TICKS.map((deg) => (
              <line
                key={deg}
                x1={C}
                y1={C - 176}
                x2={C}
                y2={C - (deg % 90 === 0 ? 164 : 170)}
                transform={`rotate(${deg} ${C} ${C})`}
              />
            ))}
          </g>

          {/* ping rings from the centre */}
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={C}
              cy={C}
              r="40"
              fill="none"
              stroke="var(--green)"
              className="anim-ping-slow"
              style={{ animationDelay: `${i * 1.1}s` }}
            />
          ))}

          {/* orbit: dashed ring, the two audiences and their links to the centre */}
          <circle
            cx={C}
            cy={C}
            r={ORBIT}
            fill="none"
            stroke="var(--green)"
            strokeOpacity="0.45"
            strokeDasharray="2 7"
          />
          <g className="anim-orbit">
            {NODES.map((node, i) => {
              const a = (node.angle * Math.PI) / 180;
              const x = C + Math.cos(a) * ORBIT;
              const y = C + Math.sin(a) * ORBIT;
              const labelLeft = Math.cos(a) < 0;
              return (
                <g key={node.id}>
                  <line
                    x1={C}
                    y1={C}
                    x2={x}
                    y2={y}
                    pathLength="1"
                    stroke="var(--green)"
                    strokeOpacity="0.8"
                    className="anim-draw"
                    style={{ animationDelay: `${0.2 + i * 0.25}s` }}
                  />
                  {/* counter-rotated so the label stays upright while it orbits */}
                  <g className="anim-orbit-back" style={{ transformOrigin: `${x}px ${y}px` }}>
                    <rect x={x - 7} y={y - 7} width="14" height="14" fill="var(--green)" />
                    <rect
                      x={x - 13}
                      y={y - 13}
                      width="26"
                      height="26"
                      fill="none"
                      stroke="var(--green)"
                      strokeOpacity="0.5"
                    />
                    <text
                      x={labelLeft ? x - 20 : x + 20}
                      y={y + 4}
                      textAnchor={labelLeft ? "end" : "start"}
                      fill="var(--text)"
                      fontSize="11"
                      fontWeight="500"
                      letterSpacing="0.12em"
                      style={{ fontFamily: "var(--font-body)", textTransform: "uppercase" }}
                    >
                      {node.label}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* the mark at the centre */}
          <rect
            x={C - 26}
            y={C - 26}
            width="52"
            height="52"
            fill="var(--surface)"
            stroke="var(--green)"
            strokeWidth="1.5"
          />
          <text
            x={C}
            y={C + 5}
            textAnchor="middle"
            fill="var(--green)"
            fontSize="15"
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
