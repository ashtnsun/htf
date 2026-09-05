import { Quote } from "lucide-react";
import type { Testimonial } from "@/lib/content/schemas";
import { Card } from "@/components/ui/Card";
import { Media } from "@/components/ui/Media";
import { cn } from "@/lib/utils";

type TestimonialCardProps = {
  testimonial: Testimonial;
  as?: "li" | "div";
  className?: string;
};

/** Quote card for the testimonial band: quote mark, quote, then avatar + name (green) + role. */
export function TestimonialCard({ testimonial: t, as = "li", className }: TestimonialCardProps) {
  return (
    <Card as={as} padding="lg" className={cn("h-full bg-surface/90 backdrop-blur-sm", className)}>
      <figure className="flex h-full flex-col">
        <Quote aria-hidden="true" className="size-5 text-green" strokeWidth={1.75} />
        <blockquote className="mt-4 flex-1 text-body-lg text-text">
          <p>“{t.quote}”</p>
        </blockquote>
        <figcaption className="mt-8 flex items-center gap-4">
          {t.avatar ? (
            <Media
              src={t.avatar}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-full border border-line object-cover"
            />
          ) : null}
          <div>
            <p className="text-sm font-medium text-green">{t.name}</p>
            <p className="text-xs text-muted">{t.title}</p>
          </div>
        </figcaption>
      </figure>
    </Card>
  );
}
