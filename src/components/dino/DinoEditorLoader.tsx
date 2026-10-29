"use client";

import dynamic from "next/dynamic";

/**
 * The editor renders on the client only: it reads localStorage while its state is set up and
 * draws on a canvas, so a server render would only be a placeholder that mismatches.
 */
export const DinoEditorLoader = dynamic(
  () => import("@/components/dino/DinoEditor").then((m) => m.DinoEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[36rem] border border-line bg-surface" aria-hidden="true" />
    ),
  },
);
