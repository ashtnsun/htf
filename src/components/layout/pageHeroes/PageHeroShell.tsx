import type { ComponentPropsWithRef, ReactNode } from "react";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import type { PageHeroProps } from "@/components/layout/pageHeroes/types";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { cn } from "@/lib/utils";

/**
 * The frame every page-hero variant shares: a section labelled by the h1 (`#page-title`) and
 * clipped, so a variant's graphic never widens the page. Variants put their own graphic and
 * a <PageHeroContent> inside.
 */
export function PageHeroSection({
  className,
  children,
  ...rest
}: ComponentPropsWithRef<"section">) {
  return (
    <section
      aria-labelledby="page-title"
      className={cn("relative overflow-hidden", className)}
      {...rest}
    >
      {children}
    </section>
  );
}

/** The framed page column used inside the shells (rails and crosshairs on lg+). */
export const pageHeroFrameClass =
  "relative container-max container-x pt-14 pb-20 md:pt-20 md:pb-28 lg:frame-marks lg:mt-6 lg:border-x lg:border-line";

type PageHeroContentProps = PageHeroProps & {
  /** Rendered above the eyebrow (the "back to the index" link on detail pages). */
  before?: ReactNode;
  className?: string;
};

/**
 * The copy every variant renders in the same order and rhythm: the eyebrow, the one `h1`
 * (`#page-title`), the blurb and the page's actions, revealed in sequence on mount. Variants
 * differ in what is drawn around it, never in this.
 */
export function PageHeroContent({
  eyebrow,
  lines,
  blurb,
  children,
  stagger = true,
  before,
  className,
}: PageHeroContentProps) {
  return (
    <RevealGroup mode="mount" className={cn(pageHeroFrameClass, className)}>
      {before ? <Reveal className="mb-6">{before}</Reveal> : null}
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
  );
}

/** The green radial glow along the bottom edge, as on the shipped hero. Decoration only. */
export function PageHeroGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-[60%] bg-[radial-gradient(60%_100%_at_50%_100%,rgba(3,198,82,0.35)_0%,rgba(3,198,82,0.08)_45%,transparent_75%)]",
        className,
      )}
    />
  );
}
