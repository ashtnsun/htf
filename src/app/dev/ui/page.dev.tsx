import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { Globe } from "@/components/home/Globe";
import { Accordion } from "@/components/ui/Accordion";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Headline } from "@/components/ui/Headline";
import { Media } from "@/components/ui/Media";
import { Section } from "@/components/ui/Section";
import { SplitButton } from "@/components/ui/SplitButton";
import { StatTile } from "@/components/ui/StatTile";

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
            <li key={name} className="rounded-md border border-line p-3">
              <div className="h-12 rounded-sm border border-line" style={{ background: hex }} />
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
                    <span className="rounded-sm px-2 py-1" style={{ color: fg, background: bg }}>
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
        </div>
      </Block>

      <Block title="Section (grid overlay + ghost word)">
        <Section
          grid
          ghost="Non-profits"
          padding="sm"
          className="rounded-md border border-line"
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
            <p className="mt-2 text-sm text-muted">Surface, hairline border, 8px radius.</p>
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
          </Card>
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

      <Block title="StatTile">
        <dl className="grid gap-4 sm:grid-cols-4">
          <StatTile value="500+" label="Nonprofit pool" />
          <StatTile value="8" label="Nonprofits in 2025–26" />
          <StatTile value="4" label="U.S. states" />
          <StatTile value="4" label="Countries" />
        </dl>
      </Block>

      <Block title="Globe (SVG wireframe, spins unless reduced motion)">
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="max-w-xs">
            <Globe />
          </div>
          <div className="max-w-xs">
            <Globe tone="muted" animate={false} />
          </div>
        </div>
      </Block>
    </div>
  );
}
