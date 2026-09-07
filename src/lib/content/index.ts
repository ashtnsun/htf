import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { extractHeadings } from "@/lib/mdx";
import { aboutPage as aboutData } from "@content/about";
import { awards as awardsData } from "@content/awards";
import { exec as execData } from "@content/exec";
import { faq as faqData } from "@content/faq";
import { instagramPosts as instagramData } from "@content/instagram";
import { isMediaKey } from "@content/media";
import { nonprofitsPage as nonprofitsData } from "@content/nonprofits";
import { process as processData } from "@content/process";
import { recruitmentTimeline as recruitmentData } from "@content/recruitment";
import { services as servicesData } from "@content/services";
import { roles as rolesData } from "@content/roles";
import { stats as statsData } from "@content/stats";
import { studentsPage as studentsData } from "@content/students";
import { testimonials as testimonialsData } from "@content/testimonials";
import {
  aboutPageSchema,
  awardSchema,
  execMemberSchema,
  faqItemSchema,
  instagramPostSchema,
  nonprofitsPageSchema,
  privacyFrontmatterSchema,
  processStepSchema,
  projectFrontmatterSchema,
  recruitmentStepSchema,
  roleSchema,
  serviceSchema,
  statSchema,
  studentsPageSchema,
  testimonialSchema,
  type AboutPage,
  type Award,
  type ExecMember,
  type FaqAudience,
  type FaqItem,
  type InstagramPost,
  type NonprofitsPage,
  type PrivacyFrontmatter,
  type ProcessStep,
  type ProjectFrontmatter,
  type RecruitmentStep,
  type Role,
  type Service,
  type Stat,
  type StudentsPage,
  type Testimonial,
} from "./schemas";

/**
 * Typed content loaders. Every loader validates with Zod and throws a readable error,
 * so an invalid content file fails `pnpm build` (and `pnpm validate:content`).
 */

const CONTENT_DIR = path.join(process.cwd(), "content");
const PROJECTS_DIR = path.join(CONTENT_DIR, "projects");

/**
 * Unpublished projects, stats and testimonials are hidden in production builds but visible
 * in `next dev`, so a section can be designed and reviewed before real content lands.
 */
const IS_PRODUCTION = process.env.NODE_ENV === "production";

class ContentError extends Error {
  constructor(file: string, detail: string) {
    super(`Invalid content in ${file}:\n${detail}`);
    this.name = "ContentError";
  }
}

function parseAll<S extends z.ZodType>(schema: S, data: unknown, file: string): z.output<S>[] {
  const result = z.array(schema).safeParse(data);
  if (!result.success) throw new ContentError(file, z.prettifyError(result.error));
  return result.data as z.output<S>[];
}

function assertUnique<T>(items: T[], key: (item: T) => string, file: string) {
  const seen = new Set<string>();
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) throw new ContentError(file, `duplicate id/slug "${k}"`);
    seen.add(k);
  }
}

function assertMediaRef(ref: string | undefined, file: string) {
  if (!ref) return;
  if (isMediaKey(ref)) return;
  if (ref.startsWith("/")) {
    const abs = path.join(process.cwd(), "public", ref);
    if (!fs.existsSync(abs))
      throw new ContentError(file, `media path "${ref}" not found in public/`);
    return;
  }
  throw new ContentError(file, `unknown media key "${ref}" (add it to content/media.ts)`);
}

// ---------------------------------------------------------------- projects

/** A gallery image with its alt text resolved (frontmatter may omit it). */
export type ProjectImage = { src: string; alt: string; caption?: string };

export type Project = Omit<ProjectFrontmatter, "gallery"> & {
  /** MDX body without the frontmatter; rendered by <MdxBody> on the detail page. */
  body: string;
  gallery: ProjectImage[];
};

let projectsCache: Project[] | null = null;

