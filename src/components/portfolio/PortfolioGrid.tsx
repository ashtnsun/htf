"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { displayUrl, type Portfolio } from "@/lib/portfolio/shared";

/**
 * The screenshot grid: each card is the link (new tab), the picture framed by the viewfinder
 * brackets on hover, the title and the address under it. Filtered by the side menu's ?q=.
 * `lead` is an extra first cell (the community page's "Add a portfolio").
 */
export function PortfolioGrid({
  items,
  lead,
  empty,
}: {
  items: Portfolio[];
  lead?: ReactNode;
  empty: string;
}) {
  const query = (useSearchParams().get("q") ?? "").toLowerCase();
  const shown = query
    ? items.filter((item) => `${item.title} ${item.url}`.toLowerCase().includes(query))
    : items;

  return (
    <>
      <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {lead ? <li>{lead}</li> : null}
        {shown.map((item) => (
          <li key={item.id}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="group block">
              <div
                data-corners
                className="hover-corners relative aspect-[16/10] overflow-hidden border border-line"
              >
                {item.screenshot_url ? (
                  <Image
                    src={item.screenshot_url}
                    alt=""
                    fill
                    sizes="(min-width: 1536px) 22vw, (min-width: 1280px) 28vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover object-top"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-sm text-muted">
                    {displayUrl(item.url).split("/")[0]}
                  </span>
                )}
              </div>
              <p className="mt-3 truncate text-sm font-medium text-text transition-colors group-hover:text-green">
                {item.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </p>
              <p className="truncate text-sm text-muted">{displayUrl(item.url)}</p>
            </a>
          </li>
        ))}
      </ul>
      {shown.length === 0 && !lead ? (
        <p className="text-sm text-muted">{query ? `Nothing matches “${query}”.` : empty}</p>
      ) : null}
    </>
  );
}
