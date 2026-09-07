"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Media } from "@/components/ui/Media";

export type AwardPhotoSlide = { src: string; alt: string };

const navButton =
  "glass absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center border border-line-strong text-text transition-colors duration-200 hover:border-green hover:text-green [--glass-alpha:70%]";

/**
 * Photo carousel for the awards block: one 3:2 photo at a time, previous / next buttons and
 * a polite live counter over the photo (only when there is more than one). No caption
 * (2026-09-07 audit); the photo's alt text carries its description.
 */
export function AwardCarousel({ photos }: { photos: AwardPhotoSlide[] }) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const photo = photos[index] ?? photos[0];
  if (!photo) return null;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <div className="relative mt-6 aspect-[3/2] overflow-hidden border border-line bg-surface">
      <Media
        key={photo.src}
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(min-width: 1440px) 1296px, 100vw"
        className="object-cover"
      />
      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className={`${navButton} left-4`}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photo"
            className={`${navButton} right-4`}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
          <span
            aria-live="polite"
            className="absolute right-4 bottom-4 border border-line-strong glass px-2.5 py-1.5 text-xs text-muted tabular-nums [--glass-alpha:70%]"
          >
            {index + 1} / {count}
          </span>
        </>
      ) : null}
    </div>
  );
}
