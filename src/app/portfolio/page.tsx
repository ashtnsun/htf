import type { Metadata } from "next";
import { Suspense } from "react";
import { Offline, PortfolioPage } from "@/components/portfolio/PortfolioPage";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { loadPortfolios } from "@/lib/portfolio/load";

export const metadata: Metadata = {
  title: { absolute: "Portfolio Night" },
  alternates: { canonical: "/portfolio" },
};

/** Portfolio Night opens on the reference grid: portfolios the host picked (/portfoliohost). */
export default async function ReferencePage() {
  const items = await loadPortfolios("reference");
  return (
    <PortfolioPage
      title="Reference"
      blurb="Portfolios we picked to learn from. Open one, notice what it does well, take that back to yours."
    >
      {items ? (
        <Suspense>
          <PortfolioGrid items={items} empty="The hosts are still picking. Check back soon." />
        </Suspense>
      ) : (
        <Offline />
      )}
    </PortfolioPage>
  );
}
