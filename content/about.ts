import type { AboutPageInput } from "@/lib/content/schemas";

/**
 * Copy blocks for the About page. The exec board, awards and the Instagram grid live in
 * their own files. The mission headline is the club tagline; everything marked TODO is for
 * the design director to write (never invent HTF history or numbers). The "Who we are"
 * story and fact sheet were removed in the 2026-09-09 review.
 */
export const aboutPage: AboutPageInput = {
  mission: {
    lines: ["Transforming nonprofits", "*with technology.*"],
    body: "Hack the Future is a student organization at Purdue University that builds software for nonprofits around the world. Small student teams work with one nonprofit partner for the school year and deliver a finished product free of charge. [TODO: mission statement in the club's own words.]",
  },
};
