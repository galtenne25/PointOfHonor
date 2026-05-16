import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { getMemorials, addMemorial as dbAddMemorial } from '../services/memorials'
import { getRoutes }                                   from '../services/routes'
import {
  getCandleCounts,
  insertCandleActivity,
  subscribeToActivityInserts,
} from '../services/community'

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

// ── Radio-chip hook ───────────────────────────────────────────────────────────
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
  // ── Remote data ──────────────────────────────────────────────────────────
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

  // ── Candle counts (DB-backed, server-side aggregation) ───────────────────
  const [candleCounts, setCandleCounts] = useState({})

  useEffect(() => {
    getCandleCounts()
      .then(setCandleCounts)
      .catch(() => {})
  }, [])

  // Tracks IDs of candle activities inserted by this client so the realtime
  // echo for our own inserts doesn't double-count the optimistic increment.
  const pendingCandleIds = useRef(new Set())

  // ── Realtime: candle count sync from other users ──────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeToActivityInserts(
      'rt-candle-counts',
      (payload) => {
        const { id, action_type, site_id } = payload.new
        if (action_type !== 'candle' || site_id == null) return

        if (pendingCandleIds.current.has(id)) {
          // Our own insert echoed back — already counted optimistically
          pendingCandleIds.current.delete(id)
          return
        }

        // Another user lit a candle — increment live
        setCandleCounts(prev => ({
          ...prev,
          [site_id]: (prev[site_id] ?? 0) + 1,
        }))
      }
    )
    return unsubscribe
  }, [])

  // ── UI state ──────────────────────────────────────────────────────────────
  const [memQuery,    setMemQuery   ] = useState('')
  const [routesQuery, setRoutesQuery] = useState('')

  const [mapChips,   selectMapChip  ] = useRadioChips(MAP_CHIPS_INIT)
  const [memChips,   selectMemChip  ] = useRadioChips(MEM_CHIPS_INIT)
  const [routeChips, selectRouteChip] = useRadioChips(ROUTE_CHIPS_INIT)

  // ── Write: add memorial ───────────────────────────────────────────────────
  const addMemorial = useCallback(async (formData) => {
    const newSite = await dbAddMemorial(formData)  // throws on any error; rollback handled in service
    setSites(prev => [newSite, ...prev])
    return newSite
  }, [])

  // ── Write: light a candle (optimistic + DB + realtime dedup) ─────────────
  const lightCandle = useCallback(async (siteId, siteName) => {
    // 1. Optimistic local increment for instant feedback
    setCandleCounts(prev => ({ ...prev, [siteId]: (prev[siteId] ?? 0) + 1 }))

    try {
      // 2. Persist to DB; returns the new row id
      const id = await insertCandleActivity(siteId, siteName)

      // 3. Register the id so the realtime subscription skips it
      pendingCandleIds.current.add(id)
    } catch {
      // 4. Roll back optimistic increment on failure
      setCandleCounts(prev => ({
        ...prev,
        [siteId]: Math.max(0, (prev[siteId] ?? 1) - 1),
      }))
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
