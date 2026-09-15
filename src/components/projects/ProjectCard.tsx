import { ArrowRight } from "lucide-react";
import type { ProjectFrontmatter, ProjectTag } from "@/lib/content/schemas";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Media } from "@/components/ui/Media";
import { cn } from "@/lib/utils";

export type ProjectCardData = Pick<
  ProjectFrontmatter,
  | "slug"
  | "title"
  | "nonprofit"
  | "nonprofitShort"
  | "nonprofitLines"
  | "year"
  | "location"
  | "tags"
  | "cover"
> & {
  /** Unpublished projects only render in development; the card marks them as drafts. */
  published?: boolean;
};

type ProjectCardProps = {
  project: ProjectCardData;
  /** "featured" uses the oversized 4:5 cover on md+ (home grid); "default" is the 4:3 index card. */
  size?: "featured" | "default";
  /** Heading level of the title, so the card fits the page's outline (h2 on the index). */
  headingLevel?: "h2" | "h3";
  /** next/image `sizes` hint for the cover. */
  sizes?: string;
  /**
   * Temporary "work in progress" state for /projects: the card is not a link, the nonprofit
   * name is the title (no separate nonprofit label) and the arrow cell is greyed out.
   */
  inactive?: boolean;
  className?: string;
};

export const TAG_LABEL: Record<ProjectTag, string> = {
  web: "Web",
  mobile: "Mobile",
  data: "Data",
  design: "Design",
  automation: "Automation",
};

/** Serialisable subset of a project for cards (keeps MDX bodies out of client payloads). */
export function toProjectCardData(project: ProjectCardData): ProjectCardData {
  const { slug, title, nonprofit, nonprofitShort, nonprofitLines, year, location, tags, cover } =
    project;
  const { published } = project;
  return {
    slug,
    title,
    nonprofit,
    nonprofitShort,
    nonprofitLines,
    year,
    location,
    tags,
    cover,
    published,
  };
}

/**
 * Portfolio card: full-bleed cover fading into a caption with the nonprofit label and the
 * year on one line, a big title with a right-arrow cell (white arrow at rest), the location
 * and a row of tag chips. Hover is its own treatment (no corner brackets): the border turns
 * green, the cover brightens from its resting dim, the title turns green and the arrow cell
 * fills green while its glyph nudges right like every SplitButton's (2026-09-09 review); the
 * card itself stays put. The whole card is one link.
 */
export function ProjectCard({
  project,
  size = "default",
  headingLevel: Heading = "h3",
  sizes = "(min-width: 768px) 50vw, 100vw",
  inactive = false,
  className,
}: ProjectCardProps) {
  const nonprofitName = project.nonprofitShort ?? project.nonprofit;
  return (
    <Card
      href={inactive ? undefined : `/projects/${project.slug}`}
      padding="none"
      interactive={false}
      // Five rows (cover, year, title, location, tags) on a subgrid, so in a grid whose items
      // span five rows on a subgrid (ProjectsExplorer) every card's title, location and tags
      // start on the same line whatever the title's length. Outside such a grid the subgrid
      // falls back to plain stacked rows.
      className={cn(
        "group row-span-5 grid grid-rows-subgrid gap-0",
        inactive ? "h-full" : "hover:border-green",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-surface-2",
          size === "featured" ? "aspect-[4/3] md:aspect-[4/5]" : "aspect-[4/3]",
        )}
      >
        <Media
          src={project.cover}
          alt=""
          fill
          sizes={sizes}
          className={cn(
            "object-cover brightness-90",
            !inactive && "transition-[filter] duration-300 group-hover:brightness-100",
          )}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-surface to-transparent"
        />
        {project.published === false ? (
          <span className="absolute top-3 left-3 border border-dashed border-line-strong glass px-2 py-1 text-eyebrow font-medium text-muted uppercase [--glass-alpha:80%]">
            Draft
          </span>
        ) : null}
      </div>
      <p className="flex items-baseline justify-between gap-4 px-6 pt-6 text-eyebrow font-medium text-muted uppercase md:px-7 md:pt-7">
        {inactive ? null : <span className="truncate">{nonprofitName}</span>}
        <span className="shrink-0">{project.year}</span>
      </p>
      <div className="mt-4 flex items-start justify-between gap-6 px-6 md:px-7">
        <Heading
          className={cn(
            "text-h3 font-medium text-text",
            !inactive && "transition-colors duration-300 group-hover:text-green",
          )}
        >
          {!inactive
            ? project.title
            : project.nonprofitLines && !project.nonprofitShort
              ? project.nonprofitLines.map((line) => (
                  // the trailing space keeps the words apart in the heading's text
                  <span key={line} className="block">
                    {line}{" "}
                  </span>
                ))
              : nonprofitName}
        </Heading>
        <span
          aria-hidden="true"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center self-end border",
            inactive
              ? "border-line bg-surface text-muted opacity-50"
              : "border-line-strong bg-surface-2 text-text transition-colors duration-200 group-hover:border-green group-hover:bg-green group-hover:text-bg",
          )}
        >
          <ArrowRight
            className={cn(
              "size-5",
              !inactive &&
                "transition-transform duration-300 ease-out-expo group-hover:translate-x-1",
            )}
          />
        </span>
      </div>
      <p className="mt-3 px-6 text-sm text-muted md:px-7">{project.location}</p>
      <ul
        aria-label="Tags"
        className="mt-4 flex flex-wrap content-start gap-2 px-6 pb-6 md:px-7 md:pb-7"
      >
        {project.tags.map((tag) => (
          <li key={tag}>
            <Chip>{TAG_LABEL[tag]}</Chip>
          </li>
        ))}
      </ul>
    </Card>
  );
}
