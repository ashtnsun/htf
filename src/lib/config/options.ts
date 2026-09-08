/**
 * Site configuration: the things the design director can switch live from the Shift + M
 * menu (src/components/config/ConfigMenu.tsx). Choices are saved per browser
 * (src/lib/config/store.ts) and never affect other visitors; the defaults below are what the
 * site ships with. To make a variant the real default, change the constant here.
 */

export const HERO_VARIANTS = [
  {
    id: "globe",
    name: "Globe",
    blurb: "The statement with the wireframe globe floating behind it. The hero as it is today.",
  },
  {
    id: "atlas",
    name: "Atlas",
    blurb: "The dotted world map. Routes draw out from Purdue to every partner location.",
  },
  {
    id: "typewriter",
    name: "Typewriter",
    blurb: "The headline types itself in behind a green block cursor. Replay it any time.",
  },
  {
    id: "ticker",
    name: "Ticker",
    blurb: "The statement as one oversized band that keeps moving. Drag it, pause it.",
  },
  {
    id: "focus",
    name: "Focus",
    blurb: "Viewfinder brackets lock onto whichever word the pointer rests on.",
  },
  {
    id: "torch",
    name: "Torch",
    blurb: "A light follows the pointer and brings the words up out of the dark.",
  },
  {
    id: "cells",
    name: "Cells",
    blurb: "The technical grid itself lights up under the pointer and slowly fades.",
  },
  {
    id: "wordmark",
    name: "Wordmark",
    blurb: "The <HTF/> mark drawn at full width, tilting toward the pointer.",
  },
  {
    id: "rows",
    name: "Rows",
    blurb: "A spec sheet: full-bleed hairline rows, with Students, Nonprofits and Apply as cells.",
  },
  {
    id: "photo",
    name: "Photo",
    blurb: "The organization photo full-bleed with the statement over it. Parallax on scroll.",
  },
] as const;

export type HeroVariantId = (typeof HERO_VARIANTS)[number]["id"];

export const DEFAULT_HERO: HeroVariantId = "globe";

export type SiteConfig = {
  hero: HeroVariantId;
};

export const DEFAULT_CONFIG: SiteConfig = { hero: DEFAULT_HERO };

export function isHeroVariantId(value: unknown): value is HeroVariantId {
  return typeof value === "string" && HERO_VARIANTS.some((v) => v.id === value);
}

/** localStorage key. Bump the suffix if the shape ever changes incompatibly. */
export const CONFIG_STORAGE_KEY = "htf:config:v1";
