import { Navigation, MapPin } from 'lucide-react'
import type { Memorial } from '../data/mockData'

// ─── Shared nav button ────────────────────────────────────────────────────────

function NavButton({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const cls =
    size === 'sm'
      ? 'text-xs px-3 py-1.5 gap-1'
      : 'text-xs px-4 py-1.5 gap-1.5'
  return (
    <button
      className={`
        flex items-center justify-center font-semibold rounded-xl
        bg-olive-600 hover:bg-olive-700 active:bg-olive-800
        text-white transition-colors duration-150 ${cls}
      `}
    >
      <Navigation size={size === 'sm' ? 11 : 13} strokeWidth={2.3} />
      נווט
    </button>
  )
}

// ─── NearbyMemorialCard ───────────────────────────────────────────────────────
// Used in the horizontal "אתרי הנצחה בסביבתך" scroll row.
// Resembles a Google Maps place card: image on top, details below.

export function NearbyMemorialCard({ memorial }: { memorial: Memorial }) {
  return (
    <article className="flex-shrink-0 w-44 rounded-2xl overflow-hidden bg-white shadow-md border border-slate-100 flex flex-col">
      {/* ── Image ── */}
      <div className="relative h-28 overflow-hidden">
        <img
          src={memorial.imageUrl}
          alt={memorial.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Type badge — top start corner (top-right in RTL) */}
        <span className="absolute top-2 end-2 bg-white/90 text-olive-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          {memorial.type}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
          {memorial.name}
        </p>

        {/* Distance row */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <MapPin size={11} strokeWidth={2} className="text-olive-500 flex-shrink-0" />
          <span>{memorial.distance} ממך</span>
        </div>

        <NavButton size="md" />
      </div>
    </article>
  )
}

// ─── StoryCard ────────────────────────────────────────────────────────────────
// Used in the vertical "נוספו לאחרונה / סיפורי הנצחה" list.
// Square portrait on the start side (right in RTL), text on the end side.

export function StoryCard({ memorial }: { memorial: Memorial }) {
  const thumb = memorial.soldierImageUrl ?? memorial.imageUrl

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* ── Content row ── */}
      <div className="flex gap-3 p-3">
        {/* Thumbnail — appears on the right in RTL because it's first in source order */}
        <div className="flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden bg-slate-100">
          <img
            src={thumb}
            alt={memorial.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Text — flows left of the thumbnail in RTL */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-1">
            {memorial.name} – <span className="font-semibold text-slate-600">{memorial.unit.split(',')[0]}</span>
          </p>
          <p className="text-[11px] text-slate-500 leading-snug">{memorial.date}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
            {memorial.descriptionSnippet}
          </p>
        </div>
      </div>

      {/* ── Action row ── */}
      <div className="flex items-center gap-2 px-3 pb-3">
        {/* "קרא עוד" — outline, placeholder for Phase 3 detail view */}
        <button className="text-xs text-slate-500 font-medium border border-slate-200 rounded-xl px-4 py-1.5 hover:bg-slate-50 transition-colors">
          קרא עוד
        </button>
        <NavButton size="sm" />
      </div>
    </article>
  )
}
