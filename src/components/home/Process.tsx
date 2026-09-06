import type { ProcessStep } from "@/lib/content/schemas";
import { ProcessScroll } from "@/components/home/ProcessScroll";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

/** "From discovery to delivery": the section heading plus the scroll-driven step list. */
export function Process({ steps }: { steps: ProcessStep[] }) {
  if (steps.length === 0) return null;
  return (
    <Section
      id="process"
      aria-labelledby="process-title"
      padding="lg"
      className="border-t border-line"
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
