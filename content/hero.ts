/**
 * Home hero copy, shared by every hero variant (src/components/home/heroes; Photo
 * ships).
 */
export const hero = {
  eyebrow: "Nonprofit Student Org",
  /** One string per line; *asterisks* mark the green words (Headline syntax). */
  lines: ["*Hack the Future*", "at Purdue"],
} as const;

/** The statement as plain text (accessible names, the ticker copies). */
export const heroStatement = hero.lines.map((line) => line.replace(/\*/g, "")).join(" ");
