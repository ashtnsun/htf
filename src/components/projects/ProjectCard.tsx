import { ArrowRight } from "lucide-react";
import type { ProjectFrontmatter, ProjectTag } from "@/lib/content/schemas";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Media } from "@/components/ui/Media";
import { cn } from "@/lib/utils";

export type ProjectCardData = Pick<
  ProjectFrontmatter,
  "slug" | "title" | "nonprofit" | "year" | "location" | "tags" | "cover"
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
  const { slug, title, nonprofit, year, location, tags, cover, published } = project;
  return { slug, title, nonprofit, year, location, tags, cover, published };
}

/**
 * Portfolio card: full-bleed cover fading into a caption with the nonprofit label and the
 * year on one line, a big title with a right-arrow cell, the location and a row of tag
 * chips. Hover is its own treatment (no corner brackets): the border turns green, the cover
 * brightens from its resting dim, the title turns green and the arrow cell fills green;
 * nothing moves. The whole card is one link.
 */
export function ProjectCard({
  project,
  size = "default",
  headingLevel: Heading = "h3",
  sizes = "(min-width: 768px) 50vw, 100vw",
  className,
}: ProjectCardProps) {
  return (
    <Card
      href={`/projects/${project.slug}`}
      padding="none"
      interactive={false}
      className={cn("group flex flex-col hover:border-green", className)}
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
          className="object-cover brightness-90 transition-[filter] duration-300 group-hover:brightness-100"
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
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <p className="flex items-baseline justify-between gap-4 text-eyebrow font-medium text-muted uppercase">
          <span className="truncate">{project.nonprofit}</span>
          <span className="shrink-0">{project.year}</span>
        </p>
        <div className="mt-4 flex items-end justify-between gap-6">
          <Heading className="text-h3 font-medium text-text transition-colors duration-300 group-hover:text-green">
            {project.title}
          </Heading>
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center border border-line-strong bg-surface-2 text-green transition-colors duration-200 group-hover:border-green group-hover:bg-green group-hover:text-bg"
          >
            <ArrowRight className="size-5" />
          </span>
        </div>
        <p className="mt-3 text-sm text-muted">{project.location}</p>
        <ul aria-label="Tags" className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <li key={tag}>
              <Chip>{TAG_LABEL[tag]}</Chip>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
