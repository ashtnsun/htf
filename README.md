# Hack the Future Purdue — website

The site for [Hack the Future](https://www.instagram.com/hackthefuturepurdue/), a Purdue
student organization that builds software for nonprofits. Next.js 16 · Tailwind v4 · Framer
Motion · typed content files validated with Zod. Deployed on Vercel.

- `docs/PLAN.md` — the full plan (audit, decisions, sitemap, page specs, tokens, portal
  architecture, phasing). Source of truth.
- `docs/PROGRESS.md` — what is done, decisions made, open TODOs, what the next session does.
- `CLAUDE.md` — conventions for working in this repo (also read by Claude Code).

## Develop

```bash
pnpm install
pnpm dev            # http://localhost:3000  (/dev/ui shows the component kit)
pnpm typecheck && pnpm lint && pnpm build
```

Content lives in `content/` (see CLAUDE.md → Content rules). `pnpm validate:content` checks
it; the build runs that first (after `pnpm gen:placeholders`) and fails on invalid content.

Projects are `content/projects/<slug>.mdx`: Zod-validated frontmatter (title, nonprofit,
year, location, tags, summary, cover, optional `liveUrl`, `gallery`, `stack`, `team`,
`featured`, `published`) and a Markdown/MDX body rendered on `/projects/<slug>`. Gallery
entries are media keys, or `{ src, alt, caption }` objects when a screenshot needs alt text.

Visual + accessibility checks (need `pnpm dev` running in another terminal):

```bash
pnpm screenshots --out=docs/screenshots/session-N --routes=/,/projects
pnpm a11y --routes=/,/projects,/students
# --dialog also opens the gallery lightbox on routes that have one (Git Bash: MSYS_NO_PATHCONV=1)
pnpm a11y --routes=/projects/placeholder-project-1 --dialog=Enlarge
```

## Deploy

Vercel, framework preset Next.js, build command `pnpm build`, Node 22. No environment
variables are required; the optional ones are listed in `.env.example` (canonical origin,
contact form delivery through Supabase and/or Resend). The full runbook, including the GitHub
org repo, the domain and the Supabase migration for the contact form, is `docs/DEPLOY.md`.

Open Graph images are generated at build time by the `opengraph-image.tsx` routes (site,
`/students`, `/projects` and every project) from the Poppins subset in `src/assets/fonts`.
