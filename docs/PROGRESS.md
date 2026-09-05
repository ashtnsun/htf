# Progress

Working log for the HTF website rebuild. Every Claude Code session starts by reading
`docs/PLAN.md` and this file, continues from the next unchecked item, and ends by updating
this file. Checklist items follow the plan's phases (PLAN.md §6, §9).

## Checklist

### Phase 0 — Foundations (Session 1) ✅

- [x] Repo restructure (`docs/PLAN.md`, `reference/branding`, `reference/framer`), git init
- [x] Next.js 16 + TypeScript strict + Tailwind v4 + Framer Motion scaffold, pnpm, ESLint, Prettier
- [x] Scripts: `dev`, `build`, `lint`, `typecheck`, `format`, `validate:content`, `gen:placeholders`, `screenshots`, `a11y`
- [x] `CLAUDE.md` conventions (stack, folders, content rules, tokens, component + a11y rules, commit style)
- [x] Design tokens + type scale + utilities in `src/app/globals.css` (`grid-overlay`, `ghost-text`, containers)
- [x] `content/site.ts` with season config and `getPrimaryCta()` (auto-flips after `closesAt`)
- [x] Zod schemas + typed loaders for projects (MDX), exec, roles, faq, testimonials, stats, recruitment timeline; build fails on invalid content
- [x] Placeholder media system (`content/media.ts`, generated SVG placeholders, `<Media>`)
- [x] Layout shell: `SiteHeader` (visible desktop links, split CTA), `NavDrawer` (mobile, focus-trapped), `SiteFooter` (4 columns, real copyright)
- [x] Shared primitives: `Eyebrow`, `Headline`, `SplitButton`, `Section`, `Card`, `Accordion`, `StatTile`, `Media`; `/dev/ui` gallery (dev only)
- [x] Home hero as proof of the visual language (SVG wireframe globe, glow, grid, stagger headline, reveal motion)
- [x] Home placeholder sections (featured, who we serve, stats*, testimonials*, FAQ, contact CTA) — \*hidden until content is `published`
- [x] Route stubs with metadata: `/projects`, `/projects/[slug]`, `/about`, `/students`, `/nonprofits`, `/contact`, `/apply` (redirect), `/privacy`, `not-found`, `sitemap.ts`, `robots.ts`, `icon.svg`
- [x] Verify: typecheck, lint, build clean; screenshots in `docs/screenshots/session-1/`; axe: 0 violations on all routes at 1440/390 and with the drawer open
- [ ] Vercel preview deploy (needs the GitHub org repo + Vercel project; no env vars required)

### Phase 1 — Launchable marketing core (Sessions 2–4)

