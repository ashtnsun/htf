import { cn } from "@/lib/utils";

type StatTileProps = {
  value: string;
  label: string;
  className?: string;
};

/** Big number + label, for the impact stats row. Renders as a definition pair for screen readers. */
export function StatTile({ value, label, className }: StatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border border-line bg-surface p-6 md:p-8",
        className,
      )}
    >
      <dt className="order-2 text-sm text-muted">{label}</dt>
      <dd className="order-1 font-display text-h2 font-medium text-green md:text-display">
        {value}
      </dd>
    </div>
  );
}
