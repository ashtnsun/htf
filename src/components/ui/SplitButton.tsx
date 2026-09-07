import Link from "next/link";
import { ArrowRight, ArrowUpRight, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SplitButtonProps = {
  /** Destination. Omit it to render a real <button> (form submit, client actions). */
  href?: string;
  children: ReactNode;
  /**
   * primary = green label + lime arrow cell (in the header bar: green on green with a black
   * divider, no lime). secondary = outlined.
   */
  variant?: "primary" | "secondary";
  /** md = normal button. lg = hero. bar = fills the header bar. */
  size?: "md" | "lg" | "bar";
  /** Opens in a new tab and shows a diagonal arrow. Inferred for http(s) hrefs. */
  external?: boolean;
  /** <button> only. */
  type?: "submit" | "button";
  disabled?: boolean;
  /** <button> only: shows a spinner in the arrow cell and announces the busy state. */
  pending?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
};

/**
 * The split CTA: a label cell and a separate arrow cell, square-cornered. Hover follows the
 * site-wide language: the button stays put, the arrow slides, and on the secondary variant
 * the border and arrow cell turn green (the same fill the project-card arrows use).
 * Text on green/lime is always the dark background colour (white on green fails WCAG AA).
 */
export function SplitButton({
  href,
  children,
  variant = "primary",
  size = "md",
  external,
  type = "button",
  disabled = false,
  pending = false,
  onClick,
  className,
  ariaLabel,
}: SplitButtonProps) {
  const isExternal = href ? (external ?? /^https?:\/\//.test(href)) : false;
  const Icon = pending ? LoaderCircle : isExternal ? ArrowUpRight : ArrowRight;

  const base = cn(
    "group inline-flex items-stretch overflow-hidden font-medium whitespace-nowrap",
    "transition-[border-color,opacity] duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint",
    size === "md" && "text-sm",
    size === "lg" && "text-base",
    size === "bar" && "h-full text-base",
    variant === "secondary" && "border border-line-strong hover:border-green",
    (disabled || pending) && "pointer-events-none opacity-60",
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
    "flex items-center justify-center transition-colors duration-200",
    size === "md" && "w-11",
    size === "lg" && "w-14",
    size === "bar" && "w-14 lg:w-16",
    variant === "primary" && size !== "bar" && "bg-lime text-bg",
    variant === "primary" && size === "bar" && "border-l border-black bg-green text-bg",
    variant === "secondary" &&
      "border-l border-line-strong bg-surface-2 text-green group-hover:border-green group-hover:bg-green group-hover:text-bg",
  );

  const icon = cn(
    "size-[1.1em] transition-transform duration-300 ease-out-expo",
    pending
      ? "animate-spin"
      : isExternal
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

  if (!href) {
    return (
      <button
        type={type}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
        onClick={onClick}
        className={cn(base, className)}
        aria-label={ariaLabel}
      >
        {content}
      </button>
    );
  }
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
    <Link href={href} className={cn(base, className)} aria-label={ariaLabel} onClick={onClick}>
      {content}
    </Link>
  );
}
