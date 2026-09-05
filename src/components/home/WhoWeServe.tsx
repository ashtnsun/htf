import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";

const PANELS = [
  {
    eyebrow: "Students",
    title: "Ship real software for a real client.",
    copy: "Join a small team for the school year as a project lead, developer or designer, and build something a nonprofit will actually use. Open to all majors, all years, and all levels of experience.",
    href: "/students",
    label: "For students",
  },
  {
    eyebrow: "Non-profits",
    title: "Get the tool your team actually needs.",
    copy: "Bring us a problem. A student team scopes it with you, builds it over the school year, and hands it off ready to use.",
    href: "/nonprofits",
    label: "For non-profits",
  },
] as const;

/** Two panels, one per audience, so a first-time visitor finds their page in one click. */
export function WhoWeServe() {
  return (
    <Section id="who-we-serve" aria-labelledby="serve-title" className="border-t border-line">
      <RevealGroup>
        <Reveal>
          <Eyebrow>Who we serve</Eyebrow>
          <Headline
            as="h2"
            id="serve-title"
            size="h2"
            lines={["Two audiences, *one mission*."]}
            className="mt-5"
          />
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {PANELS.map((panel) => (
            <Reveal key={panel.href} className="h-full">
              <Card padding="lg" className="flex h-full flex-col">
                <Eyebrow tone="green">{panel.eyebrow}</Eyebrow>
                <h3 className="mt-4 text-h3">{panel.title}</h3>
                <p className="mt-3 flex-1 text-muted">{panel.copy}</p>
                <div className="mt-8">
                  <SplitButton href={panel.href} variant="secondary">
                    {panel.label}
                  </SplitButton>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </RevealGroup>
    </Section>
  );
}
