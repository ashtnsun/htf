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
- [ ] Vercel preview deploy (needs the GitHub org repo + Vercel project; no env vars required; runbook in `docs/DEPLOY.md`)

### Phase 1 — Launchable marketing core (Sessions 2–4)

- [x] Session 2: Home complete (featured cards final treatment, who-we-serve copy, stats + testimonials band with ghost text and dotted map, FAQ, contact CTA polish)
- [x] Session 2: Students page (roles rows with Apply buttons, recruitment timeline, how we work, what you'll get, student FAQ, CTA)
- [x] Session 3: Projects index (year filter chips) + detail (MDX body via next-mdx-remote, gallery lightbox, live link, team grid, more-projects rail), 8 placeholder projects
- [x] Session 4: Contact form (server action → Supabase / Resend, mailto fallback), Privacy rewrite (MDX), 404 polish, SEO pass (generated OG PNGs, apple icon, canonical URLs)
- [ ] Session 4 leftover: deploy to the real domain (`docs/DEPLOY.md`: GitHub org transfer, Vercel project, DNS; needs Ashton's accounts)

### Phase 2 — Application portal (Sessions 5–8)

- [ ] Supabase project, schema + RLS migrations, Resend SMTP, magic link, multi-step form with autosave, admin dashboard, CSV export, keepalive cron, dry run, flip CTA

### Phase 3 — Depth (Sessions 9–11)

- [ ] About (exec, awards, Instagram grid), Non-profits (process, FAQ, intake), R3F globe with partner pins (lazy, SVG fallback), real stats/testimonials, media handoff swap, analytics, Lighthouse pass

### Phase 4 — Later

- [ ] Blog (MDX), nonprofit application reuse, brand-font swap (Cunia + Josefin Sans), Instagram API embed

## Session 4 — 2026-09-06

**Built:** Contact page with a working form, the privacy policy as validated MDX, the 404
page, an SEO pass with generated share images, and the deploy runbook (Phase 1, Session 4
above; the deploy itself needs accounts only Ashton has). Commits: `feat(ui)`,
`feat(contact)`, `feat(privacy)`, `feat(seo)`, `feat(404)`, `docs`. Not pushed.

**Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` clean (33
prerendered pages, including the 12 image routes). Screenshots in
`docs/screenshots/session-4/` (production build; the `contact-form-*.png` states come from
the dev server with a mock Supabase endpoint, because production has no delivery configured
yet). `pnpm a11y --routes=/,/contact,/privacy,/this-page-does-not-exist,/projects/placeholder-project-1`:
0 violations at 1440 and 390 and with the drawer open, on the production build; `/contact`
with the form rendered: 0 on the dev server. Form end to end (Playwright against an
in-process mock of the Supabase REST endpoint): server-side validation with the browser's
constraints stripped (inline errors, focus moves to the first invalid field, typed values
kept), a valid submit reaches the mock with the service-role headers and the expected JSON,
the honeypot returns the sent panel without a delivery call, "Send another message" clears
the form, and with JavaScript disabled the form posts to the server action and the page
re-renders with the sent panel; axe: 0 violations on the initial, error and sent states.
Mailto mode (a temporary test address, no delivery variables): client-side Zod errors, the
"Almost there" panel, no network request; `buildMailto` output checked (CRLF body, encoded
subject). Without JavaScript every reveal wrapper now renders visible on the production
build.

**Decisions made this session**

1. Contact delivery is chosen from environment variables (`src/lib/contact/deliver.ts`):
   `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` insert into `public.contact_messages`
   through the REST API with one `fetch` (no Supabase client dependency);
   `RESEND_API_KEY` + `CONTACT_INBOX` send a plain-text email through Resend with
   `reply_to` set to the sender. Both may be on; a message counts as delivered when at
   least one sink succeeds; message contents are never logged. With neither, the page shows
   a `mailto:` form when the club email is set and otherwise a visible TODO panel with an
   Instagram button. The page is static, so the mode is fixed at build time: after adding
   or changing these variables on Vercel, redeploy (noted in `docs/DEPLOY.md`).
2. The server action `submitContactMessage` (`src/app/contact/actions.ts`) runs through
   `useActionState`. Zod (`src/lib/contact/schema.ts`, shared with the client for the
   mailto path and the native `minLength`/`maxLength` hints) is the boundary; errors return
   the first message per field plus the typed values so the form keeps them (React resets
   forms after an action); a hidden "fax" honeypot quietly returns the sent state.
   Progressive enhancement: without JavaScript the form still posts to the action.
3. Form primitives `TextField`, `TextAreaField` and `ChoiceField` (`src/components/ui/Field.tsx`):
   visible labels, an "(optional)" marker instead of asterisks, hints and errors wired
   through `aria-describedby`, `aria-invalid` on invalid controls. Errors are cyan with an
   icon because the palette has no red. `ChoiceField` renders radios as 44px chips with the
   inputs kept in the DOM (sr-only) so arrow keys and native `required` work.
4. `SplitButton` without `href` renders a real `<button>` (`type`, `disabled`, `pending`
   shows a spinner in the arrow cell and sets `aria-busy`); links accept `onClick` too.
   `Reveal` wrappers carry `data-reveal` and the root layout adds a `<noscript>` style that
   shows them, because the server-rendered initial state is opacity 0 and stayed invisible
   when JavaScript never ran.
5. The privacy policy lives in `content/privacy.mdx` (frontmatter `effectiveDate` and
   `reviewed`, validated by `privacyFrontmatterSchema` through `getPrivacyPolicy()`, which
   also requires at least one `##` section; `validate:content` counts the sections). It
   renders through `MdxBody` (the former `ProjectBody`, moved to `ui/`) with the shared
   `OnThisPage` nav (a row on phones, a list in the sticky aside), which the project detail
   page now uses too. "Status: Draft" and a `[TODO: legal review]` badge show until
   `reviewed: true`. The text is a plain-language draft: the site sets no cookies and runs
   no analytics, Vercel keeps server logs, the contact form paths, the external application
   form for this cycle, and what the portal will collect (sign-in metadata, answers, review
   notes), with Vercel, Supabase and Resend as processors. Retention periods, the form
   provider, the response window and the age threshold are `[TODO]`.
6. 404: `PageHero` gained `ghost` (a pseudo-element ghost word, here "404"); the page lists
   five popular pages as cards, shows the apply link with the deadline while applications
   are open and a "tell us" mailto once the club email exists; `robots: noindex`.
7. SEO: `opengraph-image.tsx` routes render PNGs at build time with `next/og` (Satori) from
   one `OgCard` in `src/lib/og.tsx` (grid, glow, the wordmark as an SVG data URI, eyebrow,
   split headline, footer line); the site, `/students`, `/projects` and every project (via
   `generateStaticParams`) get their own. Poppins Latin subsets (about 15 KB each, OFL) sit
   in `src/assets/fonts/poppins`. `apple-icon.tsx` is the 180px wordmark PNG. Every page
   declares `alternates.canonical`; the SVG placeholder share image and its media key are
   gone. `metadataBase` still comes from `site.url` (`NEXT_PUBLIC_SITE_URL`, else the
   Vercel URL, else localhost), so local builds print localhost in canonical and share URLs.
8. Inline text links share one style (green underline, text turns green on hover) on Home,
   Students, Contact, Privacy and the 404.
9. `supabase/migrations/20260906000000_contact_messages.sql` creates the table with length
   checks, RLS enabled with no policies (service role only) and a `handled_at` column for
   exec. `.env.example` documents every optional variable (all optional; `.gitignore` now
   allows the example file).

**Improvements over the Framer template (as asked)**

- The template has no contact form, only a CTA. Ours is keyboard-complete with 44px chips,
  inline errors, focus management, a honeypot and a no-JavaScript path.
- The privacy page has an effective date, a status, on-page navigation and covers what the
  site actually does instead of template boilerplate.
- The 404 offers the main pages and the application link instead of a bare message.
- Share previews are branded PNGs per page instead of one SVG placeholder.

**Known gaps**

- Production shows the "not connected" panel on `/contact` until the club email (mailto
  mode) or the Supabase / Resend variables are set; the form itself only renders on the dev
  server with those variables in `.env.local`.
- Delivery was tested against a mock endpoint only; send one real message after deploy
  (`docs/DEPLOY.md` §4).
- No rate limiting beyond the honeypot; add one if spam shows up.
- The privacy policy is a draft with TODOs and needs legal review.
- Deploy (GitHub org, Vercel, domain) is documented but not done.

**TODOs for Ashton (content and accounts)**

- Everything from Sessions 1–3 still stands.
- `content/site.ts`: the club email (turns the contact form on in mailto mode) and the
  LinkedIn URL.
- Decide on delivery: Supabase (create the project, apply the migration, set
  `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) and/or Resend (verify the domain, set
  `RESEND_API_KEY`, `CONTACT_INBOX`, `CONTACT_FROM`); redeploy afterwards.
- `content/privacy.mdx`: fill the TODOs, get it reviewed, set `reviewed: true` and update
  `effectiveDate`.
- Deploy: `docs/DEPLOY.md` steps 1–4 (GitHub org transfer, Vercel project, domain,
  `NEXT_PUBLIC_SITE_URL`), then the post-deploy checks.
- Push: Sessions 2–4 are committed locally only (`git push origin main`, or after the org
  transfer).

## Next session starts with

**Session 5: application portal, part 1 (schema + auth).** Read `docs/PLAN.md` §5 and §9,
this file, and `node_modules/next/dist/docs/` for `proxy.ts` and server actions, then:

1. Supabase: the same project as the contact table. Migrations for `cycles`, `roles`,
   `questions`, `applications`, `answers`, `reviews`, `admins` with RLS (applicants read and
   write only their own draft while the cycle is open; admins read everything and write
   reviews and status), plus the `contact_messages` migration already in
   `supabase/migrations/`.
2. Auth: email magic link (OTP) for any email, `profiles` row on first sign-in, admins by
   email in `admins`, checked server-side. `/apply` becomes the season landing + sign-in;
   keep the header CTA on the external form until the Phase 2 dry run passes.
3. Custom SMTP through Resend for auth emails (the built-in sender is 2 per hour).
4. If the Supabase project does not exist yet, write the migrations and the auth UI first
   and test against a local `supabase start` (Docker), or stop at the schema and log it.
5. Screenshots to `docs/screenshots/session-5/`, `pnpm a11y --routes=/apply`, update this
   file. Needed from Ashton: Supabase and Resend accounts, the exec email list, this
   cycle's roles and questions.

## Session 3 — 2026-09-05

**Built:** Projects index and detail pages (Phase 1, Session 3 above) with eight placeholder
projects. Commits: `feat(content)`, `feat(projects)`, `fix(ui)`, `chore(scripts)` plus this
log. Not pushed.

**Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` clean; all eight
detail pages prerender through `generateStaticParams`. Screenshots in
`docs/screenshots/session-3/` (production build; `*-dialog.png` is the open lightbox).
`pnpm a11y --routes=/,/projects,/projects/placeholder-project-1 --dialog=Enlarge`: 0 violations
at 1440 and 390, with the drawer open and with the lightbox open, on the production build and
on the dev server.

**Decisions made this session**

1. MDX bodies render on the server with `next-mdx-remote/rsc` (+ `remark-gfm`) through
   `<ProjectBody>`. Typography is the `rich-text` utility in `globals.css` (display-face
   h2/h3, muted paragraphs, green square bullets, `01`-style numbered steps, green-rule
   blockquote). h2/h3 get ids from `slugify()` in `src/lib/mdx.ts`; `extractHeadings()` reads
   the same ids from the source for the "On this page" list. JS expressions in MDX stay
   blocked (library default), so a stray `{…}` in copy is stripped, never executed.
2. Year filter: `<ProjectsExplorer>` (client) reads `?year=` with `useSearchParams` and writes
   it with `history.replaceState` (shareable URL, no navigation, no server round trip). The
   page wraps it in `<Suspense>` with the unfiltered `<ProjectsExplorerView>` as the fallback,
   so the static HTML lists every project and `/projects` stays prerendered. Chips are buttons
   with `aria-pressed`, the count line is `aria-live`, an unknown `?year=` shows the empty
   state with a reset chip, and cards fade/reflow with Framer Motion `layout` (off under
   reduced motion).
3. The gallery lightbox is a native modal `<dialog>` (`showModal()`): the browser traps focus,
   closes on Escape, keeps the page inert and returns focus to the thumbnail. The component
   adds arrow/Home/End keys, prev/next buttons (beside the image from `md`, in the footer row
   on phones), a counter, the caption, body scroll lock, backdrop-click close and a fade-in
   (`--animate-fade-in`, ~0 under reduced motion).
4. Project schema: `gallery` entries are media keys or `{ src, alt, caption }` objects (bare
   keys get "<title>, screenshot n of m" as alt); new optional `stack: string[]` renders the
   "Built with" chips. `Project.gallery` is normalised in the loader; `coverSrc` /
   `gallerySrcs` are gone because `<Media>` resolves keys itself.
5. Detail page order: back link + hero (nonprofit eyebrow, title, summary, Year / Location /
   Type facts, "Visit the live site" split button when `liveUrl` exists) → 16:9 cover →
   write-up with a sticky aside (On this page, Built with, Partner; on phones the jump links
   sit above the write-up) → Gallery → Team → More projects (same cycle first, via
   `getRelatedProjects`) → the "Work with us" ContactCta with a "For non-profits" secondary
   button. Metadata: "<project> · <nonprofit>", the summary, the cover as OG image.
6. `Section` no longer clips overflow by default. An `overflow: hidden` ancestor becomes the
   scroll container for `position: sticky` children, which pushed the detail aside (and the
   Students roles heading) down by their `top` offset. Clipping is now opt-in (`clip`,
   defaulting to true when `ghost` is set, which the Impact band needs for its ghost word and
   map).
7. `ProjectCard` takes `headingLevel` (h2 on the index, where the cards are the page's
   sections; h3 under section headings elsewhere) and shows a "Draft" badge on unpublished
   projects (dev only, production filters them). `toProjectCardData()` strips MDX bodies
   before data reaches the client component. `TAG_LABEL` is exported for the detail facts.
8. Placeholder covers come in four ornament variants (globe, checkerboard, zigzag, brackets)
   drawn by `scripts/gen-placeholders.mjs` at 4:3, so a grid of placeholders has rhythm and
   the featured 4:5 and hero 16:9 crops stay gentle; gallery frames are numbered. The SVGs are
   tracked in git; `pnpm build` now runs `gen:placeholders` first so they never drift from the
   script.
9. New primitives: `Chip` / `ChipButton` (eyebrow-style label chips and 44px filter buttons),
   `TeamGrid`, `Gallery`, `MoreProjects`; `PageHero` gained a `back` link. All are on `/dev/ui`.
10. `pnpm a11y` and `pnpm screenshots` accept `--dialog=<button name>`: where such a button
    exists it is clicked and the page is scanned / captured again with the dialog open.
11. Placeholder facts: the eight 2025–26 projects are placed one per state/country from the
    Instagram graphics (Indiana, Illinois, California, Pennsylvania, United Kingdom, India,
    Ghana, Botswana) with `[TODO: city]`; the one-per-place split and the tags are assumptions
    for Ashton to confirm. Four are `featured`, so Home now shows four cards.

**Improvements over the Framer template (as asked)**

- The template's detail page is a title and three paragraphs; ours adds a facts row, live
  link, on-page navigation, tech stack, a keyboard-complete lightbox gallery, the team and
  related projects.
- The index has a real filter (shareable URL, live result count) instead of an unfiltered
  stack; cards carry nonprofit, cycle, location and type, and are h2s in the page outline.
- All controls are ≥ 44px, chips expose `aria-pressed`, the lightbox is a proper modal dialog
  with focus restore and Escape, and images sit in fixed-ratio boxes so nothing jumps.

**Known gaps**

- No placeholder has a `liveUrl` or a LinkedIn URL, so the "Visit the live site" button and
  the team LinkedIn links only show on `/dev/ui` until real data lands.
- Gallery alt text defaults to "<title>, screenshot n of m"; real screenshots need real alt
  text (and captions) in frontmatter.
- The year filter has one cycle (2025–26) until other cycles are added; the empty state only
  appears for an unknown `?year=`.
- The OG image is still the SVG placeholder cover (Session 4 makes a PNG).
- MDX syntax errors surface at `next build` (page render), not in `pnpm validate:content`.

**TODOs for Ashton (content and accounts)**

- Everything from Sessions 1–2 still stands.
- `content/projects/*.mdx`: the eight 2025–26 nonprofits (title, nonprofit, city, tags,
  summary, live URL, stack, team names + LinkedIn, write-up, screenshots with alt text).
  Rename the files to real slugs; covers and screenshots go through `content/media.ts`.
- Confirm the one-per-place assumption (4 U.S. states + 4 countries = 8 nonprofits) and
  whether earlier cycles should be listed.
- Projects index intro copy (`src/app/projects/page.tsx`).

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
