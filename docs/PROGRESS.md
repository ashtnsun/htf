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
- [x] Session 8b: home + global audit 2 (Home tab and centred nav, green bar CTA, `nonprofits` spelling, What we do reflow, one scroll-morphing process scene, Impact map backdrop, awards and caption cleanup, Who we serve cards, beacon graphic, footer, green inline links)
- [x] Session 10: home audit 3 (full-bleed hairline rows, centred projects button, the isometric process scene with no counter under it, Impact map lower, 2px divider and green arrow cell on every primary button, plain Who we serve panels, the docking graphic in Get involved)
- [x] Session 10, audit 4: framed rows, recognizable process pictures (form, team, laptop, rocket), wider marquee fade, "Learn more" buttons and the project-card hover on Who we serve, the paper plane in Get involved
- [x] Session 11: Shift + M site configuration panel (per browser, ships hidden) with ten home hero variants (Globe stays the default; Atlas, Typewriter, Ticker, Focus, Torch, Cells, Wordmark, Rows, Photo); Ashton picks the one that ships
- [x] Session 11b: ten Get involved graphic variants as the menu's second setting (Plane stays the default; Door, Puzzle, Canvas, Chat, Badge, Calendar, Terminal, Keycap, Signpost), all recognizable objects without the corner brackets; Ashton picks the one that ships
- [x] Session 11f: How it works drawn with the footer T-rex (detective, team, builder, party) dissolving cell by cell between the steps
- [x] Session 11h: the scene after Ashton's review (hats worn on the head, the team as three T-rexes, the gift arm attached and no partner, the dissolve on its own clock)

### Phase 3 — Depth (Session 6, pulled ahead of the portal)

- [x] Session 6: About (mission, who we are + facts, exec grid, awards, curated Instagram grid, get-involved panels, CTA, share image)
- [x] Session 6: Non-profits (how it works with "your part", scope guardrails, partner globe, nonprofit testimonials, FAQ, intake form → `nonprofit_inquiries` / Resend / mailto, share image)
- [x] Session 6: three.js partner globe with pins (lazy, on demand near the viewport; SVG globe with pins as fallback and first paint)
- [x] Session 6: analytics (Vercel Web Analytics, Vercel builds only; privacy text) and the Lighthouse pass (numbers and open findings in the Session 6 log)
- [x] Session 10b: exec board by year (chip per school year, `?board=` in the URL, LinkedIn cell on every card); the sticky section bar under the hero on About / Students / Nonprofits; /apply survives an unreachable database
- [ ] Real stats and testimonials: the sections read published items already; needs Ashton's numbers and quotes (`published: true`)
- [ ] Media handoff swap: needs the photos (`content/media.ts` keys)

### Phase 2 — Application portal (Sessions 7–10)

- [x] Session 7: schema + sign-in. Migration `20260908000000_application_portal.sql` (profiles, admins, cycles, roles, questions, applications, answers, reviews; RLS, guard trigger, explicit grants), seeds, local Supabase stack, email code + magic-link sign-in (`@supabase/ssr`), `/apply` season landing with account panel, `/auth/confirm`, `src/proxy.ts`, `/apply/form` and `/admin` gates, `NEXT_PUBLIC_APPLY_MODE` switch, `docs/DEPLOY.md` §6
- [x] Session 8: multi-step application form with autosave (profile → roles → questions → review, one step per URL, works without JavaScript), submit with the confirmation email (Resend), `/apply/submitted`, read-only after submit / deadline
- [x] Session 9: exec dashboard (`/admin` counts, filters and search in the URL, sortable table, CSV export; `/admin/applications/[id]` with the read-only summary, the review panel, the status control and the other reviews)
- [ ] Session 12: Resend SMTP and rate limits on the hosted project, keepalive cron, dry run with five exec members, `NEXT_PUBLIC_APPLY_MODE=portal` on production

### Phase 4 — Later

- [ ] Blog (MDX), nonprofit application reuse, brand-font swap (Cunia + Josefin Sans), Instagram API embed

## Session 11h — 2026-09-08 (the dino process scene, Ashton's review)

Ashton's review of Session 11f: the detective hat should fit on the head; the team should
not be other species but three of the same dino as the normal one, told apart by colour or
accessories; the builder should wear a construction hat on his head; the deliver scene
should lose the dinosaur on the right and keep the arm connected while handing the gift; and
the scroll transitions should be smoother: the transition was on screen more than the
pictures, and you could only see a finished picture by stopping on a very small stretch of
scroll.

**Built** (PLAN.md §22):

1. `home/ProcessSprites.ts`: hats are worn. Their brim now covers the head's top row (local
   row 0) instead of hovering a row above it, and each is drawn the head's width. The
   deerstalker keeps its two tied flaps and gains the two peaks that curve down past the
   head; the hard hat is a round dome with a ridge and a visor over the face (it was a cone);
   the party hat moved down one row. The team is the footer T-rex twice more (`mirrored()`
   from the shared map), facing the first one, one in square glasses, one in a backwards
   cap; the triceratops, stegosaurus and pterodactyl are gone. Deliver: the long-necked
   partner is gone; the arm is held out to the side of the box (three cells, two rows) and
   gains one cell as it pushes the box a cell forward, so it never detaches from the body or
   the box; the box moved one cell right and its ribbon's horizontal band stops short of the
   hand, so the arm no longer runs into the ribbon; the confetti spreads across the whole
   stage. The magnifying glass now lifts one row and drops back instead of circling (the
   circle pulled the handle out of the hand on two of its four frames), and the handle gained
   the cell that joins it to the ring. Every layer can name an `eye`, so the teammates blink
   too (only in their step).
2. `home/ProcessScene`: the dissolve runs on the scene's own clock. The store carries the
   step index (`StepStore`, was `ProgressStore` with a float); when it changes, the outgoing
   cells flip off and the incoming cells flip on in twelve hashed buckets over 600 ms (the
   incoming half a beat behind), from a `requestAnimationFrame` loop that stops when nothing
   is pending. A new step mid-dissolve retargets the pending flips. Under
   prefers-reduced-motion the flips are immediate. Layers present in every step are no longer
   bucketed (203 live paths). The prop is `step` (was `progress`); the stills on /nonprofits
   and /dev/ui pass the index.
3. `home/ProcessScroll`: the scroll only picks the step. The reading line's position between
   the step centres becomes the nearest step with a 6% hysteresis band around each midpoint,
   so a stop right at a midpoint never flickers; the eased float progress and its rAF loop
   are gone. The picture therefore holds for the whole stretch between midpoints and the
   dissolve is the same half second whatever the scroll speed.
4. `globals.css`: `dino-peer` is a one-row lift; `dino-reach` (the extra arm cell) runs in
   step with `dino-offer`; `[data-mode="team"] .anim-dino-blink` reuses the footer's
   `eyelid` keyframes for the teammates; the flap keyframes are gone.

**Checked:** `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm a11y` (0 violations), and
two Playwright passes at 1440 and 390 (`.tmp-scene*.mjs`, deleted): `data-mode` follows the
step and the loops run only in their step (2 / 7 / 4 / 6 animations, the teammates' blinks
among the 7); a scroll stopped exactly at the midpoint between Match and Build leaves the
scene fully resolved on Match (no mask both shown and hidden); an instant jump from Discover
to Deliver resolves on Deliver within a second; the gift's translate and the reach cell's
opacity change on the same frame; under reduced motion the switch is a cut with nothing
mixed 60 ms later and no animation running; no console errors from the scene (the one error
under reduced motion is the pre-existing CountUp hydration mismatch). Captures in
`docs/screenshots/session-11h/`: `scene-<n>-<step>-<width>.png` for the four resting frames,
`-b` the hammer struck / the confetti later, `-pushed` the gift pushed forward, `-lifted` the
glass lifted, `scene-mid-0-1` a frame 180 ms into a dissolve, `-reduced` the reduced-motion
still, `process-<width>.png` the section, `nonprofits-how-it-works-1440.png` the stills.

**Decisions**

1. "3 of the same dinos" is read as three T-rexes in total (the lead plus two teammates):
   a fourth does not fit the 64-cell stage at the footer dino's size without overlapping.
   The teammates stay green (the pixel rule: dinosaurs green, props white) and differ by
   accessory rather than colour; square glasses and a backwards cap read at 5 px cells where a
   ring, a diamond, a headset, a bow tie and a necktie (all rendered and compared) read as
   eyes or blobs.
2. The dissolve is time-based, not scroll-based, because a scroll-locked dissolve is a
   transition the reader can stop inside; 600 ms in twelve buckets reads as one smooth
   dissolve and finishes on its own.
3. Nothing attached to the body is ever translated: the offer is an extra arm cell plus the
   box moving, the peer is a vertical lift (the handle's first cell stays beside the hand).

**TODO:** Ashton's second look at the scene (the team's accessories, the confetti-only right
half of Deliver now that the partner is gone).

## Session 11g — 2026-09-08 (the hero and Get involved shortlists)

Ashton's call on the Shift + M menu: drop Ticker, Focus, Torch and Rows from the heroes and
Door, Puzzle, Canvas, Calendar, Keycap, Signpost and Plane from the Get involved graphics;
Terminal is the Get involved default. `HERO_VARIANTS` is now Globe (default), Atlas,
Typewriter, Cells, Wordmark, Photo; `INVOLVED_VARIANTS` is Terminal (default, in the bundle),
Chat, Badge. Their files, the rows in `Hero.tsx` / `InvolvedGraphic.tsx` and the `/dev/ui`
entries are gone, and so is the CSS only they used (`fly`, `dots`, `involved-press`, `-glow`,
`-arm`, `-cursor-a` / `-b`). A browser that had a removed id saved falls back to the defaults
(`store.ts` validates on read; checked, no console errors). Screenshots:
`docs/screenshots/session-11g/`. The hero decision itself (which of the six ships) is still
open. The parallel Session 11f session swept the staged deletions and the `/dev/ui` edit into
its two commits; the rest is `chore(config): …`.

Then `ui/SplitButton`: the secondary arrow is white at rest (was green) and turns black on
the green hover fill. Every button's contents now slide on hover while the button stays put:
the label rolls up and an `aria-hidden` copy rises from below (500ms, ease-out-expo). Both
copies sit in one clipped box, so nothing resizes (checked: the header bar CTA's box is
identical at rest and on hover). `motion-reduce:transition-none` makes the swap instant.
The arrow keeps its earlier nudge along the direction it points; a first cut had it slide out
of the cell while a copy slid in, which Ashton found buggy, so that was reverted.
CLAUDE.md's hover rule names this as the one exception to "nothing translates". Screenshots:
`buttons-*.png` and `header-cta-hover.png` in `docs/screenshots/session-11g/`.

