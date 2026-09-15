"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * The header element itself: clear while the page is at the top (the home hero runs up under
 * it), easing into the frosted glass (tint and blur together) once anything scrolls beneath.
 * `data-at-top` is also what the CTA reads (SplitButton variant "header") to drop its green
 * fill while the bar is clear. The server and the first paint are clear.
 */
export function HeaderBar({ children }: { children: ReactNode }) {
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const update = () => setAtTop(window.scrollY <= 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-at-top={atTop || undefined}
      className="sticky top-0 z-50 h-(--header-h) glass transition-[background-color,backdrop-filter,-webkit-backdrop-filter] duration-700 ease-smooth [--glass-alpha:50%] [--glass-edge:0] [view-transition-name:site-header] data-at-top:[--glass-alpha:0%] data-at-top:[--glass-blur:0px]"
    >
      {children}
    </header>
  );
}
