import { formatDeadline, isInSeason, site } from "@content/site";
import { cn } from "@/lib/utils";

/**
 * "Fall 2026 applications close Sep 12, 11:59 PM", read from content/site.ts → season.
 * Renders nothing out of season, so it can sit next to any CTA unconditionally.
 */
export function SeasonNote({ className }: { className?: string }) {
  if (!isInSeason()) return null;
  const deadline = formatDeadline();
  if (!deadline) return null;
  return (
    <p className={cn("text-sm text-muted", className)}>
      {site.season.cycleName} applications close <span className="text-text">{deadline}</span>
    </p>
  );
}
