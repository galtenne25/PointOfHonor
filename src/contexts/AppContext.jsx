import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { getMemorials, addMemorial as dbAddMemorial } from '../services/memorials'
import { getRoutes, addRoute as dbAddRoute }           from '../services/routes'
import {
  getCandleCounts,
  insertCandleActivity,
  subscribeToActivityInserts,
} from '../services/community'
import {
  getSavedRouteIds, addSavedRoute, removeSavedRoute,
  getCompletedRouteIds, markRouteCompletedDB,
  getContributionStats,
} from '../services/saved'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

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

// ── Site filter facets (the "advanced" sheet on Map + Memorials) ─────────────
// Complements the category chip-bar; covers facets the chips don't: broad
// region (derived from latitude) and site type (the DB `location_type`).
export const SITE_FILTER_GROUPS = [
  {
    key: 'region', title: 'אזור',
    options: [
      { value: 'north',  label: 'צפון' },
      { value: 'center', label: 'מרכז' },
      { value: 'south',  label: 'דרום' },
    ],
  },
  {
    key: 'type', title: 'סוג אתר',
    options: [
      { value: 'אנדרטה', label: 'אנדרטה' },
      { value: 'תצפית',  label: 'תצפית'  },
      { value: 'חניון',  label: 'חניון'  },
    ],
  },
]

const SITE_FILTERS_INIT = { region: 'all', type: 'all' }

// Broad north/center/south bucket from latitude (sites have no region column).
function deriveSiteRegion(lat) {
  if (lat == null) return 'center'
  if (lat >= 32.5) return 'north'
  if (lat >= 31.5) return 'center'
  return 'south'
}

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

const EMPTY_PROGRESS = {
  savedRouteIds: [], completedRouteIds: [], addedMemorials: 0, addedRoutes: 0, litCandle: false,
}

