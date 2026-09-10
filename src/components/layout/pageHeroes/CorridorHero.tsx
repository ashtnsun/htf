import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";

/** Half-widths of the nested frames, each 0.68 of the one outside it. */
const FRAMES = [280, 190, 129, 88, 60, 41, 28];
/** The frame drawn in green (the third one in). */
const GREEN_FRAME = 2;
const ASPECT = 0.52;

/**
 * "Corridor": the site's frame, repeated into the distance. Hairline rectangles nest toward a
 * vanishing point in the lower right, four spokes running back to it, one frame green, and a
 * green frame coming forward out of the depth every few seconds. That one is gone under
 * prefers-reduced-motion, where the corridor itself is still the whole picture. Decoration
 * only.
 */
export function CorridorHero(props: PageHeroProps) {
  return (
    <PageHeroSection className="grid-overlay [--grid-cols:8] [--grid-row:8rem]">
      <PageHeroGlow />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-30%] bottom-[-14%] w-[min(130%,20rem)] md:right-[-4%] md:bottom-[-4%] md:w-[clamp(22rem,34vw,34rem)]"
      >
        <svg viewBox="-300 -156 600 312" focusable="false" className="block h-auto w-full">
          <g fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke">
            {/* the spokes back to the vanishing point */}
            <path
              d={`M${-FRAMES[0]!} ${-FRAMES[0]! * ASPECT}L0 0M${FRAMES[0]!} ${-FRAMES[0]! * ASPECT}L0 0M${-FRAMES[0]!} ${FRAMES[0]! * ASPECT}L0 0M${FRAMES[0]!} ${FRAMES[0]! * ASPECT}L0 0`}
              stroke="var(--line)"
            />
            {FRAMES.map((half, i) => (
              <rect
                key={half}
                x={-half}
                y={-half * ASPECT}
                width={half * 2}
                height={half * ASPECT * 2}
                stroke={i === GREEN_FRAME ? "var(--green)" : "var(--line-strong)"}
                strokeOpacity={i === GREEN_FRAME ? 0.75 : 1 - i * 0.1}
              />
            ))}
            {/* one more frame, coming forward */}
            <rect
              className="anim-page-ping"
              x={-FRAMES.at(-1)!}
              y={-FRAMES.at(-1)! * ASPECT}
              width={FRAMES.at(-1)! * 2}
              height={FRAMES.at(-1)! * ASPECT * 2}
              stroke="var(--green)"
            />
          </g>
        </svg>
      </div>
      <PageHeroContent {...props} className="z-10" />
    </PageHeroSection>
  );
}
