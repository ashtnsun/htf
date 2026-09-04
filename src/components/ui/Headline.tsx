import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeadlineSize = "display-fluid" | "display-xl" | "display-lg" | "display" | "h2" | "h3";

type HeadlineProps = {
  /** One string per line. Wrap words in *asterisks* to render them in green. */
  lines: string[];
  as?: "h1" | "h2" | "h3" | "p";
  size?: HeadlineSize;
  /**
   * Framer-style staggered layout: the first line sits left, the following lines
   * right-align on md+ screens. Collapses to a normal left-aligned stack on phones.
   */
  stagger?: boolean;
  align?: "left" | "center";
  id?: string;
  className?: string;
};

const sizeClass: Record<HeadlineSize, string> = {
  "display-fluid": "text-display-fluid",
  "display-xl": "text-display-xl",
  "display-lg": "text-display-lg",
  display: "text-display",
  h2: "text-h2",
  h3: "text-h3",
};

/** Turns "Building software for *nonprofits*" into text with green accent spans. */
export function renderAccent(line: string): ReactNode[] {
  const parts = line.split(/(\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith("*") && part.endsWith("*") ? (
      <span key={i} className="text-green">
        {part.slice(1, -1)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/**
 * Display headline with green accent words. Supports the two-line staggered
 * composition from the Framer prototype (line 1 left, line 2 right).
 */
export function Headline({
  lines,
  as: Tag = "h2",
  size = "h2",
  stagger = false,
  align = "left",
  id,
  className,
}: HeadlineProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "font-display font-medium text-text",
        sizeClass[size],
        stagger ? "flex flex-col" : align === "center" && "text-center",
        className,
      )}
    >
      {lines.map((line, i) => (
        <span key={i} className={cn("block", stagger && i > 0 && "md:self-end md:text-right")}>
          {renderAccent(line)}
        </span>
      ))}
    </Tag>
  );
}
