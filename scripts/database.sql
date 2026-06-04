-- ════════════════════════════════════════════════════════════════════════════
--  Nekudat Tziyon — FINAL canonical database setup
--
--  Single source of truth for tables, columns, RPCs, RLS policies, the
--  storage bucket, and storage RLS. Fully IDEMPOTENT — re-running it brings
--  the database back to the canonical, production-ready state without
--  destroying data.
--
--  Supersedes scripts/schema_full_app.sql and scripts/auth_rls.sql for any
--  fresh setup or correctness check.
--
--  HOW TO RUN:
--    Supabase Dashboard → SQL Editor → paste this file → Run.
--    Total runtime: a few seconds.
--
--  ⚠️  Step 7 grants admin to a designated email. Edit that email if needed.
--      Note: it only sets is_admin=true once a user with that email has
--      signed up (so signups happen first).
-- ════════════════════════════════════════════════════════════════════════════


-- ┌─ 1. CORE TABLES & COLUMNS ────────────────────────────────────────────────
-- Existing tables already created by seeders; we only ensure schema is correct.
-- New required columns are added with IF NOT EXISTS so reruns are no-ops.

-- ── memorial_sites ───────────────────────────────────────────────────────────
alter table public.memorial_sites
  add column if not exists dedicated_to text;
alter table public.memorial_sites
  add column if not exists status text not null default 'approved';
alter table public.memorial_sites
  add column if not exists user_id uuid references auth.users(id) on delete set null;
update public.memorial_sites set status = 'approved' where status is null;
create index if not exists idx_memorial_status on public.memorial_sites(status);
create index if not exists idx_memorial_user   on public.memorial_sites(user_id);

-- ── routes ──────────────────────────────────────────────────────────────────
alter table public.routes
  add column if not exists status     text not null default 'approved';
alter table public.routes
  add column if not exists region     text;
alter table public.routes
  add column if not exists has_water  boolean;
alter table public.routes
  add column if not exists route_type text;
alter table public.routes
  add column if not exists user_id    uuid references auth.users(id) on delete set null;
update public.routes set status = 'approved' where status is null;
create index if not exists idx_routes_status on public.routes(status);
create index if not exists idx_routes_user   on public.routes(user_id);

-- ── community_activities (frontend writes site_id) ─────────────────────────
alter table public.community_activities
  add column if not exists site_id bigint references public.memorial_sites(id) on delete set null;
create index if not exists idx_activities_site on public.community_activities(site_id);

-- ── profiles (richer fields + admin flag) ──────────────────────────────────
alter table public.profiles add column if not exists bio        text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists is_admin   boolean not null default false;

-- ── route_completions (new — backs the "completed routes" badges) ──────────
create table if not exists public.route_completions (
  id         bigserial primary key,
  user_id    uuid   not null references auth.users(id) on delete cascade,
  route_id   bigint not null references public.routes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, route_id)
);
create index if not exists idx_completions_user on public.route_completions(user_id);

-- ── community_posts / comments / saved_* (optional features) ────────────────
create table if not exists public.community_posts (
  id          bigserial primary key,
  author_id   uuid   references public.profiles(id) on delete set null,
  route_id    bigint references public.routes(id)         on delete set null,
  site_id     bigint references public.memorial_sites(id) on delete set null,
  title       text not null,
  body        text not null,
  post_type   text not null default 'experience',
  like_count  integer not null default 0,
  created_at  timestamptz not null default now()
);
create table if not exists public.community_comments (
  id          bigserial primary key,
  post_id     bigint not null references public.community_posts(id) on delete cascade,
  author_id   uuid   references public.profiles(id) on delete set null,
  body        text not null,
  created_at  timestamptz not null default now()
);
create table if not exists public.saved_routes (
  id          bigserial primary key,
  user_id     uuid   not null references auth.users(id) on delete cascade,
  route_id    bigint not null references public.routes(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, route_id)
);
create table if not exists public.saved_memorials (
  id          bigserial primary key,
  user_id     uuid   not null references auth.users(id) on delete cascade,
  site_id     bigint not null references public.memorial_sites(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, site_id)
);
create index if not exists idx_comments_post     on public.community_comments(post_id);
create index if not exists idx_posts_author      on public.community_posts(author_id);
create index if not exists idx_saved_routes_user on public.saved_routes(user_id);
create index if not exists idx_saved_mem_user    on public.saved_memorials(user_id);


-- ┌─ 2. AUTH TRIGGER — auto-create profile row on signup ─────────────────────
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


-- ┌─ 3. ADMIN HELPER ─────────────────────────────────────────────────────────
-- security definer → bypasses RLS on profiles → safe to call from policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;


-- ┌─ 4. RPC FUNCTIONS USED BY THE APP ────────────────────────────────────────

