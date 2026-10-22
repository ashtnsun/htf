import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Logo } from "@/components/brand/Logo";
import { AddPortfolio } from "@/components/portfolio/AddPortfolio";
import { HostRowActions, HostSignIn } from "@/components/portfolio/HostControls";
import { Offline } from "@/components/portfolio/PortfolioPage";
import { getPortfolioEnv, listPortfolios } from "@/lib/portfolio/db";
import { isHost, isHostConfigured } from "@/lib/portfolio/session";
import { displayUrl, type Portfolio } from "@/lib/portfolio/shared";
import { addReferencePortfolio, hostSignOut } from "../portfolio/actions";

export const metadata: Metadata = {
  title: "Portfolio Night host",
  robots: { index: false, follow: false },
};

/**
 * The host's side of Portfolio Night: sign in with PORTFOLIO_HOST_PASSWORD, add the reference
 * portfolios, and take down anything in either grid. Notes on the goals board are removed on
 * the board itself while signed in here.
 */
export default async function PortfolioHostPage() {
  await connection();
  const host = await isHost();
  const ready = getPortfolioEnv() !== null && isHostConfigured();
  const lists = host && ready ? await loadBoth() : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 lg:py-16">
      <Link href="/portfolio" className="inline-block" aria-label="Portfolio Night">
        <Logo height={16} title="" />
      </Link>
      <div className="mt-6 mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-lg font-medium text-text">Portfolio Night host</h1>
        {host ? (
          <div className="flex items-center gap-5 text-sm">
            <Link href="/portfolio" className="text-muted transition-colors hover:text-text">
              View the page
            </Link>
            <form action={hostSignOut}>
              <button
                type="submit"
                className="min-h-11 text-muted transition-colors hover:text-text"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {!ready ? (
        <p className="text-sm text-muted">
          Set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and PORTFOLIO_HOST_PASSWORD
          to use this page.
        </p>
      ) : !host ? (
        <HostSignIn />
      ) : !lists ? (
        <Offline />
      ) : (
        <div className="grid gap-14">
          <section aria-labelledby="add-reference">
            <h2 id="add-reference" className="mb-4 text-sm font-medium text-text">
              Add a reference portfolio
            </h2>
            <AddPortfolio action={addReferencePortfolio} nameLabel="Title" alwaysOpen />
          </section>
          <HostList
            id="reference"
            title="Reference"
            items={lists.reference}
            empty="None yet. Add the first one above."
            recapture
          />
          <HostList
            id="community"
            title="Community"
            items={lists.community}
            empty="Nobody has added one yet."
            recapture
          />
          <p className="text-sm text-muted">
            To take a note off the goals board, open{" "}
            <Link href="/portfolio/goals" className="font-medium text-green hover:text-text">
              Goals
            </Link>{" "}
            while signed in here, select the note and remove it.
          </p>
        </div>
      )}
    </div>
  );
}

async function loadBoth() {
  try {
    const [reference, community] = await Promise.all([
      listPortfolios("reference"),
      listPortfolios("community"),
    ]);
    return { reference, community };
  } catch (error) {
    console.error(error);
    return null;
  }
}

function HostList({
  id,
  title,
  items,
  empty,
  recapture = false,
}: {
  id: string;
  title: string;
  items: Portfolio[];
  empty: string;
  recapture?: boolean;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-2 text-sm font-medium text-text">
        {title} <span className="font-normal text-muted">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <div className="relative aspect-[16/10] w-24 shrink-0 overflow-hidden border border-line">
                {item.screenshot_url ? (
                  <Image
                    src={item.screenshot_url}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover object-top"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text">{item.title}</p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm text-muted transition-colors hover:text-green"
                >
                  {displayUrl(item.url)}
                </a>
              </div>
              <HostRowActions id={item.id} title={item.title} recapture={recapture} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
