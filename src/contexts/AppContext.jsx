import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { getMemorials, addMemorial as dbAddMemorial } from '../services/memorials'
import { getRoutes }                                   from '../services/routes'
import { getCandleCounts, insertCandleActivity }       from '../services/community'

// ── Chip id → DB category string ─────────────────────────────────────────────
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

// ── Radio-chip hook: only one chip active at a time ───────────────────────────
function useRadioChips(init) {
  const [chips, setChips] = useState(init)

  const select = useCallback(id => {
    setChips(prev => {
      const isActive = prev.find(c => c.id === id)?.active
      if (id === 'all' || isActive) {
        return prev.map(c => ({ ...c, active: c.id === 'all' }))
      }
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
  // ── Remote data ──
  const [sites,         setSites        ] = useState([])
  const [routes,        setRoutes       ] = useState([])
  const [sitesLoading,  setSitesLoading ] = useState(true)
  const [routesLoading, setRoutesLoading] = useState(true)
  const [sitesError,    setSitesError   ] = useState(null)
  const [routesError,   setRoutesError  ] = useState(null)

  useEffect(() => {
    getMemorials()
      .then(setSites)
      .catch(err => setSitesError(err.message ?? 'שגיאה בטעינת אתרי הנצחה'))
      .finally(() => setSitesLoading(false))
  }, [])

  useEffect(() => {
    getRoutes()
      .then(setRoutes)
      .catch(err => setRoutesError(err.message ?? 'שגיאה בטעינת מסלולים'))
      .finally(() => setRoutesLoading(false))
  }, [])

  // ── Candle counts (DB-backed) ──
  const [candleCounts, setCandleCounts] = useState({})

  useEffect(() => {
    getCandleCounts()
      .then(setCandleCounts)
      .catch(() => {})
  }, [])

  // ── UI state ──
  const [memQuery,    setMemQuery   ] = useState('')
  const [routesQuery, setRoutesQuery] = useState('')

  const [mapChips,   selectMapChip  ] = useRadioChips(MAP_CHIPS_INIT)
  const [memChips,   selectMemChip  ] = useRadioChips(MEM_CHIPS_INIT)
  const [routeChips, selectRouteChip] = useRadioChips(ROUTE_CHIPS_INIT)

  // ── Write: add memorial ───────────────────────────────────────────────────
  const addMemorial = useCallback(async (formData) => {
    const newSite = await dbAddMemorial(formData)  // throws on error
    setSites(prev => [newSite, ...prev])
    return newSite
  }, [])

  // ── Write: light a candle ─────────────────────────────────────────────────
  const lightCandle = useCallback(async (siteId, siteName) => {
    // Optimistic local increment so the counter updates immediately
    setCandleCounts(prev => ({ ...prev, [siteId]: (prev[siteId] ?? 0) + 1 }))
    try {
      await insertCandleActivity(siteId, siteName)
    } catch {
      // Roll back optimistic update on failure
      setCandleCounts(prev => ({ ...prev, [siteId]: Math.max(0, (prev[siteId] ?? 1) - 1) }))
    }
  }, [])

  // ── Derived: filtered lists ───────────────────────────────────────────────
  const filteredSites = useMemo(
    () => applySiteFilters(sites, memChips, memQuery),
    [sites, memChips, memQuery]
  )

  const filteredMapSites = useMemo(
    () => applySiteFilters(sites, mapChips, memQuery),
    [sites, mapChips, memQuery]
  )

  const filteredRoutes = useMemo(
    () => applyRouteFilters(routes, routeChips, routesQuery),
    [routes, routeChips, routesQuery]
  )

  return (
    <AppContext.Provider value={{
      // data
      sites,          routes,
      sitesLoading,   routesLoading,
      sitesError,     routesError,
      // search
      memQuery,       setMemQuery,
      routesQuery,    setRoutesQuery,
      // chips
      mapChips,       selectMapChip,
      memChips,       selectMemChip,
      routeChips,     selectRouteChip,
      // derived
      filteredSites,
      filteredMapSites,
      filteredRoutes,
      // candles
      candleCounts,
      lightCandle,
      // write
      addMemorial,
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
