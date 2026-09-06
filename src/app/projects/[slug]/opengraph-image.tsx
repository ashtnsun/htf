import { notFound } from "next/navigation";
import { getProject, getProjects } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = "A Hack the Future project for a nonprofit partner.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Prerender one PNG per project (same list as the page). */
export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return ogImage({
    eyebrow: project.nonprofit,
    lines: [project.title],
    footer: `${project.year} · ${project.location}`,
    size: "md",
  });
}
