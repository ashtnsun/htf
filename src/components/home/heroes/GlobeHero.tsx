import { hero } from "@content/hero";
import { Globe } from "@/components/home/Globe";
import { HeroShell, heroFrameClass } from "@/components/home/heroes/HeroShell";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";

/**
 * "Globe", the hero as designed in the 2026-09-06 audit and the default: eyebrow, the
 * two-line staggered headline with the second line green, the wireframe globe floating
 * behind it, the bottom glow and the grid. No buttons, blurb or scroll marker; the header
 * CTA does that job.
 */
export function GlobeHero() {
  return (
    <HeroShell glow>
      <RevealGroup mode="mount" stagger={0.12} className={heroFrameClass}>
        {/* globe: floats behind the right-aligned second line; top-right on phones */}
        <Reveal className="pointer-events-none absolute top-20 right-[-22%] z-0 w-[15rem] md:top-1/2 md:right-[3%] md:w-[clamp(240px,34vw,480px)] md:-translate-y-[64%]">
          <Globe />
        </Reveal>

        <Reveal className="relative z-10">
          <Eyebrow>{hero.eyebrow}</Eyebrow>
        </Reveal>

        <Reveal className="relative z-10 my-auto py-16 md:py-20">
          <Headline as="h1" id="hero-title" size="display-fluid" stagger lines={[...hero.lines]} />
        </Reveal>
      </RevealGroup>
    </HeroShell>
  );
}
