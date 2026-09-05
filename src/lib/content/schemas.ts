import { z } from "zod";

/** kebab-case identifier used for slugs and ids. */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be kebab-case (a-z, 0-9, dashes)");

/** A media reference: either a key from content/media.ts or a /public path. */
export const mediaRefSchema = z.string().min(1);

export const teamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  linkedin: z.url().optional(),
  avatar: mediaRefSchema.optional(),
});

export const projectTagSchema = z.enum(["web", "mobile", "data", "design", "automation"]);

/** Frontmatter of content/projects/*.mdx */
export const projectFrontmatterSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  nonprofit: z.string().min(1),
  /** Academic cycle, e.g. "2025–26". */
  year: z.string().regex(/^\d{4}(?:–\d{2})?$/, 'use "2025" or "2025–26" (en dash)'),
  location: z.string().min(1),
  tags: z.array(projectTagSchema).min(1),
  summary: z.string().min(10).max(240),
  cover: mediaRefSchema,
  liveUrl: z.url().optional(),
  gallery: z.array(mediaRefSchema).default([]),
  team: z.array(teamMemberSchema).default([]),
  featured: z.boolean().default(false),
  /** Unpublished projects are hidden in production builds but visible in dev. */
  published: z.boolean().default(true),
});

export const execMemberSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  role: z.string().min(1),
  linkedin: z.url().optional(),
  photo: mediaRefSchema.optional(),
});

export const roleSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  /** One-line subtitle, e.g. "Front-end, back-end, full-stack". */
  blurb: z.string().min(1),
  description: z.string().min(1),
  responsibilities: z.array(z.string().min(1)).min(1),
  timeCommitment: z.string().min(1),
  whoItsFor: z.string().min(1),
  icon: z.enum(["code", "design", "lead"]),
  open: z.boolean().default(true),
});

export const faqAudienceSchema = z.enum(["home", "students", "nonprofits"]);

/** Optional "read more" link under an answer, e.g. to the deeper Students / Non-profits FAQ. */
export const faqLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

export const faqItemSchema = z.object({
  id: slugSchema,
  question: z.string().min(1),
  answer: z.string().min(1),
  audience: faqAudienceSchema,
  link: faqLinkSchema.optional(),
});

export const testimonialSchema = z.object({
  id: slugSchema,
  quote: z.string().min(1),
  name: z.string().min(1),
  /** Role and organization, e.g. "Executive Director, Example Nonprofit". */
  title: z.string().min(1),
  avatar: mediaRefSchema.optional(),
  kind: z.enum(["student", "nonprofit"]),
  /** Hidden until a real quote is approved. */
  published: z.boolean().default(false),
});

export const statSchema = z.object({
  id: slugSchema,
  value: z.string().min(1),
  label: z.string().min(1),
  /** Hidden until the number is confirmed. */
  published: z.boolean().default(false),
});

export const recruitmentStepSchema = z.object({
  id: slugSchema,
  title: z.string().min(1),
  /** Human label shown on the timeline, e.g. "Sept 8–11". */
  when: z.string().min(1),
  /** Optional ISO date used for ordering and "current step" logic. */
  date: z.iso.date().optional(),
  description: z.string().min(1),
});

/** Icon names are resolved to lucide icons in the components, so content never imports React. */
export const roleIconSchema = z.enum(["code", "design", "lead"]);

/** One kind of seat on a project team ("5 developers"). */
export const teamSeatSchema = z.object({
  id: slugSchema,
  label: z.string().min(1),
  /** Number of seats drawn in the team diagram. */
  count: z.number().int().min(1).max(12),
  /** For a range ("1–2 designers"): seats above this number are drawn as optional. */
  minCount: z.number().int().min(0).optional(),
  /** Display override when the count is a range, e.g. "1–2". */
  countLabel: z.string().min(1).optional(),
  icon: roleIconSchema,
});

export const howWeWorkStepSchema = z.object({
  id: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
});

export const perkSchema = z.object({
  id: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.enum(["projects", "skills", "community", "leadership"]),
});

/** Copy blocks for the Students page that are not roles, timeline or FAQ. */
export const studentsPageSchema = z.object({
  teamStructure: z.array(teamSeatSchema).min(1),
  howWeWork: z.array(howWeWorkStepSchema).min(1),
  perks: z.array(perkSchema).min(1),
});

export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type ProjectTag = z.infer<typeof projectTagSchema>;
export type ExecMember = z.infer<typeof execMemberSchema>;
export type ExecMemberInput = z.input<typeof execMemberSchema>;
export type Role = z.infer<typeof roleSchema>;
export type RoleInput = z.input<typeof roleSchema>;
export type FaqAudience = z.infer<typeof faqAudienceSchema>;
export type FaqItem = z.infer<typeof faqItemSchema>;
export type FaqItemInput = z.input<typeof faqItemSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type TestimonialInput = z.input<typeof testimonialSchema>;
export type Stat = z.infer<typeof statSchema>;
export type StatInput = z.input<typeof statSchema>;
export type RecruitmentStep = z.infer<typeof recruitmentStepSchema>;
export type RecruitmentStepInput = z.input<typeof recruitmentStepSchema>;
export type RoleIcon = z.infer<typeof roleIconSchema>;
export type TeamSeat = z.infer<typeof teamSeatSchema>;
export type HowWeWorkStep = z.infer<typeof howWeWorkStepSchema>;
export type Perk = z.infer<typeof perkSchema>;
export type StudentsPage = z.infer<typeof studentsPageSchema>;
export type StudentsPageInput = z.input<typeof studentsPageSchema>;
