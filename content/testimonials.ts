import type { TestimonialInput } from "@/lib/content/schemas";

/**
 * Quotes for the testimonial band (a rotating, full-width marquee). Cards are sized by quote
 * length (90+ characters get the wide card). `headline` is the short green line above the
 * quote. Everything stays `published: false` until a real, approved quote replaces it, and
 * unpublished quotes only render in development. The cards below are blank on purpose
 * (2026-09-15): only the avatar shows until Ashton has the real quotes; fill in `headline`,
 * `quote`, `name` and `title`. The two nonprofit placeholders came out in the 2026-09-10 copy
 * pass (no TODO text on /nonprofits); add real partner quotes here and the band returns.
 */
export const testimonials: TestimonialInput[] = [
  {
    id: "placeholder-student-1",
    quote: "",
    name: "",
    title: "",
    avatar: "avatar.placeholder",
    kind: "student",
    published: false,
  },
  {
    id: "placeholder-student-2",
    quote: "",
    name: "",
    title: "",
    avatar: "avatar.placeholder",
    kind: "student",
    published: false,
  },
];
