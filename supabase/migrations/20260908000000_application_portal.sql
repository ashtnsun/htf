-- Application portal (Phase 2, Session 7): PLAN.md section 5.
--
-- Applicants sign in with an email code or magic link (Supabase Auth), get one application
-- per account per cycle, and exec members listed in public.admins review them. Row Level
-- Security does the enforcement: the site reads and writes these tables as the signed-in
-- user (anon key + session cookie) from server actions and server components, never with the
-- service role. The two form tables from Phases 1 and 3 keep their service-role-only setup.
--
-- Apply with `supabase db push` on the linked project, or paste into the SQL editor.
-- Locally `supabase db reset` applies it together with supabase/seed*.sql.

-- ------------------------------------------------------------------------------ types

create type public.application_status as enum
  ('draft', 'submitted', 'reviewing', 'accepted', 'rejected', 'waitlisted');

create type public.question_kind as enum ('text', 'textarea', 'select', 'multiselect', 'url');

create type public.review_decision as enum ('yes', 'maybe', 'no');

-- ------------------------------------------------------------------------------ helpers

-- Keeps updated_at honest on every table that has one.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------------------------ admins

create table public.admins (
  email text primary key
    check (email = lower(email) and char_length(email) between 3 and 254),
  note text check (note is null or char_length(note) <= 200),
  added_at timestamptz not null default now()
);
comment on table public.admins is
  'Exec members allowed into /admin, by sign-in email. Edited in the SQL editor or dashboard.';

-- True when the signed-in user's email is in public.admins. SECURITY DEFINER so policies and
-- the site can call it without granting applicants any read on the admins table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ------------------------------------------------------------------------------ profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text check (full_name is null or char_length(full_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is
  'One row per signed-in account, created by the trigger on auth.users; email follows auth.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null then
    return new;
  end if;
  insert into public.profiles (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------ cycles, roles, questions

create table public.cycles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 60),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  check (closes_at > opens_at)
);
comment on table public.cycles is
  'Recruitment cycles ("Fall 2026"). One is active at a time; applicants write only while it is open.';
create unique index cycles_single_active on public.cycles (is_active) where is_active;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 60),
  description text check (description is null or char_length(description) <= 1000),
  is_open boolean not null default true,
  sort smallint not null default 0,
  unique (cycle_id, slug),
  unique (cycle_id, id)
);
comment on table public.roles is
  'Roles open in a cycle. Slugs match content/roles.ts so the Students page and the portal agree.';
create index roles_cycle_sort on public.roles (cycle_id, sort);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles (id) on delete cascade,
  -- Null = asked of everyone; otherwise only of applicants to that role (same cycle).
  role_id uuid references public.roles (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  prompt text not null check (char_length(prompt) between 1 and 500),
  help text check (help is null or char_length(help) <= 500),
  kind public.question_kind not null default 'textarea',
  -- Choices for select / multiselect; null for the other kinds.
  options text[] check (options is null or cardinality(options) between 1 and 20),
  max_chars integer check (max_chars is null or max_chars between 1 and 20000),
  required boolean not null default true,
  sort smallint not null default 0,
  unique (cycle_id, slug),
  foreign key (cycle_id, role_id) references public.roles (cycle_id, id),
  check ((kind in ('select', 'multiselect')) = (options is not null))
);
comment on table public.questions is
  'Application questions per cycle, shared (role_id null) or per role. Answers are jsonb per question.';
create index questions_cycle_sort on public.questions (cycle_id, sort);

-- Is the cycle taking applications right now?
create or replace function public.cycle_is_open(cycle uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.cycles c
    where c.id = cycle
      and c.is_active
      and now() >= c.opens_at
      and now() < c.closes_at
  );
$$;

-- ------------------------------------------------------------------------------ applications, answers, reviews

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_id uuid not null references public.cycles (id) on delete cascade,
  status public.application_status not null default 'draft',
  roles_applied uuid[] not null default '{}',
  -- Step 1 of the form (PLAN.md section 5), structured so the admin table can filter on it.
  full_name text check (full_name is null or char_length(full_name) <= 120),
  purdue_email text check (purdue_email is null or char_length(purdue_email) <= 254),
  year text check (year is null or char_length(year) <= 40),
  major text check (major is null or char_length(major) <= 120),
  linkedin_url text check (linkedin_url is null or char_length(linkedin_url) <= 300),
  portfolio_url text check (portfolio_url is null or char_length(portfolio_url) <= 300),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cycle_id),
  check ((status = 'draft') = (submitted_at is null))
);
comment on table public.applications is
  'One application per account per cycle. Answers to the questions live in public.answers.';
