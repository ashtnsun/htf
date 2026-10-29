import type { Metadata } from "next";
import { DinoEditorLoader } from "@/components/dino/DinoEditorLoader";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Dino editor",
  description: "Draw, recolour and export variants of the Hack the Future pixel T-rex.",
  alternates: { canonical: "/dino" },
  robots: { index: false, follow: false },
};

/**
 * /dino: the pixel editor for the HTF T-rex. A tool rather than a page of the site, so it is
 * not in the navigation or the sitemap and asks not to be indexed.
 */
export default function DinoPage() {
  return (
    <Section padding="sm" aria-labelledby="page-title">
      <Eyebrow>Dino editor</Eyebrow>
      <Headline
        as="h1"
        id="page-title"
        size="h2"
        lines={["Draw a *dinosaur*."]}
        className="mt-4 mb-10"
      />
      <DinoEditorLoader />
    </Section>
  );
}
