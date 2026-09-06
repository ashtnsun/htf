import type { TestimonialInput } from "@/lib/content/schemas";

/**
 * Quotes for the testimonial band (a rotating, full-width marquee). Cards are sized by quote
 * length, so the placeholders vary in length on purpose. `headline` is the short green line
 * above the quote. Everything stays `published: false` until a real, approved quote replaces it.
 */
export const testimonials: TestimonialInput[] = [
  {
    id: "placeholder-nonprofit-1",
    headline: "[TODO: headline]",
    quote:
      "[TODO: a two-sentence quote from a nonprofit partner about the problem they brought and what the team delivered.]",
    name: "[TODO: name]",
    title: "[TODO: title, organization]",
    avatar: "avatar.placeholder",
    kind: "nonprofit",
    published: false,
  },
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
    id: "placeholder-nonprofit-2",
    headline: "[TODO: headline]",
    quote: "[TODO: a one-sentence quote from a second nonprofit partner.]",
    name: "[TODO: name]",
    title: "[TODO: title, organization]",
    avatar: "avatar.placeholder",
    kind: "nonprofit",
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
