import { User } from "lucide-react";
import type { TeamMember } from "@/lib/content/schemas";
import { LinkedinIcon } from "@/components/icons/Social";
import { Media } from "@/components/ui/Media";
import { cn, isTodo } from "@/lib/utils";

type TeamGridProps = {
  members: TeamMember[];
  /**
   * grid = cards, up to three across (the component gallery). list = one hairline-divided
   * column, for the aside of a project page (the 2026-09-09 review moved the team there).
   */
  variant?: "grid" | "list";
  className?: string;
};

/** A project team: photo (or a placeholder glyph), name, role, LinkedIn. */
export function TeamGrid({ members, variant = "grid", className }: TeamGridProps) {
  if (members.length === 0) return null;
  const list = variant === "list";
  return (
    <ul
      className={cn(
        list
          ? "divide-y divide-line border-y border-line"
          : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {members.map((member, i) => {
        const linkedin = member.linkedin && !isTodo(member.linkedin) ? member.linkedin : null;
        const avatarClass = cn(
          "shrink-0 rounded-full border border-line",
          list ? "size-10" : "size-14",
        );
        return (
          <li
            key={`${member.name}-${i}`}
            className={cn(
              "flex items-center",
              list ? "gap-3 py-3" : "gap-4 border border-line bg-surface p-4",
            )}
          >
            {member.avatar ? (
              <Media
                src={member.avatar}
                alt=""
                width={56}
                height={56}
                className={cn(avatarClass, "object-cover")}
              />
            ) : (
              <span
                aria-hidden="true"
                className={cn(
                  avatarClass,
                  "flex items-center justify-center bg-surface-2 text-muted",
                )}
              >
                <User className={list ? "size-5" : "size-6"} strokeWidth={1.5} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className={cn("truncate font-medium text-text", list && "text-sm")}>
                {member.name}
              </p>
              <p className={cn("text-muted", list ? "text-xs" : "text-sm")}>{member.role}</p>
            </div>
            {linkedin ? (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                className="flex size-11 shrink-0 items-center justify-center border border-line-strong text-muted transition-colors duration-200 hover:border-green hover:text-green"
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
