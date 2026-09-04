import { formatDeadline, getPrimaryCta, isInSeason, site } from "@content/site";
import { Globe } from "@/components/home/Globe";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { SplitButton } from "@/components/ui/SplitButton";

/**
 * Home hero after the Framer composition: eyebrow, two-line staggered headline with
 * the second line green, small right-aligned blurb beside the first line, wireframe
 * globe as the hero object, bottom radial glow, grid overlay and a "Scroll down" marker.
 * Copy is placeholder; the design director rewrites it.
 */
export function Hero() {
  const cta = getPrimaryCta();
  const deadline = formatDeadline();
  const inSeason = isInSeason();

  return (
    <section
      aria-labelledby="hero-title"
      className="grid-overlay relative flex min-h-[calc(100svh-var(--header-h))] flex-col overflow-hidden [--grid-cols:8] [--grid-row:9rem]"
    >
      {/* bottom glow, like the Framer hero */}
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
        className="relative container-max flex w-full flex-1 flex-col container-x pt-10 pb-28 md:pt-14 md:pb-36 lg:border-x lg:border-line"
      >
        {/* globe: behind the headline like the template's ring; top-right on phones */}
        <Reveal className="pointer-events-none absolute top-14 right-[-14%] z-0 w-[15rem] md:top-0 md:right-auto md:left-1/2 md:w-[clamp(200px,32vw,440px)] md:-translate-x-[26%]">
          <Globe />
        </Reveal>

        <Reveal className="relative z-10">
          <Eyebrow>Student org · Purdue University</Eyebrow>
        </Reveal>

        {/* headline + side blurb share one box so the blurb aligns with line 1 */}
        <Reveal className="relative z-10 mt-[clamp(4rem,14vh,9rem)] md:mt-[clamp(5rem,18vh,11rem)]">
          <div className="relative">
            <Headline
              as="h1"
              id="hero-title"
              size="display-fluid"
              stagger
              lines={["Building software for", "*nonprofits, at Purdue.*"]}
              firstLineClassName="xl:max-w-[calc(100%-15rem)]"
            />
            <div className="mt-8 max-w-xs xl:absolute xl:top-0 xl:right-0 xl:mt-0 xl:w-[12.5rem]">
              <p className="text-sm font-medium text-green">{site.academicYear}</p>
              <p className="mt-2 text-sm text-muted">
                We create software for nonprofits around the globe.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal className="relative z-10 mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center md:mt-14">
          <SplitButton href={cta.href} size="lg">
            {cta.label}
          </SplitButton>
          <SplitButton href="/projects" variant="secondary" size="lg">
            See our projects
          </SplitButton>
          {inSeason && deadline ? (
            <p className="text-sm text-muted sm:ml-2">
              {site.season.cycleName} applications close{" "}
              <span className="text-text">{deadline}</span>
            </p>
          ) : null}
        </Reveal>
      </RevealGroup>

      {/* scroll marker */}
      <a
        href="#featured"
        aria-label="Scroll down to featured projects"
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-[0.6875rem] tracking-[0.08em] text-green uppercase"
      >
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-green shadow-[0_0_12px_2px_rgba(3,198,82,0.8)]"
        />
        <span
          aria-hidden="true"
          className="h-16 w-px bg-[linear-gradient(to_bottom,var(--green),transparent)]"
        />
        <span>Scroll down</span>
      </a>
    </section>
  );
}
