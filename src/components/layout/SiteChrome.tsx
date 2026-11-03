"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders the site header or footer everywhere except the event pages, which are their own
 * frame: Portfolio Night (/portfolio and /portfoliohost, a side menu and nothing else) and the
 * family reveal (/olympus, /olympus3, /oracle and /prologue, each with its own layout).
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const eventPage =
    /^\/(portfolio(\/|$)|portfoliohost$|olympus(\/|$)|olympus3(\/|$)|olympuz(\/|$)|oracle$|prologue$)/.test(
      pathname,
    );
  return eventPage ? null : children;
}