- [x] Session 2: Home complete (featured cards final treatment, who-we-serve copy, stats + testimonials band with ghost text and dotted map, FAQ, contact CTA polish)
- [x] Session 2: Students page (roles rows with Apply buttons, recruitment timeline, how we work, what you'll get, student FAQ, CTA)
- [ ] Session 3: Projects index (year filter chips) + detail (MDX body via next-mdx-remote, gallery lightbox, live link, team grid, more-projects rail), 8 placeholder projects
- [ ] Session 4: Contact form (Supabase or mailto v1), Privacy rewrite, 404 polish, SEO/OG image (PNG), deploy to the real domain

### Phase 2 — Application portal (Sessions 5–8)

- [ ] Supabase project, schema + RLS migrations, Resend SMTP, magic link, multi-step form with autosave, admin dashboard, CSV export, keepalive cron, dry run, flip CTA

### Phase 3 — Depth (Sessions 9–11)

- [ ] About (exec, awards, Instagram grid), Non-profits (process, FAQ, intake), R3F globe with partner pins (lazy, SVG fallback), real stats/testimonials, media handoff swap, analytics, Lighthouse pass

### Phase 4 — Later

- [ ] Blog (MDX), nonprofit application reuse, brand-font swap (Cunia + Josefin Sans), Instagram API embed

## Session 2 — 2026-09-04

**Built:** Home complete and the Students page, both in Phase 1 above. Four feature commits
(`feat(content)`, `feat(ui)`, `feat(home)`, `feat(students)`) plus this log. Not pushed.

**Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` clean.
Screenshots in `docs/screenshots/session-2/` (production build) and
`docs/screenshots/session-2/dev-preview/` (dev server, shows the unpublished Impact band).
`pnpm a11y --routes=/,/students`: 0 violations at 1440 and 390 and with the drawer open, on
both the production build and the dev server.

**Decisions made this session**

1. Home is composed from section components in `src/components/home/` (`FeaturedProjects`,
   `WhoWeServe`, `ImpactBand`) plus shared sections in `src/components/layout/` (`FaqSection`,
   `ContactCta`, `SeasonNote`) that the Students page reuses. `ProjectCard` lives in
   `src/components/projects/` so the Session 3 index can use it (`size="default"` is the 4:3
   index card; `size="featured"` is the 4:5 home card).
2. Stats and testimonials share one "Impact" band (the Framer testimonial band): ghost word
   "Transforming Non-profits" at the top, dotted world map to the right of the headline, stat
   tiles, testimonial cards. It renders when either list has items. Stat columns follow the
   count (five tiles sit on one row instead of orphaning one).
3. Unpublished stats and testimonials now behave like unpublished projects: hidden in
   production, visible in `next dev` with a "Preview: unpublished content" badge, so the band
   can be reviewed before Ashton confirms the numbers. Loaders take `IS_PRODUCTION` as the
   default for `publishedOnly`.
4. The dotted world map is generated once from Natural Earth 1:110m land polygons
   (`scripts/gen-world-dots.mjs` → `public/maps/world-dots.svg`, 7.8 KB: ~9.9k dots encoded as
   one path with a zero-length dash pattern and round caps). `DottedMap` applies it as a CSS
   mask over a solid colour, so the dots take any token. Partner pins wait for the Phase 3
   location data.
5. Ghost words are painted by `::before { content: attr(data-ghost) }`. axe flagged the
   4%-white text as a contrast failure on phone widths even with `aria-hidden`; as a
   pseudo-element it is decoration and never reaches assistive tech.
6. Featured cards follow the Framer treatment: cover fading into a caption with the nonprofit
   label, a rule and the year, then a big title and the location/tags line; the right column
   is offset by 6rem. Hover scales the cover, turns the title green and fills the arrow cell.
7. FAQ items may carry `link: { label, href }`, rendered as a "read more" link under the
   answer. Home now has six general questions that link into Students, Non-profits and
   Projects; Students has five.
8. Students copy blocks (team structure, how-we-work steps, perks) live in
   `content/students.ts`, validated by `studentsPageSchema` through `getStudentsPage()`. Team
   numbers come from PLAN §3 (1 lead + 5 developers + 1–2 designers; the optional second
   designer seat is drawn dashed). The perk headings are the three lines from the exec-board
   Instagram graphic ("Build real projects", "Join a driven team", "Grow your leadership
   skills") plus "Learn by doing".
9. Role rows: in season the button reads "Apply as {role}" and goes to `/apply`; out of
   season it shows the site CTA (Contact Us). `open: false` on a role prints "Not recruiting
   for this role this cycle" instead of a button.
10. Recruitment timeline: an ISO `date` on a step drives the "Now" marker (latest step whose
    date is today or earlier; earlier steps turn green). No dates are set yet, so nothing
    highlights. The deadline note next to the heading reads from `content/site.ts`.
11. The Students hero has an "On this page" nav (Roles · Timeline · How we work · What you'll
    get · FAQ). Every element with an `id` gets `scroll-margin-top` so anchors land below the
    sticky header.
12. Who-we-serve copy is final but makes no cost claim for nonprofits; "free for nonprofit
    partners" stays `[TODO: confirm]` in the FAQ until Ashton confirms it.

**Improvements over the Framer template (as asked)**

- Role rows carry responsibilities, time commitment and who the role is for, not just a
  blurb; the buttons name the role; rows are an ordered list with a sticky section heading.
- The template's Pricing block and three-step "Process" are gone; the recruitment timeline
  and "How we work" replace them with HTF's actual year.
- In-page navigation on the long Students page; 44px tap targets on nav links, FAQ links and
  arrow cells; role Apply buttons right-align only from 640px up so they stay under the thumb.
- Testimonials use `figure` / `blockquote` / `figcaption`; stats are a definition list; the
  ghost words and dotted map are pure decoration with no contrast or screen-reader cost.
- Card labels, years and locations use the muted token (≥ 6.9:1 on surface) and the whole
  card is one link with a visible focus ring.

**Known gaps**

- The Impact band is hidden in production until stats and testimonials are published; review
  it on the dev server or in `docs/screenshots/session-2/dev-preview/`.
- Timeline steps have no dates, so the "Now" marker never shows; role time commitments,
  descriptions and several FAQ answers still read `[TODO]`.
- Every "Apply as {role}" button leads to the same external form until the portal ships.
- Home renders the two featured placeholders only; Session 3 seeds eight projects.
- The map is a texture only (no partner pins); the Framer's chrome ring and template photos
  are not reproduced by design.

**TODOs for Ashton (content and accounts)**

- Everything from Session 1 still stands: `content/site.ts` links and deadline, hero and
  page copy, roles, exec board, projects, stats (`published: true` when confirmed),
  testimonials, recruitment dates, privacy text, logo SVGs, GitHub org repo, Vercel, DNS.
- `content/students.ts`: confirm the how-we-work cadence, crits/workshops and handoff lines,
  and the mentorship line in "Learn by doing".
- `content/recruitment.ts`: dates for the six steps, plus ISO `date` fields so the timeline
  highlights the current step.
- `content/faq.ts`: whether there is a spring cycle, the nonprofit intake process, hours per
  week, what happens after applying; confirm "free for nonprofit partners".
- Who-we-serve nonprofit panel: add a cost/terms line once confirmed.
- Decide whether the Impact band should mark partner locations (needs city/country per
  project; planned with the Phase 3 globe).

## Next session starts with

**Session 3: Projects index + detail.** Read `docs/PLAN.md` §3 (`/projects`), this file, and
`node_modules/next/dist/docs/` for MDX rendering in the App Router, run `pnpm dev`, then:

1. Seed eight placeholder projects in `content/projects/` (the 2025–26 nonprofits, names and
   locations as `[TODO]`), with covers in `content/media.ts`; mark four `featured`.
2. `/projects`: intro, year filter chips (client leaf, `?year=` search param or local state),
   grid of `ProjectCard` (`size="default"`), empty state. Remove the `StubSection`.
3. `/projects/[slug]`: hero (nonprofit, title, summary, year/location/tags, live link
   button), MDX body via `next-mdx-remote/rsc` with the site's typography, gallery with a
   lightbox (client leaf, keyboard + focus trap like `NavDrawer`), team grid, "More projects"
   rail, `generateMetadata`. Keep unpublished projects dev-only.
4. Screenshots to `docs/screenshots/session-3/`, `pnpm a11y --routes=/projects,/projects/<slug>`,
   update this file.

## Session 1 — 2026-09-04

**Built:** everything in Phase 0 above. Pushed to `git@github.com:ashtnsun/htf.git` (`main`); Vercel project not created yet.

**Decisions made this session**

1. Tailwind v4 CSS-first theme (`@theme inline` in globals.css). The default palette, fonts and radii are disabled so only brand tokens exist as utilities (`bg-bg`, `text-muted`, `text-green`, `rounded-sm/md`…).
2. Typography lives in `--font-display` / `--font-body`, both pointing at `--font-brand` (Poppins via next/font). The Cunia + Josefin Sans swap is two lines in globals.css.
3. The `<HTF/>` wordmark is an inline SVG traced from the Cunia font outlines (`scripts/gen-logo-paths.py`, license allows commercial use; only six glyph outlines are embedded). Same paths make `src/app/icon.svg`. Replace with the official SVG when Ashton supplies one.
4. Dev-only routes use the `page.dev.tsx` extension, registered in `pageExtensions` only under `next dev`, so `/dev/ui` is physically absent from production builds.
5. Content validation happens in the loaders (Zod, `z.prettifyError`) and again in `pnpm validate:content`, which `pnpm build` runs first. The script uses `tsx --conditions=react-server` so the `server-only` guard in the loaders is a no-op outside Next.
6. Placeholders are generated SVGs (crisp at any size, ~2 KB each) served unoptimized through `<Media>`; real photos will be optimized normally.
7. Roles seeded as Project Lead / Developer / Designer (Instagram graphics), not the Framer's Developer / UI-UX Designer / Project Manager. Ashton decides (PLAN §7).
8. Season config: `applyUrl` temporarily points at the Instagram profile (form link in bio) so a stray deploy never sends applicants to a dead link; `closesAt` is a placeholder `2026-09-12T23:59-04:00`. Root layout sets `revalidate = 3600`, so the CTA flips to "Contact Us" within an hour of the deadline without a redeploy.
9. `/apply` redirects (307) to `applyUrl` in season and renders an "applications are closed" page out of season. `robots.txt` disallows `/apply`.
10. Stats and testimonials sections hide themselves until items are marked `published: true`; unpublished projects show only in dev.
11. The mobile drawer is rendered through a portal to `<body>`: the header's `backdrop-blur` makes it the containing block for `position: fixed`, which clipped the overlay to the header. Keep drawers/modals outside the header.
12. Card lists render `li > div/a` (no `display: contents`) so list semantics survive; `Card` with `href` renders an `<a>` inside the wrapper.
13. `noUncheckedIndexedAccess` is on. React 19 lint forbids `setState` in effects, so route-change closing in the drawer uses the derived-state pattern.
14. MDX bodies are parsed (gray-matter) but not rendered yet; rendering (next-mdx-remote/rsc) is Session 3.
15. Playwright + axe are devDependencies (`pnpm screenshots`, `pnpm a11y`). In Git Bash, pass `MSYS_NO_PATHCONV=1` or write routes without the leading slash (`--routes=projects,students`), otherwise MSYS rewrites `/` into a Windows path.
16. Prettier skips `docs/PLAN.md` and `docs/prompts` so Ashton's documents stay untouched.
17. Second hero line is fully green ("Building software for" / "nonprofits, at Purdue."). The side blurb sits beside line 1 only on xl+ screens (line 1 reserves 15rem there); below that it flows under the headline. Staggered headlines get 0.22em of air between lines (the Framer gap). The header tagline shows on sm–md and xl+, hidden on lg where links + CTA need the room.

**Improvements over the Framer template (as asked)**

- Visible desktop nav with active-state underline; burger drawer only below `lg`.
- Button text is dark on green (white on green failed WCAG AA at 2.1:1); all other pairings verified ≥ 4.5:1 (`/dev/ui` shows the table).
- Sticky header with blur so the CTA is always reachable; 44px+ tap targets; drawer items 64px tall.
- Skip link, mint focus rings, focus-trapped dialog with Escape and focus restore, `prefers-reduced-motion` respected everywhere (including the globe spin).
- The template's chrome ring is replaced by the brand's wireframe globe; Pricing, Services, Newsletter and template copy are gone; real copyright line.

**Known gaps**

- OpenGraph image is the SVG placeholder (most platforms need PNG/JPG) → Session 4 SEO pass.
- Hero/inner-page copy is placeholder; long rewrites may wrap line 1 on md screens (by design, it never runs under the blurb).
- The repo lives in a OneDrive-synced folder; `node_modules` and `.next` churn can make installs/builds slower. Consider moving the clone outside OneDrive.

**TODOs for Ashton (content and accounts)**

- `content/site.ts`: LinkedIn URL, club email, the real Fall 2026 form URL (`applyUrl`), confirm `closesAt`, `academicYear`, tagline.
- Copy: hero headline/blurb, drawer headline ("Software for good, built at Purdue." is placeholder), who-we-serve pitches, contact CTA, page blurbs, FAQ answers marked `[TODO]`.
- Roles: confirm the list and fill descriptions, responsibilities, time commitment (`content/roles.ts`).
- Exec board: names, roles, LinkedIn, photos (`content/exec.ts`, `content/media.ts`).
- Projects: the eight 2025–26 nonprofits (name, location, one-liner, live link, covers) → `content/projects/*.mdx`.
- Stats: confirm and set `published: true` (`content/stats.ts`); testimonials when approved.
- Recruitment timeline dates (`content/recruitment.ts`).
- Privacy policy text; official logo SVGs; the GitHub org repo + Vercel project; domain/DNS.
