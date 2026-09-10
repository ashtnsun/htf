import type { ExecMemberInput } from "@/lib/content/schemas";

/**
 * Exec boards, one entry per member per school year, in display order within a year. The
 * About page shows the newest board first and a chip per year to switch boards (the chips
 * only appear once there is a second board). `linkedin` is required — every card carries the
 * link — and a "TODO" value renders a placeholder cell.
 */
export const exec: ExecMemberInput[] = [
  // 2026–27 board
  {
    slug: "arav-shah-2026",
    name: "Arav Shah",
    role: "President",
    year: "2026–27",
    linkedin: "https://www.linkedin.com/in/arav-shah-6a986b35b/",
    photo: "exec.arav-shah-2026",
  },
  {
    slug: "emily-li-2026",
    name: "Emily Li",
    role: "Vice President",
    year: "2026–27",
    linkedin: "https://www.linkedin.com/in/emily-l222/",
    photo: "exec.emily-li-2026",
  },
  {
    slug: "arushi-ravula-2026",
    name: "Arushi Ravula",
    role: "Secretary",
    year: "2026–27",
    linkedin: "https://www.linkedin.com/in/arushi-ravula/",
    photo: "exec.arushi-ravula-2026",
  },
  {
    slug: "jason-gottesman-2026",
    name: "Jason Gottesman",
    role: "Treasurer",
    year: "2026–27",
    linkedin: "https://www.linkedin.com/in/jasongottesman/",
    photo: "exec.jason-gottesman-2026",
  },
  {
    slug: "ben-connelly-2026",
    name: "Ben Connelly",
    role: "Technical Director",
    year: "2026–27",
    linkedin: "https://www.linkedin.com/in/benconnelly13/",
    photo: "exec.ben-connelly-2026",
  },
  {
    slug: "ashton-sun-2026",
    name: "Ashton Sun",
    role: "Design Director",
    year: "2026–27",
    linkedin: "https://www.linkedin.com/in/ashton-sun-ba7959278/",
    photo: "exec.ashton-sun-2026",
  },
  {
    slug: "khang-nguyen-2026",
    name: "Khang Nguyen",
    role: "Marketing",
    year: "2026–27",
    linkedin: "https://www.linkedin.com/in/khang-nguyen-957701384/",
    photo: "exec.khang-nguyen-2026",
  },
  {
    slug: "shreeya-sarurkar-2026",
    name: "Shreeya Sarurkar",
    role: "External Outreach",
    year: "2026–27",
    linkedin: "https://www.linkedin.com/in/shreeya-sarurkar/",
    photo: "exec.shreeya-sarurkar-2026",
  },
  {
    slug: "nakul-naik-2026",
    name: "Nakul Naik",
    role: "Internal Outreach",
    year: "2026–27",
    linkedin: "https://www.linkedin.com/in/nakul-naik-072735184/",
    photo: "exec.nakul-naik-2026",
  },
];
