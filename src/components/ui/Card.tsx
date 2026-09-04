import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  /** Makes the whole card a link (the element becomes an <a> inside the wrapper). */
  href?: string;
  padding?: "none" | "sm" | "md" | "lg";
  /** Lift + stronger border on hover (on by default when href is set). */
  interactive?: boolean;
  as?: "div" | "article" | "li";
  className?: string;
};

const paddingClass = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

/** Surface card with the 8px radius and hairline border used across the site. */
export function Card({
  children,
  href,
  padding = "md",
  interactive,
  as: Tag = "div",
  className,
}: CardProps) {
  const hover = interactive ?? Boolean(href);
  const classes = cn(
    "relative block overflow-hidden rounded-md border border-line bg-surface text-text",
    "transition-[border-color,transform,background-color] duration-300 ease-out-quart",
    hover && "hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2",
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
