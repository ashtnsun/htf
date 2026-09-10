import { Globe } from "@/components/home/Globe";
import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";

/**
 * "Globe": the brand's wireframe globe on the right of the hero, two thirds of its height,
 * its edge on the content container's right edge and the headline in front of it — the page opens on the world the club works across. It is the same
 * SVG globe as the home hero and the partner map's fallback (home/Globe), so the meridians
 * turn slowly and stand still under prefers-reduced-motion. Decoration only.
 */
export function GlobeHero(props: PageHeroProps) {
  return (
    <PageHeroSection className="grid-overlay [--grid-cols:8] [--grid-row:8rem]">
      <PageHeroGlow className="h-[70%]" />
      {/* the globe sits on the content container's right edge, not the viewport's */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="container-max flex h-full items-center justify-end container-x">
          <div className="-mr-[22%] aspect-square h-1/2 opacity-70 md:mr-0 md:h-2/3">
            <Globe className="size-full" />
          </div>
        </div>
      </div>
      <PageHeroContent {...props} overlap className="z-10" />
    </PageHeroSection>
  );
}
