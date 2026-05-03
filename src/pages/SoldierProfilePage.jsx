import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, Navigation2, Share2, Flame, Flag } from 'lucide-react'
import { useMemorial } from '../hooks/useMemorial'
import CandleModal from '../components/common/CandleModal'
import ReportIssueSheet from '../components/common/ReportIssueSheet'

const TABS = [
  { id: 'bio',      label: 'ביוגרפיה'   },
  { id: 'legacy',   label: 'מורשת קרב'  },
  { id: 'gallery',  label: 'גלריה'       },
  { id: 'memorials', label: 'אתרי זיכרון' },
]

function NotFound({ onBack }) {
  return (
    <div
      dir="rtl"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center"
    >
      <span className="text-5xl">🕯️</span>
      <h2 className="text-xl font-bold text-slate-700">הפרופיל לא נמצא</h2>
      <button
        onClick={onBack}
        className="px-6 py-2.5 bg-olive-700 text-white text-sm font-semibold rounded-xl
                   active:scale-95 transition-transform"
      >
        חזרה
      </button>
    </div>
  )
}

export default function SoldierProfilePage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const memorial    = useMemorial(id)
  const [activeTab,  setActiveTab   ] = useState('bio')
  const [candleOpen, setCandleOpen  ] = useState(false)
  const [reportOpen, setReportOpen  ] = useState(false)

  if (!memorial) return <NotFound onBack={() => navigate(-1)} />

  const paragraphs = memorial.fullDescription.split('\n\n').filter(Boolean)

  function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: memorial.name, text: memorial.descriptionSnippet, url })
    } else {
      navigator.clipboard?.writeText(url)
    }
  }

  function handleNavigate() {
    const { lat, lng } = memorial.coordinates
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank')
  }

  return (
    <div dir="rtl" className="flex flex-col pb-8">

      {/* ── Hero ── */}
      <div className="relative">
        <img
          src={memorial.imageUrl}
          alt={memorial.name}
          className="w-full object-cover"
          style={{ height: 200 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <button
          onClick={() => navigate(-1)}
          aria-label="חזרה"
          className="absolute top-3 right-3 flex items-center gap-1
                     bg-white/80 backdrop-blur-sm text-slate-700
                     text-xs font-semibold px-3 py-1.5 rounded-full shadow
                     active:scale-95 transition-transform"
        >
          <ChevronRight size={13} strokeWidth={2.5} />
          <span>חזרה</span>
        </button>

        <div className="absolute bottom-3 right-4 left-4">
          <h1 className="text-xl font-bold text-white leading-snug">{memorial.name}</h1>
          <p className="text-xs text-white/80 mt-0.5">
            {memorial.hebrewDate} · {memorial.gregorianDate}
          </p>
        </div>
      </div>

      {/* ── Unit tags ── */}
      <div className="flex flex-wrap gap-2 px-4 pt-4 justify-end">
        {memorial.unit.split(',').map((part, i) => (
          <span
            key={i}
            className="px-2.5 py-1 bg-olive-100 text-olive-700 text-xs font-semibold rounded-full"
          >
            {part.trim()}
          </span>
        ))}
        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
          {memorial.city.split(',')[0]}
        </span>
      </div>

      {/* ── Candle count ── */}
      <div className="flex items-center justify-end gap-2 px-4 pt-3">
        <span className="text-xs text-amber-600 font-semibold">1,247 נרות הודלקו לזכרו</span>
        <span className="text-lg" style={{ animation: 'flicker 2s ease-in-out infinite' }}>🕯️</span>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex gap-2.5 px-4 pt-2">
        <button
          onClick={handleNavigate}
          className="flex-1 flex items-center justify-center gap-1.5
                     bg-olive-700 text-white text-sm font-semibold
                     py-2.5 rounded-xl shadow-sm
                     hover:bg-olive-800 active:scale-95 transition-all duration-150"
        >
          <Navigation2 size={15} strokeWidth={2} />
          <span>נווט</span>
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5
                     border border-slate-300 text-slate-700 text-sm font-medium
                     py-2.5 rounded-xl
                     hover:bg-slate-50 active:scale-95 transition-all duration-150"
        >
          <Share2 size={15} strokeWidth={2} />
          <span>שתף</span>
        </button>
        <button
          onClick={() => setCandleOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5
                     border border-slate-300 text-slate-700 text-sm font-medium
                     py-2.5 rounded-xl
                     hover:bg-slate-50 active:scale-95 transition-all duration-150"
        >
          <Flame size={15} strokeWidth={2} />
          <span>הדלקת נר</span>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-row-reverse border-b border-slate-200 mt-5 px-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors
              ${activeTab === tab.id
                ? 'text-olive-700 border-b-2 border-olive-700'
                : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 pt-4">
        {activeTab === 'bio' && (
          <div className="flex flex-col gap-3">
            {paragraphs.map((para, i) => (
              <p key={i} className="text-sm text-slate-700 text-right leading-relaxed">
                {para}
              </p>
            ))}
            <blockquote className="border-r-4 border-olive-700 pr-4 py-1 my-1">
              <p className="text-sm text-slate-600 italic text-right leading-relaxed">
                "לוחם יוצא דופן בעל אומץ לב ומסירות שאין כדוגמתה. זכרו יהיה תמיד איתנו."
              </p>
              <p className="text-xs text-slate-400 text-right mt-1.5 font-medium">— מפקד הגדוד</p>
            </blockquote>
          </div>
        )}

        {activeTab === 'legacy' && (
          <div className="flex flex-col gap-4">
            <div className="bg-olive-50 border border-olive-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-olive-800 text-right mb-2">פעולת הגבורה</h3>
              <p className="text-sm text-slate-700 text-right leading-relaxed">
                {memorial.descriptionSnippet}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-700 text-right mb-2">יחידה</h3>
              <p className="text-sm text-slate-600 text-right">{memorial.unit}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-700 text-right mb-2">תאריך הנפילה</h3>
              <p className="text-sm text-slate-600 text-right">
                {memorial.hebrewDate} ({memorial.gregorianDate})
              </p>
            </div>
            <div className="bg-olive-50 border border-olive-200 rounded-xl overflow-hidden">
              <div className="px-4 pt-3 pb-2">
                <h3 className="text-sm font-bold text-olive-800 text-right">מפת מבצע</h3>
              </div>
              <div className="h-24 bg-olive-100 relative overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 96" preserveAspectRatio="xMidYMid slice">
                  <rect width="320" height="96" fill="#c8d8b0" />
                  {[0,24,48,72,96].map(y => (
                    <line key={`h${y}`} x1="0" y1={y} x2="320" y2={y} stroke="#4c5a28" strokeWidth="0.4" opacity="0.2"/>
                  ))}
                  {[0,64,128,192,256,320].map(x => (
                    <line key={`v${x}`} x1={x} y1="0" x2={x} y2="96" stroke="#4c5a28" strokeWidth="0.4" opacity="0.2"/>
                  ))}
                  <ellipse cx="160" cy="48" rx="80" ry="30" fill="none" stroke="#4c5a28" strokeWidth="1.2" opacity="0.25"/>
                  <path d="M60 80 Q120 50 160 48 Q200 46 260 20" fill="none" stroke="#4c5a28" strokeWidth="2.5" opacity="0.7"/>
                  <circle cx="160" cy="48" r="6" fill="#E87722" stroke="#4c5a28" strokeWidth="1.5"/>
                  <circle cx="160" cy="48" r="3" fill="white"/>
                </svg>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="grid grid-cols-3 gap-1.5">
            {memorial.gallery?.map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                <img
                  src={src}
                  alt={`${memorial.name} — תמונה ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'memorials' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
              <img
                src={memorial.imageUrl}
                alt={memorial.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 flex flex-col items-end gap-1">
                <p className="text-sm font-bold text-slate-800 text-right">{memorial.location}</p>
                <p className="text-xs text-slate-500 text-right">{memorial.city.split(',')[0]}</p>
                <p className="text-xs text-slate-400 text-right">{memorial.distanceFull}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/memorials/${memorial.id}`)}
              className="w-full py-2.5 border border-slate-300 text-slate-700 text-sm font-medium
                         rounded-xl hover:bg-slate-50 active:scale-95 transition-all duration-150"
            >
              הצג דף אתר מלא
            </button>
          </div>
        )}
      </div>

      {/* ── Report issue ── */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setReportOpen(true)}
          className="w-full py-2.5 flex items-center justify-center gap-1.5
                     text-xs text-slate-400 font-medium
                     hover:text-slate-600 active:scale-95 transition-all duration-150"
        >
          <Flag size={13} strokeWidth={2} />
          דווח על שגיאה
        </button>
      </div>

      <CandleModal
        isOpen={candleOpen}
        onClose={() => setCandleOpen(false)}
        siteName={memorial.name}
      />
      <ReportIssueSheet
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        siteName={memorial.name}
      />
    </div>
  )
}
