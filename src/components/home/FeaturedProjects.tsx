import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { ProjectCard, type ProjectCardData } from "@/components/projects/ProjectCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

/** Framer home block: staggered two-column grid of oversized project cards + "See all" link. */
export function FeaturedProjects({ projects }: { projects: ProjectCardData[] }) {
  if (projects.length === 0) return null;
  return (
    <Section id="featured" aria-labelledby="featured-title" padding="lg">
      <RevealGroup>
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Our projects</Eyebrow>
            <Headline
              as="h2"
              id="featured-title"
              size="h2"
              lines={["Built with *nonprofits*, shipped by students."]}
              className="mt-5 max-w-2xl md:text-display"
            />
          </div>
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-text transition-colors hover:text-green"
          >
            See all projects <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
        <ul className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
          {projects.map((project, i) => (
            <li key={project.slug} className={cn(i % 2 === 1 && "md:mt-24")}>
              <Reveal className="h-full">
                <ProjectCard project={project} size="featured" />
              </Reveal>
            </li>
          ))}
        </ul>
      </RevealGroup>
    </Section>
  );
}
