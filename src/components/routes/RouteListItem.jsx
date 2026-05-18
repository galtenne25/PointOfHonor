import { Clock, Bookmark } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

export default function RouteListItem({ route, onClick }) {
  const { savedRouteIds, toggleSavedRoute } = useApp()
  const saved = savedRouteIds.includes(route.id)

  return (
    <div
      onClick={onClick}
      className="relative bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3 items-start
                 cursor-pointer active:scale-[0.99] transition-transform duration-150"
    >
      <button
        type="button"
        onClick={e => { e.stopPropagation(); toggleSavedRoute(route.id) }}
        aria-label={saved ? 'הסר מהשמורים' : 'שמור מסלול'}
        aria-pressed={saved}
        className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center
                    transition-all active:scale-90
                    ${saved
                      ? 'bg-olive-50 text-olive-700'
                      : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
      >
        <Bookmark size={15} strokeWidth={2} fill={saved ? '#4c5a28' : 'none'} />
      </button>

      <img
        src={route.imageUrl}
        alt={route.title}
        loading="lazy"
        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
      />

      <div className="flex-1 min-w-0 flex flex-col items-end">
        <p className="text-sm font-bold text-slate-800 text-right leading-snug pe-9">
          {route.title}
        </p>
        <p className="text-xs text-slate-400 text-right mt-1 line-clamp-2 leading-relaxed">
          {route.description}
        </p>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-xs text-slate-400">{route.duration}</span>
          <Clock size={11} className="text-slate-400" />
        </div>
        <button
          onClick={e => { e.stopPropagation(); onClick?.() }}
          className="mt-2 bg-olive-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg
                     hover:bg-olive-800 active:scale-95 transition-all duration-150"
        >
          הצג מסלול
        </button>
      </div>
    </div>
  )
}
