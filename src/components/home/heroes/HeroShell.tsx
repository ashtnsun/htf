import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils";

type HeroShellProps = ComponentPropsWithRef<"section"> & {
  /** The thin technical grid behind the hero (on by default). */
  grid?: boolean;
  /** The green radial glow along the bottom edge. */
  glow?: boolean;
};

/**
 * The frame every hero variant shares: a section labelled by the h1 (`#hero-title`), at least
 * the viewport minus the header tall, clipped, optionally with the grid and the bottom glow
 * from the original hero. Variants put their own composition inside.
 */
export function HeroShell({
  grid = true,
  glow = false,
  className,
  children,
  ...rest
}: HeroShellProps) {
  return (
    <section
      aria-labelledby="hero-title"
      className={cn(
        "relative flex min-h-[calc(100svh-var(--header-h))] flex-col overflow-hidden",
        grid && "grid-overlay [--grid-cols:8] [--grid-row:9rem]",
        className,
      )}
      {...rest}
    >
      {glow ? <HeroGlow /> : null}
      {children}
    </section>
  );
}

/** The bottom glow and its hairline, as on the original hero. Decoration only. */
export function HeroGlow({ className }: { className?: string }) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-[radial-gradient(70%_100%_at_50%_100%,rgba(3,198,82,0.55)_0%,rgba(3,198,82,0.16)_40%,transparent_72%)]",
          className,
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(200,255,61,0.7),transparent)]"
      />
    </>
  );
}

/** The framed page container used inside the shells (rails and crosshairs on lg+). */
export const heroFrameClass =
  "relative container-max flex w-full flex-1 flex-col container-x pt-8 pb-24 md:pt-10 md:pb-32 lg:frame-marks lg:mt-6 lg:border-x lg:border-line";
