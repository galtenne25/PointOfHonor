import { supabase } from '../utils/supabase'

const ACTION_MAP = {
  candle: { action: 'הדליק/ה נר וירטואלי',  type: 'candle' },
  route:  { action: 'השלים/ה מסלול',         type: 'route'  },
  visit:  { action: 'ביקר/ה באתר',            type: 'visit'  },
  story:  { action: 'הוסיף/ה סיפור הנצחה',   type: 'story'  },
}

function relativeTime(iso) {
  const diff    = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1)  return 'עכשיו'
  if (minutes < 60) return `לפני ${minutes} דקות`
  const hours = Math.floor(minutes / 60)
  if (hours   < 24) return `לפני ${hours} שעות`
  const days  = Math.floor(hours / 24)
  if (days === 1)   return 'אתמול'
  return `לפני ${days} ימים`
}

function mapActivity(row) {
  const cfg     = ACTION_MAP[row.action_type] ?? { action: row.action_type, type: 'visit' }
  const profile = row.profiles ?? {}
  return {
    id:       row.id,
    initials: profile.initials     ?? '?',
    color:    profile.avatar_color ?? '#7B9E4A',
    name:     profile.full_name    ?? 'אנונימי',
    action:   cfg.action,
    site:     row.target_name,
    time:     relativeTime(row.created_at),
    type:     cfg.type,
  }
}

// ── Read: activity feed ───────────────────────────────────────────────────────
export async function getCommunityActivities(limit = 30) {
  const { data, error } = await supabase
    .from('community_activities')
    .select('*, profiles(full_name, initials, avatar_color)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data.map(mapActivity)
}

// Fetches one activity with its profile join; used by the realtime handler
// to hydrate a raw INSERT payload into the full UI shape.
export async function getActivityById(id) {
  const { data, error } = await supabase
    .from('community_activities')
    .select('*, profiles(full_name, initials, avatar_color)')
    .eq('id', id)
    .single()

  if (error) return null
  return mapActivity(data)
}

// ── Read: candle counts (server-side GROUP BY via RPC) ────────────────────────
// Requires the `get_candle_counts` SQL function to exist in Supabase.
export async function getCandleCounts() {
  const { data, error } = await supabase.rpc('get_candle_counts')
  if (error) throw error

  return (data ?? []).reduce((acc, row) => {
    acc[row.site_id] = Number(row.count)
    return acc
  }, {})
}

// ── Write: insert a candle activity; returns the new row's id ─────────────────
// user_id is null until auth is implemented.
export async function insertCandleActivity(siteId, siteName) {
  const { data, error } = await supabase
    .from('community_activities')
    .insert({
      action_type: 'candle',
      site_id:     siteId,
      target_name: siteName,
      user_id:     null,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id  // returned so AppContext can de-duplicate the realtime echo
}

// ── Realtime: subscribe to all community_activity INSERTs ─────────────────────
// Returns an unsubscribe function — call it in useEffect cleanup.
// `channelName` must be unique per subscription (caller's responsibility).
export function subscribeToActivityInserts(channelName, callback) {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'community_activities' },
      (payload) => { Promise.resolve(callback(payload)).catch(console.error) }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
