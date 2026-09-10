import type { RoleInput } from "@/lib/content/schemas";

/**
 * Roles advertised on the Students page: Project Lead / Developer / Designer, confirmed by
 * Ashton in the 2026-09-10 copy pass (the Framer prototype's Developer / UI/UX Designer /
 * Project Manager list is dead). Descriptions, responsibilities and hours are his words.
 */
export const roles: RoleInput[] = [
  {
    slug: "project-lead",
    title: "Project Lead",
    blurb: "Scoping, planning, team leadership",
    description:
      "Lead a team of developers and designers through a year-long build for a nonprofit partner.",
    responsibilities: [
      "Own the project scope and timeline",
      "Run team meetings and nonprofit check-ins",
      "Unblock the team and review work",
    ],
    timeCommitment: "3 hours per week",
    whoItsFor: "Students who have shipped a project before and want to lead one.",
    icon: "lead",
  },
  {
    slug: "developer",
    title: "Developer",
    blurb: "Front-end, back-end, full-stack",
    description: "Work in a team to build and ship the software a nonprofit will actually use.",
    responsibilities: [
      "Implement features across the stack",
      "Work with designers and other developers",
      "Test and document what you build",
    ],
    timeCommitment: "2-3 hours per week",
    whoItsFor: "Open to all majors, all years, and all levels of experience.",
    icon: "code",
  },
  {
    slug: "designer",
    title: "Designer",
    blurb: "UX research, UI design, prototyping",
    description: "Shape how the product works and looks, from research through polished UI.",
    responsibilities: [
      "Interview nonprofit staff and map their workflows",
      "Design flows and screens in Figma",
      "Take part in design crits and workshops",
    ],
    timeCommitment: "2-3 hours per week",
    whoItsFor: "Open to all majors, all years, and all levels of experience.",
    icon: "design",
  },
];
