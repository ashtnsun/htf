import type { ProcessStep } from "@/lib/content/schemas";
import { ProcessScroll } from "@/components/home/ProcessScroll";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

/**
 * "From discovery to delivery": the section heading plus the scroll-driven step list. The
 * bottom padding is short (the list already ends half a viewport after the last step) so the
 * Impact band follows soon after Deliver (2026-09-09 review).
 */
export function Process({ steps }: { steps: ProcessStep[] }) {
  if (steps.length === 0) return null;
  return (
    <Section
      id="process"
      aria-labelledby="process-title"
      padding="none"
      className="border-t border-line pt-24 pb-12 md:pt-36 md:pb-16"
    >
      <Reveal standalone>
        <Eyebrow>How it works</Eyebrow>
        <Headline
          as="h2"
          id="process-title"
          size="h2"
          lines={["From discovery", "*to delivery.*"]}
          className="mt-5"
        />
        <p className="mt-6 max-w-md text-muted">
          Every project runs for one academic year, from the first call with a nonprofit to the
          handoff of a finished product.
        </p>
      </Reveal>
      <ProcessScroll steps={steps} />
    </Section>
  );
}
