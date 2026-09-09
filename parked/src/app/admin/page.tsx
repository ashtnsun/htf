import type { Metadata } from "next";
import { signOut } from "@/app/apply/actions";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { ApplicationsTable } from "@/components/admin/ApplicationsTable";
import { ExecOnly } from "@/components/admin/ExecOnly";
import { PageHero } from "@/components/layout/PageHero";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { isAdminUser, requireUser } from "@/lib/auth/session";
import {
  applyFilters,
  countByRole,
  countByStatus,
  filtersToParams,
  loadDashboard,
  parseFilters,
  STATUS_LABELS,
} from "@/lib/portal/admin";
import { APPLICATION_STATUSES, formatCycleDeadline, getActiveCycle } from "@/lib/portal/data";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

const countLabel = "text-eyebrow font-medium text-muted uppercase";
const countValue = "mt-2 font-display text-h3 font-medium text-text";

/**
 * Exec dashboard (PLAN.md section 5, Session 9): counts by status and by role, the filter
 * bar (URL search params, so the page stays a server component), the applications table
 * and the CSV export. Gated by requireUser + isAdminUser; every read runs through Row Level
 * Security as the signed-in member.
 */
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser("/admin");
  if (!(await isAdminUser())) return <ExecOnly email={user.email} />;
  const [cycle, params] = await Promise.all([getActiveCycle(), searchParams]);

  if (!cycle) {
    return (
      <PageHero
        eyebrow="Admin"
        lines={["Applications", "*dashboard.*"]}
        stagger={false}
        blurb={`Signed in as ${user.email}. No cycle is active.`}
      >
        <form action={signOut}>
          <SplitButton type="submit" variant="secondary">
            Sign out
          </SplitButton>
        </form>
        <p className="mt-6 text-sm text-muted">
          [TODO: add the cycle in supabase/seed.sql and mark it active.]
        </p>
      </PageHero>
    );
  }

  const dashboard = await loadDashboard(cycle, user.id);
  const filters = parseFilters(params, dashboard.roles);
  const query = filtersToParams(filters);
  const rows = applyFilters(dashboard.rows, filters, user.id);
  const statusCounts = countByStatus(dashboard.rows);
  const roleCounts = countByRole(dashboard.rows, dashboard.roles);
  const total = dashboard.rows.length;
  const submitted = total - statusCounts.draft;

  return (
    <>
      <PageHero
        eyebrow="Admin"
        lines={["Applications", `*${cycle.name}.*`]}
        stagger={false}
        blurb={`Signed in as ${user.email}. ${cycle.name} closes ${formatCycleDeadline(cycle)}.`}
      >
        <div className="flex flex-wrap gap-4">
          <SplitButton href={`/admin/export.csv${query}`} download variant="secondary">
            Export CSV
          </SplitButton>
          <form action={signOut}>
            <SplitButton type="submit" variant="secondary">
              Sign out
            </SplitButton>
          </form>
        </div>
      </PageHero>

      <Section aria-labelledby="admin-counts-title" className="border-t border-line">
        <Eyebrow>Overview</Eyebrow>
        <h2 id="admin-counts-title" className="mt-5 text-h3">
          {submitted === 1 ? "1 application submitted" : `${submitted} applications submitted`}
          {statusCounts.draft > 0
            ? `, ${statusCounts.draft} ${statusCounts.draft === 1 ? "draft" : "drafts"} in progress.`
            : "."}
        </h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <p className={countLabel}>By status</p>
            <dl className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
              {APPLICATION_STATUSES.map((status) => (
                <div key={status} className="bg-surface p-5">
                  <dt className={countLabel}>{STATUS_LABELS[status]}</dt>
                  <dd className={countValue}>{statusCounts[status]}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <p className={countLabel}>By role, submitted</p>
            <dl className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3">
              {roleCounts.map(({ role, count }) => (
                <div key={role.id} className="bg-surface p-5">
                  <dt className={countLabel}>{role.name}</dt>
                  <dd className={countValue}>{count}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="admin-table-title" className="border-t border-line">
        <Eyebrow>Applications</Eyebrow>
        <h2 id="admin-table-title" className="mt-5 text-h3">
          {rows.length === total
            ? `All ${total} ${total === 1 ? "application" : "applications"}.`
            : `${rows.length} of ${total} applications.`}
        </h2>
        <div className="mt-8">
          <AdminFilters filters={filters} roles={dashboard.roles} active={query !== ""} />
        </div>
        <div className="mt-8">
          <ApplicationsTable rows={rows} filters={filters} />
        </div>
      </Section>
    </>
  );
}
