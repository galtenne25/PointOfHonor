import { routes } from '../data/routesData'

export const ROUTE_FILTER_CHIPS = [
  { id: 'nearby', label: 'בקרבת מקום',  emoji: null,  active: true  },
  { id: 'unit',   label: 'מורשת יחידה', emoji: '⚔️', active: false },
  { id: 'nature', label: 'טבע והנצחה',  emoji: '🌿', active: false },
  { id: 'region', label: 'לפי אזור',    emoji: '🗺️', active: false },
]

export function getRoutes() {
  return Promise.resolve([...routes])
}

export function getRouteById(id) {
  return Promise.resolve(routes.find(r => r.id === id) ?? null)
}

export function getRouteFilterChips() {
  return Promise.resolve(ROUTE_FILTER_CHIPS)
}
