/**
 * Home hero copy, shared by every hero variant (src/components/home/heroes). Which variant
 * renders is a site configuration choice (Shift + M, src/lib/config/options.ts); the words
 * stay the same across all of them.
 */
export const hero = {
  eyebrow: "Student Org @ Purdue University",
  /** One string per line; *asterisks* mark the green words (Headline syntax). */
  lines: ["Building software", "*for nonprofits.*"],
} as const;

/** The statement as plain text (accessible names, the ticker copies). */
export const heroStatement = hero.lines.map((line) => line.replace(/\*/g, "")).join(" ");
