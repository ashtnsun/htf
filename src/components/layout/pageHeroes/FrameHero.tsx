import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  PageHeroContent,
  PageHeroGlow,
  PageHeroSection,
} from "@/components/layout/pageHeroes/PageHeroShell";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";

type FrameHeroProps = PageHeroProps & {
  /** Small "back to the index" link above the eyebrow (detail pages). */
  back?: { href: string; label: string };
  /** Huge ghosted word behind the hero (e.g. "404"). Decoration only. */
  ghost?: string;
};

/**
 * "Frame", the inner-page hero the site ships with: the technical grid, the green glow along
 * the bottom edge and the framed column, matching the home hero's language. The only variant
 * that takes `back` and `ghost`, so the 404 and the privacy page use it directly rather than
 * through the configurable switch.
 */
export function FrameHero({ back, ghost, ...content }: FrameHeroProps) {
  return (
    <PageHeroSection className="grid-overlay [--grid-cols:8] [--grid-row:8rem]">
      <PageHeroGlow />
      {ghost ? (
        <span aria-hidden="true" data-ghost={ghost} className="ghost-text top-0 -translate-y-1/4" />
      ) : null}
      <PageHeroContent
        {...content}
        before={
          back ? (
            <Link
              href={back.href}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-text"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {back.label}
            </Link>
          ) : null
        }
      />
    </PageHeroSection>
  );
}
