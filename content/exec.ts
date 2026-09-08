import type { ExecMemberInput } from "@/lib/content/schemas";

/**
 * Exec boards, one entry per member per school year, in display order within a year. The
 * About page shows the newest board first and a chip per year to switch boards. `linkedin` is
 * required (every card carries the link); a "TODO" value renders a placeholder cell. Names,
 * roles and links marked TODO are placeholders.
 */
export const exec: ExecMemberInput[] = [
  // 2026–27 board
  {
    slug: "todo-president-2026",
    name: "[TODO: exec name]",
    role: "President",
    year: "2026–27",
    linkedin: "TODO: LinkedIn URL",
    photo: "exec.todo-president",
  },
  {
    slug: "ashton-sun-2026",
    name: "Ashton Sun",
    role: "Design Director",
    year: "2026–27",
    linkedin: "TODO: LinkedIn URL",
    photo: "exec.ashton-sun",
  },
  {
    slug: "todo-exec-3-2026",
    name: "[TODO: exec name]",
    role: "[TODO: role]",
    year: "2026–27",
    linkedin: "TODO: LinkedIn URL",
    photo: "exec.todo-exec-3",
  },

  // 2025–26 board (placeholders so the year switch has a second board to show)
  {
    slug: "todo-president-2025",
    name: "[TODO: exec name]",
    role: "President",
    year: "2025–26",
    linkedin: "TODO: LinkedIn URL",
    photo: "exec.todo-president",
  },
  {
    slug: "todo-exec-2-2025",
    name: "[TODO: exec name]",
    role: "[TODO: role]",
    year: "2025–26",
    linkedin: "TODO: LinkedIn URL",
    photo: "exec.todo-exec-3",
  },
];
