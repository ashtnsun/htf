"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import { hero } from "@content/hero";
import { HeroShell } from "@/components/home/heroes/HeroShell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { renderAccent } from "@/components/ui/Headline";
import { cn } from "@/lib/utils";

/** One trip of the band (one copy of the statement) takes this long. */
const DURATION_MS = 42_000;

const copyClass =
  "flex items-center whitespace-nowrap px-[0.3em] py-[0.14em] font-display text-[clamp(3.5rem,11vw,10rem)] leading-none font-medium tracking-[-0.03em] text-text";

/** The statement with a green square after it, so the copies read as a band. */
function Copy() {
  return (
    <>
      {hero.lines.map((line, i) => (
        <span key={i} className={cn(i > 0 && "ml-[0.28em]")}>
          {renderAccent(line)}
        </span>
      ))}
      <span aria-hidden="true" className="mx-[0.36em] inline-block size-[0.16em] bg-green" />
    </>
  );
}

type Drag = { x: number; anim: Animation | null };

/**
 * "Ticker": the statement as one oversized band between two hairlines, moving slowly across
 * the whole width. The band is a real marquee (the site's `marquee` utilities), so it pauses
 * through its button, when the hero is off-screen, and when focus lands inside. Dragging the
 * band scrubs the animation itself (Web Animations API) so nothing else has to know the
 * offset. Under prefers-reduced-motion the statement sits still, wrapped, in the band.
 */
export function TickerHero() {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.05 });
  const [paused, setPaused] = useState(false);
  const drag = useRef<Drag | null>(null);

  function marqueeAnimation(): Animation | null {
    const track = trackRef.current;
    if (!track) return null;
    return (
      track
        .getAnimations()
        .find((a) => a instanceof CSSAnimation && a.animationName === "marquee") ?? null
    );
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const anim = marqueeAnimation();
    anim?.pause();
    drag.current = { x: e.clientX, anim };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const track = trackRef.current;
    if (!d || !track) return;
    const dx = e.clientX - d.x;
    d.x = e.clientX;
    if (!d.anim) return;
    // The animation moves the track by one copy (half its width) over DURATION_MS.
    const msPerPx = DURATION_MS / (track.scrollWidth / 2);
    const t = Number(d.anim.currentTime ?? 0) - dx * msPerPx;
    d.anim.currentTime = ((t % DURATION_MS) + DURATION_MS) % DURATION_MS;
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (!paused) d.anim?.play();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <HeroShell ref={ref} glow>
      <div className="relative container-max w-full container-x pt-8 md:pt-10 lg:mt-6">
        <div className="animate-fade-in">
          <Eyebrow>{hero.eyebrow}</Eyebrow>
        </div>
      </div>

      <div className="relative my-auto py-10 md:py-14">
        {reduce ? (
          <div className="border-y border-line">
            <h1
              id="hero-title"
              className="container-max container-x py-6 font-display text-display-fluid font-medium text-text"
            >
              {hero.lines.map((line, i) => (
                <span key={i} className="block">
                  {renderAccent(line)}
                </span>
              ))}
            </h1>
          </div>
        ) : (
          <div
            data-paused={paused || !inView}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="cursor-grab touch-pan-y marquee border-y border-line select-none active:cursor-grabbing"
          >
            <div ref={trackRef} className="marquee-track items-center [--marquee-duration:42s]">
              <h1 id="hero-title" className={copyClass}>
                <Copy />
              </h1>
              <div aria-hidden="true" className={copyClass}>
                <Copy />
              </div>
            </div>
          </div>
        )}

        {reduce ? null : (
          <div className="container-max mt-5 flex items-center justify-between gap-6 container-x">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-green"
            >
              {paused ? (
                <Play className="size-4" aria-hidden="true" />
              ) : (
                <Pause className="size-4" aria-hidden="true" />
              )}
              {paused ? "Play" : "Pause"}
            </button>
            <p className="hidden text-sm text-muted sm:block">Drag the band to move it.</p>
          </div>
        )}
      </div>
    </HeroShell>
  );
}
