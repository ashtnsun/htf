import { site } from "@content/site";

/**
 * Date formatting for the portal, in the club's time zone so the server and the browser
 * render the same text (no hydration mismatch). No server-only import: the application
 * form's client side shows "Saved 1:02 PM" with the same formatter.
 */

const portalDateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: site.season.timeZone,
});

const portalTimeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: site.season.timeZone,
});

/** "Sep 6, 3:14 PM" for saved / submitted timestamps and deadlines. */
export function formatPortalDate(iso: string | Date): string {
  return portalDateFormat.format(typeof iso === "string" ? new Date(iso) : iso);
}

/** "3:14 PM" for the autosave line. */
export function formatPortalTime(iso: string | Date): string {
  return portalTimeFormat.format(typeof iso === "string" ? new Date(iso) : iso);
}

/** "Sep 12, 11:59 PM" in the club's time zone. */
export function formatCycleDeadline(cycle: { closes_at: string }): string {
  return formatPortalDate(cycle.closes_at);
}
