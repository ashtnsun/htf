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
    linkedin: "TODO: LinkedIn page URL",
    email: "TODO: club contact email",
  },
  season: {
    isApplicationSeason: true,
    // TODO(ashton): replace with the Fall 2026 application form URL. Until then the CTA
    // sends people to the Instagram profile, where the form link lives in the bio.
    applyUrl: "https://www.instagram.com/hackthefuturepurdue/",
    // TODO(ashton): confirm this cycle's deadline. ISO 8601 with offset (Eastern time).
    closesAt: "2026-09-12T23:59:00-04:00",
    cycleName: "Fall 2026",
    timeZone: "America/Indiana/Indianapolis",
  },
  nav: [
    { label: "Projects", href: "/projects" },
    { label: "About", href: "/about" },
    { label: "Students", href: "/students" },
    { label: "Non-profits", href: "/nonprofits" },
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

/** Where /apply sends people while the external form is in use. */
export function getApplyDestination(): string {
  return site.season.applyUrl;
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
