import Link from "next/link";
import { ArrowRight, ArrowUpRight, Download, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SplitButtonProps = {
  /** Destination. Omit it to render a real <button> (form submit, client actions). */
  href?: string;
  children: ReactNode;
  /**
   * primary = green label + green arrow cell with a black divider (the header bar's
   * treatment, on every primary button since the 2026-09-07 audit 3). secondary = outlined.
   */
  variant?: "primary" | "secondary";
  /** md = normal button. lg = hero. bar = fills the header bar. */
  size?: "md" | "lg" | "bar";
  /** Opens in a new tab and shows a diagonal arrow. Inferred for http(s) hrefs. */
  external?: boolean;
  /** <button> only. */
  type?: "submit" | "button";
  /** <button> only: submitted with the form (e.g. which step to go to next). */
  name?: string;
  value?: string;
  disabled?: boolean;
  /** <button> only: shows a spinner in the arrow cell and announces the busy state. */
  pending?: boolean;
  /** <a> only: downloads the href instead of navigating (route handlers such as the CSV). */
  download?: boolean;
  /**
   * Renders a <span> that only looks like the button, for cards that are links themselves
   * (Who we serve). It follows the hover of the enclosing `group`.
   */
  presentational?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
};

/**
 * The split CTA: a label cell and a separate arrow cell, square-cornered. Hover follows the
 * site-wide language: the button itself stays put. The label rolls up and a copy rises into
 * its place (both in one clipped line box, so the cell never changes size; instant under
 * reduced motion), and the arrow glyph nudges along the direction it points. On the secondary
 * variant the border turns green and the arrow cell fills green, so its white arrow turns
 * black. Text on green is always the dark background colour (white on green fails WCAG AA).
 */
export function SplitButton({
  href,
  children,
  variant = "primary",
  size = "md",
  external,
  type = "button",
  name,
  value,
  disabled = false,
  pending = false,
  download = false,
  presentational = false,
  onClick,
  className,
  ariaLabel,
}: SplitButtonProps) {
  const isExternal = href ? (external ?? /^https?:\/\//.test(href)) : false;
  const Icon = pending
    ? LoaderCircle
    : download
      ? Download
      : isExternal
        ? ArrowUpRight
        : ArrowRight;

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
    variant === "primary" && "border-black bg-green text-bg",
    variant === "primary" && (size === "bar" ? "border-l" : "border-l-2"),
    variant === "secondary" &&
      "border-l border-line-strong bg-surface-2 text-text group-hover:border-green group-hover:bg-green group-hover:text-bg",
  );

  /* Two copies of the label stacked in one clipped line box: the first rolls up and out, the
     second (hidden from assistive tech) rises from below into its place. */
  const roll = "relative block overflow-hidden";
  const rollMotion = "transition-transform duration-500 ease-out-expo motion-reduce:transition-none";
  const rollOut = cn("block", rollMotion, "group-hover:-translate-y-full");
  const rollIn = cn(
    "absolute inset-0 block translate-y-full",
    rollMotion,
    "group-hover:translate-y-0",
  );

  const icon = cn(
    "size-[1.1em] transition-transform duration-300 ease-out-expo",
    pending
      ? "animate-spin"
      : download
        ? "group-hover:translate-y-0.5"
        : isExternal
          ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          : "group-hover:translate-x-1",
  );

  const content = (
    <>
      <span className={label}>
        <span className={roll}>
          <span className={rollOut}>{children}</span>
          <span className={rollIn} aria-hidden="true">
            {children}
          </span>
        </span>
      </span>
      <span className={arrow} aria-hidden="true">
        <Icon className={icon} strokeWidth={2} />
      </span>
    </>
  );

  if (presentational) {
    return (
      <span className={cn(base, variant === "secondary" && "group-hover:border-green", className)}>
        {content}
      </span>
    );
  }
  if (!href) {
    return (
      <button
        type={type}
        name={name}
        value={value}
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
  if (download) {
    return (
      <a href={href} download className={cn(base, className)} aria-label={ariaLabel}>
        {content}
      </a>
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
