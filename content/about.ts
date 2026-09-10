import type { AboutPageInput } from "@/lib/content/schemas";

/**
 * Copy blocks for the About page. The exec board, awards and the Instagram grid live in
 * their own files. The mission headline is the club tagline and the body is the club's own
 * mission statement, in Ashton's words (never invent HTF history or numbers). The "Who we
 * are" story and fact sheet were removed in the 2026-09-09 review.
 */
export const aboutPage: AboutPageInput = {
  mission: {
    lines: ["Transforming nonprofits", "*with technology.*"],
    body: "We at HTF hope to make a positive impact in the community through software design and development. We aim to be actively involved with nonprofits in the nearby area by helping to build and maintain software solutions at no cost. We also want to foster an environment among our team that brings together fun, learning, and social aspects.",
  },
};
