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
it; the build runs that first and fails on invalid content.

Visual + accessibility checks (need `pnpm dev` running in another terminal):

```bash
pnpm screenshots --out docs/screenshots/session-N
pnpm a11y --routes /,/projects,/students
```

## Deploy

Vercel, framework preset Next.js, build command `pnpm build`. No environment variables are
required yet. Optional: `NEXT_PUBLIC_SITE_URL` to force the canonical origin used in
metadata and the sitemap (otherwise the Vercel production URL is used).
