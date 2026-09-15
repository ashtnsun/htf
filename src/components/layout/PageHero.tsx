import { FinalHero } from "@/components/layout/pageHeroes/FinalHero";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";

/**
 * The hero of every inner page (Projects, About, Students, Nonprofits, Contact): the Pixels
 * grid with the wireframe globe (pageHeroes/FinalHero). The 404 and the privacy page use
 * `pageHeroes/FrameHero` directly, with its `back` and `ghost`. The other variants in
 * pageHeroes/ are no longer reachable since the Shift + M menu was removed (2026-09-15).
 */
export function PageHero(props: PageHeroProps) {
  return <FinalHero {...props} />;
}
