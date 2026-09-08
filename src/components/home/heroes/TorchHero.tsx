"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type PointerEvent } from "react";
import { hero } from "@content/hero";
import { HeroShell } from "@/components/home/heroes/HeroShell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { renderAccent } from "@/components/ui/Headline";
import { cn } from "@/lib/utils";

/** Moves the light: both the glow and the mask read these variables off the stage. */
function setLight(stage: HTMLElement, x: number, y: number) {
  stage.style.setProperty("--tx", `${x.toFixed(1)}px`);
  stage.style.setProperty("--ty", `${y.toFixed(1)}px`);
}

/**
 * The statement, once for the dark base and once for the lit copy. Written out here rather
 * than through <Headline> because a colour class merged into its className would replace the
 * custom size class (tailwind-merge cannot tell `text-display-fluid` from a colour).
 */
function Statement({ dim, ...rest }: { dim: boolean; id?: string; "aria-hidden"?: true }) {
  const Tag = dim ? "h1" : "p";
  return (
    <Tag
      {...rest}
      className={cn(
        "max-w-5xl font-display text-display-fluid font-medium",
        dim ? "text-muted [&_.text-green]:text-green-deep" : "text-text",
      )}
    >
      {hero.lines.map((line, i) => (
        <span key={i} className="block">
          {renderAccent(line)}
        </span>
      ))}
    </Tag>
  );
}

/**
 * "Torch": the statement sits in the dark in the muted tone, and a light brings it up to
 * full white and green wherever it shines. The light drifts slowly on its own until the
 * pointer takes it over; from then on it is the pointer's. Two copies of the headline:
 * the real one underneath (readable on its own, 7.5:1) and a lit one on top masked by a
 * radial gradient. Under prefers-reduced-motion there is no light and the headline is
 * simply lit.
 */
export function TorchHero() {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.05 });
  const taken = useRef(false);

  // Drift until the pointer takes over; runs only while the hero is on screen.
  useEffect(() => {
    if (reduce || !inView) return;
    const stage = stageRef.current;
    if (!stage) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (taken.current) return;
      const t = (now - start) / 1000;
      const x = 0.5 + 0.34 * Math.sin(t * 0.32);
      const y = 0.5 + 0.22 * Math.sin(t * 0.5 + 1.3);
      setLight(stage, x * stage.clientWidth, y * stage.clientHeight);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce, inView]);

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const stage = stageRef.current;
    if (!stage || reduce) return;
    taken.current = true;
    const r = stage.getBoundingClientRect();
    setLight(stage, e.clientX - r.left, e.clientY - r.top);
  }

  return (
    <HeroShell ref={ref} onPointerMove={onPointerMove}>
      <div className="relative container-max flex w-full flex-1 animate-fade-in flex-col container-x pt-8 pb-24 md:pt-10 md:pb-32 lg:frame-marks lg:mt-6 lg:border-x lg:border-line">
        <Eyebrow>{hero.eyebrow}</Eyebrow>

        <div
          ref={stageRef}
          className="relative my-auto py-16 [--torch-r:clamp(9rem,24vw,22rem)] [--tx:30%] [--ty:50%] md:py-20"
        >
          {reduce ? (
            <Statement dim={false} id="hero-title" />
          ) : (
            <>
              {/* the glow under the light */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 size-[calc(var(--torch-r)*3)] bg-[radial-gradient(closest-side,rgba(3,198,82,0.2),transparent)]"
                style={{ transform: "translate3d(var(--tx), var(--ty), 0) translate(-50%, -50%)" }}
              />
              <div className="relative">
                <Statement dim id="hero-title" />
              </div>
              {/* the lit copy, visible only under the light */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 py-16 md:py-20"
                style={{
                  maskImage:
                    "radial-gradient(circle var(--torch-r) at var(--tx) var(--ty), #000 0%, #000 30%, transparent 100%)",
                }}
              >
                <Statement dim={false} />
              </div>
            </>
          )}
        </div>
      </div>
    </HeroShell>
  );
}
