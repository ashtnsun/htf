import { FAMILIES } from "@content/olympus";
import { CrawlLoader } from "@/components/olympus/crawl/CrawlLoader";
import { keyedSquare, signalOn } from "@/components/olympus/crawl/square";
import { roman } from "@/components/olympus/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return FAMILIES.map((_, i) => ({ family: String(i + 1) }));
}

/**
 * One family's tomb. The riddles leave the server, and the fires' counts, which spell nothing
 * without the seal word (components/olympus/crawl/square); every answer is checked in actions.ts.
 */
export default async function TombPage({ params }: PageProps<"/olympus3/[family]">) {
  const n = Number((await params).family);
  const f = FAMILIES[n - 1]!;
  return (
    <>
      <h1 className="sr-only">Group {roman(n)}</h1>
      <CrawlLoader
        family={n}
        riddles={f.riddles.map((r) => r.riddle)}
        signal={signalOn(f.doorWord, keyedSquare(f.seal))}
      />
    </>
  );
}
