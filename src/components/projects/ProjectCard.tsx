import { ArrowUpRight } from "lucide-react";
import type { ProjectFrontmatter, ProjectTag } from "@/lib/content/schemas";
import { Card } from "@/components/ui/Card";
import { Media } from "@/components/ui/Media";
import { cn } from "@/lib/utils";

export type ProjectCardData = Pick<
  ProjectFrontmatter,
  "slug" | "title" | "nonprofit" | "year" | "location" | "tags" | "cover"
>;

type ProjectCardProps = {
  project: ProjectCardData;
  /** "featured" uses the oversized 4:5 cover on md+ (home grid); "default" is the 4:3 index card. */
  size?: "featured" | "default";
  /** next/image `sizes` hint for the cover. */
  sizes?: string;
  className?: string;
};

const TAG_LABEL: Record<ProjectTag, string> = {
  web: "Web",
  mobile: "Mobile",
  data: "Data",
  design: "Design",
  automation: "Automation",
};

/**
 * Portfolio card after the Framer treatment: full-bleed cover fading into a caption with the
 * nonprofit label, a rule, the year, then a big title. Hover scales the cover, turns the title
 * green and fills the arrow cell. The whole card is one link.
 */
export function ProjectCard({
  project,
  size = "default",
  sizes = "(min-width: 768px) 50vw, 100vw",
  className,
}: ProjectCardProps) {
  return (
    <Card
      href={`/projects/${project.slug}`}
      padding="none"
      className={cn("group flex flex-col", className)}
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
          className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-surface to-transparent"
        />
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <p className="flex items-center gap-4 text-eyebrow font-medium text-muted uppercase">
          <span className="truncate">{project.nonprofit}</span>
          <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-line-strong" />
          <span className="shrink-0">{project.year}</span>
        </p>
        <div className="mt-4 flex items-end justify-between gap-6">
          <h3 className="text-h3 font-medium text-text transition-colors duration-300 group-hover:text-green">
            {project.title}
          </h3>
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-line-strong bg-surface-2 text-text transition-colors duration-300 group-hover:border-green group-hover:bg-green group-hover:text-bg"
          >
            <ArrowUpRight className="size-5" />
          </span>
        </div>
        <p className="mt-3 text-sm text-muted">
          {project.location} · {project.tags.map((t) => TAG_LABEL[t]).join(", ")}
        </p>
      </div>
    </Card>
  );
}
