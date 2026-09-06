import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";

type PageHeroProps = {
  eyebrow: string;
  /** One string per line; *asterisks* mark green words. */
  lines: string[];
  blurb?: string;
  children?: ReactNode;
  /** Use the staggered left/right composition. */
  stagger?: boolean;
  /** Small "back to the index" link above the eyebrow (detail pages). */
  back?: { href: string; label: string };
  /** Huge ghosted word behind the hero (e.g. "404"). Decoration only. */
  ghost?: string;
};

/** Compact hero for inner pages: eyebrow, split headline, blurb, optional actions. */
export function PageHero({
  eyebrow,
  lines,
  blurb,
  children,
  stagger = true,
  back,
  ghost,
}: PageHeroProps) {
  return (
    <section
      aria-labelledby="page-title"
      className="grid-overlay relative overflow-hidden [--grid-cols:8] [--grid-row:8rem]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] bg-[radial-gradient(60%_100%_at_50%_100%,rgba(3,198,82,0.35)_0%,rgba(3,198,82,0.08)_45%,transparent_75%)]"
      />
      {ghost ? (
        <span aria-hidden="true" data-ghost={ghost} className="ghost-text top-0 -translate-y-1/4" />
      ) : null}
      <RevealGroup
        mode="mount"
        className="relative container-max container-x pt-14 pb-20 md:pt-20 md:pb-28 lg:border-x lg:border-line"
      >
        {back ? (
          <Reveal className="mb-6">
            <Link
              href={back.href}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-text"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {back.label}
            </Link>
          </Reveal>
        ) : null}
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal className="mt-8 md:mt-12">
          <Headline as="h1" id="page-title" size="display-fluid" stagger={stagger} lines={lines} />
        </Reveal>
        {blurb ? (
          <Reveal className="mt-8 max-w-xl">
            <p className="text-body-lg text-muted">{blurb}</p>
          </Reveal>
        ) : null}
        {children ? <Reveal className="mt-8">{children}</Reveal> : null}
      </RevealGroup>
    </section>
  );
}
