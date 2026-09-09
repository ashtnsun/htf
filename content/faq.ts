import type { FaqItemInput } from "@/lib/content/schemas";

/**
 * FAQ entries. `audience` decides which page shows them: "home" is the short general list
 * (with links into the deeper lists), "students" and "nonprofits" belong to those pages, and
 * "apply" is the short list under the application form on /apply (what happens next and the
 * questions people have while filling it in). Answers marked TODO are placeholders for the
 * design director to confirm.
 */
export const faq: FaqItemInput[] = [
  // ------------------------------------------------------------ home (general)
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
    link: { label: "How to join", href: "/students" },
  },
  {
    id: "which-roles",
    question: "What roles can I apply for?",
    answer:
      "Project lead, developer, or designer. Every team pairs one project lead with five developers and one or two designers for the whole school year.",
    audience: "home",
    link: { label: "See the roles", href: "/students#roles" },
  },
  {
    id: "when-to-apply",
    question: "When can I apply?",
    answer:
      "We recruit at the start of the fall semester: callouts in the first weeks of classes, then applications with a deadline in September. [TODO: confirm whether there is a spring cycle.]",
    audience: "home",
    link: { label: "Recruitment timeline", href: "/students#timeline" },
  },
  {
    id: "how-do-nonprofits-apply",
    question: "How do nonprofits get involved?",
    answer:
      "[TODO: confirm process] Nonprofits email us about the problem, we hold a scoping call, and matched projects run over the school year.",
    audience: "home",
    link: { label: "For nonprofits", href: "/nonprofits" },
  },
  {
    id: "where-are-partners",
    question: "Where are your nonprofit partners?",
    answer:
      "Anywhere. Our partners have been based across the United States and abroad; the projects page lists who we have worked with.",
    audience: "home",
    link: { label: "See our projects", href: "/projects" },
  },

  // ------------------------------------------------------------ students
  {
    id: "students-experience",
    question: "Do I need prior experience?",
    answer:
      "No. Applications are open to all majors, all years, and all levels of experience. [TODO: add a line about onboarding and workshops.]",
    audience: "students",
  },
  {
    id: "students-not-cs",
    question: "Do I have to be a CS major?",
    answer:
      "No. We are open to all majors and all years. What matters is that you want to build something real for a nonprofit and can commit to a team for the school year.",
    audience: "students",
  },
  {
    id: "students-multiple-roles",
    question: "Can I apply for more than one role?",
    answer: "Yes. You can apply for more than one role in a single application.",
    audience: "students",
    link: { label: "Compare the roles", href: "#roles" },
  },
  {
    id: "students-time",
    question: "How much time does it take?",
    answer:
      "[TODO: hours per week] Expect a steady weekly commitment for the whole school year rather than a hackathon weekend: team meetings, nonprofit check-ins, and your own build time.",
    audience: "students",
  },
  {
    id: "students-after-applying",
    question: "What happens after I apply?",
    answer:
      "[TODO: confirm] We review applications after the deadline, invite applicants to interviews, and send decisions before project kickoff.",
    audience: "students",
    link: { label: "Recruitment timeline", href: "#timeline" },
  },

  // ------------------------------------------------------------ apply (under the form)
  {
    id: "apply-what-happens-next",
    question: "What happens next?",
    answer:
      "We read every application after the deadline and follow up by email. The recruitment timeline has the dates.",
    audience: "apply",
    link: { label: "Recruitment timeline", href: "/students#timeline" },
  },
  {
    id: "apply-more-than-one-role",
    question: "Can I apply for more than one role?",
    answer:
      "Yes. One form covers every role you want. Responsibilities and time commitment for each role are on the Students page.",
    audience: "apply",
    link: { label: "See the roles", href: "/students#roles" },
  },
  {
    id: "apply-who-can-apply",
    question: "Who can apply?",
    answer: "Anyone at Purdue. We are open to all majors, all years, and all levels of experience.",
    audience: "apply",
  },

  // ------------------------------------------------------------ nonprofits
  {
    id: "nonprofits-cost",
    question: "What does it cost?",
    answer:
      "Nothing. We build and deliver the product free of charge. [TODO: confirm, and say whether the nonprofit covers third-party costs such as hosting or domain names.]",
    audience: "nonprofits",
  },
  {
    id: "nonprofits-timeline",
    question: "How long does a project take?",
    answer:
      "[TODO: confirm] Projects run over the academic year, from a fall kickoff to a spring handoff.",
    audience: "nonprofits",
    link: { label: "How it works", href: "#how-it-works" },
  },
  {
    id: "nonprofits-who",
    question: "Which organizations do you work with?",
    answer:
      "Nonprofits of any size, anywhere. Our partners have been based across the United States and abroad. What matters is a real problem that software can solve and a person on your side who can work with the team. [TODO: confirm any eligibility rules, e.g. registered nonprofit status.]",
    audience: "nonprofits",
    link: { label: "Where our partners are", href: "#partners" },
  },
  {
    id: "nonprofits-time",
    question: "How much of our time does it take?",
    answer:
      "A scoping call at the start, a point of contact for the year, and regular check-ins where you try the work in progress and give feedback. [TODO: confirm the check-in cadence and the hours per month.]",
    audience: "nonprofits",
  },
  {
    id: "nonprofits-ownership",
    question: "Who owns what you build?",
    answer:
      "[TODO: confirm] You do. At handoff you receive the product, the source code and the documentation, and your team is free to keep building on it.",
    audience: "nonprofits",
  },
  {
    id: "nonprofits-when",
    question: "When should we get in touch?",
    answer:
      "Any time. We match projects to teams before the fall kickoff, so inquiries that arrive over the summer are the easiest to place. [TODO: confirm when intake closes for the coming cycle.]",
    audience: "nonprofits",
    link: { label: "Start a project", href: "#start" },
  },
];
