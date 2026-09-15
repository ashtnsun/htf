import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";

type Panel = {
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
};

const PANELS: readonly Panel[] = [
  {
    eyebrow: "Students",
    title: "Ship real software for a real client.",
    copy: "Join a small team for the school year as a project lead, developer or designer. Open to all majors, all years and all levels of experience.",
    href: "/students",
  },
  {
    eyebrow: "Nonprofits",
    title: "Get the tool your team needs.",
    copy: "Bring us a problem. A student team scopes it with you, builds it over the school year and hands it off free of charge.",
    href: "/nonprofits",
  },
];

type WhoWeServeProps = {
  id?: string;
  eyebrow?: string;
  /** Headline lines; *asterisks* mark the green words. */
  lines?: string[];
};

/**
 * Two panels, one per audience, so a first-time visitor finds their page in one click. The
 * "Learn more" hand-off closes every page that is not itself one of the two audiences: home,
 * /about and /projects all render it with the defaults (the eyebrow alone, no headline, since
 * the 2026-09-10 copy pass); /students and /nonprofits do not, since one panel would point at
 * the page you are on. Each panel is one link in a full-bleed hairline row (the same row as
 * "What we do", framed by vertical rails): eyebrow, title, one sentence and a "Learn more"
 * button (a pixel picture above the eyebrow came and went in the 2026-09-09 reviews).
 * Hovering the panel turns the title green and puts the button in its hover state (green
 * border, the arrow cell fills), the treatment the project cards use; nothing moves. The two
 * panels share their row tracks (subgrid), so every line sits at the same height in both, and
 * they carry the site's card inset (`md:p-8`) so their copy starts on the same left edge as
 * the "What we do" row above them on the home page.
 * `eyebrow` and `lines` stay props for a page that ever needs its own framing.
 */
export function WhoWeServe({
  id = "who-we-serve",
  eyebrow = "Learn more",
  lines,
}: WhoWeServeProps) {
  const titleId = `${id}-title`;
  // Without a headline (the home page since the 2026-09-10 copy pass) the eyebrow is the
  // section heading, so the section keeps its label and the heading order stays intact.
  const hasHeadline = lines !== undefined && lines.length > 0;
  return (
    <Section id={id} aria-labelledby={titleId} contain={false} className="border-t border-line">
      <div className="container-max container-x">
        <Reveal standalone>
          <Eyebrow as={hasHeadline ? "p" : "h2"} id={hasHeadline ? undefined : titleId}>
            {eyebrow}
          </Eyebrow>
          {hasHeadline ? (
            <Headline as="h2" id={titleId} size="h2" lines={lines} className="mt-5" />
          ) : null}
        </Reveal>
      </div>
      <Reveal standalone delay={0.1} className="mt-10">
        <ul className="grid border-y border-line md:bleed-row-2 md:grid-rows-[auto_auto_minmax(0,1fr)_auto]">
          {PANELS.map((panel) => (
            <li
              key={panel.href}
              className="border-b border-line last:border-b-0 md:row-span-4 md:grid md:grid-rows-subgrid md:border-r md:border-b-0 md:first:col-start-2 md:first:border-l"
            >
              <Link
                href={panel.href}
                className="group flex h-full flex-col px-(--gutter) py-8 text-text md:row-span-4 md:grid md:grid-rows-subgrid md:p-8"
              >
                <Eyebrow tone="green">{panel.eyebrow}</Eyebrow>
                <h3 className="mt-4 max-w-md text-h3 transition-colors group-hover:text-green md:mt-5">
                  {panel.title}
                </h3>
                <p className="mt-3 max-w-md text-muted">{panel.copy}</p>
                <span className="mt-8 flex md:mt-10">
                  <SplitButton presentational variant="secondary">
                    Learn more
                  </SplitButton>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
