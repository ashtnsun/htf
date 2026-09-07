# Deploying the site

Runbook for the Phase 1 launch (PLAN.md §6). Steps 1–3 need accounts only the design director
has (GitHub org, Vercel, DNS); everything else is already in the repo.

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
3. Environment variables: none are required. Add them only when a feature needs them, in
   both Production and Preview:

   | Variable                                    | Purpose                                                                                                                                       |
   | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SITE_URL`                      | Canonical origin for metadata, OG URLs and the sitemap. Set it to `https://<domain>` once the domain is live; otherwise Vercel's URL is used. |
   | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Contact and intake forms → `contact_messages` / `nonprofit_inquiries` tables (see §5). Server-only, never `NEXT_PUBLIC_`.                     |
   | `RESEND_API_KEY`, `CONTACT_INBOX`           | Contact and intake forms → email notification. `CONTACT_FROM` must be a sender on a domain verified in Resend.                                |
   | `SUPABASE_ANON_KEY`                         | Application portal sign-in (anon / publishable key of the same project). See §6.                                                              |
   | `NEXT_PUBLIC_APPLY_MODE`                    | `portal` switches `/apply` from the external-form redirect to the portal. Preview first (dry run), Production after it passes. See §6.        |

   The contact and intake pages pick their mode (server delivery, mailto, or the Instagram
   fallback) when the site is built, so after adding or changing these variables trigger a redeploy
   (Deployments → Redeploy). Vercel only applies environment variable changes to new
   deployments; the hourly revalidation does not re-read them.

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

- `https://<domain>/` loads with the season CTA; `/apply` redirects to the external form.
- `https://<domain>/opengraph-image` returns a PNG; paste a page URL into a Slack or iMessage
  preview to confirm the card. `/students`, `/projects` and each project have their own image.
- `/sitemap.xml` and `/robots.txt` use the real origin.
- `/contact` shows the form in the expected mode: mailto (club email set in
  `content/site.ts`) or server delivery (env vars set). Send one test message.
- `/privacy` shows the effective date; flip `reviewed: true` in `content/privacy.mdx` after
  legal review to remove the draft badge.
- Run the accessibility scan against production:
  `pnpm a11y --base=https://<domain> --routes=/,/students,/projects,/contact,/privacy`.

## 5. Form delivery (contact + nonprofit intake; optional until Phase 2)

Supabase (store submissions):

1. Create the Supabase project (the same one Phase 2 will use for the portal).
2. Apply both migrations in `supabase/migrations/` (`contact_messages`,
   `nonprofit_inquiries`): paste them into the SQL editor, or link the project and run
   `supabase db push`.
3. Copy Project Settings → API → Project URL and the **service role** key into Vercel as
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The table has RLS enabled with no
   policies, so only the service role (server action) can read or write it.
4. Read submissions in Table Editor → `contact_messages` and `nonprofit_inquiries`; set
   `handled_at` when answered.

Resend (email notifications):

1. Create a Resend account, verify the club's sending domain, create an API key.
2. Set `RESEND_API_KEY`, `CONTACT_INBOX` (where messages go) and `CONTACT_FROM`
   (`Hack the Future website <noreply@<verified-domain>>`).

Both can be on at once; a submission counts as sent when at least one delivery succeeds.
The code path is `src/lib/forms/deliver.ts` (shared), with the per-form wrappers in
`src/lib/contact/deliver.ts` and `src/lib/inquiries/deliver.ts`.

## 6. Application portal (Phase 2)

The portal (`/apply`, `/apply/form`, `/admin`) uses Supabase Auth with email codes and links,
the tables in `supabase/migrations/20260908000000_application_portal.sql`, and Row Level
Security. It stays off in production (`/apply` keeps redirecting to the external form) until
`NEXT_PUBLIC_APPLY_MODE=portal` is set after the dry run.

1. **Database.** Same project as the forms. Apply all migrations in order (`supabase link
--project-ref <ref>` then `supabase db push`, or paste them into the SQL editor). Then run
   `supabase/seed.sql` once in the SQL editor after checking the cycle dates, the roles and the
   questions (every `[TODO: confirm]` prompt is a placeholder). Do not run `seed.local.sql`.
   Add the exec board, lowercase emails:

   ```sql
   insert into public.admins (email, note) values ('someone@purdue.edu', 'President');
   ```

2. **Auth URLs** (Authentication → URL Configuration). Site URL `https://<domain>`. Redirect
   URLs: `https://<domain>/**`, `https://*.vercel.app/**` (preview deployments) and
   `http://localhost:3000/**`. The sign-in link is built from the request's origin and Supabase
   falls back to the Site URL when the origin is not on this list.
3. **Email templates** (Authentication → Email Templates). Paste
   `supabase/templates/sign-in.html` into both **Confirm signup** (used the first time an
   address signs in) and **Magic Link**, subject "Your Hack the Future sign-in code". The code
   is `{{ .Token }}`; the link is `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`,
   which `/auth/confirm` verifies (it works on any device, unlike a code exchange). Keep the
   email OTP expiry at 3600 s or less and the length at 6.
4. **SMTP through Resend** (Project Settings → Authentication → SMTP). The built-in sender
   allows 2 emails per hour, so this is required before the dry run: host `smtp.resend.com`,
   port `465`, username `resend`, password = a Resend API key, sender
   `noreply@<verified-domain>`, sender name "Hack the Future". Then raise Authentication →
   Rate Limits → "emails sent per hour" above the expected deadline-day peak (Resend free
   tier: 100 per day, 3,000 per month; confirm against the applicant count or use a paid
   month).
5. **Vercel.** Add `SUPABASE_ANON_KEY` (Project Settings → API → anon / publishable key) next
   to `SUPABASE_URL`, and `NEXT_PUBLIC_APPLY_MODE=portal` on **Preview** only. The
   confirmation email after a submission uses `RESEND_API_KEY` and `CONTACT_FROM` from §2
   (the Resend API, not SMTP; `CONTACT_INBOX` is not needed for it) and is skipped with a log
   line when the key is missing. Redeploy. The
   dry run (PLAN.md §6, Phase 2 gate) happens on a preview URL: five exec members apply and
   review end to end. When it passes, set `NEXT_PUBLIC_APPLY_MODE=portal` on Production and
   redeploy; `/apply` becomes the portal and every Apply CTA already points there.
6. **Local development.** `supabase start` (ports 54331 and up, see `supabase/config.toml`),
   `supabase db reset` (migrations + seeds), then `.env.local` with `SUPABASE_URL` = the
   `API_URL` and `SUPABASE_ANON_KEY` = the `ANON_KEY` from `supabase status -o env`, plus
   `NEXT_PUBLIC_APPLY_MODE=portal`. Emails land in Mailpit at http://localhost:54334.
   `admin@example.com` is on the local admin list (`supabase/seed.local.sql`). Remove
   `.env.local` before a production build meant to mirror the live site.
7. **Checks.** `/apply` shows the landing with the deadline from the `cycles` table; a code
   arrives through Resend and both the code and the link sign in; a test application walks
   profile → roles → questions → review, autosaves ("Saved …" in the aside), submits, sends
   the confirmation email and then shows read-only; `/admin` shows the exec-only page to a
   non-admin and the counts to an admin; `robots.txt` disallows `/apply`, `/admin` and
   `/auth`. Delete the test application afterwards in the SQL editor.
8. **Free-tier pause.** Supabase pauses a free project after a week without activity. Session
   10 adds the keepalive cron; until then restore the project from the dashboard before the
   season starts.
