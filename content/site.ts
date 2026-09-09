/**
 * Site-wide configuration. Every CTA, nav item and footer column reads from here.
 * Fields marked TODO are for the design director to fill; the UI hides TODO links.
 */

export type NavLink = { label: string; href: string; external?: boolean };

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const site = {
  name: "Hack the Future",
  shortName: "HTF",
  legalName: "Hack the Future Purdue",
  tagline: "Transforming Nonprofits with Technology",
  description:
    "Hack the Future is a student organization at Purdue University that builds software for nonprofits around the world.",
  url: siteUrl,
  /** Academic year shown in the hero corner (replaces the template's "© 2025"). */
  academicYear: "2026–27",
  socials: {
    instagram: "https://www.instagram.com/hackthefuturepurdue/",
    instagramHandle: "@hackthefuturepurdue",
    // TODO(ashton): confirm; found by searching for the club's LinkedIn company page.
    linkedin: "https://www.linkedin.com/company/hack-the-future-at-purdue",
    email: "TODO: club contact email",
  },
  season: {
    isApplicationSeason: true,
    /**
     * The Google Form applicants fill in this cycle: the form's "viewform" link (Send →
     * link). /apply embeds it (`getApplyForm` adds `embedded=true`) and links to it for
     * anyone whose browser will not show the frame. While it is a TODO, /apply shows the
     * visible TODO and sends people to `applyFallbackUrl` instead. Applications go through
     * Google Forms since 2026-09-09; the in-house portal is parked under parked/ (see
     * parked/README.md).
     */
    applyFormUrl: "TODO: Fall 2026 Google Form link (…/viewform)",
    /** Where Apply sends people while the form link is a TODO: the profile whose bio links it. */
    applyFallbackUrl: "https://www.instagram.com/hackthefuturepurdue/",
    // TODO(ashton): confirm this cycle's deadline. ISO 8601 with offset (Eastern time).
    closesAt: "2026-09-12T23:59:00-04:00",
    cycleName: "Fall 2026",
    timeZone: "America/Indiana/Indianapolis",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "About", href: "/about" },
    { label: "Students", href: "/students" },
    { label: "Nonprofits", href: "/nonprofits" },
  ] satisfies NavLink[],
  footer: {
    explore: [
      { label: "Home", href: "/" },
      { label: "Projects", href: "/projects" },
      { label: "About", href: "/about" },
    ] satisfies NavLink[],
    legal: [{ label: "Privacy", href: "/privacy" }] satisfies NavLink[],
  },
} as const;

export type Site = typeof site;
export type Season = typeof site.season;

/** True while applications are open: the flag is on AND the deadline has not passed. */
export function isInSeason(now: Date = new Date()): boolean {
  const { isApplicationSeason, closesAt } = site.season;
  return isApplicationSeason && now.getTime() < new Date(closesAt).getTime();
}

/** The one primary call-to-action used everywhere (nav, hero, role rows, footer). */
export function getPrimaryCta(now: Date = new Date()): { label: string; href: string } {
  if (isInSeason(now)) {
    return { label: "Apply Now", href: "/apply" };
  }
  return { label: "Contact Us", href: "/contact" };
}

/**
 * This cycle's application form: the link to open it and the URL that embeds it on /apply.
 * Null while `season.applyFormUrl` is still a TODO.
 */
export function getApplyForm(): { url: string; embedUrl: string } | null {
  const url = site.season.applyFormUrl;
  if (url.startsWith("TODO")) return null;
  const embed = new URL(url);
  embed.searchParams.set("embedded", "true");
  return { url, embedUrl: embed.toString() };
}

/** "Sep 12, 11:59 PM" in the club's time zone, for deadline notices. Null when out of season. */
export function formatDeadline(now: Date = new Date()): string | null {
  if (!isInSeason(now)) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: site.season.timeZone,
  }).format(new Date(site.season.closesAt));
}

/**
 * The deadline as calendar parts in the club's time zone (the Get involved calendar
 * graphic). `month` is 1–12. Null out of season.
 */
export function getDeadlineParts(
  now: Date = new Date(),
): { year: number; month: number; day: number } | null {
  if (!isInSeason(now)) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: site.season.timeZone,
  }).formatToParts(new Date(site.season.closesAt));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}