export function getAllProjects(): Project[] {
  if (projectsCache) return projectsCache;
  const files = fs.existsSync(PROJECTS_DIR)
    ? fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith(".mdx"))
    : [];
  const projects = files.map((file) => {
    const rel = `content/projects/${file}`;
    const raw = fs.readFileSync(path.join(PROJECTS_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const parsed = projectFrontmatterSchema.safeParse(data);
    if (!parsed.success) throw new ContentError(rel, z.prettifyError(parsed.error));
    const fm = parsed.data;
    if (`${fm.slug}.mdx` !== file) {
      throw new ContentError(rel, `slug "${fm.slug}" must match the file name`);
    }
    assertMediaRef(fm.cover, rel);
    fm.gallery.forEach((g) => assertMediaRef(g.src, rel));
    fm.team.forEach((t) => assertMediaRef(t.avatar, rel));
    return {
      ...fm,
      body: content.trim(),
      gallery: fm.gallery.map((g, i) => ({
        ...g,
        alt: g.alt ?? `${fm.title}, screenshot ${i + 1} of ${fm.gallery.length}`,
      })),
    } satisfies Project;
  });
  assertUnique(projects, (p) => p.slug, "content/projects");
  projects.sort((a, b) => b.year.localeCompare(a.year) || a.title.localeCompare(b.title));
  projectsCache = projects;
  return projects;
}

/** Other projects for the "More projects" rail: same cycle first, then the rest, newest first. */
export function getRelatedProjects(slug: string, limit = 3): Project[] {
  const current = getProject(slug);
  const others = getProjects().filter((p) => p.slug !== slug);
  if (!current) return others.slice(0, limit);
  const sameYear = others.filter((p) => p.year === current.year);
  const rest = others.filter((p) => p.year !== current.year);
  return [...sameYear, ...rest].slice(0, limit);
}

/** Projects visible on the site. Unpublished ones show in development only. */
export function getProjects(): Project[] {
  const all = getAllProjects();
  return IS_PRODUCTION ? all.filter((p) => p.published) : all;
}

export function getFeaturedProjects(limit = 4): Project[] {
  return getProjects()
    .filter((p) => p.featured)
    .slice(0, limit);
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

export function getProjectYears(): string[] {
  return [...new Set(getProjects().map((p) => p.year))];
}

/** A place on the partner globe: every visible project that shares a `location` string. */
export type PartnerLocation = {
  id: string;
  location: string;
  /** [latitude, longitude]; missing when no project at this location has `geo` yet. */
  geo?: [number, number];
  projects: Pick<Project, "slug" | "title" | "nonprofit" | "year">[];
};

/** Visible projects grouped by location, in first-appearance order (newest cycle first). */
export function getPartnerLocations(): PartnerLocation[] {
  const byLocation = new Map<string, PartnerLocation>();
  getProjects().forEach((p, i) => {
    let entry = byLocation.get(p.location);
    if (!entry) {
      entry = { id: `loc-${i}`, location: p.location, projects: [] };
      byLocation.set(p.location, entry);
    }
    if (!entry.geo && p.geo) entry.geo = p.geo;
    entry.projects.push({ slug: p.slug, title: p.title, nonprofit: p.nonprofit, year: p.year });
  });
  return [...byLocation.values()];
}

// ---------------------------------------------------------------- privacy policy

export type PrivacyPolicy = PrivacyFrontmatter & {
  /** MDX body without the frontmatter; rendered by <MdxBody> on /privacy. */
  body: string;
};

let privacyCache: PrivacyPolicy | null = null;

export function getPrivacyPolicy(): PrivacyPolicy {
  if (privacyCache) return privacyCache;
  const rel = "content/privacy.mdx";
  const raw = fs.readFileSync(path.join(CONTENT_DIR, "privacy.mdx"), "utf8");
  const { data, content } = matter(raw);
  const parsed = privacyFrontmatterSchema.safeParse(data);
  if (!parsed.success) throw new ContentError(rel, z.prettifyError(parsed.error));
  const body = content.trim();
  if (extractHeadings(body).length === 0) {
    throw new ContentError(rel, "the policy needs at least one `##` section heading");
  }
  privacyCache = { ...parsed.data, body };
  return privacyCache;
}

// ---------------------------------------------------------------- simple lists

export function getExec(): ExecMember[] {
  const items = parseAll(execMemberSchema, execData, "content/exec.ts");
  assertUnique(items, (e) => e.slug, "content/exec.ts");
  items.forEach((e) => assertMediaRef(e.photo, "content/exec.ts"));
  return items;
}

export function getRoles(): Role[] {
  const items = parseAll(roleSchema, rolesData, "content/roles.ts");
  assertUnique(items, (r) => r.slug, "content/roles.ts");
  return items;
}

export function getFaq(audience?: FaqAudience): FaqItem[] {
  const items = parseAll(faqItemSchema, faqData, "content/faq.ts");
  assertUnique(items, (f) => f.id, "content/faq.ts");
  return audience ? items.filter((f) => f.audience === audience) : items;
}

/** Published testimonials (plus unpublished ones in development, see IS_PRODUCTION). */
export function getTestimonials({ publishedOnly = IS_PRODUCTION } = {}): Testimonial[] {
  const items = parseAll(testimonialSchema, testimonialsData, "content/testimonials.ts");
  assertUnique(items, (t) => t.id, "content/testimonials.ts");
  items.forEach((t) => assertMediaRef(t.avatar, "content/testimonials.ts"));
  return publishedOnly ? items.filter((t) => t.published) : items;
}

/** Published stats (plus unpublished ones in development, see IS_PRODUCTION). */
export function getStats({ publishedOnly = IS_PRODUCTION } = {}): Stat[] {
  const items = parseAll(statSchema, statsData, "content/stats.ts");
  assertUnique(items, (s) => s.id, "content/stats.ts");
  return publishedOnly ? items.filter((s) => s.published) : items;
}

export function getServices(): Service[] {
  const items = parseAll(serviceSchema, servicesData, "content/services.ts");
  assertUnique(items, (s) => s.id, "content/services.ts");
  return items;
}

export function getProcess(): ProcessStep[] {
  const items = parseAll(processStepSchema, processData, "content/process.ts");
  assertUnique(items, (s) => s.id, "content/process.ts");
  return items;
}

/** Published awards (plus unpublished ones in development, see IS_PRODUCTION). */
export function getAwards({ publishedOnly = IS_PRODUCTION } = {}): Award[] {
  const items = parseAll(awardSchema, awardsData, "content/awards.ts");
  assertUnique(items, (a) => a.id, "content/awards.ts");
  items.forEach((a) => a.photos.forEach((p) => assertMediaRef(p.src, "content/awards.ts")));
  return publishedOnly ? items.filter((a) => a.published) : items;
}

export function getStudentsPage(): StudentsPage {
  const file = "content/students.ts";
  const result = studentsPageSchema.safeParse(studentsData);
  if (!result.success) throw new ContentError(file, z.prettifyError(result.error));
  const page = result.data;
  assertUnique(page.teamStructure, (s) => s.id, file);
  assertUnique(page.howWeWork, (s) => s.id, file);
  assertUnique(page.perks, (p) => p.id, file);
  return page;
}

export function getAboutPage(): AboutPage {
  const file = "content/about.ts";
  const result = aboutPageSchema.safeParse(aboutData);
  if (!result.success) throw new ContentError(file, z.prettifyError(result.error));
  assertUnique(result.data.facts, (f) => f.id, file);
  return result.data;
}

export function getNonprofitsPage(): NonprofitsPage {
  const file = "content/nonprofits.ts";
  const result = nonprofitsPageSchema.safeParse(nonprofitsData);
  if (!result.success) throw new ContentError(file, z.prettifyError(result.error));
  assertUnique([...result.data.scope.build, ...result.data.scope.avoid], (i) => i.id, file);
  return result.data;
}

export function getInstagramPosts(): InstagramPost[] {
  const items = parseAll(instagramPostSchema, instagramData, "content/instagram.ts");
  assertUnique(items, (p) => p.id, "content/instagram.ts");
  items.forEach((p) => assertMediaRef(p.image, "content/instagram.ts"));
  return items;
}

export function getRecruitmentTimeline(): RecruitmentStep[] {
  const items = parseAll(recruitmentStepSchema, recruitmentData, "content/recruitment.ts");
  assertUnique(items, (s) => s.id, "content/recruitment.ts");
  return items;
}

/** Runs every loader once. Used by scripts/validate-content.ts and the build. */
export function validateAllContent(): { counts: Record<string, number> } {
  return {
    counts: {
      projects: getAllProjects().length,
      exec: getExec().length,
      roles: getRoles().length,
      faq: getFaq().length,
      testimonials: getTestimonials({ publishedOnly: false }).length,
      stats: getStats({ publishedOnly: false }).length,
      services: getServices().length,
      process: getProcess().length,
      awards: getAwards({ publishedOnly: false }).length,
      recruitmentTimeline: getRecruitmentTimeline().length,
      studentsPage: Object.values(getStudentsPage()).reduce((n, list) => n + list.length, 0),
      aboutFacts: getAboutPage().facts.length,
      nonprofitsScope: (({ scope }) => scope.build.length + scope.avoid.length)(
        getNonprofitsPage(),
      ),
      instagramPosts: getInstagramPosts().length,
      partnerLocations: getPartnerLocations().length,
      privacySections: extractHeadings(getPrivacyPolicy().body).length,
    },
  };
}
