import type { CSSProperties } from "react";
import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";

/**
 * The ramp, coarsest first: big cells reach highest and thin out, small ones crowd the very
 * bottom edge. `fade` is how far up that layer's band survives.
 */
const LAYERS = [
  { size: "18px", opacity: 0.2, fade: "78%", height: "68%" },
  { size: "11px", opacity: 0.28, fade: "62%", height: "44%" },
  { size: "6px", opacity: 0.36, fade: "52%", height: "26%" },
];

/**
 * "Dither": the shipped hero's green glow, drawn in pixels instead of light. Three
 * checkerboards of different cell sizes stack along the bottom edge, the coarse one reaching
 * highest, so the colour ramps up out of the page the way an old 8-bit gradient does. The
 * same language as the pixel T-rex: whole cells, no scaling, nothing moving. Decoration only.
 */
export function DitherHero(props: PageHeroProps) {
  return (
    <PageHeroSection className="grid-overlay [--grid-cols:8] [--grid-row:8rem]">
      <PageHeroGlow className="opacity-50" />
      {LAYERS.map((layer) => (
        <span
          key={layer.size}
          aria-hidden="true"
          className="page-hero-checks pointer-events-none absolute inset-x-0 bottom-0 block"
          style={
            {
              "--check-size": layer.size,
              height: layer.height,
              opacity: layer.opacity,
              maskImage: `radial-gradient(72% 100% at 50% 100%, #000 0, transparent ${layer.fade})`,
            } as CSSProperties
          }
        />
      ))}
      <PageHeroContent {...props} className="z-10" />
    </PageHeroSection>
  );
}
