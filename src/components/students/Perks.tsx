import { GraduationCap, Hammer, TrendingUp, Users, type LucideIcon } from "lucide-react";
import type { Perk } from "@/lib/content/schemas";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";

const PERK_ICONS: Record<Perk["icon"], LucideIcon> = {
  projects: Hammer,
  skills: GraduationCap,
  community: Users,
  leadership: TrendingUp,
};

/**
 * "What you'll get": the heading beside a photo of a team at its table (2026-09-15), then four
 * cards from content/students.ts → perks.
 */
export function Perks({ perks }: { perks: Perk[] }) {
  return (
    <Section id="what-you-get" aria-labelledby="perks-title" className="border-t border-line">
      <RevealGroup>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end lg:gap-16">
          <Reveal>
            <Eyebrow>What you’ll get</Eyebrow>
            <Headline
              as="h2"
              id="perks-title"
              size="h2"
              lines={["Real work,", "*real impact.*"]}
              className="mt-5"
            />
          </Reveal>
          <Reveal className="lg:justify-self-end">
            <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden border border-line bg-surface lg:w-md">
              <Media
                src="life.team-table"
                alt="A Hack the Future team gathered around a round table, smiling at the camera"
                fill
                sizes="448px"
                className="object-cover object-[50%_70%]"
              />
            </div>
          </Reveal>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((perk) => {
            const Icon = PERK_ICONS[perk.icon];
            return (
              <li key={perk.id}>
                <Reveal className="h-full">
                  <Card padding="lg" className="flex h-full flex-col">
                    <span className="flex size-11 items-center justify-center border border-line-strong bg-surface-2 text-green">
                      <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-6 text-body-lg font-medium text-text">{perk.title}</h3>
                    <p className="mt-2 text-sm text-muted">{perk.description}</p>
                  </Card>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </RevealGroup>
    </Section>
  );
}
