import { supabase } from '../utils/supabase'
import { getCurrentUserId, requireUserId } from './session'

export const ROUTE_FILTER_CHIPS = [
  { id: 'nearby', label: 'בקרבת מקום',  emoji: null,  active: true  },
  { id: 'unit',   label: 'מורשת יחידה', emoji: '⚔️', active: false },
  { id: 'nature', label: 'טבע והנצחה',  emoji: '🌿', active: false },
  { id: 'region', label: 'לפי אזור',    emoji: '🗺️', active: false },
]

// ── Derived filter facets ─────────────────────────────────────────────────────
// The `routes` table has no region/water/type columns, so we derive these
// client-side from the data we do have (start_location, title, distance).
const NORTH_KEYS  = ['גולן', 'גליל', 'חולה', 'יזרעאל', 'כרמל', 'חיפה', 'כנרת', 'ירדן', 'חרמון', 'מטולה', 'צפת', 'עכו']
const SOUTH_KEYS  = ['נגב', 'עוטף', 'באר שבע', 'ערבה', 'אילת', 'מכתש', 'רמון', 'שדרות', 'אשקלון', 'דרום']
const WATER_KEYS  = ['כנרת', 'ירדן', 'חולה', 'חרמון', 'שניר', 'נחל', 'מעיין', 'אגם', 'חוף', 'ים', 'בריכ']
const LOOKOUT_KEYS = ['מצפה', 'תצפית', 'תצפ']

function deriveRegion(text = '') {
  if (NORTH_KEYS.some(k => text.includes(k))) return 'north'
  if (SOUTH_KEYS.some(k => text.includes(k))) return 'south'
  return 'center'
}

function deriveHasWater(text = '', region) {
  if (WATER_KEYS.some(k => text.includes(k))) return true
  // Northern heritage routes commonly run alongside streams/springs.
  return region === 'north'
}

function deriveRouteType(text = '', distanceKm = 0) {
  if (LOOKOUT_KEYS.some(k => text.includes(k))) return 'lookout'
  // A very short stop is, in practice, a lookout rather than a hiking trail.
  return distanceKm > 0 && distanceKm <= 2 ? 'lookout' : 'trail'
}

// Maps a DB row (+ joined waypoints) → the UI shape expected by components
function mapRoute(row) {
  const waypoints = (row.route_waypoints ?? [])
    .sort((a, b) => a.stop_order - b.stop_order)
    .map(wp => ({
      id:          wp.id,
      name:        wp.name,
      description: wp.description,
      imageUrl:    wp.image_url,
    }))

  const distanceKm = row.distance_km != null ? Number(row.distance_km) : 0
  const facetText  = `${row.title ?? ''} ${row.start_location ?? ''} ${row.description_short ?? ''}`

  // Prefer explicit columns (set by user submissions); fall back to deriving
  // from text for legacy/seeded rows that don't have these columns populated.
  const region    = row.region ?? deriveRegion(facetText)
  const hasWater  = typeof row.has_water === 'boolean'
    ? row.has_water
    : deriveHasWater(facetText, region)
  const routeType = row.route_type ?? deriveRouteType(facetText, distanceKm)

  return {
    id:            row.id,
    title:         row.title,
    duration:      row.duration,
    distance:      row.distance_km != null ? `${row.distance_km} ק"מ` : '',
    distanceKm,
    stops:         waypoints.length,
    difficulty:    row.difficulty,
    description:   row.description_short,
    imageUrl:      row.cover_image_url,
    mapImageUrl:   row.map_image_url,
    category:      row.category,
    startLocation: row.start_location,
    featured:      row.is_featured,
    status:        row.status ?? 'approved',
    region,                                              // 'north' | 'center' | 'south'
    hasWater,                                            // boolean
    routeType,                                           // 'lookout' | 'trail'
    waypoints,
  }
}

// A route is publicly visible only when approved — but if the column doesn't
// exist yet (status undefined/null) we fail open so the app never goes blank.
function isApprovedRoute(row) {
  return row.status == null || row.status === 'approved'
}

export async function getRoutes() {
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      route_waypoints ( id, name, description, image_url, stop_order )
    `)
    .order('id')

  if (error) throw error
  // Hide pending/rejected submissions until a moderator approves them.
  return data.filter(isApprovedRoute).map(mapRoute)
}

export async function getRouteById(id) {
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      route_waypoints ( id, name, description, image_url, stop_order )
    `)
    .eq('id', id)
    .single()

  if (error || !isApprovedRoute(data)) return null
  return mapRoute(data)
}

// Estimated duration in Hebrew, derived from length (hiking pace < 12 ק"מ,
// otherwise a driving/heritage pace) — keeps the format consistent with seeded
// routes (e.g. "3 שעות ו-20 דקות").
function estimateDurationHe(km) {
  const min = km < 12
    ? Math.round((km / 3.5) * 60) + 20
    : Math.round((km / 45)  * 60) + 30
  const h = Math.floor(min / 60), m = min % 60
  if (h === 0) return `${m} דקות`
  if (m === 0) return `${h} שעות`
  return `${h} שעות ו-${m} דקות`
}

