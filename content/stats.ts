import type { StatInput } from "@/lib/content/schemas";

/**
 * Impact stats: exactly three tiles on the home page (the numbers count up when the section
 * first scrolls into view). Values confirmed by Ashton on 2026-09-10.
 */
export const stats: StatInput[] = [
  { id: "applicant-pool", value: "700+", label: "Applicant pool", published: true },
  { id: "nonprofits-helped", value: "20+", label: "Nonprofits helped", published: true },
  { id: "countries", value: "5+", label: "Countries", published: true },
];
