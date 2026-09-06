import { CountUp } from "@/components/ui/CountUp";
import { cn } from "@/lib/utils";

type StatTileProps = {
  value: string;
  label: string;
  /** Stagger offset for the count-up when several tiles enter the viewport together. */
  index?: number;
  className?: string;
};

/**
 * Big number + label for the impact row: a frosted-glass tile whose number counts up the
 * first time it scrolls into view. Renders as a definition pair for screen readers.
 */
export function StatTile({ value, label, index = 0, className }: StatTileProps) {
  return (
    <div className={cn("flex flex-col gap-3 border border-line glass p-6 md:p-8", className)}>
      <dt className="order-2 text-sm text-muted">{label}</dt>
      <dd className="order-1 font-display text-h2 font-medium text-green md:text-display">
        <CountUp value={value} delay={index * 140} />
      </dd>
    </div>
  );
}
