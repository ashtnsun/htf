import type { AwardInput } from "@/lib/content/schemas";

/**
 * Awards and recognition, shown in the Impact section (and later on /about). The 2025
 * entry is transcribed from the club's previous site (audit screenshot, 2026-09-06);
 * TODO(ashton): confirm the wording. The three photos rotate in the carousel in this order.
 */
export const awards: AwardInput[] = [
  {
    id: "student-life-innovative-program-2025",
    issuer: "Purdue Student Life Honors",
    title: "2025 Innovative Program",
    date: "April 2025",
    photos: [
      {
        src: "awards.student-life-2025.1",
        alt: "A Hack the Future member shaking hands with a Purdue Student Life representative in front of a Purdue University backdrop",
      },
      {
        src: "awards.student-life-2025.2",
        alt: "The Purdue University plaque for the 2025 Student Activities and Organizations Innovative Program Award, engraved Hack the Future, on its certificate of recognition",
      },
      {
        src: "awards.student-life-2025.3",
        alt: "A Hack the Future member and a Purdue Student Life representative smiling together in front of a Purdue University backdrop",
      },
    ],
    published: true,
  },
];
