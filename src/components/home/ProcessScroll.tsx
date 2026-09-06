"use client";

import { useEffect, useRef, useState } from "react";
import type { ProcessStep } from "@/lib/content/schemas";
import { ProcessGraphic } from "@/components/home/ProcessGraphic";
import { cn } from "@/lib/utils";

type ProcessScrollProps = { steps: ProcessStep[] };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Scroll-driven process: on large screens the graphic panel on the left is sticky and
 * cross-fades between the four wireframes while the steps scroll past on the right; the
 * step crossing the middle of the viewport is the active one (IntersectionObserver with a
 * narrow band, so no scroll listener). On phones each step shows its own graphic inline.
 * Without JavaScript every step is readable and the panel shows the first graphic.
 */
export function ProcessScroll({ steps }: ProcessScrollProps) {
  const [active, setActive] = useState(0);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const items = itemsRef.current.filter((el): el is HTMLLIElement => el !== null);
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isFinite(index)) setActive(index);
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [steps.length]);

  const count = steps.length;
  const current = steps[active] ?? steps[0];

  return (
    <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-16">
      {/* sticky panel (lg+) */}
      <div className="hidden lg:block">
        <div className="sticky top-[calc(var(--header-h)+2rem)]">
          <div className="border border-line glass">
            <div className="grid-overlay relative aspect-square [--grid-cols:8] [--grid-row:12.5%]">
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className={cn(
                    "absolute inset-0 p-6 transition-opacity duration-500 ease-out-quart",
                    i === active ? "opacity-100" : "opacity-0",
                  )}
                >
                  <ProcessGraphic graphic={step.graphic} active={i === active} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-5 border-t border-line px-6 py-4 text-sm">
              <span className="text-eyebrow font-medium text-green tabular-nums">
                {pad(active + 1)} / {pad(count)}
              </span>
              <span className="font-medium text-text">{current?.title}</span>
              <span aria-hidden="true" className="ml-auto block h-px w-32 bg-line">
                <span
                  className="block h-full bg-green transition-[width] duration-500 ease-out-quart"
                  style={{ width: `${((active + 1) / count) * 100}%` }}
                />
              </span>
            </div>
          </div>
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
                <ProcessGraphic
                  graphic={step.graphic}
                  active={isActive}
                  className="mb-6 max-w-xs border border-line glass p-4 lg:hidden"
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
