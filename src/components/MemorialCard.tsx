import { Navigation } from 'lucide-react'
import type { Memorial } from '../data/mockData'

/* ─── Horizontal "site" card used in the nearby scroll row ─── */
export function MemorialSiteCard({ memorial }: { memorial: Memorial }) {
  return (
    <div className="flex-shrink-0 w-48 rounded-2xl overflow-hidden bg-white shadow-md border border-slate-100 flex flex-col">
      <div className="relative h-28">
        <img
          src={memorial.imageUrl}
          alt={memorial.name}
          className="w-full h-full object-cover"
        />
        <span className="absolute bottom-2 start-2 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {memorial.distance}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
          {memorial.name}
        </p>
        <p className="text-[11px] text-slate-400 leading-snug line-clamp-1">
          {memorial.subtitle}
        </p>

        <button
          className="
            mt-auto flex items-center justify-center gap-1.5
            w-full py-1.5 rounded-xl
            bg-olive-600 hover:bg-olive-700 active:bg-olive-800
            text-white text-xs font-semibold
            transition-colors duration-150
          "
        >
          <Navigation size={13} strokeWidth={2.2} />
          נווט
        </button>
      </div>
    </div>
  )
}

/* ─── Vertical "story" card used in the recently-added list ─── */
export function MemorialStoryCard({ memorial }: { memorial: Memorial }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Portrait or monument thumbnail */}
        <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-100">
          <img
            src={memorial.soldierImageUrl ?? memorial.imageUrl}
            alt={memorial.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text block */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 leading-snug truncate">
            {memorial.name}
          </p>
          <p className="text-[11px] text-slate-500 leading-snug">
            {memorial.subtitle}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
            {memorial.description}
          </p>
        </div>
      </div>

      {/* Action row */}
      <div className="flex gap-2 px-3 pb-3">
        <button className="text-xs text-slate-500 border border-slate-200 rounded-xl px-4 py-1.5 hover:bg-slate-50 transition-colors">
          קרא עוד
        </button>
        <button
          className="
            flex items-center gap-1.5
            bg-olive-600 hover:bg-olive-700 active:bg-olive-800
            text-white text-xs font-semibold
            rounded-xl px-4 py-1.5
            transition-colors duration-150
          "
        >
          <Navigation size={12} strokeWidth={2.2} />
          נווט
        </button>
      </div>
    </div>
  )
}
