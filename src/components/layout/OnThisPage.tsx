import { cn } from "@/lib/utils";

export type OnThisPageItem = { href: string; label: string };

type OnThisPageProps = {
  items: OnThisPageItem[];
  /**
   * row  = jump links in a wrapping row (phones, above the article; hidden from lg).
   * list = vertical list with a left rule (the sticky aside; shown from lg).
   */
  variant: "row" | "list";
  className?: string;
};

const labelClass = "text-eyebrow font-medium text-muted uppercase";

/** In-page navigation for long articles (project write-ups, the privacy policy). */
export function OnThisPage({ items, variant, className }: OnThisPageProps) {
  if (items.length < 2) return null;
  if (variant === "row") {
    return (
      <nav aria-label="On this page" className={cn("lg:hidden", className)}>
        <p className={labelClass}>On this page</p>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="inline-flex min-h-11 items-center text-sm text-muted underline-offset-4 transition-colors hover:text-text hover:underline"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
  return (
    <nav aria-label="On this page" className={cn("hidden lg:block", className)}>
      <p className={labelClass}>On this page</p>
      <ul className="mt-3 border-l border-line">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="-ml-px flex min-h-11 items-center border-l border-transparent pl-4 text-sm text-muted transition-colors hover:border-green hover:text-text"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
