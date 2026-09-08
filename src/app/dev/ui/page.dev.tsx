import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { PixelDino } from "@/components/brand/PixelDino";
import { ProcessScene } from "@/components/home/ProcessScene";
import { BadgeGraphic } from "@/components/layout/involved/BadgeGraphic";
import { ChatGraphic } from "@/components/layout/involved/ChatGraphic";
import { TerminalGraphic } from "@/components/layout/involved/TerminalGraphic";
import { Globe } from "@/components/home/Globe";
import { Gallery } from "@/components/projects/Gallery";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { TeamGrid } from "@/components/projects/TeamGrid";
import { Accordion } from "@/components/ui/Accordion";
import { Card } from "@/components/ui/Card";
import { Chip, ChipButton } from "@/components/ui/Chip";
import { DottedMap } from "@/components/ui/DottedMap";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ChoiceField, TextAreaField, TextField } from "@/components/ui/Field";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { SectionNav } from "@/components/layout/SectionNav";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { StatTile } from "@/components/ui/StatTile";
import { TestimonialCard } from "@/components/ui/TestimonialCard";
import { AUDIENCES } from "@/lib/contact/schema";

export const metadata: Metadata = { title: "UI kit (dev)", robots: { index: false } };

/**
 * Development-only gallery of the shared primitives. The `.dev.tsx` extension is
 * only registered in `next dev` (see next.config.ts), so this route never ships.
 */

const TOKENS = [
  ["bg", "#0b0b0b"],
  ["surface", "#141414"],
  ["surface-2", "#1c1c1c"],
  ["text", "#f5f5f5"],
  ["muted", "#a3a3a3"],
  ["green", "#03c652"],
  ["green-deep", "#277d4a"],
  ["mint", "#00eb88"],
  ["cyan", "#00e0ff"],
  ["lime", "#c8ff3d"],
] as const;

/** WCAG 2.x relative luminance + contrast ratio, for the pairing table below. */
function luminance(hex: string) {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
}
function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1! + 0.05) / (l2! + 0.05);
}

const PAIRS: [string, string, string][] = [
  ["text on bg", "#f5f5f5", "#0b0b0b"],
  ["muted on bg", "#a3a3a3", "#0b0b0b"],
  ["muted on surface", "#a3a3a3", "#141414"],
  ["muted on surface-2", "#a3a3a3", "#1c1c1c"],
  ["green on bg", "#03c652", "#0b0b0b"],
  ["green on surface", "#03c652", "#141414"],
  ["mint on bg", "#00eb88", "#0b0b0b"],
  ["cyan on bg", "#00e0ff", "#0b0b0b"],
  ["bg on green (buttons)", "#0b0b0b", "#03c652"],
  ["bg on lime (arrow cell)", "#0b0b0b", "#c8ff3d"],
  ["green-deep on bg (large text only)", "#277d4a", "#0b0b0b"],
  ["white on green (do not use)", "#f5f5f5", "#03c652"],
];

