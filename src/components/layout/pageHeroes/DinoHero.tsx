import { DINO_COLS, DINO_EYE, DINO_ROWS, dinoCells } from "@/components/brand/dino-pixels";
import { PageHeroContent, PageHeroSection } from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";

const cells = dinoCells();

/**
 * "Dino": the hero stands on a hairline ground the T-rex walks in along. It is the same
 * 20 x 22 pixel map as the footer and the process scene (brand/dino-pixels), drawn at a whole
 * number of pixels per cell and moved a whole cell at a time (steps), so nothing blurs; it
 * bobs once per step and blinks where it stops. Under prefers-reduced-motion it is simply
 * standing there. Decoration only.
 */
export function DinoHero(props: PageHeroProps) {
  return (
    <PageHeroSection className="grid-overlay border-b border-line [--grid-cols:8] [--grid-row:8rem]">
      <PageHeroContent {...props} className="pb-56 md:pb-60" />

      {/* the ground the dinosaur walks in on */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-10 block h-px bg-line-strong"
      />
      <div
        aria-hidden="true"
        className="anim-page-walk pointer-events-none absolute bottom-10 left-(--gutter) select-none [--dino-cell:5px] md:[--dino-cell:7px]"
      >
        <div className="anim-page-step">
          <svg
            viewBox={`0 0 ${DINO_COLS} ${DINO_ROWS}`}
            className="block h-auto text-green"
            style={{ width: `calc(var(--dino-cell) * ${DINO_COLS})` }}
            shapeRendering="crispEdges"
            focusable="false"
          >
            <g fill="currentColor">
              {cells.map(({ x, y }) => (
                <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
              ))}
              <rect className="anim-eyelid" x={DINO_EYE.x} y={DINO_EYE.y} width={1} height={1} />
            </g>
          </svg>
        </div>
      </div>
    </PageHeroSection>
  );
}
