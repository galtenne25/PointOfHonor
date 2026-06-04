import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/common/SearchBar'
import SectionHeader from '../components/common/SectionHeader'
import FilterChip from '../components/common/FilterChip'
import FilterSheet from '../components/common/FilterSheet'
import NearbyMemorialCard from '../components/memorials/NearbyMemorialCard'
import StoryCard from '../components/memorials/StoryCard'
import { useApp, SITE_FILTER_GROUPS } from '../contexts/AppContext'
import { ListSkeleton, EmptyState, ErrorState } from '../components/ui'
import { Flame } from 'lucide-react'

export default function MemorialsPage() {
  const navigate = useNavigate()
  const {
    filteredSites, sitesLoading, sitesError, memChips, selectMemChip, memQuery, setMemQuery,
    siteFilters, setSiteFilter, resetSiteFilters,
  } = useApp()
  const [filterOpen, setFilterOpen] = useState(false)
  const activeSiteFilterCount = Object.values(siteFilters).filter(v => v !== 'all').length

  return (
    <div className="flex flex-col gap-4 pb-6" dir="rtl">

      <div className="px-4 pt-3">
        <SearchBar
          value={memQuery}
          onChange={e => setMemQuery(e.target.value)}
          placeholder="חיפוש חלל, יחידה, או סיפור הנצחה..."
          onFilterClick={() => setFilterOpen(true)}
          filterCount={activeSiteFilterCount}
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
        <ListSkeleton count={4} />
      ) : sitesError ? (
        <ErrorState title="שגיאה בטעינת הנתונים" message={sitesError} />
      ) : filteredSites.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="לא נמצאו תוצאות"
          message="נסה לשנות את הסינון או את מילות החיפוש"
        />
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
        groups={SITE_FILTER_GROUPS}
        values={siteFilters}
        onChange={setSiteFilter}
        onReset={resetSiteFilters}
        title="סינון אתרים"
      />
    </div>
  )
}
