"use client";

import { useCallback, useEffect, useRef, type PointerEvent } from "react";
import { hero } from "@content/hero";
import { HeroShell } from "@/components/home/heroes/HeroShell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/lib/utils";

/** Air between the brackets and whatever they are locked onto. */
const PAD = 14;

type Word = { text: string; accent: boolean };

/** Splits a headline line into words, keeping the *accent* marker as a flag per word. */
function words(line: string): Word[] {
  const accent = line.startsWith("*") && line.endsWith("*");
  return line
    .replace(/\*/g, "")
    .split(" ")
    .filter(Boolean)
    .map((text) => ({ text, accent }));
}

const LINES = hero.lines.map(words);

/**
 * "Focus": the statement with the site's viewfinder brackets as a live element. The four
 * corners rest around the green line and lock onto whichever word (or the eyebrow) the
 * pointer rests on, staying there until it moves to another one or leaves the hero. The
 * frame is positioned straight in the DOM from measured boxes, so no React re-renders while
 * pointing; an instant jump under prefers-reduced-motion.
 */
export function FocusHero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLSpanElement>(null);
  const targetRef = useRef<Element | null>(null);

  const place = useCallback((el: Element | null) => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    const target = el ?? restRef.current;
    if (!stage || !frame || !target) return;
    const s = stage.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    frame.style.transform = `translate(${(r.left - s.left - PAD).toFixed(1)}px, ${(r.top - s.top - PAD).toFixed(1)}px)`;
    frame.style.width = `${(r.width + PAD * 2).toFixed(1)}px`;
    frame.style.height = `${(r.height + PAD * 2).toFixed(1)}px`;
    frame.style.opacity = "1";
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) place(targetRef.current);
    };
    run();
    document.fonts?.ready.then(run);
    const observer = new ResizeObserver(run);
    if (stageRef.current) observer.observe(stageRef.current);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [place]);

  function onPointerOver(e: PointerEvent<HTMLDivElement>) {
    const el = (e.target as Element).closest("[data-focus]");
    if (el && el !== targetRef.current) {
      targetRef.current = el;
      place(el);
    }
  }

  function onPointerLeave() {
    targetRef.current = null;
    place(null);
  }

  return (
    <HeroShell>
      <div
        ref={stageRef}
        onPointerOver={onPointerOver}
        onPointerLeave={onPointerLeave}
        className="relative container-max flex w-full flex-1 animate-fade-in flex-col container-x pt-8 pb-24 md:pt-10 md:pb-32 lg:frame-marks lg:mt-6 lg:border-x lg:border-line"
      >
        {/* the brackets */}
        <div
          ref={frameRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 z-20 opacity-0 transition-[transform,width,height,opacity] duration-500 ease-out-expo will-change-transform"
          style={{ width: 0, height: 0 }}
        >
          <span className="absolute top-0 left-0 size-4 border-t border-l border-green" />
          <span className="absolute top-0 right-0 size-4 border-t border-r border-green" />
          <span className="absolute bottom-0 left-0 size-4 border-b border-l border-green" />
          <span className="absolute right-0 bottom-0 size-4 border-r border-b border-green" />
        </div>

        <div className="relative z-10 self-start">
          <span data-focus="" className="inline-block">
            <Eyebrow>{hero.eyebrow}</Eyebrow>
          </span>
        </div>

        <h1
          id="hero-title"
          className="relative z-10 my-auto flex flex-col py-16 font-display text-display-fluid font-medium text-text md:py-20"
        >
          {LINES.map((line, i) => (
            <span
              key={i}
              className={cn("block", i > 0 && "md:mt-[0.22em] md:self-end md:text-right")}
            >
              {line.map((word, j) => (
                <span key={j}>
                  {j > 0 ? " " : null}
                  <span
                    ref={i === LINES.length - 1 && j === 0 ? restRef : undefined}
                    data-focus=""
                    className={cn("inline-block", word.accent && "text-green")}
                  >
                    {word.text}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </h1>
      </div>
    </HeroShell>
  );
}
