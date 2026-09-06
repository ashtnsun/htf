import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChipStyleProps = {
  /** Filled green with dark text when selected (filter chips). */
  selected?: boolean;
  /** sm = label chip (tags, tech stack). md = 44px-tall tap target for filters. */
  size?: "sm" | "md";
  className?: string;
};

const base =
  "inline-flex items-center justify-center rounded-sm border font-medium whitespace-nowrap transition-colors duration-200";

const sizeClass = {
  sm: "min-h-7 px-2.5 text-eyebrow uppercase",
  md: "min-h-11 px-4 text-sm",
} as const;

function toneClass(selected: boolean) {
  return selected
    ? "border-green bg-green text-bg"
    : "border-line-strong bg-transparent text-muted";
}

/** Static label chip: project tags, "Built with" stack, years. */
export function Chip({
  children,
  selected = false,
  size = "sm",
  className,
}: ChipStyleProps & { children: ReactNode }) {
  return (
    <span className={cn(base, sizeClass[size], toneClass(selected), className)}>{children}</span>
  );
}

type ChipButtonProps = ChipStyleProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "type"> & {
    children: ReactNode;
  };

/** Toggle chip for filters: a real button that exposes its state through aria-pressed. */
export function ChipButton({
  children,
  selected = false,
  size = "md",
  className,
  ...props
}: ChipButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        base,
        sizeClass[size],
        toneClass(selected),
        !selected && "hover:border-mint/60 hover:text-text",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
