import { useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvent } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { Search, SlidersHorizontal, Plus, Navigation2, X } from 'lucide-react'
import { memorialSites } from '../data/mockData'
import useChips from '../hooks/useChips'
import FilterSheet from '../components/common/FilterSheet'

// ── Map constants ────────────────────────────────────────────────────────────
const ISRAEL_CENTER = [31.5, 35.0]
const DEFAULT_ZOOM  = 7

// ── Category filter chips ────────────────────────────────────────────────────
const INITIAL_CHIPS = [
  { id: 'trails',    label: 'מסלולי הליכה', emoji: null,  active: false },
  { id: 'monuments', label: 'אנדרטאות',     emoji: '🔥',  active: false },
  { id: 'lookouts',  label: 'מצפים',        emoji: '👁️', active: false },
  { id: 'springs',   label: 'מעיינות',      emoji: '💧',  active: true  },
]

// ── Custom map pin (teardrop + number) ───────────────────────────────────────
function buildPinIcon(label, active = false) {
  const fill = active ? '#4c5a28' : '#3b82f6'
  return L.divIcon({
    className: '',          // suppress leaflet-div-icon default styles
    html: `
      <div style="width:32px;height:40px;position:relative;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40"
             style="width:32px;height:40px;display:block;">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 10.667 16 24 16 24S32 26.667 32 16C32 7.163 24.837 0 16 0z"
                fill="${fill}"/>
          <circle cx="16" cy="16" r="6.5" fill="rgba(255,255,255,0.22)"/>
        </svg>
        <span style="
          position:absolute;top:6px;left:0;right:0;
          color:#fff;font-size:11px;font-weight:700;
          font-family:system-ui,sans-serif;text-align:center;line-height:1;
        ">${label}</span>
      </div>`,
    iconSize:   [32, 40],
    iconAnchor: [16, 40],
  })
}

// ── Dismisses the selected-site popup when the map background is tapped ──────
function MapTapHandler({ onTap }) {
  useMapEvent('click', onTap)
  return null
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MapPage() {
  const navigate = useNavigate()
  const [selectedSite, setSelectedSite] = useState(null)
  const [query,        setQuery       ] = useState('')
  const [filterOpen,   setFilterOpen  ] = useState(false)
  const [chips, toggleChip] = useChips(INITIAL_CHIPS)

  const handleMarkerClick = useCallback(site => {
    setSelectedSite(prev => (prev?.id === site.id ? null : site))
  }, [])

  const dismiss = useCallback(() => setSelectedSite(null), [])

  const filteredSites = useMemo(() => {
    if (!query.trim()) return memorialSites
    const q = query.trim().toLowerCase()
    return memorialSites.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q)
    )
  }, [query])

  const siteIcons = useMemo(
    () =>
      memorialSites.map((site, idx) => ({
        site,
        icon: buildPinIcon(idx + 1, selectedSite?.id === site.id),
      })),
    [selectedSite?.id]
  )

  return (
    <div className="relative h-full" dir="rtl">

      {/* ── Leaflet map ── */}
      <MapContainer
        center={ISRAEL_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapTapHandler onTap={dismiss} />

        {siteIcons
          .filter(({ site }) => filteredSites.some(fs => fs.id === site.id))
          .map(({ site, icon }) => (
            <Marker
              key={site.id}
              position={[site.coordinates.lat, site.coordinates.lng]}
              icon={icon}
              eventHandlers={{ click: () => handleMarkerClick(site) }}
            />
          ))}
      </MapContainer>

      {/* ── Search bar overlay ── */}
      <div className="absolute top-3 right-3 left-3 z-[1000]">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-md">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חיפוש קברים, אתרי הנצחה..."
            dir="rtl"
            className="flex-1 bg-transparent text-sm text-right text-slate-700 placeholder-slate-400 outline-none"
          />
          <button
            onClick={() => setFilterOpen(true)}
            className="flex-shrink-0 focus:outline-none"
            aria-label="פתח סינון"
          >
            <SlidersHorizontal size={16} className="text-olive-700" />
          </button>
        </div>
      </div>

      {/* ── Filter chips overlay ── */}
      <div className="absolute top-[3.75rem] right-0 left-0 z-[1000]
                      flex flex-row-reverse gap-2 px-3 overflow-x-auto scrollbar-hide">
        {chips.map(chip => (
          <button
            key={chip.id}
            onClick={() => toggleChip(chip.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              whitespace-nowrap shadow-sm transition-colors
              ${chip.active
                ? 'bg-olive-700 text-white'
                : 'bg-white text-slate-700 border border-slate-200'}
            `}
          >
            {chip.emoji && <span className="text-xs">{chip.emoji}</span>}
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* ── Site detail popup card ── */}
      <div
        className={`
          absolute left-3 right-3 z-[1000] bottom-24
          transition-all duration-300 ease-out
          ${selectedSite
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        {selectedSite && (
          <div className="bg-white rounded-2xl shadow-2xl p-3 flex gap-3 items-start">
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-2.5 left-3 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            {/* Thumbnail — first in DOM → right side in RTL flex */}
            <img
              src={selectedSite.imageUrl}
              alt={selectedSite.name}
              className="w-[72px] h-[72px] rounded-xl object-cover flex-shrink-0"
            />

            {/* Info — flex-1 → fills remaining space */}
            <div className="flex-1 min-w-0 flex flex-col items-end">
              <p className="text-base font-bold text-slate-800 text-right leading-tight">
                {selectedSite.name}
              </p>
              <p className="text-xs text-slate-500 text-right mt-0.5">
                {selectedSite.hebrewDate}
              </p>
              <p className="text-xs text-slate-500 text-right">
                {selectedSite.gregorianDate}
              </p>
              <p className="text-xs text-slate-400 text-right">
                {selectedSite.location},&nbsp;{selectedSite.city?.split(',')[0]}
              </p>

              {/* Action buttons */}
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => navigate(`/memorials/${selectedSite.id}`)}
                  className="flex items-center gap-1 border border-slate-300 text-slate-600
                             text-xs font-medium px-3 py-1.5 rounded-lg
                             hover:bg-slate-50 active:scale-95 transition-all duration-150"
                >
                  הצג פרטים
                </button>
                <button
                  onClick={dismiss}
                  className="flex items-center gap-1.5 bg-olive-700 text-white
                             text-xs font-semibold px-3 py-1.5 rounded-lg
                             hover:bg-olive-800 active:scale-95 transition-all duration-150"
                >
                  <Navigation2 size={11} strokeWidth={2} />
                  <span>נווט</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FAB — always visible above sticky bottom nav ── */}
      <div className="absolute left-0 right-0 bottom-4 z-[999] flex justify-center">
        <button
          onClick={() => navigate('/add-point')}
          className="flex items-center gap-2 bg-olive-700 text-white font-semibold text-sm
                     px-5 py-3 rounded-full shadow-lg
                     hover:bg-olive-800 active:scale-95 transition-all duration-150"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>הוסף נקודה</span>
        </button>
      </div>

      <FilterSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={() => {}}
      />
    </div>
  )
}
