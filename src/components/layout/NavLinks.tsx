"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "@content/site";
import { cn } from "@/lib/utils";

/**
 * Desktop nav links with aria-current on the active section. The current page's label is white
 * (no underline or green since 2026-09-13); hover brightens the others to the same white.
 */
export function NavLinks({ links }: { links: readonly NavLink[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {links.map((link) => {
        const active =
          pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`));
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-10 items-center px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-200",
                active ? "text-text" : "text-muted hover:text-text",
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
