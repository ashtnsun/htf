"use client";

import { useReducedMotion } from "framer-motion";
import { useRef, type PointerEvent } from "react";
import { hero } from "@content/hero";
import { LOGO_GLYPHS, LOGO_WIDTH } from "@/components/brand/logo-paths";
import { HeroShell } from "@/components/home/heroes/HeroShell";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { cn } from "@/lib/utils";

/* Same view box as brand/Logo.tsx: font units, y flipped by the group transform. */
const VIEW_TOP = -720;
const VIEW_HEIGHT = 740;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * "Wordmark": the <HTF/> mark at the full width of the frame. Each glyph draws its outline
 * in turn and then fills, letters in green and the brackets and slash in the deep green, like
 * the real logo; the whole mark tilts a few degrees toward the pointer. The statement sits
 * under it. Decoration: the mark is hidden from assistive tech (the header carries the logo),
 * and under prefers-reduced-motion it is simply there.
 */
export function WordmarkHero() {
  const reduce = useReducedMotion() ?? false;
  const tiltRef = useRef<HTMLDivElement>(null);

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = tiltRef.current;
    if (!el || reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - rect.left) / rect.width - 0.5;
    const dy = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transition = "none";
    el.style.transform = `rotateX(${(-dy * 9).toFixed(2)}deg) rotateY(${(dx * 9).toFixed(2)}deg)`;
  }

  function onPointerLeave() {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transition = `transform 700ms ${EASE}`;
    el.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  return (
    <HeroShell glow>
      <RevealGroup
        mode="mount"
        stagger={0.12}
        className="relative container-max flex w-full flex-1 flex-col container-x pt-8 pb-16 md:pt-10 md:pb-24 lg:frame-marks lg:mt-6 lg:border-x lg:border-line"
      >
        <Reveal>
          <Eyebrow>{hero.eyebrow}</Eyebrow>
        </Reveal>

        <Reveal className="my-auto py-10 md:py-14">
          <div
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className="mx-auto w-full max-w-6xl [perspective:1400px]"
          >
            <div ref={tiltRef} className="will-change-transform">
              <svg
                viewBox={`0 ${VIEW_TOP} ${LOGO_WIDTH} ${VIEW_HEIGHT}`}
                aria-hidden="true"
                focusable="false"
                className="block h-auto w-full overflow-visible"
              >
                <g transform="scale(1,-1)" strokeWidth={1.5} vectorEffect="non-scaling-stroke">
                  {LOGO_GLYPHS.map((glyph, i) => (
                    <path
                      key={i}
                      d={glyph.d}
                      pathLength={1}
                      vectorEffect="non-scaling-stroke"
                      className={cn(
                        glyph.role === "letter"
                          ? "fill-green stroke-green"
                          : "fill-green-deep stroke-green-deep",
                        !reduce && "anim-wordmark",
                      )}
                      style={{ animationDelay: `${0.2 + i * 0.12}s, ${1.4 + i * 0.12}s` }}
                    />
                  ))}
                </g>
              </svg>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <Headline
            as="h1"
            id="hero-title"
            size="h3"
            lines={[...hero.lines]}
            className="max-w-3xl md:text-display"
          />
        </Reveal>
      </RevealGroup>
    </HeroShell>
  );
}
