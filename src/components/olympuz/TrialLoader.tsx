"use client";

// The /olympuz snapshot (2026-10-31): a frozen copy of the trial before the cipher chain.

import dynamic from "next/dynamic";

/**
 * The trial renders on the client only: a family's progress lives in sessionStorage (a refresh
 * keeps it, a new tab starts over), so a server render would show riddle I and then jump.
 */
export const TrialLoader = dynamic(
  () => import("@/components/olympuz/Trial").then((m) => m.Trial),
  {
    ssr: false,
    // `data-trial-pending`: the Passage keeps its title card up until the trial is here.
    loading: () => <div data-trial-pending className="mt-10 min-h-80" aria-hidden="true" />,
  },
);
