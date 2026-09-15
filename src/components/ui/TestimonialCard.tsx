import { Quote } from "lucide-react";
import type { Testimonial } from "@/lib/content/schemas";
import { Card } from "@/components/ui/Card";
import { Media } from "@/components/ui/Media";
import { cn } from "@/lib/utils";

type TestimonialCardProps = {
  testimonial: Testimonial;
  as?: "li" | "div";
  /**
   * "band" cards sit in the marquee and take a fixed width from the quote length
   * (long quotes get the wide card); "grid" cards fill their grid cell.
   */
  layout?: "band" | "grid";
  className?: string;
  /** Hides a repeated copy (marquee filler) from assistive tech. */
  "aria-hidden"?: true;
};

/** Long quotes get the wide card in the band, short ones the narrow card. */
const WIDE_QUOTE = 90;

/**
 * Quote card: green headline, the quote, then avatar + name (green) + role. Thin glass so
 * the dotted map behind the band shows through, softly blurred.
 */
export function TestimonialCard({
  testimonial: t,
  as = "li",
  layout = "grid",
  className,
  "aria-hidden": ariaHidden,
}: TestimonialCardProps) {
  const wide = t.quote.length >= WIDE_QUOTE;
  return (
    <Card
      as={as}
      padding="lg"
      glass
      aria-hidden={ariaHidden}
      className={cn(
        "h-full glass-thin",
        layout === "band" && "shrink-0",
        layout === "band" && (wide ? "w-[min(34rem,84vw)]" : "w-[min(22rem,80vw)]"),
        className,
      )}
    >
      {/* A blank card (no quote yet) keeps its size and the avatar, and shows no text. */}
      <figure className={cn("flex h-full flex-col", !t.quote && "min-h-52")}>
        {t.headline ? (
          <p className="text-sm font-medium text-green">{t.headline}</p>
        ) : t.quote ? (
          <Quote aria-hidden="true" className="size-5 text-green" strokeWidth={1.75} />
        ) : null}
        <blockquote className="mt-4 flex-1 text-body-lg text-text">
          {t.quote ? <p>“{t.quote}”</p> : null}
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
          {t.name || t.title ? (
            <div>
              {t.name ? <p className="text-sm font-medium text-green">{t.name}</p> : null}
              {t.title ? <p className="text-xs text-muted">{t.title}</p> : null}
            </div>
          ) : null}
        </figcaption>
      </figure>
    </Card>
  );
}
