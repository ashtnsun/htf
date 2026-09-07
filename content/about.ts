import type { AboutPageInput } from "@/lib/content/schemas";

/**
 * Copy blocks for the About page. The exec board, awards and the Instagram grid live in
 * their own files. The mission headline is the club tagline; everything marked TODO is for
 * the design director to write (never invent HTF history or numbers).
 */
export const aboutPage: AboutPageInput = {
  mission: {
    lines: ["Transforming nonprofits", "*with technology.*"],
    body: "Hack the Future is a student organization at Purdue University that builds software for nonprofits around the world. Small student teams work with one nonprofit partner for the school year and deliver a finished product free of charge. [TODO: mission statement in the club's own words.]",
  },
  story: [
    "[TODO: when and why HTF was founded, and by whom.]",
    "[TODO: how the club has grown: cycles run, nonprofits served, where the projects are today.]",
    "Every project team is one project lead, five developers and one or two designers. The exec board runs recruitment, nonprofit intake and the year-long project cycle.",
  ],
  facts: [
    { id: "founded", label: "Founded", value: "[TODO: year]" },
    { id: "based", label: "Based at", value: "Purdue University, West Lafayette, Indiana" },
    { id: "open-to", label: "Open to", value: "All majors, all years, all experience levels" },
    { id: "teams", label: "Team size", value: "1 lead, 5 developers, 1–2 designers" },
    {
      id: "instagram",
      label: "Instagram",
      value: "@hackthefuturepurdue",
      href: "https://www.instagram.com/hackthefuturepurdue/",
    },
  ],
};
