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
- [x] Session 5: home + global audit pass (square corners, glass surfaces, one hover language, nav/footer changes with the pixel dinosaur, statement hero, What we do, scroll-driven process, Impact with count-up tiles / testimonial marquee / awards, Who we serve before the FAQ)

### Phase 3 — Depth (Session 6, pulled ahead of the portal)

- [x] Session 6: About (mission, who we are + facts, exec grid, awards, curated Instagram grid, get-involved panels, CTA, share image)
- [x] Session 6: Non-profits (how it works with "your part", scope guardrails, partner globe, nonprofit testimonials, FAQ, intake form → `nonprofit_inquiries` / Resend / mailto, share image)
- [x] Session 6: three.js partner globe with pins (lazy, on demand near the viewport; SVG globe with pins as fallback and first paint)
- [x] Session 6: analytics (Vercel Web Analytics, Vercel builds only; privacy text) and the Lighthouse pass (numbers and open findings in the Session 6 log)
- [ ] Real stats and testimonials: the sections read published items already; needs Ashton's numbers and quotes (`published: true`)
- [ ] Media handoff swap: needs the photos (`content/media.ts` keys)

### Phase 2 — Application portal (Sessions 7–10)

- [ ] Supabase project, schema + RLS migrations, Resend SMTP, magic link, multi-step form with autosave, admin dashboard, CSV export, keepalive cron, dry run, flip CTA

### Phase 4 — Later

- [ ] Blog (MDX), nonprofit application reuse, brand-font swap (Cunia + Josefin Sans), Instagram API embed

## Session 6 — 2026-09-06 (Phase 3: About, Non-profits, partner globe, analytics, Lighthouse)

**Built:** Phase 3 pulled ahead of the portal at Ashton's request ("lets do phase 3 now").
The About page, the Non-profits page with a working intake form, the three.js partner globe
(lazy, SVG fallback), Vercel Web Analytics, and a Lighthouse pass. The two Phase 3 items
that need content only Ashton has (real stats and testimonials, the media handoff) stay open;
the sections already read published items. Commits: `feat(content)`, `feat(forms)`,
`feat(globe)`, `feat(about)`, `feat(nonprofits)`, `feat(analytics)`, `docs`. Not pushed.

**Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` clean (35
prerendered pages including the two new share images). Screenshots in
`docs/screenshots/session-6/` (production build: `/`, `/about`, `/nonprofits`, `/students`,
`/contact`, the drawer) and `docs/screenshots/session-6/dev-preview/` (dev server: the
unpublished nonprofit testimonials; `globe-*.png` are section captures of the three.js
globe at 1440 and 390 with Ghana active, plus the SVG fallback; the full-page captures show
the canvas blank because Playwright's beyond-viewport capture clears the WebGL buffer).
`pnpm a11y` on the production build for `/`, `/about`, `/nonprofits`, `/students`,
`/contact`, `/projects`, a project detail, `/privacy` and the 404: 0 violations at 1440 and
390 and with the drawer open. Forms, end to end against an in-process mock of the Supabase
REST endpoint (dev server, `.env.local` pointing at it): intake server-side validation with
the browser constraints stripped (five fields flagged, focus on the first invalid one, typed
values kept, axe 0), a valid submit reaches `POST /rest/v1/nonprofit_inquiries` with the
service-role headers and a normalised record (`website` prefixed with `https://`), the sent
panel takes focus (axe 0), the honeypot returns the sent panel without a delivery call, the
contact form still posts to `contact_messages` after the refactor, and with JavaScript off
the intake form posts to the server action and re-renders with the sent panel. Mailto mode
(temporary test address in `site.ts`, no delivery variables): the form action is the
`mailto:`, client-side Zod errors and focus, the "Almost there" panel, no network request;
`buildInquiryMailto` output checked (CRLF body, encoded subject). Globe: the scene mounts and
the SVG fades at 1440 and 390 with and without reduced motion; focusing a location sets
`aria-pressed` and lists its project link; dragging raises no errors; with WebGL blocked the
SVG fallback with eight pins stays. Lighthouse 12 (Chrome headless, local production
server): desktop About 99 / 100 / 96 / 100, Home 99 / 100 / 96 / 100, Non-profits 88 / 100
/ 96 / 100 (performance / accessibility / best practices / SEO); mobile About 91, Non-profits 61. The best-practices deduction on every page was the analytics script 404 off Vercel (now
gated). The Non-profits desktop run's 254 ms blocking time is the shared hydration cost, not
the globe: my own 4x-CPU long-task measurement puts `/nonprofits` at 334 ms against
`/students` 318 ms and `/` 285 ms, and the three.js chunk is confirmed not to load before
the globe scrolls near the viewport.

