import type { PartnerLocation } from "@/lib/content";
import { PartnersMap } from "@/components/nonprofits/PartnersMap";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";

/** "Where our partners are": the globe with a pin per location, from the project files. */
export function Partners({ locations }: { locations: PartnerLocation[] }) {
  if (locations.length === 0) return null;
  const cycle = locations[0]?.projects[0]?.year;
  return (
    <Section id="partners" aria-labelledby="partners-title" clip className="border-t border-line">
      <Reveal standalone>
        <Eyebrow>Partners</Eyebrow>
        <Headline
          as="h2"
          id="partners-title"
          size="h2"
          lines={["Where our", "*partners are.*"]}
          className="mt-5"
        />
        <p className="mt-6 max-w-md text-muted">
          {cycle ? `Our ${cycle} partners` : "Our partners"} are based in {locations.length}{" "}
          {locations.length === 1 ? "place" : "places"}. Pick a location to spin the globe to it, or
          drag the globe around.
        </p>
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
