# Hack the Future Purdue — Website Rebuild Plan

Prepared for Ashton Sun, Design Director · September 4, 2026 · v1

This plan turns the half-finished Framer site into a coded site you own, built with Claude Code. It covers what exists today, the decisions already made, the sitemap and page specs, the design foundations, the application portal architecture, a phased build order that respects the fact that fall applications are open right now, and the list of things only you can supply.

---

## 1. Where things stand (audit of the reference folder)

**Brand identity.** The brand guide is short but firm. Colors: primary `#03C652`, secondary `#277D4A`, tertiary `#00EB88`, complementary blue `#00E0FF`, used on near-black. Fonts per guide: Cunia (titles, logo), Sweet Purple (accent words only, never sentences), Josefin Sans (long text, "any font can be used"). Logo system: Primary (with shape) vs Base logos in Main / Black / White, each in Full / Abbreviated (`<HTF/>`) / Horizontal. Round profile picture default. The guide itself acknowledges the greens may fail contrast; the website *will* be public with a wide audience, so we treat contrast as a real requirement (green text on black passes; black text on green buttons passes; avoid mid-green on dark-gray).

**Brand graphics (Instagram assets 5–15).** These show the visual language more clearly than the guide does: `<HTF/>` wordmark, wireframe globe (the recurring hero motif), checkerboard and zigzag glyphs as section ornaments, crumpled-paper texture behind dark backgrounds, bright green + off-white on black, condensed all-caps display type for big moments, the "Callouts" card list style. They also carry real facts we can use as placeholder-but-true content: "500+ Nonprofit Pool", "8 Final Nonprofits 2025–2026" across 4 U.S. states (IN, IL, CA, PA) and 4 countries (UK, India, Ghana, Botswana), roles advertised as Project Leads / Developers / Designers, callouts in WTHR 320, "open to all majors, all years, all levels of experience", Instagram @hackthefuturepurdue.

**Framer site.** It is the "Agenz" agency template from the Framer marketplace with HTF branding partially applied. That matters: much of what looks "done" is template scaffolding, not HTF decisions. Concretely:

