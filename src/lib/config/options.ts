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
    blurb: "The statement with the wireframe globe floating behind it. The hero as it ships.",
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
    id: "photo",
    name: "Photo",
    blurb: "The organization photo full-bleed with the statement over it. Parallax on scroll.",
  },
] as const;

export type HeroVariantId = (typeof HERO_VARIANTS)[number]["id"];

export const DEFAULT_HERO: HeroVariantId = "globe";

/**
 * The Get involved graphic (layout/ContactCta, at the foot of the home, About, Projects and
 * Students pages). Every variant is a recognizable object that says "start here" in its own
 * way; none uses the viewfinder corner brackets.
 */
export const INVOLVED_VARIANTS = [
  {
    id: "terminal",
    name: "Terminal",
    blurb: "A command line types out htf apply and reports back. The graphic as it ships.",
  },
  {
    id: "chat",
    name: "Chat",
    blurb: "A short conversation: your message, a reply from HTF in green, and someone typing.",
  },
  {
    id: "badge",
    name: "Badge",
    blurb: "A member badge drops in on its lanyard and settles. The cycle's name is printed on it.",
  },
] as const;

export type InvolvedVariantId = (typeof INVOLVED_VARIANTS)[number]["id"];

export const DEFAULT_INVOLVED: InvolvedVariantId = "terminal";

export type SiteConfig = {
  hero: HeroVariantId;
  involved: InvolvedVariantId;
};

export const DEFAULT_CONFIG: SiteConfig = { hero: DEFAULT_HERO, involved: DEFAULT_INVOLVED };

export function isHeroVariantId(value: unknown): value is HeroVariantId {
  return typeof value === "string" && HERO_VARIANTS.some((v) => v.id === value);
}

export function isInvolvedVariantId(value: unknown): value is InvolvedVariantId {
  return typeof value === "string" && INVOLVED_VARIANTS.some((v) => v.id === value);
}

/** localStorage key. Bump the suffix if the shape ever changes incompatibly. */
export const CONFIG_STORAGE_KEY = "htf:config:v1";
