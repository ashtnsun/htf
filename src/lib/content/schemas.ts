import { z } from "zod";

/** kebab-case identifier used for slugs and ids. */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be kebab-case (a-z, 0-9, dashes)");

/** A school year or cycle label: "2025" or "2025–26" (en dash). Sorts newest-first as text. */
export const cycleYearSchema = z
  .string()
  .regex(/^\d{4}(?:–\d{2})?$/, 'use "2025" or "2025–26" (en dash)');

/** A media reference: either a key from content/media.ts or a /public path. */
export const mediaRefSchema = z.string().min(1);

export const teamMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  linkedin: z.url().optional(),
  avatar: mediaRefSchema.optional(),
});

export const projectTagSchema = z.enum(["web", "mobile", "data", "design", "automation"]);

/**
 * A gallery entry: a bare media ref, or an object with alt text and an optional caption.
 * Bare refs are normalised to objects; the loader fills in a default alt.
 */
export const galleryItemSchema = z
  .union([
    mediaRefSchema,
    z.object({
      src: mediaRefSchema,
      alt: z.string().min(1).optional(),
      caption: z.string().min(1).optional(),
    }),
  ])
  .transform((item) => (typeof item === "string" ? { src: item } : item));

/** Frontmatter of content/projects/*.mdx */
export const projectFrontmatterSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  nonprofit: z.string().min(1),
  /** Academic cycle, e.g. "2025–26". */
  year: cycleYearSchema,
  location: z.string().min(1),
  tags: z.array(projectTagSchema).min(1),
  summary: z.string().min(10).max(240),
  cover: mediaRefSchema,
  liveUrl: z.url().optional(),
  /** Screenshots for the detail page gallery (lightbox). */
  gallery: z.array(galleryItemSchema).default([]),
  /** Technologies used, shown as chips ("Built with"). */
  stack: z.array(z.string().min(1)).default([]),
  team: z.array(teamMemberSchema).default([]),
  featured: z.boolean().default(false),
  /**
   * Where the nonprofit is, as [latitude, longitude] in decimal degrees, for the partner
   * globe on /nonprofits. A state or country centroid is fine until the city is known.
   */
  geo: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]).optional(),
  /** Unpublished projects are hidden in production builds but visible in dev. */
  published: z.boolean().default(true),
});

