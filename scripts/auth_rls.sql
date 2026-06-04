-- ════════════════════════════════════════════════════════════════════════════
--  Nekudat Tziyon — Auth, ownership, RLS
--
--  Apply ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → paste → Run).
--  Fully IDEMPOTENT — safe to run again. Pair with `scripts/schema_full_app.sql`
--  (run that first if you haven't already).
--
--  WHAT THIS DOES:
--    1. Adds `user_id` ownership columns to memorial_sites / routes
--    2. Adds `is_admin` to profiles + a SECURITY DEFINER `public.is_admin()`
--       helper (used by policies — avoids recursive RLS lookups)
--    3. Creates a `route_completions` table for the badges system
--    4. Auto-creates a `profiles` row whenever a new auth user signs up
--       (trigger), so RLS joins on the feed never come back empty
--    5. Enables Row Level Security + adds policies that:
--         • anyone can read APPROVED sites/routes + galleries + waypoints
--           + community feed + profiles
--         • a logged-in user can read their OWN pending submissions
--         • authenticated users insert their OWN submissions as 'pending'
--         • only the owner reads/writes their saves & completions
--         • only ADMINS can read pending items and update statuses
--
--  ⚠️  IMPORTANT — designate at least one admin BEFORE enabling RLS by
--      running the marked UPDATE at the end (edit the email to yours).
--      Otherwise the admin panel will be unreachable.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Ownership columns ──────────────────────────────────────────────────────
alter table memorial_sites
  add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists idx_memorial_user on memorial_sites(user_id);

alter table routes
  add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists idx_routes_user on routes(user_id);

-- ── 2. profiles.is_admin + helper ─────────────────────────────────────────────
alter table profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

-- ── 3. route_completions table (real badge progress, not localStorage) ────────
create table if not exists route_completions (
  id         bigserial primary key,
  user_id    uuid   not null references auth.users(id) on delete cascade,
  route_id   bigint not null references routes(id)      on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, route_id)
);
create index if not exists idx_completions_user on route_completions(user_id);

-- ── 4. Auto-create a profiles row on signup ───────────────────────────────────
--      (Many Supabase projects already have this; the CREATE OR REPLACE +
--       DROP-IF-EXISTS keeps the script idempotent.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  fname text := nullif(trim(coalesce(meta->>'full_name', '')), '');
  email_local text := split_part(coalesce(new.email, ''), '@', 1);
begin
  insert into public.profiles (id, full_name, initials, avatar_color)
  values (
    new.id,
    coalesce(fname, email_local, 'אנונימי'),
    upper(left(coalesce(fname, email_local, '?'), 1)),
    '#7B9E4A'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════════════
--  5. Row Level Security
-- ════════════════════════════════════════════════════════════════════════════

-- ── memorial_sites ────────────────────────────────────────────────────────────
alter table memorial_sites enable row level security;

drop policy if exists ms_public_read on memorial_sites;
create policy ms_public_read on memorial_sites
  for select using (
    status = 'approved' or user_id = auth.uid() or public.is_admin()
  );

drop policy if exists ms_insert_own_pending on memorial_sites;
create policy ms_insert_own_pending on memorial_sites
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists ms_admin_update on memorial_sites;
create policy ms_admin_update on memorial_sites
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists ms_delete_owner_or_admin on memorial_sites;
create policy ms_delete_owner_or_admin on memorial_sites
  for delete using (public.is_admin() or user_id = auth.uid());

-- ── routes ────────────────────────────────────────────────────────────────────
alter table routes enable row level security;

drop policy if exists rt_public_read on routes;
create policy rt_public_read on routes
  for select using (
    status = 'approved' or user_id = auth.uid() or public.is_admin()
  );

drop policy if exists rt_insert_own_pending on routes;
create policy rt_insert_own_pending on routes
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists rt_admin_update on routes;
create policy rt_admin_update on routes
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists rt_delete_owner_or_admin on routes;
create policy rt_delete_owner_or_admin on routes
  for delete using (public.is_admin() or user_id = auth.uid());

-- ── route_waypoints (public read — joined into route detail) ──────────────────
alter table route_waypoints enable row level security;
drop policy if exists rw_public_read on route_waypoints;
create policy rw_public_read on route_waypoints for select using (true);
drop policy if exists rw_admin_write on route_waypoints;
create policy rw_admin_write on route_waypoints
  for all using (public.is_admin()) with check (public.is_admin());

-- ── site_galleries (public read; authenticated insert during addMemorial) ─────
alter table site_galleries enable row level security;
drop policy if exists sg_public_read on site_galleries;
create policy sg_public_read on site_galleries for select using (true);
drop policy if exists sg_authenticated_insert on site_galleries;
create policy sg_authenticated_insert on site_galleries
  for insert to authenticated with check (true);
drop policy if exists sg_admin_write on site_galleries;
create policy sg_admin_write on site_galleries
  for all using (public.is_admin()) with check (public.is_admin());

-- ── profiles (public read for feed name-joins; user manages OWN row) ──────────
alter table profiles enable row level security;
drop policy if exists pr_public_read on profiles;
create policy pr_public_read on profiles for select using (true);
drop policy if exists pr_insert_own on profiles;
create policy pr_insert_own on profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists pr_update_own on profiles;
create policy pr_update_own on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── community_activities (public feed; anyone can light a candle) ─────────────
alter table community_activities enable row level security;
drop policy if exists ca_public_read on community_activities;
create policy ca_public_read on community_activities for select using (true);
drop policy if exists ca_open_insert on community_activities;
create policy ca_open_insert on community_activities for insert with check (true);

-- ── saved_routes — owner only ─────────────────────────────────────────────────
alter table saved_routes enable row level security;
drop policy if exists sr_own_all on saved_routes;
create policy sr_own_all on saved_routes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── saved_memorials — owner only ──────────────────────────────────────────────
alter table saved_memorials enable row level security;
drop policy if exists sm_own_all on saved_memorials;
create policy sm_own_all on saved_memorials
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── route_completions — owner only ────────────────────────────────────────────
alter table route_completions enable row level security;
drop policy if exists rc_own_all on route_completions;
create policy rc_own_all on route_completions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════════
--  6. Designate your admin user(s)  ←  ⚠️  EDIT THIS BEFORE RUNNING
--     The frontend Admin Panel is gated by profiles.is_admin = true.
-- ════════════════════════════════════════════════════════════════════════════
update public.profiles
   set is_admin = true
 where id in (
   select id from auth.users
   where email = 'galtenne25@gmail.com'   -- 👈 change / add emails here
 );
