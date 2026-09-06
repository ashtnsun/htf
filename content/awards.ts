import type { AwardInput } from "@/lib/content/schemas";

/**
 * Awards and recognition, shown in the Impact section (and later on /about). The 2025
 * entry is transcribed from the club's previous site (audit screenshot, 2026-09-06);
 * TODO(ashton): confirm the wording and replace the placeholder photo in content/media.ts.
 */
export const awards: AwardInput[] = [
  {
    id: "student-life-innovative-program-2025",
    issuer: "Purdue Student Life Honors",
    title: "2025 Innovative Program",
    date: "April 2025",
    photos: [
      {
        src: "awards.student-life-2025",
        alt: "Placeholder for the 2025 Innovative Program award photo",
      },
    ],
    published: true,
  },
];