/** One exec member of one board; the About page shows a board per `year`. */
export const execMemberSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  role: z.string().min(1),
  /** The school year of the board this member sits on, e.g. "2026–27". */
  year: cycleYearSchema,
  /**
   * LinkedIn profile URL. Every card carries the link, so the field is required; a value
   * starting with "TODO" renders a placeholder cell until the real URL is known.
   */
  linkedin: z.union([z.url(), z.string().regex(/^\[?TODO/i, "a URL or a [TODO: …] note")]),
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

/** Optional "read more" link under an answer, e.g. to the deeper Students / Nonprofits FAQ. */
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
  /** Short green line above the quote, e.g. "Impressive showcase!". */
  headline: z.string().min(1).optional(),
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

/** "What we do" panel on the home page. Icon names resolve to lucide icons in the component. */
export const serviceSchema = z.object({
  id: slugSchema,
  /** Supports the Headline accent syntax: *word* renders green. */
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.enum(["heart-handshake", "layers", "rocket"]),
});

/** One step of the project process (home page scroll section). */
export const processStepSchema = z.object({
  id: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  /** The dino the step shows in the process scene (home/ProcessScene). */
  graphic: z.enum(["detective", "team", "builder", "party"]),
  /** What the nonprofit does at this step ("Your part" on /nonprofits). */
  partner: z.string().min(1).optional(),
});

export const awardPhotoSchema = z.object({
  src: mediaRefSchema,
  alt: z.string().min(1),
  caption: z.string().min(1).optional(),
});

/** An award or recognition, shown in the Impact section and later on /about. */
export const awardSchema = z.object({
  id: slugSchema,
  issuer: z.string().min(1),
  title: z.string().min(1),
  /** Display date, e.g. "April 2025". */
  date: z.string().min(1),
  photos: z.array(awardPhotoSchema).default([]),
  /** Hidden until confirmed. */
  published: z.boolean().default(false),
});

export const recruitmentStepSchema = z.object({
  id: slugSchema,
  title: z.string().min(1),
  /** Human label shown on the timeline, e.g. "Sept 8–11". */
  when: z.string().min(1),
  /** Optional ISO date used for ordering and "current step" logic. */
  date: z.iso.date().optional(),
  /** Marks the step the club is on now while the steps carry no dates (the last one flagged wins). */
  current: z.boolean().optional(),
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

/** A curated Instagram post for the grid on /about (no API: the link and image are typed in). */
export const instagramPostSchema = z.object({
  id: slugSchema,
  /** Post URL. Values starting with "TODO" render the tile without a link. */
  href: z.string().min(1),
  image: mediaRefSchema,
  alt: z.string().min(1),
  caption: z.string().min(1).optional(),
});

/** Copy blocks for the About page (exec, awards and the Instagram grid have their own files). */
export const aboutPageSchema = z.object({
  mission: z.object({
    /** Headline lines; *asterisks* mark the green words. */
    lines: z.array(z.string().min(1)).min(1),
    body: z.string().min(1),
  }),
});

/** One item of the scope lists on /nonprofits ("What we build" / "What we don't"). */
export const scopeItemSchema = z.object({
  id: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
});

/** Copy blocks for the Nonprofits page (process steps, FAQ and testimonials have their own files). */
export const nonprofitsPageSchema = z.object({
  scope: z.object({
    build: z.array(scopeItemSchema).min(1),
    avoid: z.array(scopeItemSchema).min(1),
  }),
  /** Shown beside the email invitation on /nonprofits: what happens after a nonprofit writes in. */
  nextSteps: z.array(z.string().min(1)).min(1),
});

/** Frontmatter of content/privacy.mdx. YAML turns an unquoted date into a Date; both work. */
export const privacyFrontmatterSchema = z.object({
  /** ISO date (YYYY-MM-DD) the current text took effect; shown on the page. */
  effectiveDate: z.preprocess(
    (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
    z.iso.date(),
  ),
  /** True once someone with legal knowledge has reviewed the text (hides the draft badge). */
  reviewed: z.boolean().default(false),
});

export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;
export type PrivacyFrontmatter = z.infer<typeof privacyFrontmatterSchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
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
export type Service = z.infer<typeof serviceSchema>;
export type ServiceInput = z.input<typeof serviceSchema>;
export type ProcessStep = z.infer<typeof processStepSchema>;
export type ProcessStepInput = z.input<typeof processStepSchema>;
export type AwardPhoto = z.infer<typeof awardPhotoSchema>;
export type Award = z.infer<typeof awardSchema>;
export type AwardInput = z.input<typeof awardSchema>;
export type RecruitmentStep = z.infer<typeof recruitmentStepSchema>;
export type RecruitmentStepInput = z.input<typeof recruitmentStepSchema>;
export type RoleIcon = z.infer<typeof roleIconSchema>;
export type TeamSeat = z.infer<typeof teamSeatSchema>;
export type HowWeWorkStep = z.infer<typeof howWeWorkStepSchema>;
export type Perk = z.infer<typeof perkSchema>;
export type StudentsPage = z.infer<typeof studentsPageSchema>;
export type StudentsPageInput = z.input<typeof studentsPageSchema>;
export type InstagramPost = z.infer<typeof instagramPostSchema>;
export type InstagramPostInput = z.input<typeof instagramPostSchema>;
export type AboutPage = z.infer<typeof aboutPageSchema>;
export type AboutPageInput = z.input<typeof aboutPageSchema>;
export type ScopeItem = z.infer<typeof scopeItemSchema>;
export type NonprofitsPage = z.infer<typeof nonprofitsPageSchema>;
export type NonprofitsPageInput = z.input<typeof nonprofitsPageSchema>;
