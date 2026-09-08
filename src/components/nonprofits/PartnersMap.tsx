"use client";

import { useMemo, useState } from "react";
import { PartnerGlobe } from "@/components/globe/PartnerGlobe";
import type { GlobePin } from "@/components/home/Globe";
import type { PartnerLocation } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The partner locations beside the globe. Hovering, focusing or tapping a location spins
 * the globe to its pin; the list is the accessible version of the globe, which is
 * decoration. The projects themselves live on /projects (the button under the section).
 */
export function PartnersMap({ locations }: { locations: PartnerLocation[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const pins = useMemo<GlobePin[]>(
    () => locations.flatMap((l) => (l.geo ? [{ id: l.id, lat: l.geo[0], lng: l.geo[1] }] : [])),
    [locations],
  );

  return (
    <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
      <PartnerGlobe
        pins={pins}
        activeId={activeId}
        className="order-first mx-auto w-[min(100%,30rem)] lg:order-last lg:max-w-[34rem]"
      />

      <div>
        <ol className="divide-y divide-line border-y border-line">
          {locations.map((location) => {
            const isActive = location.id === activeId;
            return (
              <li key={location.id}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveId(location.id)}
                  onFocus={() => setActiveId(location.id)}
                  onMouseEnter={() => setActiveId(location.id)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 py-3 text-left transition-colors duration-200",
                    isActive ? "text-green" : "text-text hover:text-green",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 shrink-0 border transition-colors duration-200",
                      isActive ? "border-green bg-green" : "border-line-strong",
                    )}
                  />
                  <span>{location.location}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
