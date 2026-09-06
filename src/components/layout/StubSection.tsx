import { Section } from "@/components/ui/Section";

type StubSectionProps = { phase: string; items: string[] };

/** Visible placeholder for page sections planned in docs/PLAN.md but not built yet. */
export function StubSection({ phase, items }: StubSectionProps) {
  return (
    <Section aria-label="Planned sections" padding="md" className="border-t border-line">
      <p className="text-eyebrow font-medium text-muted uppercase">Coming in {phase}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item}
            className="border border-dashed border-line-strong px-5 py-6 text-sm text-muted"
          >
            {item}
          </li>
        ))}
      </ul>
    </Section>
  );
}
