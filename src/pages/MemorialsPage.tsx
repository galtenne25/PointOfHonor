import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { memorials } from '../data/mockData'
import FilterChip from '../components/FilterChip'
import { NearbyMemorialCard, StoryCard } from '../components/MemorialCard'

// ─── Filter chip definitions ──────────────────────────────────────────────────

const CHIPS = [
  { label: 'בקרבת מקום' },
  { label: 'חרבות ברזל',       emoji: '⚔️' },
  { label: 'נפגעי פעולות איבה', emoji: '🎗️' },
  { label: 'אנדרטה' },
  { label: 'מוזיאון' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemorialsPage() {
  const [query, setQuery]             = useState('')
  const [activeFilter, setActiveFilter] = useState('בקרבת מקום')

  // Nearby: tagged "בקרבת מקום", fed into the horizontal scroll row
  const nearby = memorials.filter((m) => m.tags.includes('בקרבת מקום'))

  // Stories: entries with a soldier portrait, used in the vertical list
  const stories = memorials.filter((m) => m.soldierImageUrl)

  // Live search results (only shown while the user is typing)
  const searchResults = query.trim()
    ? memorials.filter(
        (m) =>
          m.name.includes(query) ||
          m.unit.includes(query) ||
          m.descriptionSnippet.includes(query),
      )
    : null

  const isSearching = searchResults !== null

  return (
    <div className="flex flex-col">

      {/* ── Sticky header: search bar + filter chips ── */}
      <div className="sticky top-0 z-30 bg-slate-50 border-b border-slate-100 px-4 pt-4 pb-3 space-y-3">

        {/* Search input */}
        <div className="relative flex items-center">
          {/* Filter icon — logical start (visually right in RTL) */}
          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <SlidersHorizontal size={15} />
          </span>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש חלל, יחידה, או סיפור הנצחה..."
            className="
              w-full bg-white border border-slate-200 rounded-2xl
              py-2.5 pe-10 ps-10
              text-sm text-slate-700 placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-olive-400 focus:border-transparent
              transition
            "
          />

          {/* Search icon — logical end (visually left in RTL) */}
          <span className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search size={15} />
          </span>
        </div>

        {/* Filter chips — horizontal scroll, no scrollbar */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CHIPS.map(({ label, emoji }) => (
            <FilterChip
              key={label}
              label={label}
              emoji={emoji}
              isActive={label === activeFilter}
              onClick={() => setActiveFilter(label)}
            />
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SEARCH MODE — live results list
      ════════════════════════════════════════════════ */}
      {isSearching && (
        <section className="px-4 pt-5 pb-6 space-y-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
            תוצאות חיפוש ({searchResults!.length})
          </h2>

          {searchResults!.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Search size={32} strokeWidth={1.5} />
              <p className="text-sm">לא נמצאו תוצאות עבור "{query}"</p>
            </div>
          ) : (
            searchResults!.map((m) => <StoryCard key={m.id} memorial={m} />)
          )}
        </section>
      )}

      {/* ════════════════════════════════════════════════
          NORMAL MODE — two sections
      ════════════════════════════════════════════════ */}
      {!isSearching && (
        <>
          {/* ── Section 1: Nearby sites — horizontal scroll ── */}
          <section className="pt-5">
            <SectionHeader title="אתרי הנצחה בסביבתך" />

            {/* Horizontal scroll container — padding so cards don't clip on edges */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 pt-1">
              {nearby.map((m) => (
                <NearbyMemorialCard key={m.id} memorial={m} />
              ))}
            </div>
          </section>

          {/* ── Section 2: Recently added stories — vertical list ── */}
          <section className="px-4 pt-6 pb-6 space-y-3">
            <SectionHeader title="נוספו לאחרונה / סיפורי הנצחה" inline />
            {stories.map((m) => (
              <StoryCard key={m.id} memorial={m} />
            ))}
          </section>
        </>
      )}
    </div>
  )
}

// ─── Small helper ─────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  inline = false,
}: {
  title: string
  inline?: boolean
}) {
  const wrapper = inline
    ? 'flex items-center justify-between mb-3'
    : 'flex items-center justify-between px-4 mb-3'

  return (
    <div className={wrapper}>
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      <button className="text-xs font-semibold text-olive-600 hover:underline">
        הצג הכל
      </button>
    </div>
  )
}
