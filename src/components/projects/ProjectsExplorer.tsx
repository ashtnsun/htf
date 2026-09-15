"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { ProjectCard, type ProjectCardData } from "@/components/projects/ProjectCard";
import { ChipButton } from "@/components/ui/Chip";
import { DURATION, EASE_GLIDE } from "@/lib/motion";

const CARD_SIZES = "(min-width: 1024px) 33vw, 50vw";

type ExplorerData = {
  projects: ProjectCardData[];
  /** Cycles available as filter chips, newest first. */
  years: string[];
};

type ExplorerViewProps = ExplorerData & {
  /** Selected cycle, or null for "All". */
  year: string | null;
  onSelect?: (year: string | null) => void;
};

/**
 * Year filter chips + project grid. The selected year lives in the URL (`?year=2025–26`) so a
 * filtered view can be shared; chips update it with `history.replaceState`, which Next syncs
 * back into `useSearchParams` without a navigation or a server round trip.
 *
 * Wrap in <Suspense> with <ProjectsExplorerView year={null}> as the fallback: the static HTML
 * then carries the full, unfiltered grid and the client takes over after hydration.
 */
export function ProjectsExplorer({ projects, years }: ExplorerData) {
  const searchParams = useSearchParams();
  const year = searchParams.get("year");

  function select(next: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("year", next);
    else params.delete("year");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }

  return <ProjectsExplorerView projects={projects} years={years} year={year} onSelect={select} />;
}

/** Presentational half of the explorer; also the Suspense fallback with `year={null}`. */
export function ProjectsExplorerView({ projects, years, year, onSelect }: ExplorerViewProps) {
  const reduce = useReducedMotion();
  const visible = year ? projects.filter((p) => p.year === year) : projects;
  const chips: { value: string | null; label: string }[] = [
    { value: null, label: "All" },
    ...years.map((y) => ({ value: y, label: y })),
  ];
  const count = visible.length;
  const summary = `${count} ${count === 1 ? "project" : "projects"}${year ? ` from ${year}` : ""}`;

  return (
    <div>
      <div role="group" aria-label="Filter by year" className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <ChipButton
            key={chip.label}
            selected={chip.value === year}
            onClick={() => onSelect?.(chip.value)}
          >
            {chip.label}
          </ChipButton>
        ))}
      </div>
      {/* Screen readers still hear the result of a filter; the count is not shown visually. */}
      <p aria-live="polite" className="sr-only">
        {summary}
      </p>

      {count > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {visible.map((project) => (
              <motion.li
                key={project.slug}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
                transition={{ duration: DURATION.base, ease: EASE_GLIDE }}
                // spans the card's five rows so titles, locations and tags line up across a row
                className="row-span-5 grid grid-rows-subgrid gap-0"
              >
                {/* Temporary: work in progress, the cards do not link to their pages yet. */}
                <ProjectCard project={project} headingLevel="h3" sizes={CARD_SIZES} inactive />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="mt-10 border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="text-body-lg text-text">No projects from {year} yet.</p>
          <p className="mt-2 text-sm text-muted">
            Try another cycle, or browse everything we have built.
          </p>
          <ChipButton className="mt-6" onClick={() => onSelect?.(null)}>
            Show all projects
          </ChipButton>
        </div>
      )}
    </div>
  );
}
