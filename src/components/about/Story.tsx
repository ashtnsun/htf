import { ArrowUpRight } from "lucide-react";
import type { Fact } from "@/lib/content/schemas";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { isTodo } from "@/lib/utils";

type StoryProps = { paragraphs: string[]; facts: Fact[] };

/** "Who we are": the short history beside a fact sheet (founded, based at, open to, …). */
export function Story({ paragraphs, facts }: StoryProps) {
  return (
    <Section id="who-we-are" aria-labelledby="story-title" className="border-t border-line">
      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <Reveal standalone>
          <Eyebrow>Who we are</Eyebrow>
          <Headline
            as="h2"
            id="story-title"
            size="h2"
            lines={["A student org", "*with a client list.*"]}
            className="mt-5"
          />
          <div className="mt-8 max-w-xl space-y-5 text-body-lg text-muted">
            {paragraphs.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
        </Reveal>
        <Reveal standalone delay={0.1}>
          <dl className="border-t border-line lg:mt-14">
            {facts.map((fact) => {
              const external = fact.href && !isTodo(fact.href) ? fact.href : null;
              return (
                <div
                  key={fact.id}
                  className="grid gap-1 border-b border-line py-4 sm:grid-cols-[8rem_1fr] sm:gap-6"
                >
                  <dt className="text-eyebrow font-medium text-muted uppercase sm:pt-1">
                    {fact.label}
                  </dt>
                  <dd className="text-text">
                    {external ? (
                      <a
                        href={external}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex min-h-11 items-center gap-1.5 transition-colors duration-200 hover:text-green sm:min-h-0"
                      >
                        {fact.value}
                        <ArrowUpRight
                          className="size-4 text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
                      </a>
                    ) : (
                      fact.value
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Reveal>
      </div>
    </Section>
  );
}
