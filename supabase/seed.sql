-- Seed for the application portal: the current cycle, its roles and its questions.
-- Idempotent (upserts by slug), so it can be re-run after edits. `supabase db reset` runs it
-- locally; on the hosted project run it once in the SQL editor (or `supabase db push
-- --include-seed`) after checking the dates. Admin emails are NOT here: add them in the SQL
-- editor (`insert into public.admins (email) values ('exec@purdue.edu');`), see
-- supabase/seed.local.sql for the local test account.
--
-- TODO(ashton): confirm opens_at and closes_at (closes_at mirrors content/site.ts ->
-- season.closesAt), the roles (content/roles.ts) and replace every "[TODO: confirm]" question
-- with the real ones for this cycle.

insert into public.cycles (slug, name, opens_at, closes_at, is_active)
values ('fall-2026', 'Fall 2026', '2026-08-24 00:00:00-04', '2026-09-12 23:59:00-04', true)
on conflict (slug) do update
  set name = excluded.name,
      opens_at = excluded.opens_at,
      closes_at = excluded.closes_at,
      is_active = excluded.is_active;

insert into public.roles (cycle_id, slug, name, description, sort)
select c.id, r.slug, r.name, r.description, r.sort
from public.cycles c,
  (values
    ('project-lead', 'Project Lead', 'Scoping, planning, team leadership', 1),
    ('developer',    'Developer',    'Front-end, back-end, full-stack', 2),
    ('designer',     'Designer',     'UX research, UI design, prototyping', 3)
  ) as r (slug, name, description, sort)
where c.slug = 'fall-2026'
on conflict (cycle_id, slug) do update
  set name = excluded.name,
      description = excluded.description,
      sort = excluded.sort;

-- Shared questions (asked of everyone).
insert into public.questions
  (cycle_id, role_id, slug, prompt, help, kind, options, max_chars, required, sort)
select c.id, null, q.slug, q.prompt, q.help, q.kind::public.question_kind, q.options,
       q.max_chars, q.required, q.sort
from public.cycles c,
  (values
    ('why-htf',
     '[TODO: confirm] Why do you want to join Hack the Future?',
     'A paragraph is plenty.',
     'textarea', null::text[], 1500, true, 1),
    ('experience',
     '[TODO: confirm] Tell us about something you built, designed or organised that you are proud of.',
     'Class projects, personal projects and jobs all count.',
     'textarea', null, 1500, true, 2),
    ('hours',
     '[TODO: confirm] How many hours a week can you give HTF this year?',
     null,
     'select', array['2 to 4 hours', '5 to 7 hours', '8 or more hours'], null, true, 3),
    ('heard-from',
     '[TODO: confirm] How did you hear about us?',
     null,
     'text', null, 200, false, 4)
  ) as q (slug, prompt, help, kind, options, max_chars, required, sort)
where c.slug = 'fall-2026'
on conflict (cycle_id, slug) do update
  set role_id = excluded.role_id,
      prompt = excluded.prompt,
      help = excluded.help,
      kind = excluded.kind,
      options = excluded.options,
      max_chars = excluded.max_chars,
      required = excluded.required,
      sort = excluded.sort;

-- Questions asked only of applicants to a role.
insert into public.questions
  (cycle_id, role_id, slug, prompt, help, kind, options, max_chars, required, sort)
select c.id, r.id, q.slug, q.prompt, q.help, q.kind::public.question_kind, null::text[],
       q.max_chars, true, q.sort
from public.cycles c
join (values
    ('project-lead', 'lead-experience',
     '[TODO: confirm] Describe a time you led a team or a project. What went well, and what would you do differently?',
     null, 'textarea', 1500, 10),
    ('developer', 'dev-stack',
     '[TODO: confirm] Which languages, frameworks or tools are you most comfortable with, and what would you like to learn?',
     null, 'textarea', 1000, 11),
    ('designer', 'design-work',
     '[TODO: confirm] Link to or describe design work you have done, in class, on your own or professionally.',
     'A portfolio link goes in your profile; use this for the story behind it.',
     'textarea', 1000, 12)
  ) as q (role_slug, slug, prompt, help, kind, max_chars, sort) on true
join public.roles r on r.cycle_id = c.id and r.slug = q.role_slug
where c.slug = 'fall-2026'
on conflict (cycle_id, slug) do update
  set role_id = excluded.role_id,
      prompt = excluded.prompt,
      help = excluded.help,
      kind = excluded.kind,
      options = excluded.options,
      max_chars = excluded.max_chars,
      required = excluded.required,
      sort = excluded.sort;
