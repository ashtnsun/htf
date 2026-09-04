# Claude Code — Session 1 kickoff prompt

**Before you paste this:** create an empty repo (in the HTF GitHub org, e.g. `htf-website`), then copy into it:

```
docs/PLAN.md                      ← HTF-Website-Plan.md, renamed
reference/branding/               ← Existing References/Branding/ (guide .docx, Fonts/, Graphics/)
reference/framer/                 ← Existing References/Framer Screens/
```

Open Claude Code in the repo root and paste everything below the line.

---

You are building the new website for Hack the Future Purdue (HTF), a student organization that builds software for nonprofits. I am Ashton, the design director, and I'm the only developer on this. We are replacing a bad live site and an unfinished Framer prototype with a coded site we own.

## Read first

1. `docs/PLAN.md` — the full plan: audit, decisions, sitemap, page specs, design tokens, application-portal architecture, phasing. Treat it as the source of truth for scope and sequencing.
2. `reference/framer/*.png` — full-page captures of the Framer prototype. Use them for style, layout rhythm, and vibe only, not as a spec. They are an agency template ("Agenz") that was partially rebranded; anything about pricing, services, newsletters, fake projects, or placeholder copy is template filler and must not be carried over. `home.png` is the home page (portfolio-first landing: hero → staggered project grid → testimonial band with ghost text and dotted world map → FAQ → contact CTA → footer). `Proj.png` is the Projects index, `ProjDetail.png` a project page, `about.png` and `students.png` are both the Students page, `nav.png` the open menu drawer.
3. `reference/branding/` — the brand guide (.docx; extract text with pandoc or python-docx), font zips, and Instagram graphics. The graphics show the real visual language: `<HTF/>` wordmark, wireframe globe motif, checkerboard and zigzag glyph ornaments, crumpled-paper texture, bright green on near-black, condensed all-caps display moments.

## Fixed decisions (do not relitigate)

- Next.js (latest stable, App Router, TypeScript strict), Tailwind CSS, Framer Motion, `@react-three/fiber` + `drei` only for the globe (lazy-loaded, static fallback). Deployed on Vercel. pnpm.
- Content is typed files in the repo: `content/*.ts` and `content/**/*.mdx`, validated with Zod at build time. No CMS.
- Typography: Poppins via `next/font/google` (300/400/500/600) for everything for now. Put the family in a single CSS variable so a later swap to Cunia (display) + Josefin Sans (body) is a one-line change.
- Dark theme only.
- Brand colors: primary green `#03C652`, secondary `#277D4A`, tertiary mint `#00EB88`, complementary cyan `#00E0FF`. Neutrals: bg `#0B0B0B`, surface `#141414`, surface-2 `#1C1C1C`, line `rgba(255,255,255,0.08)`, text `#F5F5F5`, muted `#A3A3A3`. Lime `#C8FF3D` is allowed only as the arrow-cell accent on split CTA buttons. All text pairings must pass WCAG AA; check them.
- The application portal (Supabase, magic link, admin dashboard) is Phase 2. Do not start it this session, but design the season config and routes so it drops in cleanly.
- Fall applications are open right now, so the Apply CTA points at an external form URL from config until the portal ships.

## This session's scope (Phase 0 + proof of visual language)

Work through these in order and check each off in `docs/PROGRESS.md` as you go.

