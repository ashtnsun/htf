import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Meander } from "@/components/olympus/Meander";

export const metadata: Metadata = {
  title: "Olympus",
  description: "Hack the Future's family reveal: solve your riddles and meet your god.",
  robots: { index: false, follow: false },
};

/**
 * The family reveal: an event page, not part of the site (not in the navigation or the
 * sitemap, no site header or footer). The logo goes home; the Greek key runs under it.
 */
export default function OlympusLayout({ children }: LayoutProps<"/olympus">) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <div className="container-max flex h-16 items-center container-x">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo height={20} />
        </Link>
      </div>
      <Meander className="text-green-deep" />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col container-x py-12 md:py-20">
        {children}
      </div>
    </div>
  );
}
