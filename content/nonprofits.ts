import type { NonprofitsPageInput } from "@/lib/content/schemas";

/**
 * Copy blocks for the Nonprofits page. The four process steps (with the nonprofit's part at
 * each one) live in content/process.ts, the FAQ in content/faq.ts and quotes in
 * content/testimonials.ts. The "what we build" list follows the services on the club's
 * previous site (web, AI/ML and app platforms); the "what we don't" list and the next-steps
 * copy are sensible defaults marked TODO until the exec board confirms them.
 */
export const nonprofitsPage: NonprofitsPageInput = {
  scope: {
    build: [
      {
        id: "websites",
        title: "Websites and web apps",
        description:
          "From a new public site to an internal tool for staff: donor pages, volunteer sign-ups, dashboards, portals.",
      },
      {
        id: "mobile",
        title: "Mobile apps",
        description:
          "Apps for the people you serve or the people who serve them, built for the phones they already have.",
      },
      {
        id: "data-ai",
        title: "Data and AI/ML tools",
        description:
          "Reporting, data pipelines, search over your documents, and intelligent tools that take repetitive work off your plate.",
      },
      {
        id: "automation",
        title: "Automation and integrations",
        description:
          "Connecting the systems you already use so information stops being copied by hand.",
      },
    ],
    avoid: [
      {
        id: "hardware",
        title: "Hardware and on-site IT",
        description:
          "We build software. We do not set up networks, devices or office equipment. [TODO: confirm]",
      },
      {
        id: "rush",
        title: "Deadlines before the spring",
        description:
          "Projects run for the academic year, so something you need next month is not a fit. [TODO: confirm]",
      },
      {
        id: "maintenance",
        title: "Open-ended maintenance",
        description:
          "We hand off a finished product with documentation. Long-term hosting and upkeep stay with your team. [TODO: confirm what support exists after handoff]",
      },
      {
        id: "commercial",
        title: "Commercial products",
        description:
          "Our work is for nonprofits and the communities they serve, not for resale. [TODO: confirm]",
      },
    ],
  },
  nextSteps: [
    "We read every inquiry and reply by email. [TODO: response window]",
    "If the project looks like a fit, we set up a scoping call to understand the problem and who will use the solution.",
    "Matched projects kick off in the fall with a team of Purdue students and run through the school year. [TODO: confirm when intake closes for the coming cycle]",
  ],
};