**Decisions made this session**

1. Phase order: Phase 3 ran as Session 6, before Phase 2; the portal is now Sessions 7–10.
   `docs/PLAN.md` §11 records it.
2. Content: `content/about.ts` (`aboutPageSchema`: mission headline lines and body, story
   paragraphs, facts with optional links), `content/nonprofits.ts` (`nonprofitsPageSchema`:
   `scope.build` / `scope.avoid`, `nextSteps`), `content/instagram.ts`
   (`instagramPostSchema`: post URL, media key, alt, caption; a TODO URL renders an unlinked
   tile), `processStepSchema.partner` (the nonprofit's part at each step, shown on
   `/nonprofits` as "Your part"), `projectFrontmatterSchema.geo` (`[lat, lng]`; the eight
   placeholders carry state / country centroids), six nonprofit FAQ entries (cost, timeline,
   who, time, ownership, when) with `[TODO: confirm]` markers. Loaders: `getAboutPage`,
   `getNonprofitsPage`, `getInstagramPosts`, `getPartnerLocations` (visible projects grouped
   by their `location` string; the first `geo` in a group places the pin).
3. About order: hero with the "On this page" row → Mission (the tagline as the headline
   beside the organization photo at 4:3) → Who we are (paragraphs beside a facts list:
   founded, based at, open to, team size, Instagram) → Exec board (4:5 photo, name, role,
   LinkedIn button when the URL is not TODO) → Awards (the home component with
   `headingLevel="h2"`) → the curated Instagram grid (six square tiles, follow button, no
   embed script) → `WhoWeServe` as the "Get involved" hand-off → `ContactCta`. Own OG image.
