import { z } from "zod";

/**
 * Portfolio Night (/portfolio): what the server and the browser both need. The rows live in
 * Supabase (supabase/migrations/*_portfolio_night.sql); server-only access is in ./db.ts.
 */

export type PortfolioKind = "reference" | "community";

export type Portfolio = {
  id: string;
  kind: PortfolioKind;
  url: string;
  title: string;
  screenshot_url: string | null;
  created_at: string;
};

/** The sticky-note colours, in dock order. Token colours only; the note text is always --bg. */
export const GOAL_COLORS = ["lime", "green", "cyan", "blue", "pink", "white"] as const;
export type GoalColor = (typeof GOAL_COLORS)[number];

export type Goal = {
  id: string;
  x: number;
  y: number;
  color: GoalColor;
  text: string;
  updated_at: string;
};

/** The board is a fixed world the canvas scrolls over; notes are clamped inside it. */
export const BOARD = { width: 2400, height: 1600, note: 176 } as const;
export const GOAL_MAX = 160;

const coord = (max: number) =>
  z
    .number()
    .finite()
    .transform((n) => Math.round(Math.min(Math.max(n, 0), max)));

export const goalPatchSchema = z
  .object({
    x: coord(BOARD.width - BOARD.note),
    y: coord(BOARD.height - BOARD.note),
    color: z.enum(GOAL_COLORS),
    text: z.string().max(GOAL_MAX),
  })
  .partial();

export const portfolioInputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste a link.")
    .max(300, "That link is too long.")
    // People paste "jane.dev" as often as "https://jane.dev".
    .transform((value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`))
    .pipe(
      z.url({ protocol: /^https?$/, hostname: z.regexes.domain, error: "That isn't a web link." }),
    ),
  title: z.string().trim().max(80, "Keep the name under 80 characters.").optional(),
});

/** "https://www.jane.dev/work/" → "jane.dev/work" */
export function displayUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    return (hostname.replace(/^www\./, "") + pathname).replace(/\/+$/, "");
  } catch {
    return url;
  }
}
