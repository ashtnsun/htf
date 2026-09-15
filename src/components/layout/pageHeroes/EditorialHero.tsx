"use client";

import { PageHeroSection } from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";
import { pageIndex, usePageKey } from "@/components/layout/pageHeroes/usePageKey";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "Editorial": a short title block set like a magazine page instead of a tall stage. A hairline
 * index row (the eyebrow, and the page's place in the site as "02 / 05"), then the headline in
 * a plain left-aligned stack, with the blurb and actions in the right-hand columns when the page
 * has them. No grid, no glow, no graphic; the block ends on the hairline the section bar sits
 * on, so on About, Students and Nonprofits the bar reads as the hero's bottom row. The copy only
 * fades up, so reduced motion loses nothing.
 */
export function EditorialHero({ eyebrow, lines, blurb, children }: PageHeroProps) {
  const place = pageIndex(usePageKey());
  const aside = Boolean(blurb || children);

  return (
    <PageHeroSection className="border-b border-line">
      <RevealGroup mode="mount" className="container-max lg:border-x lg:border-line">
        <Reveal className="flex h-14 items-center justify-between gap-6 border-b border-line container-x">
          <Eyebrow>{eyebrow}</Eyebrow>
          {place ? (
            <p className="text-eyebrow font-medium text-muted tabular-nums">
              <span className="text-text">{pad(place.index)}</span> / {pad(place.total)}
            </p>
          ) : null}
        </Reveal>
        <div
          className={cn(
            "grid gap-8 container-x pt-12 pb-14 md:pt-16 md:pb-20",
            aside && "lg:grid-cols-12 lg:items-end",
          )}
        >
          <Reveal className={cn(aside && "lg:col-span-8")}>
            <Headline
              as="h1"
              id="page-title"
              size="h2"
              lines={lines}
              className="md:text-display xl:text-display-lg"
            />
          </Reveal>
          {aside ? (
            <Reveal className="max-w-xl lg:col-span-4 lg:border-l lg:border-line lg:pl-8">
              {blurb ? <p className="text-body-lg text-muted">{blurb}</p> : null}
              {children ? <div className={cn(blurb && "mt-8")}>{children}</div> : null}
            </Reveal>
          ) : null}
        </div>
      </RevealGroup>
    </PageHeroSection>
  );
}
