"use client";

import dynamic from "next/dynamic";

/**
 * The tomb runs on the client only: a canvas, and a family's progress kept in sessionStorage.
 * `data-trial-pending`: the Passage keeps its title card up until the game is here.
 */
export const CrawlLoader = dynamic(
  () => import("@/components/olympus/crawl/Crawl").then((m) => m.Crawl),
  {
    ssr: false,
    loading: () => <div data-trial-pending className="fixed inset-0 bg-bg" aria-hidden="true" />,
  },
);
