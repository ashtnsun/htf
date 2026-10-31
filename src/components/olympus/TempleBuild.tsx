"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

/** Whether this visit has seen the temple go up. A refresh reloads the module, so it plays again. */
let played = false;

/** Milliseconds of blank page before the first cell. */
const PAUSE = 300;

/**
 * Builds the /olympus temple (components/olympus/Temple) cell group by cell group, each at its
 * `data-at` second, by setting its opacity from a frame loop. Not CSS animations: hundreds of
 * them on SVG paths can freeze half-faded in Chrome (across a page transition, for one). Once the
 * last group is on, `data-built` on the temple lets the logo bar, the heading and the numerals
 * fade in (globals.css). Coming back from a group within the same visit, or under reduced motion,
 * the temple is simply there. The temple's columns are plain SVG links (next/link renders HTML),
 * so this also routes their clicks through the router: a full page load would forget `played`.
 */
export function TempleBuild() {
  const router = useRouter();
  useEffect(() => {
    const temple = document.querySelector<HTMLElement>("[data-temple]");
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest("a[href]");
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      router.push(link.getAttribute("href")!);
    };
    temple?.addEventListener("click", onClick);
    return () => temple?.removeEventListener("click", onClick);
  }, [router]);
  useLayoutEffect(() => {
    const temple = document.querySelector<HTMLElement>("[data-temple]");
    if (!temple) return;
    const groups = [...temple.querySelectorAll<SVGPathElement>("path[data-at]")]
      .map((el) => ({ el, at: PAUSE + Number(el.dataset.at) * 1000 }))
      .sort((a, b) => a.at - b.at);
    const built = () => {
      temple.dataset.built = "";
      played = true;
    };
    if (played || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      built();
      return;
    }
    let next = 0;
    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      while (next < groups.length && groups[next]!.at <= now - start) {
        groups[next]!.el.style.opacity = "1";
        next += 1;
      }
      if (next < groups.length) raf = requestAnimationFrame(frame);
      else built();
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}
