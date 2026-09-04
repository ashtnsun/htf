import type { StatInput } from "@/lib/content/schemas";

/**
 * Impact stats. Values come from the 2025–26 Instagram graphics; the section renders
 * only stats marked `published: true`. TODO(ashton): confirm before publishing.
 */
export const stats: StatInput[] = [
  { id: "nonprofit-pool", value: "500+", label: "Nonprofit pool", published: false },
  { id: "nonprofits-2025-26", value: "8", label: "Nonprofits in 2025–26", published: false },
  { id: "us-states", value: "4", label: "U.S. states: IN, IL, CA, PA", published: false },
  {
    id: "countries",
    value: "4",
    label: "Countries: UK, India, Ghana, Botswana",
    published: false,
  },
  { id: "students", value: "[TODO]", label: "Student members", published: false },
];
