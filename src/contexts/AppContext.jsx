import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { getMemorials, addMemorial as dbAddMemorial } from '../services/memorials'
import { getRoutes, addRoute as dbAddRoute }           from '../services/routes'
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

// ── Route filter facets (shared by the chip bar + the FilterSheet) ───────────
export const ROUTE_FILTER_GROUPS = [
  {
    key: 'length', title: 'אורך המסלול',
    options: [
      { value: 'short', label: 'עד 3 ק"מ' },
      { value: 'mid',   label: '3-8 ק"מ'  },
      { value: 'long',  label: 'מעל 8 ק"מ' },
    ],
  },
  {
    key: 'region', title: 'אזור',
    options: [
      { value: 'north',  label: 'צפון' },
      { value: 'center', label: 'מרכז' },
      { value: 'south',  label: 'דרום' },
    ],
  },
  {
    key: 'type', title: 'סוג',
    options: [
      { value: 'lookout', label: 'מצפה'  },
      { value: 'trail',   label: 'מסלול' },
    ],
  },
  {
    key: 'water', title: 'מים',
    options: [
      { value: 'with',    label: 'עם מים'  },
      { value: 'without', label: 'ללא מים' },
    ],
  },
]

const ROUTE_FILTERS_INIT = { length: 'all', region: 'all', type: 'all', water: 'all' }

// ── Achievement badges (logic lives with the data it evaluates) ──────────────
export const BADGES = [
  { id: 'beginner', label: 'סייר מתחיל',   icon: '🧭', desc: 'השלמת מסלול אחד',          test: p => p.completedRouteIds.length >= 1 },
  { id: 'explorer', label: 'חורש הארץ',    icon: '🥾', desc: 'השלמת 5 מסלולים',          test: p => p.completedRouteIds.length >= 5 },
  { id: 'keeper',   label: 'שומר הזיכרון', icon: '🕊️', desc: 'הוספת אתר הנצחה למערכת',   test: p => p.addedMemorials >= 1 },
  { id: 'candle',   label: 'מדליק הנר',    icon: '🕯️', desc: 'הדלקת נר או הוספת סיפור',  test: p => p.litCandle },
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

// ── localStorage-backed state (the app has no auth → per-device persistence) ──
function usePersistentState(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw != null ? { ...initial, ...JSON.parse(raw) } : initial
    } catch { return initial }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* quota / private mode */ }
  }, [key, val])
  return [val, setVal]
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

function matchLength(km, sel) {
  if (sel === 'short') return km > 0 && km <= 3
  if (sel === 'mid')   return km > 3 && km <= 8
  if (sel === 'long')  return km > 8
  return true
}

function applyRouteFilters(list, filters, query) {
  let result = list
  if (filters.length !== 'all') result = result.filter(r => matchLength(r.distanceKm ?? 0, filters.length))
  if (filters.region !== 'all') result = result.filter(r => r.region === filters.region)
  if (filters.type   !== 'all') result = result.filter(r => r.routeType === filters.type)
  if (filters.water  !== 'all') result = result.filter(r => (filters.water === 'with' ? r.hasWater : !r.hasWater))
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

  const [mapChips, selectMapChip] = useRadioChips(MAP_CHIPS_INIT)
  const [memChips, selectMemChip] = useRadioChips(MEM_CHIPS_INIT)

  // ── Route filters (multi-facet; replaces the old radio chips) ─────────────
  const [routeFilters, setRouteFilters] = useState(ROUTE_FILTERS_INIT)

  // Toggle behaviour: re-selecting the active value clears that facet.
  const setRouteFilter = useCallback((key, value) => {
    setRouteFilters(prev => ({ ...prev, [key]: prev[key] === value ? 'all' : value }))
  }, [])
  const resetRouteFilters = useCallback(() => setRouteFilters(ROUTE_FILTERS_INIT), [])

  // ── Per-device user progress (no auth) — saves, completions, achievements ──
  const [userProgress, setUserProgress] = usePersistentState('ntz_progress', {
    savedRouteIds: [], completedRouteIds: [], addedMemorials: 0, litCandle: false,
  })

  const toggleSavedRoute = useCallback(id => {
    setUserProgress(p => ({
      ...p,
      savedRouteIds: p.savedRouteIds.includes(id)
        ? p.savedRouteIds.filter(x => x !== id)
        : [...p.savedRouteIds, id],
    }))
  }, [setUserProgress])

  const markRouteCompleted = useCallback(id => {
    setUserProgress(p => p.completedRouteIds.includes(id)
      ? p
      : { ...p, completedRouteIds: [...p.completedRouteIds, id] })
  }, [setUserProgress])

  // ── Write: add memorial ───────────────────────────────────────────────────
  // New submissions are created with status 'pending' and must NOT appear on
  // the map/lists until a moderator approves them — so we deliberately do not
  // add the row to `sites`. We do record it for the "Memory Keeper" badge.
  const addMemorial = useCallback(async (formData) => {
    const newSite = await dbAddMemorial(formData)  // throws on any error; rollback handled in service
    setUserProgress(p => ({ ...p, addedMemorials: p.addedMemorials + 1 }))
    return newSite
  }, [setUserProgress])

  // New routes are also created as 'pending' → intentionally NOT added to the
  // `routes` list until a moderator approves them.
  const addRoute = useCallback(async (formData) => {
    return dbAddRoute(formData)  // throws on error → surfaced to the form
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

      // 4. Unlock the "Candle Lighter" badge
      setUserProgress(p => (p.litCandle ? p : { ...p, litCandle: true }))
    } catch {
      // 5. Roll back optimistic increment on failure
      setCandleCounts(prev => ({
        ...prev,
        [siteId]: Math.max(0, (prev[siteId] ?? 1) - 1),
      }))
    }
  }, [setUserProgress])

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
    () => applyRouteFilters(routes, routeFilters, routesQuery),
    [routes, routeFilters, routesQuery]
  )

  // Saved routes resolved against the loaded routes list
  const savedRoutes = useMemo(
    () => routes.filter(r => userProgress.savedRouteIds.includes(r.id)),
    [routes, userProgress.savedRouteIds]
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
      // route filters
      routeFilters,   setRouteFilter,   resetRouteFilters,
      // derived
      filteredSites,
      filteredMapSites,
      filteredRoutes,
      // candles
      candleCounts,
      lightCandle,
      // saves / progress / badges
      savedRoutes,
      savedRouteIds:    userProgress.savedRouteIds,
      toggleSavedRoute,
      completedRouteIds: userProgress.completedRouteIds,
      markRouteCompleted,
      userProgress,
      // write
      addMemorial,
      addRoute,
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
