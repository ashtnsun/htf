import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { site } from "@content/site";
import { INTRO_SCRIPT } from "@/components/home/intro-script";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
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
  // No title template: a tab reads as the page's own name ("Projects", "About"), and only
  // the home page carries the org name. Every route sets its own `title`.
  title: site.name,
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.name,
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
    <html
      lang="en"
      className={`${poppins.variable} h-full`}
      data-scroll-behavior="smooth"
      // The page transition (app/template.tsx): React hides the root snapshot unless <html>
      // names it itself, and then only the page's sections in view animate while the footer,
      // the page background and anything scrolled past cut instantly. With the name here the
      // whole viewport under the header crossfades on the page's clock (globals.css).
      style={{ viewTransitionName: "root" }}
      // The intro script below sets data-intro on <html> before hydration.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-bg font-body text-text">
        {/* Before first paint: whether the home intro plays (components/home/HomeIntro). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
        {/* Without JavaScript the reveal wrappers keep their hidden initial state; show them. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}img[data-media]{opacity:1!important}`}</style>
        </noscript>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {/* the green hairline along the top edge while a page is still on its way */}
        <NavigationProgress />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {/* Vercel Web Analytics: cookieless page views. Rendered only on Vercel builds (the
            script 404s elsewhere) and active once enabled on the Vercel project. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
