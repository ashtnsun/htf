"use client";

import { useEffect, useState } from "react";
import { STAGES, STAGE_TITLES, type Stage } from "@/components/olympus/journey/save";
import { roman } from "@/components/olympus/journey/numeral";

/** A wrong answer: the element shakes by whole pixels, once. */
export function shake(el: HTMLElement | null, reduce: boolean) {
  if (!el || reduce) return;
  el.animate(
    [0, -8, 8, -6, 6, 0].map((x) => ({ transform: `translateX(${x}px)` })),
    { duration: 420, easing: "ease-out" },
  );
}

/**
 * A wrong answer: no words, the element shakes and its fields (inputs, and anything marked
 * `data-flash`) turn red for a second. The colour still flashes under reduced motion.
 */
export function wrong(el: HTMLElement | null, reduce: boolean) {
  if (!el) return;
  shake(el, reduce);
  const red = getComputedStyle(el).getPropertyValue("--red").trim();
  for (const field of el.querySelectorAll<HTMLElement>("input, [data-flash]")) {
    field.animate(
      [
        { borderColor: red, outlineColor: red, color: red, offset: 0 },
        { borderColor: red, outlineColor: red, color: red, offset: 0.4 },
        {},
      ],
      { duration: 1000, easing: "cubic-bezier(0.33, 0, 0.2, 1)" },
    );
  }
}

export const OFFLINE = "The Oracle is silent. Try again in a moment.";

/** Seconds until `until` (a Date.now() time), ticking; 0 once it has passed or with none. */
export function useQuiet(until: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [until]);
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

/** The wait after too many wrong tries, counting down. */
export function Silence({ seconds, line }: { seconds: number; line: string }) {
  return (
    <p role="status" className="font-oracle text-xl text-muted italic">
      {line}{" "}
      <span className="font-olympus text-base font-semibold text-cyan not-italic">{seconds}</span>
    </p>
  );
}

/**
 * A step's heading: its numeral and name over the step's own title and line, rising in. The
 * numeral names the step; the h1 (the page's) names the group. A new title or line fades in
 * where the old one was; `steady` keeps the line's room with no line, so a heading that changes
 * in place never changes height.
 */
export function StageHeading({
  stage,
  title,
  line,
  steady = false,
  smallLine = false,
  unnumbered = false,
}: {
  stage: Stage;
  title: string;
  line?: string;
  steady?: boolean;
  /** The line as a small aside. Its row keeps its height, so the title does not move. */
  smallLine?: boolean;
  /** No numeral over the title: /olympus3, where the order is the family's to find. */
  unnumbered?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      {unnumbered ? null : (
        <p className="journey-rise mb-4 font-olympus text-sm font-semibold tracking-[0.15em] text-green uppercase">
          {roman(STAGES.indexOf(stage) + 1)} · {STAGE_TITLES[stage].title.replace(/^The /, "")}
        </p>
      )}
      <h2
        className="journey-rise font-olympus text-h3 leading-tight font-semibold text-balance"
        style={{ "--d": "100ms" } as React.CSSProperties}
      >
        <span key={title} className="journey-fade block">
          {title}
        </span>
      </h2>
      {line || steady ? (
        <p
          className="journey-rise mt-4 max-w-xl font-oracle text-[1.375rem] leading-snug text-muted italic md:text-2xl"
          style={{ "--d": "200ms" } as React.CSSProperties}
        >
          <span key={line} className={smallLine ? "journey-fade text-body" : "journey-fade"}>
            {line ?? " "}
          </span>
        </p>
      ) : null}
    </div>
  );
}
