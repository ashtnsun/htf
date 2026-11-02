import type { Metadata } from "next";
import { cinzel, cormorant } from "@/components/olympus/fonts";

export const metadata: Metadata = {
  title: "The Prologue",
  description: "The slides for Hack the Future's family reveal.",
  robots: { index: false, follow: false },
};

/** The family reveal's slides: an event page with no site header or footer (layout/SiteChrome). */
export default function PrologueLayout({ children }: LayoutProps<"/prologue">) {
  return <div className={`${cinzel.variable} ${cormorant.variable}`}>{children}</div>;
}
