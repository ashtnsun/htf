import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { ProjectCard, type ProjectCardData } from "@/components/projects/ProjectCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

/** "More projects" rail at the foot of a project page: up to three related cards + index link. */
export function MoreProjects({ projects }: { projects: ProjectCardData[] }) {
  if (projects.length === 0) return null;
  return (
    <Section
      id="more-projects"
      aria-labelledby="more-projects-title"
      className="border-t border-line"
    >
      <RevealGroup>
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>More projects</Eyebrow>
            <Headline
              as="h2"
              id="more-projects-title"
              size="h2"
              lines={["See what else", "*we’ve built.*"]}
              className="mt-5"
            />
          </div>
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-text transition-colors hover:text-green"
          >
            All projects <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.slug}>
              <Reveal className="h-full">
                <ProjectCard
                  project={project}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </RevealGroup>
    </Section>
  );
}
