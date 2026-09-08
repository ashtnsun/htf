import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { site } from "@content/site";
import { ConfigMenu } from "@/components/config/ConfigMenu";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

/**
 * Poppins for everything for now. The family lands in --font-poppins; globals.css maps it
 * to --font-display / --font-body so swapping to Cunia + Josefin Sans later is a token change.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image" },
};

/** Pages re-render at most hourly so the season CTA flips after the deadline without a deploy. */
export const revalidate = 3600;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior lets Next suspend the CSS smooth scrolling while it scrolls a route
    // transition (e.g. to #application-form after a form step), so the jump is instant.
    <html lang="en" className={`${poppins.variable} h-full`} data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col bg-bg font-body text-text">
        {/* Without JavaScript the reveal wrappers keep their hidden initial state; show them. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {/* Shift + M: the site configuration panel (hero variants). Saved per browser. */}
        <ConfigMenu />
        {/* Vercel Web Analytics: cookieless page views. Rendered only on Vercel builds (the
            script 404s elsewhere) and active once enabled on the Vercel project. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
