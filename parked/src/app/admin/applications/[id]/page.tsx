import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StatusChip } from "@/components/admin/ApplicationsTable";
import { ExecOnly } from "@/components/admin/ExecOnly";
import { ReviewPanel } from "@/components/admin/ReviewPanel";
import { ApplicationSummary } from "@/components/apply/ApplicationSummary";
import { PageHero } from "@/components/layout/PageHero";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { buildSummary } from "@/lib/apply/schema";
import { isAdminUser, requireUser } from "@/lib/auth/session";
import {
  averageScore,
  displayName,
  getApplicationForReview,
  getCycleRoles,
} from "@/lib/portal/admin";
import { getActiveCycle, getQuestions } from "@/lib/portal/data";
import { formatPortalDate } from "@/lib/portal/format";

export const metadata: Metadata = {
  title: "Application",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * One application for exec review: everything the applicant saved (the same summary the
 * review step shows, read-only), the signed-in member's review, the status control and the
 * other reviews. RLS hides applications from non-admins, so a wrong or foreign id is a 404.
 */
export default async function ApplicationReviewPage({
  params,
  searchParams,
}: PageProps<"/admin/applications/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/admin/applications/${id}`);
  if (!(await isAdminUser())) return <ExecOnly email={user.email} />;
  if (!UUID.test(id)) notFound();

  const detail = await getApplicationForReview(id);
  if (!detail) notFound();
  const { application, profile, answers, reviews } = detail;
  const [roles, questions, cycle] = await Promise.all([
    getCycleRoles(application.cycle_id),
    getQuestions(application.cycle_id),
    getActiveCycle(),
  ]);
  const groups = buildSummary(application, roles, questions, answers);
  const name = displayName(application, profile);
  const mine = reviews.find((review) => review.reviewer_id === user.id) ?? null;
  const others = reviews.filter((review) => review.reviewer_id !== user.id);
  const cycleName = cycle && cycle.id === application.cycle_id ? cycle.name : "Applications";
  const details = [profile?.email, application.year, application.major].filter(Boolean).join(" · ");

  return (
    <>
      <PageHero
        eyebrow={`Admin · ${cycleName}`}
        lines={[name]}
        stagger={false}
        blurb={details || undefined}
      >
        <div className="flex flex-wrap items-center gap-4">
          <SplitButton href="/admin" variant="secondary">
            All applications
          </SplitButton>
          <StatusChip status={application.status} />
          <p className="text-sm text-muted">
            {application.submitted_at
              ? `Submitted ${formatPortalDate(application.submitted_at)}`
              : `Draft, saved ${formatPortalDate(application.updated_at)}`}
          </p>
        </div>
      </PageHero>

      <Section aria-labelledby="application-title" className="border-t border-line">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <Eyebrow as="h2" id="application-title">
              Application
            </Eyebrow>
            <ApplicationSummary groups={groups} className="mt-6" />
          </div>
          <ReviewPanel
            applicationId={application.id}
            status={application.status}
            mine={mine}
            others={others}
            average={averageScore(reviews)}
            reviewCount={reviews.length}
            flash={{ review: first(query.review), status: first(query.status) }}
          />
        </div>
      </Section>
    </>
  );
}
