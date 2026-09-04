import type { RoleInput } from "@/lib/content/schemas";

/**
 * Roles advertised on the Students page. Seeded from the Instagram graphics
 * (Project Leads / Developers / Designers). The Framer prototype listed
 * Developer / UI/UX Designer / Project Manager instead; TODO(ashton): confirm the list.
 * Descriptions are placeholders.
 */
export const roles: RoleInput[] = [
  {
    slug: "project-lead",
    title: "Project Lead",
    blurb: "Scoping, planning, team leadership",
    description:
      "[TODO: description] Lead a team of developers and designers through a year-long build for a nonprofit partner.",
    responsibilities: [
      "[TODO] Own the project scope and timeline",
      "[TODO] Run weekly team meetings and nonprofit check-ins",
      "[TODO] Unblock the team and review work",
    ],
    timeCommitment: "[TODO: hours per week]",
    whoItsFor: "[TODO] Students who have shipped a project before and want to lead one.",
    icon: "lead",
  },
  {
    slug: "developer",
    title: "Developer",
    blurb: "Front-end, back-end, full-stack",
    description:
      "[TODO: description] Build and ship the software a nonprofit will actually use, on a small team.",
    responsibilities: [
      "[TODO] Implement features across the stack",
      "[TODO] Review teammates' code",
      "[TODO] Test and document what you build",
    ],
    timeCommitment: "[TODO: hours per week]",
    whoItsFor: "Open to all majors, all years, and all levels of experience.",
    icon: "code",
  },
  {
    slug: "designer",
    title: "Designer",
    blurb: "UX research, UI design, prototyping",
    description:
      "[TODO: description] Shape how the product works and looks, from research through polished UI.",
    responsibilities: [
      "[TODO] Interview nonprofit staff and map their workflows",
      "[TODO] Design flows and screens in Figma",
      "[TODO] Take part in design crits and workshops",
    ],
    timeCommitment: "[TODO: hours per week]",
    whoItsFor: "Open to all majors, all years, and all levels of experience.",
    icon: "design",
  },
];
