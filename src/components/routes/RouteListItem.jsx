import { Clock } from 'lucide-react'

export default function RouteListItem({ route, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3 items-start
                 cursor-pointer active:scale-[0.99] transition-transform duration-150"
    >
      <img
        src={route.imageUrl}
        alt={route.title}
        loading="lazy"
        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
      />

      <div className="flex-1 min-w-0 flex flex-col items-end">
        <p className="text-sm font-bold text-slate-800 text-right leading-snug">
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
