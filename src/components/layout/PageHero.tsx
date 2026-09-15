"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { GlobeHero } from "@/components/layout/pageHeroes/GlobeHero";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";
import { DEFAULT_PAGE_HERO, type PageHeroVariantId } from "@/lib/config/options";
import { useSiteConfig } from "@/lib/config/store";

/** Keeps the page from jumping while a non-default variant's code loads. */
function Loading() {
  return <section aria-hidden="true" className="min-h-[24rem]" />;
}

const lazy = (load: () => Promise<ComponentType<PageHeroProps>>) =>
  dynamic(load, { loading: Loading });

/**
 * The default variant ships with the page (server-rendered, in the bundle); the others are
 * separate chunks fetched only when chosen in the Shift + M menu.
 */
const VARIANTS: Record<PageHeroVariantId, ComponentType<PageHeroProps>> = {
  globe: GlobeHero,
  frame: lazy(() => import("@/components/layout/pageHeroes/FrameHero").then((m) => m.FrameHero)),
  radar: lazy(() => import("@/components/layout/pageHeroes/RadarHero").then((m) => m.RadarHero)),
  corridor: lazy(() =>
    import("@/components/layout/pageHeroes/CorridorHero").then((m) => m.CorridorHero),
  ),
  trace: lazy(() => import("@/components/layout/pageHeroes/TraceHero").then((m) => m.TraceHero)),
  dither: lazy(() => import("@/components/layout/pageHeroes/DitherHero").then((m) => m.DitherHero)),
  dino: lazy(() => import("@/components/layout/pageHeroes/DinoHero").then((m) => m.DinoHero)),
  editorial: lazy(() =>
    import("@/components/layout/pageHeroes/EditorialHero").then((m) => m.EditorialHero),
  ),
  pixels: lazy(() => import("@/components/layout/pageHeroes/PixelsHero").then((m) => m.PixelsHero)),
  viewfinder: lazy(() =>
    import("@/components/layout/pageHeroes/ViewfinderHero").then((m) => m.ViewfinderHero),
  ),
  cameo: lazy(() => import("@/components/layout/pageHeroes/CameoHero").then((m) => m.CameoHero)),
  dock: lazy(() => import("@/components/layout/pageHeroes/DockHero").then((m) => m.DockHero)),
  final: lazy(() => import("@/components/layout/pageHeroes/FinalHero").then((m) => m.FinalHero)),
};

/**
 * The hero of every inner page (Projects, About, Students, Nonprofits, Contact). Renders
 * whichever variant the site configuration names (src/lib/config); the server and the first
 * client paint always show the default, and a saved choice takes over right after hydration.
 * Remounts on change so the new variant plays its entrance. The 404 and the privacy page sit
 * outside the switch: they use `pageHeroes/FrameHero` directly, with its `back` and `ghost`
 * (which is why Frame is a chunk here even though it is a shipped hero elsewhere).
 */
export function PageHero(props: PageHeroProps) {
  const { pageHero } = useSiteConfig();
  const Variant = VARIANTS[pageHero] ?? VARIANTS[DEFAULT_PAGE_HERO];
  return <Variant key={pageHero} {...props} />;
}
