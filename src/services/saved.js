import { supabase } from '../utils/supabase'

/**
 * Auth-backed user data: saved routes, route completions, contributions.
 *
 * All functions are NO-OPs when no userId is provided (logged-out state) —
 * the caller (AppContext) decides what to render in that case.
 *
 * Every read is resilient: if a table doesn't exist yet (the auth_rls.sql
 * migration hasn't been applied) we return empty defaults instead of
 * blowing up the app.
 */

const okOrEmpty = (table, error) =>
  error && (/Could not find the table/i.test(error.message) || error.code === 'PGRST205')
    ? { __missing: table } : null

// ── Saved routes ──────────────────────────────────────────────────────────────
export async function getSavedRouteIds(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('saved_routes')
    .select('route_id')
    .eq('user_id', userId)
  if (okOrEmpty('saved_routes', error)) return []
  if (error) throw error
  return data.map(r => r.route_id)
}

export async function addSavedRoute(userId, routeId) {
  if (!userId) throw new Error('יש להתחבר כדי לשמור מסלול')
  const { error } = await supabase
    .from('saved_routes')
    .insert({ user_id: userId, route_id: routeId })
  // unique-violation = already saved → not an error
  if (error && error.code !== '23505') throw error
}

export async function removeSavedRoute(userId, routeId) {
  if (!userId) return
  const { error } = await supabase
    .from('saved_routes')
    .delete()
    .eq('user_id', userId)
    .eq('route_id', routeId)
  if (error) throw error
}

// ── Route completions ─────────────────────────────────────────────────────────
export async function getCompletedRouteIds(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('route_completions')
    .select('route_id')
    .eq('user_id', userId)
  if (okOrEmpty('route_completions', error)) return []
  if (error) throw error
  return data.map(r => r.route_id)
}

export async function markRouteCompletedDB(userId, routeId) {
  if (!userId) throw new Error('יש להתחבר כדי לסמן מסלול שהושלם')
  const { error } = await supabase
    .from('route_completions')
    .insert({ user_id: userId, route_id: routeId })
  if (error && error.code !== '23505') throw error
}

// ── Contribution stats (for badges + Profile stat tiles) ──────────────────────
// Returns: { addedMemorials, addedRoutes, litCandle } — all derived from real
// rows owned by `userId`. Tolerant of missing user_id column or RLS quirks
// (returns zeros rather than throwing).
export async function getContributionStats(userId) {
  if (!userId) return { addedMemorials: 0, addedRoutes: 0, litCandle: false }

  const safeCount = async (table, filter) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    if (filter) q = filter(q)
    const { count, error } = await q
    if (error) return 0
    return count ?? 0
  }

  const [memCount, routeCount] = await Promise.all([
    safeCount('memorial_sites', q => q.eq('user_id', userId)),
    safeCount('routes',         q => q.eq('user_id', userId)),
  ])

  // litCandle: any candle/story activity by this user
  const { data: act } = await supabase
    .from('community_activities')
    .select('id')
    .eq('user_id', userId)
    .in('action_type', ['candle', 'story'])
    .limit(1)

  return {
    addedMemorials: memCount,
    addedRoutes:    routeCount,
    litCandle:      Array.isArray(act) && act.length > 0,
  }
}
