"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "@content/site";
import { cn } from "@/lib/utils";

/** Desktop nav links with aria-current on the active section. */
export function NavLinks({ links }: { links: readonly NavLink[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-10 items-center rounded-sm px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-200",
                "after:absolute after:inset-x-3.5 after:-bottom-px after:h-px after:bg-green after:opacity-0 after:transition-opacity after:duration-200",
                active ? "text-text after:opacity-100" : "text-muted hover:text-text",
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
