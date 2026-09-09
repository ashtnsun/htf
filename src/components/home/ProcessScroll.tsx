"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ProcessStep } from "@/lib/content/schemas";
import { ProcessScene, StepStore } from "@/components/home/ProcessScene";
import { cn } from "@/lib/utils";

type ProcessScrollProps = { steps: ProcessStep[] };

const pad = (n: number) => String(n).padStart(2, "0");
/**
 * How far past the midpoint between two steps the reading line must travel before the scene
 * switches, as a fraction of the gap between the steps, so a scroll that stops right at the
 * midpoint never flickers between them.
 */
const MARGIN = 0.06;

/**
 * Scroll-driven process. One pixel-art scene (ProcessScene) stands beside the steps and shows
 * the step nearest the reading line (the middle of the viewport on desktop, a little lower on
 * phones, where the scene sticks to the top). The scroll only ever picks the step: as the
 * reading line crosses the midpoint between two steps the scene dissolves to the next one on
 * its own clock (about half a second, cell by cell) and then holds, so each picture is what
 * you see for the whole of its step and a paused scroll never lands mid-transition. The step
 * highlight follows the same switch (no counter or progress bar under the scene since the
 * 2026-09-07 audit 3). The middle steps are a viewport tall from lg (60% of one on phones),
 * so a step holds for that much scroll and one gesture cannot fly past it; the first and the
 * last are half a viewport (`--lead-h`), so the list starts close under the heading and ends
 * close after the last step (2026-09-09 review). On lg the sticky scene box is that same
 * half viewport, centred on the reading line: it lines up with the first step before it
 * sticks and leaves with the last one the moment that step has been centred. Under
 * prefers-reduced-motion the scene cuts instead of dissolving. Without JavaScript every step
 * is readable and the scene shows the first stage.
 */
export function ProcessScroll({ steps }: ProcessScrollProps) {
  const [store] = useState(() => new StepStore());
  const [active, setActive] = useState(0);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);
  const stages = useMemo(() => steps.map((step) => step.graphic), [steps]);

  useEffect(() => {
    const items = itemsRef.current.filter((el): el is HTMLLIElement => el !== null);
    const n = items.length;
    if (n === 0) return;
    let current = store.get();

    const measure = () => {
      const large = window.matchMedia("(min-width: 64rem)").matches;
      const line = window.innerHeight * (large ? 0.5 : 0.64);
      const centers = items.map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2 - line;
      });
      // Where the reading line sits between the step centres: 0 at the first, n − 1 at the last.
      let p = n - 1;
      if (centers[0]! >= 0) {
        p = 0;
      } else {
        for (let i = 0; i < n - 1; i += 1) {
          const a = centers[i]!;
          const b = centers[i + 1]!;
          if (a <= 0 && b > 0) {
            p = i - a / (b - a);
            break;
          }
        }
      }
      if (Math.abs(p - current) <= 0.5 + MARGIN) return;
      current = Math.round(p);
      store.set(current);
      setActive(current);
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [steps.length, store]);

  return (
    <div className="mt-10 grid gap-8 [--lead-h:50svh] lg:mt-16 lg:grid-cols-2 lg:gap-16">
      {/* The scene: stuck above the steps on phones, beside them from lg (a half-viewport box
          centred on the reading line, so its centre is the viewport's while it is stuck). */}
      <div className="sticky top-(--header-h) z-10 lg:top-[calc(50svh_-_var(--lead-h)_/_2)] lg:flex lg:h-(--lead-h) lg:items-center lg:self-start">
        <div className="relative -mx-(--gutter) flex justify-center bg-bg px-(--gutter) py-3 lg:mx-0 lg:w-full lg:bg-transparent lg:p-0">
          <ProcessScene
            stages={stages}
            step={0}
            store={store}
            className="w-[min(80vw,20rem)] shrink-0 lg:w-[min(100%,calc((100svh-var(--header-h)-8rem)*1.6))]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-full h-8 bg-linear-to-b from-bg to-transparent lg:hidden"
          />
        </div>
      </div>

      <ol className="border-l border-line">
        {steps.map((step, i) => {
          const isActive = i === active;
          return (
            <li
              key={step.id}
              ref={(el) => {
                itemsRef.current[i] = el;
              }}
              data-index={i}
              className="relative flex min-h-[60svh] flex-col justify-center py-10 pl-8 first:min-h-(--lead-h) first:pt-2 last:min-h-(--lead-h) lg:min-h-svh lg:py-16 lg:pl-12 lg:first:pt-16"
            >
              <div className="relative">
                {/* marker on the rail */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-0.5 -left-[calc(2rem+5px)] size-2.5 border transition-colors duration-300 lg:-left-[calc(3rem+5px)]",
                    isActive ? "border-green bg-green" : "border-line-strong bg-bg",
                  )}
                />
                <p
                  className={cn(
                    "text-eyebrow font-medium uppercase transition-colors duration-300",
                    isActive ? "text-green" : "text-muted",
                  )}
                >
                  Step {pad(i + 1)}
                </p>
                <h3
                  className={cn(
                    "mt-4 text-h3 transition-colors duration-300",
                    isActive ? "text-text" : "text-muted",
                  )}
                >
                  {step.title}
                </h3>
                <p className="mt-3 max-w-md text-muted">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
