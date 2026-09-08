import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { hero } from "@content/hero";
import { site } from "@content/site";
import { HeroShell } from "@/components/home/heroes/HeroShell";
import type { HeroProps } from "@/components/home/heroes/types";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { renderAccent } from "@/components/ui/Headline";
import { cn } from "@/lib/utils";

const AUDIENCES = [
  { label: "Students", href: "/students" },
  { label: "Nonprofits", href: "/nonprofits" },
] as const;

/**
 * "Rows": the hero as a spec sheet in the language of the full-bleed rows lower on the page.
 * Every hairline runs edge to edge; two rails frame the content columns on large screens;
 * the two headline lines each get a row, and the last row holds the site's three ways in
 * (Students, Nonprofits, the season CTA) as cells with the split-button treatment. The rows
 * stretch to fill the viewport, so the sheet is as tall as the screen.
 */
export function RowsHero({ cta }: HeroProps) {
  return (
    <HeroShell grid={false} className="border-b border-line">
      {/* rails at the content edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-(--gutter) inset-y-0 mx-auto hidden max-w-[calc(90rem-2*var(--gutter))] border-x border-line lg:block"
      />

      <RevealGroup mode="mount" stagger={0.1} className="relative flex flex-1 flex-col">
        <div className="border-b border-line">
          <Reveal className="container-max container-x">
            <div className="flex min-h-14 items-center justify-between gap-6 lg:px-(--gutter)">
              <Eyebrow>{hero.eyebrow}</Eyebrow>
              <p className="hidden text-eyebrow font-medium whitespace-nowrap text-muted uppercase sm:block">
                {site.academicYear}
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal className="flex flex-1 flex-col">
          <h1
            id="hero-title"
            className="flex flex-1 flex-col font-display text-display-fluid font-medium text-text"
          >
            {hero.lines.map((line, i) => (
              <span
                key={i}
                className="flex flex-1 flex-col justify-center border-b border-line py-8 md:py-10"
              >
                <span className="container-max block w-full container-x">
                  <span className={cn("block lg:px-(--gutter)", i > 0 && "md:text-right")}>
                    {renderAccent(line)}
                  </span>
                </span>
              </span>
            ))}
          </h1>
        </Reveal>

        <Reveal>
          <ul className="grid md:bleed-row-3">
            {AUDIENCES.map((item, i) => (
              <li
                key={item.href}
                className={cn(
                  "border-b border-line md:border-r md:border-b-0",
                  i === 0 && "md:col-start-2 md:border-l",
                )}
              >
                <Link
                  href={item.href}
                  className="group hover-corners flex min-h-16 items-center justify-between gap-4 px-(--gutter) py-4 text-base font-medium text-text transition-colors duration-200 hover:bg-surface-2 focus-visible:outline-offset-[-3px] md:min-h-20"
                >
                  <span>{item.label}</span>
                  <ArrowRight
                    className="size-5 text-green transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
            <li className="md:border-r md:border-line">
              <Link
                href={cta.href}
                className="group flex min-h-16 items-stretch bg-green text-base font-medium text-bg focus-visible:outline-offset-[-3px] md:min-h-20"
              >
                <span className="flex flex-1 items-center px-(--gutter)">{cta.label}</span>
                <span
                  aria-hidden="true"
                  className="flex w-16 items-center justify-center border-l-2 border-black"
                >
                  <ArrowRight className="size-5 transition-transform duration-300 ease-out-expo group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          </ul>
        </Reveal>
      </RevealGroup>
    </HeroShell>
  );
}
