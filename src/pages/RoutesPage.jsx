import { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import SearchBar from '../components/common/SearchBar'
import SectionHeader from '../components/common/SectionHeader'
import FilterChip from '../components/common/FilterChip'
import FilterSheet from '../components/common/FilterSheet'
import FeaturedRouteCard from '../components/routes/FeaturedRouteCard'
import RouteListItem from '../components/routes/RouteListItem'
import { useApp, ROUTE_FILTER_GROUPS } from '../contexts/AppContext'

function RoutesSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 bg-white p-3 rounded-2xl border border-slate-100 animate-pulse">
          <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-2 justify-center">
            <div className="w-3/4 h-4 bg-slate-200 rounded-full" />
            <div className="w-1/2 h-3 bg-slate-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Flat list of chips built from the facet groups. "הכל" resets every facet.
function buildChips() {
  const chips = [{ id: 'all', facet: null, value: null, label: 'הכל' }]
  for (const g of ROUTE_FILTER_GROUPS) {
    for (const opt of g.options) {
      chips.push({ id: `${g.key}:${opt.value}`, facet: g.key, value: opt.value, label: opt.label })
    }
  }
  return chips
}
const CHIPS = buildChips()

/**
 * Horizontally-scrollable filter-chip bar with edge arrows that render ONLY
 * when the content overflows (Task 6). Smooth scroll via scrollBy.
 */
function ScrollableChipBar({ children }) {
  const ref = useRef(null)
  const [overflow, setOverflow] = useState(false)
  const [atStart,  setAtStart ] = useState(true)
  const [atEnd,    setAtEnd   ] = useState(false)

  const recompute = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setOverflow(max > 4)
    // RTL scrollLeft is negative in Chrome/FF, positive in Safari → use abs.
    const pos = Math.abs(el.scrollLeft)
    setAtStart(pos <= 4)
    setAtEnd(pos >= max - 4)
  }, [])

  useLayoutEffect(() => { recompute() }, [recompute])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [recompute])

  const scrollByDir = dir => {
    // In RTL, the visual "right" arrow moves toward the start (positive offset
    // in the negative-scrollLeft model). scrollBy with a signed delta + smooth
    // behaviour handles clamping for us.
    ref.current?.scrollBy({ left: dir * 160, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {overflow && !atStart && (
        <button
          type="button"
          aria-label="גלול ימינה"
          onClick={() => scrollByDir(1)}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10
                     w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-md
                     flex items-center justify-center text-slate-600
                     hover:bg-white active:scale-90 transition-all"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      )}

      <div
        ref={ref}
        onScroll={recompute}
        className="flex flex-row-reverse gap-2 px-4 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {children}
      </div>

      {overflow && !atEnd && (
        <button
          type="button"
          aria-label="גלול שמאלה"
          onClick={() => scrollByDir(-1)}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10
                     w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-md
                     flex items-center justify-center text-slate-600
                     hover:bg-white active:scale-90 transition-all"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

export default function RoutesPage() {
  const navigate = useNavigate()
  const {
    filteredRoutes, routesLoading, routesError,
    routeFilters, setRouteFilter, resetRouteFilters,
    routesQuery, setRoutesQuery,
  } = useApp()
  const [filterOpen, setFilterOpen] = useState(false)

  const activeFilterCount = Object.values(routeFilters).filter(v => v !== 'all').length
  const noFiltersActive   = activeFilterCount === 0
  const featuredRoutes    = filteredRoutes.filter(r => r.featured)

  const isChipActive = chip =>
    chip.id === 'all' ? noFiltersActive : routeFilters[chip.facet] === chip.value

  const onChipClick = chip =>
    chip.id === 'all' ? resetRouteFilters() : setRouteFilter(chip.facet, chip.value)

  return (
    <div className="flex flex-col gap-4 pb-6" dir="rtl">

      <div className="px-4 pt-3">
        <SearchBar
          value={routesQuery}
          onChange={e => setRoutesQuery(e.target.value)}
          placeholder="חיפוש מסלול, חטיבה, אזור..."
          onFilterClick={() => setFilterOpen(true)}
          filterCount={activeFilterCount}
        />
      </div>

      <ScrollableChipBar>
        {CHIPS.map(chip => (
          <FilterChip
            key={chip.id}
            label={chip.label}
            active={isChipActive(chip)}
            onClick={() => onChipClick(chip)}
          />
        ))}
      </ScrollableChipBar>

      {routesLoading ? (
        <RoutesSkeleton />
      ) : routesError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
          <span className="text-4xl">⚠️</span>
          <p className="text-base font-semibold text-slate-600">שגיאה בטעינת המסלולים</p>
          <p className="text-sm text-slate-400 text-center">{routesError}</p>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
          <span className="text-4xl">🗺️</span>
          <p className="text-base font-semibold text-slate-600">לא נמצאו מסלולים</p>
          <p className="text-sm text-slate-400 text-center">נסה לשנות את הסינון או החיפוש</p>
          {!noFiltersActive && (
            <button
              onClick={resetRouteFilters}
              className="mt-1 px-4 py-2 bg-olive-700 text-white text-sm font-semibold rounded-full
                         hover:bg-olive-800 active:scale-95 transition-all duration-150"
            >
              נקה סינון
            </button>
          )}
        </div>
      ) : (
        <>
          {featuredRoutes.length > 0 && (
            <section>
              <div className="px-4 mb-2.5">
                <SectionHeader title="מסלולים נבחרים" />
              </div>
              <div className="flex flex-row-reverse gap-3 px-4 overflow-x-auto scrollbar-hide">
                {featuredRoutes.map(route => (
                  <FeaturedRouteCard
                    key={route.id}
                    route={route}
                    onClick={() => navigate(`/routes/${route.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="px-4">
            <SectionHeader title={`כל המסלולים (${filteredRoutes.length})`} className="mb-3" />
            <div className="flex flex-col gap-3">
              {filteredRoutes.map(route => (
                <RouteListItem
                  key={route.id}
                  route={route}
                  onClick={() => navigate(`/routes/${route.id}`)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <div className="sticky bottom-4 z-30 flex justify-center pointer-events-none py-3">
        <button
          onClick={() => navigate('/add-route')}
          className="pointer-events-auto flex items-center gap-2
                     bg-olive-700 text-white font-semibold text-sm
                     px-5 py-3 rounded-full shadow-lg
                     hover:bg-olive-800 active:scale-95 transition-all duration-150"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>הוסף מסלול</span>
        </button>
      </div>

      <FilterSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        groups={ROUTE_FILTER_GROUPS}
        values={routeFilters}
        onChange={setRouteFilter}
        onReset={resetRouteFilters}
      />

    </div>
  )
}
