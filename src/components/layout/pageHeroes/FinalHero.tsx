import { Globe } from "@/components/home/Globe";
import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";

/**
 * "Final", the shipped inner-page hero: the Pixels hero's fine square grid and glow around the
 * copy, with the Globe hero's wireframe globe on the right, centred in the hero on the content
 * container's right edge. The globe turns slowly and stands still under reduced motion.
 * Decoration only.
 */
export function FinalHero(props: PageHeroProps) {
  return (
    <PageHeroSection className="[--px:12px] md:[--px:16px] min-[90rem]:[--px:20px]">
      <PageHeroGlow className="h-[45%] opacity-60" />
      {/* the square grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(120%_100%_at_50%_40%,#000_35%,transparent_100%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)",
          backgroundSize: "var(--px) var(--px)",
          backgroundPosition: "0 -1px",
        }}
      />
      {/* the Globe hero's wireframe globe, fully in frame, its right side on the content container's right edge */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="container-max flex h-full items-center justify-end container-x">
          <div className="aspect-square w-1/2 max-w-full opacity-70 md:h-2/3 md:w-auto">
            <Globe className="size-full" />
          </div>
        </div>
      </div>
      <PageHeroContent {...props} stagger={false} className="z-10" />
    </PageHeroSection>
  );
}
