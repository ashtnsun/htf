"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { ExecMember } from "@/lib/content/schemas";
import { LinkedinIcon } from "@/components/icons/Social";
import { ChipButton } from "@/components/ui/Chip";
import { DURATION, EASE_GLIDE } from "@/lib/motion";
import { Media } from "@/components/ui/Media";
import { isTodo } from "@/lib/utils";

const PHOTO_SIZES =
  "(min-width: 1400px) 18vw, (min-width: 1280px) 22vw, (min-width: 1024px) 30vw, 45vw";

type BoardData = {
  members: ExecMember[];
  /** Board years available as chips, newest first. */
  years: string[];
};

type BoardViewProps = BoardData & {
  /** Selected board year; the first of `years` is the default. */
  year: string;
  onSelect?: (year: string) => void;
};

/**
 * Year chips + the exec grid for the selected board. Like the projects explorer, the selected
 * year lives in the URL (`?board=2025–26`) so a board can be linked to; chips update it with
 * `history.replaceState`, which Next syncs back into `useSearchParams` without a navigation.
 * A missing or unknown value shows the newest board.
 *
 * Wrap in <Suspense> with <ExecBoardView year={years[0]}> as the fallback: the static HTML
 * then carries the current board and the client takes over after hydration.
 */
export function ExecBoard({ members, years }: BoardData) {
  const searchParams = useSearchParams();
  const newest = years[0] ?? "";
  const requested = searchParams.get("board");
  const year = requested && years.includes(requested) ? requested : newest;

  function select(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === newest) params.delete("board");
    else params.set("board", next);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }

  return <ExecBoardView members={members} years={years} year={year} onSelect={select} />;
}

/** Presentational half of the board; also the Suspense fallback with the newest year. */
export function ExecBoardView({ members, years, year, onSelect }: BoardViewProps) {
  const reduce = useReducedMotion();
  const visible = members.filter((m) => m.year === year);
  const count = visible.length;

  return (
    <div>
      {years.length > 1 ? (
        <div role="group" aria-label="Board year" className="flex flex-wrap gap-2">
          {years.map((y) => (
            <ChipButton key={y} selected={y === year} onClick={() => onSelect?.(y)}>
              {y}
            </ChipButton>
          ))}
        </div>
      ) : null}
      {/* Screen readers hear which board is showing; the count is not shown visually. */}
      <p aria-live="polite" className="sr-only">
        {`${year} board, ${count} ${count === 1 ? "member" : "members"}`}
      </p>

      {/* Five across once the container is at its 90rem max (the nine-member board reads as
          5 + 4); four below that, where five would wrap every name and role. */}
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 wide:grid-cols-5">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((member) => (
            <motion.li
              key={member.slug}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: DURATION.base, ease: EASE_GLIDE }}
            >
              <ExecCard member={member} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

/**
 * One member: a 4:5 photo, name, role and the LinkedIn cell. The cell is a link when the URL
 * is known and a dimmed placeholder while `linkedin` is still a TODO, so the link's place is
 * visible before the content lands. A member with no LinkedIn at all gets no cell.
 */
function ExecCard({ member }: { member: ExecMember }) {
  const linkedin = member.linkedin && !isTodo(member.linkedin) ? member.linkedin : null;
  const cell = "flex size-11 shrink-0 items-center justify-center border transition-colors";
  return (
    <article className="flex h-full flex-col border border-line bg-surface">
      <div className="relative aspect-[4/5] overflow-hidden border-b border-line bg-surface-2">
        {member.photo ? (
          <Media
            src={member.photo}
            alt={isTodo(member.name) ? "" : `Portrait of ${member.name}`}
            fill
            sizes={PHOTO_SIZES}
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-full items-center justify-center text-muted"
          >
            <User className="size-10" strokeWidth={1.25} />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <h3 className="text-body font-medium text-balance text-text sm:text-body-lg">{member.name}</h3>
          <p className="mt-0.5 text-sm text-muted">{member.role}</p>
        </div>
        {linkedin ? (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${member.name} on LinkedIn`}
            className={`${cell} border-line-strong text-muted hover:border-green hover:text-green`}
          >
            <LinkedinIcon className="size-4" />
          </a>
        ) : member.linkedin ? (
          <span
            aria-hidden="true"
            title="[TODO: LinkedIn URL]"
            className={`${cell} border-dashed border-line-strong text-muted/50`}
          >
            <LinkedinIcon className="size-4" />
          </span>
        ) : null}
      </div>
    </article>
  );
}
