import { Check, Minus } from "lucide-react";
import type { ScopeItem } from "@/lib/content/schemas";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";

type ScopeProps = { build: ScopeItem[]; avoid: ScopeItem[] };

/** "What we build and what we don't": the scope guardrails from content/nonprofits.ts. */
export function Scope({ build, avoid }: ScopeProps) {
  return (
    <Section id="scope" aria-labelledby="scope-title" grid className="border-t border-line">
      <RevealGroup>
        <Reveal>
          <Eyebrow>Scope</Eyebrow>
          <Headline
            as="h2"
            id="scope-title"
            size="h2"
            lines={["What we build,", "*and what we don’t.*"]}
            className="mt-5"
          />
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <ScopeList title="We build" items={build} tone="build" />
          <ScopeList title="We don’t" items={avoid} tone="avoid" />
        </div>
      </RevealGroup>
    </Section>
  );
}

function ScopeList({
  title,
  items,
  tone,
}: {
  title: string;
  items: ScopeItem[];
  tone: "build" | "avoid";
}) {
  const Icon = tone === "build" ? Check : Minus;
  return (
    <Reveal className="h-full">
      <div className="h-full border border-line bg-surface">
        <h3 className="border-b border-line px-6 py-4 text-eyebrow font-medium text-text uppercase md:px-8">
          {title}
        </h3>
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 px-6 py-5 md:px-8">
              <span
                aria-hidden="true"
                className={
                  tone === "build"
                    ? "flex size-7 shrink-0 items-center justify-center border border-green/60 text-green"
                    : "flex size-7 shrink-0 items-center justify-center border border-line-strong text-muted"
                }
              >
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <div>
                <p className="font-medium text-text">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
