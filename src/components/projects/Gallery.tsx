"use client";

import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Media } from "@/components/ui/Media";
import { cn } from "@/lib/utils";

export type GalleryImage = { src: string; alt: string; caption?: string };

type GalleryProps = {
  images: GalleryImage[];
  /** Name of the thing pictured, for the dialog label ("… gallery"). */
  label: string;
  className?: string;
};

const iconButton =
  "flex size-11 items-center justify-center rounded-sm border border-line-strong bg-surface text-text transition-colors hover:border-mint hover:text-mint disabled:opacity-40";

/**
 * Screenshot grid with a lightbox. The lightbox is a native modal <dialog>: the browser
 * traps focus, closes on Escape, keeps the page behind inert and returns focus to the
 * thumbnail that opened it. Arrow keys and the side buttons step through the images.
 */
export function Gallery({ images, label, className }: GalleryProps) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const count = images.length;
  const open = index !== null;
  const current = index === null ? null : images[index];

  // Mirror React state into the dialog element. `close` (Escape, backdrop) flows back via onClose.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Lock page scroll while the lightbox is up (a modal dialog does not do this by itself).
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function step(delta: number) {
    setIndex((i) => (i === null ? i : (i + delta + count) % count));
  }

  function onKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    if (count < 2) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setIndex(count - 1);
    }
  }

  /** Clicking the dark space around the image (not a control) closes the lightbox. */
  function onBackdropClick(e: MouseEvent<HTMLElement>) {
    if (e.target === e.currentTarget) setIndex(null);
  }

  if (count === 0) return null;

  return (
    <>
      <ul className={cn("grid gap-4 sm:grid-cols-2", className)}>
        {images.map((image, i) => (
          <li key={`${image.src}-${i}`} className={cn(count === 1 && "sm:col-span-2")}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-haspopup="dialog"
              aria-label={`Enlarge: ${image.alt}`}
              className="group relative block aspect-[16/10] w-full overflow-hidden rounded-md border border-line bg-surface transition-colors hover:border-line-strong focus-visible:outline-offset-2"
            >
              <Media
                src={image.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
              />
              <span
                aria-hidden="true"
                className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-sm border border-line-strong bg-bg/70 text-text opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <Maximize2 className="size-4" />
              </span>
            </button>
            {image.caption ? <p className="mt-2.5 text-sm text-muted">{image.caption}</p> : null}
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={`${label} gallery`}
        onClose={() => setIndex(null)}
        onKeyDown={onKeyDown}
        className="fixed inset-0 m-0 h-auto max-h-none w-auto max-w-none bg-transparent p-0 text-text backdrop:bg-black/85 backdrop:backdrop-blur-sm open:animate-fade-in"
      >
        {current && index !== null ? (
          <div className="flex h-full flex-col" onClick={onBackdropClick}>
            <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 md:px-6">
              <p className="text-sm text-muted">
                <span className="text-text">{index + 1}</span> / {count}
              </p>
              <button
                type="button"
                onClick={() => setIndex(null)}
                aria-label="Close gallery"
                className={iconButton}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <figure className="flex min-h-0 flex-1 flex-col" onClick={onBackdropClick}>
              <div className="relative min-h-0 flex-1 px-4 md:px-20" onClick={onBackdropClick}>
                <div className="relative h-full w-full" onClick={onBackdropClick}>
                  <Media
                    key={`${current.src}-${index}`}
                    src={current.src}
                    alt={current.alt}
                    fill
                    sizes="92vw"
                    className="object-contain"
                  />
                </div>
                {count > 1 ? (
                  <>
                    {/* Side controls from md up; on phones they move into the footer row. */}
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      aria-label="Previous image"
                      className={cn(
                        iconButton,
                        "absolute top-1/2 left-6 hidden -translate-y-1/2 md:flex",
                      )}
                    >
                      <ChevronLeft className="size-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      aria-label="Next image"
                      className={cn(
                        iconButton,
                        "absolute top-1/2 right-6 hidden -translate-y-1/2 md:flex",
                      )}
                    >
                      <ChevronRight className="size-5" aria-hidden="true" />
                    </button>
                  </>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-4 px-4 py-4 md:px-6">
                {count > 1 ? (
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous image"
                    className={cn(iconButton, "md:hidden")}
                  >
                    <ChevronLeft className="size-5" aria-hidden="true" />
                  </button>
                ) : null}
                <figcaption className="flex-1 text-center text-sm text-muted">
                  {current.caption ?? current.alt}
                </figcaption>
                {count > 1 ? (
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next image"
                    className={cn(iconButton, "md:hidden")}
                  >
                    <ChevronRight className="size-5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </figure>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
