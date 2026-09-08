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
  className?: string;
};
