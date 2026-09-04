import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Card } from "@/components/ui/Card";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description: "Software built by Hack the Future students for nonprofit partners.",
};

/** Projects index stub. Session 3 adds year filter chips and the full card treatment. */
export default function ProjectsPage() {
  const projects = getProjects();
  return (
    <>
      <PageHero
        eyebrow="Projects"
        lines={["Software we built", "*with nonprofits.*"]}
        blurb="[TODO: intro copy] Every project is a real tool for a real organization, built by a student team over the school year."
      />
      <Section aria-label="Project list" padding="md">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.slug}>
              <Card href={`/projects/${project.slug}`} padding="none" className="group">
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                  <Media
                    src={project.cover}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs text-muted">{project.nonprofit}</p>
                  <h2 className="mt-1 text-body-lg font-medium">{project.title}</h2>
                  <p className="mt-3 text-xs text-muted">
                    {project.year} · {project.location} · {project.tags.join(", ")}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