create index applications_cycle_status on public.applications (cycle_id, status);

create table public.answers (
  application_id uuid not null references public.applications (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  -- A string, or an array of strings for multiselect. Length limits are enforced by the
  -- server action against questions.max_chars.
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (application_id, question_id)
);
comment on table public.answers is 'Answer per application and question.';

create trigger answers_set_updated_at
  before update on public.answers
  for each row execute function public.set_updated_at();

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  score smallint check (score is null or score between 1 and 5),
  notes text check (notes is null or char_length(notes) <= 5000),
  decision public.review_decision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id, reviewer_id)
);
comment on table public.reviews is
  'One review per exec member per application; the dashboard averages the scores.';
create index reviews_application on public.reviews (application_id);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- Guards every write to applications, on top of the policies below:
--  * roles_applied holds distinct, open roles of the application's own cycle;
--  * an applicant may only save a draft or submit it (which stamps submitted_at) and needs
--    at least one role to submit; nothing changes after submission;
--  * an admin may change the status only, never the applicant's fields, and never back to
--    draft;
--  * updated_at is maintained.
-- auth.uid() is null for the service role and the SQL editor, which are trusted.
create or replace function public.applications_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
begin
  if cardinality(new.roles_applied)
     <> (select count(distinct r) from unnest(new.roles_applied) as r) then
    raise exception 'roles_applied must not repeat a role';
  end if;
  if exists (
    select 1
    from unnest(new.roles_applied) as r
    where not exists (
      select 1 from public.roles ro
      where ro.id = r and ro.cycle_id = new.cycle_id and ro.is_open
    )
  ) then
    raise exception 'roles_applied must be open roles of the application''s cycle';
  end if;

  if tg_op = 'INSERT' then
    if actor is not null and new.status <> 'draft' then
      raise exception 'applications start as drafts';
    end if;
    return new;
  end if;

  new.updated_at := now();

  if actor is not null and actor = old.user_id then
    -- The applicant.
    if old.status <> 'draft' then
      raise exception 'a submitted application can no longer be edited';
    end if;
    if new.status not in ('draft', 'submitted') then
      raise exception 'applicants may only save or submit';
    end if;
    if new.user_id <> old.user_id or new.cycle_id <> old.cycle_id then
      raise exception 'an application cannot move to another account or cycle';
    end if;
    if new.status = 'submitted' then
      if cardinality(new.roles_applied) = 0 then
        raise exception 'pick at least one role before submitting';
      end if;
      new.submitted_at := coalesce(new.submitted_at, now());
    end if;
  elsif actor is not null then
    -- An admin (the update policy already required public.is_admin()).
    if old.status = 'draft' or new.status = 'draft' then
      raise exception 'admins cannot edit or reopen drafts';
    end if;
    if row(new.user_id, new.cycle_id, new.roles_applied, new.full_name, new.purdue_email,
           new.year, new.major, new.linkedin_url, new.portfolio_url, new.submitted_at,
           new.created_at)
       is distinct from
       row(old.user_id, old.cycle_id, old.roles_applied, old.full_name, old.purdue_email,
           old.year, old.major, old.linkedin_url, old.portfolio_url, old.submitted_at,
           old.created_at) then
      raise exception 'admins may change only the status of an application';
    end if;
  end if;

  return new;
end;
$$;

create trigger applications_guard
  before insert or update on public.applications
  for each row execute function public.applications_guard();

-- ------------------------------------------------------------------------------ privileges

-- Granted explicitly per table: the database's default privileges give anon, authenticated
-- and service_role no DML on new public tables, and RLS only filters what a grant allows.
-- The two form tables from Phases 1 and 3 get their service-role grant here for the same
-- reason (their migrations only revoked from anon and authenticated).
grant usage on schema public to anon, authenticated, service_role;

grant select on public.cycles, public.roles, public.questions to anon, authenticated;
grant select on public.admins to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select, insert, update, delete on public.answers to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;

