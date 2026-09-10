import type { StudentsPageInput } from "@/lib/content/schemas";

/**
 * Copy blocks for the Students page: how a team is built, how a project year runs, and what
 * members get out of it. Roles, the recruitment timeline and the FAQ live in their own files.
 * Team numbers come from docs/PLAN.md §3 ("1 lead + 5 devs + 1–2 designers") and label the
 * seat diagram for assistive tech (the captions came off in the 2026-09-10 copy pass). The
 * project year and the perks are Ashton's words from that pass.
 */
export const studentsPage: StudentsPageInput = {
  teamStructure: [
    { id: "lead", label: "project lead", count: 1, icon: "lead" },
    { id: "developers", label: "developers", count: 5, icon: "code" },
    {
      id: "designers",
      label: "designers",
      count: 2,
      minCount: 1,
      countLabel: "1–2",
      icon: "design",
    },
  ],
  howWeWork: [
    {
      id: "kickoff",
      title: "Kickoff and scoping",
      description:
        "In the fall each team meets its nonprofit, learns how they work today, and agrees on what to build.",
    },
    {
      id: "workshops",
      title: "Workshops and events",
      description:
        "Developers and designers will partake in workshops, social events, and check-ins.",
    },
    {
      id: "build",
      title: "Build through the year",
      description:
        "Regular team and nonprofit meetings move the product from a first prototype to something staff can use.",
    },
    {
      id: "handoff",
      title: "Handoff",
      description:
        "In the spring the team hands the finished product to the nonprofit, with the documentation they need to keep running it.",
    },
  ],
  perks: [
    {
      id: "real-projects",
      title: "Build real projects",
      description:
        "Ship software a nonprofit actually uses, with a real client and a real deadline.",
      icon: "projects",
    },
    {
      id: "skills",
      title: "Learn by doing",
      description: "Pick up the stack, the tools, and the habits of a working team.",
      icon: "skills",
    },
    {
      id: "team",
      title: "Join a community",
      description:
        "Members will be placed in teams and families of driven and like-minded individuals. There will be fun social events and hangouts throughout the year.",
      icon: "community",
    },
    {
      id: "leadership",
      title: "Grow your leadership skills",
      description:
        "Project leads run a team and a client relationship for a year. Developers and designers own whole features and the decisions behind them.",
      icon: "leadership",
    },
  ],
};
