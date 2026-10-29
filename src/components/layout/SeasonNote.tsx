import { formatDeadline, isInSeason, site } from "@content/site";
import { cn } from "@/lib/utils";

/**
 * "2026-2027 applications close Sep 17, 11:59 PM", read from content/site.ts → season.
 * Out of season it renders nothing, so it can sit next to any CTA unconditionally, unless
 * `closed` asks it to say the cycle is over (the roles column on /students).
 */
export function SeasonNote({ className, closed }: { className?: string; closed?: boolean }) {
  const deadline = isInSeason() ? formatDeadline() : null;
  if (!deadline) {
    if (!closed) return null;
    return (
      <p className={cn("text-sm text-muted", className)}>
        {site.season.cycleName} applications are closed. We recruit again at the start of the fall
        semester.
      </p>
    );
  }
  return (
    <p className={cn("text-sm text-muted", className)}>
      {site.season.cycleName} applications close <span className="text-text">{deadline}</span>
    </p>
  );
}
