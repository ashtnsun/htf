import { HeartHandshake, Layers, Rocket, type LucideIcon } from "lucide-react";
import type { Service } from "@/lib/content/schemas";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline, renderAccent } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";

const ICONS: Record<Service["icon"], LucideIcon> = {
  "heart-handshake": HeartHandshake,
  layers: Layers,
  rocket: Rocket,
};

/**
 * "What we do": three service panels separated by hairlines (content/services.ts), the
 * full-organization photo, and the link to the projects page. Replaces the featured-projects
 * grid on the home page (2026-09-06 audit).
 */
export function WhatWeDo({ services }: { services: Service[] }) {
  return (
    <Section
      id="what-we-do"
      aria-labelledby="what-we-do-title"
      padding="lg"
      className="border-t border-line"
    >
      <RevealGroup>
        <Reveal>
          <Eyebrow>What we do</Eyebrow>
          <Headline
            as="h2"
            id="what-we-do-title"
            size="h2"
            lines={["Built by students,", "*free for nonprofits.*"]}
            className="mt-5 max-w-3xl md:text-display"
          />
        </Reveal>

        <Reveal>
          <ul className="mt-12 grid divide-y divide-line border-y border-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {services.map((service) => {
              const Icon = ICONS[service.icon];
              return (
                <li key={service.id} className="flex flex-col p-6 md:min-h-[24rem] md:p-8">
                  <span
                    aria-hidden="true"
                    className="flex size-11 items-center justify-center border border-line-strong bg-surface-2 text-green"
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-10 text-h3 md:mt-auto md:pt-16">
                    {renderAccent(service.title)}
                  </h3>
                  <p className="mt-3 text-muted">{service.description}</p>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal className="mt-6">
          <figure className="border border-line bg-surface">
            <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[21/9]">
              <Media
                src="org.group-photo"
                alt="Placeholder for the full organization photo"
                fill
                sizes="(min-width: 1440px) 1296px, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-line px-5 py-3 text-xs text-muted">
              <span>[TODO: caption for the full organization photo]</span>
              <span>Hack the Future at Purdue</span>
            </figcaption>
          </figure>
        </Reveal>

        <Reveal className="mt-10">
          <SplitButton href="/projects" variant="secondary" size="lg">
            See our projects
          </SplitButton>
        </Reveal>
      </RevealGroup>
    </Section>
  );
}
