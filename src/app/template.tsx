import { ViewTransition, type ReactNode } from "react";
import { PageEnterClock } from "@/components/motion/Reveal";

/**
 * Page-to-page navigation. A template remounts on every route change, so this boundary exits
 * with the old page and enters with the new one: the old page lifts away while the new one rises
 * in from a little below, the two overlapping so nothing ever reads as a reload (`page-exit` /
 * `page-enter` and the `--page-*` clock in globals.css; each top-level section of the page is its
 * own snapshot, all on the same clock). The header stays put (its own `site-header` transition
 * name), the footer and the page background ride along in the root crossfade on the same
 * timing, and the navigation line (layout/NavigationProgress) stays live above it all. Browsers
 * without the View Transitions API simply swap the page; reduced motion keeps a short, still
 * crossfade. PageEnterClock lets the new page's reveals wait for it to start arriving, so they
 * play in one stagger.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <PageEnterClock />
      {children}
    </ViewTransition>
  );
}
