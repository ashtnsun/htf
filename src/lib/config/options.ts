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
    blurb: "The statement with the wireframe globe floating behind it.",
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
    blurb:
      "The organization photo full-bleed with the statement over it, scrolling a little slower than the page. The hero as it ships.",
  },
] as const;

export type HeroVariantId = (typeof HERO_VARIANTS)[number]["id"];

export const DEFAULT_HERO: HeroVariantId = "photo";

/**
 * The Get involved graphic (layout/ContactCta, at the foot of the home, About, Projects and
 * Students pages). Every variant is a recognizable object that says "start here" in its own
 * way; none uses the viewfinder corner brackets. Globe is the partner globe from /nonprofits
 * (three.js, loaded when the section is near the viewport; the SVG globe before that).
 */
export const INVOLVED_VARIANTS = [
  {
    id: "globe",
    name: "Globe",
    blurb:
      "The partner globe from the Nonprofits page: drag it, hover a pin for its state or country. The graphic as it ships.",
  },
  {
    id: "terminal",
    name: "Terminal",
    blurb: "A command line types out htf apply and reports back.",
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

export const DEFAULT_INVOLVED: InvolvedVariantId = "globe";

/**
 * The inner-page hero (layout/PageHero, at the top of Projects, About, Students, Nonprofits
 * and Contact). Every variant renders the same eyebrow, `h1` and blurb; only the treatment
 * around them changes. The 404 and the privacy page keep the shipped hero whatever is chosen.
 */
export const PAGE_HERO_VARIANTS = [
  {
    id: "frame",
    name: "Frame",
    blurb:
      "The technical grid, the green glow along the bottom edge and the framed column. The hero as it ships.",
  },
  {
    id: "globe",
    name: "Globe",
    blurb:
      "The wireframe globe, big enough that only its northern cap clears the bottom edge. It turns slowly behind the headline.",
  },
  {
    id: "radar",
    name: "Radar",
    blurb: "A dish beside the headline: hairline rings, a green arm sweeping, one blip pinging.",
  },
  {
    id: "corridor",
    name: "Corridor",
    blurb:
      "The site's own frame repeated into the distance, with a green one coming forward out of the depth.",
  },
  {
    id: "trace",
    name: "Trace",
    blurb:
      "Circuit traces run in from the edge, turn at right angles and solder down at square pads, drawing themselves once.",
  },
  {
    id: "dither",
    name: "Dither",
    blurb:
      "The green glow drawn in pixels: three checkerboards ramping up out of the bottom edge, in the T-rex's language.",
  },
  {
    id: "dino",
    name: "Dino",
    blurb:
      "The pixel T-rex walks in along a hairline ground under the headline, a cell at a time, and blinks where it stops.",
  },
] as const;

export type PageHeroVariantId = (typeof PAGE_HERO_VARIANTS)[number]["id"];

export const DEFAULT_PAGE_HERO: PageHeroVariantId = "frame";

export type SiteConfig = {
  hero: HeroVariantId;
  involved: InvolvedVariantId;
  pageHero: PageHeroVariantId;
};

export const DEFAULT_CONFIG: SiteConfig = {
  hero: DEFAULT_HERO,
  involved: DEFAULT_INVOLVED,
  pageHero: DEFAULT_PAGE_HERO,
};

export function isHeroVariantId(value: unknown): value is HeroVariantId {
  return typeof value === "string" && HERO_VARIANTS.some((v) => v.id === value);
}

export function isInvolvedVariantId(value: unknown): value is InvolvedVariantId {
  return typeof value === "string" && INVOLVED_VARIANTS.some((v) => v.id === value);
}

export function isPageHeroVariantId(value: unknown): value is PageHeroVariantId {
  return typeof value === "string" && PAGE_HERO_VARIANTS.some((v) => v.id === value);
}

/** localStorage key. Bump the suffix if the shape ever changes incompatibly. */
export const CONFIG_STORAGE_KEY = "htf:config:v1";
