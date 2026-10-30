"use client";

import dynamic from "next/dynamic";

/**
 * The trial renders on the client only: a family's progress lives in sessionStorage (a refresh
 * keeps it, a new tab starts over), so a server render would show riddle I and then jump.
 */
export const TrialLoader = dynamic(
  () => import("@/components/olympus/Trial").then((m) => m.Trial),
  {
    ssr: false,
    loading: () => <div className="mt-10 min-h-80" aria-hidden="true" />,
  },
);