4. Non-profits order: hero ("Start a project" → `#start`, "On this page" row) → How it works
   (the four process steps with their wireframes static and a "Your part" block each) →
   Scope (We build / We don't, two bordered lists) → Partners (globe + location list) →
   Partners say (nonprofit testimonials over the dotted map, dev preview until published) →
   FAQ → Start a project (intake form beside "What happens next"). No `ContactCta`: the
   intake section closes the page and the season CTA is for students. Own OG image.
5. Forms share one layer. `src/lib/forms/fields.ts`: `FormState<Field>`, `readValues`,
   `emptyValues`, `firstFieldErrors` (first Zod issue per top-level path), the honeypot
   helpers. `src/lib/forms/deliver.ts`: `deliverSubmission({ table, record, email })` to the
   Supabase REST API and/or Resend from the same environment variables as before.
   `src/components/forms/`: `useFormSubmission` (`useActionState` in server mode, client-side
   Zod plus `mailto:` in mailto mode, focus on the first invalid control), `SentPanel`,
   `Honeypot`. The contact form was moved onto it (its schema now exports `CONTACT_FIELDS`
   and `contactMessageText`; the contact-only helpers are gone) and re-tested. Intake:
   `src/lib/inquiries/schema.ts` (organization, name, email, optional website normalised to
   `https://`, optional location, message 20–3000 characters), `deliver.ts` (table
   `nonprofit_inquiries`, subject "Project inquiry from <organization>"),
   `src/app/nonprofits/actions.ts`, migration
   `supabase/migrations/20260907000000_nonprofit_inquiries.sql` (length checks, RLS on with
   no policies, `handled_at`). `docs/DEPLOY.md` §5 and `.env.example` cover both forms.
6. Globe. `src/lib/geo.ts` (`sphericalToVector`, `projectOrthographic`, `shortestAngle`,
   `GLOBE_TILT` 32°) is shared by the SVG `Globe` (new `pins`, `activePinId` and `spin`
   props; back-facing pins hidden; pins move with the spin) and `src/components/globe/`.
   `PartnerGlobe` (client) renders the SVG globe with pins first, checks WebGL and the
   data-saver flag once (`useSyncExternalStore`), mounts `PartnerGlobeScene` through
   `next/dynamic` (`ssr: false`) when the globe is within 240 px of the viewport, fades the
   SVG out on the scene's first render, and turns horizontal pointer drags into rotation
   (`touch-action: pan-y`, so vertical swipes still scroll). The scene: an occluding sphere
   in the page background so only the front hemisphere shows, the wireframe (parallels every
   15°, meridians every 12°, the SVG globe's spacing), land dots parsed at runtime from
   `public/maps/world-dots.svg` (`landDots.ts`; its constants must match
   `scripts/gen-world-dots.mjs`), one square pin per location (mint with a pulsing outline
   when active), camera at z 3.8 with a 32° field of view, device pixel ratio capped at 2, a
   low-power context. Rotation state is a `SpinController` class: slow spin (3°/s), ease to
   the chosen pin's longitude the shortest way round, hold six seconds, drag. The frame loop
   runs while the globe is in view and the tab visible, on demand otherwise and under
   reduced motion (which snaps instead of easing). `PartnersMap`: hovering, focusing or
   tapping a location sets `aria-pressed`, lists its projects (`aria-live="polite"`) and
   turns the globe to it; the initial spin puts the Atlantic in front. The canvas root is
   `aria-hidden`; the list is the accessible content.
7. Type and lint fallout from three.js: R3F v9 augments React's JSX namespace, which turned
   `ElementType`-typed `as` props into never-props, so `Eyebrow.as` is a literal tag union.
   The React Compiler lint rules rejected mutating ref objects received through props, hence
   the controller class with methods. Both are now in CLAUDE.md → Component rules.
8. Analytics: `@vercel/analytics` (`<Analytics />` in the root layout) renders only when
   `process.env.VERCEL` is set, because the script 404s anywhere else and failed
   Lighthouse's console audit locally. Enable Web Analytics in the Vercel project
   (`docs/DEPLOY.md` §2 step 5). The privacy policy's "when you visit" section now
   describes it (cookieless page views, referrer, coarse device and country, a daily hash)
   with a `[TODO: confirm]` for once it is switched on, and lists Vercel as the processor.
9. Lighthouse findings left as they are (all pre-existing patterns, logged for a decision):
   the hero's mount reveal keeps the LCP element at opacity 0 until hydration, which under
   simulated slow 4G is 3–4 s (mobile LCP 3.4 s on About, 4.7 s on Non-profits; desktop
   0.9–1.1 s); the shared vendor chunk (Framer Motion + React) is the ~300 ms hydration task
   on every page; 13 KiB of legacy polyfills and render-blocking CSS from Next. Options for
   the first: render the hero text visible on first paint and animate only the decoration,
   or keep the fade and accept the mobile score.
10. Removed `StubSection` (both stubs are pages now). `JumpLinks` replaces the inline "On
    this page" markup (Students uses it too). `WhoWeServe` takes `id` / `eyebrow` / `lines`;
    `Awards` takes `headingLevel` / `id`. The Partners section clips overflow: the globe's
    glow (`inset-[-10%]`) pushed phones 15 px wide.
11. `NonprofitTestimonials` first rendered `ul > Reveal > li`, which axe flagged (`list`);
    `li` is the direct child again and the rule is written down in CLAUDE.md.
12. Testing notes: a `[role="alert"]` wait must target the field error id, because an
    unrelated alert appears before the action returns; with JavaScript off, Playwright's
    `click()` never settles, so dispatch the click; Lighthouse ran with
    `pnpm dlx lighthouse@12` and `CHROME_PATH` at the installed Chrome (the JSON reports
    were not committed).

**Known gaps**

- The Instagram grid is six placeholder tiles with TODO URLs (unlinked) until Ashton adds
  post links and images; an official embed needs a Meta app (Phase 4).
- Partner pins sit at state / country centroids and the location labels read
  "[TODO: city], …"; a city in each project's `location` and a precise `geo` fix both.
- The intake form shows the "not connected" panel in production until the club email
  (mailto mode) or the delivery variables exist, and the `nonprofit_inquiries` migration is
  not applied anywhere yet.
- The "what we don't build" list, the next-steps copy, the exec-board blurb, the "Your part"
  lines and several nonprofit FAQ answers are defaults marked `[TODO: confirm]`.
- Nonprofit testimonials and the stats are still unpublished (dev preview only).
- Mobile Lighthouse LCP (decision 9). The three.js chunk (about 600 KB before compression)
  is the largest asset on the site; it loads only when the globe is near the viewport and
  never on other pages.
- The analytics component is inert until the Vercel project exists and Web Analytics is on.

**TODOs for Ashton (content and accounts)**

- Everything from Sessions 1–5 still stands.
- `content/about.ts`: the mission statement, the founding story, the founded year.
  `content/exec.ts` + `content/media.ts`: the exec board with photos and LinkedIn URLs; the
  exec-board blurb in `ExecGrid.tsx`.
- `content/instagram.ts`: six post URLs, images (media keys `instagram.post-N`), alt text.
- `content/nonprofits.ts` and the `partner` lines in `content/process.ts`: confirm the scope
  guardrails, the next steps, the check-in cadence and what the handoff includes.
  `content/faq.ts`: the nonprofit answers (cost and third-party costs, timeline,
  eligibility, time, ownership, when intake closes).
- `content/projects/*.mdx`: cities and precise `geo` per nonprofit.
- `content/testimonials.ts`: nonprofit quotes (`kind: "nonprofit"`), then `published: true`.
- Supabase: apply `supabase/migrations/20260907000000_nonprofit_inquiries.sql` with the
  contact one. Vercel: enable Web Analytics once the project exists, then confirm the
  privacy paragraph.
- Decide on the hero reveal versus mobile LCP (decision 9).

## Next session starts with

**Session 7: application portal, part 1 (schema + auth).** Read `docs/PLAN.md` §5 and §9,
this file, and `node_modules/next/dist/docs/` for `proxy.ts` and server actions, then:

1. Supabase: the same project as the contact and intake tables. Migrations for `cycles`,
   `roles`, `questions`, `applications`, `answers`, `reviews`, `admins` with RLS (applicants
   read and write only their own draft while the cycle is open; admins read everything and
   write reviews and status), plus the two migrations already in `supabase/migrations/`.
2. Auth: email magic link (OTP) for any email, `profiles` row on first sign-in, admins by
   email in `admins`, checked server-side. `/apply` becomes the season landing + sign-in;
   keep the header CTA on the external form until the Phase 2 dry run passes.
3. Custom SMTP through Resend for auth emails (the built-in sender is 2 per hour).
4. If the Supabase project does not exist yet, write the migrations and the auth UI first
   and test against a local `supabase start` (Docker), or stop at the schema and log it.
5. Screenshots to `docs/screenshots/session-7/`, `pnpm a11y --routes=/apply`, update this
   file. Needed from Ashton: Supabase and Resend accounts, the exec email list, this
   cycle's roles and questions.

## Session 5 — 2026-09-06 (home + global audit pass)

**Built:** Ashton's audit of the home page and the global elements (this session replaced the
planned portal start; the portal moves to Session 6). Global: square corners everywhere,
frosted glass for elevated surfaces, one hover language, crosshair frame marks. Nav: tagline
out of the header, drawer headline removed, LinkedIn in the drawer and footer. Footer:
frosted glass with the pixel dinosaur peeking out from behind it. Home: statement-only hero,
"What we do" (services + organization photo + projects link) instead of the featured grid,
the scroll-driven "From discovery to delivery" process, Impact with three count-up tiles, a
full-width rotating testimonial band and an awards subsection, and "Who we serve" moved to
just before the FAQ. `docs/PLAN.md` §10 records the amendments. Commits: `feat(tokens)`,
`feat(content)`, `feat(ui)`, `feat(layout)`, `feat(home)`, `docs`. Not pushed.

**Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` clean.
Screenshots in `docs/screenshots/session-5/` (production build; stats and testimonials are
unpublished, so production shows only the awards block in Impact; the dev-server captures of
the full band are in the session log below). `pnpm a11y` on the production build
(`/`, `/projects`, `/students`, `/contact`, `/projects/placeholder-project-1` with the
lightbox open, the 404) and on the dev server (`/` with the unpublished stats, marquee and
pause button): 0 violations at 1440 and 390 and with the drawer open. `/dev/ui` reports the
two intentional "fail" rows of the contrast table (dev only, by design). Checked by hand in
Playwright: the process panel swaps graphics as the steps cross the middle of the viewport
(`process-step2/3.png`), the numbers count up on first view, the marquee pauses on hover and
through the button, the drawer, hover states on cards, buttons and nav links.

**Decisions made this session**

1. Radii are gone: `--radius-sm` and `--radius-md` are 0 in `globals.css` and every
   `rounded-sm` / `rounded-md` class was stripped (`rounded-full` stays for avatars and the
   focus ring lost its 2px radius). Placeholder SVGs lost their `rx` too.
2. Three utilities carry the "technical and spatial" language: `glass` (a `color-mix` of the
   surface with a 20px backdrop blur; `[--glass-alpha:80%]` tunes it) on the header, drawer,
   footer, stat tiles, testimonial cards, badges and carousel buttons; `hover-corners`
   (green viewfinder brackets drawn by one pseudo-element with eight gradient layers, the
   corner length animating through a registered `@property`) on every interactive surface
   (Card with `href`, project cards, drawer grid links, 404 cards, gallery thumbnails);
   `frame-marks` (crosshairs centred on the corners of framed containers: hero, page heroes,
   `Section frame`). Hover is now one rule set (CLAUDE.md → Component rules): text links go
   green, surfaces get brackets + `border-line-strong` + `bg-surface-2`, arrow cells fill
   green, nav links show the green underline, nothing translates or scales (the cover zoom on
   project cards and gallery thumbnails is gone, as are the card lift and button lift). Mint is
   the focus ring only; every `hover:*-mint` became green.
3. `SplitButton` secondary now turns its border and arrow cell green on hover, matching the
   project-card arrow. The drawer CTA is a `SplitButton` instead of a plain green link.
4. Header: the tagline is no longer rendered (it stays in `site.ts` for metadata and the
   footer). Drawer: the "Software for good, built at Purdue." block is gone, social buttons
   are square 44px cells, the panel is glass. LinkedIn shows in both because
   `site.socials.linkedin` is now the company page found by a web search
   (`linkedin.com/company/hack-the-future-at-purdue`), flagged for confirmation.
5. Footer (`SiteFooter` + `brand/PixelDino`): the panel is glass with a transparent strip
   above it; the dinosaur is a 22×20 pixel map rendered as `<rect>`s with `crispEdges`, a
   green drop shadow and a radial glow behind it, positioned so the head sits in the open and
   the body blurs behind the glass. It rises into place once (`whileInView`) and blinks every
   six seconds (`anim-eyelid`); both are off under reduced motion. Decoration only.
6. Hero: eyebrow + "Building software / for nonprofits." (stagger, second line green) + the
   globe floating behind the second line; the blurb, academic year, deadline note, both
   buttons and the scroll marker were removed. `academicYear` and `SeasonNote` remain for the
   other pages.
7. "What we do" (`home/WhatWeDo`, `content/services.ts`, `serviceSchema`): three service
   panels separated by hairlines with a lucide icon each (titles use the Headline accent
   syntax), the full-organization photo placeholder (media key `org.group-photo`, 21:9 from
   `sm`, caption `[TODO]`) and a secondary "See our projects" button. The copy is the club's
   previous site copy from the audit screenshots ("Deliver FREE software", "at absolutely no
   cost", …). `FeaturedProjects.tsx` was deleted; `featured` in project frontmatter and
   `getFeaturedProjects()` still exist for a later use.
8. Process (`home/Process` + `ProcessScroll` + `ProcessGraphic`, `content/process.ts`,
   `processStepSchema`): on `lg+` a sticky glass panel on the left cross-fades between four
   wireframe SVGs (radar sweep, team network with 1 filled lead / 5 developers / 2 dashed
   designers, terminal with filling bars, the globe with a delivery pin) while the steps
   scroll on the right; the active step is the one crossing the middle 16% of the viewport
   (IntersectionObserver, no scroll listener). The panel readout shows `02 / 04`, the title
   and a progress line. Below `lg` each step carries its own graphic inline. Animations are
   CSS classes (`anim-sweep`, `anim-ping`, `anim-draw` with `pathLength="1"`, `anim-grow`,
   `anim-blink`) that pause or reset through `[data-active="false"]`, so inactive graphics
   cost nothing; the global reduced-motion rule flattens them. Without JavaScript every step
   is readable and the panel shows step 1. Steps 3–4 are the previous site's copy (step 4's
   last clause was completed from a cropped screenshot); steps 1–2 follow PLAN §3.
9. Impact (`ImpactBand`): `content/stats.ts` was cut from five to three (the "U.S. states"
   and "Student members" tiles are listed under TODOs). `StatTile` is glass and renders
   `CountUp`: the server prints the final value, the client drives the visible copy through
   the DOM from 0 with an ease-out over 1.5 s the first time the tile is half in view
   (staggered 140 ms per tile), a visually hidden copy keeps the real value for assistive
   tech, and reduced motion or a value without a number ("[TODO]") renders as-is.
10. Testimonials are a full-width marquee (`home/TestimonialMarquee`, `marquee` /
    `marquee-track` utilities): two copies of the list (the second `aria-hidden`), one CSS
    animation sliding by 50%, edge fade by mask, pause on hover / focus inside and through a
    44px glass pause button (`aria-pressed`), 12 s per card. Under reduced motion it is a
    horizontally scrollable row instead. Cards are glass, square, sized by quote length (≥ 90
    characters gets the 34rem card, shorter the 22rem one) and stretch to one height.
    `testimonialSchema` gained an optional `headline` (the green line above the quote);
    four placeholders of varying length seed the band in development.
11. Awards (`home/Awards` + `AwardCarousel`, `content/awards.ts`, `awardSchema`): a
    record table (issuer · award · date) from `sm` up, a stacked list on phones, then a 3:2
    photo carousel with glass prev / next buttons and a polite counter (hidden with one
    photo). The 2025 entry ("Purdue Student Life Honors", "2025 Innovative Program", April 2025) is transcribed from the audit screenshot and published; its photo is the
    placeholder `awards.student-life-2025`. `getAwards()` follows the published / preview
    rule of stats and testimonials, and `ImpactBand` renders whenever any of the three lists
    has items (production currently shows only the awards).
12. Home order: Hero → What we do → Process → Impact → Who we serve → FAQ → Contact CTA.
13. `scripts/gen-placeholders.mjs` writes two new files (`org-photo.svg` 2400×1030,
    `award-photo.svg` 1800×1200). `/dev/ui` shows the surface language, both testimonial
    widths, the count-up tiles, the four process graphics and the dinosaur.

**Known gaps**

- The LinkedIn URL is from a search result, not confirmed by the club.
- The award wording, the process copy and the "free / no cost" claims come from the previous
  site; the FAQ's `[TODO: confirm]` on cost can be resolved once Ashton confirms them.
- Hover brackets need a pointer; touch users see the focus ring and colour changes only.
- The frame crosshairs sit on the viewport edge at exactly 1440px (the container is full
  width there) and only show fully above that width or inside padded sections.
- The organization and award photos are placeholders; the alt text needs writing with them.
- `/dev/ui` intentionally shows two failing contrast samples, so `pnpm a11y --routes=/dev/ui`
  reports them; production never includes that route.

**TODOs for Ashton (content and accounts)**

- Everything from Sessions 1–4 still stands.
- `content/site.ts`: confirm the LinkedIn company URL.
- `content/media.ts`: the full organization photo (`org.group-photo`) and the award photo
  (`awards.student-life-2025`), plus captions and alt text in `WhatWeDo.tsx` /
  `content/awards.ts`.
- `content/awards.ts`: confirm issuer / award / date wording; add other awards.
- `content/stats.ts`: confirm the three tiles (or swap the third for "U.S. states" or
  "Student members") and set `published: true`.
- `content/testimonials.ts`: real quotes with headlines, then `published: true`.
- `content/services.ts`, `content/process.ts`: confirm the wording.
- Footer: decide whether the tagline stays under the logo, and whether the dinosaur stays.

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