-- get_candle_counts → server-side GROUP BY for src/services/community.js
create or replace function public.get_candle_counts()
returns table (site_id bigint, count bigint)
language sql stable as $$
  select site_id, count(*)::bigint as count
  from   public.community_activities
  where  action_type = 'candle' and site_id is not null
  group  by site_id
$$;

-- get_memorials_in_bounds → bounding-box fetch for MapPage
create or replace function public.get_memorials_in_bounds(
  lat_min double precision, lat_max double precision,
  lng_min double precision, lng_max double precision
)
returns setof public.memorial_sites
language sql stable as $$
  select * from public.memorial_sites
  where  latitude  between lat_min and lat_max
    and  longitude between lng_min and lng_max
    and  status = 'approved'
$$;

-- truncate_seed_tables → full-refresh helper used by the dev seeders
create or replace function public.truncate_seed_tables()
returns void language plpgsql security definer as $$
begin
  if to_regclass('public.community_comments') is not null then
    execute 'truncate table public.community_comments restart identity cascade';
  end if;
  if to_regclass('public.community_posts') is not null then
    execute 'truncate table public.community_posts restart identity cascade';
  end if;
  if to_regclass('public.route_completions') is not null then
    execute 'truncate table public.route_completions restart identity cascade';
  end if;
  if to_regclass('public.saved_routes') is not null then
    execute 'truncate table public.saved_routes restart identity cascade';
  end if;
  if to_regclass('public.saved_memorials') is not null then
    execute 'truncate table public.saved_memorials restart identity cascade';
  end if;
  truncate table public.route_waypoints      restart identity cascade;
  truncate table public.site_galleries       restart identity cascade;
  truncate table public.community_activities restart identity cascade;
  truncate table public.routes               restart identity cascade;
  truncate table public.memorial_sites       restart identity cascade;
  -- profiles intentionally NOT truncated (FK to auth.users + handled by signup).
end;
$$;


-- ┌─ 5. ROW LEVEL SECURITY ───────────────────────────────────────────────────
-- Strategy:
--   • Public reads only what is meant to be public (approved sites/routes,
--     community feed, gallery images, profile names for joins).
--   • A logged-in user can read their OWN pending submissions (so the form
--     "thank-you" flow can still navigate to the row if needed).
--   • Authenticated users insert their own pending submissions only.
--   • Saves/completions are strictly owner-only.
--   • Admins (profiles.is_admin = true) can read pending & approve/reject.

-- ── memorial_sites ───────────────────────────────────────────────────────────
alter table public.memorial_sites enable row level security;
drop policy if exists ms_public_read       on public.memorial_sites;
drop policy if exists ms_insert_own_pending on public.memorial_sites;
drop policy if exists ms_admin_update      on public.memorial_sites;
drop policy if exists ms_owner_update_pending on public.memorial_sites;
drop policy if exists ms_delete_owner_or_admin on public.memorial_sites;
create policy ms_public_read on public.memorial_sites
  for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy ms_insert_own_pending on public.memorial_sites
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy ms_admin_update on public.memorial_sites
  for update using (public.is_admin()) with check (public.is_admin());
-- Owners may edit their OWN submissions — but only while still pending
-- (once approved, only admin may change the row).
create policy ms_owner_update_pending on public.memorial_sites
  for update using (user_id = auth.uid() and status = 'pending')
       with check (user_id = auth.uid() and status = 'pending');
create policy ms_delete_owner_or_admin on public.memorial_sites
  for delete using (public.is_admin() or user_id = auth.uid());

-- ── routes ──────────────────────────────────────────────────────────────────
alter table public.routes enable row level security;
drop policy if exists rt_public_read       on public.routes;
drop policy if exists rt_insert_own_pending on public.routes;
drop policy if exists rt_admin_update      on public.routes;
drop policy if exists rt_owner_update_pending on public.routes;
drop policy if exists rt_delete_owner_or_admin on public.routes;
create policy rt_public_read on public.routes
  for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy rt_insert_own_pending on public.routes
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy rt_admin_update on public.routes
  for update using (public.is_admin()) with check (public.is_admin());
-- Owners may edit their OWN routes while still pending.
create policy rt_owner_update_pending on public.routes
  for update using (user_id = auth.uid() and status = 'pending')
       with check (user_id = auth.uid() and status = 'pending');
create policy rt_delete_owner_or_admin on public.routes
  for delete using (public.is_admin() or user_id = auth.uid());

-- ── route_waypoints (public read; admin writes) ─────────────────────────────
alter table public.route_waypoints enable row level security;
drop policy if exists rw_public_read on public.route_waypoints;
drop policy if exists rw_admin_write on public.route_waypoints;
create policy rw_public_read on public.route_waypoints for select using (true);
create policy rw_admin_write on public.route_waypoints
  for all using (public.is_admin()) with check (public.is_admin());

