import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactCta } from "@/components/layout/ContactCta";
import { PageHero } from "@/components/layout/PageHero";
import { toProjectCardData } from "@/components/projects/ProjectCard";
import { ProjectsExplorer, ProjectsExplorerView } from "@/components/projects/ProjectsExplorer";
import { Section } from "@/components/ui/Section";
import { getProjects, getProjectYears } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Software built by Hack the Future students for nonprofit partners, one team and one organization at a time.",
  alternates: { canonical: "/projects" },
};

/**
 * Projects index: hero, year filter chips and the card grid. The grid is a client component
 * (the filter lives in `?year=`), wrapped in Suspense with the unfiltered grid as the static
 * fallback so the HTML always lists every project. Unpublished projects appear in dev only.
 */
export default function ProjectsPage() {
  const projects = getProjects();
  const cards = projects.map(toProjectCardData);
  const years = getProjectYears();
  const hasDrafts = projects.some((p) => !p.published);

  return (
    <>
      <PageHero
        eyebrow="Projects"
        lines={["Software we built", "*with nonprofits.*"]}
        blurb="[TODO: intro copy] Every project is a real tool for a real organization, built by a student team over the school year."
      />

      <Section id="all-projects" aria-label="All projects" className="border-t border-line">
        {hasDrafts ? (
          <p className="mb-8 inline-block rounded-sm border border-dashed border-line-strong px-3 py-2 text-xs text-muted">
            Preview: draft projects are shown in development only
          </p>
        ) : null}
        <Suspense fallback={<ProjectsExplorerView projects={cards} years={years} year={null} />}>
          <ProjectsExplorer projects={cards} years={years} />
        </Suspense>
      </Section>

      <ContactCta
        eyebrow="Work with us"
        lines={["Have a problem", "*worth solving?*"]}
        copy="Nonprofits bring us real problems; student teams build the software over a school year. Both start here."
        secondary={{ label: "For non-profits", href: "/nonprofits" }}
      />
    </>
  );
}
