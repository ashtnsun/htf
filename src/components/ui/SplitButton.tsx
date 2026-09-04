import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SplitButtonProps = {
  href: string;
  children: ReactNode;
  /** primary = green label + lime arrow cell. secondary = outlined. */
  variant?: "primary" | "secondary";
  /** md = normal button. lg = hero. bar = fills the header bar (no radius). */
  size?: "md" | "lg" | "bar";
  /** Opens in a new tab and shows a diagonal arrow. Inferred for http(s) hrefs. */
  external?: boolean;
  className?: string;
  ariaLabel?: string;
};

/**
 * The Framer-style split CTA: a label cell and a separate arrow cell. On hover the
 * arrow slides right. Text on green/lime is always the dark background colour
 * (white on green fails WCAG AA; dark on green passes at 8.6:1).
 */
export function SplitButton({
  href,
  children,
  variant = "primary",
  size = "md",
  external,
  className,
  ariaLabel,
}: SplitButtonProps) {
  const isExternal = external ?? /^https?:\/\//.test(href);
  const Icon = isExternal ? ArrowUpRight : ArrowRight;

  const base = cn(
    "group inline-flex items-stretch overflow-hidden font-medium whitespace-nowrap",
    "transition-[transform,box-shadow] duration-300 ease-out-quart",
    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint",
    size === "md" && "rounded-sm text-sm",
    size === "lg" && "rounded-sm text-base",
    size === "bar" && "h-full rounded-none text-base",
    variant === "primary" && "hover:-translate-y-px",
    variant === "secondary" && "rounded-sm border border-line-strong hover:border-mint/60",
  );

  const label = cn(
    "flex items-center",
    size === "md" && "px-5 py-2.5",
    size === "lg" && "px-7 py-4",
    size === "bar" && "px-6 lg:px-10",
    variant === "primary" && "bg-green text-bg",
    variant === "secondary" && "bg-transparent text-text",
  );

  const arrow = cn(
    "flex items-center justify-center",
    size === "md" && "w-11",
    size === "lg" && "w-14",
    size === "bar" && "w-14 lg:w-16",
    variant === "primary" && "bg-lime text-bg",
    variant === "secondary" && "border-l border-line-strong bg-surface-2 text-mint",
  );

  const icon = cn(
    "size-[1.1em] transition-transform duration-300 ease-out-expo",
    isExternal
      ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      : "group-hover:translate-x-1",
  );

  const content = (
    <>
      <span className={label}>{children}</span>
      <span className={arrow} aria-hidden="true">
        <Icon className={icon} strokeWidth={2} />
      </span>
    </>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, className)}
        aria-label={ariaLabel}
      >
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cn(base, className)} aria-label={ariaLabel}>
      {content}
    </Link>
  );
}
