import type { TeamSeat } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";
import { ROLE_ICONS } from "./roleIcons";

/**
 * One square per seat: filled green lead, surface developers, mint-outlined designers. The
 * captions came off in the 2026-09-10 copy pass, so each seat carries its count and label for
 * assistive tech instead (`content/students.ts` → teamStructure).
 *
 * Not rendered anywhere since 2026-09-15: it sat under the How we work heading on /students
 * and came off at Ashton's request, kept here for later use. To bring it back, render
 * `<TeamDiagram seats={getStudentsPage().teamStructure} className="mt-10" />`.
 */
export function TeamDiagram({ seats, className }: { seats: TeamSeat[]; className?: string }) {
  return (
    <ul aria-label="Team structure" className={cn("flex flex-wrap gap-x-6 gap-y-5", className)}>
      {seats.map((seat) => {
        const Icon = ROLE_ICONS[seat.icon];
        const min = seat.minCount ?? seat.count;
        return (
          <li key={seat.id}>
            <span className="sr-only">
              {seat.countLabel ?? seat.count} {seat.label}
            </span>
            <div className="flex gap-2" aria-hidden="true">
              {Array.from({ length: seat.count }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex size-11 items-center justify-center border",
                    seat.icon === "lead" && "border-green bg-green text-bg",
                    seat.icon === "code" && "border-line-strong bg-surface-2 text-text",
                    seat.icon === "design" && "border-mint/70 text-mint",
                    i >= min && "border-dashed opacity-60",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
