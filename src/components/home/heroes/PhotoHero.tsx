"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { hero } from "@content/hero";
import { HeroShell } from "@/components/home/heroes/HeroShell";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";

/** How much slower than the page the photo scrolls (the image has 25% of headroom). */
const PARALLAX = 0.2;

/**
 * "Photo": the full organization photo (content/media.ts `org.group-photo`, the placeholder
 * until the real one lands) fills the hero, darkened toward the bottom where the statement
 * sits. No button: the header bar carries the season CTA (2026-09-09 review). The photo
 * scrolls a little slower than the page. No parallax under prefers-reduced-motion.
 */
export function PhotoHero() {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    const section = ref.current;
    const image = imageRef.current;
    if (!section || !image) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrolled = Math.min(window.scrollY, section.offsetHeight);
      image.style.transform = `translate3d(0, ${(scrolled * PARALLAX).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [reduce]);

  return (
    <HeroShell ref={ref} grid={false}>
      {/* the photo, with headroom below for the parallax; it bleeds a few pixels past the clip
          on the top and sides so an image's own edge (the placeholder's outline) never shows */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-surface">
        <div ref={imageRef} className="absolute -inset-x-1 -top-1 h-[125%] will-change-transform">
          <Media
            src="org.group-photo"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(11,11,11,0.42)_0%,rgba(11,11,11,0.18)_35%,rgba(11,11,11,0.94)_100%)]" />
      </div>

      <RevealGroup
        mode="mount"
        stagger={0.12}
        className="relative container-max flex w-full flex-1 flex-col container-x pt-8 pb-16 md:pt-10 md:pb-20 lg:frame-marks lg:mt-6 lg:border-x lg:border-line"
      >
        <Reveal>
          <Eyebrow>{hero.eyebrow}</Eyebrow>
        </Reveal>

        <Reveal className="mt-auto pt-24">
          <Headline
            as="h1"
            id="hero-title"
            size="display-fluid"
            lines={[...hero.lines]}
            className="max-w-5xl"
          />
        </Reveal>
      </RevealGroup>
    </HeroShell>
  );
}
