import type { Metadata } from "next";
import { MerchStudioLoader } from "@/components/merch/MerchStudioLoader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Merch studio",
  description: "Mock up the Hack the Future zip-up: a washed black hoodie with a cybersigil piece.",
  alternates: { canonical: "/merch" },
  robots: { index: false, follow: false },
};

/**
 * /merch: the mockup studio for the club zip-up. A tool rather than a page of the site, like
 * /dino, so it is not in the navigation or the sitemap and asks not to be indexed.
 */
export default function MerchPage() {
  return (
    <Section padding="sm" aria-labelledby="page-title">
      <Eyebrow>Merch studio</Eyebrow>
      <Headline
        as="h1"
        id="page-title"
        size="h2"
        lines={["Design the *zip-up*."]}
        className="mt-4 mb-10"
      />
      <MerchStudioLoader />
    </Section>
  );
}
