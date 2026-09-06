-- Contact form messages (Phase 1, Session 4).
-- The site inserts with the service role from a Next.js server action
-- (src/lib/contact/deliver.ts). Nothing reads this table from the browser; exec reads it in
-- the Supabase dashboard until the Phase 2 admin dashboard exists.
--
-- Apply with `supabase db push` once the project is linked, or paste into the SQL editor.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254),
  audience text not null check (audience in ('student', 'nonprofit', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  -- Set by exec when a message has been answered (dashboard column for now).
  handled_at timestamptz
);

comment on table public.contact_messages is 'Messages sent through /contact on the website.';

-- Lock the table down: no policies means anon/authenticated get nothing; the service role
-- used by the server action bypasses RLS.
alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
