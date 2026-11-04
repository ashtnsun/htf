import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { cinzel, cormorant } from "@/components/olympus/fonts";
import { Meander } from "@/components/olympus/Meander";
import { Passage } from "@/components/olympus/Passage";

export const metadata: Metadata = {
  title: "Olympus (snapshot)",
  description: "Hack the Future's family reveal: solve your riddles and meet your god.",
  robots: { index: false, follow: false },
};

/**
 * The /archive/olympuz snapshot (2026-10-31). Its pages exist in `next dev` only. The family reveal: an event page, not part of the site (not in the navigation or the
 * sitemap, no site header or footer). The logo goes home; the Greek key runs under it.
 */
export default function OlympusLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${cinzel.variable} ${cormorant.variable} relative flex min-h-dvh flex-col overflow-x-clip`}
    >
      <div className="temple-after container-max flex h-16 items-center container-x">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo height={20} />
        </Link>
      </div>
      <Meander className="temple-after text-green-deep" />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col container-x py-12 md:py-20">
        {children}
      </div>
      <Passage />
    </div>
  );
}
