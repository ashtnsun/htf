import "./letters.css";
import type { Metadata } from "next";
import { CLUE, FAMILIES } from "@content/olympus";
import { Meander } from "@/components/olympus/Meander";
import { Seal } from "@/components/olympus/journey/Seal";
import { roman } from "@/components/olympus/shared";

export const metadata: Metadata = { title: "The herald's letters" };

/**
 * The herald's letters for step V, to print: one A4 sheet per group, folded in three as a Z
 * (back along the first mark, forward along the second) so the address and the seal face out.
 * Inside: the clue to the fires and the group's seal word, which the family types on the
 * laptop. Dev only since 2026-11-03: print them from `pnpm dev`, because a deployed page would show
 * every seal word to anyone with the URL.
 */
export default function LettersPage() {
  return (
    <>
      <div className="letters-screen mb-10 text-center">
        <h1 className="font-olympus text-h3 font-semibold">The herald’s letters</h1>
        <p className="mt-3 text-sm text-muted">
          Print on A4 at 100%, no margins, background graphics on. Fold back along the first mark
          and forward along the second, so the address faces out.
        </p>
      </div>

      <div className="letters">
        {FAMILIES.map((family, i) => (
          <article key={family.seal} className="letter font-olympus">
            {/* Outside: the address and the seal. */}
            <section className="letter-panel">
              <div className="absolute inset-x-[22mm] top-[10mm] text-(--accent)">
                <Meander cell={1.5} />
              </div>
              <p className="text-[9pt] font-semibold tracking-[0.3em] text-(--ink-soft) uppercase">
                A letter from the herald
              </p>
              <p className="text-[34pt] leading-none font-semibold">
                <span className="text-[16pt] tracking-[0.15em] text-(--ink-soft)">Group </span>
                {roman(i + 1)}
              </p>
              <Seal cell={6} mono className="text-(--accent)" />
              <p className="font-oracle text-[12pt] text-(--ink-soft) italic">
                Break no seal but your own.
              </p>
              <div className="absolute inset-x-[22mm] bottom-[10mm] text-(--accent)">
                <Meander cell={1.5} />
              </div>
            </section>

            {/* Inside: the clue, then the seal word. */}
            <section className="letter-panel">
              <p className="text-[9pt] font-semibold tracking-[0.3em] text-(--ink-soft) uppercase">
                The herald brings word
              </p>
              <p className="max-w-[140mm] text-[20pt] leading-snug font-semibold tracking-[0.08em] uppercase">
                {CLUE}
              </p>
            </section>

            <section className="letter-panel">
              <p className="text-[9pt] font-semibold tracking-[0.3em] text-(--ink-soft) uppercase">
                The seal
              </p>
              <p className="text-[40pt] leading-none font-semibold tracking-[0.15em] text-(--accent)">
                {family.seal}
              </p>
              <div className="mt-4 w-[60mm] text-(--accent)">
                <Meander cell={1.5} />
              </div>
            </section>

            <div className="letter-fold" style={{ top: "99mm" }} />
            <div className="letter-fold" style={{ top: "198mm" }} />
          </article>
        ))}
      </div>
    </>
  );
}
