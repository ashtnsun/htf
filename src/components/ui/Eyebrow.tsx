import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EyebrowProps = {
  children: ReactNode;
  /** Text colour. The square is always green. */
  tone?: "text" | "green" | "muted";
  /** HTML tag. Kept to a list on purpose: the three.js JSX types widen ElementType to never-props. */
  as?: "p" | "span" | "div" | "h2" | "h3" | "dt";
  className?: string;
};

/** Small green square + uppercase tracked label. Used above headlines and in the drawer. */
export function Eyebrow({ children, tone = "text", as: Tag = "p", className }: EyebrowProps) {
  return (
    <Tag
      className={cn(
        "inline-flex items-center gap-2.5 text-eyebrow font-medium uppercase",
        tone === "text" && "text-text",
        tone === "green" && "text-green",
        tone === "muted" && "text-muted",
        className,
      )}
    >
      <span aria-hidden="true" className="inline-block size-1.5 shrink-0 bg-green" />
      <span>{children}</span>
    </Tag>
  );
}
