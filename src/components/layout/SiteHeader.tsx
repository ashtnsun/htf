import Link from "next/link";
import { getPrimaryCta, site } from "@content/site";
import { Logo } from "@/components/brand/Logo";
import { NavDrawer } from "@/components/layout/NavDrawer";
import { NavLinks } from "@/components/layout/NavLinks";
import { SplitButton } from "@/components/ui/SplitButton";

/**
 * Slim top bar: burger cell (mobile only) · logo · the links centred in the bar on desktop ·
 * primary CTA as a full-height split button on the right. Sticky, lightly frosted glass so
 * the page shows through and the CTA is always reachable.
 */
export function SiteHeader() {
  const cta = getPrimaryCta();
  return (
    <header className="sticky top-0 z-50 h-(--header-h) glass [--glass-alpha:50%] [--glass-edge:0]">
      <div className="flex h-full items-stretch lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex items-stretch">
          <NavDrawer cta={cta} />
          <Link
            href="/"
            className="flex items-center px-4 focus-visible:outline-offset-[-3px] sm:px-5 lg:px-6"
          >
            <Logo height={20} title="" />
            <span className="sr-only">{site.name} home</span>
          </Link>
        </div>

        <nav aria-label="Primary" className="hidden items-center lg:flex">
          <NavLinks links={site.nav} />
        </nav>

        <div className="ml-auto flex lg:ml-0 lg:justify-self-end">
          <SplitButton href={cta.href} size="bar" className="h-full">
            {cta.label}
          </SplitButton>
        </div>
      </div>
    </header>
  );
}
