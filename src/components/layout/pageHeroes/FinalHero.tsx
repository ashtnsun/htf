import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import { PixelField } from "@/components/layout/pageHeroes/PixelField";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";

/**
 * "Final", the shipped inner-page hero: the Pixels hero's fine square grid and glow around the
 * copy, and nothing else drawn in it — the grid itself is the graphic, and `PixelField` makes it
 * playable (cells light behind the pointer and fade; holding the button paints cells that stay).
 *
 * It carried a turning wireframe object per page until 2026-09-15; `HeroObject`, `Wireframe` and
 * `heroObjects.ts` are still here, unreferenced, like the other hero variants.
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
      <PixelField />
      <PageHeroContent {...props} stagger={false} className="z-10" />
    </PageHeroSection>
  );
}
