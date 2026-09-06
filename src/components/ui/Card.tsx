import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  /** Makes the whole card a link (the element becomes an <a> inside the wrapper). */
  href?: string;
  padding?: "none" | "sm" | "md" | "lg";
  /** Hover treatment: viewfinder corners + stronger border (on by default when href is set). */
  interactive?: boolean;
  /** Frosted glass instead of the solid surface (for cards floating over decoration). */
  glass?: boolean;
  as?: "div" | "article" | "li";
  className?: string;
};

const paddingClass = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

/**
 * Square surface card with the hairline border used across the site. Interactive cards use
 * the shared hover language (`hover-corners`): the corners lock on, the border brightens,
 * nothing moves.
 */
export function Card({
  children,
  href,
  padding = "md",
  interactive,
  glass = false,
  as: Tag = "div",
  className,
}: CardProps) {
  const hover = interactive ?? Boolean(href);
  const classes = cn(
    "relative block overflow-hidden border border-line text-text",
    glass ? "glass" : "bg-surface",
    "transition-[border-color,background-color] duration-200",
    hover && "hover-corners hover:border-line-strong hover:bg-surface-2",
    hover && glass && "hover:bg-surface/80",
    paddingClass[padding],
    className,
  );
  if (href) {
    return (
      <Tag className="h-full">
        <Link href={href} className={cn(classes, "h-full")}>
          {children}
        </Link>
      </Tag>
    );
  }
  return <Tag className={classes}>{children}</Tag>;
}
