"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
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
/** Starts a reveal just before its top edge is on screen rather than 10% into it. */
const VIEWPORT = { once: true, margin: "0px 0px 40px 0px" };

export const revealVariants: Variants = {
  hidden: HIDDEN,
  show: { opacity: 1, y: 0, transition: SHOW_TRANSITION },
};

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
    mode === "view"
      ? { whileInView: "show", viewport: VIEWPORT }
      : { animate: "show" };
  return (
    <motion.div
      data-reveal=""
      className={className}
      initial="hidden"
      {...viewProps}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
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
          show: {
            opacity: 1,
            y: 0,
            transition: {
              ...SHOW_TRANSITION,
              delay,
              opacity: { ...SHOW_TRANSITION.opacity, delay },
            },
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
