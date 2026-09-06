import type { StatInput } from "@/lib/content/schemas";

/**
 * Impact stats: exactly three tiles on the home page (the numbers count up when the section
 * first scrolls into view). Values come from the 2025–26 Instagram graphics; the section
 * renders only stats marked `published: true`. TODO(ashton): confirm before publishing, and
 * pick the third tile: "4 U.S. states: IN, IL, CA, PA" and "Student members" were the other
 * candidates from the earlier five-stat list.
 */
export const stats: StatInput[] = [
  { id: "nonprofit-pool", value: "500+", label: "Nonprofit pool", published: false },
  { id: "nonprofits-2025-26", value: "8", label: "Nonprofits in 2025–26", published: false },
  {
    id: "countries",
    value: "4",
    label: "Countries: UK, India, Ghana, Botswana",
    published: false,
  },
];
