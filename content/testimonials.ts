import type { TestimonialInput } from "@/lib/content/schemas";

/**
 * Quotes for the testimonial band (a rotating, full-width marquee). Cards are sized by quote
 * length, so the placeholders vary in length on purpose. `headline` is the short green line
 * above the quote. Everything stays `published: false` until a real, approved quote replaces it,
 * and unpublished quotes only render in development. The two nonprofit placeholders came out in
 * the 2026-09-10 copy pass (no TODO text on /nonprofits); add real partner quotes here and the
 * band returns.
 */
export const testimonials: TestimonialInput[] = [
  {
    id: "placeholder-student-1",
    headline: "[TODO: headline]",
    quote: "[TODO: a short student quote.]",
    name: "[TODO: name]",
    title: "[TODO: role, year]",
    avatar: "avatar.placeholder",
    kind: "student",
    published: false,
  },
  {
    id: "placeholder-student-2",
    headline: "[TODO: headline]",
    quote:
      "[TODO: a longer student quote about the team, the client work and what they learned over the year.]",
    name: "[TODO: name]",
    title: "[TODO: role, year]",
    avatar: "avatar.placeholder",
    kind: "student",
    published: false,
  },
];
