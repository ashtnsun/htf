import type { PartnerLocation } from "@/lib/content";
import { PartnersMap } from "@/components/nonprofits/PartnersMap";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";

/** "Where previous partners are from": the globe with a pin per location, from the project files. */
export function Partners({ locations }: { locations: PartnerLocation[] }) {
  if (locations.length === 0) return null;
  return (
    <Section id="partners" aria-labelledby="partners-title" clip className="border-t border-line">
      <Reveal standalone>
        <Eyebrow>Partners</Eyebrow>
        <Headline
          as="h2"
          id="partners-title"
          size="h2"
          lines={["Where previous", "*partners are from.*"]}
          className="mt-5"
        />
      </Reveal>
      <PartnersMap locations={locations} />
      <Reveal standalone className="mt-12">
        <SplitButton href="/projects" variant="secondary">
          See the projects
        </SplitButton>
      </Reveal>
    </Section>
  );
}
