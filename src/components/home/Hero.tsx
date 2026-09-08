"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { GlobeHero } from "@/components/home/heroes/GlobeHero";
import type { HeroProps } from "@/components/home/heroes/types";
import { DEFAULT_HERO, type HeroVariantId } from "@/lib/config/options";
import { useSiteConfig } from "@/lib/config/store";

/** Keeps the page from jumping while a non-default variant's code loads. */
function Loading() {
  return <section aria-hidden="true" className="min-h-[calc(100svh-var(--header-h))]" />;
}

const lazy = (load: () => Promise<ComponentType<HeroProps>>) => dynamic(load, { loading: Loading });

/**
 * The default variant ships with the page (server-rendered, in the bundle); the others are
 * separate chunks fetched only when chosen in the Shift + M menu.
 */
const VARIANTS: Record<HeroVariantId, ComponentType<HeroProps>> = {
  globe: GlobeHero,
  atlas: lazy(() => import("@/components/home/heroes/AtlasHero").then((m) => m.AtlasHero)),
  typewriter: lazy(() =>
    import("@/components/home/heroes/TypewriterHero").then((m) => m.TypewriterHero),
  ),
  cells: lazy(() => import("@/components/home/heroes/CellsHero").then((m) => m.CellsHero)),
  wordmark: lazy(() => import("@/components/home/heroes/WordmarkHero").then((m) => m.WordmarkHero)),
  photo: lazy(() => import("@/components/home/heroes/PhotoHero").then((m) => m.PhotoHero)),
};

/**
 * Home hero. Renders whichever variant the site configuration names (src/lib/config); the
 * server and the first client paint always show the default, and a saved choice takes over
 * right after hydration. Remounts on change so the new variant plays its entrance.
 */
export function Hero(props: HeroProps) {
  const { hero } = useSiteConfig();
  const Variant = VARIANTS[hero] ?? VARIANTS[DEFAULT_HERO];
  return <Variant key={hero} {...props} />;
}
