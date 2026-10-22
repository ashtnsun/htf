-- Portfolio Night (/portfolio, 2026-10-22): the reference and community portfolio grids, the
-- goals board, and the bucket that keeps each portfolio's screenshot.
--
-- Every write goes through a Next.js server action with the service role
-- (src/lib/portfolio/db.ts), which checks the host password or the note's owner itself. The
-- browser only reads goals, through Realtime with the anon key, so the board updates live.
--
-- Apply with `supabase db push` once the project is linked, or paste into the SQL editor.

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- reference: picked by the host on /portfoliohost. community: added by anyone on /portfolio.
  kind text not null check (kind in ('reference', 'community')),
  url text not null check (char_length(url) between 8 and 300),
  title text not null check (char_length(title) between 1 and 80),
  -- Public URL in the portfolio-shots bucket; null until a capture succeeds.
  screenshot_url text,
  unique (kind, url)
);

comment on table public.portfolios is 'Portfolio Night: the reference and community grids on /portfolio.';

alter table public.portfolios enable row level security;
revoke all on public.portfolios from anon, authenticated;
grant select, insert, update, delete on public.portfolios to service_role;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- sha256 of the random token in the author's httpOnly cookie. Readable by anon (Realtime
  -- sends whole rows), which is harmless: the token cannot be recovered from it.
  owner_hash text not null,
  x real not null,
  y real not null,
  color text not null check (color in ('lime', 'green', 'cyan', 'blue', 'pink', 'white')),
  text text not null default '' check (char_length(text) <= 160)
);

comment on table public.goals is 'Portfolio Night: the sticky notes on the goals board.';

alter table public.goals enable row level security;
revoke all on public.goals from anon, authenticated;
grant select on public.goals to anon;
grant select, insert, update, delete on public.goals to service_role;

create policy "goals are public to read" on public.goals for select to anon using (true);

-- Live board: Realtime streams inserts, updates and deletes (deletes carry the id only).
alter publication supabase_realtime add table public.goals;

insert into storage.buckets (id, name, public)
values ('portfolio-shots', 'portfolio-shots', true)
on conflict (id) do nothing;
