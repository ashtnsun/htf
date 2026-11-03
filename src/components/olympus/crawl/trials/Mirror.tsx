"use client";

import { useEffect, useRef, useState } from "react";
import { cosmeticPicture, dinoFrame, DINO_H, DINO_W } from "@/components/olympus/crawl/art";
import {
  cosmeticById,
  COSMETICS,
  DINO_COLORS,
  SLOTS,
  type Cosmetic,
  type Look,
} from "@/components/olympus/crawl/cosmetics";
import { cn } from "@/lib/utils";

function ItemIcon({ item }: { item: Cosmetic }) {
  const [src] = useState(() => cosmeticPicture(item).toDataURL("image/png"));
  return (
    // eslint-disable-next-line @next/next/no-img-element -- drawn in the browser, a data URL
    <img src={src} alt="" className="crawl-mirror-icon" style={{ imageRendering: "pixelated" }} />
  );
}

/**
 * The mirror: the dinosaur as it stands, nine colours, and whatever has been bought from the shop,
 * one piece to a slot. Every change shows at once and is kept; there is nothing to confirm.
 */
export function Mirror({
  look,
  owned,
  onChange,
}: {
  look: Look;
  owned: string[];
  onChange: (look: Look) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, DINO_W, DINO_H);
    ctx.drawImage(dinoFrame(0, false, false, look), 0, 0);
  }, [look]);

  const mine = COSMETICS.filter((c) => c.price === 0 || owned.includes(c.id));
  const colorName = DINO_COLORS.find((c) => c.id === look.color)?.name;

  return (
    <div className="crawl-mirror journey-rise">
      <div className="crawl-mirror-glass">
        <canvas
          ref={ref}
          width={DINO_W}
          height={DINO_H}
          role="img"
          aria-label={`Your dinosaur in ${colorName}${SLOTS.map((s) => {
            const worn = cosmeticById(look[s.slot]);
            return worn ? `, ${worn.name}` : "";
          }).join("")}`}
        />
      </div>

      <div className="crawl-mirror-side">
        <section>
          <h2 className="crawl-mirror-title font-olympus">
            Colour <span>{colorName}</span>
          </h2>
          <div role="group" aria-label="Colour" className="crawl-swatches">
            {DINO_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                aria-label={color.name}
                aria-pressed={look.color === color.id}
                onClick={() => onChange({ ...look, color: color.id })}
                className="crawl-swatch"
                style={{ backgroundColor: color.body }}
              />
            ))}
          </div>
        </section>

        {SLOTS.map(({ slot, name }) => {
          const items = mine.filter((c) => c.slot === slot);
          return (
            <section key={slot}>
              <h2 className="crawl-mirror-title font-olympus">
                {name} <span>{cosmeticById(look[slot])?.name ?? "Nothing"}</span>
              </h2>
              <div role="group" aria-label={name} className="crawl-wardrobe">
                <button
                  type="button"
                  aria-label="Nothing"
                  aria-pressed={!look[slot]}
                  onClick={() => onChange({ ...look, [slot]: null })}
                  className={cn("crawl-wear", !look[slot] && "crawl-wear-on")}
                >
                  <span aria-hidden="true" className="crawl-wear-none" />
                </button>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={item.name}
                    aria-pressed={look[slot] === item.id}
                    onClick={() => onChange({ ...look, [slot]: item.id })}
                    className={cn("crawl-wear", look[slot] === item.id && "crawl-wear-on")}
                  >
                    <ItemIcon item={item} />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        {mine.length <= 1 ? (
          <p className="font-oracle text-lg text-muted italic">
            There is more to wear, for those with coin.
          </p>
        ) : null}
      </div>
    </div>
  );
}
