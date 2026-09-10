import type { CSSProperties } from "react";
import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";

/**
 * The traces, in the order they draw. `d` is a right-angled run across the board and `pads`
 * are the points it solders down at; the last one is the green one.
 */
const TRACES = [
  { d: "M-10 300H80V236H236V168H500", pads: [[80, 236] as const, [236, 168] as const] },
  { d: "M-10 120H150V52H330V-10", pads: [[150, 52] as const] },
  { d: "M-10 236H36V150H186V92H500", pads: [[36, 150] as const, [186, 92] as const] },
];

/**
 * "Trace": the page as a board. Copper runs enter from the left, turn at right angles and
 * solder down at square pads, the last run in green; every line draws itself once on open and
 * then sits still, so under prefers-reduced-motion the board is simply finished. Decoration
 * only, faded out toward the headline so it never competes with it.
 */
export function TraceHero(props: PageHeroProps) {
  return (
    <PageHeroSection className="grid-overlay [--grid-cols:8] [--grid-row:8rem]">
      <PageHeroGlow />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 w-[min(150%,52rem)] [mask-image:linear-gradient(to_right,transparent_16%,#000_62%)]"
      >
        {/* the board keeps to the bottom band on a phone, where the column is narrow */}
        <div className="[mask-image:linear-gradient(to_top,#000_30%,transparent_88%)] md:[mask-image:none]">
          <svg viewBox="0 0 480 320" focusable="false" className="block h-auto w-full">
            {TRACES.map((trace, i) => {
              const green = i === TRACES.length - 1;
              const stroke = green ? "var(--green)" : "var(--line-strong)";
              return (
                <g key={trace.d}>
                  <path
                    className="anim-draw"
                    d={trace.d}
                    pathLength={1}
                    fill="none"
                    stroke={stroke}
                    strokeOpacity={green ? 0.85 : 1}
                    strokeWidth="1.6"
                    style={{ animationDelay: `${i * 0.22}s` } as CSSProperties}
                  />
                  {trace.pads.map(([x, y]) => (
                    <g key={`${x}-${y}`}>
                      <rect x={x - 6} y={y - 6} width="12" height="12" fill={stroke} />
                      <rect x={x - 2} y={y - 2} width="4" height="4" fill="var(--bg)" />
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <PageHeroContent {...props} className="z-10" />
    </PageHeroSection>
  );
}
