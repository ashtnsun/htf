import { Globe } from "@/components/home/Globe";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";

/**
 * Home hero, reduced to the statement: eyebrow, the two-line staggered headline with the
 * second line green, the wireframe globe floating behind it, the bottom glow and the grid.
 * No buttons, blurb or scroll marker (2026-09-06 audit); the header CTA does that job.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="grid-overlay relative flex min-h-[calc(100svh-var(--header-h))] flex-col overflow-hidden [--grid-cols:8] [--grid-row:9rem]"
    >
      {/* bottom glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-[radial-gradient(70%_100%_at_50%_100%,rgba(3,198,82,0.55)_0%,rgba(3,198,82,0.16)_40%,transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(200,255,61,0.7),transparent)]"
      />

      <RevealGroup
        mode="mount"
        stagger={0.12}
        className="relative container-max flex w-full flex-1 flex-col container-x pt-8 pb-24 md:pt-10 md:pb-32 lg:frame-marks lg:mt-6 lg:border-x lg:border-line"
      >
        {/* globe: floats behind the right-aligned second line; top-right on phones */}
        <Reveal className="pointer-events-none absolute top-20 right-[-22%] z-0 w-[15rem] md:top-1/2 md:right-[3%] md:w-[clamp(240px,34vw,480px)] md:-translate-y-[64%]">
          <Globe />
        </Reveal>

        <Reveal className="relative z-10">
          <Eyebrow>Student org · Purdue University</Eyebrow>
        </Reveal>

        <Reveal className="relative z-10 my-auto py-16 md:py-20">
          <Headline
            as="h1"
            id="hero-title"
            size="display-fluid"
            stagger
            lines={["Building software", "*for nonprofits.*"]}
          />
        </Reveal>
      </RevealGroup>
    </section>
  );
}
