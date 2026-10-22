"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders the site header or footer everywhere except Portfolio Night (/portfolio and
 * /portfoliohost), which is its own frame: a side menu and nothing else.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const portfolioNight = /^\/(portfolio(\/|$)|portfoliohost$)/.test(pathname);
  return portfolioNight ? null : children;
}
