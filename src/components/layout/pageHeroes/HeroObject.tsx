"use client";

import { Globe } from "@/components/home/Globe";
import { HERO_OBJECTS } from "@/components/layout/pageHeroes/heroObjects";
import { usePageKey } from "@/components/layout/pageHeroes/usePageKey";
import { Wireframe } from "@/components/layout/pageHeroes/Wireframe";

/**
 * The turning object in the inner-page hero, one per page (heroObjects): a briefcase on
 * Projects, a rocket on Students, a heart on Nonprofits, a paper aeroplane on Contact, and the
 * globe itself on About. Decoration only.
 */
export function HeroObject({ className }: { className?: string }) {
  const key = usePageKey();
  const model = key ? HERO_OBJECTS[key] : null;
  if (!model) return <Globe className={className} />;
  return <Wireframe model={model} className={className} />;
}
