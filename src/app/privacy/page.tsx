import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@content/site";
import { OnThisPage } from "@/components/layout/OnThisPage";
import { PageHero } from "@/components/layout/PageHero";
import { MdxBody } from "@/components/ui/MdxBody";
import { Section } from "@/components/ui/Section";
import { getPrivacyPolicy } from "@/lib/content";
import { extractHeadings } from "@/lib/mdx";
import { isTodo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What Hack the Future collects on this website and in its application portal, why, who processes it, and how to reach us about it.",
  alternates: { canonical: "/privacy" },
};

const factLabel = "text-eyebrow font-medium text-muted uppercase";

/** "2026-09-06" -> "September 6, 2026" (UTC so the calendar date never shifts). */
function formatEffectiveDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

/**
 * Privacy policy: the text lives in content/privacy.mdx (validated frontmatter + MDX body)
 * and renders through <MdxBody> with a sticky "On this page" aside, like a project write-up.
 * Until `reviewed: true` is set in the frontmatter, a visible draft badge stays on the page.
 */
export default function PrivacyPage() {
  const policy = getPrivacyPolicy();
  const items = extractHeadings(policy.body).map((h) => ({ href: `#${h.id}`, label: h.text }));
  const email = isTodo(site.socials.email) ? null : site.socials.email;

  return (
    <>
      <PageHero
        eyebrow="Privacy policy"
        lines={["Your data,", "*handled with care.*"]}
        blurb="What this website and the application portal collect, why, who processes it for us, and how to ask us about it. Written in plain language on purpose."
      >
        <dl className="flex flex-wrap gap-x-12 gap-y-6">
          <div>
            <dt className={factLabel}>Effective</dt>
            <dd className="mt-2 text-text">
              <time dateTime={policy.effectiveDate}>
                {formatEffectiveDate(policy.effectiveDate)}
              </time>
            </dd>
          </div>
          <div>
            <dt className={factLabel}>Status</dt>
            <dd className="mt-2 text-text">{policy.reviewed ? "Reviewed" : "Draft"}</dd>
          </div>
        </dl>
        {!policy.reviewed ? (
          <p className="mt-8 inline-block border border-dashed border-line-strong px-3 py-2 text-xs text-muted">
            [TODO: legal review] This draft was written by the site team, not a lawyer.
          </p>
        ) : null}
      </PageHero>

      <Section aria-label="Privacy policy text" className="border-t border-line">
        <OnThisPage items={items} variant="row" className="mb-10" />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-20">
          <article className="max-w-3xl">
            <MdxBody source={policy.body} />
          </article>
          <aside className="space-y-10 lg:sticky lg:top-24 lg:self-start">
            <OnThisPage items={items} variant="list" />
            <div>
              <p className={factLabel}>Questions</p>
              <p className="mt-3 text-sm text-muted">
                {email ? (
                  <>
                    Email{" "}
                    <a
                      href={`mailto:${email}`}
                      className="text-text underline decoration-green/70 underline-offset-4 transition-colors hover:text-green"
                    >
                      {email}
                    </a>{" "}
                    or use the{" "}
                  </>
                ) : (
                  <>Use the </>
                )}
                <Link
                  href="/contact"
                  className="text-text underline decoration-green/70 underline-offset-4 transition-colors hover:text-green"
                >
                  contact form
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
