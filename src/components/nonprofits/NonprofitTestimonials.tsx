import type { Testimonial } from "@/lib/content/schemas";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { DottedMap } from "@/components/ui/DottedMap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { TestimonialCard } from "@/components/ui/TestimonialCard";

/**
 * Quotes from nonprofit partners as a card grid over the dotted map. Hidden until a quote is
 * published (the loader shows unpublished ones in development with a preview note).
 */
export function NonprofitTestimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;
  const preview = testimonials.some((t) => !t.published);
  return (
    <Section
      id="testimonials"
      aria-labelledby="testimonials-title"
      contain={false}
      clip
      className="border-t border-line"
    >
      <DottedMap
        tone="text"
        className="absolute inset-x-0 top-1/2 mx-auto w-[min(100%,80rem)] -translate-y-1/2 [mask-image:radial-gradient(60%_80%_at_50%_50%,#000_30%,transparent_100%)] opacity-20"
      />
      <div className="relative container-max container-x">
        <RevealGroup>
          <Reveal>
            <Eyebrow>Partners say</Eyebrow>
            <Headline
              as="h2"
              id="testimonials-title"
              size="h2"
              lines={["In their", "*own words.*"]}
              className="mt-5"
            />
            {preview ? (
              <p className="mt-6 inline-block border border-dashed border-line-strong px-3 py-2 text-xs text-muted">
                Preview: unpublished content, shown in development only
              </p>
            ) : null}
          </Reveal>
          <ul className="mt-12 grid gap-4 md:grid-cols-2">
            {testimonials.map((t) => (
              <li key={t.id}>
                <Reveal className="h-full">
                  <TestimonialCard testimonial={t} as="div" />
                </Reveal>
              </li>
            ))}
          </ul>
        </RevealGroup>
      </div>
    </Section>
  );
}
