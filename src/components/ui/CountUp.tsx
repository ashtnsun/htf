"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type CountUpProps = {
  /** The final value as written in content, e.g. "500+", "8", "1,200", "[TODO]". */
  value: string;
  /** Milliseconds for the count. */
  duration?: number;
  /** Milliseconds to wait after the tile enters the viewport (for staggering a row). */
  delay?: number;
  className?: string;
};

/** Splits "500+" into { prefix: "", number: 500, suffix: "+" }; null when there is no number. */
function parseValue(value: string) {
  const match = /^([^\d]*)(\d[\d,]*)(\.\d+)?(.*)$/.exec(value.trim());
  if (!match) return null;
  const [, prefix = "", whole = "", fraction = "", suffix = ""] = match;
  const number = Number(`${whole.replace(/,/g, "")}${fraction}`);
  if (!Number.isFinite(number)) return null;
  return {
    prefix,
    number,
    suffix,
    decimals: fraction ? fraction.length - 1 : 0,
    grouped: whole.includes(","),
  };
}

/**
 * Number that counts up from zero the first time it scrolls into view. The server renders
 * the final value (so it is correct without JavaScript and for crawlers); on the client the
 * visible copy is driven straight through the DOM while a visually hidden copy keeps the
 * real value for assistive tech. Renders the value as-is when it has no number or under
 * prefers-reduced-motion.
 */
export function CountUp({ value, duration = 3000, delay = 0, className }: CountUpProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const parsed = parseValue(value);
  const animate = Boolean(parsed) && !reduce;

  useEffect(() => {
    if (!animate || !parsed) return;
    const el = ref.current;
    if (!el) return;
    const { prefix, number, suffix, decimals, grouped } = parsed;
    const format = (n: number) =>
      `${prefix}${n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouped,
      })}${suffix}`;

    let frame = 0;
    let timer = 0;
    el.textContent = format(0);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        timer = window.setTimeout(() => {
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - (1 - t) ** 4;
            el.textContent = format(number * eased);
            if (t < 1) frame = requestAnimationFrame(tick);
            else el.textContent = format(number);
          };
          frame = requestAnimationFrame(tick);
        }, delay);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      el.textContent = format(number);
    };
    // `parsed` is derived from `value`; re-running on value alone is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, value, duration, delay]);

  if (!animate) return <span className={className}>{value}</span>;
  return (
    <>
      <span ref={ref} aria-hidden="true" className={cn("tabular-nums", className)}>
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}
