-- ════════════════════════════════════════════════════════════════════════════
--  Nekudat Tziyon — Consolidated schema migration
--  Apply ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → paste → Run).
--
--  Why this file exists: the project's only credential is a PostgREST
--  service-role JWT. PostgREST is data-plane only and cannot run DDL
--  (CREATE/ALTER/CREATE FUNCTION). There is no Postgres connection string,
--  no `pg` driver, and npm install is blocked by a corporate CA. So schema
--  changes must be applied here. Everything in this file is IDEMPOTENT —
--  safe to run repeatedly.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Column fixes ──────────────────────────────────────────────────────────
ALTER TABLE memorial_sites
  ADD COLUMN IF NOT EXISTS dedicated_to TEXT;

-- Moderation: user submissions enter as 'pending' and are hidden from the app
-- until approved. Existing rows are backfilled to 'approved' so nothing the
-- seeders created disappears.
ALTER TABLE memorial_sites
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
UPDATE memorial_sites SET status = 'approved' WHERE status IS NULL;
CREATE INDEX IF NOT EXISTS idx_memorial_status ON memorial_sites(status);

-- Same moderation flow for user-submitted routes, plus explicit filter facets
-- (region / water / type) so a submitter's choices are stored exactly rather
-- than keyword-guessed. Existing seeded routes leave these NULL and the app
-- falls back to deriving them from text.
ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS region     TEXT;
ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS has_water  BOOLEAN;
ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS route_type TEXT;
UPDATE routes SET status = 'approved' WHERE status IS NULL;
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);

-- The live frontend (src/services/community.js → insertCandleActivity, and
-- AppContext realtime) reads/writes community_activities.site_id, but the
-- column was never created — so candle counts are silently broken. Add it.
ALTER TABLE community_activities
  ADD COLUMN IF NOT EXISTS site_id BIGINT REFERENCES memorial_sites(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_activities_site ON community_activities(site_id);

-- profiles has no bio / avatar_url columns — add them so richer user data
-- (requested for the seeder) has somewhere to live.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio        TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ── 2. RPC: server-side candle aggregation ───────────────────────────────────
--      Called by src/services/community.js → getCandleCounts(). Without this
--      the live app's candle counts silently fail (error is swallowed).
CREATE OR REPLACE FUNCTION get_candle_counts()
RETURNS TABLE (site_id BIGINT, count BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT site_id, COUNT(*)::BIGINT AS count
  FROM   community_activities
  WHERE  action_type = 'candle' AND site_id IS NOT NULL
  GROUP  BY site_id
$$;

-- ── 3. RPC: full-refresh truncate used by the seeders ────────────────────────
CREATE OR REPLACE FUNCTION truncate_seed_tables()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Child / dependent tables first. IF-EXISTS guards keep this safe on a
  -- DB where the optional community tables were never created.
  IF to_regclass('public.community_comments') IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE community_comments RESTART IDENTITY CASCADE';
  END IF;
  IF to_regclass('public.community_posts') IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE community_posts RESTART IDENTITY CASCADE';
  END IF;
  IF to_regclass('public.saved_routes') IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE saved_routes RESTART IDENTITY CASCADE';
  END IF;
  IF to_regclass('public.saved_memorials') IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE saved_memorials RESTART IDENTITY CASCADE';
  END IF;
  TRUNCATE TABLE route_waypoints      RESTART IDENTITY CASCADE;
  TRUNCATE TABLE site_galleries       RESTART IDENTITY CASCADE;
  TRUNCATE TABLE community_activities  RESTART IDENTITY CASCADE;
  TRUNCATE TABLE routes               RESTART IDENTITY CASCADE;
  TRUNCATE TABLE memorial_sites       RESTART IDENTITY CASCADE;
  -- profiles intentionally NOT truncated here (community_activities.user_id
  -- references it; seeders manage profiles explicitly).
END;
$$;

-- ── 4. RPC: PostGIS-free bounding-box fetch (stub used by memorials.js) ───────
CREATE OR REPLACE FUNCTION get_memorials_in_bounds(
  lat_min DOUBLE PRECISION, lat_max DOUBLE PRECISION,
  lng_min DOUBLE PRECISION, lng_max DOUBLE PRECISION
)
RETURNS SETOF memorial_sites
LANGUAGE sql STABLE AS $$
  SELECT * FROM memorial_sites
  WHERE  latitude  BETWEEN lat_min AND lat_max
    AND  longitude BETWEEN lng_min AND lng_max
$$;

-- ── 5. Optional community tables (NOT referenced by current frontend, but
--      requested for future features). FKs guarantee relational integrity.
CREATE TABLE IF NOT EXISTS community_posts (
  id          BIGSERIAL PRIMARY KEY,
  author_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  route_id    BIGINT REFERENCES routes(id)         ON DELETE SET NULL,
  site_id     BIGINT REFERENCES memorial_sites(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  post_type   TEXT NOT NULL DEFAULT 'experience',
  like_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_comments (
  id          BIGSERIAL PRIMARY KEY,
  post_id     BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_routes (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id    BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, route_id)
);

CREATE TABLE IF NOT EXISTS saved_memorials (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  site_id     BIGINT NOT NULL REFERENCES memorial_sites(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_comments_post     ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_posts_author      ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_saved_routes_user ON saved_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_mem_user    ON saved_memorials(user_id);

-- ── 6. RLS: allow public (anon/publishable key) READ so the app sees the data;
--      writes are done by the seeder with the service-role key (bypasses RLS).
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['community_posts','community_comments','saved_routes','saved_memorials']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I', t || '_public_read', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (true)', t || '_public_read', t);
  END LOOP;
END $$;

-- Done. Re-runnable any time.
