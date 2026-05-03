import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import SearchBar from '../components/common/SearchBar'
import SectionHeader from '../components/common/SectionHeader'
import FilterChip from '../components/common/FilterChip'
import FeaturedRouteCard from '../components/routes/FeaturedRouteCard'
import RouteListItem from '../components/routes/RouteListItem'
import { routes } from '../data/routesData'
import { ROUTE_FILTER_CHIPS } from '../services/routes'
import useChips from '../hooks/useChips'

export default function RoutesPage() {
  const navigate = useNavigate()
  const [chips, toggleChip] = useChips(ROUTE_FILTER_CHIPS)
  const [query, setQuery] = useState('')

  const filteredRoutes = useMemo(() => {
    let result = routes
    const activeNonNearby = chips.filter(c => c.id !== 'nearby' && c.active)
    if (activeNonNearby.length > 0) {
      const labels = activeNonNearby.map(c => c.label)
      result = result.filter(r => labels.includes(r.category))
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
  }, [chips, query])

  const featuredRoutes = filteredRoutes.filter(r => r.featured)
  const natureRoutes   = filteredRoutes.filter(r => r.category === 'טבע והנצחה')

  return (
    <div className="flex flex-col gap-4 pb-6" dir="rtl">

      <div className="px-4 pt-3">
        <SearchBar
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="חיפוש מסלול, חטיבה, אזור..."
        />
      </div>

      <div className="flex flex-row-reverse gap-2 px-4 overflow-x-auto scrollbar-hide">
        {chips.map(chip => (
          <FilterChip
            key={chip.id}
            label={chip.label}
            emoji={chip.emoji}
            active={chip.active}
            onClick={() => toggleChip(chip.id)}
          />
        ))}
      </div>

      {filteredRoutes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
          <span className="text-4xl">🗺️</span>
          <p className="text-base font-semibold text-slate-600">לא נמצאו מסלולים</p>
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

          {natureRoutes.length > 0 && (
            <section className="px-4">
              <SectionHeader title="מסלולי הנצחה וטבע" className="mb-3" />
              <div className="flex flex-col gap-3">
                {natureRoutes.map(route => (
                  <RouteListItem
                    key={route.id}
                    route={route}
                    onClick={() => navigate(`/routes/${route.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="sticky bottom-4 z-30 flex justify-center pointer-events-none py-3">
        <button
          onClick={() => navigate('/add-point')}
          className="pointer-events-auto flex items-center gap-2
                     bg-olive-700 text-white font-semibold text-sm
                     px-5 py-3 rounded-full shadow-lg
                     hover:bg-olive-800 active:scale-95 transition-all duration-150"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>הוסף נקודה</span>
        </button>
      </div>

    </div>
  )
}
