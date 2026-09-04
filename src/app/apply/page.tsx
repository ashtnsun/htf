import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getApplyDestination, isInSeason, site } from "@content/site";
import { PageHero } from "@/components/layout/PageHero";
import { SplitButton } from "@/components/ui/SplitButton";

export const metadata: Metadata = {
  title: "Apply",
  description: `Apply to join Hack the Future for ${site.season.cycleName}.`,
  robots: { index: false },
};

/**
 * During application season this redirects to the external form in content/site.ts.
 * The Phase 2 portal (season landing + magic-link sign in) replaces this page in place.
 */
export default function ApplyPage() {
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
