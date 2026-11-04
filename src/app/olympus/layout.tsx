import type { Metadata } from "next";
import { cinzel, cormorant } from "@/components/olympus/fonts";
import { Passage } from "@/components/olympus/Passage";

export const metadata: Metadata = {
  title: "Olympus",
  description: "Hack the Future's family reveal: walk the tomb and meet your god.",
  robots: { index: false, follow: false },
};

/** The family reveal as a game: an event page, no site header or footer. */
export default function OlympusLayout({ children }: LayoutProps<"/olympus">) {
  return (
    <div className={`${cinzel.variable} ${cormorant.variable} relative`}>
      {children}
      <Passage />
    </div>
  );
}
