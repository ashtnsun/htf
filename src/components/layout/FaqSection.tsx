import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { FaqItem } from "@/lib/content/schemas";
import { Reveal } from "@/components/motion/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

type FaqSectionProps = {
  items: FaqItem[];
  id?: string;
  eyebrow?: string;
  /** Headline lines; *asterisks* mark the green words. */
  lines?: string[];
  /** Copy under the heading, e.g. links to the deeper FAQ lists. */
  aside?: ReactNode;
  className?: string;
};

/**
 * The FAQ items as a single-open accordion, the first one open; an answer can end with a link
 * (content/faq.ts → `link`) into a deeper page or section. FaqSection's right column, and the
 * list under the application form on /apply.
 */
export function FaqAccordion({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <Accordion
      defaultOpen={items[0]?.id}
      className={className}
      items={items.map((f) => ({
        id: f.id,
        title: f.question,
        content: (
          <>
            <p>{f.answer}</p>
            {f.link ? (
              <Link
                href={f.link.href}
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-text transition-colors hover:text-green"
              >
                {f.link.label}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </>
        ),
      }))}
    />
  );
}

/** The Framer FAQ layout: heading on the left, the accordion on the right. */
export function FaqSection({
  items,
  id = "faq",
  eyebrow = "FAQ",
  lines = ["Answers to", "*your questions.*"],
  aside,
  className,
}: FaqSectionProps) {
  if (items.length === 0) return null;
  const titleId = `${id}-title`;
  return (
    <Section id={id} aria-labelledby={titleId} className={cn("border-t border-line", className)}>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <Reveal standalone>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Headline as="h2" id={titleId} size="h2" lines={lines} className="mt-5" />
          {aside ? <div className="mt-6 max-w-sm text-muted">{aside}</div> : null}
        </Reveal>
        <Reveal standalone delay={0.1}>
          <FaqAccordion items={items} />
        </Reveal>
      </div>
    </Section>
  );
}
