"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SectionNavItem = { href: `#${string}`; label: string };

type SectionNavProps = {
  /** The page's sections in document order; each `href` is the id of a section on the page. */
  items: readonly SectionNavItem[];
  /** Short page name shown at the start of the bar ("About"). */
  label: string;
  className?: string;
};

/** Height of the bar; also published as `--subnav-h` so anchors land below it. */
const BAR_HEIGHT = 48;

/**
 * In-page navigation for the long inner pages (About, Students, Nonprofits): a hairline bar
 * that sits right under the hero and sticks beneath the site header while the page scrolls.
 * It lists the page's sections as anchor links, underlines the one on screen (the header's
 * current-page language) and scrolls the row so the current link stays visible on phones.
 *
 * The bar sets `--subnav-h` on the root element while mounted; globals.css adds it to every
 * anchor's `scroll-margin-top`, so a jump lands below the bar rather than under it. Without
 * JavaScript the links are plain anchors and nothing is underlined.
 */
export function SectionNav({ items, label, className }: SectionNavProps) {
  const [current, setCurrent] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--subnav-h", `${BAR_HEIGHT}px`);
    return () => {
      root.style.removeProperty("--subnav-h");
    };
  }, []);

  useEffect(() => {
    const ids = items.map((item) => item.href.slice(1));
    let frame = 0;

    function measure() {
      frame = 0;
      const headerH =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) *
          16 || 56;
      // The reading line: just under the bar, plus a little so a section counts once its
      // heading has cleared the bar. Near the bottom of the page the last section wins.
      const line = headerH + BAR_HEIGHT + 32;
      const atEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let next: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) next = id;
      }
      if (atEnd) next = ids[ids.length - 1] ?? next;
      setCurrent(next);
    }

    function schedule() {
      if (frame === 0) frame = requestAnimationFrame(measure);
    }

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [items]);

  // Keep the current link in view when the row scrolls horizontally (phones).
  useEffect(() => {
    const list = listRef.current;
    if (!list || !current) return;
    const link = list.querySelector<HTMLElement>(`a[href="#${CSS.escape(current)}"]`);
    if (!link) return;
    const left = link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }, [current]);

  return (
    <nav
      aria-label="On this page"
      className={cn(
        "sticky top-(--header-h) z-40 border-y border-line glass [--glass-alpha:80%]",
        className,
      )}
    >
      <div className="container-max flex h-12 items-center gap-6 container-x">
        <p className="hidden shrink-0 text-eyebrow font-medium text-muted uppercase sm:block">
          {label}
        </p>
        <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-line-strong sm:block" />
        <ul
          ref={listRef}
          className="-mx-(--gutter) scrollbar-none flex h-full flex-1 items-stretch gap-1 overflow-x-auto px-(--gutter) sm:mx-0 sm:px-0"
        >
          {items.map((item) => {
            const active = item.href.slice(1) === current;
            return (
              <li key={item.href} className="flex shrink-0">
                <a
                  href={item.href}
                  aria-current={active ? "location" : undefined}
                  className={cn(
                    "relative inline-flex items-center px-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 first:pl-0",
                    "after:absolute after:inset-x-3 after:-bottom-px after:h-px after:bg-green after:opacity-0 after:transition-opacity after:duration-200 first:after:left-0",
                    active ? "text-text after:opacity-100" : "text-muted hover:text-text",
                  )}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
