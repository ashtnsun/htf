import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { site } from "@content/site";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { requireUser } from "@/lib/auth/session";
import {
  formatCycleDeadline,
  formatPortalDate,
  getActiveCycle,
  getMyApplicationDetail,
  getOpenRoles,
} from "@/lib/portal/data";

export const metadata: Metadata = {
  title: "Application received",
  robots: { index: false },
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Confirmation after submitting (PLAN.md section 5). Only reachable with a submitted application. */
export default async function SubmittedPage({ searchParams }: PageProps<"/apply/submitted">) {
  const user = await requireUser("/apply/submitted");
  const [params, cycle] = await Promise.all([searchParams, getActiveCycle()]);
  if (!cycle) redirect("/apply");
  const detail = await getMyApplicationDetail(cycle.id, user.id);
  if (!detail || detail.application.status === "draft") redirect("/apply");

  const roles = await getOpenRoles(cycle.id);
  const roleNames = roles
    .filter((role) => detail.application.roles_applied.includes(role.id))
    .map((role) => role.name);
  const submittedAt = formatPortalDate(
    detail.application.submitted_at ?? detail.application.updated_at,
  );
  const mailed = first(params.mail) === "sent";

  const next = [
    {
      title: `Applications close ${formatCycleDeadline(cycle)}`,
      body: "Nothing to do until then. Your application is in.",
    },
    {
      title: "Exec reads every application",
      body: "We look at each one after the deadline, for every role you picked.",
    },
    {
      title: `You hear from us at ${user.email}`,
      body: "Next steps and decisions go to that address, so keep an eye on it.",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={`${cycle.name} application`}
        lines={["Application", "*received.*"]}
        stagger={false}
        blurb={
          mailed
            ? `Submitted ${submittedAt}. We emailed a confirmation to ${user.email}.`
            : `Submitted ${submittedAt}. Keep an eye on ${user.email}: that's where we follow up.`
        }
      >
        <div className="flex flex-wrap gap-4">
          <SplitButton href="/apply/form" variant="secondary">
            View your application
          </SplitButton>
          <SplitButton href="/apply" variant="secondary">
            Back to your status
          </SplitButton>
        </div>
      </PageHero>

      <Section aria-labelledby="submitted-next-title" className="border-t border-line">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-20">
          <Reveal standalone>
            <Eyebrow>What you sent</Eyebrow>
            <h2 id="submitted-next-title" className="mt-5 text-h3">
              Thanks
              {detail.application.full_name
                ? `, ${detail.application.full_name.split(/\s+/)[0]}`
                : ""}
              .
            </h2>
            <dl className="mt-8 border-t border-line">
              <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-line py-4">
                <dt className="text-sm text-muted">Roles</dt>
                <dd className="text-text">
                  {roleNames.length > 0 ? roleNames.join(", ") : "None recorded"}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-line py-4">
                <dt className="text-sm text-muted">Submitted</dt>
                <dd className="text-text">{submittedAt}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-line py-4">
                <dt className="text-sm text-muted">Email</dt>
                <dd className="break-all text-text">{user.email}</dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-muted">
              Meanwhile, follow{" "}
              <a
                href={site.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text underline decoration-green/70 underline-offset-4 transition-colors hover:text-green"
              >
                {site.socials.instagramHandle}
              </a>{" "}
              for what the teams are building.
            </p>
          </Reveal>

          <Reveal standalone delay={0.1}>
            <p className="text-eyebrow font-medium text-muted uppercase">What happens next</p>
            <ol className="mt-4 border-t border-line">
              {next.map((step, index) => (
                <li key={step.title} className="flex gap-5 border-b border-line py-5">
                  <span
                    aria-hidden="true"
                    className="font-display text-h3 leading-none font-medium text-green"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-text">{step.title}</span>
                    <span className="mt-1 block text-sm text-muted">{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