// ── Filtering helpers ─────────────────────────────────────────────────────────
function applySiteFilters(sites, chips, query, filters = SITE_FILTERS_INIT) {
  const active = chips.find(c => c.active && c.id !== 'all')
  let result = sites
  if (active && CATEGORY[active.id]) {
    result = result.filter(s => s.category === CATEGORY[active.id])
  }
  // Advanced facets from the FilterSheet (region derived from lat; type = location_type).
  if (filters.region !== 'all') result = result.filter(s => deriveSiteRegion(s.coordinates?.lat) === filters.region)
  if (filters.type   !== 'all') result = result.filter(s => s.location === filters.type)
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

// Rejects if `p` doesn't settle within `ms`. A finally() can't clear the
// loading flag on a promise that never resolves (e.g. a hung Supabase request),
// so we force a rejection that the .catch()/.finally() can act on.
const withTimeout = (p, ms, msg) => Promise.race([
  p,
  new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
])

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Auth gate must resolve BEFORE we hit Supabase — anon reads are no longer
  // supported by our RLS, so we wait for `user.id` instead of firing on mount.
  const { user, loading: authLoading } = useAuth()

  // ── Remote data ──────────────────────────────────────────────────────────
  const [sites,         setSites        ] = useState([])
  const [routes,        setRoutes       ] = useState([])
  const [sitesLoading,  setSitesLoading ] = useState(true)
  const [routesLoading, setRoutesLoading] = useState(true)
  const [sitesError,    setSitesError   ] = useState(null)
  const [routesError,   setRoutesError  ] = useState(null)

  // Extracted into a callback so the Map page's error overlay can offer a
  // "retry" button that re-triggers the exact same load.
  const reloadSites = useCallback(() => {
    if (authLoading) return                       // still resolving the session
    if (!user)        { setSites([]);  setSitesLoading(false);  return }
    setSitesLoading(true); setSitesError(null)
    withTimeout(getMemorials(), 12000, 'טעינת אתרי ההנצחה נתקעה. בדוק/י חיבור ונסה/י שוב.')
      .then(setSites)
      .catch(err => setSitesError(err.message ?? 'שגיאה בטעינת אתרי הנצחה'))
      .finally(() => setSitesLoading(false))
  }, [authLoading, user?.id])

  useEffect(() => { reloadSites() }, [reloadSites])

  useEffect(() => {
    if (authLoading) return
    if (!user)        { setRoutes([]); setRoutesLoading(false); return }
    setRoutesLoading(true); setRoutesError(null)
    withTimeout(getRoutes(), 12000, 'טעינת המסלולים נתקעה. בדוק/י חיבור ונסה/י שוב.')
      .then(setRoutes)
      .catch(err => setRoutesError(err.message ?? 'שגיאה בטעינת מסלולים'))
      .finally(() => setRoutesLoading(false))
  }, [authLoading, user?.id])

  // ── Candle counts (DB-backed, server-side aggregation) ───────────────────
  const [candleCounts, setCandleCounts] = useState({})

  useEffect(() => {
    if (authLoading || !user) return
    getCandleCounts()
      .then(setCandleCounts)
      .catch(() => {})
  }, [authLoading, user?.id])

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

  // ── Site filters (Map + Memorials advanced sheet) — same toggle semantics ──
  const [siteFilters, setSiteFilters] = useState(SITE_FILTERS_INIT)
  const setSiteFilter = useCallback((key, value) => {
    setSiteFilters(prev => ({ ...prev, [key]: prev[key] === value ? 'all' : value }))
  }, [])
  const resetSiteFilters = useCallback(() => setSiteFilters(SITE_FILTERS_INIT), [])

  // ── Per-user progress (auth-backed) — saves, completions, contributions ──
  // (`user` is already destructured at the top of the provider; we just need
  // the toast helper here.)
  const toast     = useToast()
  const [progress,        setProgress       ] = useState(EMPTY_PROGRESS)
  const [progressLoading, setProgressLoading] = useState(false)

  // Reload whenever the user changes (login / logout / switch)
  useEffect(() => {
    if (!user) { setProgress(EMPTY_PROGRESS); return }
    let cancelled = false
    setProgressLoading(true)
    Promise.all([
      getSavedRouteIds(user.id),
      getCompletedRouteIds(user.id),
      getContributionStats(user.id),
    ])
      .then(([savedIds, completedIds, stats]) => {
        if (cancelled) return
        setProgress({
          savedRouteIds:      savedIds,
          completedRouteIds:  completedIds,
          addedMemorials:     stats.addedMemorials,
          addedRoutes:        stats.addedRoutes,
          litCandle:          stats.litCandle,
        })
      })
      .catch(() => { /* RLS / network — leave empty */ })
      .finally(() => { if (!cancelled) setProgressLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  const toggleSavedRoute = useCallback(async (id) => {
    if (!user) { toast.info('יש להתחבר כדי לשמור מסלולים'); return }
    const isSaved = progress.savedRouteIds.includes(id)
    setProgress(p => ({
      ...p,
      savedRouteIds: isSaved
        ? p.savedRouteIds.filter(x => x !== id)
        : [...p.savedRouteIds, id],
    }))
    try {
      if (isSaved) await removeSavedRoute(user.id, id)
      else         await addSavedRoute(user.id, id)
    } catch {
      // rollback on failure
      setProgress(p => ({
        ...p,
        savedRouteIds: isSaved
          ? [...p.savedRouteIds, id]
          : p.savedRouteIds.filter(x => x !== id),
      }))
      toast.error('שמירת המסלול נכשלה')
    }
  }, [user, progress.savedRouteIds, toast])

  const markRouteCompleted = useCallback(async (id) => {
    if (!user) { toast.info('יש להתחבר כדי לסמן מסלולים'); return }
    if (progress.completedRouteIds.includes(id)) return
    setProgress(p => ({ ...p, completedRouteIds: [...p.completedRouteIds, id] }))
    try {
      await markRouteCompletedDB(user.id, id)
    } catch {
      setProgress(p => ({ ...p, completedRouteIds: p.completedRouteIds.filter(x => x !== id) }))
      toast.error('סימון השלמת המסלול נכשל')
    }
  }, [user, progress.completedRouteIds, toast])

  // ── Write: add memorial ───────────────────────────────────────────────────
  // New submissions are created with status 'pending' and must NOT appear on
  // the map/lists until a moderator approves them — so we deliberately do not
  // add the row to `sites`. We do record it for the "Memory Keeper" badge.
  const addMemorial = useCallback(async (formData) => {
    const newSite = await dbAddMemorial(formData)  // throws on any error; rollback handled in service
    setProgress(p => ({ ...p, addedMemorials: p.addedMemorials + 1 }))
    return newSite
  }, [])

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
      setProgress(p => (p.litCandle ? p : { ...p, litCandle: true }))
    } catch {
      // 5. Roll back optimistic increment on failure
      setCandleCounts(prev => ({
        ...prev,
        [siteId]: Math.max(0, (prev[siteId] ?? 1) - 1),
      }))
    }
  }, [])

  // ── Derived: filtered lists ───────────────────────────────────────────────
  const filteredSites = useMemo(
    () => applySiteFilters(sites, memChips, memQuery, siteFilters),
    [sites, memChips, memQuery, siteFilters]
  )

  const filteredMapSites = useMemo(
    () => applySiteFilters(sites, mapChips, memQuery, siteFilters),
    [sites, mapChips, memQuery, siteFilters]
  )

  const filteredRoutes = useMemo(
    () => applyRouteFilters(routes, routeFilters, routesQuery),
    [routes, routeFilters, routesQuery]
  )

  // Saved routes resolved against the loaded routes list
  const savedRoutes = useMemo(
    () => routes.filter(r => progress.savedRouteIds.includes(r.id)),
    [routes, progress.savedRouteIds]
  )

  return (
    <AppContext.Provider value={{
      // data
      sites,          routes,
      sitesLoading,   routesLoading,
      sitesError,     routesError,
      reloadSites,
      // search
      memQuery,       setMemQuery,
      routesQuery,    setRoutesQuery,
      // chips
      mapChips,       selectMapChip,
      memChips,       selectMemChip,
      // route filters
      routeFilters,   setRouteFilter,   resetRouteFilters,
      // site filters (advanced sheet on Map + Memorials)
      siteFilters,    setSiteFilter,    resetSiteFilters,
      // derived
      filteredSites,
      filteredMapSites,
      filteredRoutes,
      // candles
      candleCounts,
      lightCandle,
      // saves / progress / badges (auth-backed; empty when logged out)
      savedRoutes,
      savedRouteIds:     progress.savedRouteIds,
      toggleSavedRoute,
      completedRouteIds: progress.completedRouteIds,
      markRouteCompleted,
      progress,
      progressLoading,
      // Kept under the old name for backwards-compatible consumers (ProfilePage,
      // BADGES.test functions) that read `userProgress.{addedMemorials,litCandle}`.
      userProgress: progress,
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
