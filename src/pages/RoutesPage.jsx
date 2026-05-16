import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import SearchBar from '../components/common/SearchBar'
import SectionHeader from '../components/common/SectionHeader'
import FilterChip from '../components/common/FilterChip'
import FeaturedRouteCard from '../components/routes/FeaturedRouteCard'
import RouteListItem from '../components/routes/RouteListItem'
import { useApp } from '../contexts/AppContext'

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

export default function RoutesPage() {
  const navigate = useNavigate()
  const { filteredRoutes, routesLoading, routesError, routeChips, selectRouteChip, routesQuery, setRoutesQuery } = useApp()
  const [filterOpen, setFilterOpen] = useState(false)

  const featuredRoutes = filteredRoutes.filter(r => r.featured)
  const natureRoutes   = filteredRoutes.filter(r => r.category === 'טבע והנצחה')

  return (
    <div className="flex flex-col gap-4 pb-6" dir="rtl">

      <div className="px-4 pt-3">
        <SearchBar
          value={routesQuery}
          onChange={e => setRoutesQuery(e.target.value)}
          placeholder="חיפוש מסלול, חטיבה, אזור..."
        />
      </div>

      <div className="flex flex-row-reverse gap-2 px-4 overflow-x-auto scrollbar-hide">
        {routeChips.map(chip => (
          <FilterChip
            key={chip.id}
            label={chip.label}
            emoji={chip.emoji}
            active={chip.active}
            onClick={() => selectRouteChip(chip.id)}
          />
        ))}
      </div>

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