- Still template: nav items *Pricing* and *Services*, a full Pricing section ($500 / $1000 plans) on the Students page, placeholder copy ("Agenz is a Simple team uses aesthetic and minimal", "Whispers of the Sea", "Let's Discuss Your Next Project"), fake portfolio entries (Hinobe, Krea Klock, Alex Portz), template FAQ questions about revision policy and design rights, template testimonials, a newsletter subscribe block, footer "© 2025 Agenz Agency".
- HTF-specific: `<HTF/> | Transforming Nonprofits with Technology` header, Contact Us CTA, "Join us to make an Impact" students hero, three role rows with Apply Now buttons (Developer / UI/UX Designer / Project Manager — note this conflicts with the social graphics' Project Leads / Developers / Designers), "Student Involvement" eyebrow, "NONPROFIT STUDENT ORG" tag on the project detail, a privacy policy page dated 30 June 2025, tagline "We create software for nonprofits around the globe!"
- Worth keeping as vibe: near-black `#0f0f0f`-ish canvas with a thin grid overlay, hero with a radial green glow at the bottom, a floating chrome/glass 3D ring, two-line headline where the second line is green, small green-square eyebrow labels, split CTA buttons (green label cell + lime arrow cell), full-height burger menu drawer with a 2-column icon grid, huge ghosted background words ("Transforming Non-profits") as a texture, oversized project cards with label + title + year, three-step Process with a highlighted active step, left/right FAQ accordion, globe illustration in the contact section, 3-column footer.
- Typography in Framer is Poppins throughout (not the brand fonts). Your call: Poppins for now, revisit later.

**Framer home page (`home.png`).** It is a portfolio-first landing: hero (eyebrow "Our Projects", two-line headline with the second line green, chrome ring, small "© 2025" + one-line blurb at right, "Scroll Down" marker over the green glow) → staggered two-column grid of four oversized project cards (category label, title, year/location) → a band with a huge ghosted "Transforming Non-profits" behind a dotted world map and testimonial cards → FAQ (left heading, right accordion) → Contact CTA ("Let's Discuss Your Next Project" + globe + split button) → footer with a newsletter block. `about.png` and `students.png` are both the Students page. The stitched captures have a white column artifact, so they're reference-grade, not pixel-grade.

**Missing from the folder:** the live Framer URL, the current live site URL, and any of the club's own photos.

---

## 2. Decisions made (from our conversation)

Framework is **Next.js (App Router), TypeScript, Tailwind, Framer Motion, three.js/R3F** where needed, deployed on **Vercel** from a repo in the **club's GitHub org**, on the **existing domain**. Content lives as **typed files in the repo** (JSON/MDX validated with Zod) so Claude Code and future execs can edit it without a CMS. Typography is **Poppins for now**, with tokens set up so swapping to Cunia/Josefin later is a one-line change. The application portal is **Supabase**: **magic-link sign-in for any email**, one application per verified account, submission confirmation email, and an **admin review dashboard** for exec. **You are building solo with Claude Code**, so conventions optimize for one fast-moving person, not a team. **Fall applications are open now**, which drives the phasing below.

---

## 3. Sitemap and page specs

Global rules first, then each route. "Keep" means carry the Framer treatment forward; "redo" means the Framer version is template filler.

### Global

**Navigation (redo).** Keep the slim top bar (logo + tagline left, primary CTA right) but replace the burger-only pattern with visible links on desktop: Projects, About, Students, Non-profits, and later Blog. Burger drawer on mobile only, reusing the icon-grid drawer idea. Drop Pricing and Services entirely.

**Season-aware CTA.** One config value (`content/site.ts → season`) drives the primary CTA everywhere: during application season the nav CTA reads *Apply Now → /apply*, otherwise *Contact Us → /contact*. The Students page hero, role rows, and home hero read the same value. Config also holds the deadline so the site can show "Applications close Sept 12, 11:59 PM" and auto-flip to off-season after it.

**Footer (redo).** Columns: Explore (pages), Get involved (Students, Non-profits, Apply/Contact), Connect (Instagram, LinkedIn, email), Legal (Privacy). Drop the newsletter block unless you actually have a list. Real copyright line.

**Shared components.** Eyebrow label, split headline, split CTA button, section container with grid overlay, card, accordion, stat tile, testimonial card, process steps, globe canvas, marquee/ghost text, contact block.

### `/` Home (structure mostly done in Framer; keep the skeleton, fix the substance)

Keep the Framer's order and rhythm, with these changes. **Hero (keep layout, redo assets and copy):** same composition (eyebrow, two-line split headline, small right-side blurb, glow, scroll marker) but the headline says what HTF is rather than "Featured Works", the eyebrow becomes "Student org · Purdue" or the season status, the chrome ring is replaced by the wireframe globe (the brand's actual motif; the ring is a template asset), and the "© 2025" becomes the founding year or current cycle. **Featured projects (keep):** the staggered two-column card grid, 4 cards from `content/projects` flagged `featured`, real cover art when the media handoff lands, "See all projects" link. **Who we serve (new, short):** two panels, students and nonprofits, each with a one-line pitch and a CTA to its page; this replaces the template's missing "what we do" and is what most first-time visitors need. **Impact stats (new, placeholder now):** `StatTile` row from `content/stats.ts` (500+ nonprofit pool, 8 projects this year, states, countries, students); section hides itself until you mark the stats `published`. **Testimonials (keep the band):** ghost text + dotted world map background is a strong HTF-appropriate visual, keep it; cards read from `content/testimonials.ts`; hidden until there are real quotes. **FAQ (keep layout, rewrite questions):** left heading, right accordion, 5–6 general questions linking to the deeper Students/Non-profits FAQs. **Contact CTA (keep):** globe + headline + split button; copy changes to an HTF invitation and the button follows the season config. **Footer (redo):** no newsletter.

### `/projects` and `/projects/[slug]` (redo content, keep card feel)

Index is a simple portfolio grid, not case studies: cover image, nonprofit name, project title, year, tags (web / mobile / data), location. Filter chips by year. Detail page: hero with nonprofit name + one-line summary; Overview (the problem, the nonprofit); What we built (bullets/short paragraphs, tech tags); Final result (screenshot gallery, lightbox); Live link button; Team (avatar grid with name, role, LinkedIn); "More projects" rail. Data: `content/projects/*.mdx` with frontmatter validated by Zod. Seed with the 8 current nonprofits as placeholders.

### `/about` (new)

