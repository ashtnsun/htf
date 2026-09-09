import { getSessionUser, isAdminUser } from "@/lib/auth/session";
import {
  applyFilters,
  buildCsv,
  getCycleAnswers,
  getProfiles,
  loadDashboard,
  parseFilters,
} from "@/lib/portal/admin";
import { getActiveCycle } from "@/lib/portal/data";

export const dynamic = "force-dynamic";

/**
 * CSV of the applications the dashboard shows (same filters, same order) with every answer
 * and every reviewer's notes. Runs as the signed-in exec member, so Row Level Security
 * decides what is in it; anyone else gets a short refusal instead of a redirect.
 */
export async function GET(request: Request): Promise<Response> {
  const user = await getSessionUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  if (!(await isAdminUser())) return new Response("Exec only.", { status: 403 });
  const cycle = await getActiveCycle();
  if (!cycle) return new Response("No active cycle.", { status: 404 });

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const dashboard = await loadDashboard(cycle, user.id);
  const filters = parseFilters(params, dashboard.roles);
  const rows = applyFilters(dashboard.rows, filters, user.id);
  const [answers, reviewers] = await Promise.all([
    getCycleAnswers(cycle.id),
    getProfiles(rows.flatMap((row) => row.reviews.map((review) => review.reviewer_id))),
  ]);
  const csv = buildCsv(rows, dashboard.roles, dashboard.questions, answers, reviewers);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="htf-applications-${cycle.slug}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
