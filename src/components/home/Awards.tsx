import type { Award } from "@/lib/content/schemas";
import { AwardCarousel } from "@/components/home/AwardCarousel";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * Awards: a three-column record (issuer · award · date) per award, stacked on phones, then
 * the photo carousel. A subsection of the Impact band on the home page and a section of
 * its own on /about. Reads content/awards.ts.
 */
type AwardsProps = {
  awards: Award[];
  /** h3 inside the Impact band on the home page; h2 as its own section on /about. */
  headingLevel?: "h2" | "h3";
  id?: string;
};

export function Awards({ awards, headingLevel = "h3", id }: AwardsProps) {
  if (awards.length === 0) return null;
  const Heading = headingLevel;
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
      <Heading id={id} className={headingLevel === "h2" ? "mt-5 text-h2" : "mt-5 text-h3"}>
        Recognition for the program
      </Heading>

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
