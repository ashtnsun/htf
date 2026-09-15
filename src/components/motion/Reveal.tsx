"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { DURATION, EASE_GLIDE, EASE_SMOOTH } from "@/lib/motion";

const HIDDEN = { opacity: 0, y: 24 };
/** The rise glides and settles; the fade runs a touch shorter and evenly, so nothing pops. */
const SHOW_TRANSITION = {
  duration: DURATION.reveal,
  ease: EASE_GLIDE,
  opacity: { duration: 0.9, ease: EASE_SMOOTH },
};

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
  stagger = 0.12,
  delay = 0,
  className,
}: RevealGroupProps) {
  const reduce = useReducedMotionSafe();
  if (reduce) return <div className={className}>{children}</div>;
  const viewProps =
    mode === "view"
      ? { whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } }
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
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
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
