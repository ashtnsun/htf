import type { GlobePin } from "@/components/home/Globe";

/** The open application cycle, as the Get involved graphics need it. */
export type InvolvedSeason = {
  /** "Fall 2026". */
  cycleName: string;
  /** The deadline in the club's time zone; `month` is 1–12. */
  deadline: { year: number; month: number; day: number };
};

/**
 * What ContactCta hands every Get involved variant. Season logic stays on the server
 * (content/site.ts); the variants only draw what they are given.
 */
export type InvolvedGraphicProps = {
  /** The season CTA next to the graphic (Apply Now in season, Contact Us otherwise). */
  cta: { label: string; href: string };
  /** The open cycle, or null out of season. */
  season: InvolvedSeason | null;
  /** "2026–27": what the badge and the calendar show when no cycle is open. */
  academicYear: string;
  /**
   * The partner locations with coordinates, for the Globe variant; `label` is what a hovered
   * pin says (the state for a partner in the US, the country elsewhere).
   */
  pins: GlobePin[];
  className?: string;
};
