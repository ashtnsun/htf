import type { TestimonialInput } from "@/lib/content/schemas";

/** Quotes stay `published: false` until a real, approved quote replaces the placeholder. */
export const testimonials: TestimonialInput[] = [
  {
    id: "placeholder-nonprofit",
    quote: "[TODO: nonprofit quote]",
    name: "[TODO: name]",
    title: "[TODO: title, organization]",
    avatar: "avatar.placeholder",
    kind: "nonprofit",
    published: false,
  },
  {
    id: "placeholder-student",
    quote: "[TODO: student quote]",
    name: "[TODO: name]",
    title: "[TODO: role, year]",
    avatar: "avatar.placeholder",
    kind: "student",
    published: false,
  },
];
