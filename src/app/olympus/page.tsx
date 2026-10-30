import Link from "next/link";
import { FAMILIES } from "@content/olympus";
import { roman } from "@/components/olympus/shared";

/** /olympus: pick your family. The numbers say nothing about the god behind them. */
export default function OlympusPage() {
  return (
    <>
      <h1 className="text-center font-olympus text-[2.5rem] leading-tight font-semibold sm:text-h2">
        Who is your <span className="text-green">god</span>?
      </h1>
      <p className="mt-4 text-center text-body-lg text-muted">Choose your group to begin.</p>
      <ol className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
        {FAMILIES.map((_, i) => (
          <li key={i}>
            <Link
              href={`/olympus/${i + 1}`}
              aria-label={`Family ${roman(i + 1)}`}
              className="hover-corners flex aspect-square items-center justify-center border border-line bg-surface font-olympus text-h3 font-semibold transition-colors hover:border-line-strong hover:bg-surface-2 sm:text-display"
            >
              {roman(i + 1)}
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
