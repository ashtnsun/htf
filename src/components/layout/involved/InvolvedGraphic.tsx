"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { TerminalGraphic } from "@/components/layout/involved/TerminalGraphic";
import type { InvolvedGraphicProps } from "@/components/layout/involved/types";
import { DEFAULT_INVOLVED, type InvolvedVariantId } from "@/lib/config/options";
import { useSiteConfig } from "@/lib/config/store";

/** Holds the square while a non-default variant's code loads, so the section never jumps. */
function Loading() {
  return <div aria-hidden="true" className="aspect-square w-full" />;
}

const lazy = (load: () => Promise<ComponentType<InvolvedGraphicProps>>) =>
  dynamic(load, { loading: Loading });

/**
 * The default variant ships with the page (server-rendered, in the bundle); the others are
 * separate chunks fetched only when chosen in the Shift + M menu.
 */
const VARIANTS: Record<InvolvedVariantId, ComponentType<InvolvedGraphicProps>> = {
  terminal: TerminalGraphic,
  chat: lazy(() => import("@/components/layout/involved/ChatGraphic").then((m) => m.ChatGraphic)),
  badge: lazy(() =>
    import("@/components/layout/involved/BadgeGraphic").then((m) => m.BadgeGraphic),
  ),
};

/**
 * The Get involved graphic. Renders whichever variant the site configuration names
 * (src/lib/config); the server and the first client paint always show the default, and a
 * saved choice takes over right after hydration. Remounts on change so the new variant plays
 * its entrance.
 */
export function InvolvedGraphic(props: InvolvedGraphicProps) {
  const { involved } = useSiteConfig();
  const Variant = VARIANTS[involved] ?? VARIANTS[DEFAULT_INVOLVED];
  return <Variant key={involved} {...props} />;
}
