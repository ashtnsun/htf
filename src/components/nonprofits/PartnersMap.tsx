"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PartnerGlobe } from "@/components/globe/PartnerGlobe";
import type { GlobePin } from "@/components/home/Globe";
import type { PartnerLocation } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The partner locations beside the globe. Hovering, focusing or tapping a location spins
 * the globe to its pin and lists the projects there; the list is the accessible version of
 * the globe, which is decoration.
 */
export function PartnersMap({ locations }: { locations: PartnerLocation[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const pins = useMemo<GlobePin[]>(
    () => locations.flatMap((l) => (l.geo ? [{ id: l.id, lat: l.geo[0], lng: l.geo[1] }] : [])),
    [locations],
  );
  const active = locations.find((l) => l.id === activeId) ?? null;

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
            const count = location.projects.length;
            return (
              <li key={location.id}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveId(location.id)}
                  onFocus={() => setActiveId(location.id)}
                  onMouseEnter={() => setActiveId(location.id)}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left transition-colors duration-200",
                    isActive ? "text-green" : "text-text hover:text-green",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2 shrink-0 border transition-colors duration-200",
                        isActive ? "border-green bg-green" : "border-line-strong",
                      )}
                    />
                    <span>{location.location}</span>
                  </span>
                  <span className="shrink-0 text-sm text-muted">
                    {count} {count === 1 ? "project" : "projects"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 min-h-24" aria-live="polite">
          {active ? (
            <>
              <p className="text-eyebrow font-medium text-muted uppercase">{active.location}</p>
              <ul className="mt-3 space-y-1">
                {active.projects.map((project) => (
                  <li key={project.slug}>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="group inline-flex min-h-11 items-center gap-2 text-sm text-text transition-colors duration-200 hover:text-green"
                    >
                      <span>
                        {project.title}
                        <span className="text-muted"> · {project.nonprofit}</span>
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted">
              Pick a location to spin the globe to it and see the projects there.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
