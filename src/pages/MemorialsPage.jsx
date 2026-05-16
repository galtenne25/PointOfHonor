import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/common/SearchBar'
import SectionHeader from '../components/common/SectionHeader'
import FilterChip from '../components/common/FilterChip'
import FilterSheet from '../components/common/FilterSheet'
import NearbyMemorialCard from '../components/memorials/NearbyMemorialCard'
import StoryCard from '../components/memorials/StoryCard'
import { useApp } from '../contexts/AppContext'

function MemorialsSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 bg-white p-3 rounded-2xl border border-slate-100 animate-pulse">
          <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-2 justify-center">
            <div className="w-3/4 h-4 bg-slate-200 rounded-full" />
            <div className="w-1/2 h-3 bg-slate-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MemorialsPage() {
  const navigate = useNavigate()
  const { filteredSites, sitesLoading, sitesError, memChips, selectMemChip, memQuery, setMemQuery } = useApp()
  const [filterOpen, setFilterOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4 pb-6" dir="rtl">

      <div className="px-4 pt-3">
        <SearchBar
          value={memQuery}
          onChange={e => setMemQuery(e.target.value)}
          placeholder="חיפוש חלל, יחידה, או סיפור הנצחה..."
          onFilterClick={() => setFilterOpen(true)}
        />
      </div>

      <div className="flex flex-row-reverse gap-2 px-4 overflow-x-auto scrollbar-hide">
        {memChips.map(chip => (
          <FilterChip
            key={chip.id}
            label={chip.label}
            emoji={chip.emoji}
            active={chip.active}
            onClick={() => selectMemChip(chip.id)}
          />
        ))}
      </div>

      {sitesLoading ? (
        <MemorialsSkeleton />
      ) : sitesError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
          <span className="text-4xl">⚠️</span>
          <p className="text-base font-semibold text-slate-600">שגיאה בטעינת הנתונים</p>
          <p className="text-sm text-slate-400 text-center">{sitesError}</p>
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
          <span className="text-4xl">🕯️</span>
          <p className="text-base font-semibold text-slate-600">לא נמצאו תוצאות</p>
          <p className="text-sm text-slate-400">נסה לשנות את הסינון</p>
        </div>
      ) : (
        <>
          <section>
            <div className="px-4 mb-2.5">
              <SectionHeader title="אתרי הנצחה בסביבתך" />
            </div>
            <div className="flex flex-row-reverse gap-3 px-4 overflow-x-auto scrollbar-hide">
              {filteredSites.map(site => (
                <NearbyMemorialCard
                  key={site.id}
                  memorial={site}
                  onClick={() => navigate(`/memorials/${site.id}`)}
                />
              ))}
            </div>
          </section>

          <section className="px-4">
            <SectionHeader title="נוספו לאחרונה / סיפורי הנצחה" className="mb-3" />
            <div className="flex flex-col gap-3">
              {filteredSites.map(site => (
                <StoryCard
                  key={site.id}
                  memorial={site}
                  onClick={() => navigate(`/memorials/${site.id}`)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <FilterSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={() => {}}
      />
    </div>
  )
}
