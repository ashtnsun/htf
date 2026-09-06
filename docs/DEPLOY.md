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
   | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Contact form → `contact_messages` table (see §5). Server-only, never `NEXT_PUBLIC_`.                                                          |
   | `RESEND_API_KEY`, `CONTACT_INBOX`           | Contact form → email notification. `CONTACT_FROM` must be a sender on a domain verified in Resend.                                            |

   The contact page picks its mode (server delivery, mailto, or the Instagram fallback) when
   the site is built, so after adding or changing these variables trigger a redeploy
   (Deployments → Redeploy). Vercel only applies environment variable changes to new
   deployments; the hourly revalidation does not re-read them.

4. Deploy. Every push to `main` becomes Production; every pull request gets a Preview URL.

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

## 5. Contact form delivery (optional until Phase 2)

Supabase (store messages):

1. Create the Supabase project (the same one Phase 2 will use for the portal).
2. Apply `supabase/migrations/20260906000000_contact_messages.sql`: paste it into the SQL
   editor, or link the project and run `supabase db push`.
3. Copy Project Settings → API → Project URL and the **service role** key into Vercel as
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The table has RLS enabled with no
   policies, so only the service role (server action) can read or write it.
4. Read messages in Table Editor → `contact_messages`; set `handled_at` when answered.

Resend (email notifications):

1. Create a Resend account, verify the club's sending domain, create an API key.
2. Set `RESEND_API_KEY`, `CONTACT_INBOX` (where messages go) and `CONTACT_FROM`
   (`Hack the Future website <noreply@<verified-domain>>`).

Both can be on at once; a message counts as sent when at least one delivery succeeds.
