import type { RecruitmentStepInput } from "@/lib/content/schemas";

/**
 * Recruitment timeline for the current cycle (see content/site.ts → season).
 * Dates are TODO until the Fall 2026 schedule is confirmed. For reference, the 2025
 * callouts were in WTHR 320 on 9/8 and 9/10 plus a virtual session on 9/11.
 */
export const recruitmentTimeline: RecruitmentStepInput[] = [
  {
    id: "callouts",
    title: "Callouts",
    when: "[TODO: dates]",
    description: "Come meet the team, hear about this year's nonprofits, and ask questions.",
  },
  {
    id: "applications-open",
    title: "Applications open",
    when: "[TODO: date]",
    description: "Apply for one or more roles. Open to all majors, years, and experience levels.",
  },
  {
    id: "deadline",
    title: "Application deadline",
    when: "[TODO: date, 11:59 PM]",
    description: "[TODO: confirm whether late applications are accepted.]",
  },
  {
    id: "interviews",
    title: "Interviews",
    when: "[TODO: dates]",
    description: "[TODO: describe the interview format.]",
  },
  {
    id: "decisions",
    title: "Decisions",
    when: "[TODO: date]",
    description: "[TODO: describe how decisions go out.]",
  },
  {
    id: "kickoff",
    title: "Project kickoff",
    when: "[TODO: date]",
    description: "Teams meet their nonprofit and start scoping.",
  },
];
