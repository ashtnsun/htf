import type { ProcessStep } from "@/lib/content/schemas";
import { ProcessScene } from "@/components/home/ProcessScene";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The four process steps from content/process.ts, told from the nonprofit's side: each step
 * carries the process scene frozen at its stage (the home page morphs it on scroll) and a
 * "Your part" line.
 */
export function HowItWorks({ steps }: { steps: ProcessStep[] }) {
  if (steps.length === 0) return null;
  const stages = steps.map((step) => step.graphic);
  return (
    <Section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="border-t border-line"
    >
      <RevealGroup>
        <Reveal className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <Headline
            as="h2"
            id="how-it-works-title"
            size="h2"
            lines={["One school year,", "*start to handoff.*"]}
            className="mt-5"
          />
          <p className="mt-6 max-w-md text-muted">
            A project runs from the first call to the handoff of a finished product. Here is what
            happens at each step and what we need from your side.
          </p>
        </Reveal>

        <ol className="mt-12 grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.id} className="flex flex-col bg-bg">
              <Reveal className="flex h-full flex-col p-6 md:p-8">
                <ProcessScene stages={stages} step={i} animate={false} className="max-w-[18rem]" />
                <p className="mt-8 text-eyebrow font-medium text-green uppercase">
                  Step {pad(i + 1)}
                </p>
                <h3 className="mt-3 text-h3">{step.title}</h3>
                <p className="mt-3 text-sm text-muted">{step.description}</p>
                {step.partner ? (
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="text-eyebrow font-medium text-muted uppercase">Your part</p>
                    <p className="mt-2 text-sm text-text">{step.partner}</p>
                  </div>
                ) : null}
              </Reveal>
            </li>
          ))}
        </ol>
      </RevealGroup>
    </Section>
  );
}
