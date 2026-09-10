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
    "What Hack the Future collects on this website, what happens when you email us or apply, who processes it, and how to reach us about it.",
  alternates: { canonical: "/privacy" },
};

const factLabel = "text-eyebrow font-medium text-muted uppercase";

/**
 * Privacy policy: the text lives in content/privacy.mdx (validated frontmatter + MDX body)
 * and renders through <MdxBody> with a sticky "On this page" aside, like a project write-up.
 * The hero is the headline alone since the 2026-09-10 copy pass: Ashton took off the blurb,
 * the Effective / Status row and the draft badge, so `effectiveDate` and `reviewed` are now
 * only the record kept in the frontmatter.
 */
export default function PrivacyPage() {
  const policy = getPrivacyPolicy();
  const items = extractHeadings(policy.body).map((h) => ({ href: `#${h.id}`, label: h.text }));
  const email = isTodo(site.socials.email) ? null : site.socials.email;

  return (
    <>
      <PageHero eyebrow="Privacy policy" lines={["Your data,", "*handled with care.*"]} />

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
                    Email <CopyEmailInline email={email} /> or see the{" "}
                  </>
                ) : (
                  <>See the </>
                )}
                <Link
                  href="/contact"
                  className="font-medium text-green transition-colors duration-200 hover:text-text"
                >
                  contact page
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
