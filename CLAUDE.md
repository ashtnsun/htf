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
                    exec.ts, roles.ts, faq.ts, testimonials.ts, stats.ts, services.ts,
                    process.ts, awards.ts, recruitment.ts, students.ts, about.ts,
                    nonprofits.ts, instagram.ts, privacy.mdx, projects/*.mdx (Zod frontmatter)
src/app/            routes. page.dev.tsx files exist only in `next dev` (see next.config.ts);
                    contact/actions.ts and nonprofits/actions.ts are the form server actions;
                    apply/ (portal landing + sign-in actions, form/ = the multi-step form and
                    its actions, submitted/), admin/ (dashboard, applications/[id] review page
                    + actions, export.csv route handler), auth/confirm (magic-link target) are
                    the application portal (Phase 2)
src/proxy.ts        portal only (/apply, /admin): refreshes the Supabase session cookie and
                    bounces signed-out visitors off protected pages
src/components/
  brand/            Logo (inline SVG wordmark; logo-paths.ts is generated, do not hand-edit),
                    PixelDino (footer)
  ui/               primitives: Eyebrow, Headline, SplitButton, Section, Card, Accordion,
                    StatTile (+ CountUp), TestimonialCard, Chip, Field, Media, DottedMap
  layout/           SiteHeader, NavDrawer, NavLinks, SiteFooter, PageHero, JumpLinks,
                    FaqSection, ContactCta (+ ConnectGraphic: two modules docking on view),
                    SeasonNote, OnThisPage
  home/             Hero, Globe (SVG, takes pins), WhatWeDo, Process (+ ProcessScroll,
                    ProcessScene: one isometric scene that builds through the steps on
                    scroll; also the stills on /nonprofits), ImpactBand (+ TestimonialMarquee,
                    Awards, AwardCarousel), WhoWeServe (two panels in a full-bleed row; also
                    the hand-off on /about)
  about/            Mission, Story, ExecGrid, InstagramGrid
  nonprofits/       HowItWorks, Scope, Partners (+ PartnersMap), NonprofitTestimonials,
                    IntakeForm
  globe/            PartnerGlobe (lazy wrapper, drag, SVG fallback), PartnerGlobeScene
                    (three.js / R3F, loaded on demand), SpinController, landDots
  forms/            useFormSubmission (server / mailto modes), SentPanel, Honeypot,
                    CountedTextArea (live character counter)
  contact/          ContactForm
  apply/            SignInForm (email → six-digit code, resend, restart), AccountPanel,
                    ApplicationForm (client shell: stepper, autosave, aside, review),
                    ApplicationSteps (profile / roles / questions fields), ApplicationSummary
                    (review step and the read-only view)
  admin/            ExecOnly, AdminFilters (GET form), ApplicationsTable (+ StatusChip),
                    ReviewPanel (review, status and other reviews; forms post to actions)
  motion/           Reveal / RevealGroup (fade-and-rise, reduced-motion aware)
  icons/            Instagram / LinkedIn (lucide 1.x has no brand icons)
src/lib/content/    schemas.ts (Zod) + index.ts (loaders; throw on invalid content)
src/lib/forms/      fields.ts (FormState, readValues, honeypot), deliver.ts (Supabase / Resend,
                    sendEmail)
src/lib/apply/      schema.ts (steps, Zod for profile / roles / answers built from the questions
                    rows, problems, summary data), state.ts, email.ts (confirmation via Resend)
src/lib/contact/, src/lib/inquiries/   per-form Zod schema + delivery wrapper
src/lib/supabase/   env.ts (SUPABASE_URL + SUPABASE_ANON_KEY), server.ts (cookie-bound client,
                    one per request), proxy.ts (session refresh), database.types.ts (generated:
                    `supabase gen types typescript --local`, do not hand-edit)
src/lib/auth/       schema.ts (sign-in Zod + safeNextPath), state.ts, session.ts (getSessionUser,
                    isAdminUser, requireUser: the data-access gate every portal page uses)
src/lib/portal/     data.ts (cycle, roles, questions, my application + answers, admin counts; all
                    through RLS), admin.ts (dashboard reads, URL filters, sorting, counts, CSV),
                    format.ts (dates in the club's zone, safe on the client)
src/lib/geo.ts      sphere maths shared by both globes
scripts/            validate-content, gen-placeholders, gen-logo-paths.py, gen-world-dots,
                    screenshots, a11y
docs/               PLAN.md, PROGRESS.md, DEPLOY.md, prompts/, screenshots/session-N/
supabase/           config.toml (local stack on ports 54331+, email templates, redirect URLs),
                    migrations/ (contact_messages, nonprofit_inquiries: service role only;
                    application_portal: profiles, admins, cycles, roles, questions, applications,
                    answers, reviews with RLS + guard trigger), seed.sql (cycle, roles,
                    questions), seed.local.sql (local admin), templates/sign-in.html
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
  `formatDeadline`, `isPortalMode`). Every CTA reads from it. `season.applyMode` is
  `external` (default: `/apply` redirects to `season.applyUrl`) or `portal`
  (`NEXT_PUBLIC_APPLY_MODE=portal`: `/apply` is the in-house portal). The portal's cycle,
  roles and questions live in the database (`supabase/seed.sql`), not in `content/`.

## Design tokens (globals.css)

- Colors (CSS vars → Tailwind utilities): `--bg #0B0B0B` (`bg-bg`), `--surface #141414`,
  `--surface-2 #1C1C1C`, `--line rgba(255,255,255,.08)` (`border-line`), `--line-strong`,
  `--text #F5F5F5` (`text-text`), `--muted #A3A3A3`, `--green #03C652`, `--green-deep
#277D4A`, `--mint #00EB88`, `--cyan #00E0FF`, `--lime #C8FF3D`. The default Tailwind
  palette is disabled; only these (plus white/black) exist.
- Lime is defined but unused since audit 3 (2026-09-07): every primary `SplitButton` arrow
  cell is green with a 2px black divider, like the header bar CTA. Never a text or brand colour.
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
  `md:first:col-start-2`, items padded `px-(--gutter)`), `grid-overlay`, `ghost-text`,
  `skip-link`, `marquee` / `marquee-track`.
- Contrast (checked, WCAG AA): text/muted/green/mint/cyan on bg, surface and surface-2 all
  pass; dark text on green (8.6:1) and on lime (16.6:1) pass; white on green FAILS (never);
  green-deep on bg is 3.8:1 → large text or decoration only. `/dev/ui` shows the table.

## Component rules

- Server components by default. `"use client"` only for motion and interaction, kept small
  and leaf-level (Accordion, NavDrawer, NavLinks, Globe, Reveal, PartnersMap).
- three.js only inside `src/components/globe/`, loaded with `next/dynamic` (`ssr: false`)
  once the globe is near the viewport; the SVG `Globe` with pins is the fallback and the
  first paint. R3F's JSX types widen React's `ElementType`, so polymorphic `as` props take a
  literal tag union, never `ElementType`. Mutable per-frame state lives in a class with
  methods (`SpinController`), not in ref objects passed as props (React Compiler lint).
- Forms: a Zod schema in `src/lib/<form>/schema.ts` shared by the client (mailto path,
  native hints) and the server action; `useFormSubmission` handles both modes;
  delivery goes through `src/lib/forms/deliver.ts`. Every list renders `li` as the direct
  child of `ul`/`ol` (put `Reveal` inside the `li`).
- Every CTA is a `SplitButton` (primary: green label, green arrow cell, 2px black divider);
  every section label is an `Eyebrow`; every heading with a green accent is a `Headline`
  (`*word*` marks the accent).
- Portal: every page and server action under `/apply` and `/admin` goes through
  `src/lib/auth/session.ts` (`requireUser`, `isAdminUser`) and queries Supabase as the
  signed-in user (`createClient` in `src/lib/supabase/server.ts`), so Row Level Security is
  the boundary; never use the service role for portal data. `src/proxy.ts` is only the
  optimistic redirect. Schema changes are new files in `supabase/migrations/` followed by
  `supabase db reset` and `pnpm supabase:types`. A `<button>` with a function `formAction`
  cannot carry `name`/`value` (React overrides them): use a hidden input instead. The
  application form saves leniently (empty is fine, invalid is not) and validates strictly on
  Continue and on submit; every one of its buttons posts a `nav` value to the one action in
  `apply/form/actions.ts`, so each move saves first and the form works without JavaScript.
- Hover states are one language everywhere: text links turn green (inline links in body copy
  are already green, medium weight, no underline, and turn white); interactive surfaces get
  `hover-corners` + `border-line-strong` + `bg-surface-2`; arrow cells fill green; nav links
  brighten (the green underline marks the current page only). Nothing translates, lifts or scales on hover (only the arrow glyph
  slides). Mint is the focus ring only, never a hover colour. Transitions: 200ms colours.
- Motion: Framer Motion via `Reveal`/`RevealGroup`; check `useReducedMotion` in any client
  animation and render the final state when it is set. CSS transitions for hover. Scroll-driven
  and looping effects (count-up, process graphics, testimonial marquee, dinosaur) must have a
  static or paused fallback under reduced motion and, for the marquee, a pause control.
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
Portal: `supabase start` (Docker; ports 54331+) · `supabase db reset` (migrations + seeds) ·
`pnpm supabase:types` (regenerates `database.types.ts`) · emails at http://localhost:54334 ·
`.env.local` per `docs/DEPLOY.md` §6 (`NEXT_PUBLIC_APPLY_MODE=portal` to see the portal).

## Commit style

Conventional commits, small and frequent: `feat(home): …`, `fix(nav): …`, `chore: …`,
`docs: …`, `content: …`. Commit only when asked or at the end of a step; never commit
`reference/` changes without the design director's say-so.
