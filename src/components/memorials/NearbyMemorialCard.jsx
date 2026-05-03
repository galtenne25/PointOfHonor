import { Navigation2 } from 'lucide-react'

export default function NearbyMemorialCard({ memorial, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-40 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100
                 cursor-pointer active:scale-95 transition-transform duration-150"
    >
      <img
        src={memorial.imageUrl}
        alt={memorial.name}
        loading="lazy"
        className="w-full h-24 object-cover"
      />
      <div className="p-2.5">
        <p className="text-xs font-bold text-slate-800 text-right leading-tight line-clamp-2">
          {memorial.name}
        </p>
        <p className="text-xs text-slate-500 text-right mt-0.5">{memorial.distance} ממך</p>
        <p className="text-xs text-slate-400 text-right">{memorial.location}</p>
        <button
          onClick={e => e.stopPropagation()}
          className="mt-2 w-full flex items-center justify-center gap-1.5
                     bg-olive-700 text-white text-xs font-semibold py-1.5 rounded-lg
                     hover:bg-olive-800 active:scale-95 transition-all duration-150"
        >
          <Navigation2 size={11} />
          <span>נווט</span>
        </button>
      </div>
    </div>
  )
}
