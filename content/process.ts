import type { ProcessStepInput } from "@/lib/content/schemas";

/**
 * How a project runs, for the scroll-driven "From discovery to delivery" section on the
 * home page. Steps 3 and 4 are the club's previous site copy (audit screenshots,
 * 2026-09-06); steps 1 and 2 follow the process in docs/PLAN.md §3 (apply → scoping call →
 * matched team → build → handoff). `graphic` names the dino scene the step shows in the
 * process scene (the detective, the team, the builder, the party); `partner` is the
 * nonprofit's part at each step, shown on /nonprofits.
 */
export const process: ProcessStepInput[] = [
  {
    id: "discover",
    title: "Discover",
    description:
      "Nonprofits apply through our intake form. We hold a scoping call to understand the problem, the people who will use the solution, and what a win looks like for your organization.",
    graphic: "detective",
    partner:
      "Fill in the intake form and join a scoping call with us. Bring the people who will use the tool.",
  },
  {
    id: "match",
    title: "Match",
    description:
      "We assemble a team around the project: one project lead, five developers and one or two designers, chosen for the skills the build needs.",
    graphic: "team",
    partner:
      "Meet the team at kickoff and name one point of contact who can answer questions during the year.",
  },
  {
    id: "build",
    title: "Build",
    description:
      "Over the academic year, a hand-selected team of Purdue students designs and builds your solution, working closely with your organization through regular check-ins and feedback cycles.",
    graphic: "builder",
    partner:
      "Join regular check-ins, try the work in progress, and tell the team what is and is not working. [TODO: confirm the check-in cadence]",
  },
  {
    id: "deliver",
    title: "Deliver",
    description:
      "At the end of the year, we deliver the completed product entirely free of charge, so your organization can continue making an impact.",
    graphic: "party",
    partner:
      "Receive the finished product, the code and the documentation your team needs to keep running it. [TODO: confirm what the handoff includes]",
  },
];