/** Every Get involved variant, with the Fall 2026 deadline the badge shows. */
const INVOLVED_PROPS = {
  cta: { label: "Apply Now", href: "/apply" },
  season: { cycleName: "Fall 2026", deadline: { year: 2026, month: 9, day: 12 } },
  academicYear: "2026–27",
};
const INVOLVED_GRAPHICS = [
  ["Chat", ChatGraphic],
  ["Badge", BadgeGraphic],
  ["Terminal", TerminalGraphic],
] as const;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-12">
      <h2 className="text-eyebrow font-medium text-muted uppercase">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function UiKitPage() {
  return (
    <div className="container-max container-x py-12">
      <Eyebrow tone="green">Dev only</Eyebrow>
      <h1 className="mt-4 text-h2">UI kit</h1>
      <p className="mt-2 max-w-prose text-muted">
        Shared primitives from <code>src/components/ui</code>. This route only exists in{" "}
        <code>next dev</code>.
      </p>

      <Block title="Logo">
        <div className="flex flex-wrap items-center gap-10">
          <Logo height={20} />
          <Logo height={32} />
          <Logo height={56} />
          <span className="text-muted">
            <Logo height={32} mono />
          </span>
        </div>
      </Block>

      <Block title="Colour tokens">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {TOKENS.map(([name, hex]) => (
            <li key={name} className="border border-line p-3">
              <div className="h-12 border border-line" style={{ background: hex }} />
              <p className="mt-2 text-sm">{name}</p>
              <p className="text-xs text-muted">{hex}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Text pairings (WCAG AA: 4.5 normal, 3.0 large)">
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-2 font-medium">Pair</th>
              <th className="py-2 font-medium">Ratio</th>
              <th className="py-2 font-medium">Sample</th>
            </tr>
          </thead>
          <tbody>
            {PAIRS.map(([label, fg, bg]) => {
              const ratio = contrast(fg, bg);
              return (
                <tr key={label} className="border-t border-line">
                  <td className="py-2">{label}</td>
                  <td
                    className={ratio >= 4.5 ? "text-mint" : ratio >= 3 ? "text-lime" : "text-muted"}
                  >
                    {ratio.toFixed(2)} {ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA large" : "fail"}
                  </td>
                  <td className="py-2">
                    <span className="px-2 py-1" style={{ color: fg, background: bg }}>
                      Sample text
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Block>

      <Block title="Type scale">
        <div className="space-y-4">
          <p className="text-display-xl">Display XL 96</p>
          <p className="text-display-lg">Display LG 80</p>
          <p className="text-display">Display 64</p>
          <p className="text-h2">Heading 2 · 48</p>
          <p className="text-h3">Heading 3 · 32</p>
          <p className="text-body-lg">
            Body large 18. The quick brown fox jumps over the lazy dog.
          </p>
          <p className="text-body">Body 16. The quick brown fox jumps over the lazy dog.</p>
          <p className="text-eyebrow font-medium uppercase">Eyebrow 12 · tracked</p>
        </div>
      </Block>

      <Block title="Eyebrow">
        <div className="flex flex-wrap gap-8">
          <Eyebrow>Our projects</Eyebrow>
          <Eyebrow tone="green">Menu</Eyebrow>
          <Eyebrow tone="muted">Muted</Eyebrow>
        </div>
      </Block>

      <Block title="Headline (accent words + stagger)">
        <div className="space-y-12">
          <Headline
            as="p"
            size="display"
            stagger
            lines={["Building software for", "*nonprofits, at Purdue.*"]}
          />
          <Headline as="p" size="h2" lines={["Answers to", "*your questions.*"]} />
          <Headline as="p" size="h3" align="center" lines={["View our *work*"]} />
        </div>
      </Block>

      <Block title="SplitButton">
        <div className="flex flex-wrap items-center gap-4">
          <SplitButton href="/">Apply Now</SplitButton>
          <SplitButton href="/" variant="secondary">
            See our projects
          </SplitButton>
          <SplitButton href="/" size="lg">
            Large primary
          </SplitButton>
          <SplitButton href="https://www.instagram.com/hackthefuturepurdue/">
            External link
          </SplitButton>
          <div className="h-14 border border-line">
            <SplitButton href="/" size="bar">
              Bar (header)
            </SplitButton>
          </div>
          <SplitButton type="submit">Submit (button)</SplitButton>
          <SplitButton type="button" pending>
            Sending
          </SplitButton>
        </div>
      </Block>

      <Block title="Form fields (TextField, TextAreaField, ChoiceField; errors are cyan + icon)">
        <div className="grid max-w-2xl gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField id="kit-name" name="name" label="Name" autoComplete="name" />
            <TextField
              id="kit-email"
              name="email"
              type="email"
              label="Email"
              hint="We reply here."
              defaultValue="not-an-email"
              error="Enter a valid email address so we can reply."
            />
          </div>
          <ChoiceField
            id="kit-audience"
            name="audience"
            legend="I am"
            options={AUDIENCES}
            defaultValue="student"
          />
          <TextAreaField
            id="kit-message"
            name="message"
            label="Message"
            required={false}
            rows={3}
            hint="Optional field: the label says so."
          />
        </div>
      </Block>

      <Block title="Section (grid overlay + ghost word)">
        <Section
          grid
          ghost="Nonprofits"
          padding="sm"
          className="border border-line"
          contain={false}
        >
          <div className="px-8 py-10">
            <Eyebrow>Section</Eyebrow>
            <p className="mt-4 max-w-md text-muted">
              Grid overlay behind, ghost word centred. Use <code>grid</code>, <code>ghost</code>,{" "}
              <code>frame</code> and <code>padding</code> props.
            </p>
          </div>
        </Section>
      </Block>

      <Block title="Card + Media">
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <p className="text-body-lg">Static card</p>
            <p className="mt-2 text-sm text-muted">Surface, hairline border, square corners.</p>
          </Card>
          <Card href="/projects" padding="none" className="group">
            <div className="relative aspect-video">
              <Media
                src="projects.placeholder-project-1.cover"
                alt=""
                fill
                sizes="33vw"
                className="object-cover"
              />
            </div>
            <p className="p-5 text-sm">Linked card with placeholder media</p>
          </Card>
          <Card padding="lg" interactive>
            <p className="text-body-lg">Interactive (hover)</p>
            <p className="mt-2 text-sm text-muted">
              Corner brackets lock on, the border brightens, nothing moves.
            </p>
          </Card>
        </div>
      </Block>

      <Block title="Glass + hover-corners + frame-marks (the surface language)">
        <div className="relative overflow-hidden border border-line p-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(40%_60%_at_30%_50%,rgba(3,198,82,0.5),transparent)]"
          />
          <div className="relative grid gap-6 sm:grid-cols-3">
            <div className="border border-line glass p-6">
              <p className="text-body-lg">glass</p>
              <p className="mt-2 text-sm text-muted">
                Elevated surfaces: header, drawer, footer, tiles.
              </p>
            </div>
            <a href="#" className="hover-corners block border border-line bg-surface p-6">
              <p className="text-body-lg">hover-corners</p>
              <p className="mt-2 text-sm text-muted">Hover or focus me.</p>
            </a>
            <div className="frame-marks border border-line p-6">
              <p className="text-body-lg">frame-marks</p>
              <p className="mt-2 text-sm text-muted">
                Crosshairs at the corners of framed containers.
              </p>
            </div>
          </div>
        </div>
      </Block>

      <Block title="ProjectCard (default + featured)">
        <div className="grid gap-6 md:grid-cols-2">
          <ProjectCard
            project={{
              slug: "placeholder-project-1",
              title: "Sample project title",
              nonprofit: "Sample nonprofit",
              year: "2025–26",
              location: "Sample city, ST",
              tags: ["web", "data"],
              cover: "projects.placeholder-project-1.cover",
            }}
          />
          <ProjectCard
            size="featured"
            project={{
              slug: "placeholder-project-2",
              title: "Featured card with the taller cover",
              nonprofit: "Sample nonprofit",
              year: "2025–26",
              location: "Sample city, ST",
              tags: ["mobile"],
              cover: "projects.placeholder-project-2.cover",
            }}
          />
        </div>
      </Block>

      <Block title="TestimonialCard (grid, and the two band widths)">
        <ul className="flex flex-wrap items-stretch gap-4">
          <TestimonialCard
            layout="band"
            testimonial={{
              id: "sample-wide",
              headline: "Sample headline",
              quote:
                "Sample quote text long enough to earn the wide card. Real quotes come from content/testimonials.ts once approved.",
              name: "Sample name",
              title: "Sample title, organization",
              avatar: "avatar.placeholder",
              kind: "nonprofit",
              published: false,
            }}
          />
          <TestimonialCard
            layout="band"
            testimonial={{
              id: "sample-narrow",
              quote: "A short quote gets the narrow card.",
              name: "Sample name",
              title: "Sample role, year",
              avatar: "avatar.placeholder",
              kind: "student",
              published: false,
            }}
          />
        </ul>
      </Block>

      <Block title="DottedMap (CSS mask over public/maps/world-dots.svg)">
        <div className="grid gap-8 sm:grid-cols-2">
          <DottedMap />
          <DottedMap tone="text" className="opacity-40" />
        </div>
      </Block>

      <Block title="Accordion">
        <Accordion
          defaultOpen="a"
          items={[
            {
              id: "a",
              title: "What is Hack the Future?",
              content: <p>A student org at Purdue building software for nonprofits.</p>,
            },
            {
              id: "b",
              title: "Who can join?",
              content: <p>Open to all majors, all years, all experience levels.</p>,
            },
            {
              id: "c",
              title: "Keyboard",
              content: <p>Arrow keys move between headers; Home/End jump to the ends.</p>,
            },
          ]}
        />
      </Block>

      <Block title="StatTile (numbers count up on first view; three per row on the home page)">
        <dl className="grid gap-4 sm:grid-cols-3">
          <StatTile value="500+" label="Nonprofit pool" index={0} />
          <StatTile value="8" label="Nonprofits in 2025–26" index={1} />
          <StatTile value="1,200" label="Grouped number" index={2} />
        </dl>
      </Block>

      <Block title="ProcessScene (the dino scenes: detective, team, builder, party; the home page dissolves between them cell by cell; stills at 0, 1, 2, 3)">
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((progress) => (
            <ProcessScene
              key={progress}
              stages={["detective", "team", "builder", "party"]}
              progress={progress}
              animate={false}
            />
          ))}
        </div>
      </Block>

      <Block title="Get involved graphics (layout/involved; the Shift + M menu picks one, Plane is the default)">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {INVOLVED_GRAPHICS.map(([name, Graphic]) => (
            <div key={name}>
              <p className="text-sm text-muted">{name}</p>
              <Graphic {...INVOLVED_PROPS} />
            </div>
          ))}
        </div>
      </Block>

      <Block title="PixelDino (footer; rises into view once, blinks every 6 s)">
        <div className="max-w-[10rem]">
          <PixelDino />
        </div>
      </Block>

      <Block title="Chip + ChipButton (tags, stack, year filters)">
        <div className="flex flex-wrap items-center gap-2">
          <Chip>Web</Chip>
          <Chip>Mobile</Chip>
          <Chip selected>Selected</Chip>
          <ChipButton selected>All</ChipButton>
          <ChipButton>2025–26</ChipButton>
        </div>
      </Block>

      <Block title="Gallery (native dialog lightbox: Escape, arrows, focus restore)">
        <Gallery
          label="Sample project"
          images={[
            { src: "gallery.placeholder-1", alt: "Sample screenshot 1", caption: "With a caption" },
            { src: "gallery.placeholder-2", alt: "Sample screenshot 2" },
            { src: "gallery.placeholder-3", alt: "Sample screenshot 3" },
          ]}
        />
      </Block>

      <Block title="TeamGrid (LinkedIn link hidden when missing or TODO)">
        <TeamGrid
          members={[
            {
              name: "Sample lead",
              role: "Project Lead",
              linkedin: "https://www.linkedin.com/",
              avatar: "avatar.placeholder",
            },
            { name: "Sample developer", role: "Developer" },
            { name: "[TODO: name]", role: "Designer" },
          ]}
        />
      </Block>

      <Block title="Globe (SVG wireframe, spins unless reduced motion; pins = the partner globe's fallback)">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="max-w-xs">
            <Globe />
          </div>
          <div className="max-w-xs">
            <Globe tone="muted" animate={false} />
          </div>
          <div className="max-w-xs">
            <Globe
              spin={45}
              activePinId="gh"
              pins={[
                { id: "in", lat: 39.9, lng: -86.3 },
                { id: "uk", lat: 54, lng: -2.5 },
                { id: "gh", lat: 7.9, lng: -1 },
                { id: "bw", lat: -22.3, lng: 24.7 },
                { id: "india", lat: 22, lng: 79 },
              ]}
            />
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">
          The three.js version (land dots, drag, pin focus) lives on /nonprofits#partners and loads
          on demand.
        </p>
      </Block>

      <Block title="SectionNav (the sticky section bar under the hero on About, Students, Nonprofits)">
        <SectionNav
          label="About"
          className="static"
          items={[
            { href: "#a", label: "Mission" },
            { href: "#b", label: "Who we are" },
            { href: "#c", label: "Exec board" },
          ]}
        />
      </Block>
    </div>
  );
}
