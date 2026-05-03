import { memorialSites } from '../data/mockData'

export const FILTER_CHIPS = [
  { id: 'nearby',     label: 'בקרבת מקום',       emoji: null,  active: true  },
  { id: 'iron',       label: 'חרבות ברזל',         emoji: '⚔️',  active: false },
  { id: 'casualties', label: 'נפגעי פעולות איבה',  emoji: '🎗️', active: false },
]

export function getMemorials() {
  return Promise.resolve([...memorialSites])
}

export function getMemorialById(id) {
  return Promise.resolve(memorialSites.find(s => s.id === id) ?? null)
}

export function getFilterChips() {
  return Promise.resolve(FILTER_CHIPS)
}
