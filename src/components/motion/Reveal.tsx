"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;
const HIDDEN = { opacity: 0, y: 28 };

export const revealVariants: Variants = {
  hidden: HIDDEN,
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
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
 * renders in its final state with no animation.
 */
export function RevealGroup({
  children,
  mode = "view",
  stagger = 0.1,
  delay = 0,
  className,
}: RevealGroupProps) {
  const reduce = useReducedMotion();
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
  const reduce = useReducedMotion();
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
          show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delay } },
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
