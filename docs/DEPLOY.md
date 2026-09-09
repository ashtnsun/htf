# Deploying the site

Runbook for the Phase 1 launch (PLAN.md §6). Steps 1–3 need accounts only the design director
has (GitHub org, Vercel, DNS); everything else is already in the repo. Since 2026-09-09 the
site needs no database or email service: applications go through the Google Form linked in
`content/site.ts` and messages by email (§5). The application portal and the site forms are
parked (§6, `parked/README.md`).

## 1. GitHub: move the repo into the club org

The code currently lives at `github.com/ashtnsun/htf` (public). To move it under the club's
organization:

1. On GitHub, open the repo → Settings → General → Danger zone → **Transfer ownership** and
   pick the org (you need to be an org owner, or ask one). Transferring keeps history, the
   default branch and issues. Alternatively create an empty repo in the org and push
   `main` to it.
2. Update the local remote, then confirm:

   ```bash
   git remote set-url origin git@github.com:<org>/<repo>.git
   git remote -v
   git push -u origin main
   ```

3. Protect `main` (Settings → Branches): require a pull request or at least block force
   pushes, so a stray `git push --force` cannot wipe history.

## 2. Vercel: create the project

1. vercel.com → Add New → Project → import the GitHub repo (install the Vercel GitHub app
   for the org when prompted).
2. Settings that matter (the defaults detect most of them):
   - Framework preset: **Next.js**
   - Build command: `pnpm build` (runs `gen:placeholders` and `validate:content` first)
   - Install command: `pnpm install`
   - Node.js version: **22.x**
   - Root directory: repo root
3. Environment variables: none are required. The one the site reads, in both Production
   and Preview:

   | Variable               | Purpose                                                                                                                                       |
   | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, OG URLs and the sitemap. Set it to `https://<domain>` once the domain is live; otherwise Vercel's URL is used. |

   Vercel only applies environment variable changes to new deployments (Deployments →
   Redeploy); the hourly revalidation does not re-read them. The variables of the parked
   portal and forms are listed in `parked/README.md`.

4. Deploy. Every push to `main` becomes Production; every pull request gets a Preview URL.
5. Analytics: Project → Analytics → Enable. The site already renders `<Analytics />` from
   `@vercel/analytics` (root layout); page views start counting once the project has it
   switched on. Nothing to configure in the code, and no cookies are set.

## 3. Domain

1. Vercel → Project → Settings → Domains → add the existing domain (both `example.org` and
   `www.example.org`; pick one as primary, Vercel redirects the other).
2. At the DNS provider, add the records Vercel shows. Typically:
   - apex `@` → `A 76.76.21.21`
   - `www` → `CNAME cname.vercel-dns.com`
     (If the DNS provider supports ALIAS/ANAME records, a CNAME-style record at the apex also works.)
3. Wait for the certificate (automatic, usually minutes), then set `NEXT_PUBLIC_SITE_URL`
   to the primary `https://` origin and redeploy so canonical URLs and the sitemap use it.

## 4. Post-deploy checks

- `https://<domain>/` loads with the season CTA; `/apply` embeds the Google Form (or shows
  the visible TODO with the Instagram button while `season.applyFormUrl` is unset).
- `https://<domain>/opengraph-image` returns a PNG; paste a page URL into a Slack or iMessage
  preview to confirm the card. `/students`, `/projects` and each project have their own image.
- `/sitemap.xml` and `/robots.txt` use the real origin.
- `/contact` shows the email address (set `site.socials.email` in `content/site.ts`; a TODO
  renders as visible TODO text), LinkedIn and Instagram; `/nonprofits#start` shows the
  "Email us" button. Send one test email.
- `/privacy` shows the effective date; flip `reviewed: true` in `content/privacy.mdx` after
  legal review to remove the draft badge.
- Run the accessibility scan against production:
  `pnpm a11y --base=https://<domain> --routes=/,/students,/projects,/apply,/contact,/privacy`.

## 5. Applications and messages (no services)

Applications: create the cycle's Google Form, Send → link, and paste the `…/viewform` URL into
`content/site.ts` → `season.applyFormUrl`. `/apply` embeds it (`embedded=true`) with an
"open in a new tab" link, every Apply CTA already points at `/apply`, and the deadline in
`season.closesAt` flips the CTA to Contact Us afterwards. Check the form's settings (sign-in
requirement, email collection, response receipts) match what `content/privacy.mdx` says.

Messages: set `site.socials.email` in `content/site.ts`. The Contact page, the Nonprofits
page ("Start a project"), the footer, the drawer and the 404 page all read it; while it is a
TODO they show visible TODO text and the Instagram fallback instead of a broken link.

## 6. Parked: the application portal and the site forms

The in-house portal (Supabase Auth, the multi-step form, the exec dashboard) and the contact /
intake forms are finished but parked under `parked/` (2026-09-09), with their environment
variables, the restore steps and the go-live checklist in `parked/README.md`. The database
definition stays in `supabase/` (migrations, seeds, the sign-in email template). Nothing in
this section is needed for the site as deployed.
