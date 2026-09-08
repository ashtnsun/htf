import type { GlobePin } from "@/components/home/Globe";

/** What the home page hands every hero variant. Season logic stays on the server. */
export type HeroProps = {
  /** The season CTA from content/site.ts (Apply Now in season, Contact Us otherwise). */
  cta: { label: string; href: string };
  /** Partner locations with coordinates (the Atlas variant); may be empty. */
  pins: GlobePin[];
};
