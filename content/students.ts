import type { StudentsPageInput } from "@/lib/content/schemas";

/**
 * Copy blocks for the Students page: how a team is built, how a project year runs, and what
 * members get out of it. Roles, the recruitment timeline and the FAQ live in their own files.
 * Team numbers come from docs/PLAN.md §3 ("1 lead + 5 devs + 1–2 designers"); the perk
 * headings are the three lines from the exec-board Instagram graphic. Lines marked TODO need
 * the design director's confirmation.
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
      id: "build",
      title: "Build through the year",
      description:
        "[TODO: cadence] Regular team meetings and nonprofit check-ins move the product from a first prototype to something staff can use.",
    },
    {
      id: "crits",
      title: "Crits, reviews and workshops",
      description:
        "Designers bring work to design crits and workshops; developers review each other's code. [TODO: confirm cadence and who runs them.]",
    },
    {
      id: "handoff",
      title: "Handoff",
      description:
        "[TODO: confirm] In the spring the team hands the finished product to the nonprofit, with the documentation they need to keep running it.",
    },
  ],
  perks: [
    {
      id: "real-projects",
      title: "Build real projects",
      description:
        "Ship software a nonprofit actually uses, with a real client and a real deadline. It is a portfolio piece, not a class assignment.",
      icon: "projects",
    },
    {
      id: "skills",
      title: "Learn by doing",
      description:
        "Pick up the stack, the tools and the habits of a working team through crits, code reviews and workshops. [TODO: confirm mentorship and workshops.]",
      icon: "skills",
    },
    {
      id: "team",
      title: "Join a driven team",
      description:
        "A small team for the school year, and a club full of people who like building things for a reason.",
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
