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

- [ ] Session 2: Home complete (featured cards final treatment, who-we-serve copy, stats + testimonials band with ghost text and dotted map, FAQ, contact CTA polish)
- [ ] Session 2: Students page (roles rows with Apply buttons, recruitment timeline, how we work, what you'll get, student FAQ, CTA)
- [ ] Session 3: Projects index (year filter chips) + detail (MDX body via next-mdx-remote, gallery lightbox, live link, team grid, more-projects rail), 8 placeholder projects
- [ ] Session 4: Contact form (Supabase or mailto v1), Privacy rewrite, 404 polish, SEO/OG image (PNG), deploy to the real domain

### Phase 2 — Application portal (Sessions 5–8)

- [ ] Supabase project, schema + RLS migrations, Resend SMTP, magic link, multi-step form with autosave, admin dashboard, CSV export, keepalive cron, dry run, flip CTA

### Phase 3 — Depth (Sessions 9–11)

- [ ] About (exec, awards, Instagram grid), Non-profits (process, FAQ, intake), R3F globe with partner pins (lazy, SVG fallback), real stats/testimonials, media handoff swap, analytics, Lighthouse pass

### Phase 4 — Later

- [ ] Blog (MDX), nonprofit application reuse, brand-font swap (Cunia + Josefin Sans), Instagram API embed

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

## Next session starts with

**Session 2: complete Home + Students.** Read `docs/PLAN.md` §3 (Home, Students) and this file, run `pnpm dev`, open `/dev/ui` for the primitives, then:

1. Home: featured project cards (final oversized treatment, real card hover), who-we-serve copy, testimonials band (ghost text + dotted world map background, cards from content), stats row, FAQ links, contact CTA copy. Wire everything to content files.
2. Students: role rows (Framer pattern: "Role 1" label, icon, title, blurb, description, Apply/Learn split button), recruitment timeline from `content/recruitment.ts`, how we work (1 lead + 5 devs + 1–2 designers), what you'll get, student FAQ (`getFaq("students")`), CTA. Remove the `StubSection`.
3. Screenshots to `docs/screenshots/session-2/`, `pnpm a11y --routes=/,/students`, update this file.
