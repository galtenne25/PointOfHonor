import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WifiOff, AlertTriangle, ChevronUp, ChevronDown, MapPin, X } from 'lucide-react'
import { useActiveNavigation } from '../hooks/useActiveNavigation'
import { useRoute } from '../hooks/useRoute'

const FALLBACK_WAYPOINTS = [
  { name: 'עין צפרה',   dist: '0.4 ק"מ', done: true,  active: false },
  { name: 'חורבת שמע',  dist: '1.8 ק"מ', done: false, active: true  },
  { name: 'עמודי הסלע', dist: '3.2 ק"מ', done: false, active: false },
  { name: 'עין יקים',   dist: '5.0 ק"מ', done: false, active: false },
]

export default function ActiveNavigationPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const route    = useRoute(id)
  const { formattedTime, offRoute, setOffRoute, offline, setOffline } = useActiveNavigation()
  const [peekOpen, setPeekOpen] = useState(false)

  const waypoints = route?.waypoints?.length
    ? route.waypoints.map((wp, i) => ({
        name:   wp.name,
        dist:   `${((i + 1) * 0.8).toFixed(1)} ק"מ`,
        done:   false,
        active: i === 0,
      }))
    : FALLBACK_WAYPOINTS

  const nextWaypoint = waypoints.find(w => w.active) || waypoints.find(w => !w.done)

  return (
    <div dir="rtl" className="relative h-screen overflow-hidden bg-slate-800 flex justify-center">
      <div className="relative w-full max-w-md h-full overflow-hidden">

        {/* ── Map background ── */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(160deg, #c8d8b0 0%, #a8c090 25%, #88b070 50%, #a0b888 75%, #b8c8a0 100%)',
          }}
        >
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 700" preserveAspectRatio="xMidYMid slice">
            {/* Grid */}
            {[0,70,140,210,280,350,420,490,560,630,700].map(y => (
              <line key={`h${y}`} x1="0" y1={y} x2="360" y2={y} stroke="#2a4a1a" strokeWidth="0.5" opacity="0.15"/>
            ))}
            {[0,60,120,180,240,300,360].map(x => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="700" stroke="#2a4a1a" strokeWidth="0.5" opacity="0.15"/>
            ))}
            {/* Topo */}
            <ellipse cx="150" cy="200" rx="120" ry="70" fill="none" stroke="#3a6020" strokeWidth="1.5" opacity="0.2"/>
            <ellipse cx="150" cy="200" rx="90"  ry="50" fill="none" stroke="#3a6020" strokeWidth="1"   opacity="0.2"/>
            <ellipse cx="220" cy="420" rx="100" ry="60" fill="none" stroke="#3a6020" strokeWidth="1.5" opacity="0.2"/>
            {/* Route */}
            <path d="M180 600 Q160 500 150 400 Q140 300 170 210 Q190 150 200 90"
              fill="none" stroke="#4c5a28" strokeWidth="4" opacity="0.9"/>
            <path d="M180 600 Q160 500 150 400 Q140 300 170 210 Q190 150 200 90"
              fill="none" stroke="white" strokeWidth="2" strokeDasharray="8 6" opacity="0.6"/>
            {/* Waypoints */}
            <circle cx="180" cy="600" r="8" fill="#4c5a28" stroke="#4c5a28" strokeWidth="2"/>
            <path d="M176 600l3 3 5-5" stroke="white" strokeWidth="1.8" fill="none"/>
            <circle cx="150" cy="400" r="8" fill="#E87722" stroke="#4c5a28" strokeWidth="2"/>
            <circle cx="150" cy="400" r="4" fill="white"/>
            <circle cx="170" cy="210" r="8" fill="white" stroke="#4c5a28" strokeWidth="2"/>
            <circle cx="200" cy="90"  r="8" fill="white" stroke="#4c5a28" strokeWidth="2"/>
            {/* User location */}
            <circle cx="140" cy="350" r="16" fill="#4c5a28" opacity="0.15"/>
            <circle cx="140" cy="350" r="10" fill="#4c5a28" opacity="0.35"/>
            <circle cx="140" cy="350" r="6"  fill="#4c5a28"/>
            <circle cx="140" cy="350" r="3"  fill="white"/>
          </svg>
          <p className="absolute bottom-52 left-3 text-[9px] text-olive-800 opacity-60 font-mono">
            {route?.title || 'שביל המעיינות · נחל עמוד'}
          </p>
        </div>

        {/* ── Floating top bar ── */}
        <div className="absolute top-3 right-3 left-3 z-20 flex flex-col gap-2">

          {/* Offline banner */}
          {offline && (
            <div className="bg-slate-900/90 backdrop-blur-sm rounded-2xl px-4 py-2.5
                            flex items-center gap-3 border border-white/10">
              <button
                onClick={() => setOffline(false)}
                className="text-white/50 hover:text-white/80 flex-shrink-0"
              >
                <X size={14} strokeWidth={2} />
              </button>
              <WifiOff size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-300 font-medium flex-1 text-right">
                מצב לא מקוון · המפה שמורה במכשיר
              </span>
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            </div>
          )}

          {/* Stats bar + End button */}
          <div className="bg-white/92 backdrop-blur-sm rounded-2xl px-4 py-3
                          flex items-center shadow-lg border border-white/80">
            {[
              { val: formattedTime, label: 'זמן'    },
              { val: '2.4 ק"מ',     label: 'מרחק'   },
              { val: '↑ 186m',      label: 'עלייה'  },
            ].map((s, i) => (
              <div key={i} className={`flex-1 text-center ${i < 2 ? 'border-l border-slate-200' : ''}`}>
                <p className="text-base font-bold text-slate-800">{s.val}</p>
                <p className="text-[10px] text-slate-400">{s.label}</p>
              </div>
            ))}
            <button
              onClick={() => navigate(-1)}
              className="mr-3 px-3.5 py-2 rounded-xl border-2 border-red-500 text-red-500
                         text-xs font-bold flex-shrink-0
                         hover:bg-red-50 active:scale-95 transition-all duration-150"
            >
              סיום
            </button>
          </div>
        </div>

        {/* ── Off-route warning ── */}
        {offRoute && (
          <div
            className="absolute right-3 left-3 z-20 rounded-2xl px-4 py-3
                       flex items-center gap-3 transition-all duration-300"
            style={{
              bottom:     peekOpen ? '14rem' : '7.5rem',
              background: 'rgba(234,88,12,0.95)',
              boxShadow:  '0 4px 20px rgba(234,88,12,0.4)',
              animation:  'wobble 0.4s ease-out',
            }}
          >
            <AlertTriangle size={22} className="text-white flex-shrink-0" strokeWidth={2.5} />
            <div className="flex-1">
              <p className="text-sm font-bold text-white text-right">שים לב: סטייה מהמסלול!</p>
              <p className="text-xs text-white/85 text-right mt-0.5">הנך 45 מטר מהמסלול המתוכנן</p>
            </div>
            <button
              onClick={() => setOffRoute(false)}
              className="px-3 py-1.5 rounded-xl border-2 border-white/80 bg-white/15
                         text-white text-xs font-bold flex-shrink-0
                         active:scale-95 transition-transform"
            >
              חזור למסלול
            </button>
          </div>
        )}

        {/* ── Peek bottom sheet ── */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">

            {/* Handle */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-0" />

            {/* Next waypoint row */}
            <button
              onClick={() => setPeekOpen(o => !o)}
              className="w-full flex items-center gap-3 px-5 py-3"
            >
              <div className="w-10 h-10 rounded-xl bg-olive-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-olive-700" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-slate-400 font-medium text-right">נקודת ציון הבאה</p>
                <p className="text-base font-bold text-slate-800 text-right">{nextWaypoint?.name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-olive-700">{nextWaypoint?.dist}</p>
                <p className="text-[10px] text-slate-400">~12 דקות</p>
              </div>
              {peekOpen
                ? <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                : <ChevronUp   size={16} className="text-slate-400 flex-shrink-0" />}
            </button>

            {/* Expanded waypoints */}
            {peekOpen && (
              <div className="px-5 pb-6 border-t border-slate-100">
                <p className="text-sm font-bold text-slate-800 py-3 text-right">כל עצירות המסלול</p>
                {waypoints.map((wp, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 py-2.5
                      ${i < waypoints.length - 1 ? 'border-b border-slate-100' : ''}
                      ${wp.done ? 'opacity-50' : ''}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2
                        ${wp.done   ? 'bg-olive-700 border-olive-700'
                        : wp.active ? 'bg-orange-500 border-orange-500'
                        : 'bg-slate-50 border-slate-200'}`}
                    >
                      {wp.done ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <span className={`text-[10px] font-bold ${wp.active ? 'text-white' : 'text-slate-400'}`}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <p className={`flex-1 text-sm text-right
                      ${wp.active ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                      {wp.name}
                    </p>
                    <p className={`text-xs ${wp.active ? 'text-orange-500 font-bold' : 'text-slate-400'}`}>
                      {wp.dist}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
