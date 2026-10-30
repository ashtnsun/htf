import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FAMILIES } from "@content/olympus";
import { TrialLoader } from "@/components/olympus/TrialLoader";
import { roman } from "@/components/olympus/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return FAMILIES.map((_, i) => ({ family: String(i + 1) }));
}

/** One family's trial. Only the riddles leave the server; answers are checked in actions.ts. */
export default async function FamilyPage({ params }: PageProps<"/olympus/[family]">) {
  const n = Number((await params).family);
  const riddles = FAMILIES[n - 1]!.riddles.map((r) => r.riddle);
  return (
    <>
      {/* far left in the layout's logo bar (4rem tall) */}
      <div className="absolute top-0 left-0 flex h-16 items-center pl-6 md:pl-10">
        <Link
          href="/olympus"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-green"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Families
        </Link>
      </div>
      <h1 className="sr-only">Family {roman(n)}</h1>
      <TrialLoader family={n} riddles={riddles} />
    </>
  );
}
