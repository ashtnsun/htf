@AGENTS.md

# Hack the Future Purdue — website

Marketing site + (Phase 2) application portal for Hack the Future (HTF), a Purdue student org
that builds software for nonprofits. One developer (Ashton, design director) working with
Claude Code. Dark theme only.

## Every session

1. Read `docs/PLAN.md` (source of truth for scope, sitemap, page specs, phasing) and
   `docs/PROGRESS.md` (checklist, decisions, TODOs, "next session starts with").
2. Continue from the next unchecked item in PROGRESS.md.
3. Before finishing: `pnpm typecheck && pnpm lint && pnpm build`, take screenshots
   (`pnpm screenshots --out docs/screenshots/session-N`), run `pnpm a11y`, look at the
   screenshots, then update `docs/PROGRESS.md` (check items off, add decisions and TODOs,
   set the "next session starts with" pointer). Commit in small conventional commits.

## Stack

- Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4
  (CSS-first config in `src/app/globals.css`, no tailwind.config), Framer Motion 13,
  lucide-react, Zod 4, gray-matter. pnpm. Deployed on Vercel. Node 22+.
- Read `node_modules/next/dist/docs/` before using a Next API you are unsure about; this
  version differs from older training data (typed `PageProps<'/route'>` / `LayoutProps`,
  `proxy.ts` instead of middleware, `next typegen`).
- No CMS. No heavy UI libraries. three.js / `@react-three/fiber` only for the globe, lazy
  loaded with the SVG fallback (Phase 3).

## Folders

```
content/            typed content: site.ts (config + season CTA), media.ts (image map),
                    exec.ts, roles.ts, faq.ts, testimonials.ts, stats.ts, recruitment.ts,
                    projects/*.mdx (frontmatter validated by Zod)
src/app/            routes. page.dev.tsx files exist only in `next dev` (see next.config.ts)
src/components/
  brand/            Logo (inline SVG wordmark; logo-paths.ts is generated, do not hand-edit)
  ui/               primitives: Eyebrow, Headline, SplitButton, Section, Card, Accordion,
                    StatTile, Media
  layout/           SiteHeader, NavDrawer, NavLinks, SiteFooter, PageHero, StubSection
  home/             Hero, Globe
  motion/           Reveal / RevealGroup (fade-and-rise, reduced-motion aware)
  icons/            Instagram / LinkedIn (lucide 1.x has no brand icons)
src/lib/content/    schemas.ts (Zod) + index.ts (loaders; throw on invalid content)
scripts/            validate-content, gen-placeholders, gen-logo-paths.py, screenshots, a11y
docs/               PLAN.md, PROGRESS.md, prompts/, screenshots/session-N/
reference/          brand guide, fonts, Instagram graphics, Framer captures (never shipped)
public/placeholders generated SVG placeholders (pnpm gen:placeholders)
```

Path aliases: `@/*` → `src/*`, `@content/*` → `content/*`.

## Content rules

- Content is data, validated at build time. Loaders in `src/lib/content/index.ts` parse with
  Zod and throw; `pnpm build` runs `validate:content` first. Never bypass the loaders.
- Images go through `content/media.ts` keys and the `<Media>` component (next/image).
  Swapping a placeholder for a real photo is a path change in media.ts.
- Never invent facts about HTF (names, numbers, awards, quotes). Unknown content is written
  as visible `[TODO: …]` text and listed in PROGRESS.md. The UI hides links whose value
  starts with `TODO`.
- Season logic lives only in `content/site.ts` (`getPrimaryCta`, `isInSeason`,
  `formatDeadline`). Every CTA reads from it. `/apply` redirects to `season.applyUrl` until
  the portal ships.

## Design tokens (globals.css)

- Colors (CSS vars → Tailwind utilities): `--bg #0B0B0B` (`bg-bg`), `--surface #141414`,
  `--surface-2 #1C1C1C`, `--line rgba(255,255,255,.08)` (`border-line`), `--line-strong`,
  `--text #F5F5F5` (`text-text`), `--muted #A3A3A3`, `--green #03C652`, `--green-deep
#277D4A`, `--mint #00EB88`, `--cyan #00E0FF`, `--lime #C8FF3D`. The default Tailwind
  palette is disabled; only these (plus white/black) exist.
- Lime is only the arrow cell of `SplitButton`. Never a text or brand colour.
- Type: `text-display-xl/lg` (96/80), `text-display` (64), `text-h2` (48), `text-h3` (32),
  `text-body` / `text-body-lg` (16/18), `text-eyebrow` (12, uppercase, tracked),
  `text-display-fluid` for heroes. Families: `font-display`, `font-body` (both Poppins now;
  swap to Cunia + Josefin Sans by changing `--font-display` / `--font-body` in globals.css).
- Radii: `rounded-sm` (4px), `rounded-md` (8px) only. Utilities: `container-x`,
  `container-max`, `grid-overlay`, `ghost-text`, `skip-link`.
- Contrast (checked, WCAG AA): text/muted/green/mint/cyan on bg, surface and surface-2 all
  pass; dark text on green (8.6:1) and on lime (16.6:1) pass; white on green FAILS (never);
  green-deep on bg is 3.8:1 → large text or decoration only. `/dev/ui` shows the table.

## Component rules

- Server components by default. `"use client"` only for motion and interaction, kept small
  and leaf-level (Accordion, NavDrawer, NavLinks, Globe, Reveal).
- Every CTA is a `SplitButton`; every section label is an `Eyebrow`; every heading with a
  green accent is a `Headline` (`*word*` marks the accent).
- Motion: Framer Motion via `Reveal`/`RevealGroup`; check `useReducedMotion` in any client
  animation and render the final state when it is set. CSS transitions for hover.
- Images: `<Media>` (next/image) with `sizes`; SVG placeholders render unoptimized.

## Accessibility rules

- Semantic landmarks (`header`, `nav` with labels, `main#main`, `footer`), one `h1` per page,
  skip link first in the DOM.
- Everything works with a keyboard: drawer is a focus-trapped `role="dialog"` that closes on
  Escape and restores focus; accordion buttons expose `aria-expanded`/`aria-controls`.
- Focus rings are mint (`:focus-visible` in globals.css). Do not remove outlines.
- Respect `prefers-reduced-motion` (global CSS + `useReducedMotion`).
- Tap targets ≥ 44px on touch UI. Run `pnpm a11y` before finishing a session.

## Commands

`pnpm dev` · `pnpm build` (validates content first) · `pnpm typecheck` · `pnpm lint` ·
`pnpm format` · `pnpm validate:content` · `pnpm gen:placeholders` · `pnpm screenshots` ·
`pnpm a11y` (both need `pnpm dev` running; pass `--base` to point elsewhere).

## Commit style

Conventional commits, small and frequent: `feat(home): …`, `fix(nav): …`, `chore: …`,
`docs: …`, `content: …`. Commit only when asked or at the end of a step; never commit
`reference/` changes without the design director's say-so.
