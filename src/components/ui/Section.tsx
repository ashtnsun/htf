import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  children: ReactNode;
  id?: string;
  as?: "section" | "div" | "header" | "footer";
  /** Draw the thin technical grid behind the section. */
  grid?: boolean;
  /** Huge ghosted word rendered behind the content (e.g. "Non-profits"). */
  ghost?: string;
  /** Where the ghost word sits vertically. */
  ghostPosition?: "top" | "center" | "bottom";
  /** Vertical padding scale. */
  padding?: "none" | "sm" | "md" | "lg";
  /** Wrap children in the page container (gutter + max width). Off for custom layouts. */
  contain?: boolean;
  /** Draw thin vertical lines at the container edges (Framer hero frame). */
  frame?: boolean;
  /**
   * Clip overflow (needed for ghost words and other decoration that bleeds past the edges).
   * Defaults to true only when `ghost` is set: an `overflow: hidden` ancestor turns into the
   * scroll container for `position: sticky` children, which shifts them by their `top` offset.
   */
  clip?: boolean;
  className?: string;
  containerClassName?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
};

const paddingClass = {
  none: "",
  sm: "py-12 md:py-16",
  md: "py-20 md:py-28",
  lg: "py-24 md:py-36",
} as const;

const ghostPos = {
  top: "top-0 -translate-y-1/3",
  center: "top-1/2 -translate-y-1/2",
  bottom: "bottom-0 translate-y-1/3",
} as const;

/** Full-width section with optional grid overlay, ghost word and page container. */
export function Section({
  children,
  id,
  as: Tag = "section",
  grid = false,
  ghost,
  ghostPosition = "center",
  padding = "md",
  contain = true,
  frame = false,
  clip = Boolean(ghost),
  className,
  containerClassName,
  ...aria
}: SectionProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "relative",
        clip && "overflow-hidden",
        grid && "grid-overlay",
        paddingClass[padding],
        className,
      )}
      {...aria}
    >
      {ghost ? (
        <span
          aria-hidden="true"
          data-ghost={ghost}
          className={cn("ghost-text", ghostPos[ghostPosition])}
        />
      ) : null}
      {contain ? (
        <div
          className={cn(
            "relative container-max container-x",
            frame && "lg:border-x lg:border-line",
            containerClassName,
          )}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </Tag>
  );
}