1. **Scaffold.** `pnpm create next-app` with TS, Tailwind, App Router, `src/` dir, ESLint. Add Prettier, `zod`, `framer-motion`, `clsx`/`tailwind-merge`, `lucide-react`. Scripts: `dev`, `build`, `lint`, `typecheck`, `format`. Commit.
2. **CLAUDE.md** at repo root: stack, folder conventions, how content files work, the token names, component rules (server components by default, `"use client"` only for motion/interaction), accessibility rules (semantic landmarks, keyboard support, focus-visible in mint, `prefers-reduced-motion` respected), commit style, and the instruction that every session starts by reading `docs/PLAN.md` + `docs/PROGRESS.md` and ends by updating `PROGRESS.md`.
3. **Design tokens.** `src/app/globals.css` with the CSS variables above, Tailwind theme extension mapping them (`bg-bg`, `text-muted`, `text-green`, etc.), type scale (display 96/80/64, h2 48, h3 32, body 16/18, eyebrow 12 uppercase tracked), radii 4/8, and a reusable `.grid-overlay` background utility that reproduces the Framer's thin grid lines.
4. **Site config.** `content/site.ts` exporting name, tagline ("Transforming Nonprofits with Technology"), socials (Instagram `@hackthefuturepurdue`; leave LinkedIn/email as `TODO` strings I will fill), and `season: { isApplicationSeason: boolean; applyUrl: string; closesAt: ISO string; cycleName: string }`. Export a `getPrimaryCta()` helper that returns `{ label: "Apply Now", href: applyUrl }` in season (auto-flipping to off-season after `closesAt`) and `{ label: "Contact Us", href: "/contact" }` otherwise. Every CTA in the site reads from this.
5. **Content schemas.** Zod schemas + typed loaders in `src/lib/content/` for `projects` (MDX frontmatter: slug, title, nonprofit, year, location, tags, summary, cover, liveUrl?, gallery[], team[{name, role, linkedin?, avatar?}]), `exec`, `roles`, `faq` (with `audience: "home" | "students" | "nonprofits"`), `testimonials`, `stats`, `recruitmentTimeline`. Seed each with 2–3 obviously-placeholder entries (use the real facts from the Instagram graphics where they exist: "500+ nonprofit pool", 8 nonprofits in 2025–26 across IN/IL/CA/PA and UK/India/Ghana/Botswana). Build must fail on invalid content.
6. **Placeholder media system.** `content/media.ts` mapping semantic keys (`hero.globe`, `projects.<slug>.cover`, `exec.<slug>`) to paths, with a generated branded placeholder (dark surface, subtle grid, mint outline) so every image slot renders now and swapping in real photos later is a path change.
7. **Layout shell.** Root layout with `<SiteHeader>` and `<SiteFooter>`. Header: slim top bar like the Framer (logo `<HTF/>` as inline SVG you draw from the graphics — angle brackets, HTF, slash — plus tagline on the left; primary CTA on the right as a split button with a lime arrow cell), visible desktop links Projects / About / Students / Non-profits, burger drawer on mobile only (full-height, 2-column icon grid, socials at bottom, animated with Framer Motion, focus-trapped, Escape closes). Footer: four columns per the plan, real copyright. No Pricing, Services, or Newsletter anywhere.
8. **Shared primitives** in `src/components/ui/`: `Eyebrow` (small green square + uppercase label), `Headline` (renders a headline with specified accent words in green, supports the two-line staggered layout), `SplitButton`, `Section` (container + optional grid overlay + optional ghost background word), `Card`, `Accordion` (accessible, animated), `StatTile`. Each gets a tiny usage example in a `/dev/ui` route that is excluded from production builds.
9. **Home hero as proof.** Build `/` with only the hero, matching the composition in `reference/framer/home.png`: eyebrow, two-line split headline with the second line green ("Building software for" / "nonprofits, at Purdue." or similar — I will rewrite copy later), the small right-aligned blurb, primary CTA from config + secondary "See our projects", the bottom radial green glow, the grid overlay, the "Scroll Down" marker, and the wireframe globe as the hero object in place of the template's chrome ring. Do the globe as an SVG/CSS wireframe first; note in `PROGRESS.md` that the R3F version is Phase 3. Fade-and-rise reveal with stagger, disabled under reduced motion. Below the hero, render placeholder `Section`s with headings for the remaining home sections listed in the plan so the page scrolls and the rhythm is visible.
10. **Pages stubs.** Create routes with a hero-only stub and correct metadata for `/projects`, `/projects/[slug]`, `/about`, `/students`, `/nonprofits`, `/contact`, `/apply` (redirects to `season.applyUrl` while the external form is in use), `/privacy`, and a branded `not-found`. `sitemap.ts` and `robots.ts`.
11. **Verify.** `pnpm typecheck && pnpm lint && pnpm build` clean. Run the dev server, take screenshots of `/` at 1440 and 390 wide and of the open mobile drawer using Playwright, save them to `docs/screenshots/session-1/`, look at them, and fix anything that reads as off-brand or broken before finishing. Run an axe or Lighthouse accessibility pass on `/` and fix violations.
12. **Wrap up.** Write `docs/PROGRESS.md` (checklist of every plan item with Session 1 items checked, a "decisions made this session" list, and a "next session starts with" pointer to Session 2: complete Home + Students). Commit in small, conventional commits throughout, and give me a Vercel-ready state (no env vars required yet).

## How to work with me

- Ask me only when a decision is blocking and not answerable from `docs/PLAN.md`; otherwise choose the sensible default, note it in `PROGRESS.md` under "decisions made," and keep going.
- Don't invent facts about HTF (awards, numbers, names, quotes). Where content is unknown, use visibly placeholder text like `[TODO: exec name]` and list the TODO in `PROGRESS.md` so I can fill it.
- Prefer server components; keep client components small and leaf-level.
- Keep it fast: no heavy UI libraries, no three.js on the critical path this session, images through `next/image`.
- When you reproduce a Framer treatment, make it better where the template is weak (contrast, tap targets, nav discoverability, mobile spacing), and say what you changed.

Start by reading `docs/PLAN.md`, extracting the brand guide text, and looking at every image in `reference/`. Then summarize in five lines what you understood the visual language to be, and begin step 1.
