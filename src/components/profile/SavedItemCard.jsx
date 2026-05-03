import { Bookmark } from 'lucide-react'

export default function SavedItemCard({ site, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3 items-center
                 cursor-pointer active:scale-[0.99] transition-transform duration-150"
    >
      {/* Bookmark icon — first in DOM → right side in RTL */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-olive-50 flex items-center justify-center">
        <Bookmark size={15} className="text-olive-700" strokeWidth={2} fill="#4c5a28" />
      </div>

      {/* Text — middle */}
      <div className="flex-1 min-w-0 flex flex-col items-end">
        <p className="text-sm font-bold text-slate-800 text-right leading-snug truncate w-full">
          {site.name}
        </p>
        <p className="text-xs text-slate-400 text-right mt-0.5">
          {site.location} · {site.city?.split(',')[0]}
        </p>
        <p className="text-xs text-olive-600 font-medium text-right mt-0.5">
          {site.hebrewDate}
        </p>
      </div>

      {/* Thumbnail — last in DOM → left side in RTL */}
      <img
        src={site.imageUrl}
        alt={site.name}
        loading="lazy"
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
      />
    </div>
  )
}
