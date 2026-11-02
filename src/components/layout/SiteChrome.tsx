"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders the site header or footer everywhere except the event pages, which are their own
 * frame: Portfolio Night (/portfolio and /portfoliohost, a side menu and nothing else) and the
 * family reveal (/olympus and /oracle, app/olympus/layout and app/oracle/layout).
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const eventPage = /^\/(portfolio(\/|$)|portfoliohost$|olympus(\/|$)|olympuz(\/|$)|oracle$)/.test(
    pathname,
  );
  return eventPage ? null : children;
}
