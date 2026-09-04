import type { FaqItemInput } from "@/lib/content/schemas";

/** FAQ entries. `audience` decides which page shows them. Answers marked TODO are placeholders. */
export const faq: FaqItemInput[] = [
  {
    id: "what-is-htf",
    question: "What is Hack the Future?",
    answer:
      "We are a student organization at Purdue that builds software for nonprofits. Small student teams work with a nonprofit partner over the school year to ship something they will actually use.",
    audience: "home",
  },
  {
    id: "who-can-join",
    question: "Who can join?",
    answer:
      "Anyone at Purdue. We are open to all majors, all years, and all levels of experience, and you can apply for more than one role.",
    audience: "home",
  },
  {
    id: "how-do-nonprofits-apply",
    question: "How do nonprofits get involved?",
    answer:
      "[TODO: confirm process] Nonprofits apply through our intake form, we hold a scoping call, and matched projects run over the school year.",
    audience: "home",
  },
  {
    id: "students-experience",
    question: "Do I need prior experience?",
    answer:
      "No. Applications are open to all majors, all years, and all levels of experience. [TODO: add a line about onboarding and workshops.]",
    audience: "students",
  },
  {
    id: "students-multiple-roles",
    question: "Can I apply for more than one role?",
    answer: "Yes. You can apply for more than one role in a single application.",
    audience: "students",
  },
  {
    id: "nonprofits-cost",
    question: "What does it cost?",
    answer: "[TODO: confirm] Our work is free for nonprofit partners.",
    audience: "nonprofits",
  },
  {
    id: "nonprofits-timeline",
    question: "How long does a project take?",
    answer:
      "[TODO: confirm] Projects run over the academic year, from a fall kickoff to a spring handoff.",
    audience: "nonprofits",
  },
];
