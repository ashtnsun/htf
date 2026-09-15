import { ViewTransition, type ReactNode } from "react";
import { PageEnterClock } from "@/components/motion/Reveal";

/**
 * Page-to-page navigation. A template remounts on every route change, so this boundary exits
 * with the old page and enters with the new one: the old page fades out quickly and the new one
 * fades in a moment later (`page-exit` / `page-enter` in globals.css). The header stays put (its
 * own `site-header` transition name) and the footer rides along in the root crossfade. Browsers
 * without the View Transitions API, and reduced motion, simply swap the page. PageEnterClock lets
 * the new page's reveals wait for it to start fading in, so they play in one stagger.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <PageEnterClock />
      {children}
    </ViewTransition>
  );
}