grant all on public.admins, public.profiles, public.cycles, public.roles, public.questions,
  public.applications, public.answers, public.reviews to service_role;
grant all on public.contact_messages, public.nonprofit_inquiries to service_role;

-- ------------------------------------------------------------------------------ row level security

alter table public.admins enable row level security;
alter table public.profiles enable row level security;
alter table public.cycles enable row level security;
alter table public.roles enable row level security;
alter table public.questions enable row level security;
alter table public.applications enable row level security;
alter table public.answers enable row level security;
alter table public.reviews enable row level security;

-- Cycle, role and question definitions are public reads: the /apply landing shows the
-- deadline and the roles before sign-in. They are edited in the SQL editor or dashboard.
create policy "cycles are public"
  on public.cycles for select to anon, authenticated using (true);
create policy "roles are public"
  on public.roles for select to anon, authenticated using (true);
create policy "questions are public"
  on public.questions for select to anon, authenticated using (true);

-- admins: only admins see the list; nobody edits it through the API.
create policy "admins see the admin list"
  on public.admins for select to authenticated using (public.is_admin());

-- profiles: your own row, or every row for admins. Owners may edit full_name only; email
-- follows auth.users through the trigger.
create policy "profiles: own or admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: owner updates"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- applications: applicants see their own, admins see all. Applicants create and edit only a
-- draft while the cycle is open; admins update (the guard trigger limits them to status).
create policy "applications: own or admin"
  on public.applications for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "applications: applicant starts a draft"
  on public.applications for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'draft'
    and public.cycle_is_open(cycle_id)
  );
create policy "applications: applicant edits an open draft"
  on public.applications for update to authenticated
  using (
    user_id = (select auth.uid())
    and status = 'draft'
    and public.cycle_is_open(cycle_id)
  )
  with check (
    user_id = (select auth.uid())
    and status in ('draft', 'submitted')
  );
create policy "applications: admin updates"
  on public.applications for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- answers: follow the application. Applicants write while it is an open draft, and only
-- to questions of the application's cycle.
create policy "answers: own or admin"
  on public.answers for select to authenticated
  using (exists (
    select 1 from public.applications a
    where a.id = application_id
      and (a.user_id = (select auth.uid()) or public.is_admin())
  ));
create policy "answers: applicant adds to an open draft"
  on public.answers for insert to authenticated
  with check (exists (
    select 1
    from public.applications a
    join public.questions q on q.cycle_id = a.cycle_id
    where a.id = application_id
      and q.id = question_id
      and a.user_id = (select auth.uid())
      and a.status = 'draft'
      and public.cycle_is_open(a.cycle_id)
  ));
create policy "answers: applicant edits an open draft"
  on public.answers for update to authenticated
  using (exists (
    select 1 from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
      and a.status = 'draft'
      and public.cycle_is_open(a.cycle_id)
  ))
  with check (exists (
    select 1
    from public.applications a
    join public.questions q on q.cycle_id = a.cycle_id
    where a.id = application_id
      and q.id = question_id
      and a.user_id = (select auth.uid())
      and a.status = 'draft'
      and public.cycle_is_open(a.cycle_id)
  ));
create policy "answers: applicant removes from an open draft"
  on public.answers for delete to authenticated
  using (exists (
    select 1 from public.applications a
    where a.id = application_id
      and a.user_id = (select auth.uid())
      and a.status = 'draft'
      and public.cycle_is_open(a.cycle_id)
  ));

-- reviews: admins only. Each reviewer owns their row; drafts cannot be reviewed.
create policy "reviews: admins read"
  on public.reviews for select to authenticated using (public.is_admin());
create policy "reviews: reviewer adds own"
  on public.reviews for insert to authenticated
  with check (
    public.is_admin()
    and reviewer_id = (select auth.uid())
    and exists (
      select 1 from public.applications a
      where a.id = application_id and a.status <> 'draft'
    )
  );
create policy "reviews: reviewer edits own"
  on public.reviews for update to authenticated
  using (public.is_admin() and reviewer_id = (select auth.uid()))
  with check (public.is_admin() and reviewer_id = (select auth.uid()));
create policy "reviews: reviewer removes own"
  on public.reviews for delete to authenticated
  using (public.is_admin() and reviewer_id = (select auth.uid()));
