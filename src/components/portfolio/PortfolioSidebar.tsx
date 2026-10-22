"use client";

import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { href: "/portfolio", label: "Reference" },
  { href: "/portfolio/community", label: "Community" },
  { href: "/portfolio/goals", label: "Goals" },
] as const;

/**
 * Portfolio Night's whole frame: the wordmark, a search over the grid, and three links. A
 * column on the left from lg, a stack above the content below it. No surface of its own.
 * The search lives in the URL (?q=) so the grid (PortfolioGrid) reads the same value.
 */
export function PortfolioSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const query = useSearchParams().get("q") ?? "";
  const onBoard = pathname === "/portfolio/goals";

  function search(value: string) {
    const params = new URLSearchParams(value ? { q: value } : {});
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  }

  return (
    <aside className="flex flex-col gap-6 px-6 pt-6 pb-2 lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:gap-8 lg:overflow-y-auto lg:px-8 lg:py-10">
      <div className="flex items-center gap-4 lg:block">
        <Link href="/" className="inline-block" aria-label="Hack the Future home">
          <Logo height={16} title="" />
        </Link>
        <p className="font-medium text-text lg:mt-4 lg:text-lg">Portfolio Night</p>
      </div>

      {onBoard ? null : (
        <label className="flex items-center gap-2 border-b border-line-strong pb-2 transition-colors focus-within:border-text">
          <Search aria-hidden className="size-4 shrink-0 text-muted" />
          <span className="sr-only">Search portfolios</span>
          <input
            type="search"
            defaultValue={query}
            onChange={(event) => search(event.target.value.trim())}
            placeholder="Search"
            className="w-full bg-transparent text-sm text-text placeholder:text-muted focus-visible:outline-none"
          />
        </label>
      )}

      <nav aria-label="Portfolio Night">
        <ul className="flex gap-5 lg:flex-col lg:gap-1">
          {SECTIONS.map((section) => {
            const active = pathname === section.href;
            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center text-sm transition-colors lg:min-h-8",
                    active ? "text-text" : "text-muted hover:text-text",
                  )}
                >
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Link
        href="/"
        className="mt-auto hidden items-center gap-2 text-sm text-muted transition-colors hover:text-text lg:inline-flex"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Back to the site
      </Link>
    </aside>
  );
}
