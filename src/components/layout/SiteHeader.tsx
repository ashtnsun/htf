import Link from "next/link";
import { getPrimaryCta, site } from "@content/site";
import { Logo } from "@/components/brand/Logo";
import { NavDrawer } from "@/components/layout/NavDrawer";
import { NavLinks } from "@/components/layout/NavLinks";
import { SplitButton } from "@/components/ui/SplitButton";

/**
 * Slim top bar: burger cell (mobile only) · logo · visible links on desktop · primary CTA as
 * a full-height split button. Sticky frosted glass so the CTA is always reachable.
 */
export function SiteHeader() {
  const cta = getPrimaryCta();
  return (
    <header className="sticky top-0 z-50 h-(--header-h) border-b border-line glass [--glass-alpha:82%]">
      <div className="flex h-full items-stretch">
        <NavDrawer cta={cta} />

        <Link
          href="/"
          className="flex items-center px-4 focus-visible:outline-offset-[-3px] sm:px-5 lg:px-6"
        >
          <Logo height={20} title="" />
          <span className="sr-only">{site.name} home</span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden items-center pr-4 lg:flex">
          <NavLinks links={site.nav} />
        </nav>

        <div className="ml-auto flex lg:ml-0">
          <SplitButton href={cta.href} size="bar" className="h-full">
            {cta.label}
          </SplitButton>
        </div>
      </div>
    </header>
  );
}