Then the recruitment timeline on /students, "cooler and not as large". The vertical spine
(1274px tall at 1440) is now a horizontal track, `students/TimelineTrack` (client) under the
same heading: a grid of cells, six across on lg, three on md, two on phones, each cell's top
edge its piece of the rail with a 12px square node at the left end, the step number and date
in eyebrow type, the title at `text-body-lg`, a `text-sm` description. Inside the section's
`RevealGroup` (stagger 0.12) the cells arrive left to right: the rail segment scales in from
the left, the node pops, the text rises. Segments and nodes go green up to the current step
(still -1 with no dates), whose node gets a ping ring (`anim-hero-ping`) and the "Now" tag.
Heights: 587px at 1440 (was 1274), 783 at 768, 1070 at 390 (was 1430); cells below lg carry `pb-10` so wrapped rows keep their distance. Screenshots:
`timeline-before-*.png`, `timeline-{1440,1440-mid,768,390,1440-reduced}.png`.

Found on the way: under prefers-reduced-motion every `Reveal` section rendered blank. Framer's
`useReducedMotion` is already true on the client's first render, so `Reveal` switched to a
plain div while the server had rendered the motion div with the hidden inline styles; React
never patches attribute mismatches, so `opacity: 0` stayed. `motion/useReducedMotionSafe`
reports false until hydration (`useSyncExternalStore` with a false server snapshot) and
`Reveal`, `RevealGroup` and `TimelineTrack` use it, so the static branch is a normal update.
The footer `PixelDino` still logs the same mismatch under reduced motion (its `initial`
styles); not touched here.

## Session 11f — 2026-09-08 (the dino process scene)

Ran alongside a second session (the hero and Get involved decisions) in the same tree.

Ashton's request: the How it works graphic uses the dinosaur. Discover is a detective dino
with a magnifying glass; Match adds a few other dinos, all distinct, to form a team; Build is
a construction dino hammering; Deliver is a party dino handing over a gift box; every
addition in exactly the footer T-rex's pixel style; and the dinos animate or transition
between the steps.

**Built** (PLAN.md §21):

1. `brand/dino-pixels.ts`: the 20 × 22 T-rex map moved out of `PixelDino` (which now imports
   it) with the eye, the arm cells and a `dinoCells()` helper, so the footer and the scene
   read one map.
2. `home/ProcessSprites.ts`: the scenes as string maps on the same grid (`#` green, `o`
   white, `+` the lens tint), placed relative to the T-rex's top-left cell on a 64 × 40
   stage: the deerstalker, the glass with its handle and eight trail dashes; the triceratops,
   the stegosaurus and the pterodactyl (body plus a wing frame above and below); the hard
   hat, the hammer raised and struck, the spark and six bricks; the party hat, the gift with
   its ribbon and bow, the longer arm, twelve confetti cells in three groups and the
   long-necked partner. Every layer lists the steps it belongs to; the T-rex body and arm are
   in all four. Designed in a Pillow renderer in the scratchpad (contact sheets at 12 px and
   4 px cells) before any React.
3. `home/ProcessScene`: rewritten. One `<path>` per layer, ink and dissolve bucket (cells
   merged into row runs; 210 paths live); a hash of each cell's position puts it in one of
   ten buckets, and as the progress crosses from one step to the next each bucket flips at
   its own point (outgoing cells off, incoming on), so nothing is ever half-visible. The
   effect patches `opacity` only on the paths that changed and `data-mode` (the nearest
   step) on the svg; the stills render only their step's resting layers. Container 8:5, no
   `anim-float` (a fractional bob would blur the pixels); the glow behind stays.
4. `globals.css`: `dino-*` keyframes, all `steps()`, gated by `[data-mode]`: the glass peers
   round a one-cell square, the trail dashes appear one after another, the arm waves twice
   and the triceratops and stegosaurus bob out of phase while the pterodactyl flaps, the
   hammer strikes once a second with a spark, the gift is pushed toward the partner and the
   confetti falls twelve cells in twelve steps; reduced motion drops the delays and every
   loop ends on its resting frame. The magnify / flame / trail keyframes of the old pictures
   are gone.
5. `content/process.ts` + schema: `graphic` is `detective | team | builder | party`.
   `ProcessScroll`: the scene is `min(80vw, 20rem)` wide on phones and up to 1.6 × the free
   viewport height on desktop. `HowItWorks`: stills up to 18rem. `/dev/ui`: the four stills.

**Checked:** `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm a11y` on `/` and
`/nonprofits` (0 violations at 1440 and 390 and with the drawer open), and a Playwright pass
that scrolls each step to the reading line and reads the svg: `data-mode` follows the step,
the loops run only in their step (10 / 7 / 4 / 6 animations), no console errors. Captures in
`docs/screenshots/session-11f/` (`scene-<step>-<width>.png`, the mid-dissolve frames
`scene-mid-*`, two hammer frames, the section captures, the nonprofits stills and the
`review-*.png` contact sheets).

**Decisions**

1. Two inks: dinosaurs green, hats / tools / gift white (`--text`), so a hat does not merge
   into the head; the lens is a 28% green tint. Still the one cell grid, no outlines.
2. The T-rex never moves between steps (it is the same character); companions and props
   dissolve. The dissolve is a hard per-cell flip in ten hashed buckets, not a fade.
3. The team is three other species (triceratops, stegosaurus, pterodactyl) rather than
   accessorised T-rexes, and the Deliver partner is a fourth species so it reads as the
   nonprofit receiving the gift.
4. The scene no longer floats: a continuous fractional translate softens crisp pixels.

**TODOs**

- Timings and the number of waves / strikes are the `[data-mode]` rules at the end of
  `globals.css`; the drawings are string maps in `home/ProcessSprites.ts` (edit them like
  the footer map).

## Session 11e — 2026-09-08 (the footer T-rex)

Ashton's request: the footer dinosaur is the offline-page T-rex (the icon he attached), in HTF
green, peeking out a good amount. It also answers the Session 5 question of whether the
dinosaur stays: it stays.

1. `brand/PixelDino`: the 22×20 map is replaced by a 20×22 map traced from the icon (a
   majority vote of the dark pixels in each cell of its 19.5 px grid; the icon's diagonals are
   not quite on the grid, so the back steps two cells once), still one `<rect>` per cell with
   `crispEdges`. The eye is the empty cell at row 2, column 12 and still blinks through the
   `anim-eyelid` rect. The icon faces right; the `<g>` is mirrored (`translate(20 0)
scale(-1 1)`) so the footer's T-rex looks left, toward the page (Ashton asked for the
   flip). Same green (`text-green`), glow, rise-in and reduced-motion behaviour.
2. `SiteFooter`: the footer sets `--dino-w: clamp(11rem, 16vw, 15rem)`; the dinosaur is that
   wide (was `clamp(10rem, 16vw, 14rem)`), sits at `right-8` / `sm:right-[12%]` (was
   `right-4` / `sm:right-[8%]`, Ashton asked for it slightly further left) and the glass
   panel's top margin is `calc(var(--dino-w) * 0.75)` (was 6rem / 7rem; Ashton chose 0.75
   over a first 0.85), so at every width the head, arm, tail and body down to the belly sit in
   the open strip and the belly's taper and the legs are behind the glass (14 of the 22 rows
   show at 1440, 13.6 at 390).
3. Checks: typecheck, lint, build, `pnpm a11y` on `/` (0 violations), footer captures at 1440
   and 390 in `docs/screenshots/session-11e/`.

## Session 11d — 2026-09-08 (seven review tweaks: cards, section bar, timeline, globe, partners, testimonials)

Ran alongside Session 11b/11c (htf-30) on the same tree; file ownership settled by message.

**Built** (one commit each):

