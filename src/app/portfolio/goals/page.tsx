import type { Metadata } from "next";
import { connection } from "next/server";
import { GoalsBoard } from "@/components/portfolio/goals/GoalsBoard";
import { Offline, PortfolioPage } from "@/components/portfolio/PortfolioPage";
import { getPortfolioEnv, listGoals } from "@/lib/portfolio/db";
import { isHost, ownerHash } from "@/lib/portfolio/session";

export const metadata: Metadata = {
  title: "Goals",
  alternates: { canonical: "/portfolio/goals" },
};

/** The goals board: everyone's sticky notes, live. */
export default async function GoalsPage() {
  await connection();
  const env = getPortfolioEnv();
  const goals = env
    ? await listGoals(await ownerHash()).catch((error: unknown) => {
        console.error(error);
        return null;
      })
    : null;

  if (!env || !goals) {
    return (
      <PortfolioPage title="Goals" blurb="One goal for tonight, on a sticky note.">
        <Offline />
      </PortfolioPage>
    );
  }
  return (
    <GoalsBoard
      initial={goals}
      realtime={{ url: env.url, anonKey: env.anonKey }}
      host={await isHost()}
    />
  );
}
