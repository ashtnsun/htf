import type { Metadata } from "next";
import { Suspense } from "react";
import { AddPortfolio } from "@/components/portfolio/AddPortfolio";
import { Offline, PortfolioPage } from "@/components/portfolio/PortfolioPage";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { loadPortfolios } from "@/lib/portfolio/load";
import { addCommunityPortfolio } from "../actions";

export const metadata: Metadata = {
  title: "Community",
  alternates: { canonical: "/portfolio/community" },
};

/** Portfolios anyone in the room adds: their own, or one they like. Newest first. */
export default async function CommunityPage() {
  const items = await loadPortfolios("community");
  return (
    <PortfolioPage
      title="Community"
      blurb="Portfolios from the room. Add yours, or one you think everyone should see."
    >
      {items ? (
        <Suspense>
          <PortfolioGrid
            items={items}
            lead={<AddPortfolio action={addCommunityPortfolio} nameLabel="Whose is it?" />}
            empty="No portfolios yet."
          />
        </Suspense>
      ) : (
        <Offline />
      )}
    </PortfolioPage>
  );
}
