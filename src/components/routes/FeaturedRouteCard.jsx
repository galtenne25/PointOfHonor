import { Clock, MapPin, Dumbbell } from 'lucide-react'

const DIFFICULTY = {
  easy:   { label: 'קל',     color: 'text-emerald-600' },
  medium: { label: 'בינוני', color: 'text-amber-600'   },
  hard:   { label: 'קשה',    color: 'text-red-500'     },
}

export default function FeaturedRouteCard({ route, onClick }) {
  const diff = DIFFICULTY[route.difficulty] ?? { label: route.difficulty, color: 'text-slate-500' }

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-[268px] bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100
                 cursor-pointer active:scale-[0.98] transition-transform duration-150"
    >
      <img
        src={route.imageUrl}
        alt={route.title}
        loading="lazy"
        className="w-full h-44 object-cover"
      />

      <div className="p-3.5 flex flex-col gap-2">
        <h3 className="text-sm font-bold text-slate-800 text-right leading-snug line-clamp-2">
          {route.title}
        </h3>

        <div className="flex items-center gap-3 justify-end">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <span>{route.stops} נקודות</span>
            <MapPin size={11} className="text-olive-600 flex-shrink-0" />
          </span>
          <span className={`flex items-center gap-1 text-xs ${diff.color}`}>
            <span>{diff.label}</span>
            <Dumbbell size={11} className="flex-shrink-0" />
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <span>{route.duration}</span>
            <Clock size={11} className="text-slate-400 flex-shrink-0" />
          </span>
        </div>

        <p className="text-xs text-slate-400 text-right line-clamp-2 leading-relaxed">
          {route.description}
        </p>

        <button
          onClick={e => { e.stopPropagation(); onClick?.() }}
          className="mt-1 w-full bg-olive-700 text-white text-sm font-semibold py-2.5 rounded-xl
                     hover:bg-olive-800 active:scale-95 transition-all duration-150"
        >
          הצג מסלול
        </button>
      </div>
    </div>
  )
}
