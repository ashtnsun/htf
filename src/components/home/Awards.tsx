import type { Award } from "@/lib/content/schemas";
import { AwardCarousel } from "@/components/home/AwardCarousel";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * Awards subsection of the Impact band: a three-column record (issuer · award · date) per
 * award, stacked on phones, then the photo carousel. Reads content/awards.ts.
 */
export function Awards({ awards }: { awards: Award[] }) {
  if (awards.length === 0) return null;
  const photos = awards.flatMap((award) =>
    award.photos.map((photo) => ({
      src: photo.src,
      alt: photo.alt,
      caption: photo.caption ?? `${award.title}, ${award.issuer}`,
    })),
  );
  const cell = "py-5 align-top";

  return (
    <Reveal standalone>
      <Eyebrow>Awards</Eyebrow>
      <h3 className="mt-5 text-h3">Recognition for the program</h3>

      {/* Record table from sm up; a stacked list on phones (the hidden one is display:none). */}
      <table className="mt-8 hidden w-full border-b border-line sm:table">
        <caption className="sr-only">Awards received by Hack the Future</caption>
        <thead>
          <tr className="text-left text-eyebrow text-muted uppercase">
            <th scope="col" className="pb-4 font-medium">
              Issuer
            </th>
            <th scope="col" className="pb-4 text-center font-medium">
              Award
            </th>
            <th scope="col" className="pb-4 text-right font-medium">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {awards.map((award) => (
            <tr key={award.id} className="border-t border-line">
              <td className={`${cell} text-sm text-muted`}>{award.issuer}</td>
              <td className={`${cell} text-center font-display text-h3 font-medium text-text`}>
                {award.title}
              </td>
              <td className={`${cell} text-right text-sm tracking-[0.08em] text-muted uppercase`}>
                {award.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="mt-8 divide-y divide-line border-y border-line sm:hidden">
        {awards.map((award) => (
          <li key={award.id} className="py-5">
            <p className="text-sm text-muted">{award.issuer}</p>
            <p className="mt-1 font-display text-h3 font-medium text-text">{award.title}</p>
            <p className="mt-1 text-xs tracking-[0.08em] text-muted uppercase">{award.date}</p>
          </li>
        ))}
      </ul>

      {photos.length > 0 ? <AwardCarousel photos={photos} /> : null}
    </Reveal>
  );
}
