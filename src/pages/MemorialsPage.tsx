import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { memorials } from '../data/mockData'
import { MemorialSiteCard, MemorialStoryCard } from '../components/MemorialCard'

const FILTER_CHIPS = [
  'בקרבת מקום',
  'חרבות ברזל',
  'נפגעי פעולות איבה',
  'אנדרטה',
  'מוזיאון',
]

export default function MemorialsPage() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('בקרבת מקום')

  const nearby = memorials.filter((m) => m.tags.includes('בקרבת מקום'))
  const recent = memorials.filter((m) => m.soldierImageUrl)

  const filtered = query.trim()
    ? memorials.filter(
        (m) =>
          m.name.includes(query) ||
          m.subtitle.includes(query) ||
          m.description.includes(query),
      )
    : null // null = not in search mode

  return (
    <div className="flex flex-col pb-4">
      {/* ── Search bar ── */}
      <div className="sticky top-0 z-30 bg-slate-50 px-4 pt-4 pb-3 border-b border-slate-100">
        <div className="relative flex items-center">
          <Search
            size={16}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='חיפוש חלל, יחידה, או סיפור הנצחה...'
            className="
              w-full bg-white border border-slate-200 rounded-2xl
              py-2.5 pe-9 ps-4
              text-sm text-slate-700 placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-olive-400 focus:border-transparent
              transition
            "
          />
          <button className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-olive-600 transition-colors">
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
          {FILTER_CHIPS.map((chip) => {
            const isActive = chip === activeFilter
            return (
              <button
                key={chip}
                onClick={() => setActiveFilter(chip)}
                className={`
                  flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full
                  border transition-colors duration-150 whitespace-nowrap
                  ${isActive
                    ? 'bg-olive-600 border-olive-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-olive-400 hover:text-olive-700'}
                `}
              >
                {chip === 'חרבות ברזל' && '⚔️ '}
                {chip === 'נפגעי פעולות איבה' && '🎗️ '}
                {chip}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Search results (only when query is active) ── */}
      {filtered !== null && (
        <section className="px-4 pt-5">
          <h2 className="text-base font-bold text-slate-700 mb-3">
            תוצאות חיפוש ({filtered.length})
          </h2>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">לא נמצאו תוצאות</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((m) => (
                <MemorialStoryCard key={m.id} memorial={m} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Normal mode ── */}
      {filtered === null && (
        <>
          {/* ── Nearby sites — horizontal scroll ── */}
          <section className="pt-5">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="text-base font-bold text-slate-700">
                אתרי הנצחה בסביבתך
              </h2>
              <button className="text-xs text-olive-600 font-semibold hover:underline">
                הצג הכל
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
              {nearby.map((m) => (
                <MemorialSiteCard key={m.id} memorial={m} />
              ))}
            </div>
          </section>

          {/* ── Recently added stories — vertical list ── */}
          <section className="px-4 pt-6">
            <h2 className="text-base font-bold text-slate-700 mb-3">
              נוספו לאחרונה / סיפורי הנצחה
            </h2>
            <div className="flex flex-col gap-3">
              {recent.map((m) => (
                <MemorialStoryCard key={m.id} memorial={m} />
              ))}
            </div>
          </section>

          {/* ── All memorials ── */}
          <section className="px-4 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-700">כל האתרים</h2>
              <button className="text-xs text-olive-600 font-semibold hover:underline">
                הצג הכל
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {memorials.map((m) => (
                <MemorialStoryCard key={m.id} memorial={m} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
