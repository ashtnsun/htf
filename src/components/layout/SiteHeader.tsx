import Link from "next/link";
import { getPrimaryCta, site } from "@content/site";
import { Logo } from "@/components/brand/Logo";
import { NavDrawer } from "@/components/layout/NavDrawer";
import { NavLinks } from "@/components/layout/NavLinks";
import { SplitButton } from "@/components/ui/SplitButton";

/**
 * Slim top bar, after the Framer prototype: burger cell (mobile only) · logo | tagline ·
 * visible links on desktop · primary CTA as a full-height split button.
 * Sticky with a blurred backdrop so the CTA is always reachable.
 */
export function SiteHeader() {
  const cta = getPrimaryCta();
  return (
    <header className="sticky top-0 z-50 h-(--header-h) border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="flex h-full items-stretch">
        <NavDrawer cta={cta} />

        <Link
          href="/"
          className="flex items-center gap-3 px-4 focus-visible:outline-offset-[-3px] sm:px-5 lg:px-6"
        >
          <Logo height={20} title="" />
          <span className="sr-only">{site.name} home</span>
          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-line-strong sm:block lg:hidden xl:block"
          />
          <span className="hidden text-xs text-muted sm:block md:text-[0.8125rem] lg:hidden xl:block">
            {site.tagline}
          </span>
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
