import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Landmark, RouteIcon, MapPin, Award, Users } from 'lucide-react'
import { memorialSites } from '../data/mockData'
import SavedItemCard from '../components/profile/SavedItemCard'

const TABS = [
  { id: 'saved',         label: 'מקומות שמורים' },
  { id: 'contributions', label: 'התרומות שלי'   },
]

const STATS = [
  { icon: Landmark,   value: memorialSites.length, label: 'מקומות שמורים' },
  { icon: RouteIcon,  value: 3,                    label: 'מסלולים שמורים' },
  { icon: MapPin,     value: 2,                    label: 'נקודות שהוספתי'  },
  { icon: Award,      value: 1,                    label: 'תגים שהושגו'     },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('saved')

  return (
    <div dir="rtl" className="flex flex-col min-h-full pb-4">

      {/* ── User header ── */}
      <div className="bg-white px-5 pt-5 pb-4 flex items-center gap-4 border-b border-slate-100">
        {/* Name + subtitle — first in DOM → right in RTL */}
        <div className="flex-1 flex flex-col items-end">
          <p className="text-lg font-bold text-slate-800">גל טנה</p>
          <p className="text-sm text-slate-400 mt-0.5">חבר מאז ינואר 2024</p>
          <span className="mt-1.5 inline-block bg-olive-100 text-olive-700
                           text-xs font-semibold px-2.5 py-0.5 rounded-full">
            תורם פעיל
          </span>
        </div>

        {/* Avatar — last in DOM → left in RTL */}
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
      <div className="grid grid-cols-2 gap-3 px-5 pt-4">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div key={label}
               className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-slate-100
                          flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <div className="w-8 h-8 rounded-full bg-olive-50 flex items-center justify-center">
                <Icon size={16} className="text-olive-700" strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-xs text-slate-400 text-right leading-snug">{label}</p>
          </div>
        ))}
      </div>

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
          memorialSites.map(site => (
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

    </div>
  )
}
