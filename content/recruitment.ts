import type { RecruitmentStepInput } from "@/lib/content/schemas";

/**
 * Recruitment timeline for the current cycle (see content/site.ts → season). Ashton set the
 * dates in the 2026-09-10 copy pass; the ISO `date`s below drive the "current step" logic, so
 * the track advances on its own and no step is flagged `current`. Interviews and decisions
 * are still TBD, so they carry no date and stay ahead of the marker until one is added.
 */
export const recruitmentTimeline: RecruitmentStepInput[] = [
  {
    id: "callouts",
    title: "Callouts",
    when: "September 8, 10, 11",
    date: "2026-09-08",
    description: "Come learn about the club, meet the team, and ask questions.",
  },
  {
    id: "applications-open",
    title: "Applications open",
    when: "September 10",
    date: "2026-09-10",
    description: "Apply for one or more roles. Open to all majors, years, and experience levels.",
  },
  {
    id: "deadline",
    title: "Application deadline",
    when: "September 17, 11:59 PM",
    date: "2026-09-17",
    description: "Apply before this date!",
  },
  {
    id: "interviews",
    title: "Interviews",
    when: "TBD",
    description:
      "If you’re selected, you will be invited to one interview round consisting of mostly behavioral and some technical questions.",
  },
  {
    id: "decisions",
    title: "Decisions",
    when: "TBD",
    description: "You will be notified if you are accepted into the club for this year!",
  },
];
