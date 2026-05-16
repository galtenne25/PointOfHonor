import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { memorialSites } from '../data/mockData'
import { routes } from '../data/routesData'

// ── Chip id → data category string ───────────────────────────────────────────
const CATEGORY = {
  iron:      'חרבות ברזל',
  six_days:  'מלחמת ששת הימים',
  hostility: 'נפגעי פעולות איבה',
  unit:      'מורשת יחידה',
  nature:    'טבע והנצחה',
}

const MAP_CHIPS_INIT = [
  { id: 'all',       label: 'הכל',        emoji: null,  active: true  },
  { id: 'iron',      label: 'חרבות ברזל', emoji: '⚔️',  active: false },
  { id: 'six_days',  label: 'ששת הימים',  emoji: '🏛️', active: false },
  { id: 'hostility', label: 'נפגעי איבה', emoji: '🎗️', active: false },
]

const MEM_CHIPS_INIT = [
  { id: 'all',       label: 'הכל',        emoji: null,  active: true  },
  { id: 'iron',      label: 'חרבות ברזל', emoji: '⚔️',  active: false },
  { id: 'six_days',  label: 'ששת הימים',  emoji: '🏛️', active: false },
  { id: 'hostility', label: 'נפגעי איבה', emoji: '🎗️', active: false },
]

const ROUTE_CHIPS_INIT = [
  { id: 'all',    label: 'הכל',         emoji: null,  active: true  },
  { id: 'unit',   label: 'מורשת יחידה', emoji: '🎖️', active: false },
  { id: 'nature', label: 'טבע והנצחה',  emoji: '🌿',  active: false },
]

// Candle counts per site id — seeded with realistic numbers
const INITIAL_CANDLES = { 1: 1247, 2: 831, 3: 2456, 4: 543, 5: 389 }

// ── Radio-chip hook: only one chip active at a time ───────────────────────────
function useRadioChips(init) {
  const [chips, setChips] = useState(init)

  const select = useCallback(id => {
    setChips(prev => {
      const isActive = prev.find(c => c.id === id)?.active
      // Clicking active chip or "all" → reset to "all"
      if (id === 'all' || isActive) {
        return prev.map(c => ({ ...c, active: c.id === 'all' }))
      }
      // Otherwise activate the clicked chip exclusively
      return prev.map(c => ({ ...c, active: c.id === id }))
    })
  }, [])

  return [chips, select]
}

// ── Filtering helpers ─────────────────────────────────────────────────────────
function applySiteFilters(sites, chips, query) {
  const active = chips.find(c => c.active && c.id !== 'all')
  let result = sites
  if (active && CATEGORY[active.id]) {
    result = result.filter(s => s.category === CATEGORY[active.id])
  }
  if (query.trim()) {
    const q = query.trim().toLowerCase()
    result = result.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.unit?.toLowerCase().includes(q) ||
      s.descriptionSnippet?.toLowerCase().includes(q)
    )
  }
  return result
}

function applyRouteFilters(list, chips, query) {
  const active = chips.find(c => c.active && c.id !== 'all')
  let result = list
  if (active && CATEGORY[active.id]) {
    result = result.filter(r => r.category === CATEGORY[active.id])
  }
  if (query.trim()) {
    const q = query.trim().toLowerCase()
    result = result.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.startLocation?.toLowerCase().includes(q)
    )
  }
  return result
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Shared search query for memorials (synced between Map + Memorials tabs)
  const [memQuery,    setMemQuery   ] = useState('')
  const [routesQuery, setRoutesQuery] = useState('')
  const [candleCounts, setCandleCounts] = useState(INITIAL_CANDLES)

  const [mapChips,   selectMapChip  ] = useRadioChips(MAP_CHIPS_INIT)
  const [memChips,   selectMemChip  ] = useRadioChips(MEM_CHIPS_INIT)
  const [routeChips, selectRouteChip] = useRadioChips(ROUTE_CHIPS_INIT)

  const lightCandle = useCallback(siteId => {
    setCandleCounts(prev => ({ ...prev, [siteId]: (prev[siteId] ?? 0) + 1 }))
  }, [])

  // Derived: filtered memorial list (Memorials page)
  const filteredSites = useMemo(
    () => applySiteFilters(memorialSites, memChips, memQuery),
    [memChips, memQuery]
  )

  // Derived: filtered memorial markers (Map page — uses mapChips)
  const filteredMapSites = useMemo(
    () => applySiteFilters(memorialSites, mapChips, memQuery),
    [mapChips, memQuery]
  )

  // Derived: filtered routes (Routes page)
  const filteredRoutes = useMemo(
    () => applyRouteFilters(routes, routeChips, routesQuery),
    [routeChips, routesQuery]
  )

  return (
    <AppContext.Provider value={{
      memQuery,      setMemQuery,
      routesQuery,   setRoutesQuery,
      mapChips,      selectMapChip,
      memChips,      selectMemChip,
      routeChips,    selectRouteChip,
      filteredSites,
      filteredMapSites,
      filteredRoutes,
      candleCounts,  lightCandle,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
