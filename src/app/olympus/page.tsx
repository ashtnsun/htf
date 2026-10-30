import Link from "next/link";
import { FAMILIES } from "@content/olympus";
import { roman } from "@/components/olympus/shared";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";

/** /olympus: pick your family. The numbers say nothing about the god behind them. */
export default function OlympusPage() {
  return (
    <>
      <Eyebrow>Family reveal</Eyebrow>
      <Headline as="h1" size="h2" lines={["Who is your *god*?"]} className="mt-4" />
      <p className="mt-4 text-body-lg text-muted">Choose your family to begin.</p>
      <ol className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
        {FAMILIES.map((_, i) => (
          <li key={i}>
            <Link
              href={`/olympus/${i + 1}`}
              aria-label={`Family ${roman(i + 1)}`}
              className="hover-corners flex aspect-square items-center justify-center border border-line bg-surface font-display text-h3 font-medium transition-colors hover:border-line-strong hover:bg-surface-2 sm:text-display"
            >
              {roman(i + 1)}
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
