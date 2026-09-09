import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactCta } from "@/components/layout/ContactCta";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Gallery } from "@/components/projects/Gallery";
import { TAG_LABEL } from "@/components/projects/ProjectCard";
import { TeamGrid } from "@/components/projects/TeamGrid";
import { Chip } from "@/components/ui/Chip";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { MdxBody } from "@/components/ui/MdxBody";
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
 * Project detail, kept plain since the 2026-09-09 review: a title block on the page
 * background (back link, nonprofit, title, summary, the facts and the live link; no banner
 * glow or grid) → cover → the MDX write-up with the team and the stack in a sticky column on
 * the right (no jump links) → screenshot gallery with lightbox → closing CTA. No "More
 * projects" rail. Sections without content are skipped.
 */
export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <>
      <Section aria-labelledby="page-title" padding="none" className="pt-10 md:pt-14">
        <RevealGroup mode="mount">
          <Reveal>
            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-text"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              All projects
            </Link>
          </Reveal>
          {!project.published ? (
            <Reveal className="mt-6">
              <p className="inline-block border border-dashed border-line-strong px-3 py-2 text-xs text-muted">
                Preview: draft project, shown in development only
              </p>
            </Reveal>
          ) : null}
          <Reveal className="mt-8">
            <Eyebrow>{project.nonprofit}</Eyebrow>
          </Reveal>
          <Reveal className="mt-6">
            <Headline
              as="h1"
              id="page-title"
              size="display"
              lines={[project.title]}
              className="max-w-4xl text-h2 md:text-display"
            />
          </Reveal>
          <Reveal className="mt-6">
            <p className="max-w-2xl text-body-lg text-muted">{project.summary}</p>
          </Reveal>
          <Reveal className="mt-10">
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
          </Reveal>
        </RevealGroup>
      </Section>

      <Section aria-label="Project cover" padding="none" className="mt-12 md:mt-16">
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
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-20">
          <article className="max-w-3xl">
            <MdxBody source={project.body} />
          </article>
          <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
            {project.team.length > 0 ? (
              <div>
                <p className={factLabel}>Team</p>
                <TeamGrid members={project.team} variant="list" className="mt-4" />
              </div>
            ) : null}
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

      <ContactCta
        eyebrow="Work with us"
        lines={["Have a problem", "*worth solving?*"]}
        copy="Nonprofits bring us real problems; student teams build the software over a school year. Both start here."
        secondary={{ label: "For nonprofits", href: "/nonprofits" }}
      />
    </>
  );
}
