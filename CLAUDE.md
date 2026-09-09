@AGENTS.md

# Hack the Future Purdue — website

Marketing site for Hack the Future (HTF), a Purdue student org that builds software for
nonprofits. One developer (Ashton, design director) working with Claude Code. Dark theme
only. Applications go through a Google Form (embedded on `/apply`) and messages by email;
the finished Phase 2 application portal and the site forms are parked under `parked/`
(see `parked/README.md`), not built.

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
                    exec.ts, roles.ts, faq.ts, testimonials.ts, stats.ts, services.ts,
                    process.ts, awards.ts, recruitment.ts, students.ts, about.ts, hero.ts
                    (the hero copy every variant shares),
                    nonprofits.ts, instagram.ts, privacy.mdx, projects/*.mdx (Zod frontmatter)
src/app/            routes. page.dev.tsx files exist only in `next dev` (see next.config.ts);
                    apply/ is the Google Form page (one centred column, no banner: a short
                    heading, the embedded form with the open-in-a-tab link, the "apply" FAQ
                    under it; "closed" out of season); projects/[slug] is a plain title block,
                    the cover, the write-up with the team and stack in the right column, the
                    gallery and the CTA (no banner, jump links or "More projects");
                    contact/ lists email, LinkedIn and Instagram; no server actions, no proxy
src/components/
  brand/            Logo (inline SVG wordmark; logo-paths.ts is generated, do not hand-edit),
                    PixelDino (footer), dino-pixels.ts (the 20×22 T-rex map the footer and the
                    process scene share)
  ui/               primitives: Eyebrow, Headline, SplitButton, Section, Card, Accordion,
                    StatTile (+ CountUp), TestimonialCard, Chip, Field, Media, DottedMap
  layout/           SiteHeader, NavDrawer, NavLinks, SiteFooter, PageHero, SectionNav (the
                    sticky section bar under the hero on About / Students / Nonprofits; sets
                    --subnav-h so anchors land below it), FaqSection, ContactCta (+ involved/: the
                    Get involved graphic, a client switch over four variants chosen in the Shift + M
                    menu; GraphicFrame is the shared floating square, GlobeGraphic the default and
                    in the bundle (the partner globe; a hovered pin names its state in the US or
                    its country elsewhere; three.js loads on demand), Terminal / Chat / Badge
                    lazy chunks), SeasonNote, OnThisPage (/privacy only)
  home/             Hero (client switch over heroes/*: six variants (Globe, Atlas, Typewriter,
                    Cells, Wordmark, Photo) chosen in the Shift + M menu, GlobeHero the default and
                    in the bundle, the rest lazy chunks;
                    HeroShell is the shared frame), Globe (SVG, takes pins), WhatWeDo, Process (+ ProcessScroll,
                    ProcessScene: the footer T-rex as detective, team lead, builder and party
                    host in pixel art that dissolves cell by cell with scroll, the sprites in
                    ProcessSprites.ts; also the stills on /nonprofits),
                    ImpactBand (+ TestimonialMarquee, Awards, AwardCarousel), WhoWeServe (two
                    linked panels with a presentational "Learn more" button in a full-bleed
                    row, each topped by a pixel picture from WhoWeServeGraphics: a stack of
                    books, a hand holding out a heart, on the dinosaur's cell grid; also the
                    hand-off on /about)
  about/            Mission, Story, ExecGrid (+ ExecBoard: a chip per school year, `?board=` in
                    the URL, LinkedIn cell on every card), InstagramGrid
  nonprofits/       HowItWorks (cards share rows through a subgrid), Scope, Partners
                    (+ PartnersMap), NonprofitTestimonials
  globe/            PartnerGlobe (lazy wrapper, drag, SVG fallback, the hover label for pins
                    with a `label`), PartnerGlobeScene (three.js / R3F, loaded on demand; hover a
                    labelled pin to hold the globe), SpinController, LabelAnchor (places the
                    label from the frame loop), landDots
  config/           ConfigMenu (Shift + M: the non-modal site configuration panel; one
                    VariantPicker per setting: the home hero, the Get involved graphic)
  motion/           Reveal / RevealGroup (fade-and-rise, reduced-motion aware),
                    useReducedMotionSafe (false until hydration, so the static branch never
                    mismatches the server's animated markup)
  icons/            Instagram / LinkedIn (lucide 1.x has no brand icons)
src/lib/content/    schemas.ts (Zod) + index.ts (loaders; throw on invalid content)
src/lib/config/     options.ts (HERO_VARIANTS / DEFAULT_HERO, INVOLVED_VARIANTS / DEFAULT_INVOLVED,
                    SiteConfig), store.ts (localStorage store + useSiteConfig; the server and the
                    first paint always see the defaults)
src/lib/geo.ts      sphere maths shared by both globes
scripts/            validate-content, gen-placeholders, gen-logo-paths.py, gen-world-dots,
                    screenshots, a11y
docs/               PLAN.md, PROGRESS.md, DEPLOY.md, prompts/, screenshots/session-N/
parked/             the application portal and the site forms, mirrored under parked/src/
                    (excluded from tsc, ESLint, Prettier and the build; README.md says what is
                    there and how to restore it)
supabase/           the parked portal's database: config.toml (local stack on ports 54331+),
                    migrations/, seed.sql, seed.local.sql, templates/sign-in.html (inert)
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
- Spelling: `nonprofits`, one word, everywhere (page title "Nonprofits"); never "non-profits".
- Season logic lives only in `content/site.ts` (`getPrimaryCta`, `isInSeason`,
  `formatDeadline`, `getApplyForm`). Every CTA reads from it: in season `/apply`, otherwise
  `/contact`. `/apply` embeds the Google Form in `season.applyFormUrl` (`getApplyForm` adds
  `embedded=true`; while the link is a TODO the page shows the TODO and the Instagram
  fallback). Nothing on the site posts a form: nonprofits and everyone else write to
  `site.socials.email`.
- The hero variant and the Get involved graphic are per-browser choices (Shift + M,
  `src/lib/config`), never a build-time or server-side switch: visitors always get
  `DEFAULT_HERO` / `DEFAULT_INVOLVED` from `src/lib/config/options.ts`, and the pages stay
  static. Every hero variant renders the copy in `content/hero.ts`, one `h1` (`#hero-title`)
  and a finished picture under reduced motion; every Get involved variant is a recognizable
  object (no abstract scenes, no viewfinder corners on its container), decoration only, drawn
  inside `layout/involved/GraphicFrame`, and finished under reduced motion. Anything a
  variant states as fact (the deadline, the cycle name) comes through its props from
  `content/site.ts`.

## Design tokens (globals.css)

- Colors (CSS vars → Tailwind utilities): `--bg #0B0B0B` (`bg-bg`), `--surface #141414`,
  `--surface-2 #1C1C1C`, `--line rgba(255,255,255,.08)` (`border-line`), `--line-strong`,
  `--text #F5F5F5` (`text-text`), `--muted #A3A3A3`, `--green #03C652`, `--green-deep
#277D4A`, `--mint #00EB88`, `--cyan #00E0FF`, `--lime #C8FF3D`, `--pink #FF3D9E` and
  `--blue #3388FF` (the last two are decoration only: the process scene's teammates; never
  text or a brand colour). The default Tailwind palette is disabled; only these (plus
  white/black) exist.
- Lime is defined but unused since audit 3 (2026-09-07): every primary `SplitButton` arrow
  cell is green with a 2px black divider (1px on the header bar `size="bar"` CTA since 2026-09-08). Never a text or brand colour.
- Type: `text-display-xl/lg` (96/80), `text-display` (64), `text-h2` (48), `text-h3` (32),
  `text-body` / `text-body-lg` (16/18), `text-eyebrow` (12, uppercase, tracked),
  `text-display-fluid` for heroes. Families: `font-display`, `font-body` (both Poppins now;
  swap to Cunia + Josefin Sans by changing `--font-display` / `--font-body` in globals.css).
- Radii: none. Both radius tokens are 0 (do not write `rounded-sm`/`rounded-md`);
  `rounded-full` is for avatars only. The look is rigid lines and hairline dividers.
- Surface language: `glass` (frosted: header, drawer, footer, floating tiles and cards;
  `[--glass-alpha:80%]` tunes opacity), `hover-corners` (green viewfinder brackets on
  hover / focus, the one hover treatment for interactive surfaces), `frame-marks`
  (crosshairs at the corners of framed containers). Other utilities: `container-x` (reads
  `--gutter`), `container-max`, `bleed-row-2` / `bleed-row-3` (a full-bleed hairline row
  whose columns stay on the container's columns: `grid md:bleed-row-3`, first item
  `md:first:col-start-2 md:first:border-l`, every item `md:border-r`, items padded
  `px-(--gutter)`), `grid-overlay`, `ghost-text`,
  `skip-link`, `marquee` / `marquee-track`.
- Contrast (checked, WCAG AA): text/muted/green/mint/cyan on bg, surface and surface-2 all
  pass; dark text on green (8.6:1) and on lime (16.6:1) pass; white on green FAILS (never);
  green-deep on bg is 3.8:1 → large text or decoration only; pink (6.0:1) and blue (5.7:1) on
  bg pass but stay decoration. `/dev/ui` shows the table.

## Component rules

- Server components by default. `"use client"` only for motion and interaction, kept small
  and leaf-level (Accordion, NavDrawer, NavLinks, Globe, Reveal, PartnersMap).
- three.js only inside `src/components/globe/`, loaded with `next/dynamic` (`ssr: false`)
  once the globe is near the viewport; the SVG `Globe` with pins is the fallback and the
  first paint. R3F's JSX types widen React's `ElementType`, so polymorphic `as` props take a
  literal tag union, never `ElementType`. Mutable per-frame state lives in a class with
  methods (`SpinController`), not in ref objects passed as props (React Compiler lint).
- Every list renders `li` as the direct child of `ul`/`ol` (put `Reveal` inside the `li`,
  or around the whole list when the cards share rows through `grid-rows-subgrid`, which
  needs the direct grid → `li` → children chain).
- Every CTA is a `SplitButton` (primary: green label, green arrow cell, 2px black divider;
  secondary: outlined, white arrow that turns black on the green hover fill; on hover the
  label rolls up into a copy and the arrow glyph nudges, since 2026-09-08; `presentational`
  renders a span for a button inside a card that is itself the link);
  every section label is an `Eyebrow`; every heading with a green accent is a `Headline`
  (`*word*` marks the accent).
- Parked code (`parked/`) is not touched by feature work; its rules (RLS as the boundary,
  hidden inputs instead of `name`/`value` on a `formAction` button, lenient autosave /
  strict submit) live in `parked/README.md` and in git history for the day it comes back.
- Hover states are one language everywhere: text links turn green (inline links in body copy
  are already green, medium weight, no underline, and turn white); interactive surfaces get
  `hover-corners` + `border-line-strong` + `bg-surface-2`; arrow cells fill green; nav links
  brighten (the green underline marks the current page only in the header; in the section
  bar the current section is green text, nothing else). Nothing translates, lifts or scales
  on hover; the one exception is an arrow glyph nudging inside a `SplitButton` (whose label
  also rolls within its clipped cell) or a project card's arrow cell, while the button or
  card itself stays put. Mint is the focus ring only, never a hover colour. Transitions: 200ms colours.
- Motion: Framer Motion via `Reveal`/`RevealGroup`; check `useReducedMotionSafe`
  (`components/motion`) in any client animation and render the final state when it is set.
  Never branch on Framer's raw `useReducedMotion` during the first render: the server rendered
  the animated markup and React does not patch attribute mismatches, so the hidden styles
  would stick. CSS transitions for hover. Scroll-driven
  and looping effects (count-up, process graphics, testimonial marquee, dinosaur) must have a
  static or paused fallback under reduced motion and, for the marquee, a pause control.
- Images: `<Media>` (next/image) with `sizes`; SVG placeholders render unoptimized.
- Pixel art: every dinosaur drawing reads `brand/dino-pixels` and stays on its cell grid:
  solid cells, no outlines, details carved as empty cells (the eye), dinosaurs green and
  props white, motion by whole cells (`steps()` timing), nothing scaled, rotated or
  fractionally translated (that blurs the pixels). Other pixel pictures (the Who we serve
  books and heart) follow the same rules: string maps, white objects with green accents,
  `shapeRendering="crispEdges"`, a width that is a whole multiple of the map's columns.
- `cn()` registers the type scale with tailwind-merge (`src/lib/utils.ts`). Add any new
  `--text-*` token to that list, or a later `text-<colour>` in the same `cn()` call silently
  drops the size (tailwind-merge cannot tell `text-h2` from a colour).

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
`pnpm a11y` (both need `pnpm dev` running; pass `--base` to point elsewhere). No env vars
are needed for anything live (`.env.example`). The parked portal's stack (`supabase start`,
`supabase db reset`, `pnpm supabase:types`, Mailpit on 54334) is described in `parked/README.md`.

## Commit style

Conventional commits, small and frequent: `feat(home): …`, `fix(nav): …`, `chore: …`,
`docs: …`, `content: …`. Commit only when asked or at the end of a step; never commit
`reference/` changes without the design director's say-so.
