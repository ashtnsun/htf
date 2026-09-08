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

/**
 * The Get involved graphic (layout/ContactCta, at the foot of the home, About, Projects and
 * Students pages). Every variant is a recognizable object that says "start here" in its own
 * way; none uses the viewfinder corner brackets.
 */
export const INVOLVED_VARIANTS = [
  {
    id: "plane",
    name: "Plane",
    blurb: "A paper plane flies its dotted path when the section comes into view. As it is today.",
  },
  {
    id: "door",
    name: "Door",
    blurb: "An open door with the light on inside. It swings wider when the pointer comes near.",
  },
  {
    id: "puzzle",
    name: "Puzzle",
    blurb: "Two jigsaw pieces, Students and Nonprofits, slide together and lock at the seam.",
  },
  {
    id: "canvas",
    name: "Canvas",
    blurb: "A shared design canvas: a student's and a nonprofit's cursors at work on one screen.",
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
  {
    id: "calendar",
    name: "Calendar",
    blurb: "The month of the application deadline, with the day marked in green and ringed.",
  },
  {
    id: "terminal",
    name: "Terminal",
    blurb: "A command line types out htf apply and reports back. For the developers.",
  },
  {
    id: "keycap",
    name: "Keycap",
    blurb: "One big Enter key. It presses itself on view, and again for the pointer.",
  },
  {
    id: "signpost",
    name: "Signpost",
    blurb: "A signpost with two arms, Students one way and Nonprofits the other. Both start here.",
  },
] as const;

export type InvolvedVariantId = (typeof INVOLVED_VARIANTS)[number]["id"];

export const DEFAULT_INVOLVED: InvolvedVariantId = "plane";

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
