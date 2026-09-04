import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { getProject, getProjects } from "@/lib/content";

/** Unknown slugs 404 instead of rendering on demand. */
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} · ${project.nonprofit}`,
    description: project.summary,
  };
}

/** Project detail stub. Session 3 renders the MDX body, gallery lightbox and "more projects" rail. */
export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <>
      <PageHero
        eyebrow={project.nonprofit}
        lines={[project.title]}
        blurb={project.summary}
        stagger={false}
      >
        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-muted">Year</dt>
            <dd className="text-text">{project.year}</dd>
          </div>
          <div>
            <dt className="text-muted">Location</dt>
            <dd className="text-text">{project.location}</dd>
          </div>
          <div>
            <dt className="text-muted">Tags</dt>
            <dd className="text-text">{project.tags.join(", ")}</dd>
          </div>
        </dl>
      </PageHero>

      <Section aria-label="Project overview" padding="md">
        <div className="relative aspect-[16/9] overflow-hidden rounded-md border border-line bg-surface">
          <Media src={project.cover} alt="" fill sizes="100vw" className="object-cover" priority />
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div className="max-w-prose text-muted">
            <p>
              [Session 3] The Overview, What we built and Final result sections render from the MDX
              body here.
            </p>
            {project.liveUrl ? (
              <div className="mt-6">
                <SplitButton href={project.liveUrl}>Visit the live site</SplitButton>
              </div>
            ) : null}
          </div>
          <aside aria-labelledby="team-title">
            <h2 id="team-title" className="text-eyebrow font-medium text-muted uppercase">
              Team
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {project.team.map((member, i) => (
                <li key={i} className="flex justify-between gap-4 border-b border-line py-2">
                  <span className="text-text">{member.name}</span>
                  <span className="text-muted">{member.role}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Section>
    </>
  );
}
