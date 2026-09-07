import { cn } from "@/lib/utils";

export type JumpLink = { href: string; label: string };

/** "On this page" row of anchor links under a page hero (Students, About, Non-profits). */
export function JumpLinks({
  items,
  className,
}: {
  items: readonly JumpLink[];
  className?: string;
}) {
  return (
    <nav aria-label="On this page" className={cn("mt-8", className)}>
      <ul className="flex flex-wrap gap-x-6 gap-y-1">
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
