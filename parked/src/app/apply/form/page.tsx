import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApplicationForm, type FormRole } from "@/components/apply/ApplicationForm";
import { ApplicationSummary } from "@/components/apply/ApplicationSummary";
import { PageHero } from "@/components/layout/PageHero";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import {
  applicationProblems,
  buildSummary,
  completedSteps,
  parseStep,
  profileValuesOf,
  type SummaryGroup,
} from "@/lib/apply/schema";
import { requireUser } from "@/lib/auth/session";
import {
  formatCycleDeadline,
  formatPortalDate,
  getActiveCycle,
  getMyApplicationDetail,
  getOpenRoles,
  getQuestions,
  isCycleOpen,
} from "@/lib/portal/data";

export const metadata: Metadata = {
  title: "Your application",
  robots: { index: false },
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The application form (PLAN.md section 5): profile → roles → questions → review, one step
 * per URL (?step=…), saved by src/app/apply/form/actions.ts. Once submitted, or once the
 * cycle has closed, the page shows the application read-only instead.
 */
export default async function ApplyFormPage({ searchParams }: PageProps<"/apply/form">) {
  const user = await requireUser("/apply/form");
  const [params, cycle] = await Promise.all([searchParams, getActiveCycle()]);
  if (!cycle) {
    return (
      <PageHero
        eyebrow="Application"
        lines={["No cycle is", "*open right now.*"]}
        stagger={false}
        blurb={`Signed in as ${user.email}. Applications are not being taken at the moment.`}
        back={{ href: "/apply", label: "Back to your status" }}
      />
    );
  }

  const [roles, questions, detail] = await Promise.all([
    getOpenRoles(cycle.id),
    getQuestions(cycle.id),
    getMyApplicationDetail(cycle.id, user.id),
  ]);
  const application = detail?.application ?? null;
  const answers = detail?.answers ?? {};
  const open = isCycleOpen(cycle);
  const deadline = formatCycleDeadline(cycle);
  const summary = buildSummary(application, roles, questions, answers);

  if (application && application.status !== "draft") {
    return (
      <ReadOnlyApplication
        email={user.email}
        cycleName={cycle.name}
        eyebrow="Submitted"
        tone="green"
        title={`Received ${formatPortalDate(application.submitted_at ?? application.updated_at)}.`}
        body={`This is what you sent. It can't be changed now. We read every application after the deadline and follow up at ${user.email}.`}
        summary={summary}
      />
    );
  }
  if (!open) {
    if (!application) redirect("/apply");
    return (
      <ReadOnlyApplication
        email={user.email}
        cycleName={cycle.name}
        eyebrow="Not submitted"
        tone="muted"
        title="The deadline passed."
        body={`Applications closed ${deadline} before this draft was submitted, so it can't be changed or sent any more. Here is what was saved.`}
        summary={summary}
      />
    );
  }

  const step = parseStep(first(params.step));
  const formRoles: FormRole[] = roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    questionCount: questions.filter((question) => question.role_id === role.id).length,
  }));

  return (
    <>
      <PageHero
        eyebrow={`${cycle.name} application`}
        lines={["Your", "*application.*"]}
        stagger={false}
        blurb={`Signed in as ${user.email}. Applications close ${deadline}.`}
        back={{ href: "/apply", label: "Back to your status" }}
      />

      <Section aria-labelledby="apply-step-title" className="border-t border-line">
        <ApplicationForm
          key={step}
          step={step}
          cycleName={cycle.name}
          deadline={deadline}
          email={user.email}
          roles={formRoles}
          questions={questions}
          draft={
            application
              ? {
                  profile: profileValuesOf(application),
                  rolesApplied: application.roles_applied,
                  updatedAt: application.updated_at,
                }
              : null
          }
          answers={answers}
          completed={completedSteps(application, roles, questions, answers)}
          problems={applicationProblems(application, roles, questions, answers)}
          summary={summary}
        />
      </Section>
    </>
  );
}

function ReadOnlyApplication({
  email,
  cycleName,
  eyebrow,
  tone,
  title,
  body,
  summary,
}: {
  email: string;
  cycleName: string;
  eyebrow: string;
  tone: "green" | "muted";
  title: string;
  body: string;
  summary: SummaryGroup[];
}) {
  return (
    <>
      <PageHero
        eyebrow={`${cycleName} application`}
        lines={["Your", "*application.*"]}
        stagger={false}
        blurb={`Signed in as ${email}.`}
        back={{ href: "/apply", label: "Back to your status" }}
      />
      <Section aria-labelledby="apply-readonly-title" className="border-t border-line">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
          <div className="min-w-0">
            <div className="border border-line bg-surface p-6 sm:p-8">
              <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
              <h2
                id="apply-readonly-title"
                className="mt-4 font-display text-h3 font-medium text-text"
              >
                {title}
              </h2>
              <p className="mt-3 max-w-prose text-muted">{body}</p>
            </div>
            <ApplicationSummary groups={summary} className="mt-12" />
          </div>
          <aside className="self-start border border-line glass p-6 lg:sticky lg:top-28">
            <Eyebrow tone="muted">Read only</Eyebrow>
            <p className="mt-3 text-sm text-muted">
              Spotted a mistake? Reach out through the contact page and mention the email you
              applied with.
            </p>
            <div className="mt-5 flex flex-col items-start gap-3">
              <SplitButton href="/apply" variant="secondary">
                Back to your status
              </SplitButton>
              <SplitButton href="/contact" variant="secondary">
                Contact us
              </SplitButton>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
