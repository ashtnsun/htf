import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactCta } from "@/components/layout/ContactCta";
import { OnThisPage } from "@/components/layout/OnThisPage";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { Gallery } from "@/components/projects/Gallery";
import { MoreProjects } from "@/components/projects/MoreProjects";
import { TAG_LABEL, toProjectCardData } from "@/components/projects/ProjectCard";
import { TeamGrid } from "@/components/projects/TeamGrid";
import { Chip } from "@/components/ui/Chip";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { MdxBody } from "@/components/ui/MdxBody";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { getProject, getProjects, getRelatedProjects } from "@/lib/content";
import { extractHeadings } from "@/lib/mdx";

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
  const title = `${project.title} · ${project.nonprofit}`;
  return {
    title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { title, description: project.summary },
  };
}

const factLabel = "text-eyebrow font-medium text-muted uppercase";

/**
 * Project detail: hero (nonprofit, title, summary, facts, live link) → cover → MDX write-up
 * with a sticky "On this page" / "Built with" aside → screenshot gallery with lightbox →
 * team grid → related projects → closing CTA. Sections without content are skipped.
 */
export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const headings = extractHeadings(project.body);
  const related = getRelatedProjects(project.slug, 3).map(toProjectCardData);
  const onThisPage = [
    ...headings.map((h) => ({ href: `#${h.id}`, label: h.text })),
    ...(project.gallery.length > 0 ? [{ href: "#project-gallery", label: "Gallery" }] : []),
    ...(project.team.length > 0 ? [{ href: "#project-team", label: "Team" }] : []),
  ];

  return (
    <>
      <PageHero
        back={{ href: "/projects", label: "All projects" }}
        eyebrow={project.nonprofit}
        lines={[project.title]}
        blurb={project.summary}
        stagger={false}
      >
        {!project.published ? (
          <p className="mb-8 inline-block border border-dashed border-line-strong px-3 py-2 text-xs text-muted">
            Preview: draft project, shown in development only
          </p>
        ) : null}
        <dl className="flex flex-wrap gap-x-12 gap-y-6">
          <div>
            <dt className={factLabel}>Year</dt>
            <dd className="mt-2 text-text">{project.year}</dd>
          </div>
          <div>
            <dt className={factLabel}>Location</dt>
            <dd className="mt-2 text-text">{project.location}</dd>
          </div>
          <div>
            <dt className={factLabel}>Type</dt>
            <dd className="mt-2 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <Chip key={tag}>{TAG_LABEL[tag]}</Chip>
              ))}
            </dd>
          </div>
        </dl>
        {project.liveUrl ? (
          <SplitButton href={project.liveUrl} size="lg" className="mt-10">
            Visit the live site
          </SplitButton>
        ) : null}
      </PageHero>

      <Section aria-label="Project cover" padding="none">
        <div className="relative aspect-[16/9] overflow-hidden border border-line bg-surface">
          <Media
            src={project.cover}
            alt=""
            fill
            sizes="(min-width: 1440px) 1296px, 92vw"
            className="object-cover"
            priority
          />
        </div>
      </Section>

      <Section aria-label="Project write-up">
        {/* Phones: jump links in a row above the write-up. lg+: the same list in the sticky aside. */}
        <OnThisPage items={onThisPage} variant="row" className="mb-10" />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-20">
          <article className="max-w-3xl">
            <MdxBody source={project.body} />
          </article>
          <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
            <OnThisPage items={onThisPage} variant="list" />
            {project.stack.length > 0 ? (
              <div>
                <p className={factLabel}>Built with</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {project.stack.map((tech) => (
                    <li key={tech}>
                      <Chip>{tech}</Chip>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <p className={factLabel}>Partner</p>
              <p className="mt-3 text-sm text-text">{project.nonprofit}</p>
              <p className="text-sm text-muted">{project.location}</p>
            </div>
          </aside>
        </div>
      </Section>

      {project.gallery.length > 0 ? (
        <Section
          id="project-gallery"
          aria-labelledby="project-gallery-title"
          className="border-t border-line"
        >
          <Reveal standalone>
            <Eyebrow>Gallery</Eyebrow>
            <Headline
              as="h2"
              id="project-gallery-title"
              size="h2"
              lines={["A closer", "*look.*"]}
              className="mt-5"
            />
          </Reveal>
          <Gallery images={project.gallery} label={project.title} className="mt-10" />
        </Section>
      ) : null}

      {project.team.length > 0 ? (
        <Section
          id="project-team"
          aria-labelledby="project-team-title"
          className="border-t border-line"
        >
          <div className="grid gap-10 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
            <Reveal standalone>
              <Eyebrow>Team</Eyebrow>
              <Headline
                as="h2"
                id="project-team-title"
                size="h2"
                lines={["The students", "*behind it.*"]}
                className="mt-5"
              />
              <p className="mt-6 max-w-sm text-muted">
                Every project team is one project lead, developers and designers who work with the
                nonprofit for the whole school year.
              </p>
            </Reveal>
            <Reveal standalone delay={0.1}>
              <TeamGrid members={project.team} />
            </Reveal>
          </div>
        </Section>
      ) : null}

      <MoreProjects projects={related} />

      <ContactCta
        eyebrow="Work with us"
        lines={["Have a problem", "*worth solving?*"]}
        copy="Nonprofits bring us real problems; student teams build the software over a school year. Both start here."
        secondary={{ label: "For nonprofits", href: "/nonprofits" }}
      />
    </>
  );
}
