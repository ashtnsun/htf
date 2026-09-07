import type { AboutPage } from "@/lib/content/schemas";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";

/** Mission statement beside the organization photo. */
export function Mission({ mission }: { mission: AboutPage["mission"] }) {
  return (
    <Section id="mission" aria-labelledby="mission-title" grid className="border-t border-line">
      <RevealGroup>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
          <Reveal>
            <Eyebrow>Mission</Eyebrow>
            <Headline
              as="h2"
              id="mission-title"
              size="h2"
              lines={mission.lines}
              className="mt-5 md:text-display"
            />
            <p className="mt-8 max-w-xl text-body-lg text-muted">{mission.body}</p>
          </Reveal>
          <Reveal>
            <div className="border border-line bg-surface">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Media
                  src="org.group-photo"
                  alt="Placeholder for the full organization photo"
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </RevealGroup>
    </Section>
  );
}