1. `projects/ProjectCard`: the nonprofit name and the year share one line with no rule
   between them (name left, year right, on the arrow cell's column); the arrow cell is a
   plain right arrow (`ArrowRight`), not the external `ArrowUpRight`. Also committed the
   orphaned `ProjectsExplorer` change from 2026-09-07 (the "n projects" filter count is
   `sr-only`, read by screen readers only).
2. `layout/SectionNav`: the bar is 56px tall (`h-14`, `BAR_HEIGHT` and `--subnav-h`
   follow) with `px-4` links; the "About |" page name and its divider are gone. The `label`
   prop stays and names the landmark ("Students sections"), so the three pages and `/dev/ui`
   are unchanged.
3. `students/RecruitmentTimeline`: one vertical timeline instead of the three-column card
   grid. A spine runs down the page with a square node per step; on md+ the step number and
   date sit right-aligned to the left of the spine, the title and description to the right
   (13rem / 3.5rem / 1fr, 16rem / 4rem / 1fr on lg); on phones the spine is a 2.5rem left
   column and the meta line sits above the title. The gap between steps is padding on the
   content cell, not the `li`, so the spine column spans it (the first version broke between
   steps). Segments and nodes turn green up to the current step once the steps carry dates;
   the current one is still marked "Now". Spine is `bg-muted/35`, upcoming nodes
   `border-muted/60` (`line-strong` was invisible against the grid overlay).
4. `globe/*`: the partner globe drags in any direction. `SpinController` gained `tilt`
   (rotation about the screen's horizontal axis on top of `GLOBE_TILT`, clamped to ±1.2 rad),
   `drag(dx, dy)`, and settles the tilt back to 0 with the same easing as the pin aim once
   the six-second hold ends or a pin is chosen (snaps under reduced motion). The wrapper
   tracks both pointer axes; the scene sets the outer group's `rotation.x` each frame.
   `touch-action: pan-y` stays, so on phones vertical swipes scroll and the tilt comes from
   diagonal drags.
5. `nonprofits/PartnersMap`: the location rows lost the "1 project" count and the whole
   project-link panel under the list (the `aria-live` region and its hint copy). Rows are
   node + location; the section's "See the projects" button is the way to the projects.
6. `nonprofits/NonprofitTestimonials`: the partner quotes drift in the home page's
   `TestimonialMarquee` (pause button, focus pause, reduced-motion scroll row) over the
   dotted map. The marquee took a `heading` slot (the eyebrow + headline render there, the
   pause button sits at their baseline) and a `className` for its top margin, and it repeats
   a short list inside each half of the track (`MIN_CARDS_PER_HALF = 4`) so two quotes do
   not leave a gap on wide screens; repeated copies are `aria-hidden` (`Card` and
   `TestimonialCard` now forward `aria-hidden`).

**Checked:** `pnpm typecheck`, `pnpm lint`, `pnpm build` (with the other session's
uncommitted files in the tree), `pnpm a11y` on /projects, /students, /nonprofits (0
violations), screenshots in `docs/screenshots/session-11d/`, and a Playwright drag on the
globe (a diagonal drag tips it; it settles back).

**Decisions**

1. Removing the location's project links means the partner list only drives the globe; the
   buttons keep `aria-pressed` and the section's button carries the traffic to /projects.
2. The tilt settles back to rest after the hold rather than staying, so the idle globe always
   returns to the brand's tipped pose.

**TODOs**

- `content/recruitment.ts` still needs the six dates plus ISO `date` fields; only then do the
  green spine segments and the "Now" tag appear.
- If the marquee's pause button should sit lower on the nonprofits page (it aligns with the
  headline's baseline now), give `TestimonialMarquee` a `controls` position prop.

## Session 11c — 2026-09-08 (four tweaks from Ashton's review)

1. Nav: the current-page underline is 2px and sits at `bottom-1.5` of the link (was a 1px
   hairline on the link's bottom edge), so it reads as part of the label.
2. Header bar CTA: the divider between the label and the arrow cell is 1px on the `bar`
   size only (`SplitButton`); every other primary keeps the 2px divider.
3. How it works: the corner brackets are gone from `ProcessScene` (the same stills on
   /nonprofits lose them too). On desktop the sticky scene box is now the full viewport
   height (`top-0 h-svh`, flex-centred) so the graphic sits at the middle of the screen
   while the steps scroll; its width is capped at `100svh - header - 8rem` so it never
   overflows short viewports. The first and last steps are `min-h-svh` and every step is
   vertically centred, so step 1 and step 4 line up with the scene at both ends of the
   scroll.
4. `CountUp` default duration 3000 ms (was 1500).

## Session 11b — 2026-09-08 (ten Get involved graphic variants)

**Built:** Ashton asked for ten distinct variants of the Get involved graphic in the
Shift + M menu, none using the corner pattern on the container, all on brand and meaning
something rather than abstract. The menu gained its second setting, "Get involved graphic"
(`INVOLVED_VARIANTS` in `src/lib/config/options.ts`; `SiteConfig` is now `{ hero, involved }`,
the store parses both keys and ignores unknown ones; `ConfigMenu` renders one generic
`VariantPicker` per setting, each with a note saying where to see the choice). `layout/ContactCta`
(server) computes the season props (`getDeadlineParts()` in `content/site.ts`, new: the deadline
as year / month / day in the club's zone; the cycle name; `site.academicYear`) and renders
`layout/involved/InvolvedGraphic`, a client switch like `home/Hero`: `PlaneGraphic` (the default)
ships in the bundle, the nine others are `next/dynamic` chunks behind a square placeholder so
nothing jumps. `layout/involved/GraphicFrame` is the shared square (the glow, the bob and the
pointer tilt, `data-involved` + `data-active` on view for the variants' one-shots and loops) with
a render prop handing each variant `{ active, reduce }`. The viewfinder corner path is gone from
the plane and appears in none of the others. `PaperPlaneGraphic.tsx` is deleted; the dev UI kit
page (`/dev/ui`) shows all ten side by side. The variants:

1. **Plane** (default): the paper plane on its dotted flight path, as before minus the corners.
2. **Door**: HTML boxes rather than SVG: a lit doorway, the leaf turning on a real 3D hinge to
   58° on view and 74° while the pointer is over the frame, a wedge of light across the floor
   and a mat in perspective.
3. **Puzzle**: two jigsaw pieces labelled Students and Nonprofits (eyebrow-style, a green square
   before each) that slide together on view; the outlines turn green and a blurred green seam
   lights up once they meet.
4. **Canvas**: a design canvas (a "Home" artboard) holding a wireframe of an app; a student's
   cursor (green name tag) and a nonprofit's cursor (outlined tag) each rest on an element
   they have selected (handles / a dashed outline) and wander the board on slow CSS loops that
   pause off-screen.
5. **Chat**: three bubbles: yours (labelled "You"), HTF's reply in green, and a typing indicator
   whose dots bounce; the bubbles pop in one after another.
6. **Badge**: a member badge on a lanyard: the real `<HTF/>` glyphs from `brand/logo-paths`, a
   photo placeholder, name bars, the issuing cycle ("FALL 2026" in season, the academic year
   otherwise) and a green MEMBER band; it drops from above and swings to rest.
7. **Calendar**: a wall calendar page for the deadline's month (real data: September 2026, the
   12th filled green and ringed by a drawn circle); the rows fade in one by one; out of season
   the header shows the academic year over an empty grid, never an invented date.
8. **Terminal**: a window with three title squares (one green); `$ htf apply` typed out, three
   output bars typing in, a drawn check with "sent", then a new prompt with a blinking block.
9. **Keycap**: a 3D Enter key (top face, two side faces, the return arrow, the word Enter) in a
   hairline plate; it presses down with the glow under it flaring once on view, and again
   while the pointer is over the frame.
10. **Signpost**: a post with a green cap, two arms with green arrowheads, Students pointing
    left and Nonprofits right, bolts where they meet; the arms swing in on view.

Commits: `feat(layout): ten Get involved graphic variants in the Shift + M menu` and `docs:
session 11b …`. Not pushed. The parallel session `htf-64` (Session 11c) worked in the same
tree on other files at the same time; each session staged only its own paths.

**Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm build` (the home page and the four pages with the block are still static: the choice is read on the client, never on the server; no warnings). A Playwright script
(`.tmp-involved.mjs`, deleted) seeded each choice in localStorage, scrolled the section into
view at 1440 and 390, waited for the entrance and captured the section:
`docs/screenshots/session-11b/involved-<id>-1440.png`, `-390.png`, `-1440-reduced.png`
(prefers-reduced-motion, captured right away: every variant finished) and
`-1440-pointer.png` for Plane, Door, Canvas, Badge and Keycap, plus
`config-menu-involved-1440.png` (the panel scrolled to the second setting, Puzzle chosen; the
stored value read back as `{"hero":"globe","involved":"puzzle"}`). axe with the full tag set:
0 violations on all ten at 1440 and on the open panel; no horizontal overflow at 390; no
console or page errors. `pnpm a11y --routes=home,about,students,projects`: 0 violations on all eight scans plus the open drawer. `pnpm screenshots --routes=home`: the standard `home-1440.png`, `home-390.png` and `drawer-390.png` in the same folder.

**Decisions made this session**

1. Ten objects, one meaning each: send (Plane), the door is open (Door), the two audiences fit
   (Puzzle), build it together (Canvas), a message is enough (Chat), belong (Badge), the
   deadline (Calendar), apply in a developer's language (Terminal), press to start (Keycap),
   two ways in (Signpost). Nothing abstract, no particles or isometric scenes, and no
   viewfinder corners on any container (the plane lost its corner path too).
2. Facts on the graphics come from content: the calendar's month and day and the badge's
   cycle name arrive through `ContactCta`'s props from `content/site.ts` (`getDeadlineParts`,
   `site.season.cycleName`, `site.academicYear`); out of season the calendar shows the
   academic year over an empty grid rather than an invented date. The words on the pictures
   are limited to the audiences, "You" / "HTF", "MEMBER", "Enter", "Home", `$ htf apply` and
   "sent", each in a colour pair that passes AA (axe scans SVG text too).
3. The frame is hydration-safe: `useReducedMotion()` is honoured only after hydration
   (`useSyncExternalStore` with a false server snapshot). The old plane set `data-active`
   from it during hydration, so for a reduced-motion visitor the server's
   `data-active="false"` mismatched the client's `true`, React left the attribute unpatched
   (it never repairs attribute mismatches) and the plane never flew for them.
4. Typing is JS state, not CSS steps: the terminal first typed each character with a 1ms
   `steps(1, end)` animation and a per-character delay, and Chromium dropped the forwards
   fill of some of them (whichever ran near the moment the section's `Reveal` finished), so
   the command read "htf ap". Timers setting a `typed` count, and the whole command under
   reduced motion, are deterministic.
5. The bob and the tilt are separate elements in `GraphicFrame`: the old plane had
   `anim-float` and the inline tilt transform on the same element, and a running CSS
   animation wins over an inline style, so the tilt never showed.
6. Door is HTML/CSS (a real `rotateY` on a hinge under perspective); the rest are SVG on the
   400 × 400 stage in the ProcessScene language (`STROKE` green 1.5, `HAIRLINE`, surface / bg
   fills). Keycap's press animation uses `animation-fill-mode: backwards` so the pointer's
   own transform (`group-hover/frame:[transform:translateY(14px)]`) takes over once it has
   played; `forwards` would have pinned it.
7. Reduced motion: the global rule flattens the animations, and a new rule zeroes
   `animation-delay` / `transition-delay` inside `[data-involved]` so staggered one-shots
   (calendar rows, terminal lines, chat bubbles, signpost arms) are finished at once; the
   variants also pass `reduce` into the `delay()` helper for the same reason.
8. The note under each setting points at where to look: for Get involved an in-page link to
   `#get-involved` on the four pages that end with the block (home, About, Projects, Students;
   a hard-coded list in `ConfigMenu`), a link home elsewhere. "Reset to defaults" enables
   when any setting differs (`isDefaultConfig`).

**Known gaps**

- Under prefers-reduced-motion the dev console shows a hydration mismatch on every page:
  `motion/Reveal` renders a plain div for reduced motion on the client but the motion div on
  the server (`data-reveal`, the hidden style). Pre-existing and unrelated to the graphics;
  React regenerates the tree so nothing is visibly wrong. Worth the same
  `useSyncExternalStore` treatment in a later session.
- Touch devices get the entrance but not the pointer play (the door's wider swing, the
  keycap's second press, the tilt).
- Canvas's cursors wander on fixed loops; they do not react to the pointer.
- Calendar out of season is an empty grid under the academic year; if that reads as
  unfinished, hide the variant out of season.

**TODOs for Ashton**

- Open a page that ends with Get involved (home is easiest), press Shift + M and arrow
  through the ten graphics in the second section. Say which ships; I set `DEFAULT_INVOLVED`
  and delete the rest (their files under `src/components/layout/involved/`, their rows in
  `INVOLVED_VARIANTS` and in `InvolvedGraphic.tsx`).
- The hero choice from Session 11 is still open.

## Session 11 — 2026-09-08 (Shift + M site configuration menu, ten hero variants)

**Built:** Ashton asked for a shortcut menu (Shift + M) that opens a configuration panel for
the site, with the home hero as its first setting, and ten distinct hero variants to choose
from. `src/components/config/ConfigMenu.tsx` is the panel: a non-modal dialog on the right
edge (glass, an X cell like the drawer's, the shortcut shown as keys), one radio row per
variant with its name and a one-line blurb, "Default" on the shipped one, "Reset to
defaults", and a link to the home page when the panel is opened elsewhere. Choices live in
`src/lib/config/store.ts` (localStorage, `htf:config:v1`, cross-tab through the `storage`
event) behind `useSiteConfig()`; `src/lib/config/options.ts` is the registry
(`HERO_VARIANTS`, `DEFAULT_HERO`, `SiteConfig`). `home/Hero.tsx` is now a client switch:
the default `GlobeHero` (the hero exactly as it was) ships with the page, the other nine are
`next/dynamic` chunks fetched only when chosen. The copy moved to `content/hero.ts`; the
page passes the season CTA and the partner pins (`HeroProps`). The variants, all in
`src/components/home/heroes/` on the shared `HeroShell`:

1. **Globe**: unchanged (statement, wireframe globe, glow, grid).
2. **Atlas**: the statement centred, the dotted world map below with routes drawing out from
   Purdue to every partner location; pins pop in as each route lands and ping; pointing at a
   pin brings its route forward.
3. **Typewriter**: the headline types itself in behind a green block cursor (the eyebrow's
   square, grown); the cursor blinks when done; a Replay button re-types it.
4. **Ticker**: the statement as one oversized band between hairlines (the site's `marquee`
   utilities); drag scrubs it, a Pause / Play button stops it, it pauses off-screen.
5. **Focus**: the viewfinder brackets as a live element, resting around the green line and
   locking onto whichever word or the eyebrow the pointer rests on.
6. **Torch**: the statement in the muted tone with a light that drifts on its own until the
   pointer takes it over, lifting the words to full white and green where it shines.
7. **Cells**: the technical grid as a canvas whose cells light up under the pointer and fade
   over a few seconds, after one diagonal sweep on load.
8. **Wordmark**: the `<HTF/>` glyphs at full frame width, each drawing its outline and then
   filling (letters green, marks deep green), tilting toward the pointer; the statement below.
9. **Rows**: a spec sheet in the language of the full-bleed rows: eyebrow and academic year,
   one row per headline line, then Students, Nonprofits and the season CTA as framed cells.
10. **Photo**: the organization photo (still the placeholder) full-bleed under a gradient,
    the statement and the CTA at the bottom left, a slow parallax on scroll.

Commits: `feat(home): Shift + M site configuration menu with ten hero variants` and `docs:
session 11 …`. Not pushed. The parallel session `htf-64` committed the exec board and the
section bar in the same tree; each session staged only its own paths.

**Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm build` (the home page is still static:
the choice is read on the client, never on the server). A Playwright script drove every
variant at 1440 and 390 with the choice pre-seeded in localStorage: one `h1` per page, the
statement intact, no horizontal overflow at 390, no console or page errors, and axe with the
full tag set reported 0 violations on all twenty scans plus the panel open at both widths.
The panel: Shift + M opens it, focus lands on the current choice, checking Rows swaps the
hero live and stores `{"hero":"rows"}`, Escape closes it and returns focus, Shift + M
reopens it. `pnpm a11y --routes=home` (default hero + drawer): 0 violations. Screenshots in
`docs/screenshots/session-11/`: `hero-<variant>-1440.png` and `-390.png` for all ten,
`hero-<variant>-1440-pointer.png` with the pointer resting on the second line (Focus,
Torch, Cells and Atlas show their interaction there), `config-menu-1440.png` /
`-390.png` and the same with Rows chosen, plus the standard `home-*.png` full pages.

**Decisions made this session**

1. The choice is per browser (localStorage), not a cookie or a search param: reading either
   on the server would make `/` dynamic for every visitor. The server and the first client
   paint always render the default (`useSyncExternalStore` with a default server snapshot);
   a saved choice takes over right after hydration and the hero remounts (`key`) so the new
   variant plays its entrance. Visitors never see anything but `DEFAULT_HERO`.
2. The panel ships in production, hidden: no visible affordance, keyboard only, harmless to
   a visitor who finds it (it changes only their own view). It is non-modal (no backdrop, no
   scroll lock, no focus trap) so the hero stays live under the pointer while choosing;
   Escape closes it, focus returns to where it was, and the shortcut ignores keystrokes in
   form fields. Choosing a hero (`DEFAULT_HERO` in `options.ts`) is the one code change once
   Ashton decides; the other variants can then be deleted or kept.
3. `cn()` now registers the type scale with tailwind-merge (`src/lib/utils.ts`):
   `text-display-fluid`, `text-h2` and the other `--text-*` tokens looked like colours to it,
   so a later `text-muted` silently replaced the size (the first Torch build rendered the
   headline at 16px). `Headline`'s own `text-text` was being dropped the same way, harmlessly,
   since the body colour is white. Any new `--text-*` token must be added to that list.
4. Every variant keeps the same semantics: `section[aria-labelledby=hero-title]`, one `h1`,
   the copy from `content/hero.ts`, graphics `aria-hidden`, and a reduced-motion state that
   is the finished picture (no drift, sweep, typing, band motion, parallax or tilt).
   Loops are paused off-screen through `data-live` on the shell (`.anim-hero-ping`) rather
   than `data-active`, whose rule would reset draw-in strokes every time the hero left view.
5. Ticker scrubs the CSS marquee animation itself through the Web Animations API
   (`getAnimations()`, `currentTime`), so no offset bookkeeping and the loop stays seamless;
   the reduced-motion render is the wrapped statement inside the band.
6. Torch never uses outlined text: axe would fail the contrast of a transparent fill. The
   base `h1` is real muted text (7.5:1), the lit copy is an `aria-hidden` duplicate under a
   radial mask. The light's coordinates are CSS variables on the stage, set from pointer
   events without React state.
7. Cells is a 2D canvas driven by a `CellField` class (state out of React, like
   `SpinController`); the frame loop runs only while a cell is lit or the sweep is running,
   and stops when the hero leaves view.
8. Atlas maps `public/maps/world-dots.svg` as the equirectangular grid it is (3.2 units per
   degree from longitude −180 and latitude 84); routes are quadratic curves bowing upward;
   pins are HTML boxes positioned in percent so they keep their pixel size at any map width.
   The pin data is `getPartnerLocations()`, the same placeholders (state and country
   centroids) as the partner globe.
9. Rows draws its three cells by hand in the split-button language (label cell, arrow cell,
   the 2px black divider on the primary) because a `SplitButton` cannot stretch to fill a
   grid cell; the rails sit at the content edges like the What we do row; the academic year
   comes from `site.academicYear` and hides on phones where it wrapped.
10. Typewriter keeps the whole headline in the DOM from the first paint (untyped characters
    are only transparent), with a `<noscript>` style that shows them, so assistive tech,
    search and the no-JavaScript render get the full sentence.

**Known gaps**

- The choice cannot be shared by link; a `?hero=` parameter would need a client-side read to
  keep the page static. Ask if the exec board should vote from links.
- Touch devices get the entrance motion but not the pointer interactions (Torch drifts on its
  own, Cells sweeps once, Focus rests on the green line).
- Photo shows the placeholder art until the organization photo lands in `content/media.ts`.
- Ticker's band assumes one copy of the statement is wider than the viewport (about
  2,900px at the largest type size); beyond that a gap would show at the seam.
- Typewriter delays the largest contentful paint by design (the headline appears over ~1.6s).

**TODOs for Ashton**

- Open the home page, press Shift + M and try the ten heroes (arrow keys move through
  them). Say which one ships (or which two or three to keep for later) and I will set
  `DEFAULT_HERO`, delete the rest and note it in PLAN.md.
- The real organization photo (`org.group-photo`) is what makes Photo a real option.
- Everything from earlier sessions still stands.

## Session 10b — 2026-09-08 (exec board by year)

**Built:** the About page's exec board works like the projects index (PLAN.md §18). Each
member row in `content/exec.ts` now carries a `year` ("2026–27"); `getExecYears()` lists the
boards newest first and `ExecGrid` renders a chip per year above the cards, the newest board
by default. The switch is `about/ExecBoard` (client), the projects explorer's pattern: the
chosen year lives in the URL (`?board=2025–26`, the newest year clears it, the `#exec` hash is
kept) via `history.replaceState`, cards cross-fade with `AnimatePresence` (reduced motion
skips the animation), a screen-reader-only live region announces the board, and the static
HTML carries the newest board through the Suspense fallback. `linkedin` is required on every
member (a URL or a "TODO" note; `cycleYearSchema` is shared with projects), so every card has
the LinkedIn cell: a link when the URL is known, a dashed placeholder while it is a TODO.
Verified with Playwright at 1440 and 390 (chips, URL, deep link, no console errors), axe 0
violations on /about, typecheck / lint / build clean. Screenshots in
`docs/screenshots/session-10b/`.

**Decisions**

- No "All" chip: a board belongs to one year, so the chips only switch boards, and a single
  board hides the chip row.
- A 2025–26 board of two TODO members exists so the switch is visible; replace or delete it.
- Slugs carry the year (`ashton-sun-2026`) because one person can sit on several boards.

**Section bar, later the same session.** Ashton asked for a new way to navigate the About,
Students and Nonprofits pages that stays out of the hero (another session was rebuilding
heroes). `layout/SectionNav` replaces the `JumpLinks` row that sat inside the hero: a 48px
hairline bar right under the hero that sticks beneath the site header, with the page name,
a rule and the section links. A scroll listener (rAF-throttled, no IntersectionObserver)
underlines the section on screen with the header's current-page language and sets
`aria-current="location"`; at the bottom of the page the last section wins; on phones the row
scrolls sideways (`scrollbar-none`) and keeps the current link centred. The bar publishes
`--subnav-h` on the root element while mounted and `[id] { scroll-margin-top }` adds it, so a
jump lands 24px below the bar (measured 128px from the top at 1440 and 390). Without
JavaScript the links are plain anchors. `JumpLinks.tsx` is deleted; `/dev/ui` shows the bar.

**/apply was a 500.** `.env.local` runs the portal against the local Supabase stack and Docker
was off, so the cycles query threw "fetch failed". Docker's restart left the containers in
"Exited" (`supabase start` then says "already running"); `supabase stop` + `supabase start`
recreated them. The page now also degrades: when the cycle query fails it logs the error and
renders a "The portal is taking a moment" hero with Try again (and Email us once the club
email is known) instead of the error page; verified by stopping the Kong container.
Screenshots (`*-sectionnav-*.png`) in `docs/screenshots/session-10b/`; axe 0 violations on
the three pages. The production build was red at the end of the session only because the
other session's `Hero.tsx` imported hero files that did not exist yet.

**TODOs for Ashton**

- `content/exec.ts`: the real boards per year (names, roles, LinkedIn URLs, photos via
  `content/media.ts`); confirm 2026–27 is the current board and whether 2025–26 is wanted.

## Session 10 — 2026-09-07 (home audit 3)

**Built:** Ashton's third audit of the home page, eight numbered changes, each applied to
every page that reuses the element (PLAN.md §16). What we do: the three service panels sit in
a full-bleed hairline row (the lines run edge to edge, the columns stay on the container's
columns) and the projects button is centred. How it works: a completely new scene
(`home/ProcessScene`), an isometric build instead of the particle morph, and no counter or
progress bar under it. Impact: the dotted map starts below the band's top edge and fades out
before its own edges. Header CTA: a 2px divider between the label and the arrow cell. Who we
serve: two plain panels (eyebrow, title, one sentence, label and arrow) in the same full-bleed
row, also on /about. Get involved: `layout/ConnectGraphic` (two modules docking) replaces the
beacon, and every primary button is now the bar's green-on-green treatment, so lime is unused.
Commits: `feat(home): audit pass 3 …` and `docs: session 10 …`. Not pushed. A second Claude
session (`htf-64`) reworked the project cards in the same working tree at the same time; each
session committed only its own files.

**Audit 4, later the same session** (PLAN.md §17), five items: vertical rails on the outer
edges of the full-bleed rows (What we do and Who we serve); the process scene redone once
more as recognizable pictures, the intake form under a magnifying glass, the team, a laptop
with code typing itself in, a rocket, cross-fading with scroll; a wider fade at both ends of
the testimonial marquee; Who we serve panels with a "Learn more" split button and the project
cards' hover (green title, the button in its hover state); and a paper plane on a dotted
flight path in Get involved in place of the docking modules. Commits: `feat(home): audit pass
4 …` and `docs: session 10, audit 4 …`.

**Verified:** `pnpm typecheck`, `pnpm lint`, Prettier on the changed files, `pnpm build`.
`pnpm a11y` on the dev server (`/`, `/nonprofits`, `/about` at 1440 and 390, plus the
drawer): 0 violations; on the production build (`/`, `/nonprofits`, `/about`, `/students`,
`/contact`, `/projects` at 1440 and 390, plus the drawer): 0 violations. A Playwright check
at 1920, 1440, 1024 and 768 confirmed the bleed rows' columns land exactly on the photo's
edges and the page never scrolls horizontally. Screenshots in `docs/screenshots/session-10/`
(dev server, so the Impact band shows the unpublished stats and testimonials);
`process-1440-*.png` and `process-390-*.png` are viewport captures of the scene at progress
0 … 3, `get-involved-*.png` the docked graphic, `nonprofits-1440-stills.png` the four stills
from the production build.

**Decisions made this session**

1. Full-bleed rows: `--gutter` is a root token (`container-x` reads it) and `bleed-row-2` /
   `bleed-row-3` are grid templates with a `minmax(var(--gutter), 1fr)` track on each side
   and N columns capped at a third (or half) of `90rem − 2 × gutter`, so at every width the
   columns match `container-max container-x` exactly. The rows are `ul`s with `border-y`
   outside the container; the first `li` starts at column 2; on phones the panels stack with
   full-width hairlines and `px-(--gutter)`. Tailwind only generates classes it finds
   literally in the source, which is why these live in `@utility` rather than a built string.
2. Process scene: a 5 × 5 isometric plane (30px units in the 400 viewBox) with a target cell
   in the middle. Scan: a gradient band sweeps the plane (CSS `scan` keyframes, clipped to the
   plane) and the cell pings. Team: seven boxes travel in from outside the plane to a ring
   around the cell, each linked to it (draw-in lines). Build: four slabs extrude on the cell
   in order against a gauge whose ticks light per layer. Deliver: the stack lifts 0.8 units
   with a shadow, the team recedes to the rim at 30%, brackets and a status check appear.
   Everything is a function of the continuous progress (`sceneAt`), patched straight onto the
   SVG from the `ProgressStore` as before; boxes are painted back to front around the stack.
   No 3D tilt any more, only the float. `content/process.ts` names the stages `scan`, `team`,
   `stack`, `ship`; the stills on `/nonprofits` and `/dev/ui` show draw-in strokes complete
   (the `anim-draw` class is only applied when animating).
3. The counter, active title and progress bar under the scene are gone; on phones the scene
   is centred in the sticky strip (`w-[min(48vw,13rem)]`). The step list keeps its highlight.
4. Impact map: `top-24 md:top-32`, mask `radial-gradient(60% 58% at 50% 55%, #000 20%,
transparent 100%)`, so the top edge is fully faded and the whole map sits lower.
5. `SplitButton` primary: `border-l-2 border-black bg-green text-bg` on every size (the bar
   was `border-l` 1px, the others lime). Lime stays defined in globals.css but nothing uses it;
   `/dev/ui` still lists its contrast row.
6. Who we serve: eyebrow, `text-h3` title, one sentence, then a `label + arrow cell` line over
   a hairline, bottom-anchored through subgrid rows `auto auto 1fr auto`. Hover: corner
   brackets, `bg-surface-2`, the arrow cell fills green. The copy dropped the spec-row facts
   and now reads as one sentence per audience.
7. Get involved: `ConnectGraphic` shows two 128px modules on a ticked rail, a dashed link
   between them, plugs on the students module; on view (`useInView`, once) they slide
   together (900ms), the seam lights up with a blurred glow, the module outlines and status
   squares turn green, a line draws from the HTF mark down to the seam and slow ping rings
   start. The pointer tilt from the beacon stays. The server renders the open state; without
   JavaScript that is what shows. Reduced motion: docked, no transitions.
8. CSS cleanup: `sweep`, `grow-x`, `blink` and `orbit` keyframes and `.anim-sweep`,
   `.anim-grow`, `.anim-blink`, `.anim-orbit`, `.anim-orbit-back`, `.anim-dial` are gone;
   `scan` is new; `ping`, `draw`, `float`, `eyelid` stay.
9. Project cards (the other session, per Ashton): they no longer use `hover-corners`; their
   hover is a green border and rule, the cover brightening, a green title and the arrow fill.
10. Audit 4, rows: `md:first:border-l` joins `md:border-r` on every row item, so the outer
    columns are framed by rails; phones keep the stacked full-width hairlines only.
11. Audit 4, process scene: each step is a picture component on the same 400 viewBox stage
    (`FormPicture`, `TeamPicture`, `LaptopPicture`, `RocketPicture`), placed by `sceneAt`:
    opacity full within ±0.2 of the step and gone at ±0.7, the outgoing picture rising 36px
    and scaling to 0.92 while the next comes up from below. Per-picture animations run only
    while a picture is active (`data-active`): the magnifier glides (`magnify`), the check
    draws, avatars pop in (`pop`), code rows type in (`type`) with a blinking cursor, the
    flame flickers (`flame`) and the trail streams (`trail`). The animation classes are only
    applied on the live scene, so the stills show everything complete. Stage names in
    `content/process.ts`: `form`, `team`, `laptop`, `rocket`. The `scan` keyframes are gone.
12. Audit 4, marquee: `--marquee-fade: clamp(4rem, 12vw, 14rem)` on `.marquee` and the mask
    reads it on both sides (the old 6% was 86px at 1440 and read as a hard cut).
13. Audit 4, Who we serve: `SplitButton` gained `presentational` (a span with the button's
    classes, `group-hover:border-green` on the secondary variant) for a button inside a card
    that is itself the link; the panel link is a `group`, its title `group-hover:text-green`,
    and `hover-corners` / the surface change are gone from these panels.
14. Audit 4, Get involved: `PaperPlaneGraphic` (client). The plane's nose is at its local
    origin so `offset-path` (the flight curve, duplicated in globals.css) with `offset-rotate:
auto` makes it ride and turn with the path; `.anim-fly` rests at `offset-distance: 100%`
    and the `fly` keyframes run once when `data-active` flips on view. `[data-active=false]`
    parks it at 0% so the flight starts from where it sits. Browsers without motion paths get
    a static transform to the end of the path. The dotted path's dashes drift (`dots`), wind
    strokes fade in after the flight, the float and the pointer tilt stay. Reduced motion:
    resting at the end, no flight.

**Known gaps**

- Stats and testimonials are still `published: false`, so production shows the Impact band as
  the eyebrow plus the awards block.
- Subgrid (Who we serve, What we do) needs Chrome 117 / Safari 16 / Firefox 71; older
  browsers get unaligned rows and nothing else breaks.
- The build ran with the portal `.env.local` in place (the other session may need it), so the
  local production build has `/apply` in portal mode; the committed default is unchanged.

**TODOs for Ashton**

- Scroll the home page in a real browser: the cross-fade window is the `0.2 / 0.5` pair in
  `sceneAt` (`ProcessScene.tsx`); the flight takes 2.6s (`.anim-fly` in globals.css).
- Everything from earlier sessions still stands (stats, testimonials, photos, LinkedIn URL,
  wording confirmations).

## Session 9 — 2026-09-07 (Phase 2, part 3: the exec dashboard)

**Built:** the exec side of the portal (PLAN.md §5). `/admin` is the dashboard: counts by
status and by role (submitted applications only), a filter bar (search across name, sign-in
email, Purdue email, major, year and role names; status; role; year; reviews = by me / not by
me yet / by nobody) as a plain GET form, so every combination is a URL that can be shared;
the applications table (applicant with email, roles, year, a status chip, the submitted time
or the draft's last save, the average score with the review count, a check when the
signed-in member has reviewed) with Applicant / Submitted / Score headers that sort while
keeping the filters, drafts always last; and "Export CSV" (`/admin/export.csv`, same filters
and order: one row per application with the profile columns, roles, status, times, review
count, average, yes / maybe / no counts, every reviewer's notes and one column per question
of the cycle; UTF-8 with BOM, CRLF, safe against spreadsheet formulas).
`/admin/applications/[id]` shows the application read-only (the review step's
`ApplicationSummary` under an "Application" heading), the signed-in member's review (score
1–5 and decision yes / maybe / no as chips, notes; one `reviews` row per member, saved by
upsert, removable), the status control (submitted / reviewing / accepted / rejected /
waitlisted) and the other members' reviews. The forms post to server actions and come back
with a flash in the query string (`?review=saved`, `?status=refused`), so the pages work
without JavaScript. New: `src/lib/portal/admin.ts` (reads, filters, sorting, counts, CSV),
`src/components/admin/` (`ExecOnly`, `AdminFilters`, `ApplicationsTable` + `StatusChip`,
`ReviewPanel`), `src/app/admin/applications/[id]/{page,actions}.ts(x)`,
`src/app/admin/export.csv/route.ts`; `SelectField` and an `optionalNote` switch in
`Field.tsx`; `download` on `SplitButton`. Commits: `feat(portal)`, `docs`. Not pushed.

**Verified:** `pnpm typecheck`, `pnpm lint`, Prettier, `pnpm build`. Playwright against the
dev server and the local stack (`.tmp-admin.mjs`, deleted before the commit), signed in as
`admin@example.com` through the email code read from Mailpit: 12 rows with the submitted ones
first; the overview headline; the status filter through the form gives 4 rows and a Clear
link; `?status=submitted&reviewed=none&q=ada` gives Ada only; the empty state; the Score
header keeps `status=submitted` and sets `aria-sort`; the CSV answers 200 as `text/csv`, an
attachment named after the cycle and the day, BOM + header, 4 data lines, question columns
with the role prefix; the application page names the applicant; saving a review keeps the
score, decision and notes, reads "Review saved." and "Average 4.0 from 1 review."; the status
form moves it to Reviewing with "Status updated.", after which the table shows the average,
the check and the new status; `reviewed=me` gives 1 row and `reviewed=not-me&status=submitted`
3; a draft shows "Drafts cannot be reviewed" and no form; removing the review clears the
average; an unknown or malformed id is a 404; on the phone neither page overflows. A fresh
non-admin account sees "Exec only" on `/admin` and on an application and gets 403 from the
CSV; signed out, the CSV and both pages bounce to `/apply?next=…` (the proxy). axe: 0
violations on `/admin` at 1440 and 390, on the application page before and after a review at
1440 and 390, and on the Exec-only page. Screenshots in `docs/screenshots/session-9/`.

**Decisions made this session**

1. Everything reads through Row Level Security as the signed-in member: the pages gate with
   `requireUser` + `isAdminUser`, and the CSV route answers 401 / 403 / 404 instead of
   redirecting (the proxy still bounces signed-out visitors before it runs). No service role.
2. Filters live in the URL (`status`, `role`, `year`, `reviewed`, `q`, `sort`), validated by
   `parseFilters`; anything unknown means "all". Filtering, search and sorting happen in
   memory after one read per table (applications of the cycle, profiles in chunks of 150 ids,
   reviews and answers through an inner join on the cycle), which is fine for a club's few
   hundred applications; pagination can come later.
3. Profiles are fetched separately because `applications.user_id` references `auth.users`,
   not `profiles`, so PostgREST cannot embed them.
4. A review is upserted on `(application_id, reviewer_id)`; an empty score, decision or
   notes stores as null; the policies refuse reviews of drafts and the panel shows text
   instead of the form for them. Status changes go through the guard trigger (status only,
   never back to draft); zero rows updated reads as "refused".
5. The CSV quotes every cell, prefixes cells that start with `=`, `+`, `-` or `@` with an
   apostrophe (spreadsheet formula injection), joins lists with `; ` and keeps each
   reviewer's notes on their own line inside one cell.
6. The table wrapper is `relative overflow-x-auto`: the sr-only spans inside the table are
   absolutely positioned, and without the `relative` they escaped the scroll container and
   widened the phone page to 916px.
7. `SelectField` is a native select (keyboard and phone pickers for free) with a chevron
   drawn over it; `optionalNote={false}` hides "(optional)" on filter controls and on the
   review fields. The dashboard's date formatting reuses `formatPortalDate`.
8. The dev server on port 3000 crashed its worker mid-test ("Jest worker encountered 2 child
   process exceptions, exceeding retry limit", every page a 500) after the two sessions'
   heavy use; a restart fixed it. When a page 500s with that message, restart `next dev`.

**Known gaps**

- No pagination and no bulk actions; the CSV is the way to work on many applications at once.
- Reviewer names come from `profiles.full_name`, which applicants fill in through the form
  and exec members usually will not, so the panel and the CSV fall back to the email.
- The status vocabulary is the Session 7 enum; decisions still go out by email by hand.
- The local database keeps this run's test applications, one review and one Reviewing
  status.

**TODOs for Ashton (content and accounts)**

- Everything from Sessions 1–8b still stands.
- Add the exec board to `public.admins` on the hosted project (docs/DEPLOY.md §6) and try
  the dashboard on a preview deployment.
- Decide what the 1–5 score means (a rubric line for the hint) and whether "maybe" stays.

## Session 8 — 2026-09-07 (Phase 2, part 2: the application form)

**Built:** the applicant side of the portal (PLAN.md §5, §13). `/apply/form` is a four-step
form, one step per URL (`?step=profile|roles|questions|review`): profile (the `applications`
columns: name, year, major, Purdue email, LinkedIn, portfolio), roles (checkbox cards from the
open `roles`, each saying how many questions it adds), questions (the shared questions, then a
group per role applied for, rendered from the `questions` rows by kind: text, textarea with a
live counter, chips for select, checkbox chips for multiselect, url), and review (every answer
as definition lists with an Edit button per block, a "Before you can submit" list when
something is missing, a confirmation checkbox and the submit button). A stepper across the top
shows the current step and a check on complete ones; a glass aside carries the save status
("Not saved yet" / "Saved 1:02 PM" / "Last saved …" / "Couldn't save. …"), the deadline and
"Save and finish later". Drafts autosave when a field loses focus or a choice changes
(`autosaveApplicationStep`, a direct call from the client), and every button saves through the
one form action (`saveApplicationStep`, `nav` = continue / back / exit / submit / a step name)
and redirects to `?step=…#application-form`, so the form works without JavaScript. Submit
validates the stored draft, drops answers to questions of roles no longer applied for, flips
the status (the guard trigger stamps `submitted_at`), emails a plain-text confirmation through
Resend when configured and lands on `/apply/submitted` (what you sent, what happens next; the
blurb only claims an email when one went out). After submission, or after the deadline,
`/apply/form` shows the application read-only with a notice and contact links; the status page
lists the roles applied for. New: `src/lib/apply/` (`schema.ts`: steps, Zod for the profile,
roles and answers built from the question rows, problems, summary data; `state.ts`; `email.ts`),
`src/lib/portal/format.ts` (dates in the club's zone, client-safe), `src/components/apply/`
(`ApplicationForm`, `ApplicationSteps`, `ApplicationSummary`), `CountedTextArea`,
`CheckboxGroupField` + `CheckboxField` in `Field.tsx`, `sendEmail` in `lib/forms/deliver.ts`,
`name`/`value` on `SplitButton`, `getMyApplicationDetail` in `lib/portal/data.ts`,
`data-scroll-behavior="smooth"` on `<html>` (Next 16's request, so route transitions jump
instead of gliding). Docs: `docs/DEPLOY.md` §6, `.env.example`, CLAUDE.md folder map.
Commits: `feat(portal)`, `docs`. Not pushed.

**Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` clean (39
pages; `/apply/submitted` joins the on-demand routes). Playwright against the dev server and
the production build (portal mode, local Supabase, `example.com` accounts; screenshots in
`docs/screenshots/session-8/`): profile autosaves on blur and on a chip change and the aside
reads "Saved …"; an invalid link is reported inline by the autosave and not stored, the other
fields are; a reload prefills the draft and the aside reads "Last saved …"; Continue with an
invalid link shows the summary alert, the inline message and focuses the field; a valid link
without a scheme is stored as `https://…`; Continue lands on the next step scrolled to the form
with the step heading focused and the stepper marking Profile complete; Continue on Roles
without a role shows the message; picking roles autosaves; the questions step shows the shared
group plus one group per role picked (the Project Lead question stays hidden); Continue with a
required answer empty focuses it; the counter shows "67 / 1,500"; the review lists everything,
Edit jumps to the step and the stepper back to Review; submitting without the checkbox shows
the message; submitting lands on `/apply/submitted` without claiming an email when Resend is
off; `/apply/form` is then read-only ("Received …") whatever `?step` says; the status page reads
"Submitted" with "Roles: Developer, Designer"; the database holds `submitted`, `submitted_at`,
two roles, six answers as JSON strings with paragraphs kept, and `profiles.full_name`. Phone
(390): every step, no horizontal overflow, Enter in a field acts as Continue, "Save and finish
later" returns to "Draft in progress". Without JavaScript: the draft prefills, an invalid link
re-renders the page with the alert and the message keeping the values, Continue saves and
moves on, the stepper jumps a step (saving the role picked), "Save and finish later" returns
to the status page (the browser carries the `#application-form` fragment onto `/apply`, which
is harmless). Cycle closed in the database mid-draft: the autosave line reads "Couldn't save.
Applications closed …", Continue says the same, a reload shows the read-only "The deadline
passed." view and the status page "Draft not submitted". Confirmation email against a fake
Resend endpoint (`RESEND_API_URL`): one POST with the bearer key, `from` = `CONTACT_FROM`, `to`
= the applicant, no `reply_to` while the club email is a TODO, plain text greeting by first
name with the cycle, the roles and the time, and the redirect carries `?mail=sent`. axe: 0
violations on every state above at 1440 and 390 (a `target-size` hit on the stepper appeared
once when the sticky header covered it at the scan's scroll position; scans now start from the
top). `pnpm a11y` on the production build for `/apply` and `/` (drawer open): 0. The
committed default build (no `.env.local`) still redirects `/apply` to the external form and
`/apply/form`, `/apply/submitted` and `/admin` to `/apply?next=…`.

**Decisions made this session**

1. Lenient saves, strict moves (PLAN.md §13): a blur or a choice change saves every valid
   field of the step, empty included; Continue and Submit enforce required fields; an invalid
   value is never stored and blocks moving on. Native `required` still runs on Continue and
   Submit; the stepper, Back, Edit and "Save and finish later" buttons carry `formNoValidate`.
2. One action for every button: each submit button posts a `nav` value (`continue`, `back`,
   `exit`, `submit` or a step name) to `saveApplicationStep`, which saves the current step and
   redirects. A hidden first submit button makes Enter behave like Continue. Progressive
   enhancement comes for free; the JavaScript path only adds the autosave, the "Saved" line and
   focus management. The autosave skips when focus moves to one of the form's own submit
   buttons (that click saves anyway) and when nothing changed since the last save.
3. Errors and echoes: a failed submit returns the raw values so the reset form keeps them
   (React clears forms after an action); whichever of the step submit or the autosave ran last
   wins for the inline errors, the alert and the review's problem list. A closed cycle or a
   submitted application is detected as "0 rows updated" (RLS filters the row) and explained;
   messages raised by the guard trigger are shown as written.
4. Profile: years are `First year`, `Sophomore`, `Junior`, `Senior`, `Graduate student`,
   `Other` (`YEARS` in `lib/apply/schema.ts`); the Purdue email is optional and must end in
   `purdue.edu`; links are optional, get `https://` when the scheme is missing and must parse
   as http(s) with a dotted host; the account's profile name is kept in step with the
   application's name.
5. Answers: one `answers` row per non-empty answer (cleared answers delete the row);
   multiselect stores a string array; textarea limits count after normalising CRLF; a question
   without `max_chars` is capped at 20,000. Answers to questions of roles no longer applied for
   are kept while drafting (toggling a role back keeps the text) and dropped at submission.
6. Submit validates the database copy of the draft (`applicationProblems`), never the form,
   and requires the confirmation checkbox because the action is final. The confirmation
   email is plain text through the Resend API (`sendEmail`, shared with the notification
   emails); `RESEND_API_URL` exists only so a local fake server can receive it in tests.
7. Read-only views reuse the review's `ApplicationSummary` without Edit buttons; corrections
   go through the contact page. Decisions stay hidden from applicants.
8. `data-scroll-behavior="smooth"` on `<html>` so the redirect to `#application-form` jumps
   instead of gliding (the dev log asked for it).

**Known gaps**

- Session 9 builds the exec dashboard; `/admin` still shows counts only, so nothing reads
  the submitted applications yet.
- Every question is still a `[TODO: confirm]` placeholder and the `YEARS` list is a
  reasonable default; both need Ashton's word.
- The confirmation email has not been sent through real Resend or checked in a mail client;
  `CONTACT_FROM` must be a verified sender before the dry run.
- Two browser tabs editing the same step both save; the last blur wins.
- Without JavaScript the `#application-form` fragment follows the "Save and finish later"
  redirect onto `/apply` (browser behaviour for a 303 without a fragment).
- Playwright quirks logged: labels of screen-reader-only inputs need a click on the label
  (or `dispatchEvent` without JavaScript), and Next's route announcer also has
  `role="alert"`.
- A second Claude Code session (`htf-30`) was editing the home page, navigation and layout
  components in the same working tree during this session; its files were left uncommitted
  and untouched, and only the portal files listed above were committed (the shared
  `SplitButton.tsx` was staged hunk by hunk).

**TODOs for Ashton (content and accounts)**

- Everything from Sessions 1–7 still stands.
- Confirm the year list, the profile fields (is the Purdue email needed? is a LinkedIn
  worth asking for?), the questions per role with limits and required flags, and the wording
  of the confirmation email (`src/lib/apply/email.ts`).
- Decide whether applicants may edit after submitting before the deadline (today: no).
- Verify `CONTACT_FROM` in Resend so the confirmation can go out on the hosted project.

## Session 8b — 2026-09-07 (home and global audit 2; ran alongside the Session 8 form work)

**Built:** Ashton's second audit of the home page, fourteen numbered changes, each applied to
every page that reuses the element. Nav: Home tab first, links centred in the bar, no hover
underline, lighter glass, the bar CTA green on green with a black divider. Copy: "nonprofits"
as one word everywhere, "Student Org @ Purdue University", the footer's first column reduced to
the logo. What we do: photo first and without a caption, icons without boxes, panels aligned
with subgrid, the projects button on the right. How it works: one floating scene
(`home/ProcessScene`) that morphs through the four steps with scroll, replacing the four
graphics in a card. Impact: the dotted map as the backdrop instead of the ghost headline, no
"Small teams, global reach", no preview note, the marquee no longer pauses on hover. Awards:
eyebrow-only heading, plain table text, no photo captions anywhere. Who we serve: linked
spec-sheet cards. FAQ aside links green without underline (every inline link follows). Get
involved: the `layout/SignalGraphic` beacon instead of the static globe. Commit:
`feat(home): audit pass 2 …`. Not pushed. A second Claude session built the Session 8 form in
the same working tree at the same time; each session committed only its own files.

**Verified:** `pnpm typecheck`, `pnpm lint`, Prettier on the changed files, `pnpm build`
(before the last two cosmetic fixes; typecheck and lint re-run after them). `pnpm a11y` on
the production build (`/`, `/nonprofits`, `/about`, `/students`, `/contact`, `/projects` at
1440 and 390, plus the drawer): 0 violations; the dev-server home with the unpublished band: 0. Screenshots in `docs/screenshots/session-8b/` come from the dev server, so the Impact band
shows the unpublished stats and testimonials; `process-1440-*.png` and `process-390-*.png` are
viewport captures of the scene at progress 0.5 … 3, taken by scrolling in Playwright (no
console errors).

**Decisions made this session**

1. Nav: `site.nav` now includes Home (the drawer no longer prepends it). The header is a
   three-column grid on `lg` (logo · links · CTA) so the links sit at the true centre. Glass
   alpha 82% → 50%. Hovering a link only brightens it; `aria-current` keeps the underline.
2. Header CTA: `SplitButton size="bar"` primary renders its arrow cell `bg-green` with
   `border-l border-black`. The other primary buttons keep the lime arrow, because Ashton asked
   for the nav bar; flipping the rest is one line in `SplitButton.tsx`.
3. Spelling: `nonprofits` in code, content and CLAUDE.md (new content rule). PLAN §3 and §10
   keep their historical wording.
4. Inline text links (the FAQ asides and every other `linkClass`, forms included): `font-medium
text-green transition-colors hover:text-text`, no underline. The weight keeps them distinct
   from the surrounding text for axe's `link-in-text-block` rule (green on muted is 1.1:1, so
   colour alone would fail). The portal form pages belong to the other session and still use
   the underlined class.
5. What we do: the panel list is a grid with rows `auto / 1fr / auto / auto` and
   `md:min-h-[22rem]`; each `li` is a subgrid spanning the four rows, so titles and
   descriptions start on the same line across the three columns whatever their line counts.
   Icons are bare `size-7` lucide glyphs.
6. Process: `ProcessGraphic` is deleted. `ProcessScene` draws twelve squares with a formation
   per stage (radar blips → the team ring → terminal rows, window dots and cursor → pins on the
   globe), interpolates positions with smoothstep plus a per-particle stagger and a small lift,
   and cross-fades each stage's decoration with a tent function (full within ±0.15 of a stage,
   gone at ±0.6). A subtle 3D tilt follows progress and a CSS float keeps it "floating"; there
   is no card. `ProcessScroll` maps the reading line (50% of the viewport on `lg`, 64% on
   phones) piecewise-linearly between the step centres, eases it per frame (14%) and writes a
   `ProgressStore`; the scene subscribes and patches SVG attributes directly, so React never
   re-renders per frame. Reduced motion snaps to whole stages. On phones the scene sticks under
   the header beside the counter. `/nonprofits` and `/dev/ui` show stills (`progress={i}`,
   `animate={false}`). The schema's `graphic` field is now the stage order.
7. Impact: `Eyebrow` gained an `id` prop and is the section heading (`as="h2"`); the dotted
   map is the section backdrop (`w-[min(140%,120rem)]`, radial mask, 20% opacity, clipped by
   the section); `marquee` pauses through the button and focus-within only.
8. Awards: eyebrow heading (also on /about), `text-sm` cells, the carousel counter is a glass
   badge over the photo and `AwardPhotoSlide` lost `caption`. The organization photo on home
   and on About is a plain `div` (no `figcaption`). The project gallery on `/projects/[slug]`
   keeps its optional MDX captions: they are content, not placeholders.
9. Who we serve: each panel is one `Link` with the hover language (corner brackets, title and
   index turn green, the arrow cell fills green, a faint grid fades in), an outlined index
   numeral, the audience icon in a box, eyebrow, title, copy, a three-cell spec row (facts
   taken from the existing copy) and a label + arrow footer. The two panels are subgrid rows,
   so every line sits at the same height in both; one `Reveal` wraps the grid because subgrid
   needs the direct parent chain.
10. Get involved: `SignalGraphic` (client) is a ticked dial turning slowly, a dashed orbit
    with the two audiences (labels counter-rotated to stay upright), links that draw in on view
    (`useInView`), slow ping rings from the HTF mark, a glow, the float, and a ±5° pointer tilt
    written straight to the element's style; static under reduced motion. New CSS in
    `globals.css`: `orbit` and `float` keyframes, `.anim-orbit`, `.anim-orbit-back`,
    `.anim-dial`, `.anim-ping-slow`, `.anim-float`, all paused by `[data-active="false"]`.
11. Footer: only the logo in the first column; `site.tagline` still feeds the metadata.
12. The other session's `pnpm format` reformatted a few of these files while they were being
    edited (whitespace only); its dev-server restart on port 3000 did not affect the captures.

**Known gaps**

- Stats and testimonials are still `published: false`, so production shows the Impact band as
  the eyebrow plus the awards block.
- The three U.S. pins on the deliver stage overlap (Indiana, Illinois and Pennsylvania are
  close on a 149px globe).
- Subgrid needs Chrome 117 / Safari 16 / Firefox 71; older browsers get unaligned rows and
  nothing else breaks.
- `pnpm build` ran before the final two cosmetic fixes (links stop at the squares, the sticky
  block's background on phones); typecheck and lint were re-run after them.

**TODOs for Ashton**

- Scroll the home page and hover the beacon in a real browser; the morph speed, the tent width
  and the tilt are the constants at the top of `ProcessScene.tsx` (`STAGGER`, the `0.15 / 0.45`
  tent, `tilt`).
- Decide whether the lime arrow should go on the other primary buttons too (hero-less pages,
  Get involved, the drawer CTA).
- Everything from earlier sessions still stands (stats, testimonials, photos, LinkedIn URL,
  wording confirmations).

## Session 7 — 2026-09-07 (Phase 2, part 1: portal schema and sign-in)

**Built:** the application portal's foundation (PLAN.md §5, §12). Database: migration
`supabase/migrations/20260908000000_application_portal.sql` with `profiles` (trigger on
`auth.users`), `admins` (by email), `cycles`, `roles`, `questions`, `applications`, `answers`,
`reviews`, three enums, `is_admin()` / `cycle_is_open()`, a guard trigger on `applications`,
Row Level Security on every table and explicit grants; `supabase/seed.sql` (Fall 2026 cycle,
the three roles, seven placeholder questions) and `supabase/seed.local.sql` (a local admin).
Local stack: `supabase/config.toml` (ports 54331+, redirect URLs, one email template for both
the sign-up and magic-link mails, `supabase/templates/sign-in.html`). Auth: `@supabase/ssr` +
`@supabase/supabase-js`; `src/lib/supabase/` (env, per-request server client, proxy helper,
generated types), `src/lib/auth/` (Zod sign-in schema and `safeNextPath`, action state,
`getSessionUser` / `isAdminUser` / `requireUser`), `src/lib/portal/data.ts` (cycle, roles,
questions, my application, admin counts). Routes: `/apply` is the season landing in portal mode
(sign in with an emailed six-digit code or the link; signed in, an account panel with the
application status), `/auth/confirm` verifies the link, `src/proxy.ts` refreshes the session and
guards `/apply/form` and `/admin`, `/apply/form` (placeholder listing roles and questions,
Session 8 builds the form) and `/admin` (exec gate with counts by status, Session 9 builds the
dashboard). `content/site.ts` gained `season.applyMode` (`NEXT_PUBLIC_APPLY_MODE`), default
`external`, so production is unchanged. `docs/DEPLOY.md` §6 is the hosted runbook. Commits:
`feat(portal)` ×2, `docs`. Not pushed.

**Verified:** `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` clean (38 pages;
`/apply`, `/apply/form`, `/admin`, `/auth/confirm` render on demand, the proxy is registered,
every marketing page stays static with the hourly revalidate). Database, against the local
stack after `supabase db reset`, impersonating roles in psql: anon reads cycles / roles /
questions and nothing else; an applicant sees only their own profile and application, may edit
`full_name` but not `email`, can start one draft per cycle (a second is a unique violation, a
draft for another account fails the policy, a repeated role fails the trigger), answers only
questions of the cycle while the draft is open, cannot set `accepted`, move the application or
add a review, must pick a role to submit, and after submitting cannot change the application or
the answers; a second applicant sees nothing of the first; an admin sees every application,
profile, answer and the admin list, may change the status but not an applicant field or reopen
a draft, may add and edit their own review but not one for someone else, cannot edit answers
or add admins through the API, and may apply themselves. Playwright against the dev server and
then the production build (`docs/screenshots/session-7/`, portal mode with the local Supabase,
`example.com` accounts): landing with the deadline and roles read from the database; `next`
sanitising (external URL falls back to `/apply`); server-side email validation with the browser
constraints stripped, focus on the field; honeypot returns the code step with no email sent;
signed-out `/admin` and `/apply/form` redirect to `/apply?next=…`; the sign-in email arrives
with a code and a link to this origin; a wrong code shows the message and keeps focus; resend
either sends a new code or reports the one-per-minute limit and stays on the code step; the
right code lands on `/apply` with "Not started", the email and no exec box; `/apply/form` lists
the shared questions; `/admin` shows the exec-only page to an applicant; sign out clears the
cookie; the local admin signing in from `/apply?next=/admin` lands on `/admin` with the counts;
the magic link signs in a browser with no cookies and a reused link shows the expired-link
notice; without JavaScript the code step renders, a wrong code re-renders with the message and
the right code redirects signed in; no console errors. axe: 0 violations on every one of those
states at 1440 and 390; `pnpm a11y` on the production build for `/apply` and `/` (drawer open): 0. A second production build without `.env.local` (the committed default): `/apply` 307 to the
external form, `/admin` and `/apply/form` 307 to `/apply?next=…`, `/auth/confirm` 307 to
`/apply?error=link`, `robots.txt` disallows `/apply`, `/admin`, `/auth`, the contact page is
unchanged.

**Decisions made this session**

1. Cycle, roles and questions are database rows (PLAN.md §5), not `content/` files: the RLS
   policies need `closes_at` in the database to lock drafts at the deadline, and exec can
   edit questions in the SQL editor between deploys. `supabase/seed.sql` seeds them (upserts by
   slug, re-runnable); the role slugs match `content/roles.ts`. `content/site.ts` keeps the
   marketing deadline and must agree by hand (`closesAt` = `cycles.closes_at`) until an admin
   screen edits both. PLAN.md §12 records it.
2. Sign-in is Supabase email OTP with both forms in one email: a six-digit code typed on the
   page that asked (works when mail is read on a phone) and a link to `/auth/confirm` carrying
   `token_hash` (verified server-side with `verifyOtp`, so it works in any browser; the SSR
   client's `pkce_`-prefixed hashes verify fine). `signInWithOtp` creates the account on first
   use, so new addresses receive the "confirmation" template and known ones "magic_link"; both
   point at `supabase/templates/sign-in.html`, whose link is
   `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email` with `emailRedirectTo` =
   `<request origin>/auth/confirm` (previews link to themselves; Supabase ignores origins not
   on the allow list). The `next` path survives the code path (hidden input); the link always
   lands on `/apply`, which shows admins a dashboard link.
3. Launch switch: `season.applyMode` in `content/site.ts`, `external` unless
   `NEXT_PUBLIC_APPLY_MODE=portal` (inlined at build). External keeps today's redirect;
   portal renders the landing. Every Apply CTA already points at `/apply`, so nothing else
   changes at launch; the dry run runs on a Vercel preview with the variable set there only.
   Portal mode without `SUPABASE_URL` + `SUPABASE_ANON_KEY` shows a "not connected" hero with
   a visible TODO, like the contact form.
4. Data access: the portal talks to Supabase as the signed-in user (anon key + session cookie,
   `createClient()` per request in `src/lib/supabase/server.ts`), never with the service role,
   so RLS is the boundary; `getClaims()` verifies the JWT. `requireUser` / `isAdminUser`
   (React `cache`) gate every page; `src/proxy.ts` matches only `/apply/:path*` and
   `/admin/:path*`, refreshes the cookie and redirects signed-out visitors (optimistic). The
   anon key stays server-side (`SUPABASE_ANON_KEY`, no `NEXT_PUBLIC_`) because no browser
   client exists.
5. Schema details. `applications` carries the profile step as columns (`full_name`,
   `purdue_email`, `year`, `major`, `linkedin_url`, `portfolio_url`) so the admin table can
   filter on them; `roles_applied uuid[]` per the plan, validated by the trigger (distinct,
   open, same cycle); `answers.value jsonb` (string or string array); `reviews` unique per
   reviewer and application with `score` 1–5, `notes`, `decision` yes / maybe / no; one active
   cycle enforced by a partial unique index; `questions.role_id` null = shared, with a
   composite foreign key to keep it in the same cycle. Applicants: insert a draft only while
   the cycle is open, update only their own open draft, move it only to `submitted` (the
   trigger stamps `submitted_at` and requires a role); admins: `status` only, never back to
   draft. Decisions are not surfaced to applicants (the account panel reads every post-submit
   status as "Submitted"); the dashboard decides how decisions go out.
6. Privileges are granted explicitly per table and role. The Supabase Postgres image's default
   privileges give `anon`, `authenticated` and `service_role` no DML on new public tables, so
   RLS alone left the landing with "permission denied for table cycles". The same finding
   means the Phase 1 and 3 form tables had no service-role grant either; this migration adds
   `grant all … to service_role` for `contact_messages` and `nonprofit_inquiries`.
7. Local development runs a real Supabase stack in Docker (`supabase start` with the heavy
   services excluded, ports shifted by ten because another local project already uses the
   defaults), emails in Mailpit, `admin@example.com` seeded as a local admin, types generated
   with `pnpm supabase:types`. `supabase/.temp` is Prettier-ignored.
8. Sign-in UI: `SignInForm` runs two `useActionState` hooks (request, verify) and shows
   whichever state is newer (`at` stamp), so a resend after a wrong code updates the message;
   the resend flag is a hidden input because React drops `name`/`value` on a button with a
   function `formAction`; "Use a different email" is a real link to `/apply` that remounts with
   JavaScript. Messages: a mistyped and an expired code share Supabase's `otp_expired`, so one
   message covers both; the one-email-per-minute limit gets "give it a minute"; the honeypot
   pretends to send. The email input's hint says decisions go to that address.
9. Landing composition: `PageHero` (cycle name eyebrow, "Apply to / Hack the Future.", blurb,
   deadline from `cycles`) → sign-in or account panel beside "How applying works" (three
   numbered steps) and "Roles this cycle" from `roles` with links to the Students page and
   contact. Closed cycle: "Applications are closed for now." with sign-in kept for viewing a
   submitted application. `/admin` for a non-admin is an explicit "Exec only." page with sign
   out rather than a redirect. The email template is a table layout in the site's dark palette
   with the code large and the link as a green button.
10. `robots.txt` also disallows `/admin` and `/auth`. `docs/DEPLOY.md` §2 lists the two new
    variables; §6 is the portal runbook (migrations, seed, admins, auth URLs, templates, Resend
    SMTP and the 2-per-hour built-in limit, preview-first launch, local setup, checks,
    free-tier pause).

**Known gaps**

- `/apply/form` and `/admin` are gates with placeholders: the form (Session 8) and the review
  dashboard (Session 9) are not built. `profiles.full_name` is unused until then.
- Every question in `supabase/seed.sql` is a `[TODO: confirm]` placeholder; `opens_at` is a
  guess (2026-08-24) and `closes_at` mirrors the placeholder deadline in `content/site.ts`.
  The local cycle closes on 2026-09-12: after that date local testing needs the seed dates
  moved.
- The hosted Supabase project does not exist, so nothing is applied anywhere but locally, and
  the built-in mailer's 2 emails per hour stands until Resend SMTP is configured (§6).
- The sign-in email has not been checked in real mail clients (dark table layout).
- `cycles.closes_at` and `site.season.closesAt` are two copies of the deadline.
- Local: Docker Desktop must be running for `supabase start`; the stack keeps running after
  the session (`supabase stop` to free it).

**TODOs for Ashton (content and accounts)**

- Everything from Sessions 1–6 still stands.
- Create the Supabase project, then follow `docs/DEPLOY.md` §6: migrations, `seed.sql` after
  fixing the dates and questions, exec emails into `admins`, Site URL and redirect URLs, both
  email templates, Resend SMTP and the rate limit, `SUPABASE_ANON_KEY` and
  `NEXT_PUBLIC_APPLY_MODE=portal` on a Vercel preview.
- Confirm the cycle dates, the roles for the portal (same list as `content/roles.ts`) and the
  real questions per role, including character limits and which are required.
- Decide whether applicants should see a decision status in the portal or only by email.

## Next session starts with

**First, Ashton's second look at the dino process scene** (Session 11h, `docs/screenshots/session-11h/`): the hats worn on the head, the team as three T-rexes (square glasses, backwards cap), the gift held with the arm attached and no partner, and the dissolve on its own clock (600 ms in twelve buckets in `home/ProcessScene`; the hysteresis band in `home/ProcessScroll`). The drawings are string maps in `home/ProcessSprites.ts`, the timings the `[data-mode]` rules at the end of `globals.css`.

**Then the hero decision (Session 11 follow-up).** Six heroes remain after Session 11g
(Globe, Atlas, Typewriter, Cells, Wordmark, Photo). Ashton opens the home page, presses
Shift + M and picks one (PLAN.md §19, the Session 11 log). Set `DEFAULT_HERO` in
`src/lib/config/options.ts` to the choice, delete the variants that are not kept (their
files under `src/components/home/heroes/`, their rows in `HERO_VARIANTS` and in `Hero.tsx`,
any CSS only they use), and record the choice in PLAN.md §19. The Get involved graphic is
decided: Terminal is the default, with Chat and Badge still in the menu (PLAN.md §20).

**Then Session 12: application portal, part 4 (go live).** Read `docs/PLAN.md` §5, §6 and
§12–§16, this file and `docs/DEPLOY.md`, then, in this order:

1. Keepalive: an `/api/keepalive` route handler that reads one row through the anon key and a
   `vercel.json` cron that hits it daily, so the free Supabase project never pauses (PLAN.md
   §5); a dry-run checklist in `docs/DEPLOY.md` for the five exec testers.
2. With Ashton: deploy the site (`docs/DEPLOY.md` §1–§5: GitHub org transfer, Vercel project,
   env vars, DNS); the marketing site ships with `/apply` redirecting to the external form.
3. Hosted Supabase (`docs/DEPLOY.md` §6): apply the migrations, run `seed.sql` once Ashton
   confirms the dates, roles and questions, add the exec board to `public.admins`, set the
   auth URLs and the email templates, configure Resend SMTP and raise the email rate limit.
4. Dry run on a Vercel preview with `NEXT_PUBLIC_APPLY_MODE=portal`: five exec members apply
   and review end to end (sign-in email through Resend, the form, the confirmation email, the
   dashboard, the CSV). Fix what they find.
5. Flip `NEXT_PUBLIC_APPLY_MODE=portal` on production, redeploy, check every Apply CTA lands
   on the portal, then update this file and PLAN.md §6.

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
