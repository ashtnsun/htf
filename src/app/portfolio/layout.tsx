import type { Metadata } from "next";
import { Suspense } from "react";
import { PortfolioSidebar } from "@/components/portfolio/PortfolioSidebar";

export const metadata: Metadata = {
  title: { default: "Portfolio Night", template: "%s · Portfolio Night" },
  description:
    "Hack the Future's Portfolio Night: portfolios to learn from, the ones the room is building, and a board of everyone's goals for the night.",
};

/** Portfolio Night: the side menu and the section beside it. No site header or footer. */
export default function PortfolioLayout({ children }: LayoutProps<"/portfolio">) {
  return (
    <div className="lg:pl-64">
      <Suspense>
        <PortfolioSidebar />
      </Suspense>
      {children}
    </div>
  );
}
