import type { SVGProps } from "react";

/* lucide 1.x dropped brand icons, so these two are drawn here. 24px grid, stroke-based to match lucide. */

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3a1.98 1.98 0 1 0 0 3.96 1.98 1.98 0 0 0 0-3.96ZM20.5 13.2c0-3.3-1.76-4.94-4.1-4.94-1.9 0-2.75 1.04-3.22 1.78V8.5H9.8c.04.98 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.69.12-.93.28-.69.9-1.4 1.95-1.4 1.37 0 1.92 1.05 1.92 2.58V20h3.33v-6.8Z" />
    </svg>
  );
}
