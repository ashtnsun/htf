import type { Testimonial } from "@/lib/content/schemas";
import { TestimonialMarquee } from "@/components/home/TestimonialMarquee";
import { Reveal } from "@/components/motion/Reveal";
import { DottedMap } from "@/components/ui/DottedMap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

/**
 * Quotes from nonprofit partners in the home page's drifting marquee (with its pause
 * button) over the dotted map. Hidden until a quote is published (the loader still shows
 * unpublished ones in development, without a note).
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
      <DottedMap
        tone="text"
        className="absolute inset-x-0 top-1/2 mx-auto w-[min(100%,80rem)] -translate-y-1/2 [mask-image:radial-gradient(60%_80%_at_50%_50%,#000_30%,transparent_100%)] opacity-20"
      />
      <TestimonialMarquee
        testimonials={testimonials}
        className="mt-0"
        heading={
          <Reveal standalone>
            <Eyebrow>Partners say</Eyebrow>
            <Headline
              as="h2"
              id="testimonials-title"
              size="h2"
              lines={["In their", "*own words.*"]}
              className="mt-5"
            />
          </Reveal>
        }
      />
    </Section>
  );
}
