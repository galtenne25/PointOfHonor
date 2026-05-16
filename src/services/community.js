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
  if (days    === 1) return 'אתמול'
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

export async function getCommunityActivities(limit = 30) {
  const { data, error } = await supabase
    .from('community_activities')
    .select('*, profiles(full_name, initials, avatar_color)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data.map(mapActivity)
}

// ── Returns { [siteId]: count } for all candle activities ─────────────────────
export async function getCandleCounts() {
  const { data, error } = await supabase
    .from('community_activities')
    .select('site_id')
    .eq('action_type', 'candle')

  if (error) throw error

  return (data ?? []).reduce((acc, row) => {
    if (row.site_id != null) {
      acc[row.site_id] = (acc[row.site_id] ?? 0) + 1
    }
    return acc
  }, {})
}

// ── Insert a candle activity; user_id is null until auth is wired up ──────────
export async function insertCandleActivity(siteId, siteName) {
  const { error } = await supabase
    .from('community_activities')
    .insert({
      action_type: 'candle',
      site_id:     siteId,
      target_name: siteName,
      user_id:     null,
    })

  if (error) throw error
}
