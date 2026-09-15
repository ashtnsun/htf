"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";
import { useReducedMotionSafe } from "@/components/motion/useReducedMotionSafe";
import { cn } from "@/lib/utils";

const subscribeNoop = () => () => {};
/** Height of the docked bar (px), the section bar's `h-14`. */
const BAR_HEIGHT = 56;
/** Space between the docked label and the first section link, as the links' own padding. */
const LABEL_GAP = 32;

/**
 * "Dock": the shipped frame (grid, glow, framed column), and as the page scrolls the copy
 * shrinks toward its top-left corner and fades, then docks as the page's name at the left of the
 * sticky bar under the header. On About, Students and Nonprofits that bar is the section bar
 * (layout/SectionNav): the label sits over its left end and the links slide over to make room,
 * through `--subnav-inset` on the root element. On Projects and Contact, which have no section
 * bar, the label brings a bar of its own in the same glass. The label is decoration (the page
 * already has its h1), portalled to the body so no transformed ancestor can move it. Under
 * reduced motion the copy stays as it is and the label simply appears.
 */
export function DockHero(props: PageHeroProps) {
  const reduce = useReducedMotionSafe();
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const ref = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [docked, setDocked] = useState(false);
  const [ownBar, setOwnBar] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.6]);
  const opacity = useTransform(scrollYProgress, [0.35, 0.8], [1, 0]);

  // Docked once the hero's bottom edge has passed under the header and the bar.
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      setOwnBar(!document.querySelector("[data-section-nav]"));
      const headerH =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) *
          16 || 56;
      setDocked(section.getBoundingClientRect().bottom <= headerH + BAR_HEIGHT);
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // Make room in the section bar while docked.
  useEffect(() => {
    const root = document.documentElement;
    const label = labelRef.current;
    if (!docked || ownBar || !label) {
      root.style.removeProperty("--subnav-inset");
      return;
    }
    root.style.setProperty("--subnav-inset", `${label.offsetWidth + LABEL_GAP}px`);
    return () => {
      root.style.removeProperty("--subnav-inset");
    };
  }, [docked, ownBar]);

  const label = (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-(--header-h) z-[41] transition-opacity duration-500",
        ownBar && "glass [--glass-alpha:50%] [--glass-edge:0]",
        docked ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="container-max flex h-14 items-center container-x">
        <span
          ref={labelRef}
          className={cn(
            "inline-flex items-center gap-2.5 text-sm font-medium whitespace-nowrap text-text transition-transform duration-500 ease-glide",
            !ownBar && "border-r border-line pr-4",
            docked ? "translate-y-0" : "translate-y-2",
          )}
        >
          <span className="inline-block size-1.5 shrink-0 bg-green" />
          {props.eyebrow}
        </span>
      </div>
    </div>
  );

  return (
    <PageHeroSection ref={ref} className="grid-overlay [--grid-cols:8] [--grid-row:8rem]">
      <PageHeroGlow />
      {/* the column's rails and crosshairs stay put; only the copy inside them shrinks */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="container-max h-full lg:frame-marks lg:mt-6 lg:h-[calc(100%-1.5rem)] lg:border-x lg:border-line" />
      </div>
      <motion.div
        style={reduce ? undefined : { scale, opacity, transformOrigin: "0% 0%" }}
        className="relative z-10"
      >
        <PageHeroContent {...props} className="lg:border-x-0 lg:before:hidden" />
      </motion.div>
      {hydrated ? createPortal(label, document.body) : null}
    </PageHeroSection>
  );
}
