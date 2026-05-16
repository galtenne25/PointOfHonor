import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Landmark, RouteIcon, MapPin, Award, Users } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import SavedItemCard from '../components/profile/SavedItemCard'
import StatsSheet from '../components/common/StatsSheet'

const TABS = [
  { id: 'saved',         label: 'מקומות שמורים' },
  { id: 'contributions', label: 'התרומות שלי'   },
]

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 px-5 pt-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-white rounded-2xl px-4 py-3.5 border border-slate-100 animate-pulse">
          <div className="flex items-center gap-2 justify-end">
            <div className="h-7 w-10 bg-slate-200 rounded-full" />
            <div className="w-8 h-8 bg-slate-200 rounded-full" />
          </div>
          <div className="h-3 w-2/3 bg-slate-200 rounded-full mt-2 self-end ml-auto" />
        </div>
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { sites, sitesLoading } = useApp()
  const [activeTab,  setActiveTab ] = useState('saved')
  const [statsSheet, setStatsSheet] = useState(null)

  const STATS = [
    { icon: Landmark,  value: sites.length, label: 'מקומות שמורים',  sheetKey: 'saved'  },
    { icon: RouteIcon, value: 3,            label: 'מסלולים שמורים', sheetKey: 'routes' },
    { icon: MapPin,    value: 2,            label: 'נקודות שהוספתי', sheetKey: 'points' },
    { icon: Award,     value: 1,            label: 'תגים שהושגו',    sheetKey: 'badges' },
  ]

  const sheetConfig = {
    saved: {
      title: 'מקומות שמורים',
      emptyText: 'עדיין לא שמרת מקומות',
      items: sites.map(s => ({
        id:       s.id,
        name:     s.name,
        subtitle: `${s.location} · ${s.city?.split(',')[0]}`,
        imageUrl: s.imageUrl,
      })),
    },
    routes: {
      title: 'מסלולים שמורים',
      emptyText: 'עדיין לא שמרת מסלולים',
      items: [],
    },
    points: {
      title: 'נקודות שהוספתי',
      emptyText: 'עדיין לא הוספת נקודות',
      items: [],
    },
    badges: {
      title: 'תגים שהושגו',
      emptyText: 'עדיין לא הושגו תגים',
      items: [{ id: 'b1', name: 'חבר מייסד', subtitle: 'הצטרפת בינואר 2024' }],
    },
  }

  return (
    <div dir="rtl" className="flex flex-col min-h-full pb-4">

      {/* ── User header ── */}
      <div className="bg-white px-5 pt-5 pb-4 flex items-center gap-4 border-b border-slate-100">
        <div className="flex-1 flex flex-col items-end">
          <p className="text-lg font-bold text-slate-800">גל טנא</p>
          <p className="text-sm text-slate-400 mt-0.5">חבר מאז ינואר 2024</p>
          <span className="mt-1.5 inline-block bg-olive-100 text-olive-700
                           text-xs font-semibold px-2.5 py-0.5 rounded-full">
            תורם פעיל
          </span>
        </div>
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-olive-200 flex-shrink-0">
          <img
            src="https://picsum.photos/seed/useravatar/200/200"
            alt="תמונת פרופיל"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* ── Community feed link ── */}
      <button
        onClick={() => navigate('/community')}
        className="mx-5 mt-4 py-3 bg-olive-50 border border-olive-200 rounded-xl
                   flex items-center justify-center gap-2
                   text-sm font-semibold text-olive-700
                   hover:bg-olive-100 active:scale-95 transition-all duration-150"
      >
        <Users size={16} strokeWidth={2} />
        פעילות הקהילה
      </button>

      {/* ── Stats grid ── */}
      {sitesLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 pt-4">
          {STATS.map(({ icon: Icon, value, label, sheetKey }) => (
            <button
              key={label}
              onClick={() => setStatsSheet(sheetKey)}
              className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-slate-100
                         flex flex-col items-end gap-1 text-right w-full
                         hover:border-olive-200 hover:bg-olive-50 active:scale-95
                         transition-all duration-150"
            >
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <div className="w-8 h-8 rounded-full bg-olive-50 flex items-center justify-center">
                  <Icon size={16} className="text-olive-700" strokeWidth={1.8} />
                </div>
              </div>
              <p className="text-xs text-slate-400 text-right leading-snug">{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Segmented tab control ── */}
      <div className="mx-5 mt-5 flex bg-slate-100 rounded-xl p-1 gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150
              ${activeTab === tab.id
                ? 'bg-white text-olive-700 shadow-sm'
                : 'text-slate-500'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex flex-col gap-3 px-5 mt-4">
        {activeTab === 'saved' && (
          sitesLoading
            ? [1,2,3].map(i => (
                <div key={i} className="flex gap-3 bg-white p-3 rounded-2xl border border-slate-100 animate-pulse">
                  <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2 justify-center">
                    <div className="w-3/4 h-4 bg-slate-200 rounded-full" />
                    <div className="w-1/2 h-3 bg-slate-200 rounded-full" />
                  </div>
                </div>
              ))
            : sites.map(site => (
                <SavedItemCard
                  key={site.id}
                  site={site}
                  onClick={() => navigate(`/memorials/${site.id}`)}
                />
              ))
        )}

        {activeTab === 'contributions' && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <MapPin size={24} strokeWidth={1.5} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">עדיין לא הוספת נקודות</p>
            <p className="text-xs text-slate-400 text-center leading-relaxed px-8">
              הוסף אנדרטאות ואתרי הנצחה כדי שיופיעו כאן
            </p>
          </div>
        )}
      </div>

      <StatsSheet
        isOpen={!!statsSheet}
        onClose={() => setStatsSheet(null)}
        title={statsSheet ? sheetConfig[statsSheet].title : ''}
        items={statsSheet ? sheetConfig[statsSheet].items : []}
        emptyText={statsSheet ? sheetConfig[statsSheet].emptyText : ''}
      />

    </div>
  )
}
