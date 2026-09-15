"use client";

import { hero } from "@content/hero";
import { HeroShell } from "@/components/home/heroes/HeroShell";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";

/**
 * "Photo", the hero the site ships with since 2026-09-10 (Ashton's pick; it is in the
 * bundle, the other variants are lazy chunks): the full organization photo (content/media.ts
 * `org.hero-photo`, the club on the Lawson steps; /about uses `org.group-photo`) fills the
 * hero, darkened toward the bottom where the statement sits. No button: the header bar carries
 * the season CTA (2026-09-09 review). The photo stays put while the page scrolls: the parallax
 * was dropped on 2026-09-15 (it read as a shift, and the 125% tall layer it needed scaled the
 * photo past its own resolution).
 */
export function PhotoHero() {
  return (
    <HeroShell grid={false}>
      {/* the photo exactly covers the hero; the group on the steps sits in the lower half of
          the picture, so a crop keeps that part in view */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-surface">
        <Media
          src="org.hero-photo"
          alt=""
          fill
          priority
          quality={90}
          // on a tall screen the photo is cropped at the sides, so it is drawn wider than the
          // viewport: ask for that width or phones get a blurry upscale
          sizes="(orientation: portrait) 150vh, 100vw"
          className="object-cover object-[50%_75%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(11,11,11,0.42)_0%,rgba(11,11,11,0.18)_35%,rgba(11,11,11,0.94)_100%)]" />
        {/* the header is clear over the top of the photo: darken that band so its links read */}
        <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(to_bottom,rgba(11,11,11,0.85)_0%,rgba(11,11,11,0.6)_40%,transparent_100%)]" />
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
