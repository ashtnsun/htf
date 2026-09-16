"use client";

import { motion, type Variants } from "framer-motion";
import { useLayoutEffect, type ReactNode } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { EASE_GLIDE, EASE_SMOOTH } from "@/lib/motion";

const HIDDEN = { opacity: 0, y: 12 };
/**
 * A short rise and an even fade that starts as the element enters the screen: a long, late
 * reveal on a phone reads as flicker, since most of a narrow page is revealing at any time.
 */
const SHOW_TRANSITION = {
  duration: 0.7,
  ease: EASE_GLIDE,
  opacity: { duration: 0.5, ease: EASE_SMOOTH },
};
/**
 * The page transition's timing (`--page-*` and `page-rise` in globals.css): the new page starts
 * showing at 80ms and has settled by about a second. A reveal that starts inside that window
 * waits a beat (PAGE_ENTER_WAIT_MS), so on a navigation the page's frame (header, backgrounds,
 * pictures) leads by a hair and the copy follows in its stagger while the frame is still
 * settling, one arrival, instead of some copy animating behind the fade and the rest after it.
 * (A longer wait left the hero empty for a moment, which read as a load.)
 */
const PAGE_ENTER_WAIT_MS = 180;
const PAGE_ENTER_END_MS = 1000;
const clock = { navigatedAt: Number.NEGATIVE_INFINITY, templateMounts: 0 };

/** Seconds a reveal starting now should wait for the entering page (0 outside a navigation). */
function pageEnterDelay() {
  const since = performance.now() - clock.navigatedAt;
  return since < PAGE_ENTER_END_MS ? Math.max(0, PAGE_ENTER_WAIT_MS - since) / 1000 : 0;
}

/**
 * Rendered by app/template.tsx, which remounts on every route change: every mount after the
 * first page load marks a navigation (the first load has no page transition to wait for).
 */
export function PageEnterClock() {
  useLayoutEffect(() => {
    clock.templateMounts += 1;
    if (clock.templateMounts > 1) clock.navigatedAt = performance.now();
  }, []);
  return null;
}

/** Starts a reveal just before its top edge is on screen rather than 10% into it. */
const VIEWPORT = { once: true, margin: "0px 0px 40px 0px" };

export const revealVariants: Variants = {
  hidden: HIDDEN,
  show: { opacity: 1, y: 0, transition: SHOW_TRANSITION },
};

/** Resolved when the reveal starts (not at render), so the page-enter wait is current. */
function groupVariants(stagger: number, delay: number): Variants {
  return {
    hidden: {},
    show: () => ({
      transition: { staggerChildren: stagger, delayChildren: delay + pageEnterDelay() },
    }),
  };
}

type RevealGroupProps = {
  children: ReactNode;
  /** "mount" animates immediately (above the fold); "view" waits until scrolled into view. */
  mode?: "mount" | "view";
  stagger?: number;
  delay?: number;
  className?: string;
};

/**
 * Staggers the <Reveal> children inside it. Under prefers-reduced-motion everything
 * renders in its final state with no animation (from the first update after hydration; see
 * useReducedMotionSafe).
 */
export function RevealGroup({
  children,
  mode = "view",
  stagger = 0.06,
  delay = 0,
  className,
}: RevealGroupProps) {
  const reduce = useReducedMotionSafe();
  if (reduce) return <div className={className}>{children}</div>;
  const viewProps =
    mode === "view" ? { whileInView: "show", viewport: VIEWPORT } : { animate: "show" };
  return (
    <motion.div
      data-reveal=""
      className={className}
      initial="hidden"
      {...viewProps}
      variants={groupVariants(stagger, delay)}
    >
      {children}
    </motion.div>
  );
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Standalone use (outside a RevealGroup): animate on view with an optional delay. */
  standalone?: boolean;
  delay?: number;
};

/**
 * Fade-and-rise reveal. Inside a RevealGroup it follows the group's stagger. `data-reveal`
 * marks every animated wrapper so the root layout's <noscript> style can show it when
 * JavaScript never runs (the server-rendered initial state is invisible).
 */
export function Reveal({ children, className, standalone = false, delay = 0 }: RevealProps) {
  const reduce = useReducedMotionSafe();
  if (reduce) return <div className={className}>{children}</div>;
  if (standalone) {
    return (
      <motion.div
        data-reveal=""
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        variants={{
          hidden: HIDDEN,
          show: () => {
            const wait = delay + pageEnterDelay();
            return {
              opacity: 1,
              y: 0,
              transition: {
                ...SHOW_TRANSITION,
                delay: wait,
                opacity: { ...SHOW_TRANSITION.opacity, delay: wait },
              },
            };
          },
        }}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div data-reveal="" className={className} variants={revealVariants}>
      {children}
    </motion.div>
  );
}
