import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getApplyDestination, isInSeason, isPortalMode, site } from "@content/site";
import { AccountPanel } from "@/components/apply/AccountPanel";
import { SignInForm } from "@/components/apply/SignInForm";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { safeNextPath } from "@/lib/auth/schema";
import { getSessionUser, isAdminUser } from "@/lib/auth/session";
import {
  formatCycleDeadline,
  getActiveCycle,
  getMyApplication,
  getOpenRoles,
  isCycleOpen,
  type Role,
} from "@/lib/portal/data";
import { isPortalConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Apply",
  description: `Apply to join Hack the Future for ${site.season.cycleName}.`,
  robots: { index: false },
};

const inlineLink = "font-medium text-green transition-colors duration-200 hover:text-text";

const STEPS = [
  {
    title: "Sign in with your email",
    body: "We send a six-digit code and a link. No password to remember, and any address works.",
  },
  {
    title: "Fill in the form",
    body: "Your profile, the roles you want, and a few short answers. Drafts save as you go.",
  },
  {
    title: "Submit before the deadline",
    body: "You get a confirmation email. We read every application after the deadline and follow up by email.",
  },
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * /apply. In "external" mode (content/site.ts → season.applyMode) this is the redirect to
 * the form used this cycle. In "portal" mode it is the season landing: sign in with an email
 * code, or, once signed in, see where the application stands and continue.
 */
export default async function ApplyPage({ searchParams }: PageProps<"/apply">) {
  if (!isPortalMode()) return <ExternalApply />;

  const params = await searchParams;
  const next = safeNextPath(first(params.next));
  const notice =
    first(params.error) === "link"
      ? "That sign-in link has expired or was already used. Request a new code below."
      : null;

  if (!isPortalConfigured()) return <PortalNotConnected />;

  const [user, cycle] = await Promise.all([getSessionUser(), getActiveCycle()]);
  const [roles, application, admin] = await Promise.all([
    cycle ? getOpenRoles(cycle.id) : Promise.resolve<Role[]>([]),
    user && cycle ? getMyApplication(cycle.id, user.id) : Promise.resolve(null),
    user ? isAdminUser() : Promise.resolve(false),
  ]);
  const open = cycle ? isCycleOpen(cycle) : false;
  const deadline = cycle ? formatCycleDeadline(cycle) : null;

  return (
    <>
      <PageHero
        eyebrow={cycle ? `${cycle.name} applications` : "Applications"}
        lines={
          open ? ["Apply to", "*Hack the Future.*"] : ["Applications are", "*closed for now.*"]
        }
        blurb={
          open
            ? "One application covers every role you want. Sign in with your email, no password needed, and your answers save as you go."
            : "Sign in to see an application you already sent, or follow us on Instagram to hear when the next cycle opens."
        }
      >
        {open && deadline ? (
          <p className="text-sm text-muted">
            Applications close <span className="text-text">{deadline}</span>.
          </p>
        ) : null}
      </PageHero>

      <Section aria-labelledby="apply-title" className="border-t border-line">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-20">
          <Reveal standalone>
            <Eyebrow>{user ? "Your account" : "Sign in"}</Eyebrow>
            <h2 id="apply-title" className="mt-5 text-h3">
              {user ? "Pick up where you left off." : "Start with your email."}
            </h2>
            <div className="mt-8">
              {user ? (
                <AccountPanel
                  email={user.email}
                  cycle={cycle}
                  application={application}
                  roleNames={roles
                    .filter((role) => application?.roles_applied.includes(role.id))
                    .map((role) => role.name)}
                  admin={admin}
                />
              ) : (
                <SignInForm next={next} notice={notice} />
              )}
            </div>
          </Reveal>

          <Reveal standalone delay={0.1} className="space-y-12">
            <div>
              <p className="text-eyebrow font-medium text-muted uppercase">How applying works</p>
              <ol className="mt-4 border-t border-line">
                {STEPS.map((step, index) => (
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
            </div>

            <div>
              <p className="text-eyebrow font-medium text-muted uppercase">
                {cycle ? `Roles this cycle` : "Roles"}
              </p>
              {roles.length > 0 ? (
                <ul className="mt-4 border-t border-line">
                  {roles.map((role) => (
                    <li key={role.id} className="border-b border-line py-4">
                      <span className="block text-text">{role.name}</span>
                      {role.description ? (
                        <span className="mt-1 block text-sm text-muted">{role.description}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  [TODO: no roles are configured for this cycle yet (supabase/seed.sql).]
                </p>
              )}
              <p className="mt-4 text-sm text-muted">
                Responsibilities and time commitment are on the{" "}
                <Link href="/students#roles" className={inlineLink}>
                  Students page
                </Link>
                . Questions?{" "}
                <Link href="/contact" className={inlineLink}>
                  Contact us
                </Link>
                .
              </p>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}

/** Pre-portal behaviour: send applicants to the form in use this cycle. */
function ExternalApply() {
  if (isInSeason()) redirect(getApplyDestination());
  return (
    <PageHero
      eyebrow="Applications"
      lines={["Applications are", "*closed for now.*"]}
      blurb="Follow us on Instagram to hear when the next cycle opens, or reach out any time."
    >
      <div className="flex flex-wrap gap-4">
        <SplitButton href={site.socials.instagram}>Follow on Instagram</SplitButton>
        <SplitButton href="/contact" variant="secondary">
          Contact us
        </SplitButton>
      </div>
    </PageHero>
  );
}

/** Portal mode without the Supabase variables: say so instead of failing. */
function PortalNotConnected() {
  return (
    <PageHero
      eyebrow="Applications"
      lines={["The portal is", "*not connected yet.*"]}
      blurb="Sign-in needs the Supabase project. Until it is set up, applications go through the form linked from our Instagram."
    >
      <div className="border border-dashed border-line-strong p-6">
        <p className="text-sm text-muted">
          [TODO: set SUPABASE_URL and SUPABASE_ANON_KEY (see .env.example and docs/DEPLOY.md section
          6), or switch NEXT_PUBLIC_APPLY_MODE back to external.]
        </p>
        <SplitButton href={site.socials.instagram} className="mt-6">
          Open Instagram
        </SplitButton>
      </div>
    </PageHero>
  );
}