-- ── site_galleries (public read; authenticated insert via addMemorial) ─────
alter table public.site_galleries enable row level security;
drop policy if exists sg_public_read         on public.site_galleries;
drop policy if exists sg_authenticated_insert on public.site_galleries;
drop policy if exists sg_admin_write         on public.site_galleries;
create policy sg_public_read on public.site_galleries for select using (true);
create policy sg_authenticated_insert on public.site_galleries
  for insert to authenticated with check (true);
create policy sg_admin_write on public.site_galleries
  for all using (public.is_admin()) with check (public.is_admin());

-- ── profiles (public read for name/avatar joins; user manages OWN row) ─────
alter table public.profiles enable row level security;
drop policy if exists pr_public_read on public.profiles;
drop policy if exists pr_insert_own  on public.profiles;
drop policy if exists pr_update_own  on public.profiles;
create policy pr_public_read on public.profiles for select using (true);
create policy pr_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy pr_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── community_activities (public feed; anon may light candles) ─────────────
alter table public.community_activities enable row level security;
drop policy if exists ca_public_read on public.community_activities;
drop policy if exists ca_open_insert on public.community_activities;
create policy ca_public_read on public.community_activities for select using (true);
create policy ca_open_insert on public.community_activities for insert with check (true);

-- ── saved_routes — strictly owner-only ──────────────────────────────────────
alter table public.saved_routes enable row level security;
drop policy if exists sr_own_all on public.saved_routes;
create policy sr_own_all on public.saved_routes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── saved_memorials — strictly owner-only ───────────────────────────────────
alter table public.saved_memorials enable row level security;
drop policy if exists sm_own_all on public.saved_memorials;
create policy sm_own_all on public.saved_memorials
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── route_completions — strictly owner-only ─────────────────────────────────
alter table public.route_completions enable row level security;
drop policy if exists rc_own_all on public.route_completions;
create policy rc_own_all on public.route_completions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── community_posts / comments (future-ready: public read, authored writes) ──
alter table public.community_posts enable row level security;
drop policy if exists cp_public_read   on public.community_posts;
drop policy if exists cp_authored_insert on public.community_posts;
drop policy if exists cp_author_update on public.community_posts;
drop policy if exists cp_author_delete on public.community_posts;
create policy cp_public_read on public.community_posts for select using (true);
create policy cp_authored_insert on public.community_posts
  for insert to authenticated with check (author_id = auth.uid());
create policy cp_author_update on public.community_posts
  for update using (author_id = auth.uid() or public.is_admin())
       with check (author_id = auth.uid() or public.is_admin());
create policy cp_author_delete on public.community_posts
  for delete using (author_id = auth.uid() or public.is_admin());

alter table public.community_comments enable row level security;
drop policy if exists cc_public_read   on public.community_comments;
drop policy if exists cc_authored_insert on public.community_comments;
drop policy if exists cc_author_delete on public.community_comments;
create policy cc_public_read on public.community_comments for select using (true);
create policy cc_authored_insert on public.community_comments
  for insert to authenticated with check (author_id = auth.uid());
create policy cc_author_delete on public.community_comments
  for delete using (author_id = auth.uid() or public.is_admin());


-- ┌─ 6. STORAGE BUCKET + STORAGE POLICIES ─────────────────────────────────────
-- Ensure 'images' bucket exists and is public-readable. The bucket holds the
-- cover & gallery uploads from AddPointPage.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Storage RLS lives on storage.objects.
drop policy if exists images_public_read       on storage.objects;
drop policy if exists images_authed_insert     on storage.objects;
drop policy if exists images_owner_update      on storage.objects;
drop policy if exists images_owner_delete      on storage.objects;
create policy images_public_read on storage.objects
  for select using (bucket_id = 'images');
create policy images_authed_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'images');
create policy images_owner_update on storage.objects
  for update using (bucket_id = 'images' and owner = auth.uid())
       with check (bucket_id = 'images');
create policy images_owner_delete on storage.objects
  for delete using (bucket_id = 'images' and (owner = auth.uid() or public.is_admin()));


-- ┌─ 7. GRANT ADMIN  ←  EDIT THE EMAIL IF NEEDED  ─────────────────────────────
-- Sets is_admin=true for the designated email IF a user with that email is
-- already signed up. Run this AFTER you have signed up at least once.
update public.profiles
   set is_admin = true
 where id in (
   select id from auth.users
   where email = 'galtenne25@gmail.com'   -- 👈 change / add emails here
 );


-- ════════════════════════════════════════════════════════════════════════════
--  Done. Verify in the SQL Editor:
--    select id, status, user_id from memorial_sites limit 5;
--    select id, status, region from routes limit 5;
--    select email, p.is_admin from auth.users u join profiles p on p.id = u.id;
-- ════════════════════════════════════════════════════════════════════════════