Mission statement; Who we are (short history, "student org at Purdue building software for nonprofits"); Awards/recognition list; Exec board grid (photo, name, role, LinkedIn) from `content/exec.ts`; Two CTA panels: "I'm a student" → /students and "I'm a nonprofit" → /nonprofits; Social embed strip (Instagram recent posts via a lightweight embed or a curated grid of image links — real Instagram API embeds require a Meta app; plan for the curated grid first).

### `/students` (partially done, rework)

Hero "Join us to make an impact" (keep); Roles (keep the row pattern; correct roles to your current list, each with responsibilities, time commitment, who it's for, and an Apply/Learn button); Recruitment timeline (callouts → applications open → deadline → interviews → decisions → kickoff, from `content/recruitment.ts`); How we work (team structure: 1 lead + 5 devs + 1–2 designers on a year-long project; cadence; designer crits/workshops); What you'll get (skills, portfolio, community); FAQ (student-specific); CTA. Remove Pricing and the template Process block.

### `/nonprofits` (new)

Hero pitched to nonprofit staff; How it works (apply → scoping call → matched team → build over the school year → handoff); What we build and don't (scope guardrails); Previous partners with a globe interaction (pins for past nonprofit locations — this is where the R3F globe earns its place; fall back to the static globe illustration until data exists); Testimonials from nonprofits; FAQ; Contact/intake form (Supabase table `nonprofit_inquiries` or mailto for v1).

### `/contact` (new, simple)

Short form (name, email, I am a student / nonprofit / other, message) → Supabase table + notification email, plus direct email and socials.

### `/apply` — application portal (new, see §5)

`/apply` (season landing + sign in), `/apply/form` (authenticated multi-step form with autosave), `/apply/submitted`, `/admin` (exec dashboard), `/admin/applications/[id]`.

### `/privacy` (keep, rewrite text)

The Framer text is generic template copy. Rewrite to cover what the portal actually collects (email, application answers, sign-in metadata) and Supabase/Vercel as processors.

### `/blog` (later)

MDX under `content/blog/`, index + post routes. Scaffold the route group but keep it out of nav until there are posts.

---

## 4. Design foundations

**Tokens** (`app/globals.css` + Tailwind theme): `--bg: #0B0B0B`, `--surface: #141414`, `--surface-2: #1C1C1C`, `--line: rgba(255,255,255,0.08)`, `--text: #F5F5F5`, `--muted: #A3A3A3`, `--green: #03C652`, `--green-deep: #277D4A`, `--mint: #00EB88`, `--cyan: #00E0FF`, `--lime: #C8FF3D` (the Framer arrow-cell accent; keep as an interaction accent only, not a brand color). Radii small (4–8px) to match the squared-off Framer feel. Grid overlay as a CSS background on section wrappers.

**Type**: Poppins via `next/font/google` with weights 300/400/500/600. Scale: display 96/80/64, h2 48, h3 32, body 16/18, eyebrow 12 uppercase tracked. Split headlines implemented as a `<Headline>` component that takes `accent` words, so a future font swap or color change is one place.

**Motion**: Framer Motion for page/section reveals (fade+rise, staggered), accordion, drawer, CTA hover (arrow cell slides). Respect `prefers-reduced-motion`. three.js/R3F only for the globe; lazy-load it and provide a static SVG fallback for mobile/low-power.

**Imagery**: next/image everywhere; `public/placeholders/` with branded gray-green placeholders until the media handoff; a single `content/media.ts` map so swapping in real photos is a path change.

**Accessibility**: WCAG AA on all text pairings, focus rings in `--mint`, semantic landmarks, keyboard-complete nav/drawer/accordion.

---

## 5. Application portal architecture

**Feasibility.** Supabase Free: 500 MB database, 1 GB file storage, 5 GB egress, 50k MAU, 2 active projects, projects pause after 1 week of inactivity. 1,000 applications × ~10 KB of text ≈ 10 MB. Even with resume uploads later (~500 KB each) you stay under 1 GB. Free tier is fine on data. Two real gotchas: (1) Supabase's built-in auth email sender is limited to 2 messages per hour and documented as not for production, so magic links at scale require custom SMTP — Resend's free tier (3,000 emails/month, 100/day at last check; confirm the daily cap against your expected deadline-day spike, or use a paid month) covers a cycle; (2) the one-week inactivity pause — add a Vercel Cron that hits a tiny `/api/keepalive` route daily, or simply accept restoring the project manually before each season. If either becomes a headache, Pro is $25/month and can be turned on only for application months.

**Auth.** Supabase Auth, email magic link (OTP), any email address. `profiles` row created on first sign-in. Admins are emails listed in an `admins` table (seeded with exec emails), checked server-side.

**Schema (v1).**
`cycles` (id, name "Fall 2026", opens_at, closes_at, is_active) · `roles` (id, cycle_id, name, description, is_open) · `questions` (id, cycle_id, role_id nullable for shared questions, prompt, kind text/textarea/select/multiselect/url, max_chars, required, sort) · `applications` (id, user_id, cycle_id, status draft/submitted/reviewing/accepted/rejected/waitlisted, roles_applied[], submitted_at, created_at, updated_at, unique(user_id, cycle_id)) · `answers` (application_id, question_id, value jsonb) · `reviews` (id, application_id, reviewer_id, score, notes, decision, created_at) · `admins` (email) · `nonprofit_inquiries` and `contact_messages` for the other forms.

Row Level Security: applicants read/write only their own application while `status = draft` and the cycle is open; admins read everything and write `reviews`/`status`. All mutations through Next.js server actions with Zod validation; the anon key never writes directly.

**Applicant flow.** `/apply` shows season status; enter email → magic link → `/apply/form`: Step 1 profile (name, Purdue email if different, year, major, LinkedIn/portfolio), Step 2 roles (multi-select, per-role questions appear), Step 3 short-answer questions, Step 4 review + submit. Autosave drafts on blur. On submit: lock the record, send confirmation via Resend, show `/apply/submitted`. After the deadline the form becomes read-only.

**Admin dashboard.** `/admin`: table of applications with filters (role, status, year, reviewer), search, CSV export, per-application view with answers and a review panel (score 1–5, notes, decision), simple counts per role. No bulk email in v1; export to CSV and use your existing tools.

**Google Form fallback.** Because applications are open right now, the plan does not bet this cycle on the portal. The Apply CTA points at the current form until the portal passes a dry run (§6, Phase 2 gate). If the fall deadline arrives first, the portal debuts next cycle with zero risk to this one.

---

## 6. Phased build order

Phase 0, Foundations (Claude Code session 1, ~1 day). Repo, Next.js + TS + Tailwind + Framer Motion, tokens and type scale, layout shell (nav, footer, season config), shared primitives, placeholder system, Vercel preview deploy, CLAUDE.md, content schemas with Zod, lint/format/typecheck scripts.

Phase 1, Launchable marketing core (sessions 2–4, ~1 week). Home, Students, Projects index + detail with 8 placeholder projects, Contact, Privacy, 404. Apply CTA → current Google Form. Ship to the real domain as soon as this beats the old site, even with placeholders.

Phase 2, Application portal (sessions 5–8, ~1–2 weeks, can overlap Phase 1). Supabase project, schema + RLS migrations, Resend SMTP, magic link, multi-step form with autosave, admin dashboard, CSV export, keepalive cron. Gate: a dry run with five exec members applying and reviewing end to end. Only then flip the CTA.

Phase 3, Depth (sessions 9–11). About (exec, awards, socials), Non-profits (process, FAQ, intake form), R3F globe with partner pins, testimonials and stats wired to real data, media handoff swap, SEO/OG images, analytics (Vercel Analytics or Plausible), Lighthouse pass.

Phase 4, Later. Blog (MDX), nonprofit application portal reuse of the same form engine, brand-font swap if you decide to, Instagram API embed.

---

## 7. Things only you can supply (gather before or during Phase 1)

Live Framer URL; current live site URL and where its DNS is managed; the club GitHub org name and who can create repos; Vercel account/team; the current application form link, this cycle's deadline, roles, and the exact questions (per role and shared); exec email list for admin access; contact email for the club; social links (Instagram, LinkedIn, Discord?); the eight current nonprofits (name, location, one-liner, live link if any); exec board list with roles and LinkedIn; awards/recognition list; any testimonials already in hand; stats you're comfortable publishing; logo files as SVG (the guide has PNGs only; SVG needed for crisp nav/footer); a decision on whether the roles are Project Lead / Developer / Designer or Developer / UI/UX Designer / Project Manager; a Resend account (free) and a Supabase account.

---

## 8. Open questions (answer when convenient; defaults noted)

Should applicants be restricted to one application per cycle even if applying to multiple roles? Default yes, multi-role within one application. Do project leads apply through the same portal? Default yes, as a role. Do you want the exec dashboard to support multiple reviewers per application with averaged scores? Default yes, simple average. Light mode? Default no, dark only, matching brand. Should the site have a Discord/Slack link? Unknown. Is the "Transforming Nonprofits with Technology" tagline official? Default keep.

---

## 9. Claude Code session sequence

Session 1 (the kickoff prompt): Phase 0 in full plus the Home hero and nav to prove the visual language. Session 2: Home complete + Students. Session 3: Projects index/detail + content schemas + 8 placeholders. Session 4: Contact, Privacy, 404, SEO, deploy to domain. Sessions 5–8: Portal per §5 in the order schema → auth → form → admin → email → dry run. Sessions 9+: Phase 3.

Each session should start with "read `docs/PLAN.md` and `CLAUDE.md`, check `docs/PROGRESS.md`, then continue from the next unchecked item," and end with Claude Code updating `PROGRESS.md`. That keeps context across sessions without you re-explaining.

---

## 10. Amendments — home and global audit (September 6, 2026)

Ashton's audit of the built home page changed the following; PROGRESS.md (Session 5) has the details.

**Global style.** Technical and spatial: rigid lines, no corner radius (both radius tokens are 0; avatars stay round), frosted glass for anything elevated (header, drawer, footer, floating tiles and cards), and one hover language for the whole site (green viewfinder brackets on interactive surfaces, green text links, green arrow cells; nothing moves on hover). Crosshair marks sit at the corners of framed containers.

**Navigation.** The tagline is gone from the header and the drawer no longer carries the "Software for good" headline. LinkedIn joins Instagram in the drawer and the footer. The footer is a glass panel with the pixel dinosaur peeking out from behind it.

**Home, new order.** Hero (statement only: eyebrow, "Building software / for nonprofits.", globe, glow; no blurb, deadline, buttons or scroll marker) → What we do (three service panels from the club's previous site, the full-organization photo placeholder, a link to `/projects`) → How it works (scroll-driven process: sticky wireframe graphic on the left changes as the four steps scroll past on the right; `content/process.ts`) → Impact (three glass stat tiles that count up on first view, a full-width rotating testimonial band over the dotted map, and an awards subsection with a photo carousel; `content/awards.ts`) → Who we serve → FAQ → Contact CTA. The featured-projects grid moved off the home page; `/projects` is the portfolio.

---

## 11. Amendments — Phase 3 before Phase 2 (September 6, 2026)

Ashton asked for the About and Non-profits pages before the portal, so Session 6 delivered Phase 3 minus the two items that need content only he can supply (real stats and testimonials, the media handoff). The portal (Phase 2, §5) moves to Sessions 7–10 and its plan is unchanged. PROGRESS.md (Session 6) has the details.

**About.** Mission (the tagline as the headline, beside the organization photo), Who we are (history paragraphs and a facts list), Exec board grid, Awards (the home component), a curated Instagram grid typed into `content/instagram.ts` (no Meta app, no embed script; Phase 4 may swap in the API), the student / nonprofit hand-off panels, and the contact CTA.

**Non-profits.** How it works from the nonprofit's side (the four process steps with a "Your part" line each), What we build and what we don't (`content/nonprofits.ts`), Where our partners are (the three.js globe with a pin per project location from `geo` in the project frontmatter, loaded on demand with the SVG globe as fallback; a location list beside it is the accessible version), nonprofit testimonials, the nonprofit FAQ, and a "Start a project" intake form that stores to the Supabase table `nonprofit_inquiries` and/or emails through Resend, with the same mailto fallback as the contact form.

**Analytics and performance.** Vercel Web Analytics (cookieless) is wired but renders only on Vercel builds; enable it in the project. Lighthouse on the production build: desktop 88–99 performance and 100 accessibility, mobile 61–91. The open finding is design-level: the hero's mount reveal delays the largest contentful paint on slow mobile connections (§4 motion); keep it or render the hero text visible on first paint.


---

## 12. Amendments — portal sign-in and configuration (September 7, 2026)

Session 7 built the portal's foundation (§5) with two refinements. **Sign-in** uses Supabase Auth email OTP in both forms at once: the email carries a six-digit code (typed on the page that asked for it, so the flow works when mail is read on a phone) and a link to `/auth/confirm` that verifies the token hash server-side (so it works in any browser, unlike a PKCE code exchange). New addresses get an account on first sign-in. **Switching** from the external form to the portal is one setting, `season.applyMode` in `content/site.ts`, driven by `NEXT_PUBLIC_APPLY_MODE`, so the dry run happens on a Vercel preview with the production site untouched. The cycle, roles and questions are rows in Supabase (`supabase/seed.sql`), because Row Level Security needs the deadline in the database to lock drafts; `content/site.ts` keeps the marketing deadline and the two must be kept in step by hand until an admin screen edits both. PROGRESS.md (Session 7) has the schema, the policies and the local development setup.


---

## 13. Amendments — the application form (September 7, 2026)

Session 8 built the applicant side of the portal (§5) with these refinements. **Saving is
lenient, moving on is strict.** Every field of a step is saved on blur (or on a change of a
checkbox or chip) as long as it is valid; empty fields are fine at that point. "Continue" and
the final submit enforce required fields, and any invalid value (a malformed link, an unknown
option) is reported inline and never stored. **One action, one `nav` value.** Every button in
the form (the stepper, Continue, Back, "Save and finish later", the review's Edit links and
Submit) posts a `nav` value to the same server action, which saves the current step first and
then redirects, so the form works without JavaScript and the URL carries the step
(`/apply/form?step=roles`). **Submit checks the database, not the form:** the review step and
the action both validate the stored draft against the strict schemas and list what is missing
per step; answers to questions of roles no longer applied for are dropped at submission; the
guard trigger stamps `submitted_at`. **Confirmation email** through the Resend API with the
same `RESEND_API_KEY` and `CONTACT_FROM` as the notification emails, plain text, skipped with a
log line when the key is missing; `/apply/submitted` only claims it was sent when it was.
**Read-only after the fact:** once submitted, or once the cycle has closed, `/apply/form` shows
what was saved and links to the contact page for corrections. Decisions stay hidden from
applicants (the status page reads every post-submission status as "Submitted"). PROGRESS.md
(Session 8) has the details.

---

## 14. Amendments — home and global audit 2 (September 7, 2026)

Ashton's second audit of the built home page; PROGRESS.md (Session 8b) has the details. (§13 belongs to the Session 8 form work, written in parallel.)

**Navigation.** Home is a tab and comes first; the links sit in the centre of the bar; hovering a link brightens it without an underline (the underline marks the current page); the bar is lighter glass; the bar CTA is green on green with a black divider between the label and the arrow (lime stays on the other split buttons for now).

**Copy.** "nonprofits" is one word everywhere and the page is "Nonprofits"; the hero eyebrow reads "Student Org @ Purdue University"; the footer keeps only the logo in its first column; no photo on the site has a visible caption (the project gallery's MDX captions are content and stay).

**Home.** What we do shows the photo (no caption) before the three panels, whose icons stand bare and whose titles and descriptions line up across the columns, with the projects link on the right. How it works is one floating scene of particles that morphs through the four steps with scroll (`ProcessScene`), no card and no graphic switching; the Nonprofits page shows the same scene as four stills. Impact drops the ghosted headline and "Small teams, global reach", puts the dotted world map behind the whole band, and the marquee pauses only through its button. Awards has no title line and plain table text. Who we serve is two linked spec-sheet cards with aligned rows. The FAQ aside links are green without underline, and every inline text link follows. Get involved has the beacon graphic (dial, orbiting audiences, pings, pointer tilt) in place of the static globe.

---

## 15. Amendments — the exec dashboard (September 7, 2026)

Session 9 built the exec side of the portal (§5) as planned, with these details. **Filters are URLs:** status, role, year, "reviews" (by me, not by me yet, by nobody) and the search box are query parameters read by a server component, so any view can be bookmarked or sent to another exec member and nothing needs JavaScript; the Applicant, Submitted and Score headers sort by changing the same URL, and drafts always sort last. **One review row per member** (`reviews`, upsert on application and reviewer) with a 1–5 score, a yes / maybe / no decision and notes; the table shows the average and the count, the review page shows everyone's notes. **Status is the only thing an exec member changes** on an application (submitted, reviewing, accepted, rejected, waitlisted; the guard trigger refuses drafts), and applicants never see it. **The CSV** carries the same rows as the filtered table plus every answer and every reviewer's notes, for the club's spreadsheet habits (no bulk email in v1, as §5 says). Everything runs through Row Level Security as the signed-in member; the service role is still unused. PROGRESS.md (Session 9) has the details.

---

## 16. Amendments — home audit 3 (September 7, 2026)

Ashton's third audit of the built home page; PROGRESS.md (Session 10) has the details. Each change applies to every page that reuses the element.

**Rows run edge to edge.** The "What we do" services and the "Who we serve" panels sit in full-bleed hairline rows whose columns stay on the page container's columns (`bleed-row-2` / `bleed-row-3` in globals.css, built on a `--gutter` token that `container-x` also reads). The projects button under the services is centred.

**How it works has a new scene.** The particle morph is gone. `ProcessScene` is now an isometric build: a scan sweeps a floating plane and locks onto a cell (discover), the team's boxes gather around it (match), the product rises on it layer by layer against a gauge (build), and the finished stack lifts off inside viewfinder brackets with a status check (deliver). It still evolves continuously with scroll, still renders as four stills on `/nonprofits`, and the counter and progress bar under it are gone. The `graphic` field of `content/process.ts` names the stages (`scan`, `team`, `stack`, `ship`).

**Impact.** The dotted map starts below the band's top edge and fades out before its own edges, so it never looks cut off.

**Buttons.** Every primary `SplitButton` is the header bar's treatment: green label, green arrow cell, a 2px black divider (it was 1px; the header bar CTA went back to 1px on 2026-09-08). Lime is no longer used anywhere.

**Who we serve** is two plain panels: eyebrow, title, one sentence, a label and the arrow cell. The index numerals, icon boxes, spec rows, glow and hover grid are gone.

**Get involved** has a new graphic in place of the beacon: two modules, one per audience, that dock into one unit when the section scrolls into view (`ConnectGraphic`), with the seam lighting up and the HTF mark pinging above it.

---

## 17. Amendments — home audit 4 (September 7, 2026)

Ashton's fourth audit of the built home page, the same day as §16; PROGRESS.md (Session 10, audit 4) has the details.

**Rows are framed.** The full-bleed rows of §16 gain vertical rails on their outer edges, so the three service panels and the two audience panels each sit in a framed cell while the horizontal lines still run edge to edge.

**How it works shows recognizable pictures.** The isometric build of §16 is gone. `ProcessScene` now draws one picture per step in the site's wireframe style: the intake form under a magnifying glass (discover), the team of avatars with the lead in front (match), a laptop with code typing itself in (build) and a rocket (deliver). Scroll progress cross-fades them, the outgoing picture rising as the next comes up, so the scene is still one continuous object; the Nonprofits page still shows the four stills. `content/process.ts` names the pictures (`form`, `team`, `laptop`, `rocket`).

**Testimonials fade at both ends.** The marquee's mask fades the cards out over `clamp(4rem, 12vw, 14rem)` on each side instead of a 6% sliver.

**Who we serve.** Each panel is still one link, but the label-and-arrow footer is a normal "Learn more" split button (a presentational span inside the link), and the hover is the project cards' language: the title turns green and the button takes its hover state. No corner brackets, no surface change.

**Get involved** has a paper plane in place of the docking modules: a dotted flight path with drifting dots, and the plane flies it once (CSS motion path) when the section scrolls into view, then rests at the end with a few wind strokes behind it.

## 18. Amendments — exec board by year (September 8, 2026)

The About page's exec board follows the projects index: every member in `content/exec.ts` belongs to a school year, a chip per year switches boards (newest first and by default, the choice in `?board=` so a board can be linked to), and the cards cross-fade like the project grid. Every card carries a LinkedIn link, so `linkedin` is a required field: a URL, or a "TODO" note that renders a dashed placeholder cell until the real link lands.

**In-page navigation moves out of the hero.** About, Students and Nonprofits get a section bar (`layout/SectionNav`) right under the hero: a hairline row with the page name and the section links that sticks beneath the site header, underlines the section on screen and scrolls sideways on phones. The heroes carry only their eyebrow, headline, blurb and actions, so a hero redesign does not touch navigation. The "On this page" row inside the hero is gone.

**/apply degrades instead of failing.** When the application database cannot be reached the page shows a "taking a moment" panel with a retry, rather than an error page. PROGRESS.md (Session 10b) has the details.

## 19. Amendments — site configuration menu and hero variants (September 8, 2026)

Ashton asked for a shortcut menu (Shift + M) that opens a configuration panel for the site, starting with the home hero, and ten distinct hero variants to choose between. The panel (`components/config/ConfigMenu`) is a hidden, keyboard-only, non-modal dialog on the right edge; choices are saved per browser (`lib/config`), so the page stays static and visitors always see the default. The hero (`home/Hero`) switches between the variants in `home/heroes/`: Globe (unchanged, the default), Atlas (dotted map with routes from Purdue), Typewriter (typed headline with a block cursor), Ticker (the statement as a draggable band), Focus (viewfinder brackets that lock onto words), Torch (a light that lifts the words out of the dark), Cells (the grid lights up under the pointer), Wordmark (the `<HTF/>` mark drawn at full width), Rows (a spec sheet with Students, Nonprofits and Apply as cells) and Photo (the organization photo full-bleed). All share the copy in `content/hero.ts`, the same semantics and a finished state under reduced motion. Once Ashton picks one, `DEFAULT_HERO` changes and the rest can go; PROGRESS.md (Session 11) has the details.

## 20. Amendments — Get involved graphic variants (September 8, 2026)

Ashton asked for ten distinct variants of the Get involved graphic (the picture beside the closing call-to-action on the home, About, Projects and Students pages) as the second setting in the Shift + M menu, none of them using the viewfinder corner brackets on their container, every one on brand and meaning something rather than abstract. `layout/ContactCta` now renders `layout/involved/InvolvedGraphic`, a client switch like the hero's: Plane (the paper plane as before, minus the corners; the default, in the bundle) and nine lazy chunks, each a recognizable object that says "start here" in its own way: Door (an open door with the light on, wider for the pointer), Puzzle (Students and Nonprofits pieces that slide together), Canvas (a design canvas with a student's and a nonprofit's cursors), Chat (your message, HTF's reply, someone typing), Badge (a member badge on its lanyard, printed with the open cycle), Calendar (the deadline's month with the day marked, from `content/site.ts`), Terminal (`htf apply` typed at a prompt), Keycap (one Enter key that presses itself) and Signpost (two arms, Students and Nonprofits). All share `layout/involved/GraphicFrame` (the floating square with the glow, the bob and the pointer tilt), hide themselves from assistive tech, and show the finished picture under reduced motion. The choice is per browser (`lib/config`), visitors see the default, and `DEFAULT_INVOLVED` in `lib/config/options.ts` is the one line to change once Ashton picks. PROGRESS.md (Session 11b) has the details.

Decided the same day (Session 11g): Terminal ships as the default; Chat and Badge stay in the menu; the other seven are deleted. Of the heroes in §19, Ticker, Focus, Torch and Rows are deleted too, leaving Globe (still the default), Atlas, Typewriter, Cells, Wordmark and Photo for the hero decision.

## 21. Amendments — the dino process scene (September 8, 2026)

**How it works is drawn with the footer T-rex.** The wireframe pictures of §17 are gone. `ProcessScene` is pixel art on the footer dinosaur's own grid (`brand/dino-pixels`, the 20 × 22 map the footer and the scene both read): the T-rex stands at the left of a 64 × 40 stage in every step and its role changes. Discover: a detective in a deerstalker peering through a magnifying glass at a trail of footprints. Match: the team gathers, a triceratops, a stegosaurus and a pterodactyl, each its own species, while the T-rex waves. Build: a hard hat and a hammer swinging onto a wall of bricks. Deliver: a party hat, a gift box held out to a long-necked partner, confetti. Dinosaurs are green; hats, tools and the gift are white; nothing has an outline and details are carved as empty cells, like the eye. Between steps the scene dissolves cell by cell (every cell flips at its own point of the crossing, never half-visible) with the T-rex standing still through all four, and each step's own motion runs only while the scene is on that step: the glass peers, the footprints appear, the arm waves and the team bobs and flaps, the hammer strikes with a spark, the gift is offered and the confetti falls, all by whole cells. The Nonprofits page shows the four resting frames. `content/process.ts` names the scenes (`detective`, `team`, `builder`, `party`). The scene is 8:5 rather than square, wider on phones (`min(80vw, 20rem)`), and no longer floats (pixels do not drift).
