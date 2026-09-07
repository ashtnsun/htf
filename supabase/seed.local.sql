-- Local development only. Listed after seed.sql in supabase/config.toml -> [db.seed].sql_paths,
-- so `supabase db reset` loads it; never run it on the hosted project.
--
-- Signing in as this address from /apply (read the code in Mailpit, http://localhost:54334)
-- gives an exec account for testing /admin. example.com cannot receive mail, so the address
-- is harmless anywhere else.
insert into public.admins (email, note)
values ('admin@example.com', 'local testing account')
on conflict (email) do nothing;
