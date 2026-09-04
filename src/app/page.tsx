import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPrimaryCta } from "@content/site";
import { Globe } from "@/components/home/Globe";
import { Hero } from "@/components/home/Hero";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { StatTile } from "@/components/ui/StatTile";
import { getFaq, getFeaturedProjects, getStats, getTestimonials } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Home. Session 1 ships the hero as proof of the visual language; the sections below
 * are placeholders that establish the page rhythm and get completed in Session 2.
 */
export default function HomePage() {
  const featured = getFeaturedProjects(4);
  const stats = getStats();
  const testimonials = getTestimonials();
  const faq = getFaq("home");
  const cta = getPrimaryCta();

  return (
    <>
      <Hero />

      {/* Featured projects: staggered two-column grid of oversized cards */}
      <Section id="featured" aria-labelledby="featured-title" padding="lg">
        <RevealGroup>
          <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>Our projects</Eyebrow>
              <Headline
                as="h2"
                id="featured-title"
                size="h2"
                lines={["Built with *nonprofits*, shipped by students."]}
                className="mt-5 max-w-2xl md:text-display"
              />
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm font-medium text-text transition-colors hover:text-green"
            >
              See all projects <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>
          <ul className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
            {featured.map((project, i) => (
              <li key={project.slug} className={cn(i % 2 === 1 && "md:mt-16")}>
                <Reveal className="h-full">
                  <Card href={`/projects/${project.slug}`} padding="none" className="group">
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
                      <Media
                        src={project.cover}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs text-muted">{project.nonprofit}</p>
                        <h3 className="mt-1 text-body-lg font-medium text-text">{project.title}</h3>
                      </div>
                      <p className="text-xs text-muted">
                        {project.year} · {project.location}
                      </p>
                    </div>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </RevealGroup>
      </Section>

      {/* Who we serve */}
      <Section aria-labelledby="serve-title" className="border-t border-line">
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
            <Reveal>
              <Card padding="lg" className="h-full">
                <Eyebrow tone="green">Students</Eyebrow>
                <h3 className="mt-4 text-h3">Ship real software for a real client.</h3>
                <p className="mt-3 text-muted">
                  [TODO: one-line pitch] Join a small team for the school year as a project lead,
                  developer or designer. Open to all majors, all years, all experience levels.
                </p>
                <div className="mt-6">
                  <SplitButton href="/students" variant="secondary">
                    For students
                  </SplitButton>
                </div>
              </Card>
            </Reveal>
            <Reveal>
              <Card padding="lg" className="h-full">
                <Eyebrow tone="green">Non-profits</Eyebrow>
                <h3 className="mt-4 text-h3">Get the tool your team actually needs.</h3>
                <p className="mt-3 text-muted">
                  [TODO: one-line pitch] Bring us a problem. A student team scopes it with you and
                  builds it over the school year, at no cost.
                </p>
                <div className="mt-6">
                  <SplitButton href="/nonprofits" variant="secondary">
                    For non-profits
                  </SplitButton>
                </div>
              </Card>
            </Reveal>
          </div>
        </RevealGroup>
      </Section>

      {/* Impact stats: hidden until stats are marked published in content/stats.ts */}
      {stats.length > 0 ? (
        <Section aria-labelledby="stats-title" grid className="border-t border-line">
          <Eyebrow>Impact</Eyebrow>
          <Headline
            as="h2"
            id="stats-title"
            size="h2"
            lines={["By the *numbers*."]}
            className="mt-5"
          />
          <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <StatTile key={s.id} value={s.value} label={s.label} />
            ))}
          </dl>
        </Section>
      ) : null}

      {/* Testimonials: ghost text + dotted map band. Hidden until real quotes exist. */}
      {testimonials.length > 0 ? (
        <Section
          aria-labelledby="testimonials-title"
          ghost="Non-profits"
          className="border-t border-line"
        >
          <Eyebrow>Testimonials</Eyebrow>
          <Headline
            as="h2"
            id="testimonials-title"
            size="h2"
            lines={["What partners *say*."]}
            className="mt-5"
          />
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.id} as="li">
                <blockquote className="text-body-lg">“{t.quote}”</blockquote>
                <p className="mt-6 text-sm font-medium text-green">{t.name}</p>
                <p className="text-xs text-muted">{t.title}</p>
              </Card>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* FAQ: left heading, right accordion */}
      <Section aria-labelledby="faq-title" className="border-t border-line">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <Reveal standalone>
            <Eyebrow>FAQ</Eyebrow>
            <Headline
              as="h2"
              id="faq-title"
              size="h2"
              lines={["Answers to", "*your questions.*"]}
              className="mt-5"
            />
            <p className="mt-6 max-w-sm text-muted">
              More on the{" "}
              <Link href="/students" className="text-text underline-offset-4 hover:underline">
                Students
              </Link>{" "}
              and{" "}
              <Link href="/nonprofits" className="text-text underline-offset-4 hover:underline">
                Non-profits
              </Link>{" "}
              pages.
            </p>
          </Reveal>
          <Reveal standalone delay={0.1}>
            <Accordion
              defaultOpen={faq[0]?.id}
              items={faq.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))}
            />
          </Reveal>
        </div>
      </Section>

      {/* Contact CTA: headline + globe + split button */}
      <Section aria-labelledby="contact-title" grid padding="lg" className="border-t border-line">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <Reveal standalone>
            <Eyebrow>Get involved</Eyebrow>
            <Headline
              as="h2"
              id="contact-title"
              size="display"
              lines={["Let’s build something", "*that matters.*"]}
              className="mt-6 text-h2 md:text-display"
            />
            <p className="mt-6 max-w-md text-muted">
              [TODO: invitation copy] Students and nonprofits both start here.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <SplitButton href={cta.href} size="lg">
                {cta.label}
              </SplitButton>
              <SplitButton href="/contact" variant="secondary" size="lg">
                Contact us
              </SplitButton>
            </div>
          </Reveal>
          <Reveal standalone delay={0.15} className="mx-auto w-[min(100%,26rem)]">
            <Globe animate={false} />
          </Reveal>
        </div>
      </Section>
    </>
  );
}
