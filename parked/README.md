# Parked features

Code that is finished but not part of the site right now, kept in the tree so it can come
back without digging through git history. Nothing in here is compiled, type-checked, linted
or deployed: `tsconfig.json` excludes `parked`, `eslint.config.mjs` ignores it, Prettier skips
it, and Next.js only builds routes under `src/app`.

Parked on 2026-09-09 (Session 13) when the club decided to run Fall 2026 applications through
a Google Form and to handle nonprofit requests and contact messages by email.

The tree mirrors `src/`, so every file goes back to the path it came from
(`parked/src/lib/auth/session.ts` → `src/lib/auth/session.ts`).

## What is here

**The application portal (Phase 2, Sessions 7–10).** Email-code / magic-link sign-in with
Supabase Auth, the multi-step application form with autosave, the confirmation email through
Resend, the exec dashboard with filters, sortable table, CSV export and the review panel.

- `src/app/apply/page.tsx` (the old season landing + sign-in; the live `/apply` is now the
  Google Form page), `src/app/apply/actions.ts`, `src/app/apply/form/`,
  `src/app/apply/submitted/`, `src/app/admin/`, `src/app/auth/confirm/route.ts`
- `src/proxy.ts` (session refresh + the optimistic redirect for `/apply` and `/admin`)
- `src/components/apply/`, `src/components/admin/`
- `src/lib/apply/`, `src/lib/auth/`, `src/lib/portal/`, `src/lib/supabase/`
- Still in place at the repo root: `supabase/` (config, migrations, seeds, the email
  template), because the Supabase CLI expects it there and it is inert otherwise.

**The site forms (Sessions 4 and 6).** The contact form and the nonprofit intake form:
server actions delivering to Supabase tables and/or a Resend notification, with a `mailto:`
fallback and honeypot.

- `src/app/contact/actions.ts`, `src/app/nonprofits/actions.ts`
- `src/components/contact/ContactForm.tsx`, `src/components/nonprofits/IntakeForm.tsx`
- `src/components/forms/` (useFormSubmission, SentPanel, Honeypot, CountedTextArea)
- `src/lib/forms/` (fields, deliver: shared by the portal's confirmation email),
  `src/lib/contact/`, `src/lib/inquiries/`

Still live because other things use it: `src/components/ui/Field.tsx` (the form primitives,
shown in `/dev/ui`).

## Environment variables these need

None of these are read by the live site.

```
# Forms -> Supabase tables public.contact_messages / public.nonprofit_inquiries.
# Server-side only: never expose the service role key with a NEXT_PUBLIC_ prefix.
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Forms and the portal -> email through Resend. CONTACT_FROM must be a sender on a domain
# verified in Resend; the resend.dev default only delivers to the Resend account owner.
RESEND_API_KEY=
CONTACT_INBOX=
CONTACT_FROM="Hack the Future website <onboarding@resend.dev>"

# The portal: Supabase Auth with the anon / publishable key and the same SUPABASE_URL.
SUPABASE_ANON_KEY=
# The old switch between the external form and the portal (read by the parked
# content/site.ts logic `isPortalMode`, removed from the live file).
NEXT_PUBLIC_APPLY_MODE=external
```

The `@supabase/ssr` and `@supabase/supabase-js` packages stay in `package.json` so the parked
code needs no reinstall; nothing live imports them.

## Restoring

1. Move the files back (`git mv parked/src/<path> src/<path>`), or copy the whole
   `parked/src` tree over `src/`.
2. Put back what the live tree replaced: in `content/site.ts` the `season.applyMode` /
   `applyUrl` fields with `getApplyDestination()` and `isPortalMode()` (see the version in
   git before commit "feat(apply): Google Form page" of 2026-09-09), the `/apply` landing,
   `robots.ts` disallowing `/apply`, `/admin` and `/auth`, and the `.env.example` block above.
3. Re-add the parked pieces to `CLAUDE.md` (folders, the Portal and Forms rules, the
   Supabase commands) from the same commit's parent, remove `parked` from `tsconfig.json`,
   `eslint.config.mjs` and `.prettierignore`, and point `supabase:types` in `package.json`
   back at `src/lib/supabase/database.types.ts`.
4. `pnpm typecheck && pnpm lint && pnpm build`; the go-live steps are in `docs/DEPLOY.md`
   §6 as it stood before the same commit, and the dry-run plan in `docs/PLAN.md` §5–§6.
