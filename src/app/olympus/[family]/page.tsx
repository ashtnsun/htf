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
      <Link
        href="/olympus"
        className="inline-flex min-h-11 items-center gap-2 self-start text-sm text-muted transition-colors hover:text-green"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Families
      </Link>
      <h1 className="mt-6 flex flex-col">
        <span className="text-eyebrow font-medium text-muted uppercase">Family </span>
        <span className="font-display text-display leading-none font-medium">{roman(n)}</span>
      </h1>
      <TrialLoader family={n} riddles={riddles} />
    </>
  );
}
