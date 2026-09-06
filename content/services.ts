import type { ServiceInput } from "@/lib/content/schemas";

/**
 * "What we do" on the home page. Copy comes from the club's previous site (the three
 * service panels in the 2026-09-06 audit screenshots); the design director owns the wording.
 * `title` supports the Headline accent syntax (*word* renders green).
 */
export const services: ServiceInput[] = [
  {
    id: "free-software",
    title: "Deliver *free* software",
    description: "We build transformational technology for nonprofits at absolutely no cost.",
    icon: "heart-handshake",
  },
  {
    id: "platforms",
    title: "Build web, AI/ML and app platforms",
    description:
      "From custom websites to intelligent tools, we design and develop full-scale digital products.",
    icon: "layers",
  },
  {
    id: "student-led",
    title: "Power student-led product delivery",
    description: "Driven by high-caliber students committed to shipping quality products.",
    icon: "rocket",
  },
];
