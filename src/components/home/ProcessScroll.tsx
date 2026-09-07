"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ProcessStep } from "@/lib/content/schemas";
import { ProcessScene, ProgressStore } from "@/components/home/ProcessScene";
import { cn } from "@/lib/utils";

type ProcessScrollProps = { steps: ProcessStep[] };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Scroll-driven process. One floating scene (ProcessScene) evolves continuously as the steps
 * scroll past: the reading line (the middle of the viewport on desktop, a little lower on
 * phones, where the scene sticks to the top) is mapped to a progress value between the step
 * centres, eased frame by frame, and the scene, the counter and the step highlight follow
 * it. Under prefers-reduced-motion the scene snaps between stages. Without JavaScript every
 * step is readable and the scene shows the first stage.
 */
export function ProcessScroll({ steps }: ProcessScrollProps) {
  const reduce = useReducedMotion();
  const [store] = useState(() => new ProgressStore());
  const [active, setActive] = useState(0);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);
  const stages = useMemo(() => steps.map((step) => step.graphic), [steps]);

  useEffect(() => {
    const items = itemsRef.current.filter((el): el is HTMLLIElement => el !== null);
    const n = items.length;
    if (n === 0) return;
    let target = 0;
    let current = store.get();
    let frame = 0;
    let shown = -1;

    const show = (p: number) => {
      const step = Math.round(p);
      if (step !== shown) {
        shown = step;
        setActive(step);
      }
    };
    const tick = () => {
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.002) {
        current = target;
        frame = 0;
      } else {
        frame = requestAnimationFrame(tick);
      }
      store.set(current);
      show(current);
    };
    const measure = () => {
      const large = window.matchMedia("(min-width: 64rem)").matches;
      const line = window.innerHeight * (large ? 0.5 : 0.64);
      const centers = items.map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2 - line;
      });
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
      target = p;
      if (reduce) {
        current = Math.round(p);
        store.set(current);
        show(current);
      } else if (!frame) {
        frame = requestAnimationFrame(tick);
      }
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(frame);
    };
  }, [steps.length, reduce, store]);

  const count = steps.length;
  const title = steps[active]?.title ?? steps[0]?.title;

  return (
    <div className="mt-10 grid gap-8 lg:mt-16 lg:grid-cols-2 lg:gap-16">
      {/* The scene: stuck above the steps on phones, beside them from lg. */}
      <div className="sticky top-(--header-h) z-10 lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
        <div className="relative -mx-[clamp(1.25rem,4.5vw,4.5rem)] flex items-center gap-6 bg-bg px-[clamp(1.25rem,4.5vw,4.5rem)] py-3 lg:mx-0 lg:block lg:bg-transparent lg:p-0">
          <ProcessScene
            stages={stages}
            progress={0}
            store={store}
            className="w-[min(40vw,10rem)] shrink-0 lg:w-full"
          />
          <div className="min-w-0 flex-1 lg:mt-4 lg:flex lg:items-center lg:gap-5">
            <p className="text-eyebrow font-medium text-green tabular-nums">
              {pad(active + 1)} / {pad(count)}
            </p>
            <p className="mt-2 truncate text-sm font-medium text-text lg:mt-0">{title}</p>
            <span
              aria-hidden="true"
              className="mt-4 block h-px w-full max-w-40 bg-line lg:mt-0 lg:ml-auto lg:w-32"
            >
              <span
                className="block h-full bg-green transition-[width] duration-500 ease-out-quart"
                style={{ width: `${((active + 1) / count) * 100}%` }}
              />
            </span>
          </div>
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
              className="relative flex flex-col justify-center py-10 pl-8 first:pt-2 lg:min-h-[68svh] lg:py-16 lg:pl-12 lg:first:justify-start lg:first:pt-6"
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