const REGION_LABEL = { north: 'צפון הארץ', center: 'מרכז הארץ', south: 'דרום הארץ' }

// Inserts a user-submitted route as `status: 'pending'` so it stays hidden
// until moderated. Resilient: if the DB doesn't have the newer columns yet
// (status/region/has_water/route_type), the offending column is stripped and
// the insert is retried — so submissions never hard-fail.
export async function addRoute({
  title,
  description,
  region,
  lengthKm,
  hasWater,
  routeType,
  difficulty   = 'בינוני',
  startLocation = '',
}) {
  const distance_km = Math.max(0, Number(lengthKm) || 0)
  const slug = encodeURIComponent((title || 'route').slice(0, 40))

  // Attach the current user as owner so RLS lets the row through.
  const userId = await getCurrentUserId()

  let payload = {
    title:             title.trim(),
    description_short: description.trim().slice(0, 200),
    distance_km,
    duration:          estimateDurationHe(distance_km),
    difficulty,
    category:          routeType === 'lookout' ? 'טבע והנצחה' : 'מורשת יחידה',
    start_location:    startLocation.trim() || REGION_LABEL[region] || '',
    is_featured:       false,
    region,
    has_water:         !!hasWater,
    route_type:        routeType,
    status:            'pending',
    user_id:           userId,
    cover_image_url:   `https://picsum.photos/seed/nzroute-${slug}/1200/800`,
    map_image_url:     `https://picsum.photos/seed/nzroutemap-${slug}/900/600`,
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await supabase
      .from('routes')
      .insert(payload)
      .select('*')
      .single()

    if (!error) return mapRoute({ ...data, route_waypoints: [] })

    // Strip an unknown column (older schema) and retry.
    const m = (error.message || '').match(/Could not find the '([^']+)' column/i)
              || (error.message || '').match(/column "([^"]+)" of relation/i)
    if (m && m[1] in payload) {
      const { [m[1]]: _omit, ...rest } = payload
      payload = rest
      continue
    }
    throw error
  }
  throw new Error('שמירת המסלול נכשלה')
}

// ─────────────────────────────────────────────────────────────────────────────
//  Owner CRUD — the logged-in user managing their OWN pending submissions
// ─────────────────────────────────────────────────────────────────────────────

/** All routes owned by `userId` (any status, newest first). */
export async function getMyRoutes(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from('routes')
    .select('*, route_waypoints ( id, name, description, image_url, stop_order )')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapRoute)
}

/** Update an OWN pending route. Scoped to the live session user id on top of
 *  the owner-update RLS policy (`rt_owner_update_pending`) — defense in depth. */
export async function updateRouteOwn(id, patch) {
  const uid = await requireUserId()
  const distance_km = patch.lengthKm != null
    ? Math.max(0, Number(patch.lengthKm))
    : undefined

  const update = {
    ...(patch.title         !== undefined && { title: patch.title }),
    ...(patch.description   !== undefined && { description_short: patch.description.slice(0, 200) }),
    ...(distance_km !== undefined && {
      distance_km,
      duration: estimateDurationHe(distance_km),
    }),
    ...(patch.region        !== undefined && { region: patch.region }),
    ...(patch.hasWater      !== undefined && { has_water: !!patch.hasWater }),
    ...(patch.routeType     !== undefined && {
      route_type: patch.routeType,
      category: patch.routeType === 'lookout' ? 'טבע והנצחה' : 'מורשת יחידה',
    }),
    ...(patch.difficulty    !== undefined && { difficulty: patch.difficulty }),
    ...(patch.startLocation !== undefined && { start_location: patch.startLocation }),
  }

  const { data, error } = await supabase
    .from('routes')
    .update(update)
    .eq('id', id)
    .eq('user_id', uid)
    .select('*, route_waypoints ( id, name, description, image_url, stop_order )')
    .single()
  if (error) throw error
  return mapRoute(data)
}

/** Delete an OWN route. Scoped to the session user id on top of the
 *  owner-or-admin delete RLS policy. */
export async function deleteRouteOwn(id) {
  const uid = await requireUserId()
  const { error } = await supabase
    .from('routes')
    .delete()
    .eq('id', id)
    .eq('user_id', uid)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────────
//  Admin moderation
// ─────────────────────────────────────────────────────────────────────────────

/** Routes awaiting moderator approval (admin RLS required). */
export async function getPendingRoutes() {
  const { data, error } = await supabase
    .from('routes')
    .select('*, route_waypoints ( id, name, description, image_url, stop_order )')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(mapRoute)
}

export async function approveRoute(id) {
  const { error } = await supabase
    .from('routes')
    .update({ status: 'approved' })
    .eq('id', id)
  if (error) throw error
}

export async function rejectRoute(id) {
  const { error } = await supabase.from('routes').delete().eq('id', id)
  if (error) throw error
}

export function getRouteFilterChips() {
  return Promise.resolve(ROUTE_FILTER_CHIPS)
}
