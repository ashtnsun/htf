"use client";

import { usePathname } from "next/navigation";
import { site } from "@content/site";

/** The inner pages that render layout/PageHero, in the order the site presents them. */
export const PAGE_KEYS = ["projects", "about", "students", "nonprofits", "contact"] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

/**
 * Which inner page the hero is on, for the variants that draw something of their own per page
 * (the Pixels icon, the Cameo dinosaur, the Editorial index). Null anywhere else.
 */
export function usePageKey(): PageKey | null {
  const segment = usePathname()?.split("/")[1] ?? "";
  return (PAGE_KEYS as readonly string[]).includes(segment) ? (segment as PageKey) : null;
}

/**
 * The page's place in the site: the header nav's order (Home left out), then Contact, which
 * the nav reaches through its call to action. 1-based; null off the inner pages.
 */
export function pageIndex(key: PageKey | null): { index: number; total: number } | null {
  if (!key) return null;
  const order = [
    ...site.nav.map((link) => link.href.slice(1)).filter(Boolean),
    ...PAGE_KEYS.filter((k) => !site.nav.some((link) => link.href === `/${k}`)),
  ];
  const index = order.indexOf(key);
  return index < 0 ? null : { index: index + 1, total: order.length };
}
