-- Nonprofit intake inquiries (Phase 3, Session 6): the "Start a project" form on /nonprofits.
-- The site inserts with the service role from a Next.js server action
-- (src/lib/inquiries/deliver.ts via src/lib/forms/deliver.ts). Nothing reads this table from
-- the browser; exec reads it in the Supabase dashboard until the admin dashboard exists.
--
-- Apply with `supabase db push` once the project is linked, or paste into the SQL editor.

create table if not exists public.nonprofit_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  organization text not null check (char_length(organization) between 1 and 120),
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254),
  website text check (website is null or char_length(website) <= 200),
  location text check (location is null or char_length(location) <= 120),
  message text not null check (char_length(message) between 20 and 3000),
  -- Set by exec when an inquiry has been answered (dashboard column for now).
  handled_at timestamptz
);

comment on table public.nonprofit_inquiries is 'Project inquiries sent through /nonprofits on the website.';

-- Lock the table down: no policies means anon/authenticated get nothing; the service role
-- used by the server action bypasses RLS.
alter table public.nonprofit_inquiries enable row level security;
revoke all on public.nonprofit_inquiries from anon, authenticated;
