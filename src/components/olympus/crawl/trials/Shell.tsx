"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { OlympusButton } from "@/components/olympus/OlympusButton";
import { cn } from "@/lib/utils";

/**
 * A close-up: the camera has walked up to something in the tomb and this is what it sees. A slab
 * of the same stone over the world, the way back in the corner. Esc steps away too. While it is
 * open the game hears nothing, so a trial's own keys (Wordle's letters) are its own.
 */
export function TrialShell({
  label,
  onClose,
  leaving,
  wide = false,
  bare = false,
  children,
}: {
  label: string;
  onClose: () => void;
  leaving: boolean;
  wide?: boolean;
  /** No slab: the mural's photo stage is its own frame. */
  bare?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    // Anything that does not take the focus itself leaves it on the dialog, not on the page.
    if (ref.current && !ref.current.contains(document.activeElement)) ref.current.focus();
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      data-leaving={leaving ? "" : undefined}
      className={cn("crawl-trial", bare && "crawl-trial-bare")}
    >
      <div className="crawl-away">
        <OlympusButton variant="secondary" onClick={onClose}>
          Step away
        </OlympusButton>
      </div>
      {bare ? (
        children
      ) : (
        <div className={cn("crawl-slab", wide && "crawl-slab-wide")}>
          <div className="crawl-slab-inner">{children}</div>
        </div>
      )}
    </div>
  );
}
