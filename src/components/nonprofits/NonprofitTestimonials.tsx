import type { Testimonial } from "@/lib/content/schemas";
import { TestimonialMarquee } from "@/components/home/TestimonialMarquee";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

/**
 * Quotes from nonprofit partners in the home page's drifting marquee (with its pause button
 * on the eyebrow's line) on the plain page background (the dotted map backdrop went in the
 * 2026-09-09 review). Hidden until a quote is published (the loader still shows unpublished
 * ones in development, without a note).
 */
export function NonprofitTestimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;
  return (
    <Section
      id="testimonials"
      aria-labelledby="testimonials-title"
      contain={false}
      clip
      className="border-t border-line"
    >
      <TestimonialMarquee
        testimonials={testimonials}
        className="mt-0"
        heading={<Eyebrow>Partners say</Eyebrow>}
        title={
          <Headline
            as="h2"
            id="testimonials-title"
            size="h2"
            lines={["In their", "*own words.*"]}
            className="mt-5"
          />
        }
      />
    </Section>
  );
}
