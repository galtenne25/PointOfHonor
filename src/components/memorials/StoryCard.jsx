import { Navigation2 } from 'lucide-react'

export default function StoryCard({ memorial, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3 items-start
                 cursor-pointer active:scale-[0.99] transition-transform duration-150"
    >
      <img
        src={memorial.imageUrl}
        alt={memorial.name}
        loading="lazy"
        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
      />

      <div className="flex-1 min-w-0 flex flex-col items-end">
        <p className="text-sm font-bold text-slate-800 text-right leading-snug">
          {memorial.name}
        </p>
        <p className="text-xs text-slate-500 text-right mt-0.5">
          {memorial.hebrewDate} | {memorial.gregorianDate}
        </p>
        <p className="text-xs text-slate-400 text-right mt-1 line-clamp-2 leading-relaxed">
          {memorial.descriptionSnippet}
        </p>

        <div className="flex gap-2 mt-2.5">
          <button
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 bg-olive-700 text-white text-xs font-semibold
                       px-3 py-1.5 rounded-lg hover:bg-olive-800 active:scale-95 transition-all duration-150"
          >
            <Navigation2 size={11} />
            <span>נווט</span>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onClick?.(e) }}
            className="flex items-center gap-1.5 border border-slate-300 text-slate-600 text-xs font-medium
                       px-3 py-1.5 rounded-lg hover:bg-slate-50 active:scale-95 transition-all duration-150"
          >
            <span>קרא עוד</span>
          </button>
        </div>
      </div>
    </div>
  )
}
