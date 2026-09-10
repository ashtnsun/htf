import { HeartHandshake, Layers, Rocket, type LucideIcon } from "lucide-react";
import type { Service } from "@/lib/content/schemas";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Headline, renderAccent } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";

const ICONS: Record<Service["icon"], LucideIcon> = {
  "heart-handshake": HeartHandshake,
  layers: Layers,
  rocket: Rocket,
};

/**
 * "What we do": the heading is the question alone (no eyebrow, and no organization photo
 * since the 2026-09-10 copy pass — the Photo hero carries it), then three service panels
 * (content/services.ts) in a full-bleed hairline row (`bleed-row-3`: the horizontal lines
 * run edge to edge, the columns stay on the page container's columns and are framed by
 * vertical rails on both sides), then the link to the projects page, centred. The panels share their row tracks (subgrid), so the icons, titles and
 * descriptions line up across the three columns whatever the line counts.
 */
export function WhatWeDo({ services }: { services: Service[] }) {
  return (
    <Section
      id="what-we-do"
      aria-labelledby="what-we-do-title"
      padding="lg"
      contain={false}
      className="border-t border-line"
    >
      <RevealGroup>
        <div className="container-max container-x">
          <Reveal>
            <Headline as="h2" id="what-we-do-title" size="h2" lines={["What do we *do?*"]} />
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <ul className="grid border-y border-line md:min-h-[22rem] md:bleed-row-3 md:grid-rows-[auto_minmax(0,1fr)_auto_auto]">
            {services.map((service) => {
              const Icon = ICONS[service.icon];
              return (
                <li
                  key={service.id}
                  className="border-b border-line px-(--gutter) py-6 last:border-b-0 md:row-span-4 md:grid md:grid-rows-subgrid md:border-r md:border-b-0 md:p-8 md:first:col-start-2 md:first:border-l"
                >
                  <Icon
                    aria-hidden="true"
                    className="size-7 text-green md:row-start-1"
                    strokeWidth={1.5}
                  />
                  <h3 className="mt-8 text-h3 md:row-start-3 md:mt-12">
                    {renderAccent(service.title)}
                  </h3>
                  <p className="mt-3 text-muted md:row-start-4">{service.description}</p>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal className="mt-10 flex justify-center container-x">
          <SplitButton href="/projects" variant="secondary" size="lg">
            See our projects
          </SplitButton>
        </Reveal>
      </RevealGroup>
    </Section>
  );
}
