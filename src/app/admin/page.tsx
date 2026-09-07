import type { Metadata } from "next";
import { signOut } from "@/app/apply/actions";
import { PageHero } from "@/components/layout/PageHero";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { isAdminUser, requireUser } from "@/lib/auth/session";
import {
  APPLICATION_STATUSES,
  countApplicationsByStatus,
  formatCycleDeadline,
  getActiveCycle,
} from "@/lib/portal/data";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

/**
 * Exec dashboard (PLAN.md section 5, Session 9: table, filters, search, CSV export, review
 * panel). This first version proves the gate: signed in, on the admin list (public.admins,
 * checked in the database), and able to read every application through RLS.
 */
export default async function AdminPage() {
  const user = await requireUser("/admin");
  const admin = await isAdminUser();

  if (!admin) {
    return (
      <PageHero
        eyebrow="Admin"
        lines={["Exec", "*only.*"]}
        stagger={false}
        blurb={`${user.email} is not on the exec list. If it should be, ask whoever manages the Supabase project to add it to the admins table.`}
      >
        <div className="flex flex-wrap gap-4">
          <SplitButton href="/apply" variant="secondary">
            Back to applications
          </SplitButton>
          <form action={signOut}>
            <SplitButton type="submit" variant="secondary">
              Sign out
            </SplitButton>
          </form>
        </div>
      </PageHero>
    );
  }

  const cycle = await getActiveCycle();
  const counts = cycle ? await countApplicationsByStatus(cycle.id) : null;
  const total = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : 0;

  return (
    <>
      <PageHero
        eyebrow="Admin"
        lines={["Applications", cycle ? `*${cycle.name}.*` : "*dashboard.*"]}
        stagger={false}
        blurb={
          cycle
            ? `Signed in as ${user.email}. ${cycle.name} closes ${formatCycleDeadline(cycle)}.`
            : `Signed in as ${user.email}. No cycle is active.`
        }
      >
        <form action={signOut}>
          <SplitButton type="submit" variant="secondary">
            Sign out
          </SplitButton>
        </form>
      </PageHero>

      <Section aria-labelledby="admin-counts-title" className="border-t border-line">
        <Eyebrow>Applications by status</Eyebrow>
        <h2 id="admin-counts-title" className="mt-5 text-h3">
          {total === 1 ? "1 application so far." : `${total} applications so far.`}
        </h2>
        {counts ? (
          <dl className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
            {APPLICATION_STATUSES.map((status) => (
              <div key={status} className="bg-surface p-5">
                <dt className="text-eyebrow font-medium text-muted uppercase">{status}</dt>
                <dd className="mt-2 font-display text-h3 font-medium text-text">
                  {counts[status]}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-6 text-muted">
            [TODO: add the cycle in supabase/seed.sql and mark it active.]
          </p>
        )}
        <div className="mt-10 border border-dashed border-line-strong p-6">
          <p className="text-text">The review dashboard is being built.</p>
          <p className="mt-2 text-sm text-muted">
            [TODO: Session 9 adds the applications table with filters and search, the review panel
            and CSV export.]
          </p>
        </div>
      </Section>
    </>
  );
}
