import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FAMILIES } from "@content/olympuz";
import { TrialLoader } from "@/components/olympuz/TrialLoader";
import { roman } from "@/components/olympus/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return FAMILIES.map((_, i) => ({ family: String(i + 1) }));
}

/** The /olympuz snapshot: one family's trial. Answers are checked in app/archive/olympuz/actions.ts. */
export default async function FamilyPage({ params }: { params: Promise<{ family: string }> }) {
  const n = Number((await params).family);
  const riddles = FAMILIES[n - 1]!.riddles.map((r) => r.riddle);
  return (
    <>
      {/* far left in the layout's logo bar (4rem tall) */}
      <div className="absolute top-0 left-0 flex h-16 items-center pl-6 md:pl-10">
        <Link
          href="/archive/olympuz"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-green"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Families
        </Link>
      </div>
      {/* far right in the same bar */}
      <h1 className="absolute top-0 right-0 flex h-16 items-center gap-2 pr-6 font-olympus text-base font-semibold md:pr-10">
        <span className="text-muted">Group</span> {roman(n)}
      </h1>
      <TrialLoader family={n} riddles={riddles} />
    </>
  );
}
