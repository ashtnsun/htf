import { User } from "lucide-react";
import type { TeamMember } from "@/lib/content/schemas";
import { LinkedinIcon } from "@/components/icons/Social";
import { Media } from "@/components/ui/Media";
import { cn, isTodo } from "@/lib/utils";

type TeamGridProps = {
  members: TeamMember[];
  className?: string;
};

/** Avatar grid for a project team: photo (or a placeholder glyph), name, role, LinkedIn. */
export function TeamGrid({ members, className }: TeamGridProps) {
  if (members.length === 0) return null;
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {members.map((member, i) => {
        const linkedin = member.linkedin && !isTodo(member.linkedin) ? member.linkedin : null;
        return (
          <li
            key={`${member.name}-${i}`}
            className="flex items-center gap-4 rounded-md border border-line bg-surface p-4"
          >
            {member.avatar ? (
              <Media
                src={member.avatar}
                alt=""
                width={56}
                height={56}
                className="size-14 shrink-0 rounded-full border border-line object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-muted"
              >
                <User className="size-6" strokeWidth={1.5} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text">{member.name}</p>
              <p className="text-sm text-muted">{member.role}</p>
            </div>
            {linkedin ? (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-line-strong text-muted transition-colors hover:border-mint hover:text-mint"
              >
                <LinkedinIcon className="size-4" />
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
