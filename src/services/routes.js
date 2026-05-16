import { supabase } from '../utils/supabase'

export const ROUTE_FILTER_CHIPS = [
  { id: 'nearby', label: 'בקרבת מקום',  emoji: null,  active: true  },
  { id: 'unit',   label: 'מורשת יחידה', emoji: '⚔️', active: false },
  { id: 'nature', label: 'טבע והנצחה',  emoji: '🌿', active: false },
  { id: 'region', label: 'לפי אזור',    emoji: '🗺️', active: false },
]

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

  return {
    id:            row.id,
    title:         row.title,
    duration:      row.duration,
    distance:      row.distance_km != null ? `${row.distance_km} ק"מ` : '',
    stops:         waypoints.length,
    difficulty:    row.difficulty,
    description:   row.description_short,
    imageUrl:      row.cover_image_url,
    mapImageUrl:   row.map_image_url,
    category:      row.category,
    startLocation: row.start_location,
    featured:      row.is_featured,
    waypoints,
  }
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
  return data.map(mapRoute)
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

  if (error) return null
  return mapRoute(data)
}

export function getRouteFilterChips() {
  return Promise.resolve(ROUTE_FILTER_CHIPS)
}
