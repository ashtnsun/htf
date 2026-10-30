"use client";

import dynamic from "next/dynamic";

/**
 * The studio renders on the client only: it reads the saved design from localStorage while
 * its state is set up, so a server render would only be a placeholder that mismatches.
 */
export const MerchStudioLoader = dynamic(
  () => import("@/components/merch/MerchStudio").then((m) => m.MerchStudio),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[40rem] border border-line bg-surface" aria-hidden="true" />
    ),
  },
);
