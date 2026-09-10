import { Globe } from "@/components/home/Globe";
import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";

/**
 * "Globe": the brand's wireframe globe on the right of the hero, three fifths of its height
 * and behind the headline — the page opens on the world the club works across. It is the same
 * SVG globe as the home hero and the partner map's fallback (home/Globe), so the meridians
 * turn slowly and stand still under prefers-reduced-motion. Decoration only.
 */
export function GlobeHero(props: PageHeroProps) {
  return (
    <PageHeroSection className="grid-overlay [--grid-cols:8] [--grid-row:8rem]">
      <PageHeroGlow className="h-[70%]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[-16%] aspect-square h-[46%] -translate-y-1/2 opacity-70 md:right-[4%] md:h-[60%]"
      >
        <Globe className="size-full" />
      </div>
      <PageHeroContent {...props} className="z-10" />
    </PageHeroSection>
  );
}
