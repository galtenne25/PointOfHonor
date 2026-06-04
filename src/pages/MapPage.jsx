import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvent, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { Search, SlidersHorizontal, Plus, Navigation2, X, LocateFixed, Loader2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useToast } from '../contexts/ToastContext'
import FilterSheet from '../components/common/FilterSheet'

const ISRAEL_CENTER = [31.5, 35.0]
const DEFAULT_ZOOM  = 7

function buildPinIcon(label, active = false) {
  const fill = active ? '#4c5a28' : '#3b82f6'
  return L.divIcon({
    className: '',
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

function MapTapHandler({ onTap }) {
  useMapEvent('click', onTap)
  return null
}

// Exposes the Leaflet map instance to the parent (replaces the old
// document.querySelector('.leaflet-container')._leaflet_map hack).
function MapRefSetter({ mapRef }) {
  const map = useMap()
  useEffect(() => { mapRef.current = map }, [map, mapRef])
  return null
}

// Pulsing "you are here" marker (blue dot + animated ring).
function userLocationIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:22px;height:22px;">
        <div style="position:absolute;inset:0;border-radius:9999px;background:#3b82f6;opacity:.35;animation:locatePing 1.8s ease-out infinite;"></div>
        <div style="position:absolute;top:50%;left:50%;width:14px;height:14px;transform:translate(-50%,-50%);border-radius:9999px;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.45);"></div>
      </div>`,
    iconSize:   [22, 22],
    iconAnchor: [11, 11],
  })
}

export default function MapPage() {
  const navigate = useNavigate()
  const { sites, filteredMapSites, sitesLoading, mapChips, selectMapChip, memQuery, setMemQuery } = useApp()
  const toast = useToast()

  const [selectedSite, setSelectedSite] = useState(null)
  const [filterOpen,   setFilterOpen  ] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [locating,     setLocating    ] = useState(false)
  const mapRef = useRef(null)

  const handleLocate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      toast.error('הדפדפן אינו תומך באיתור מיקום')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setLocating(false)
        mapRef.current?.flyTo([loc.lat, loc.lng], 14, { duration: 1.2 })
      },
      err => {
        setLocating(false)
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'הגישה למיקום נדחתה. יש לאשר הרשאת מיקום בהגדרות הדפדפן.'
            : err.code === err.TIMEOUT
              ? 'איתור המיקום ארך זמן רב מדי. נסה/י שוב.'
              : 'לא ניתן לאתר את המיקום כעת. ודא/י שה-GPS פעיל.'
        toast.error(msg)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [toast])

  const handleMarkerClick = useCallback(site => {
    setSelectedSite(prev => (prev?.id === site.id ? null : site))
  }, [])

  const dismiss = useCallback(() => setSelectedSite(null), [])

  // Build icons for ALL sites; filter at render time using filteredMapSites
  const siteIcons = useMemo(
    () => sites.map((site, idx) => ({
      site,
      icon: buildPinIcon(idx + 1, selectedSite?.id === site.id),
    })),
    [sites, selectedSite?.id]
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
        <MapRefSetter mapRef={mapRef} />

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon()}
            interactive={false}
            keyboard={false}
            zIndexOffset={1000}
          />
        )}

        <MarkerClusterGroup chunkedLoading>
          {siteIcons
            .filter(({ site }) => filteredMapSites.some(fs => fs.id === site.id))
            .map(({ site, icon }) => (
              <Marker
                key={site.id}
                position={[site.coordinates.lat, site.coordinates.lng]}
                icon={icon}
                eventHandlers={{ click: () => handleMarkerClick(site) }}
              />
            ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* ── Loading overlay ── */}
      {sitesLoading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1001]
                        bg-white/90 backdrop-blur-sm rounded-full px-4 py-2
                        flex items-center gap-2 shadow-md">
          <Loader2 size={14} className="animate-spin text-olive-700" />
          <span className="text-xs font-medium text-slate-600">טוען אתרים...</span>
        </div>
      )}

      {/* ── Search bar overlay ── */}
      <div className="absolute top-3 right-3 left-3 z-[1000]">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-md">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={memQuery}
            onChange={e => setMemQuery(e.target.value)}
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

      {/* ── Category chips ── */}
      <div className="absolute top-[3.75rem] right-0 left-0 z-[1000]
                      flex flex-row-reverse gap-2 px-3 overflow-x-auto scrollbar-hide">
        {mapChips.map(chip => (
          <button
            key={chip.id}
            onClick={() => selectMapChip(chip.id)}
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
            <button
              onClick={dismiss}
              className="absolute top-2.5 left-3 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
            <img
              src={selectedSite.imageUrl}
              alt={selectedSite.name}
              className="w-[72px] h-[72px] rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 flex flex-col items-end">
              <p className="text-base font-bold text-slate-800 text-right leading-tight">
                {selectedSite.name}
              </p>
              <p className="text-xs text-slate-500 text-right mt-0.5">{selectedSite.hebrewDate}</p>
              <p className="text-xs text-slate-500 text-right">{selectedSite.gregorianDate}</p>
              <p className="text-xs text-slate-400 text-right">
                {selectedSite.location},&nbsp;{selectedSite.city?.split(',')[0]}
              </p>
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
                  onClick={() => {
                    const { lat, lng } = selectedSite.coordinates
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
                    dismiss()
                  }}
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

      {/* ── Locate Me FAB ── */}
      <button
        onClick={handleLocate}
        disabled={locating}
        aria-label="אתר את מיקומי"
        className="absolute right-4 bottom-24 z-[999] w-12 h-12 bg-white rounded-full shadow-lg
                   flex items-center justify-center text-olive-700
                   hover:bg-slate-50 active:scale-95 disabled:cursor-wait
                   transition-all"
      >
        {locating
          ? <Loader2 size={20} strokeWidth={2.5} className="animate-spin" />
          : <LocateFixed size={20} strokeWidth={2.5} />}
      </button>

      {/* ── Add Point FAB ── */}
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
