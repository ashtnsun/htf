import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";

/** Ring radii in viewBox units (the outer ring is the dish's edge). */
const RINGS = [38, 70, 102];

/**
 * "Radar": a dish sweeping the map in the corner of the hero — hairline rings, a green arm
 * turning once every nine seconds and one blip pinging where it found something. The arm is
 * its own square <svg> laid over the dish and turned as a whole: rotating a group inside a
 * viewBox that is centred on the origin puts the CSS transform origin in the wrong place.
 * The rings are the whole picture when the arm stops, so prefers-reduced-motion loses
 * nothing. Decoration only.
 */
export function RadarHero(props: PageHeroProps) {
  return (
    <PageHeroSection className="grid-overlay [--grid-cols:8] [--grid-row:8rem]">
      <PageHeroGlow />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-24%] bottom-[-20%] aspect-square w-[min(70%,22rem)] md:right-[-2%] md:bottom-[-14%] md:w-[clamp(16rem,26vw,25rem)]"
      >
        <svg viewBox="-112 -112 224 224" focusable="false" className="absolute inset-0 size-full">
          <g
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          >
            {RINGS.map((r) => (
              <circle key={r} r={r} />
            ))}
            <path d="M-102 0H102M0 -102V102" strokeOpacity="0.6" />
          </g>
          {/* the blip */}
          <g transform="translate(44 -46)">
            <circle
              className="anim-page-ping"
              r="7"
              fill="none"
              stroke="var(--green)"
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
            />
            <rect x="-3.5" y="-3.5" width="7" height="7" fill="var(--green)" />
          </g>
        </svg>
        {/* the arm and the light it drags behind it */}
        <svg
          viewBox="-112 -112 224 224"
          focusable="false"
          className="anim-page-turn absolute inset-0 size-full [--turn:9s]"
        >
          <defs>
            <linearGradient id="page-radar-sweep" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--green)" stopOpacity="0.45" />
              <stop offset="1" stopColor="var(--green)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 0L102 -30A102 102 0 0 1 102 30Z" fill="url(#page-radar-sweep)" />
          <path
            d="M0 0H102"
            fill="none"
            stroke="var(--green)"
            strokeOpacity="0.8"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <PageHeroContent {...props} className="z-10" />
    </PageHeroSection>
  );
}
