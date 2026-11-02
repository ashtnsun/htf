"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Face } from "@/components/olympus/journey/save";
import { cn } from "@/lib/utils";

/** The zoom that brings face `f` to the middle of the frame, about a third of its height. */
function zoomOn(f: Face | undefined) {
  if (!f) return { s: 1, tx: 0, ty: 0 };
  const s = Math.min(3, Math.max(1.4, 0.32 / f.h));
  const clamp = (t: number) => Math.min(0, Math.max(1 - s, t));
  return {
    s,
    tx: clamp(0.5 - s * (f.x + f.w / 2)),
    ty: clamp(0.5 - s * (f.y + f.h / 2)),
  };
}

/**
 * The family photo on the temple wall. With a face in `focus`, the photo pans and scales onto it
 * and corner brackets frame it; with none, `names` hang under their faces. `children` sit on the
 * photo itself (positioned in fractions of it) and move with the zoom; `onPhotoClick` reports
 * where the photo was clicked, in fractions. `onAspect` reports the photo's width over height.
 * `fade` fades the photo in once it loads; off, it shows at once (the photo step's still, which
 * replaces the camera's preview under the flash).
 */
export function Mural({
  photo,
  faces,
  names,
  focus = null,
  onPhotoClick,
  onAspect,
  fade = true,
  children,
  className,
}: {
  photo: string;
  faces: readonly Face[];
  names?: readonly string[];
  focus?: number | null;
  onPhotoClick?: (at: { x: number; y: number }) => void;
  onAspect?: (aspect: number) => void;
  fade?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const [aspect, setAspect] = useState<number | null>(null);
  useEffect(() => {
    if (aspect) onAspect?.(aspect);
  }, [aspect, onAspect]);

  const face = focus === null ? undefined : faces[focus];
  const { s, tx, ty } = zoomOn(face);
  const pct = (v: number) => `${v * 100}%`;

  return (
    <div
      className={cn("relative w-full overflow-hidden bg-surface", className)}
      style={{ aspectRatio: aspect ?? 16 / 9 }}
    >
      <div
        className="journey-pan absolute inset-0 origin-top-left"
        style={{ transform: `translate(${pct(tx)}, ${pct(ty)}) scale(${s})` }}
        onClick={
          onPhotoClick
            ? (event) => {
                const box = event.currentTarget.getBoundingClientRect();
                onPhotoClick({
                  x: (event.clientX - box.left) / box.width,
                  y: (event.clientY - box.top) / box.height,
                });
              }
            : undefined
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a data URL from the camera */}
        <img
          src={photo}
          alt=""
          onLoad={(e) => setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
          className={cn(
            "absolute inset-0 size-full",
            fade && "transition-opacity duration-1000 ease-smooth",
            aspect || !fade ? "opacity-100" : "opacity-0",
          )}
        />
        {names && focus === null
          ? faces.map((f, i) =>
              names[i] ? (
                <span
                  key={i}
                  className="journey-rise absolute -translate-x-1/2 bg-bg/80 px-2 py-0.5 font-olympus text-[clamp(0.55rem,1.2vw,0.85rem)] font-semibold tracking-[0.12em] whitespace-nowrap text-text uppercase"
                  style={
                    {
                      left: pct(f.x + f.w / 2),
                      top: pct(Math.min(0.94, f.y + f.h * 1.08)),
                      "--d": `${i * 120}ms`,
                    } as React.CSSProperties
                  }
                >
                  {names[i]}
                </span>
              ) : null,
            )
          : null}
        {children}
      </div>
      {face ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute motion-safe:transition-all motion-safe:duration-[1400ms] motion-safe:ease-in-out-soft"
          style={{
            left: pct(tx + s * (face.x - face.w * 0.15)),
            top: pct(ty + s * (face.y - face.h * 0.15)),
            width: pct(s * face.w * 1.3),
            height: pct(s * face.h * 1.3),
          }}
        >
          <span className="corner-brackets block size-full" />
        </span>
      ) : null}
    </div>
  );
}
