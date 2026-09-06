import type { ProcessStepInput } from "@/lib/content/schemas";

/**
 * How a project runs, for the scroll-driven "From discovery to delivery" section on the
 * home page. Steps 3 and 4 are the club's previous site copy (audit screenshots,
 * 2026-09-06); steps 1 and 2 follow the process in docs/PLAN.md §3 (apply → scoping call →
 * matched team → build → handoff). `graphic` picks the wireframe illustration.
 */
export const process: ProcessStepInput[] = [
  {
    id: "discover",
    title: "Discover",
    description:
      "Nonprofits apply through our intake form. We hold a scoping call to understand the problem, the people who will use the solution, and what a win looks like for your organization.",
    graphic: "radar",
  },
  {
    id: "match",
    title: "Match",
    description:
      "We assemble a team around the project: one project lead, five developers and one or two designers, chosen for the skills the build needs.",
    graphic: "network",
  },
  {
    id: "build",
    title: "Build",
    description:
      "Over the academic year, a hand-selected team of Purdue students designs and builds your solution, working closely with your organization through regular check-ins and feedback cycles.",
    graphic: "terminal",
  },
  {
    id: "deliver",
    title: "Deliver",
    description:
      "At the end of the year, we deliver the completed product entirely free of charge, so your organization can continue making an impact.",
    graphic: "globe",
  },
];
